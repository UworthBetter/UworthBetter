/**
 * 数据库表结构（Drizzle + SQLite）。属于契约的一部分：⚠️ 已冻结，只允许新增可空列 / 新表。
 * 修改后：pnpm db:generate && pnpm db:migrate && pnpm contracts:lock
 */
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import type {
  ChapterPlan,
  FutureSelfProfile,
  QA,
  SeasonRoadmap,
  StoryBible,
} from "@/lib/contracts/ai";
import type { BubbleView } from "@/lib/contracts/api";
import type { JobEvent } from "@/lib/contracts/events";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(12));
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

export const users = sqliteTable("users", {
  id: pk(),
  nickname: text("nickname"),
  activeSeasonId: text("active_season_id"),
  createdAt: createdAt(),
});

export const futureSelves = sqliteTable("future_selves", {
  id: pk(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  profile: json<FutureSelfProfile>("profile_json").notNull(),
  sheetFutureUrl: text("sheet_future_url"),
  sheetPresentUrl: text("sheet_present_url"),
  createdAt: createdAt(),
});

export const seasons = sqliteTable("seasons", {
  id: pk(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  futureSelfId: text("future_self_id").references(() => futureSelves.id),
  title: text("title").notNull().default(""),
  style: text("style", { enum: ["healing", "wuxia", "cyber"] }).notNull(),
  timeBudget: text("time_budget", { enum: ["15m", "30m", "1h", "2h+"] }).notNull(),
  onboardingInput: json<Record<string, unknown>>("onboarding_input_json").notNull(),
  bible: json<StoryBible>("story_bible_json"),
  roadmap: json<SeasonRoadmap>("roadmap_json"),
  firstLetterMd: text("first_letter_md"),
  letterToFuture: text("letter_to_future"),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  currentChapter: integer("current_chapter").notNull().default(1),
  status: text("status", { enum: ["onboarding", "active", "finished"] })
    .notNull()
    .default("onboarding"),
  createdAt: createdAt(),
});

export const quests = sqliteTable(
  "quests",
  {
    id: pk(),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    chapterNo: integer("chapter_no").notNull(),
    idx: integer("idx").notNull(),
    text: text("text").notNull(),
    difficulty: integer("difficulty").notNull(),
    isKey: integer("is_key", { mode: "boolean" }).notNull().default(false),
    storyHook: text("story_hook").notNull().default(""),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    doneAt: integer("done_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("quests_season_ch").on(t.seasonId, t.chapterNo)],
);

export const dailyLogs = sqliteTable(
  "daily_logs",
  {
    id: pk(),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    chapterNo: integer("chapter_no").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    note: text("note").notNull(),
    mood: integer("mood").notNull(),
    photoUrl: text("photo_url"),
    photoCaption: text("photo_caption"),
    createdAt: createdAt(),
  },
  (t) => [index("logs_season_ch").on(t.seasonId, t.chapterNo)],
);

export const chapters = sqliteTable(
  "chapters",
  {
    id: pk(),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    chapterNo: integer("chapter_no").notNull(),
    status: text("status", { enum: ["locked", "in_progress", "generating", "ready"] })
      .notNull()
      .default("locked"),
    chapterType: text("chapter_type", { enum: ["highlight", "struggle", "low", "rest"] }),
    completionRate: real("completion_rate"),
    title: text("title").notNull(), // 先用路线图标题，生成后覆盖
    plan: json<ChapterPlan>("plan_json"),
    bodyMd: text("body_md"),
    letterMd: text("letter_md"),
    summary: text("summary"),
    coverUrl: text("cover_url"), // 由上一章生成（迷雾封面）
    coverBlurUrl: text("cover_blur_url"), // P1：服务端预模糊
    interview: json<QA[]>("interview_json"),
    activeJobId: text("active_job_id"),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("chapters_season_no").on(t.seasonId, t.chapterNo)],
);

export const panels = sqliteTable(
  "panels",
  {
    id: pk(),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    imageUrl: text("image_url"),
    sceneDesc: text("scene_desc").notNull(),
    narration: text("narration"),
    dialogues: json<BubbleView[]>("dialogues_json").notNull(),
  },
  (t) => [uniqueIndex("panels_chapter_idx").on(t.chapterId, t.idx)],
);

export const jobs = sqliteTable("jobs", {
  id: pk(),
  type: text("type", { enum: ["onboarding", "chapter"] }).notNull(),
  refId: text("ref_id").notNull(), // onboarding → seasonId；chapter → chapterId
  status: text("status", { enum: ["queued", "running", "done", "error"] })
    .notNull()
    .default("queued"),
  events: json<JobEvent[]>("events_json")
    .notNull()
    .$defaultFn(() => []), // 仅持久化 step/done/error，用于 SSE 重放
  error: text("error"),
  createdAt: createdAt(),
});
