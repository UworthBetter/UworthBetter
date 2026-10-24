// STUB → 任务卡 B2（建档编排）
import { OnboardingRequest, OnboardingResponse } from "@/lib/contracts/api";
import { handle, ok, readMultipart } from "@/lib/server/http";

export const POST = handle(async (req: Request) => {
  await readMultipart(req, OnboardingRequest, "selfie");
  return ok(OnboardingResponse, { jobId: "stub-onboarding", seasonId: "stub-season" }, { status: 202 });
});
