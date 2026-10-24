import { eq } from "drizzle-orm";
import { OnboardingRequest, OnboardingResponse } from "@/lib/contracts/api";
import { OnboardingInput } from "@/lib/contracts/ai";
import { toDateStr } from "@/lib/domain/progress";
import { db, schema } from "@/lib/server/db/client";
import { fail, handle, ok, readMultipart } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";
import { deleteImage, saveUpload } from "@/lib/server/storage";
import { startOnboarding } from "@/lib/server/pipeline/onboarding";
export const POST = handle(async (req: Request) => {
  const { data, file } = await readMultipart(req, OnboardingRequest, "selfie");
  const user = await getCurrentUser();
  const hasRunning = () => db.select().from(schema.seasons).where(eq(schema.seasons.userId, user.id)).all()
    .some((s) => s.status === "onboarding" && db.select().from(schema.jobs).all().some((j) => j.refId === s.id && ["running", "queued"].includes(j.status)));
  if (hasRunning() || db.select().from(schema.chapters).all().some((c) => c.status === "generating" && db.select().from(schema.seasons).where(eq(schema.seasons.id, c.seasonId)).get()?.userId === user.id)) {
    throw fail("ALREADY_GENERATING", "已有生成任务正在进行", 409);
  }
  const selfieUrl = file ? await saveUpload(file) : undefined;
  if (hasRunning()) {
    if (selfieUrl) await deleteImage(selfieUrl);
    throw fail("ALREADY_GENERATING", "建档正在进行", 409);
  }
  const input = OnboardingInput.parse({ ...data, selfieUrl });
  const season = db.insert(schema.seasons).values({ userId: user.id, style: data.style, timeBudget: data.timeBudget,
    onboardingInput: OnboardingInput.parse(data), startDate: toDateStr(new Date()) }).returning().get();
  db.update(schema.users).set({ activeSeasonId: season.id, nickname: data.nickname ?? user.nickname }).where(eq(schema.users.id, user.id)).run();
  return ok(OnboardingResponse, { seasonId: season.id, jobId: startOnboarding(season.id, input) }, { status: 202 });
});
