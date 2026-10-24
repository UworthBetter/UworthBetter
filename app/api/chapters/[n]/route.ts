import { ChapterView } from "@/lib/contracts/api";
import { handle, ok, parseChapterNo } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { toChapterView } from "@/lib/server/views";
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  return ok(ChapterView, toChapterView(await getActiveSeason(), n));
});
