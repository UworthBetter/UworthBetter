/**
 * 图像类任务：AI_IMAGE_PROVIDER=zhipu|openai 且配置了 Key 时走真实模型（超时 → 重试 1 次 → 回退 mock 占位图），
 * 否则直接用 mock。与文本 provider 相互独立。
 */
import { env } from "@/lib/env";
import type { AITasks, ImageResult } from "@/lib/contracts/aiTasks";
import type { ImageGenerateOptions, ImageProvider } from "../providers/image";
import { createMockImageProvider } from "../providers/mockImage";
import { characterSheetPrompt } from "../prompts/images";
import { withFallback, withRetry } from "../resilient";
import { STYLES } from "../styles";
import type { StyleId } from "@/lib/contracts/ai";

/** 真实图像模型是否可用（调用时读取 env，便于测试切换）。 */
export function imageReady(): boolean {
  if (env.AI_IMAGE_PROVIDER === "openai") return !!env.IMAGE_API_KEY;
  if (env.AI_IMAGE_PROVIDER === "zhipu") return !!(env.IMAGE_API_KEY || env.OPENAI_COMPAT_API_KEY);
  return false;
}

async function realProvider(): Promise<ImageProvider> {
  if (env.AI_IMAGE_PROVIDER === "zhipu") return (await import("../providers/zhipuImage")).createZhipuImageProvider();
  return (await import("../providers/openaiImage")).createOpenAIImageProvider();
}

const withStyle = (prompt: string, style: StyleId) => {
  const suffix = STYLES[style].styleSuffix;
  return prompt.includes(suffix) ? prompt : `${prompt}. ${suffix}`;
};

async function generate(opts: ImageGenerateOptions): Promise<ImageResult> {
  const real = imageReady()
    ? () =>
        withRetry(`image:${opts.label}`, env.AI_IMAGE_TIMEOUT_MS, async (signal) => {
          const result = await (await realProvider()).generate({ ...opts, signal });
          if (!result.buffer.length) throw new Error("图像为空");
          return result;
        })
    : null;
  return withFallback(`image:${opts.label}`, real, () => createMockImageProvider().generate(opts));
}

export const imageTasks: Pick<AITasks, "genCharacterSheet" | "genSceneImage"> = {
  async genCharacterSheet({ which, style, futureSelf, bible, selfie }) {
    return generate({
      prompt: withStyle(characterSheetPrompt(which, futureSelf, bible), style),
      refs: selfie ? [selfie] : [],
      aspect: "landscape",
      label: `sheet_${which}`,
    });
  },

  async genSceneImage({ prompt, style, refs, aspect }) {
    return generate({ prompt: withStyle(prompt, style), refs, aspect, label: "scene" });
  },
};
