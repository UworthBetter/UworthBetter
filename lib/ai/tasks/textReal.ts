/**
 * 文本类任务的真实实现（OpenAI 兼容接口，默认智谱 GLM）。
 * 每个方法多接收一个 signal，由 lib/ai/tasks/index.ts 的护栏层（超时 → 重试 1 次 → 回退 mock）传入；
 * 这里只负责"一次尝试"：拼 prompt、调模型、宽容预处理 + 契约校验。
 */
import { z } from "zod";
import type { ChapterContext, ChapterPlan, FutureSelfProfile, GoalSuggestion, OnboardingInput, SeasonRoadmap, StoryBible, TimeBudget } from "@/lib/contracts/ai";
import { GoalSuggestion as GoalSuggestionSchema } from "@/lib/contracts/ai";
import type { ImageRef, OnDelta } from "@/lib/contracts/aiTasks";
import { createOpenAICompatProvider } from "../providers/openaiCompat";
import type { TextProvider } from "../providers/text";
import { toModelImageUrl } from "../imageInput";
import { ProfileAndBibleOut, RoadmapOut, InterviewOut, camelize, chapterPlanOut, ensurePanelMarkers } from "../normalize";
import {
  firstLetterSystem,
  firstLetterUser,
  profileSystem,
  profileUser,
  roadmapSystem,
  roadmapUser,
  suggestSystem,
  suggestUser,
} from "../prompts/onboarding";
import {
  CAPTION_PROMPT,
  SELFIE_PROMPT,
  bodySystem,
  bodyUser,
  chapterLetterSystem,
  chapterLetterUser,
  interviewSystem,
  interviewUser,
  planSystem,
  planUser,
} from "../prompts/chapter";

/** 每次尝试新建 client：读取的是调用时刻的 env，构造成本可以忽略。 */
const provider = (): TextProvider => createOpenAICompatProvider();

const SuggestOut = z.preprocess((raw) => {
  const r = camelize(raw) as { suggestions?: unknown };
  const list = Array.isArray(r?.suggestions) ? r.suggestions.slice(0, 4) : r?.suggestions;
  return {
    suggestions: Array.isArray(list)
      ? list.map((s: { goal?: unknown; tagline?: unknown }) => ({
          goal: typeof s?.goal === "string" ? s.goal.trim().slice(0, 500) : s?.goal,
          tagline: typeof s?.tagline === "string" ? s.tagline.trim().slice(0, 20) : s?.tagline,
        }))
      : list,
  };
}, z.object({ suggestions: z.array(GoalSuggestionSchema).min(3).max(4) }));

/** 自拍 → 外貌描述（尽力而为：失败只影响外貌细节，不影响建档）。 */
async function describeSelfie(tp: TextProvider, url: string, signal: AbortSignal): Promise<string | undefined> {
  try {
    const desc = await tp.vision({ label: "describeSelfie", imageUrl: await toModelImageUrl(url), prompt: SELFIE_PROMPT, signal });
    return desc.slice(0, 120) || undefined;
  } catch (e) {
    if (signal.aborted) throw e;
    console.warn("[ai] describeSelfie 失败，按无自拍处理：", e instanceof Error ? e.message : e);
    return undefined;
  }
}

