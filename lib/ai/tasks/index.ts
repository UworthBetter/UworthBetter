/**
 * AI 任务唯一出口。lib/server 只允许从这里导入 AI 能力（ESLint 已限制）。
 *
 *   AI_TEXT_PROVIDER=mock | openai-compat   → 文本任务
 *   AI_IMAGE_PROVIDER=mock | zhipu          → 图像任务（相互独立，可以"真文本 + 假图"联调）
 */
import { env } from "@/lib/env";
import type { AITasks } from "@/lib/contracts/aiTasks";
import { imageTasks } from "./image";
import { mockTextTasks } from "./textMock";
import { realTextTasks } from "./textReal";

let cached: AITasks | undefined;

export function getAITasks(): AITasks {
  if (!cached) {
    const text = env.AI_TEXT_PROVIDER === "mock" ? mockTextTasks : realTextTasks;
    cached = { ...text, ...imageTasks };
  }
  return cached;
}

export type { AITasks } from "@/lib/contracts/aiTasks";
export { CRISIS_MESSAGE, HOTLINES } from "../safety";
