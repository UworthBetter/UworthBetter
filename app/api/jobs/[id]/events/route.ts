import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db/client";
import { fail, handle } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";
import { subscribeJob } from "@/lib/server/jobs";
import { sseResponse } from "@/lib/server/sse";
import { assertDemo } from "@/lib/server/demoGuard";
import { stubChapterEvents, stubOnboardingEvents } from "@/lib/server/stubs";
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (id === "stub-onboarding" || /^stub-chapter-([1-9]|1[0-3])$/.test(id)) {
    assertDemo();
    return sseResponse(id === "stub-onboarding" ? stubOnboardingEvents() : stubChapterEvents(Number(id.slice(13))), req.signal);
  }
  const user = await getCurrentUser();
  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get();
  if (!job) throw fail("NOT_FOUND", "任务不存在", 404);
  const seasonId = job.type === "onboarding" ? job.refId : db.select().from(schema.chapters).where(eq(schema.chapters.id, job.refId)).get()?.seasonId;
  const season = seasonId ? db.select().from(schema.seasons).where(eq(schema.seasons.id, seasonId)).get() : undefined;
  if (!season || season.userId !== user.id) throw fail("NOT_FOUND", "任务不存在", 404);
  return sseResponse(subscribeJob(id, req.signal), req.signal);
});
