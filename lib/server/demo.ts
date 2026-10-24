import { eq, inArray } from "drizzle-orm";
import { fxChapterBodyMd, fxChapterLetterMd, fxChapterPlan, fxInterview, fxOnboarding } from "@/fixtures";
import { adaptQuests } from "@/lib/domain/questRules";
import { toDateStr } from "@/lib/domain/progress";
import { db, schema } from "@/lib/server/db/client";
import { bubbleLayout, chapterQuests, requireEditable } from "@/lib/server/records";
import { fail } from "@/lib/server/http";
import { startChapter } from "@/lib/server/pipeline/chapter";
import { deleteImage } from "@/lib/server/storage";
import { demoChapter, demoSeason } from "@/lib/server/demoData";

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

/** 演示建档：预生成数据（demoSeason）可用时从第 1 周开局（可玩体验）；否则回退到旧 fixture 流程。 */
export function seedDemo(userId: string): string {
  assertIdle(userId);
  const demo = demoSeason();
  const first = demo ? demoChapter(1) : undefined;
  return db.transaction((tx) => {
    const fx = fxOnboarding;
    const self = tx.insert(schema.futureSelves).values({ userId, profile: fx.futureSelf,
      sheetFutureUrl: demo && first ? demo.sheets.future : "/stub/sheet-future.png",
      sheetPresentUrl: demo && first ? demo.sheets.present : "/stub/sheet-present.png" }).returning().get();
    if (demo && first) {
      // 新流程：从第 1 周开局，游客亲手走周循环，可随时通过 demoJump 跳到第 N 周。
      const season = tx.insert(schema.seasons).values({ userId, futureSelfId: self.id, title: fx.bible.seasonTitle,
        style: fx.input.style, timeBudget: fx.input.timeBudget, onboardingInput: fx.input, bible: fx.bible,
        roadmap: fx.roadmap, firstLetterMd: fx.firstLetterMd, startDate: toDateStr(new Date()),
        currentChapter: 1, status: "active" }).returning().get();
      tx.update(schema.users).set({ activeSeasonId: season.id, nickname: "林夏" }).where(eq(schema.users.id, userId)).run();
      for (const road of fx.roadmap.acts.flatMap((a) => a.chapters)) {
        tx.insert(schema.chapters).values({ seasonId: season.id, chapterNo: road.no, title: road.title,
          status: road.no === 1 ? "in_progress" : "locked",
          coverUrl: road.no === 1 ? first.cover : null }).run();
      }
      // 只插入第 1 章任务（全部未完成）；日志不插，由游客亲手记录。
      if (first.quests.length) tx.insert(schema.quests).values(first.quests.map((q, idx) => ({ ...q, idx,
        chapterNo: 1, seasonId: season.id }))).run();
      return season.id;
    }
    // 旧 fixture 流程：seed 资产未就绪时的回退路径，直接落在第 4 章。
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

/**
 * 演示跳章：把 1..chapter-1 章按预生成数据直接写成已完成，落到第 chapter 周开局。
 * 幂等：每次先清空该季全部章节内容、分镜、任务与日志再重建（支持来回跳）。
 */
export function demoJump(season: typeof schema.seasons.$inferSelect, chapter: number) {
  if (!Number.isInteger(chapter) || chapter < 2 || chapter > 13) {
    throw fail("VALIDATION", "chapter 必须是 2–13 之间的整数", 400);
  }
  const demo = demoSeason();
  if (!demo || !season.roadmap) throw fail("VALIDATION", "预生成演示数据未就绪", 400);
  const byNo = new Map(demo.chapters.map((c) => [c.no, c]));
  const baked = (n: number) => {
    const data = byNo.get(n);
    if (!data) throw fail("VALIDATION", "预生成演示数据未就绪", 400);
    return data;
  };
  // 生成中的章节不允许跳转，避免清掉进行中的任务。
  if (db.select().from(schema.chapters).where(eq(schema.chapters.seasonId, season.id)).all().some((c) => c.status === "generating")) {
    throw fail("ALREADY_GENERATING", "请等待生成完成后再跳转", 409);
  }
  const roadTitle = (n: number) => season.roadmap!.acts.flatMap((a) => a.chapters).find((c) => c.no === n)!.title;
  db.transaction((tx) => {
    const rows = tx.select().from(schema.chapters).where(eq(schema.chapters.seasonId, season.id)).all();
    const rowOf = (n: number) => {
      const row = rows.find((c) => c.chapterNo === n);
      if (!row) throw fail("VALIDATION", "演示季章节不完整", 400);
      return row;
    };
    // 幂等：先清空全部章节内容、分镜、任务与日志，再按预烘数据重建。
    for (const row of rows) {
      tx.delete(schema.panels).where(eq(schema.panels.chapterId, row.id)).run();
      tx.update(schema.chapters).set({ status: "locked", chapterType: null, completionRate: null,
        title: roadTitle(row.chapterNo), plan: null, bodyMd: null, letterMd: null, summary: null,
        coverUrl: null, interview: null, activeJobId: null, generatedAt: null }).where(eq(schema.chapters.id, row.id)).run();
    }
    tx.delete(schema.quests).where(eq(schema.quests.seasonId, season.id)).run();
    tx.delete(schema.dailyLogs).where(eq(schema.dailyLogs.seasonId, season.id)).run();
    const base = new Date(`${season.startDate}T12:00:00`);
    // 1..chapter-1 章逐章按预烘数据写成 ready。
    for (let n = 1; n < chapter; n++) {
      const data = baked(n);
      const row = rowOf(n);
      tx.update(schema.chapters).set({ status: "ready", title: data.title, chapterType: data.chapterType,
        completionRate: data.completionRate, plan: { ...data.plan, chapterType: data.chapterType },
        bodyMd: data.bodyMd, letterMd: data.letterMd, summary: data.plan.summary,
        interview: data.questions.map((q, i) => ({ q, a: data.answers[i] })),
        coverUrl: data.cover, generatedAt: new Date() }).where(eq(schema.chapters.id, row.id)).run();
      tx.insert(schema.panels).values(data.plan.panels.map((p, idx) => ({ chapterId: row.id, idx,
        imageUrl: data.panels[idx], sceneDesc: p.scene, narration: p.narration ?? null,
        dialogues: p.dialogues.map((d, j) => ({ ...d, x: bubbleLayout[idx][j * 2], y: bubbleLayout[idx][j * 2 + 1] })),
      }))).run();
      if (data.quests.length) tx.insert(schema.quests).values(data.quests.map((q, idx) => ({ ...q, idx,
        chapterNo: n, seasonId: season.id, done: true, doneAt: new Date() }))).run();
      for (const log of data.logs) {
        const date = new Date(base);
        date.setDate(date.getDate() + log.day);
        tx.insert(schema.dailyLogs).values({ seasonId: season.id, chapterNo: n,
          date: toDateStr(date), note: log.note, mood: log.mood }).run();
      }
      // 下一章封面由本章预烘 nextCover 提供（n+1 ≤ chapter ≤ 13）。
      tx.update(schema.chapters).set({ coverUrl: data.nextCover }).where(eq(schema.chapters.id, rowOf(n + 1).id)).run();
    }
    // 落到目标周：路线图标题、上一章预烘 nextCover 封面、预填采访问题与未完成任务。
    const target = baked(chapter);
    tx.update(schema.chapters).set({ status: "in_progress", title: roadTitle(chapter),
      coverUrl: baked(chapter - 1).nextCover,
      interview: target.questions.map((q) => ({ q, a: "" })) }).where(eq(schema.chapters.id, rowOf(chapter).id)).run();
    if (target.quests.length) tx.insert(schema.quests).values(target.quests.map((q, idx) => ({ ...q, idx,
      chapterNo: chapter, seasonId: season.id }))).run();
    tx.update(schema.seasons).set({ currentChapter: chapter, status: "active" }).where(eq(schema.seasons.id, season.id)).run();
  });
}

export function fastForward(season: typeof schema.seasons.$inferSelect, rate = .6, cached = false) {
  requireEditable(season, season.currentChapter);
  const quests = chapterQuests(season.id, season.currentChapter);
  // 预烘数据存在时，补记日志的 note/mood 优先用当前章预烘日志（小优化，缺失时回退固定文案）。
  const bakedLogs = demoChapter(season.currentChapter)?.logs ?? [];
  const fallbackNotes = ["今天练习了十分钟", "尝试了一种新的配色", "给朋友看了我的作品", "好累，决定早点休息", "画完了一张速写", "整理了这一周的草稿"];
  db.transaction((tx) => {
    quests.forEach((q, i) => tx.update(schema.quests).set({ done: i < Math.round(quests.length * rate),
      doneAt: i < Math.round(quests.length * rate) ? new Date() : null }).where(eq(schema.quests.id, q.id)).run());
    for (let i = 0; i < 6; i++) {
      const date = new Date(`${season.startDate}T12:00:00`);
      date.setDate(date.getDate() + (season.currentChapter - 1) * 7 + i);
      const preset = bakedLogs.length ? bakedLogs[i % bakedLogs.length] : undefined;
      tx.insert(schema.dailyLogs).values({ seasonId: season.id, chapterNo: season.currentChapter, date: toDateStr(date),
        note: preset?.note ?? fallbackNotes[i], mood: preset?.mood ?? (rate < .4 ? 2 : 4) }).run();
    }
  });
  if (cached) startChapter(season, season.currentChapter, true);
}
