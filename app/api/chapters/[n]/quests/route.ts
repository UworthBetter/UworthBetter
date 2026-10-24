// STUB → 任务卡 B8（下周任务确认）
import { ReplaceQuestsRequest, ReplaceQuestsResponse } from "@/lib/contracts/api";
import { handle, ok, parseChapterNo, readJson } from "@/lib/server/http";

export const PUT = handle(async (req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  const { quests } = await readJson(req, ReplaceQuestsRequest);
  return ok(ReplaceQuestsResponse, {
    quests: quests.map((q, i) => ({ ...q, id: `stub-q${n}-${i}`, done: false })),
  });
});
