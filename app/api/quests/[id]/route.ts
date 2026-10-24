// STUB → 任务卡 B4（任务勾选 + 迷雾）
import { PatchQuestRequest, PatchQuestResponse } from "@/lib/contracts/api";
import { fail, handle, ok, readJson } from "@/lib/server/http";
import { stubFog, stubSeasonView } from "@/lib/server/stubs";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { done } = await readJson(req, PatchQuestRequest);
  const cur = stubSeasonView().current;
  const quests = cur.quests.map((q) => (q.id === id ? { ...q, done } : q));
  const quest = quests.find((q) => q.id === id);
  if (!quest) throw fail("NOT_FOUND", "任务不存在", 404);
  return ok(PatchQuestResponse, { quest, fog: stubFog(cur.no, quests) });
});
