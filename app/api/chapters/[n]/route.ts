// STUB → 任务卡 B9（章节视图）
import { ChapterView } from "@/lib/contracts/api";
import { fail, handle, ok, parseChapterNo } from "@/lib/server/http";
import { stubChapterView, stubSeasonView } from "@/lib/server/stubs";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  if (n >= stubSeasonView().season.currentChapter) throw fail("CHAPTER_LOCKED", "章节尚未完成", 409);
  return ok(ChapterView, stubChapterView(n));
});
