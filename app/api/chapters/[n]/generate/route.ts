// STUB → 任务卡 B7（章节生成编排）
import { GenerateResponse } from "@/lib/contracts/api";
import { handle, ok, parseChapterNo } from "@/lib/server/http";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ n: string }> }) => {
  const n = parseChapterNo((await ctx.params).n);
  return ok(GenerateResponse, { jobId: `stub-chapter-${n}` }, { status: 202 });
});
