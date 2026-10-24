/**
 * 文本 provider 连通性检查：pnpm ping:text
 * 使用 .env.local 中的 OPENAI_COMPAT_* 配置，真实调用一次 JSON 输出与一次流式输出。
 */
import "./_env";
import { z } from "zod";

async function main() {
  process.env.AI_TEXT_PROVIDER = "openai-compat";
  const { createOpenAICompatProvider } = await import("@/lib/ai/providers/openaiCompat");
  const tp = createOpenAICompatProvider();

  const r = await tp.json({
    label: "ping.json",
    tier: "fast",
    schema: z.object({ name: z.string(), motto: z.string() }),
    system: "只输出 JSON。",
    messages: [{ role: "user", content: '输出 {"name": string, "motto": string}，主题：未来的插画师' }],
  });
  console.log("json ✔", r);

  process.stdout.write("stream ✔ ");
  await tp.stream({
    label: "ping.stream",
    tier: "fast",
    system: "你是一个温柔的作家。",
    messages: [{ role: "user", content: "用两句话描写清晨的海边小镇。" }],
    onDelta: (t) => process.stdout.write(t),
  });
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
