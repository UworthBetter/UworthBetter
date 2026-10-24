// 路演页的数据形状（唯一来源）。占位数据与真实 seed 都先转换成 PitchData。
// 字段约定见 docs/todo/2026-10-25-portrait-evolution-and-reroute.md §0.1、§0.2、E7、E8。

export const DIRECTIONS = ["ahead", "on_track", "drift", "pivot"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type ChapterKind = "highlight" | "struggle" | "low" | "rest";

export type PitchChapter = {
  no: number;
  title: string;
  chapterType: ChapterKind;
  coverUrl: string | null;
  panelUrl: string | null;
  letterQuote: string;
  logQuotes: string[];
};

export type PitchSnapshot = {
  chapterNo: number;
  imageUrl: string | null;
  headline: string;
  direction: Direction;
  evidence: string[];
};

export type PitchBranch = {
  id: string;
  path: Direction[]; // 长度恒为 13（第 1–13 周）
  imageUrl: string | null;
  headline: string;
};

export type PitchData = {
  seasonTitle: string;
  logline: string;
  sheets: { present: string | null; future: string | null };
  persona: { name: string; title: string; catchphrase: string };
  firstLetterQuote: string;
  chapters: PitchChapter[]; // 恒为 13 项，按 no 升序
  snapshots: PitchSnapshot[]; // 恒为 14 项（0–13）
  branches: PitchBranch[]; // ≥ 8 项
  team: { name: string; role: string }[];
  siteUrl: string;
};

export const SEASON_WEEKS = 13;
