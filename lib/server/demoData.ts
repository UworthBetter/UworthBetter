/**
 * 预生成的演示季数据（seed/demo-season.json）加载器。
 * 由 scripts/gen-demo-season.ts 离线生成：真实文本（glm-5.3-flash）+ 真实图像固化而来。
 * 文件缺失或不满 13 章时返回 null，Demo 流程回退到旧 fixture 路径（开发/测试环境可用）。
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ChapterPlan, ChapterType, Quest } from "@/lib/contracts/ai";

export const DemoChapterData = z.object({
  no: z.number().int().min(1).max(13),
  chapterType: ChapterType,
  completionRate: z.number().min(0).max(1), // 该周预设完成度（与 chapterType 匹配）
  title: z.string(),
  questions: z.array(z.string()).length(3), // 周末采访 3 问（跳章/开局时预填）
  answers: z.array(z.string()).length(3), // 林夏的预设回答（供正文引用原话）
  quests: z.array(Quest), // 本章任务（已按上一周完成度适配）
  logs: z.array(z.object({ day: z.number().int().min(0).max(90), note: z.string(), mood: z.number().int().min(1).max(5) })),
  plan: ChapterPlan,
  bodyMd: z.string(),
  letterMd: z.string(),
  cover: z.string().nullable(),
  panels: z.array(z.string().nullable()).length(4),
  nextCover: z.string().nullable(), // 第 13 章为 null
});
export type DemoChapterData = z.infer<typeof DemoChapterData>;

export const DemoSeasonData = z.object({
  seasonTitle: z.string(),
  logline: z.string(),
  sheets: z.object({ future: z.string().nullable(), present: z.string().nullable() }),
  chapters: z.array(DemoChapterData).length(13),
});
export type DemoSeasonData = z.infer<typeof DemoSeasonData>;

let cached: DemoSeasonData | null | undefined;

/** 加载预生成演示季；不存在或未满 13 章返回 null（调用方需回退到 fixture 路径）。 */
export function demoSeason(): DemoSeasonData | null {
  if (cached !== undefined) return cached;
  try {
    const raw = JSON.parse(fs.readFileSync(path.resolve("seed/demo-season.json"), "utf8"));
    cached = DemoSeasonData.parse(raw);
  } catch {
    cached = null;
  }
  return cached;
}

export function demoChapter(no: number): DemoChapterData | undefined {
  return demoSeason()?.chapters.find((c) => c.no === no);
}
