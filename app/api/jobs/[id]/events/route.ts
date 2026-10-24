// STUB → 任务卡 B0（Job runner + SSE 重放）
// 桩：jobId = "stub-onboarding" 回放建档事件；"stub-chapter-<n>" 回放章节事件。
import { fail, handle } from "@/lib/server/http";
import { sseResponse } from "@/lib/server/sse";
import { stubChapterEvents, stubOnboardingEvents } from "@/lib/server/stubs";

export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (id === "stub-onboarding") return sseResponse(stubOnboardingEvents(), req.signal);
  const m = id.match(/^stub-chapter-(\d+)$/);
  if (m) return sseResponse(stubChapterEvents(Number(m[1])), req.signal);
  throw fail("NOT_FOUND", "任务不存在", 404);
});
