/**
 * 图像模型 Provider 接口。
 */
import { env } from "@/lib/env";
import type { ImageAspect, ImageRef, ImageResult } from "@/lib/contracts/aiTasks";

export interface ImageGenerateOptions {
  prompt: string; // 已包含风格后缀的完整 prompt
  refs: ImageRef[]; // 参考图（不支持参考图的 provider 会忽略并打印警告）
  aspect: ImageAspect;
  label: string;
}

export interface ImageProvider {
  readonly supportsRefs: boolean;
  generate(opts: ImageGenerateOptions): Promise<ImageResult>;
}

export const ASPECT_SIZE: Record<ImageAspect, { w: number; h: number }> = {
  square: { w: 1024, h: 1024 },
  portrait: { w: 768, h: 1344 },
  landscape: { w: 1344, h: 768 },
};

let cached: ImageProvider | undefined;

export async function getImageProvider(): Promise<ImageProvider> {
  if (cached) return cached;
  if (env.AI_IMAGE_PROVIDER === "zhipu") {
    const { createZhipuImageProvider } = await import("./zhipuImage");
    cached = createZhipuImageProvider();
  } else if (env.AI_IMAGE_PROVIDER === "openai") {
    // OpenAI 兼容中转站（如 sidrune.ai）：/images/generations，返回 b64_json 或 url
    const { createOpenAIImageProvider } = await import("./openaiImage");
    cached = createOpenAIImageProvider();
  } else {
    const { createMockImageProvider } = await import("./mockImage");
    cached = createMockImageProvider();
  }
  return cached;
}
