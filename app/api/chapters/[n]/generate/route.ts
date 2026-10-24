import { GenerateResponse } from "@/lib/contracts/api";
import { env } from "@/lib/env";
import { handle, ok, parseChapterNo } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { startChapter } from "@/lib/server/pipeline/chapter";
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  return ok(GenerateResponse, { jobId: startChapter(await getActiveSeason(), n, env.DEMO_MODE && env.DEMO_CACHED_GENERATE) }, { status: 202 });
});
