import type { PitchData } from "@/components/pitch/model/types";

// 路演页加载时预取全部图片：之后现场断网，除现场演示外的场景仍能完整显示。
export function imageUrlsOf(data: PitchData): string[] {
  const all = [
    data.sheets.present,
    data.sheets.future,
    ...data.chapters.flatMap((c) => [c.coverUrl, c.panelUrl]),
    ...data.snapshots.map((s) => s.imageUrl),
    ...data.branches.map((b) => b.imageUrl),
  ];
  return [...new Set(all.filter((u): u is string => !!u))];
}