export const realText = {
  async suggestGoals(args: { seed: string; timeBudget?: TimeBudget }, signal: AbortSignal): Promise<GoalSuggestion[]> {
    const { suggestions } = await provider().json({
      schema: SuggestOut,
      label: "suggestGoals",
      tier: "fast",
      temperature: 0.9,
      system: suggestSystem(),
      messages: [{ role: "user", content: suggestUser(args.seed, args.timeBudget) }],
      signal,
    });
    return suggestions;
  },

  async genProfileAndBible(input: OnboardingInput, signal: AbortSignal): Promise<{ futureSelf: FutureSelfProfile; bible: StoryBible }> {
    const tp = provider();
    const selfie = input.selfieUrl ? await describeSelfie(tp, input.selfieUrl, signal) : undefined;
    const out = await tp.json({
      schema: ProfileAndBibleOut,
      label: "genProfileAndBible",
      tier: "smart",
      temperature: 0.9,
      system: profileSystem(),
      messages: [{ role: "user", content: profileUser(input, selfie) }],
      signal,
    });
    // 称呼以用户输入为准；导师就是未来的你，名字必须一致。
    const name = input.futureName.trim() || out.futureSelf.name;
    return {
      futureSelf: { ...out.futureSelf, name },
      bible: { ...out.bible, mentor: { ...out.bible.mentor, name } },
    };
  },

  async genRoadmap(args: { input: OnboardingInput; futureSelf: FutureSelfProfile; bible: StoryBible }, signal: AbortSignal): Promise<SeasonRoadmap> {
    return provider().json({
      schema: RoadmapOut,
      label: "genRoadmap",
      tier: "smart",
      temperature: 0.7,
      system: roadmapSystem(args.input.questCount),
      messages: [{ role: "user", content: roadmapUser(args) }],
      signal,
    });
  },

  async streamFirstLetter(args: { input: OnboardingInput; futureSelf: FutureSelfProfile; bible: StoryBible }, onDelta: OnDelta, signal: AbortSignal): Promise<string> {
    const text = await provider().stream({
      label: "streamFirstLetter",
      tier: "smart",
      system: firstLetterSystem(args.futureSelf),
      messages: [{ role: "user", content: firstLetterUser(args) }],
      onDelta,
      signal,
    });
    return nonEmpty(text, "streamFirstLetter");
  },

  async genInterviewQuestions(ctx: Omit<ChapterContext, "interview">, signal: AbortSignal): Promise<string[]> {
    const { questions } = await provider().json({
      schema: InterviewOut,
      label: "genInterviewQuestions",
      tier: "fast",
      temperature: 0.8,
      system: interviewSystem(ctx),
      messages: [{ role: "user", content: interviewUser(ctx) }],
      signal,
    });
    return questions;
  },

  async genChapterPlan(ctx: ChapterContext, signal: AbortSignal): Promise<ChapterPlan> {
    return provider().json({
      schema: chapterPlanOut(ctx),
      label: "genChapterPlan",
      tier: "smart",
      temperature: 0.8,
      system: planSystem(ctx),
      messages: [{ role: "user", content: planUser(ctx) }],
      signal,
    });
  },

  async streamChapterBody(ctx: ChapterContext, plan: ChapterPlan, onDelta: OnDelta, signal: AbortSignal): Promise<string> {
    const text = await provider().stream({
      label: "streamChapterBody",
      tier: "smart",
      system: bodySystem(ctx, plan),
      messages: [{ role: "user", content: bodyUser(ctx, plan) }],
      onDelta,
      signal,
    });
    // 返回值会以 step done 的 bodyMd 覆盖前端已流式显示的内容，所以可以在这里补齐分镜标记。
    return ensurePanelMarkers(nonEmpty(text, "streamChapterBody"));
  },

  async streamChapterLetter(ctx: ChapterContext, plan: ChapterPlan, onDelta: OnDelta, signal: AbortSignal): Promise<string> {
    const text = await provider().stream({
      label: "streamChapterLetter",
      tier: "smart",
      system: chapterLetterSystem(ctx),
      messages: [{ role: "user", content: chapterLetterUser(ctx, plan) }],
      onDelta,
      signal,
    });
    return nonEmpty(text, "streamChapterLetter");
  },

  async captionPhoto(photo: ImageRef, signal: AbortSignal): Promise<string> {
    const caption = await provider().vision({ label: "captionPhoto", imageUrl: await toModelImageUrl(photo.url), prompt: CAPTION_PROMPT, signal });
    return nonEmpty(caption.replace(/\s+/g, " "), "captionPhoto").slice(0, 60);
  },
};

/** 空输出视为失败，交给护栏层重试 / 回退。 */
function nonEmpty(text: string, label: string): string {
  const t = text.trim();
  if (!t) throw new Error(`${label} 返回空内容`);
  return t;
}
