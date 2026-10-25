/**
 * AI 任务唯一出口。lib/server 只允许从这里导入 AI 能力（ESLint 已限制）。
 *
 *   AI_TEXT_PROVIDER=mock | openai-compat   → 文本任务（openai-compat 还需 OPENAI_COMPAT_API_KEY）
 *   AI_IMAGE_PROVIDER=mock | zhipu | openai → 图像任务（相互独立，可以"真文本 + 假图"联调）
 *   AI_SUGGEST_PROVIDER=real | mock | auto  → 目标推荐单独通道（只影响 suggestGoals 一个方法）：
 *     real=全局 mock 时也走真实模型；mock=强制模板；auto=跟随 AI_TEXT_PROVIDER
 *
 * 每次真实调用：单次超时（AI_FAST_TIMEOUT_MS / AI_TEXT_TIMEOUT_MS / AI_STREAM_TIMEOUT_MS / AI_IMAGE_TIMEOUT_MS）→ 失败重试 1 次
 * → 仍失败或缺 Key 时回退 mock，保证任何流程都不会因为模型故障而中断。
 * 是否走真实模型在每次调用时按 env 判断；返回的对象是缓存的同一个实例（测试可以 spyOn 其方法）。
 */
import { env } from "@/lib/env";
import type { AITasks, OnDelta } from "@/lib/contracts/aiTasks";
import { guardDelta, withFallback, withRetry } from "../resilient";
import { imageTasks } from "./image";
import { mockTextTasks, type TextTasks } from "./textMock";
import { realText } from "./textReal";

/** 文本真实模型是否可用。 */
export function textReady(): boolean {
  return env.AI_TEXT_PROVIDER === "openai-compat" && !!env.OPENAI_COMPAT_API_KEY;
}

function suggestReady(): boolean {
  if (env.AI_SUGGEST_PROVIDER === "mock") return false;
  if (env.AI_SUGGEST_PROVIDER === "real") return !!env.OPENAI_COMPAT_API_KEY;
  return textReady();
}

/** 结构化 / 看图调用。interactive=同步 HTTP 接口里等待的调用，用更短的 AI_FAST_TIMEOUT_MS。 */
function call<T>(
  label: string,
  ready: boolean,
  real: (signal: AbortSignal) => Promise<T>,
  mock: () => Promise<T>,
  interactive = false,
): Promise<T> {
  const timeout = interactive ? env.AI_FAST_TIMEOUT_MS : env.AI_TEXT_TIMEOUT_MS;
  return withFallback(label, ready ? () => withRetry(label, timeout, real) : null, mock);
}

/**
 * 流式调用：超时按 AI_STREAM_TIMEOUT_MS。重试或回退时前端可能已经显示了半截文字，
 * 不过管线随后会用 step done 携带的完整文本覆盖它（见 hooks/useJob.ts）。
 */
function streamCall(
  label: string,
  onDelta: OnDelta,
  real: (onDelta: OnDelta, signal: AbortSignal) => Promise<string>,
  mock: (onDelta: OnDelta) => Promise<string>,
): Promise<string> {
  return withFallback(
    label,
    textReady() ? () => withRetry(label, env.AI_STREAM_TIMEOUT_MS, (signal) => real(guardDelta(onDelta, signal), signal)) : null,
    () => mock(onDelta),
  );
}

const textTasks: TextTasks = {
  genProfileAndBible: (input) =>
    call("genProfileAndBible", textReady(), (s) => realText.genProfileAndBible(input, s), () => mockTextTasks.genProfileAndBible(input)),
  suggestGoals: (args) =>
    call("suggestGoals", suggestReady(), (s) => realText.suggestGoals(args, s), () => mockTextTasks.suggestGoals!(args), true),
  genRoadmap: (args) => call("genRoadmap", textReady(), (s) => realText.genRoadmap(args, s), () => mockTextTasks.genRoadmap(args)),
  streamFirstLetter: (args, onDelta) =>
    streamCall("streamFirstLetter", onDelta, (d, s) => realText.streamFirstLetter(args, d, s), (d) => mockTextTasks.streamFirstLetter(args, d)),
  genInterviewQuestions: (ctx) =>
    call("genInterviewQuestions", textReady(), (s) => realText.genInterviewQuestions(ctx, s), () => mockTextTasks.genInterviewQuestions(ctx), true),
  genChapterPlan: (ctx) =>
    call("genChapterPlan", textReady(), (s) => realText.genChapterPlan(ctx, s), () => mockTextTasks.genChapterPlan(ctx)),
  streamChapterBody: (ctx, plan, onDelta) =>
    streamCall("streamChapterBody", onDelta, (d, s) => realText.streamChapterBody(ctx, plan, d, s), (d) => mockTextTasks.streamChapterBody(ctx, plan, d)),
  streamChapterLetter: (ctx, plan, onDelta) =>
    streamCall("streamChapterLetter", onDelta, (d, s) => realText.streamChapterLetter(ctx, plan, d, s), (d) => mockTextTasks.streamChapterLetter(ctx, plan, d)),
  captionPhoto: (photo) =>
    call("captionPhoto", textReady(), (s) => realText.captionPhoto(photo, s), () => mockTextTasks.captionPhoto(photo), true),
  // 危机检测保持确定性的关键词快筛（不依赖网络，零延迟）。
  checkSafety: (text) => mockTextTasks.checkSafety(text),
};

let cached: AITasks | undefined;

export function getAITasks(): AITasks {
  cached ??= { ...textTasks, ...imageTasks };
  return cached;
}

export type { AITasks } from "@/lib/contracts/aiTasks";
export { CRISIS_MESSAGE, HOTLINES } from "../safety";
/** 图像 prompt 构建器：服务端编排层用它们拼封面 / 分镜 prompt（风格后缀由 genSceneImage 统一追加）。 */
export { coverPrompt, firstCoverPrompt, panelPrompt } from "../prompts/images";
