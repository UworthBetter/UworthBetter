/**
 * AI 任务唯一出口。lib/server 只允许从这里导入 AI 能力（ESLint 已限制）。
 *
 *   AI_TEXT_PROVIDER=mock | openai-compat   → 文本任务
 *   AI_IMAGE_PROVIDER=mock | zhipu          → 图像任务（相互独立，可以"真文本 + 假图"联调）
 *   AI_SUGGEST_PROVIDER=real | mock | auto  → 目标推荐单独通道（只影响 suggestGoals 一个方法）：
 *     real=强制真实实现（全局 mock 时也可用）；mock=强制 mock；auto=跟随 AI_TEXT_PROVIDER
 */
import { env } from "@/lib/env";
import type { AITasks } from "@/lib/contracts/aiTasks";
import { imageTasks } from "./image";
import { mockTextTasks } from "./textMock";
import { realTextTasks, realSuggestGoals } from "./textReal";

let cached: AITasks | undefined;

export function getAITasks(): AITasks {
  if (!cached) {
    const text = env.AI_TEXT_PROVIDER === "mock" ? mockTextTasks : realTextTasks;
    let tasks: AITasks = { ...text, ...imageTasks };
    // suggestGoals 走独立通道：real 强制真实实现（realSuggestGoals 直接引用 openaiCompat
    // 工厂，绕开 getTextProvider 的全局 mock 守卫）；显式 mock 时钉住 mock 实现，
    // 避免真实文本集里携带的 realSuggestGoals 泄入；auto 跟随 AI_TEXT_PROVIDER。
    if (
      env.AI_SUGGEST_PROVIDER === "real" ||
      (env.AI_SUGGEST_PROVIDER === "auto" && env.AI_TEXT_PROVIDER === "openai-compat")
    ) {
      tasks = { ...tasks, suggestGoals: realSuggestGoals };
    } else if (env.AI_SUGGEST_PROVIDER === "mock") {
      tasks = { ...tasks, suggestGoals: mockTextTasks.suggestGoals };
    }
    cached = tasks;
  }
  return cached;
}

export type { AITasks } from "@/lib/contracts/aiTasks";
export { CRISIS_MESSAGE, HOTLINES } from "../safety";
