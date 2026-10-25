/**
 * 端到端：真实 provider（指向本地模拟的 OpenAI 兼容服务）驱动 建档 → 采访 → 章节生成 三条管线，
 * 确认真实模型的输出能完整落库，且图片、正文、来信都来自"模型"而不是 mock。
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as C from "@/lib/contracts";
import { db, schema } from "@/lib/server/db/client";
import { getActiveSeason, getCurrentUser } from "@/lib/server/session";
import { subscribeJob } from "@/lib/server/jobs";
import { env } from "@/lib/env";
import { fxOnboarding } from "@/fixtures";
import { happyRoute, preparePng, startFake, system, type Fake } from "@/tests/helpers/fakeOpenAI";

const session = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (key: string) => session.values.has(key) ? { value: session.values.get(key) } : undefined,
  set: (key: string, value: string) => session.values.set(key, value),
}) }));

const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
const req = () => new Request("http://test/x");
const json = (body: unknown) => new Request("http://test/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const form = (data: unknown) => {
  const body = new FormData(); body.set("data", JSON.stringify(data));
  return new Request("http://test/x", { method: "POST", body });
};
async function body(res: Response, status = 200) {
  const data = await res.json(); expect(res.status, JSON.stringify(data)).toBe(status); return data;
}
async function finish(jobId: string) {
  const events: C.JobEvent[] = [];
  for await (const event of subscribeJob(jobId)) events.push(C.JobEvent.parse(event));
  return events;
}

let fake: Fake;
const saved = { ...env };
beforeAll(async () => {
  fake = await startFake();
  await preparePng();
  fake.route = happyRoute;
  Object.assign(env, {
    AI_TEXT_PROVIDER: "openai-compat", OPENAI_COMPAT_BASE_URL: fake.base, OPENAI_COMPAT_API_KEY: "test-key",
    AI_IMAGE_PROVIDER: "openai", IMAGE_BASE_URL: fake.base, IMAGE_API_KEY: "img-key",
    AI_TEXT_TIMEOUT_MS: 2000, AI_FAST_TIMEOUT_MS: 2000, AI_STREAM_TIMEOUT_MS: 2000, AI_IMAGE_TIMEOUT_MS: 2000, DEMO_CACHED_GENERATE: false,
  });
});
afterAll(() => {
  Object.assign(env, saved);
  fake.close();
});
beforeEach(() => {
  session.values.clear();
  fake.calls.length = 0;
});

describe("真实模型驱动整条管线", () => {
  it("建档 → 采访 → 第 1 章生成，全部来自模型并落库", async () => {
    await getCurrentUser();
    const onboarding = await import("@/app/api/onboarding/route");
    const started = C.OnboardingResponse.parse(await body(await onboarding.POST(form(fxOnboarding.input)), 202));
    const events = await finish(started.jobId);
    expect(events.at(-1)).toEqual({ type: "done", redirect: "/reveal" });
    for (const step of C.OnboardingStep.options) expect(events.some((e) => e.type === "step" && e.step === step && e.status === "done")).toBe(true);
    const tasks = fake.calls.map((c) => (c.path.endsWith("/images/generations") ? "image" : system(c).slice(0, 12)));
    expect(tasks.filter((t) => t === "image")).toHaveLength(3); // 两张设定图 + 第 1 章封面
    expect(fake.calls.filter((c) => c.body.stream)).toHaveLength(1); // 第一封信

    const season = await getActiveSeason();
    expect(season.firstLetterMd).toContain("这周你画了五张速写");
    const self = db.select().from(schema.futureSelves).where(eq(schema.futureSelves.id, season.futureSelfId!)).get()!;
    expect(self.profile.name).toBe(fxOnboarding.input.futureName);
    expect(self.sheetFutureUrl).toMatch(/^\/generated\//);

    const iv = await import("@/app/api/chapters/[n]/interview/route");
    const { questions } = C.InterviewQuestions.parse(await body(await iv.GET(req(), params({ n: "1" }))));
    expect(questions).toHaveLength(3);
    await body(await iv.POST(json({ answers: ["画了三张", "", "想多练习"] }), params({ n: "1" })));

    fake.calls.length = 0;
    const gen = await import("@/app/api/chapters/[n]/generate/route");
    const { jobId } = C.GenerateResponse.parse(await body(await gen.POST(req(), params({ n: "1" })), 202));
    expect((await finish(jobId)).at(-1)).toEqual({ type: "done", redirect: "/chapter/1" });
    expect(fake.calls.filter((c) => c.path.endsWith("/images/generations"))).toHaveLength(5); // 本章封面建档时已生成 → 4 格分镜 + 下一章封面
    const chapter = C.ChapterView.parse(await body(await (await import("@/app/api/chapters/[n]/route")).GET(req(), params({ n: "1" }))));
    expect(chapter.title).toBe("真实模型写的章节");
    expect(chapter.bodyMd).toContain("第一段");
    for (let i = 0; i < 4; i++) expect(chapter.bodyMd).toContain(`<!--panel:${i}-->`);
    expect(chapter.panels.every((p) => p.imageUrl?.startsWith("/generated/"))).toBe(true);
    expect((await getActiveSeason()).currentChapter).toBe(2);
  });
});
