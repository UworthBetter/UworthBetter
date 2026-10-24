import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db/client";
import { fail } from "@/lib/server/http";
import type { Quest } from "@/lib/contracts/ai";

export function getChapter(seasonId: string, n: number) {
  const chapter = db.select().from(schema.chapters)
    .where(and(eq(schema.chapters.seasonId, seasonId), eq(schema.chapters.chapterNo, n))).get();
  if (!chapter) throw fail("NOT_FOUND", "章节不存在", 404);
  return chapter;
}

export function chapterQuests(seasonId: string, n: number) {
  return db.select().from(schema.quests)
    .where(and(eq(schema.quests.seasonId, seasonId), eq(schema.quests.chapterNo, n)))
    .orderBy(asc(schema.quests.idx)).all();
}

export function insertQuests(seasonId: string, chapterNo: number, quests: readonly Quest[], tx = db) {
  if (quests.length) tx.insert(schema.quests).values(quests.map((q, idx) => ({ ...q, seasonId, chapterNo, idx }))).run();
}

export function requireEditable(season: typeof schema.seasons.$inferSelect, n: number) {
  const chapter = getChapter(season.id, n);
  if (chapter.status === "generating") throw fail("ALREADY_GENERATING", "章节正在生成", 409);
  if (season.status !== "active" || n !== season.currentChapter || chapter.status !== "in_progress") {
    throw fail("CHAPTER_LOCKED", "只能修改当前进行中的章节", 409);
  }
  return chapter;
}

export const bubbleLayout = [[.25, .18, .72, .3], [.7, .15, .3, .32], [.28, .15, .72, .28], [.5, .15, .5, .32]];
