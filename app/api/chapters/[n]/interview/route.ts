import { eq } from "drizzle-orm";
import { InterviewAnswers, InterviewQuestions, OkResponse } from "@/lib/contracts/api";
import { getAITasks } from "@/lib/ai/tasks";
import { db, schema } from "@/lib/server/db/client";
import { buildSafeChapterContext } from "@/lib/server/context";
import { fail, handle, ok, parseChapterNo, readJson } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { getChapter, requireEditable } from "@/lib/server/records";
type Context = { params: Promise<{ n: string }> };
export const GET = handle(async (_req: Request, ctx: Context) => {
  const n = parseChapterNo((await ctx.params).n);
  const season = await getActiveSeason();
  const chapter = requireEditable(season, n);
  if (!chapter.interview) {
    const { questions } = InterviewQuestions.parse({ questions: await getAITasks().genInterviewQuestions(await buildSafeChapterContext(season.id, n)) });
    requireEditable(season, n);
    // 并发请求以第一个已写入的版本为准。
    if (!getChapter(season.id, n).interview) db.update(schema.chapters).set({ interview: questions.map((q) => ({ q, a: "" })) }).where(eq(schema.chapters.id, chapter.id)).run();
  }
  return ok(InterviewQuestions, { questions: getChapter(season.id, n).interview!.map((qa) => qa.q) });
});
export const POST = handle(async (req: Request, ctx: Context) => {
  const n = parseChapterNo((await ctx.params).n);
  const { answers } = await readJson(req, InterviewAnswers);
  const season = await getActiveSeason();
  const chapter = requireEditable(season, n);
  if (!chapter.interview) throw fail("VALIDATION", "请先获取采访问题", 400);
  db.update(schema.chapters).set({ interview: chapter.interview.map((qa, i) => ({ q: qa.q, a: answers[i] })) }).where(eq(schema.chapters.id, chapter.id)).run();
  return ok(OkResponse, { ok: true });
});
