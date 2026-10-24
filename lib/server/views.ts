import { asc, eq } from "drizzle-orm";
import type { ChapterCard, ChapterView, FogView, QuestView, SeasonView } from "@/lib/contracts/api";
import { completionRate, daysLeft, fogBlurPx, remainingToClear } from "@/lib/domain/progress";
import { ACT_RANGES, actOf, isActFinale } from "@/lib/domain/skeleton";
import { db, schema } from "@/lib/server/db/client";
import { chapterQuests, getChapter } from "@/lib/server/records";
import { fail } from "@/lib/server/http";

export function questViews(seasonId: string, n: number): QuestView[] { return chapterQuests(seasonId, n); }

export function fogView(seasonId: string, n: number): FogView {
  const chapter = getChapter(seasonId, n);
  const quests = chapterQuests(seasonId, n);
  const rate = completionRate(quests);
  return { coverUrl: chapter.coverUrl, rate, blurPx: fogBlurPx(rate), remainingToClear: remainingToClear(quests) };
}

export function chapterCards(seasonId: string): ChapterCard[] {
  return db.select().from(schema.chapters).where(eq(schema.chapters.seasonId, seasonId))
    .orderBy(asc(schema.chapters.chapterNo)).all().map((c) => ({
      no: c.chapterNo, title: c.title, status: c.status, type: c.chapterType,
      coverUrl: c.status === "locked" ? null : c.coverUrl, act: actOf(c.chapterNo), isActFinale: isActFinale(c.chapterNo),
    }));
}

export function futureSelf(season: typeof schema.seasons.$inferSelect) {
  const self = season.futureSelfId ? db.select().from(schema.futureSelves).where(eq(schema.futureSelves.id, season.futureSelfId)).get() : undefined;
  if (!self || !season.bible || !season.roadmap) throw fail("CHAPTER_LOCKED", "建档尚未完成", 409);
  return self;
}

export function toSeasonView(season: typeof schema.seasons.$inferSelect): SeasonView {
  const self = futureSelf(season);
  const cards = chapterCards(season.id);
  if (cards.length !== 13) throw fail("CHAPTER_LOCKED", "建档尚未完成", 409);
  const current = getChapter(season.id, season.currentChapter);
  const road = season.roadmap!.acts.flatMap((a) => a.chapters).find((c) => c.no === current.chapterNo)!;
  return {
    season: { id: season.id, title: season.title, style: season.style, logline: season.bible!.logline,
      startDate: season.startDate, currentChapter: season.currentChapter, status: season.status },
    futureSelf: { name: self.profile.name, title: self.profile.title, catchphrase: self.profile.catchphrase,
      sheetFutureUrl: self.sheetFutureUrl, sheetPresentUrl: self.sheetPresentUrl },
    acts: season.roadmap!.acts.map((a, i) => {
      const { from, to } = ACT_RANGES[i];
      return { name: a.name, milestone: a.milestone, fromChapter: from, toChapter: to,
        progress: cards.filter((c) => c.no >= from && c.no <= to && c.status === "ready").length / (to - from + 1) };
    }),
    current: { no: current.chapterNo, title: current.title, beat: road.beat, isActFinale: isActFinale(current.chapterNo),
      daysLeft: daysLeft(season.startDate, current.chapterNo), quests: questViews(season.id, current.chapterNo),
      fog: fogView(season.id, current.chapterNo), canFinish: season.status === "active" && current.status === "in_progress",
      activeJobId: current.activeJobId },
    chapters: cards,
  };
}

export function toChapterView(season: typeof schema.seasons.$inferSelect, n: number): ChapterView {
  const chapter = getChapter(season.id, n);
  if (chapter.status !== "ready" || !chapter.plan) throw fail("CHAPTER_LOCKED", "章节尚未生成完成", 409);
  const self = futureSelf(season);
  const next = n < 13 ? getChapter(season.id, n + 1) : null;
  return {
    no: n, title: chapter.title, type: chapter.chapterType!, act: actOf(n), isActFinale: isActFinale(n),
    coverUrl: chapter.coverUrl, bodyMd: chapter.bodyMd!, letterMd: chapter.letterMd!, letterFrom: self.profile.name,
    panels: db.select().from(schema.panels).where(eq(schema.panels.chapterId, chapter.id)).orderBy(asc(schema.panels.idx)).all(),
    realEvents: chapter.plan.realEventsMapping, interview: chapter.interview ?? [], completionRate: chapter.completionRate!,
    next: next ? { no: next.chapterNo, title: next.title, cliffhanger: chapter.plan.cliffhanger,
      coverUrl: next.coverUrl, quests: questViews(season.id, n + 1) } : null,
  };
}
