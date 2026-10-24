import { eq, inArray } from "drizzle-orm";
import { fxChapterBodyMd, fxChapterLetterMd, fxChapterPlan, fxInterview, fxOnboarding } from "@/fixtures";
import { adaptQuests } from "@/lib/domain/questRules";
import { toDateStr } from "@/lib/domain/progress";
import { db, schema } from "@/lib/server/db/client";
import { bubbleLayout, chapterQuests, requireEditable } from "@/lib/server/records";
import { fail } from "@/lib/server/http";
import { startChapter } from "@/lib/server/pipeline/chapter";
import { deleteImage } from "@/lib/server/storage";

export function assertIdle(userId: string) {
  const seasons = db.select().from(schema.seasons).where(eq(schema.seasons.userId, userId)).all();
  const ids = new Set(seasons.map((s) => s.id));
  const chapterIds = new Set(db.select().from(schema.chapters).all().filter((c) => ids.has(c.seasonId)).map((c) => c.id));
  if (db.select().from(schema.jobs).all().some((j) => ["queued", "running"].includes(j.status) && (ids.has(j.refId) || chapterIds.has(j.refId)))) {
    throw fail("ALREADY_GENERATING", "请等待生成完成后再重置演示数据", 409);
  }
}

export async function resetUser(userId: string) {
  assertIdle(userId);
  const ownedSeasons = new Set(db.select().from(schema.seasons).where(eq(schema.seasons.userId, userId)).all().map((s) => s.id));
  const ownedChapters = db.select().from(schema.chapters).all().filter((c) => ownedSeasons.has(c.seasonId));
  const chapterIds = new Set(ownedChapters.map((c) => c.id));
  const urls = new Set([
    ...ownedChapters.flatMap((c) => [c.coverUrl, c.coverBlurUrl]),
    ...db.select().from(schema.futureSelves).where(eq(schema.futureSelves.userId, userId)).all().flatMap((s) => [s.sheetFutureUrl, s.sheetPresentUrl]),
    ...db.select().from(schema.panels).all().filter((p) => chapterIds.has(p.chapterId)).map((p) => p.imageUrl),
    ...db.select().from(schema.dailyLogs).all().filter((l) => ownedSeasons.has(l.seasonId)).map((l) => l.photoUrl),
  ].flatMap((url) => url ? [url] : []));
  db.transaction((tx) => {
    const seasons = tx.select().from(schema.seasons).where(eq(schema.seasons.userId, userId)).all();
    for (const season of seasons) {
      const chapters = tx.select().from(schema.chapters).where(eq(schema.chapters.seasonId, season.id)).all();
      tx.delete(schema.jobs).where(eq(schema.jobs.refId, season.id)).run();
      if (chapters.length) tx.delete(schema.jobs).where(inArray(schema.jobs.refId, chapters.map((c) => c.id))).run();
    }
    tx.update(schema.users).set({ activeSeasonId: null }).where(eq(schema.users.id, userId)).run();
    tx.delete(schema.seasons).where(eq(schema.seasons.userId, userId)).run();
    tx.delete(schema.futureSelves).where(eq(schema.futureSelves.userId, userId)).run();
  });
  await Promise.all([...urls].map(deleteImage));
}

