import { and, eq } from "drizzle-orm";
import { ReplaceQuestsRequest, ReplaceQuestsResponse } from "@/lib/contracts/api";
import { adaptQuests } from "@/lib/domain/questRules";
import { db, schema } from "@/lib/server/db/client";
import { fail, handle, ok, parseChapterNo, readJson } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { chapterQuests, getChapter, insertQuests, requireEditable } from "@/lib/server/records";
export const PUT = handle(async (req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  const { quests } = await readJson(req, ReplaceQuestsRequest);
  const season = await getActiveSeason();
  requireEditable(season, n);
  if (chapterQuests(season.id, n).some((q) => q.done)) throw fail("CHAPTER_LOCKED", "已开始完成任务，不能替换", 409);
  const rate = n > 1 ? getChapter(season.id, n - 1).completionRate ?? 1 : 1;
  db.transaction((tx) => {
    tx.delete(schema.quests).where(and(eq(schema.quests.seasonId, season.id), eq(schema.quests.chapterNo, n))).run();
    insertQuests(season.id, n, adaptQuests(quests, rate), tx);
  });
  return ok(ReplaceQuestsResponse, { quests: chapterQuests(season.id, n) });
});
