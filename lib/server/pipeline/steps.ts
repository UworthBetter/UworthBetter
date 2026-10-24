import type { JobContext } from "@/lib/server/jobs";
import type { ChapterStep, OnboardingStep } from "@/lib/contracts/events";
import type { ImageResult } from "@/lib/contracts/aiTasks";
import { saveImage } from "@/lib/server/storage";

export async function imageStep(ctx: JobContext, step: ChapterStep | OnboardingStep, generate: () => Promise<ImageResult>) {
  ctx.emit({ type: "step", step, status: "running" });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = await saveImage(await generate());
      ctx.emit({ type: "step", step, status: "done", data: { url } });
      return url;
    } catch (error) {
      if (attempt === 2) console.error("图片生成失败", step, error);
    }
  }
  ctx.emit({ type: "step", step, status: "error", data: { url: null } });
  return null;
}
