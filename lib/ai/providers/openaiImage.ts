/**
 * OpenAI 兼容图像生成（/images/generations），适配 sidrune.ai 中转站。
 * 已验证（2026-10-24）：gpt-image-2 接受 {model, prompt, size, n}，返回 data[0].b64_json（PNG）。
 * gpt-image 系不支持自定义 768/1344 尺寸，aspect 映射到 1024 / 1536 档；
 * 兼容返回 url 的中转站（dall-e 系格式），下载后转 buffer。
 * /images/generations 不接受参考图：supportsRefs=false，refs 被忽略（角色一致性靠 prompt 外貌锚点）。
 */
import { env } from "@/lib/env";
import { AIError } from "@/lib/contracts/aiTasks";
import type { ImageAspect, ImageMime } from "@/lib/contracts/aiTasks";
import type { ImageProvider } from "./image";

/** gpt-image 系支持的尺寸档（与 ASPECT_SIZE 的 768/1344 档不同，故单独映射）。 */
const OPENAI_SIZES: Record<ImageAspect, string> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

/** 从字节头嗅探 MIME（b64 返回没有 content-type 可读）。 */
function sniffMime(buf: Buffer): ImageMime {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "image/png";
}

export function createOpenAIImageProvider(): ImageProvider {
  if (!env.IMAGE_API_KEY) throw new Error("缺少 IMAGE_API_KEY（见 .env.example）");

  return {
    supportsRefs: false,
    async generate({ prompt, refs, aspect, label, signal }) {
      if (refs.length) console.warn(`[ai:image] ${label}: openai provider 暂不支持参考图，已忽略 ${refs.length} 张`);
      const t0 = Date.now();
      const res = await fetch(`${env.IMAGE_BASE_URL}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.IMAGE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.IMAGE_MODEL, prompt, size: OPENAI_SIZES[aspect], n: 1 }),
        signal: signal ?? AbortSignal.timeout(env.AI_IMAGE_TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as {
        data?: { b64_json?: string; url?: string }[];
        error?: { message?: string };
      } | null;
      const item = body?.data?.[0];
      if (!res.ok || (!item?.b64_json && !item?.url)) {
        throw new AIError(`图像生成失败: ${res.status} ${body?.error?.message ?? ""}`, label);
      }
      let buffer: Buffer;
      let mime: ImageMime;
      if (item.b64_json) {
        buffer = Buffer.from(item.b64_json, "base64");
        mime = sniffMime(buffer);
      } else {
        const img = await fetch(item.url!, { signal });
        if (!img.ok) throw new AIError(`图像下载失败: ${img.status}`, label);
        buffer = Buffer.from(await img.arrayBuffer());
        mime = (img.headers.get("content-type") ?? sniffMime(buffer)) as ImageMime;
      }
      console.log(`[ai:image] ${label} ${Date.now() - t0}ms ${Math.round(buffer.length / 1024)}KB`);
      return { buffer, mime };
    },
  };
}