/** D 轨道尚未提供 seed 资产时，使用经过契约校验的 fixtures 构造完整演示季。 */
export function seedDemo(userId: string): string {
  assertIdle(userId);
  return db.transaction((tx) => {
    const fx = fxOnboarding;
    const self = tx.insert(schema.futureSelves).values({ userId, profile: fx.futureSelf,
      sheetFutureUrl: "/stub/sheet-future.png", sheetPresentUrl: "/stub/sheet-present.png" }).returning().get();
    const start = new Date();
    start.setDate(start.getDate() - 21);
    const season = tx.insert(schema.seasons).values({ userId, futureSelfId: self.id, title: fx.bible.seasonTitle,
      style: fx.input.style, timeBudget: fx.input.timeBudget, onboardingInput: fx.input, bible: fx.bible,
      roadmap: fx.roadmap, firstLetterMd: fx.firstLetterMd, startDate: toDateStr(start), currentChapter: 4, status: "active" }).returning().get();
    tx.update(schema.users).set({ activeSeasonId: season.id, nickname: "林夏" }).where(eq(schema.users.id, userId)).run();
    for (const road of fx.roadmap.acts.flatMap((a) => a.chapters)) {
      const n = road.no;
      const ready = n < 4;
      const rate = n === 3 ? .2 : 1;
      const type = n === 3 ? "low" as const : "highlight" as const;
      const chapter = tx.insert(schema.chapters).values({ seasonId: season.id, chapterNo: n,
        title: ready ? `第${n}章 · ${road.title}` : road.title, status: ready ? "ready" : n === 4 ? "in_progress" : "locked",
        coverUrl: n <= 4 ? `/stub/cover-${n}.png` : null,
        ...(ready ? { chapterType: type, completionRate: rate, plan: { ...fxChapterPlan, chapterType: type },
          bodyMd: fxChapterBodyMd(), letterMd: fxChapterLetterMd(), summary: fxChapterPlan.summary,
          interview: fxInterview.questions.map((q, i) => ({ q, a: fxInterview.answers[i] })), generatedAt: new Date() } : {}),
      }).returning().get();
      if (ready) tx.insert(schema.panels).values(fxChapterPlan.panels.map((p, idx) => ({ chapterId: chapter.id, idx,
        imageUrl: `/stub/panel-${idx}.png`, sceneDesc: p.scene, narration: p.narration ?? null,
        dialogues: p.dialogues.map((d, j) => ({ ...d, x: bubbleLayout[idx][j * 2], y: bubbleLayout[idx][j * 2 + 1] })),
      }))).run();
      if (n <= 4) {
        const suggested = n === 1 ? fx.roadmap.week1Quests : fxChapterPlan.nextWeekQuests;
        const qs = n === 3 ? Array.from({ length: 5 }, (_, i) => suggested[i % suggested.length])
          : n === 4 ? adaptQuests(suggested, .2) : suggested;
        tx.insert(schema.quests).values(qs.map((q, idx) => ({ ...q, idx, chapterNo: n, seasonId: season.id,
          done: n === 3 ? idx === 0 : ready || idx < qs.length - 2 }))).run();
        tx.insert(schema.dailyLogs).values([0, 1, 2].map((i) => {
          const date = new Date(start); date.setDate(date.getDate() + (n - 1) * 7 + i);
          return { seasonId: season.id, chapterNo: n, date: toDateStr(date),
            note: n === 3 ? "好累，今天先休息一下" : ["画完了一张练习稿", "在街上找到了新的配色灵感", "终于打开画本练习了十分钟"][i], mood: n === 3 ? 2 : 4 };
        })).run();
      }
    }
    return season.id;
  });
}

export function fastForward(season: typeof schema.seasons.$inferSelect, rate = .6, cached = false) {
  requireEditable(season, season.currentChapter);
  const quests = chapterQuests(season.id, season.currentChapter);
  db.transaction((tx) => {
    quests.forEach((q, i) => tx.update(schema.quests).set({ done: i < Math.round(quests.length * rate),
      doneAt: i < Math.round(quests.length * rate) ? new Date() : null }).where(eq(schema.quests.id, q.id)).run());
    for (let i = 0; i < 6; i++) {
      const date = new Date(`${season.startDate}T12:00:00`);
      date.setDate(date.getDate() + (season.currentChapter - 1) * 7 + i);
      tx.insert(schema.dailyLogs).values({ seasonId: season.id, chapterNo: season.currentChapter, date: toDateStr(date),
        note: ["今天练习了十分钟", "尝试了一种新的配色", "给朋友看了我的作品", "好累，决定早点休息", "画完了一张速写", "整理了这一周的草稿"][i], mood: rate < .4 ? 2 : 4 }).run();
    }
  });
  if (cached) startChapter(season, season.currentChapter, true);
}
