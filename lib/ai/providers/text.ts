/**
 * 文本模型 Provider 接口。lib/ai 内部使用，lib/server 不得直接导入（只能用 lib/ai/tasks）。
 */
import type { z } from "zod";
import { env } from "@/lib/env";

export type TextTier = "smart" | "fast";

export type TextMessage =
  | { role: "system" | "assistant"; content: string }
  | { role: "user"; content: string; images?: string[] }; // images: 公网 URL 或 data:image/...;base64

export interface JsonCallOptions<T> {
  schema: z.ZodType<T>;
  system: string;
  messages: TextMessage[];
  tier?: TextTier;
  temperature?: number;
  /** 日志标签，例如 "genChapterPlan" */
  label: string;
}

export interface StreamCallOptions {
  system: string;
  messages: TextMessage[];
  tier?: TextTier;
  temperature?: number;
  label: string;
  onDelta: (text: string) => void;
}

export interface TextProvider {
  /** 结构化输出：强制 JSON → zod 校验 → 失败时把错误回传模型修复 1 次。 */
  json<T>(opts: JsonCallOptions<T>): Promise<T>;
  /** 流式文本，返回完整文本。 */
  stream(opts: StreamCallOptions): Promise<string>;
  /** 视觉模型：图片 → 文本。 */
  vision(opts: { prompt: string; imageUrl: string; label: string }): Promise<string>;
}

let cached: TextProvider | undefined;

export async function getTextProvider(): Promise<TextProvider> {
  if (cached) return cached;
  if (env.AI_TEXT_PROVIDER === "openai-compat") {
    const { createOpenAICompatProvider } = await import("./openaiCompat");
    cached = createOpenAICompatProvider();
  } else {
    throw new Error("AI_TEXT_PROVIDER=mock 时不应调用 TextProvider（mock 模式由 lib/ai/tasks/mock.ts 处理）");
  }
  return cached;
}
