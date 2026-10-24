import { eq } from "drizzle-orm";
import { PatchQuestRequest, PatchQuestResponse } from "@/lib/contracts/api";
import { db, schema } from "@/lib/server/db/client";
import { fail, handle, ok, readJson } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { requireEditable } from "@/lib/server/records";
import { fogView } from "@/lib/server/views";
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { done } = await readJson(req, PatchQuestRequest);
  const season = await getActiveSeason();
  const quest = db.select().from(schema.quests).where(eq(schema.quests.id, (await ctx.params).id)).get();
  if (!quest || quest.seasonId !== season.id) throw fail("NOT_FOUND", "任务不存在", 404);
  requireEditable(season, quest.chapterNo);
  const updated = db.update(schema.quests).set({ done, doneAt: done ? new Date() : null }).where(eq(schema.quests.id, quest.id)).returning().get();
  return ok(PatchQuestResponse, { quest: updated, fog: fogView(season.id, quest.chapterNo) });
});
