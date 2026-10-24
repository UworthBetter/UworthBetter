/**
 * 契约：HTTP API 请求 / 响应。前端（C）与后端（B）的唯一约定。
 * ⚠️ 已冻结（见 CLAUDE.md「契约规则」）。只允许新增 .optional() 字段，修改后需运行 `pnpm contracts:lock`。
 *
 * 通用约定：
 * - 身份：匿名 `uid` cookie（httpOnly），由后端在首次请求时下发。
 * - 成功：直接返回响应体 JSON。失败：ApiError + 4xx/5xx。
 * - 图片 URL 均为站内可访问路径（如 /generated/xxx.png）或公网 URL；null 表示生成失败/未生成，前端显示占位。
 */
import { z } from "zod";
import { ChapterType, FutureSelfProfile, Quest, QA, StyleId, TimeBudget } from "./ai";

// ───────────── 错误 ─────────────

export const ErrorCode = z.enum([
  "NO_SEASON", // 当前用户还没有建档
  "CHAPTER_LOCKED", // 章节未解锁/未生成完
  "ALREADY_GENERATING", // 章节正在生成
  "VALIDATION", // 请求体校验失败
  "AI_FAILED", // AI 调用失败（重试后）
  "NOT_FOUND",
  "FORBIDDEN", // 非本人数据 / Demo 接口未开启
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ApiError = z.object({
  error: z.object({ code: ErrorCode, message: z.string() }),
});
export type ApiError = z.infer<typeof ApiError>;

// ───────────── 通用视图 ─────────────

export const ChapterStatus = z.enum(["locked", "in_progress", "generating", "ready"]);
export type ChapterStatus = z.infer<typeof ChapterStatus>;

export const QuestView = Quest.extend({ id: z.string(), done: z.boolean() });
export type QuestView = z.infer<typeof QuestView>;

export const FogView = z.object({
  coverUrl: z.string().nullable(), // 下一章/本章封面；rate<1 时可为服务端预模糊版本
  rate: z.number().min(0).max(1), // 本章任务完成度
  blurPx: z.number().int().min(0).max(24), // = round(24*(1-rate))
  remainingToClear: z.number().int().min(0), // 还差几个任务迷雾散尽
});
export type FogView = z.infer<typeof FogView>;

export const ChapterCard = z.object({
  no: z.number().int(),
  title: z.string(),
  status: ChapterStatus,
  type: ChapterType.nullable(),
  coverUrl: z.string().nullable(),
  act: z.number().int().min(1).max(3),
  isActFinale: z.boolean(),
});
export type ChapterCard = z.infer<typeof ChapterCard>;

export const Hotline = z.object({ name: z.string(), phone: z.string() });
export const CrisisNotice = z.object({ message: z.string(), hotlines: z.array(Hotline) });
export type CrisisNotice = z.infer<typeof CrisisNotice>;

// ───────────── GET /api/me ─────────────

export const MeResponse = z.object({
  userId: z.string(),
  seasonId: z.string().nullable(),
  seasonStatus: z.enum(["onboarding", "active", "finished"]).nullable(),
  demoMode: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponse>;

// ───────────── GET /api/season ─────────────

export const SeasonView = z.object({
  season: z.object({
    id: z.string(),
    title: z.string(),
    style: StyleId,
    logline: z.string(),
    startDate: z.string(), // YYYY-MM-DD
    currentChapter: z.number().int(),
    status: z.enum(["onboarding", "active", "finished"]),
  }),
  futureSelf: z.object({
    name: z.string(),
    title: z.string(),
    catchphrase: z.string(),
    sheetFutureUrl: z.string().nullable(),
    sheetPresentUrl: z.string().nullable(),
  }),
  acts: z
    .array(
      z.object({
        name: z.string(),
        milestone: z.string(),
        fromChapter: z.number().int(),
        toChapter: z.number().int(),
        progress: z.number().min(0).max(1), // 本幕 ready 章节占比
      }),
    )
    .length(3),
  current: z.object({
    no: z.number().int(),
    title: z.string(),
    beat: z.string(),
    isActFinale: z.boolean(),
    daysLeft: z.number().int(),
    quests: z.array(QuestView),
    fog: FogView,
    canFinish: z.boolean(),
    activeJobId: z.string().nullable(), // 章节生成中时返回，前端据此恢复 SSE
  }),
  chapters: z.array(ChapterCard).length(13),
});
export type SeasonView = z.infer<typeof SeasonView>;

// ───────────── GET /api/future-self ─────────────

export const FutureSelfView = z.object({
  profile: FutureSelfProfile,
  sheetFutureUrl: z.string().nullable(),
  sheetPresentUrl: z.string().nullable(),
  firstLetterMd: z.string().nullable(),
  seasonTitle: z.string(),
  logline: z.string(),
});
export type FutureSelfView = z.infer<typeof FutureSelfView>;

// ───────────── POST /api/onboarding ─────────────
// multipart/form-data：字段 "data" = JSON.stringify(OnboardingRequest)，字段 "selfie" = File（可选）

export const OnboardingRequest = z.object({
  goal: z.string().min(5).max(500),
  futureDesc: z.string().max(800),
  futureName: z.string().min(1).max(30),
  obstacles: z.array(z.string()).min(1).max(6),
  timeBudget: TimeBudget,
  startingPoint: z.string().max(200),
  style: StyleId,
  nickname: z.string().max(20).optional(),
});
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;

export const OnboardingResponse = z.object({ jobId: z.string(), seasonId: z.string() });
export type OnboardingResponse = z.infer<typeof OnboardingResponse>;

// ───────────── PATCH /api/quests/:id ─────────────

export const PatchQuestRequest = z.object({ done: z.boolean() });
export type PatchQuestRequest = z.infer<typeof PatchQuestRequest>;

export const PatchQuestResponse = z.object({ quest: QuestView, fog: FogView });
export type PatchQuestResponse = z.infer<typeof PatchQuestResponse>;

// ───────────── /api/logs ─────────────
// POST multipart/form-data：字段 "data" = JSON.stringify(CreateLogRequest)，字段 "photo" = File（可选）

export const CreateLogRequest = z.object({
  note: z.string().min(1).max(140),
  mood: z.number().int().min(1).max(5),
});
export type CreateLogRequest = z.infer<typeof CreateLogRequest>;

export const LogView = z.object({
  id: z.string(),
  chapterNo: z.number().int(),
  date: z.string(),
  note: z.string(),
  mood: z.number().int(),
  photoUrl: z.string().nullable(),
});
export type LogView = z.infer<typeof LogView>;

export const CreateLogResponse = z.object({
  log: LogView,
  crisis: CrisisNotice.optional(), // 检测到危机信号时返回，前端必须展示关怀卡片
});
export type CreateLogResponse = z.infer<typeof CreateLogResponse>;

export const ListLogsResponse = z.object({ logs: z.array(LogView) });
export type ListLogsResponse = z.infer<typeof ListLogsResponse>;

// ───────────── /api/chapters/:n/interview ─────────────

export const InterviewQuestions = z.object({ questions: z.array(z.string()).length(3) });
export type InterviewQuestions = z.infer<typeof InterviewQuestions>;

export const InterviewAnswers = z.object({ answers: z.array(z.string().max(300)).length(3) }); // 空串 = 跳过
export type InterviewAnswers = z.infer<typeof InterviewAnswers>;

export const OkResponse = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponse>;

// ───────────── POST /api/chapters/:n/generate ─────────────

export const GenerateResponse = z.object({ jobId: z.string() });
export type GenerateResponse = z.infer<typeof GenerateResponse>;

// ───────────── GET /api/chapters/:n ─────────────

export const BubbleView = z.object({
  speaker: z.string(),
  text: z.string(),
  x: z.number().min(0).max(1), // 气泡锚点，相对分镜宽高的比例
  y: z.number().min(0).max(1),
});
export type BubbleView = z.infer<typeof BubbleView>;

export const PanelView = z.object({
  idx: z.number().int().min(0).max(3),
  imageUrl: z.string().nullable(),
  narration: z.string().nullable(),
  dialogues: z.array(BubbleView),
});
export type PanelView = z.infer<typeof PanelView>;

export const ChapterView = z.object({
  no: z.number().int(),
  title: z.string(),
  type: ChapterType,
  act: z.number().int(),
  isActFinale: z.boolean(),
  coverUrl: z.string().nullable(),
  bodyMd: z.string(), // 内含 <!--panel:0--> … <!--panel:3--> 占位标记
  letterMd: z.string(),
  letterFrom: z.string(), // 落款人，如 "2027年的林夏"
  panels: z.array(PanelView),
  realEvents: z.array(z.object({ real: z.string(), story: z.string() })),
  interview: z.array(QA),
  completionRate: z.number().min(0).max(1),
  next: z
    .object({
      no: z.number().int(),
      title: z.string(),
      cliffhanger: z.string(),
      coverUrl: z.string().nullable(),
      quests: z.array(QuestView),
    })
    .nullable(), // 第 13 章为 null
});
export type ChapterView = z.infer<typeof ChapterView>;

// ───────────── PUT /api/chapters/:n/quests ─────────────

export const ReplaceQuestsRequest = z.object({ quests: z.array(Quest).min(1).max(5) });
export type ReplaceQuestsRequest = z.infer<typeof ReplaceQuestsRequest>;

export const ReplaceQuestsResponse = z.object({ quests: z.array(QuestView) });
export type ReplaceQuestsResponse = z.infer<typeof ReplaceQuestsResponse>;

// ───────────── GET /api/shelf ─────────────

export const ShelfResponse = z.object({ chapters: z.array(ChapterCard).length(13) });
export type ShelfResponse = z.infer<typeof ShelfResponse>;

// ───────────── Demo（仅 DEMO_MODE=1） ─────────────

export const SeedResponse = z.object({ seasonId: z.string() });
export type SeedResponse = z.infer<typeof SeedResponse>;

export const FastForwardRequest = z.object({
  rate: z.number().min(0).max(1).optional(), // 指定本章完成度
  cached: z.boolean().optional(), // 生成时回放预生成章节（网络兜底）
});
export type FastForwardRequest = z.infer<typeof FastForwardRequest>;

// ───────────── P1：POST /api/future/chat（text/event-stream，事件同 JobEvent 的 delta/done/error） ─────────────

export const ChatRequest = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) }))
    .min(1)
    .max(30),
});
export type ChatRequest = z.infer<typeof ChatRequest>;
