/**
 * 图像 provider 连通性检查：pnpm ping:image
 * 使用 .env.local 中的 AI_IMAGE_PROVIDER / IMAGE_* 配置，真实生成一张图并输出到 public/generated/test/。
 */
import "./_env";
import { mkdirSync, writeFileSync } from "node:fs";

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

async function main() {
  if (!process.env.AI_IMAGE_PROVIDER) process.env.AI_IMAGE_PROVIDER = "openai";
  // 动态 import 保证 _env.ts 先把 .env.local 加载进 process.env
  const { env } = await import("@/lib/env");
  const { getImageProvider } = await import("@/lib/ai/providers/image");
  const provider = await getImageProvider();
  console.log(`provider=${env.AI_IMAGE_PROVIDER} model=${env.IMAGE_MODEL} supportsRefs=${provider.supportsRefs}`);

  const { buffer, mime } = await provider.generate({
    prompt: "a small red apple on a wooden table, soft morning light, storybook style, no text",
    refs: [],
    aspect: "square",
    label: "ping.image",
  });
  mkdirSync("public/generated/test", { recursive: true });
  const path = `public/generated/test/ping-image.${EXT[mime] ?? "png"}`;
  writeFileSync(path, buffer);
  console.log(`✔ ${mime} ${Math.round(buffer.length / 1024)}KB → ${path}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
