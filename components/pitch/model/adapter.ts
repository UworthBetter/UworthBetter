import { PLACEHOLDER_META, placeholderBranches } from "@/components/pitch/model/placeholder";
import {
  DIRECTIONS,
  SEASON_WEEKS,
  type ChapterKind,
  type Direction,
  type PitchBranch,
  type PitchChapter,
  type PitchData,
  type PitchSnapshot,
} from "@/components/pitch/model/types";

// seed JSON → PitchData。不信任输入：任何字段缺失或类型不对都回落到占位，绝不抛错。

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const url = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const KINDS: ChapterKind[] = ["highlight", "struggle", "low", "rest"];
const isDirection = (v: unknown): v is Direction => DIRECTIONS.includes(v as Direction);

export function directionOf(t: ChapterKind): Direction {
  return t === "highlight" ? "ahead" : t === "struggle" ? "on_track" : "drift";
}

/** 来信摘句：第一句带「我」的句子，从其中第一个带「我」的分句截起，最多 40 字 */
function letterQuote(md: string): string {
  const sentences = md.replace(/[#*>]/g, "").split(/(?<=[。！？])|\n+/).map((s) => s.trim()).filter(Boolean);
  const hit = sentences.find((s) => s.includes("我") && !s.startsWith("亲爱的")) ?? "";
  const clauses = hit.split(/(?<=，)/);
  const from = clauses.findIndex((c) => c.includes("我"));
  const quote = clauses.slice(Math.max(0, from)).join("");
  return quote.length > 40 ? `${quote.slice(0, 39)}…` : quote;
}

function toChapter(raw: unknown, no: number): PitchChapter {
  const c = obj(raw);
  const panels = arr(c.panels);
  return {
    no,
    title: str(c.title, `第 ${no} 章`),
    chapterType: KINDS.includes(c.chapterType as ChapterKind) ? (c.chapterType as ChapterKind) : "struggle",
    coverUrl: url(c.cover),
    panelUrl: url(panels[1]) ?? url(panels[0]),
    letterQuote: letterQuote(str(c.letterMd)),
    logQuotes: arr(c.logs).map((l) => str(obj(l).note)).filter(Boolean).slice(0, 3),
  };
}

function toSnapshots(raw: unknown, chapters: PitchChapter[], futureSheet: string | null): PitchSnapshot[] {
  const given = new Map(arr(raw).map((s) => [obj(s).chapterNo, obj(s)]));
  return Array.from({ length: SEASON_WEEKS + 1 }, (_, n) => {
    const ch = chapters[n - 1];
    const fallback: PitchSnapshot = {
      chapterNo: n,
      imageUrl: n === 0 ? futureSheet : null,
      headline: ch ? ch.title : "季初的她",
      direction: ch ? directionOf(ch.chapterType) : "on_track",
      evidence: ch?.logQuotes.slice(0, 1) ?? [],
    };
    const s = given.get(n);
    if (!s) return fallback;
    const shift = obj(s.shift);
    const evidence = arr(shift.evidence).map((e) => str(e)).filter(Boolean);
    return {
      chapterNo: n,
      imageUrl: url(s.imageUrl) ?? fallback.imageUrl,
      headline: str(shift.headline) || fallback.headline,
      direction: isDirection(shift.direction) ? shift.direction : fallback.direction,
      evidence: evidence.length ? evidence : fallback.evidence,
    };
  });
}

function toBranches(raw: unknown): PitchBranch[] {
  return arr(raw).flatMap((b, i) => {
    const o = obj(b);
    const path = arr(o.path);
    if (path.length !== SEASON_WEEKS || !path.every(isDirection)) return [];
    return [{ id: str(o.id) || `b${i}`, path, imageUrl: url(o.imageUrl), headline: str(o.headline) }];
  });
}

export function toPitchData(season: unknown, branches?: unknown): PitchData {
  const s = obj(season);
  const rawChapters = new Map(arr(s.chapters).map((c) => [obj(c).no, c]));
  const chapters = Array.from({ length: SEASON_WEEKS }, (_, i) => toChapter(rawChapters.get(i + 1), i + 1));
  const sheets = { present: url(obj(s.sheets).present), future: url(obj(s.sheets).future) };
  const snapshots = toSnapshots(s.portraitSnapshots, chapters, sheets.future);
  const realPath = snapshots.slice(1).map((x) => x.direction);
  const given = toBranches(branches);
  return {
    seasonTitle: str(s.seasonTitle, "雾港颜色修补师"),
    logline: str(s.logline),
    sheets,
    ...PLACEHOLDER_META,
    chapters,
    snapshots,
    branches: given.length >= 8 ? given : placeholderBranches(realPath),
  };
}
