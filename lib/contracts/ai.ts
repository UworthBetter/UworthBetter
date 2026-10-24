/**
 * 契约：AI 领域对象。
 * ⚠️ 已冻结（见 CLAUDE.md「契约规则」）。只允许新增 .optional() 字段，修改后需运行 `pnpm contracts:lock`。
 */
import { z } from "zod";

export const StyleId = z.enum(["healing", "wuxia", "cyber"]);
export type StyleId = z.infer<typeof StyleId>;

export const ChapterType = z.enum(["highlight", "struggle", "low", "rest"]);
export type ChapterType = z.infer<typeof ChapterType>;

export const TimeBudget = z.enum(["15m", "30m", "1h", "2h+"]);
export type TimeBudget = z.infer<typeof TimeBudget>;

export const Quest = z.object({
  text: z.string().min(2).max(60),
  difficulty: z.number().int().min(1).max(3),
  isKey: z.boolean(), // 关键任务：推进里程碑，与章末悬念绑定
  storyHook: z.string().max(40), // "完成后：修复第一扇窗"
});
export type Quest = z.infer<typeof Quest>;

/** 用户自选的每周任务条数上限（建档时可选，缺省 = 交给故事节奏）。 */
export const QuestCount = z.number().int().min(1).max(5);

/** AI 推荐的 90 天目标草稿：goal 可直接填入愿望栏，tagline 用于卡片标题。 */
export const GoalSuggestion = z.object({
  goal: z.string().min(5).max(500),
  tagline: z.string().min(1).max(20),
});
export type GoalSuggestion = z.infer<typeof GoalSuggestion>;

export const FutureSelfProfile = z.object({
  name: z.string(), // "2027年的林夏"
  title: z.string(), // 故事中的身份："颜色修补师"
  realIdentity: z.string(), // 现实身份："能稳定接单的自由插画师"
  personality: z.array(z.string()).min(2).max(4),
  catchphrase: z.string(),
  dailyRoutine: z.string(),
  coreBeliefs: z.array(z.string()).min(1).max(3),
  speakingStyle: z.string(),
  appearance: z.string(), // 详细外貌（生成设定图）
  appearanceAnchor: z.string(), // 一句话外貌锚点（每张分镜都附带）
  signatureItem: z.string(), // 标志性道具
});
export type FutureSelfProfile = z.infer<typeof FutureSelfProfile>;

export const Foreshadow = z.object({
  id: z.string(),
  hint: z.string(),
  resolveByChapter: z.number().int().min(1).max(13),
});
export type Foreshadow = z.infer<typeof Foreshadow>;

export const StoryBible = z.object({
  seasonTitle: z.string(),
  logline: z.string(),
  world: z.string(),
  metaphorMap: z.array(z.object({ real: z.string(), story: z.string() })).min(2),
  protagonist: z.object({
    name: z.string(),
    appearanceAnchor: z.string(),
    startState: z.string(),
  }),
  mentor: z.object({ name: z.string(), role: z.string() }), // 未来的你
  antagonist: z.object({
    name: z.string(),
    embodies: z.string(), // 外化的内在阻力
    tactics: z.array(z.string()).min(3),
  }),
  allies: z.array(z.object({ name: z.string(), desc: z.string() })).max(3),
  motifs: z.array(z.string()),
  foreshadowing: z.array(Foreshadow),
});
export type StoryBible = z.infer<typeof StoryBible>;

export const RoadmapChapter = z.object({
  no: z.number().int().min(1).max(13),
  title: z.string(),
  beat: z.string(),
  realFocus: z.string(),
});
export type RoadmapChapter = z.infer<typeof RoadmapChapter>;

export const RoadmapAct = z.object({
  name: z.string(),
  realGoal: z.string(),
  milestone: z.string(),
  chapters: z.array(RoadmapChapter).min(1),
});
export type RoadmapAct = z.infer<typeof RoadmapAct>;

export const SeasonRoadmap = z.object({
  acts: z.array(RoadmapAct).length(3),
  week1Quests: z.array(Quest).min(3).max(5),
});
export type SeasonRoadmap = z.infer<typeof SeasonRoadmap>;

export const Dialogue = z.object({ speaker: z.string(), text: z.string().max(40) });
export type Dialogue = z.infer<typeof Dialogue>;

export const PanelCharacter = z.enum(["protagonist", "mentor", "antagonist", "ally"]);
export type PanelCharacter = z.infer<typeof PanelCharacter>;

export const PanelPlan = z.object({
  scene: z.string(), // 英文画面描述（给图像模型）
  characters: z.array(PanelCharacter),
  shot: z.enum(["wide", "medium", "closeup", "over_shoulder"]),
  narration: z.string().max(60).optional(), // 中文旁白框
  dialogues: z.array(Dialogue).max(2),
});
export type PanelPlan = z.infer<typeof PanelPlan>;

export const ChapterPlan = z.object({
  title: z.string(),
  chapterType: ChapterType,
  realEventsMapping: z.array(z.object({ real: z.string(), story: z.string() })).min(1),
  beats: z.array(z.string()).length(4),
  panels: z.array(PanelPlan).length(4),
  coverPrompt: z.string(),
  interviewQuote: z.string().optional(), // 必须是采访回答的原文子串
  cliffhanger: z.string(),
  foreshadowingAdd: z.array(Foreshadow),
  foreshadowingResolve: z.array(z.string()), // Foreshadow.id[]
  summary: z.string().max(300),
  nextCoverPrompt: z.string(),
  nextWeekQuests: z.array(Quest).min(3).max(5),
});
export type ChapterPlan = z.infer<typeof ChapterPlan>;

// ───────────── AI 任务输入 ─────────────

export const OnboardingInput = z.object({
  goal: z.string().min(5).max(500),
  futureDesc: z.string().max(800),
  futureName: z.string().max(30),
  obstacles: z.array(z.string()).min(1).max(6),
  timeBudget: TimeBudget,
  startingPoint: z.string().max(200),
  style: StyleId,
  questCount: QuestCount.optional(), // 每周任务条数上限（用户自选，缺省 = AI 按节奏定 3–5）
  selfieUrl: z.string().optional(), // 内部存储地址，生成设定图后删除
});
export type OnboardingInput = z.infer<typeof OnboardingInput>;

export const LogForAI = z.object({
  date: z.string(), // YYYY-MM-DD
  weekday: z.string(), // "周二"
  note: z.string(),
  mood: z.number().int().min(1).max(5),
  photoCaption: z.string().optional(),
});
export type LogForAI = z.infer<typeof LogForAI>;

export const QA = z.object({ q: z.string(), a: z.string() }); // a 为空串 = 跳过
export type QA = z.infer<typeof QA>;

export const ChapterContext = z.object({
  chapterNo: z.number().int().min(1).max(13),
  act: z.number().int().min(1).max(3),
  isActFinale: z.boolean(),
  roadmapBeat: z.string(),
  chapterType: ChapterType,
  completionRate: z.number().min(0).max(1),
  style: StyleId,
  futureSelf: FutureSelfProfile,
  bible: StoryBible,
  previousSummaries: z.array(z.object({ no: z.number(), summary: z.string() })).max(3),
  dueForeshadowing: z.array(Foreshadow),
  quests: z.array(Quest.extend({ done: z.boolean() })),
  logs: z.array(LogForAI),
  interview: z.array(QA),
  timeBudget: TimeBudget,
  questCount: QuestCount.optional(), // 建档时用户自选的每周任务条数上限
});
export type ChapterContext = z.infer<typeof ChapterContext>;
