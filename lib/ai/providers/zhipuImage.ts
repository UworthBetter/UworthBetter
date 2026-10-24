/**
 * 智谱图像生成（/images/generations）。
 * ⚠️ 2026-10-24 探测时该 Key 的图像额度为 0（错误码 1113 余额不足），以下实现按 OpenAI 兼容格式编写，
 *    充值后由 A2 验证；是否支持参考图未确认，当前忽略 refs（角色一致性依赖 prompt 中的外貌锚点）。
 *    如需强一致性，A2 可新增其他供应商（Seedream / Nano Banana 等）并在 image.ts 注册。
 */
import { env } from "@/lib/env";
import { AIError } from "@/lib/contracts/aiTasks";
import type { ImageMime } from "@/lib/contracts/aiTasks";
import { ASPECT_SIZE, type ImageProvider } from "./image";

export function createZhipuImageProvider(): ImageProvider {
  const key = env.IMAGE_API_KEY || env.OPENAI_COMPAT_API_KEY;
  if (!key) throw new Error("缺少 IMAGE_API_KEY");

  return {
    supportsRefs: false,
    async generate({ prompt, refs, aspect, label }) {
      if (refs.length) console.warn(`[ai:image] ${label}: zhipu provider 暂不支持参考图，已忽略 ${refs.length} 张`);
      const { w, h } = ASPECT_SIZE[aspect];
      const t0 = Date.now();
      const res = await fetch(`${env.IMAGE_BASE_URL}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.IMAGE_MODEL, prompt, size: `${w}x${h}` }),
        signal: AbortSignal.timeout(90_000),
      });
      const body = (await res.json()) as { data?: { url?: string }[]; error?: { message?: string } };
      if (!res.ok || !body.data?.[0]?.url) {
        throw new AIError(`图像生成失败: ${res.status} ${body.error?.message ?? ""}`, label);
      }
      const img = await fetch(body.data[0].url);
      const buffer = Buffer.from(await img.arrayBuffer());
      const mime = (img.headers.get("content-type") ?? "image/png") as ImageMime;
      console.log(`[ai:image] ${label} ${Date.now() - t0}ms`);
      return { buffer, mime };
    },
  };
}
