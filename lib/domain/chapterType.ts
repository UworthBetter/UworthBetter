import type { ChapterType } from "@/lib/contracts/ai";

export const HIGHLIGHT_THRESHOLD = 0.8;
export const STRUGGLE_THRESHOLD = 0.4;

/**
 * 根据本章完成度与之前各章类型决定章节类型（DESIGN.md 4.3）。
 * 连续两周完成度 < 40% → 休整章。
 */
export function decideChapterType(rate: number, prevTypes: readonly ChapterType[]): ChapterType {
  const last = prevTypes.at(-1);
  if (rate < STRUGGLE_THRESHOLD && last === "low") return "rest";
  if (rate >= HIGHLIGHT_THRESHOLD) return "highlight";
  if (rate >= STRUGGLE_THRESHOLD) return "struggle";
  return "low";
}
