/**
 * 契约测试：直接调用 Route Handler，用契约 schema 校验响应。
 * B 轨道把桩替换成真实实现后，这些测试必须继续通过（必要时先 seed 数据）。
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as C from "@/lib/contracts";
import { JobEvent } from "@/lib/contracts/events";

const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
const jsonReq = (method: string, body: unknown) =>
  new Request("http://test/x", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const formReq = (data: unknown) => {
  const fd = new FormData();
  fd.set("data", JSON.stringify(data));
  return new Request("http://test/x", { method: "POST", body: fd });
};
const emptyReq = () => new Request("http://test/x");

async function expectOk<T>(res: Response, schema: z.ZodType<T>, status = 200): Promise<T> {
  const body = await res.json();
  expect(res.status, JSON.stringify(body)).toBe(status);
  return schema.parse(body);
}

describe("API 契约", () => {
  it("GET /api/me", async () => {
    const { GET } = await import("@/app/api/me/route");
    await expectOk(await GET(), C.MeResponse);
  });

  it("GET /api/season", async () => {
    const { GET } = await import("@/app/api/season/route");
    await expectOk(await GET(), C.SeasonView);
  });

  it("GET /api/future-self", async () => {
    const { GET } = await import("@/app/api/future-self/route");
    await expectOk(await GET(), C.FutureSelfView);
  });

  it("POST /api/onboarding", async () => {
    const { POST } = await import("@/app/api/onboarding/route");
    const { fxOnboarding } = await import("@/fixtures");
    await expectOk(await POST(formReq(fxOnboarding.input)), C.OnboardingResponse, 202);
  });

  it("POST /api/onboarding 校验失败 → 400 VALIDATION", async () => {
    const { POST } = await import("@/app/api/onboarding/route");
    const err = await expectOk(await POST(formReq({ goal: "x" })), C.ApiError, 400);
    expect(err.error.code).toBe("VALIDATION");
  });

  it("PATCH /api/quests/:id", async () => {
    const { GET } = await import("@/app/api/season/route");
    const season = C.SeasonView.parse(await (await GET()).json());
    const q = season.current.quests.find((x) => !x.done)!;
    const { PATCH } = await import("@/app/api/quests/[id]/route");
    const r = await expectOk(await PATCH(jsonReq("PATCH", { done: true }), params({ id: q.id })), C.PatchQuestResponse);
    expect(r.fog.rate).toBeGreaterThan(season.current.fog.rate);
  });

  it("GET/POST /api/logs（含危机检测）", async () => {
    const { GET, POST } = await import("@/app/api/logs/route");
    await expectOk(await GET(new Request("http://test/api/logs?chapter=2")), C.ListLogsResponse);
    const r = await expectOk(await POST(formReq({ note: "今天不想活了", mood: 1 })), C.CreateLogResponse);
    expect(r.crisis).toBeDefined();
  });

  it("采访 / 生成 / 下周任务", async () => {
    const iv = await import("@/app/api/chapters/[n]/interview/route");
    await expectOk(await iv.GET(emptyReq(), params({ n: "2" })), C.InterviewQuestions);
    await expectOk(await iv.POST(jsonReq("POST", { answers: ["a", "", "c"] }), params({ n: "2" })), C.OkResponse);
    const gen = await import("@/app/api/chapters/[n]/generate/route");
    await expectOk(await gen.POST(emptyReq(), params({ n: "2" })), C.GenerateResponse, 202);
    const qs = await import("@/app/api/chapters/[n]/quests/route");
    const { fxChapterPlan } = await import("@/fixtures");
    await expectOk(
      await qs.PUT(jsonReq("PUT", { quests: fxChapterPlan.nextWeekQuests }), params({ n: "3" })),
      C.ReplaceQuestsResponse,
    );
  });

  it("GET /api/chapters/:n（已完成 / 未解锁 / 越界）", async () => {
    const { GET } = await import("@/app/api/chapters/[n]/route");
    await expectOk(await GET(emptyReq(), params({ n: "1" })), C.ChapterView);
    const locked = await expectOk(await GET(emptyReq(), params({ n: "5" })), C.ApiError, 409);
    expect(locked.error.code).toBe("CHAPTER_LOCKED");
    await expectOk(await GET(emptyReq(), params({ n: "99" })), C.ApiError, 404);
  });

  it("GET /api/shelf", async () => {
    const { GET } = await import("@/app/api/shelf/route");
    await expectOk(await GET(), C.ShelfResponse);
  });

  it("Demo 接口", async () => {
    await expectOk(await (await import("@/app/api/demo/seed/route")).POST(), C.SeedResponse);
    await expectOk(await (await import("@/app/api/demo/fast-forward/route")).POST(jsonReq("POST", { rate: 0.5 })), C.SeasonView);
    await expectOk(await (await import("@/app/api/demo/reset/route")).POST(), C.OkResponse);
  });
});

async function readSse(res: Response) {
  expect(res.headers.get("content-type")).toContain("text/event-stream");
  const text = await res.text();
  return text
    .split("\n\n")
    .filter((b) => b.startsWith("data: "))
    .map((b) => JobEvent.parse(JSON.parse(b.slice(6))));
}

describe("SSE 契约", () => {
  it("建档事件序列以 done 结束，且包含所有 step", async () => {
    const { GET } = await import("@/app/api/jobs/[id]/events/route");
    const events = await readSse(await GET(emptyReq(), params({ id: "stub-onboarding" })));
    expect(events.at(-1)).toMatchObject({ type: "done", redirect: "/reveal" });
    const done = new Set(events.flatMap((e) => (e.type === "step" && e.status === "done" ? [e.step] : [])));
    for (const s of C.OnboardingStep.options) expect(done.has(s), s).toBe(true);
  });

  it("章节事件序列以 done 结束，body done 携带完整正文", async () => {
    const { GET } = await import("@/app/api/jobs/[id]/events/route");
    const events = await readSse(await GET(emptyReq(), params({ id: "stub-chapter-2" })));
    expect(events.at(-1)).toMatchObject({ type: "done" });
    const body = events.find((e) => e.type === "step" && e.step === "body" && e.status === "done");
    expect(body?.type === "step" && String(body.data?.bodyMd)).toContain("<!--panel:3-->");
  });
});
