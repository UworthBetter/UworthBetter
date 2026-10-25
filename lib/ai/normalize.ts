/**
 * 真实模型输出的宽容预处理：在契约校验之前修正"格式小毛病"（蛇形命名、超长字符串、多出来的数组项），
 * 结构性错误（缺字段、条数不够）仍交给契约校验 → 修复重试 → 回退 mock。
 */
import { z } from "zod";
import {
  ChapterPlan,
  FutureSelfProfile,
  PanelCharacter,
  SeasonRoadmap,
  StoryBible,
  type ChapterContext,
} from "@/lib/contracts/ai";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** 递归把 snake_case 键名转成 camelCase（DESIGN.md 附录里的结构是蛇形命名，模型偶尔会照抄）。 */
export function camelize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(camelize);
  if (!isObj(v)) return v;
  return Object.fromEntries(
    Object.entries(v).map(([k, val]) => [k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()), camelize(val)]),
  );
}

const cut = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : v);
const take = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : v);
const obj = (v: unknown): Obj => (isObj(v) ? v : {});

function quest(v: unknown): unknown {
  if (!isObj(v)) return v;
  const d = Number(v.difficulty);
  return {
    ...v,
    text: cut(v.text, 60),
    storyHook: cut(v.storyHook ?? "", 40),
    difficulty: Number.isFinite(d) ? Math.min(3, Math.max(1, Math.round(d))) : 1,
    isKey: v.isKey === true || v.isKey === "true",
  };
}

const quests = (v: unknown) => (Array.isArray(v) ? v.slice(0, 5).map(quest) : v);

export const ProfileAndBibleOut = z.preprocess(
  (raw) => {
    const r = obj(camelize(raw));
    const fs = obj(r.futureSelf);
    const bible = obj(r.bible ?? r.storyBible); // DESIGN.md 附录里叫 story_bible，模型可能照抄
    return {
      futureSelf: { ...fs, personality: take(fs.personality, 4), coreBeliefs: take(fs.coreBeliefs, 3) },
      bible: { ...bible, allies: take(bible.allies ?? [], 3), motifs: bible.motifs ?? [], foreshadowing: bible.foreshadowing ?? [] },
    };
  },
  z.object({ futureSelf: FutureSelfProfile, bible: StoryBible }),
);

/** 每幕章节数固定 4 / 5 / 4（与 lib/domain/skeleton.ts 的 ACT_RANGES 一致）。 */
export const ACT_CHAPTER_COUNTS = [4, 5, 4] as const;

export const RoadmapOut = z.preprocess(
  (raw) => {
    const r = obj(camelize(raw));
    let no = 0;
    const acts = Array.isArray(r.acts)
      ? r.acts.slice(0, 3).map((a) => {
          const act = obj(a);
          const chapters = Array.isArray(act.chapters) ? act.chapters.map((c) => ({ ...obj(c), no: ++no })) : act.chapters;
          return { ...act, chapters };
        })
      : r.acts;
    return { acts, week1Quests: quests(r.week1Quests) };
  },
  SeasonRoadmap.superRefine((v, ctx) => {
    v.acts.forEach((a, i) => {
      if (a.chapters.length !== ACT_CHAPTER_COUNTS[i]) {
        ctx.addIssue({ code: "custom", path: ["acts", i, "chapters"], message: `第 ${i + 1} 幕必须恰好 ${ACT_CHAPTER_COUNTS[i]} 章` });
      }
    });
  }),
);

export const InterviewOut = z.preprocess(
  (raw) => {
    const r = obj(camelize(raw));
    return { questions: take(r.questions, 3) };
  },
  z.object({ questions: z.array(z.string().min(2)).length(3) }),
);

const SHOTS = ["wide", "medium", "closeup", "over_shoulder"] as const;
const CHARACTERS = PanelCharacter.options as readonly string[];

/** 章节规划：章节类型以领域规则为准；伏笔、采访引用按上下文校正，避免模型编造。 */
export function chapterPlanOut(ctx: ChapterContext) {
  const answers = ctx.interview.map((qa) => qa.a).filter(Boolean);
  const knownIds = new Set(ctx.bible.foreshadowing.map((f) => f.id));
  return z.preprocess((raw) => {
    const r = obj(camelize(raw));
    const panels = Array.isArray(r.panels)
      ? r.panels.slice(0, 4).map((p) => {
          const panel = obj(p);
          const shot = typeof panel.shot === "string" ? panel.shot.toLowerCase().replace(/[\s-]/g, "_").replace("close_up", "closeup") : "";
          const narration = cut(panel.narration, 60);
          return {
            ...panel,
            characters: Array.isArray(panel.characters) ? panel.characters.filter((c) => CHARACTERS.includes(String(c))) : [],
            shot: (SHOTS as readonly string[]).includes(shot) ? shot : "medium",
            narration: narration ? narration : undefined,
            dialogues: Array.isArray(panel.dialogues)
              ? panel.dialogues.slice(0, 2).map((d) => ({ ...obj(d), text: cut(obj(d).text, 40) }))
              : [],
          };
        })
      : r.panels;
    const quote = typeof r.interviewQuote === "string" ? r.interviewQuote.trim() : "";
    const later = (n: unknown) => Math.min(13, Math.max(ctx.chapterNo + 1, Math.round(Number(n) || 13)));
    return {
      ...r,
      chapterType: ctx.chapterType,
      beats: take(r.beats, 4),
      panels,
      summary: cut(r.summary, 300),
      interviewQuote: quote && answers.some((a) => a.includes(quote)) ? quote : undefined,
      foreshadowingAdd:
        ctx.chapterNo >= 13 || !Array.isArray(r.foreshadowingAdd)
          ? []
          : r.foreshadowingAdd.slice(0, 2).map((f, i) => ({ ...obj(f), id: `c${ctx.chapterNo}f${i + 1}`, resolveByChapter: later(obj(f).resolveByChapter) })),
      foreshadowingResolve: Array.isArray(r.foreshadowingResolve) ? r.foreshadowingResolve.map(String).filter((id) => knownIds.has(id)) : [],
      nextWeekQuests: quests(r.nextWeekQuests),
    };
  }, ChapterPlan);
}

const MARK = /<!--\s*panel\s*:\s*(\d)\s*-->/g;

/**
 * 保证正文恰好含 <!--panel:0--> … <!--panel:3--> 各一个（阅读器按它们插入分镜）。
 * 模型漏写或写乱时，去掉已有标记，按段落均匀重新插入。
 */
export function ensurePanelMarkers(md: string): string {
  const found = [...md.matchAll(MARK)].map((m) => Number(m[1]));
  const ok = found.length === 4 && found.every((n, i) => n === i);
  if (ok) return md.replace(MARK, (_, n: string) => `<!--panel:${n}-->`);
  const paragraphs = md.replace(MARK, "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let next = 0;
  paragraphs.forEach((p, i) => {
    out.push(p);
    while (next < 4 && i + 1 >= Math.ceil(((next + 1) * paragraphs.length) / 4)) out.push(`<!--panel:${next++}-->`);
  });
  while (next < 4) out.push(`<!--panel:${next++}-->`);
  return out.join("\n\n") + "\n";
}
