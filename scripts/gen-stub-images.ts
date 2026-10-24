/**
 * 生成 public/stub/ 下的占位图（桩接口使用）。pnpm tsx scripts/gen-stub-images.ts
 */
import "./_env";
import fs from "node:fs";
import path from "node:path";

async function main() {
  process.env.MOCK_LATENCY_MS = "0";
  const { createMockImageProvider } = await import("@/lib/ai/providers/mockImage");
  const p = createMockImageProvider();
  const dir = path.join(process.cwd(), "public", "stub");
  fs.mkdirSync(dir, { recursive: true });

  const jobs: [string, string, "square" | "portrait" | "landscape"][] = [
    ["sheet-future", "future self character sheet", "landscape"],
    ["sheet-present", "present protagonist character sheet", "landscape"],
    ...Array.from({ length: 13 }, (_, i) => [`cover-${i + 1}`, `chapter ${i + 1} cover`, "portrait"] as [string, string, "portrait"]),
    ...Array.from({ length: 4 }, (_, i) => [`panel-${i}`, `panel ${i}`, "square"] as [string, string, "square"]),
  ];
  for (const [name, prompt, aspect] of jobs) {
    const img = await p.generate({ prompt, refs: [], aspect, label: name });
    const out = await (await import("sharp")).default(img.buffer).resize({ width: 512 }).png().toBuffer();
    fs.writeFileSync(path.join(dir, `${name}.png`), out);
  }
  console.log(`✔ ${jobs.length} stub images → public/stub/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
