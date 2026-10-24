// STUB → 任务卡 B6（周末采访）
import { InterviewAnswers, InterviewQuestions, OkResponse } from "@/lib/contracts/api";
import { handle, ok, parseChapterNo, readJson } from "@/lib/server/http";
import { fxInterview } from "@/fixtures";

type Ctx = { params: Promise<{ n: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  parseChapterNo((await ctx.params).n);
  return ok(InterviewQuestions, { questions: [...fxInterview.questions] });
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  parseChapterNo((await ctx.params).n);
  await readJson(req, InterviewAnswers);
  return ok(OkResponse, { ok: true });
});
