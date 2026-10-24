import { asc, eq } from "drizzle-orm";
import { ChapterContext } from "@/lib/contracts/ai";
import { decideChapterType } from "@/lib/domain/chapterType";
import { completionRate, weekdayOf } from "@/lib/domain/progress";
import { actOf, isActFinale } from "@/lib/domain/skeleton";
import { db, schema } from "@/lib/server/db/client";
import { chapterQuests, getChapter } from "@/lib/server/records";
import { futureSelf } from "@/lib/server/views";
import { fail } from "@/lib/server/http";
import { getAITasks } from "@/lib/ai/tasks";

export function buildChapterContext(seasonId: string, n: number): ChapterContext {
  const season = db.select().from(schema.seasons).where(eq(schema.seasons.id, seasonId)).get();
  if (!season) throw fail("NO_SEASON", "季不存在", 404);
  const self = futureSelf(season);
  const chapter = getChapter(seasonId, n);
  const quests = chapterQuests(seasonId, n);
  const previous = db.select().from(schema.chapters).where(eq(schema.chapters.seasonId, seasonId))
    .orderBy(asc(schema.chapters.chapterNo)).all().filter((c) => c.chapterNo < n && c.status === "ready");
  const rate = completionRate(quests);
  return ChapterContext.parse({ chapterNo: n, act: actOf(n), isActFinale: isActFinale(n),
    roadmapBeat: season.roadmap!.acts.flatMap((a) => a.chapters).find((c) => c.no === n)!.beat,
    chapterType: decideChapterType(rate, previous.flatMap((c) => c.chapterType ? [c.chapterType] : [])),
    completionRate: rate, style: season.style, futureSelf: self.profile, bible: season.bible,
    previousSummaries: previous.slice(-3).map((c) => ({ no: c.chapterNo, summary: c.summary ?? "" })),
    dueForeshadowing: season.bible!.foreshadowing.filter((f) => f.resolveByChapter <= n + 1), quests,
    logs: db.select().from(schema.dailyLogs).where(eq(schema.dailyLogs.seasonId, seasonId))
      .orderBy(asc(schema.dailyLogs.createdAt)).all().filter((l) => l.chapterNo === n)
      .map((l) => ({ ...l, weekday: weekdayOf(l.date), photoCaption: l.photoCaption ?? undefined })),
    interview: chapter.interview ?? [], timeBudget: season.timeBudget,
  });
}

export async function buildSafeChapterContext(seasonId: string, n: number): Promise<ChapterContext> {
  const context = buildChapterContext(seasonId, n);
  const ai = getAITasks();
  const safeLogs = await Promise.all(context.logs.map(async (log) =>
    (await ai.checkSafety(`${log.note} ${log.photoCaption ?? ""}`)).crisis ? null : log));
  context.logs = safeLogs.flatMap((log) => log ? [log] : []);
  context.interview = await Promise.all(context.interview.map(async (qa) => ({
    ...qa, a: (await ai.checkSafety(qa.a)).crisis ? "" : qa.a,
  })));
  return context;
}
