import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as C from "@/lib/contracts";
import { db, schema } from "@/lib/server/db/client";
import { seedDemo } from "@/lib/server/demo";
import { getCurrentUser, getActiveSeason } from "@/lib/server/session";
import { subscribeJob } from "@/lib/server/jobs";
import { getAITasks } from "@/lib/ai/tasks";
import { env } from "@/lib/env";
import { fxChapterBodyMd, fxChapterLetterMd, fxChapterPlan, fxInterview, fxOnboarding } from "@/fixtures";
import { startChapter } from "@/lib/server/pipeline/chapter";
import { buildSafeChapterContext } from "@/lib/server/context";
import { getChapter } from "@/lib/server/records";
import type { DemoSeasonData } from "@/lib/server/demoData";

const session = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (key: string) => session.values.has(key) ? { value: session.values.get(key) } : undefined,
  set: (key: string, value: string) => session.values.set(key, value),
}) }));

// seed/demo-season.json 生成中，运行时 demoSeason() 可能为 null：用可切换的假预烘季注入。
const demoDataState = vi.hoisted(() => ({ season: null as DemoSeasonData | null }));
vi.mock("@/lib/server/demoData", () => ({
  demoSeason: () => demoDataState.season,
  demoChapter: (no: number) => demoDataState.season?.chapters.find((c) => c.no === no),
}));

/** 用 fixtures 拼出的最小假预烘季：满足 DemoSeasonData 形状，13 章循环复用同一份预烘内容。 */
const fakeBakedSeason: DemoSeasonData = {
  seasonTitle: fxOnboarding.bible.seasonTitle,
  logline: fxOnboarding.bible.logline,
  sheets: { future: "/stub/sheet-future.png", present: "/stub/sheet-present.png" },
  chapters: Array.from({ length: 13 }, (_, i) => {
    const no = i + 1;
    return {
      no,
      chapterType: "highlight",
      completionRate: 1,
      title: `预烘第${no}章`,
      questions: [...fxInterview.questions],
      answers: [...fxInterview.answers],
      quests: fxOnboarding.roadmap.week1Quests.map((q) => ({ ...q })),
      logs: [
        { day: 1, note: "预烘日志：画完一张速写", mood: 4 },
        { day: 3, note: "预烘日志：整理了这周的草稿", mood: 5 },
      ],
      plan: fxChapterPlan,
      // 加注释标记，区分预烘正文与 fixture/mock 正文。
      bodyMd: `${fxChapterBodyMd()}\n<!--demo:baked:${no}-->`,
      letterMd: `${fxChapterLetterMd()}\n<!--demo:baked-letter:${no}-->`,
      cover: `/stub/demo-cover-${no}.png`,
      panels: [0, 1, 2, 3].map((idx) => `/stub/demo-panel-${no}-${idx}.png`),
      nextCover: no < 13 ? `/stub/demo-cover-${no + 1}.png` : null,
    };
  }),
};

const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
const req = () => new Request("http://test/x");
const json = (method: string, body: unknown) => new Request("http://test/x", {
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const form = (data: unknown, file?: File) => {
  const body = new FormData(); body.set("data", JSON.stringify(data));
  if (file) body.set("photo", file);
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

beforeEach(async () => {
  session.values.clear();
  db.delete(schema.jobs).run(); db.delete(schema.seasons).run();
  db.delete(schema.futureSelves).run(); db.delete(schema.users).run();
  vi.restoreAllMocks(); seedDemo((await getCurrentUser()).id);
});

describe("持久化 API 契约", () => {
  it("匿名会话复用；未知 cookie 创建新用户；未建档返回 NO_SEASON", async () => {
    const { GET } = await import("@/app/api/me/route");
    const first = C.MeResponse.parse(await body(await GET()));
    expect(first.userId).toBe((await getCurrentUser()).id);
    expect(C.MeResponse.parse(await body(await GET())).userId).toBe(first.userId);
    session.values.set("uid", "forged-id");
    const fresh = C.MeResponse.parse(await body(await GET()));
    expect(fresh.userId).not.toBe("forged-id"); expect(fresh.seasonId).toBeNull();
    expect((await body(await (await import("@/app/api/season/route")).GET(), 404)).error.code).toBe("NO_SEASON");
  });

  it("季视图、人格卡、书架、章节均来自数据库", async () => {
    const season = C.SeasonView.parse(await body(await (await import("@/app/api/season/route")).GET()));
    expect(season.current.no).toBe(4); expect(season.chapters.filter((c) => c.status === "ready")).toHaveLength(3);
    C.FutureSelfView.parse(await body(await (await import("@/app/api/future-self/route")).GET()));
    C.ShelfResponse.parse(await body(await (await import("@/app/api/shelf/route")).GET()));
    const { GET } = await import("@/app/api/chapters/[n]/route");
    const chapter = C.ChapterView.parse(await body(await GET(req(), params({ n: "3" }))));
    expect(chapter.type).toBe("low"); expect(chapter.completionRate).toBe(.2);
    expect((await body(await GET(req(), params({ n: "5" })), 409)).error.code).toBe("CHAPTER_LOCKED");
    await body(await GET(req(), params({ n: "99" })), 404);
  });

  it("任务持久化并更新迷雾；禁止跨用户和历史任务修改", async () => {
    const season = C.SeasonView.parse(await body(await (await import("@/app/api/season/route")).GET()));
    const quest = season.current.quests.find((q) => !q.done)!;
    const { PATCH } = await import("@/app/api/quests/[id]/route");
    const patched = C.PatchQuestResponse.parse(await body(await PATCH(json("PATCH", { done: true }), params({ id: quest.id }))));
    expect(patched.fog.rate).toBeGreaterThan(season.current.fog.rate);
    expect(db.select().from(schema.quests).where(eq(schema.quests.id, quest.id)).get()?.done).toBe(true);
    const historical = db.select().from(schema.quests).all().find((q) => q.chapterNo === 1)!;
    await body(await PATCH(json("PATCH", { done: false }), params({ id: historical.id })), 409);
    session.values.clear(); seedDemo((await getCurrentUser()).id);
    await body(await PATCH(json("PATCH", { done: true }), params({ id: quest.id })), 404);
  });

  it("每日可写多条记录；危机响应；非法照片与请求返回 400", async () => {
    const { GET, POST } = await import("@/app/api/logs/route");
    const first = C.CreateLogResponse.parse(await body(await POST(form({ note: "今天不想活了", mood: 1 }))));
    expect(first.crisis?.message).toBeTruthy(); expect(first.log.chapterNo).toBe(4);
    const next = C.CreateLogResponse.parse(await body(await POST(form({ note: "画完了一张速写", mood: 4 }))));
    expect(next.log.id).not.toBe(first.log.id);
    const logs = C.ListLogsResponse.parse(await body(await GET(new Request("http://test/api/logs?chapter=4"))));
    expect(logs.logs.some((l) => l.id === first.log.id)).toBe(true);
    await body(await POST(form({ note: "", mood: 9 })), 400);
    await body(await POST(form({ note: "照片", mood: 3 }, new File(["invalid"], "x.png", { type: "image/png" }))), 400);
    await body(await POST(json("POST", {})), 400);
    await body(await GET(new Request("http://test/api/logs?chapter=NaN")), 404);
  });

  it("mock 建档：202、全部步骤、13 章和首周任务、重放与权限", async () => {
    const { POST } = await import("@/app/api/onboarding/route");
    await body(await POST(form({ goal: "x" })), 400);
    const result = C.OnboardingResponse.parse(await body(await POST(form(fxOnboarding.input)), 202));
    await body(await POST(form(fxOnboarding.input)), 409);
    const { GET } = await import("@/app/api/jobs/[id]/events/route");
    const response = await GET(req(), params({ id: result.jobId }));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const events = (await response.text()).split("\n\n").filter((s) => s.startsWith("data: ")).map((s) => C.JobEvent.parse(JSON.parse(s.slice(6))));
    expect(events.at(-1)).toEqual({ type: "done", redirect: "/reveal" });
    for (const step of C.OnboardingStep.options) expect(events.some((e) => e.type === "step" && e.step === step && e.status === "done")).toBe(true);
    const season = await getActiveSeason(); expect(season.id).toBe(result.seasonId); expect(season.status).toBe("active");
    expect(db.select().from(schema.chapters).where(eq(schema.chapters.seasonId, result.seasonId)).all()).toHaveLength(13);
    expect(db.select().from(schema.quests).where(eq(schema.quests.seasonId, result.seasonId)).all().length).toBeGreaterThanOrEqual(3);
    expect((await finish(result.jobId)).every((e) => e.type !== "delta")).toBe(true);
    session.values.clear(); await getCurrentUser();
    await body(await GET(req(), params({ id: result.jobId })), 404);
  });

  it("采访缓存、生成锁、章节落库、下周任务与图片失败隔离", async () => {
    const iv = await import("@/app/api/chapters/[n]/interview/route");
    const questions = C.InterviewQuestions.parse(await body(await iv.GET(req(), params({ n: "4" }))));
    expect(await body(await iv.GET(req(), params({ n: "4" })))).toEqual(questions);
    await body(await iv.POST(json("POST", { answers: ["画了三张画", "", "想多练习"] }), params({ n: "4" })));
    vi.spyOn(getAITasks(), "genSceneImage").mockRejectedValue(new Error("模拟图像故障"));
    const gen = await import("@/app/api/chapters/[n]/generate/route");
    const result = C.GenerateResponse.parse(await body(await gen.POST(req(), params({ n: "4" })), 202));
    await body(await gen.POST(req(), params({ n: "4" })), 409);
    expect((await finish(result.jobId)).at(-1)).toMatchObject({ type: "done" });
    const view = C.ChapterView.parse(await body(await (await import("@/app/api/chapters/[n]/route")).GET(req(), params({ n: "4" }))));
    expect(view.panels).toHaveLength(4); expect(view.panels.every((p) => p.imageUrl === null)).toBe(true);
    expect(view.coverUrl).toBe("/stub/cover-4.png"); expect(view.bodyMd).toContain("<!--panel:3-->");
    expect((await getActiveSeason()).currentChapter).toBe(5);
    const qs = await import("@/app/api/chapters/[n]/quests/route");
    const replacement = C.ReplaceQuestsResponse.parse(await body(await qs.PUT(json("PUT", { quests: fxChapterPlan.nextWeekQuests }), params({ n: "5" }))));
    expect(replacement.quests.filter((q) => q.isKey)).toHaveLength(1);
    expect(replacement.quests.every((q) => q.difficulty === 1)).toBe(true);
    await body(await qs.PUT(json("PUT", { quests: fxChapterPlan.nextWeekQuests }), params({ n: "4" })), 409);
  });

  it("文本失败恢复可重试，不提前推进季进度", async () => {
    const failing = vi.spyOn(getAITasks(), "streamChapterBody").mockRejectedValueOnce(new Error("模拟文本故障"));
    const { POST } = await import("@/app/api/chapters/[n]/generate/route");
    const result = await body(await POST(req(), params({ n: "4" })), 202);
    expect((await finish(result.jobId)).at(-1)).toMatchObject({ type: "error", code: "AI_FAILED" });
    const season = await getActiveSeason(); expect(season.currentChapter).toBe(4);
    const chapter = db.select().from(schema.chapters).all().find((c) => c.seasonId === season.id && c.chapterNo === 4)!;
    expect(chapter.status).toBe("in_progress"); expect(chapter.activeJobId).toBeNull();
    failing.mockRestore();
    const retry = await body(await POST(req(), params({ n: "4" })), 202);
    expect((await finish(retry.jobId)).at(-1)).toMatchObject({ type: "done" });
  });

  it("演示快进、cached 回放、重置和 DEMO_MODE 守卫", async () => {
    const { POST } = await import("@/app/api/demo/fast-forward/route");
    const view = C.SeasonView.parse(await body(await POST(json("POST", { rate: .5 })))); expect(view.current.no).toBe(4);
    const running = C.SeasonView.parse(await body(await POST(json("POST", { cached: true, rate: 1 }))));
    expect(running.current.activeJobId).toBeTruthy();
    expect((await finish(running.current.activeJobId!)).at(-1)).toMatchObject({ type: "done" });
    await body(await (await import("@/app/api/demo/reset/route")).POST()); expect((await getCurrentUser()).activeSeasonId).toBeNull();
    C.SeedResponse.parse(await body(await (await import("@/app/api/demo/seed/route")).POST()));
    const previous = env.DEMO_MODE; env.DEMO_MODE = false;
    try { await body(await POST(json("POST", {})), 403); } finally { env.DEMO_MODE = previous; }
  });

  it("可玩演示：预烘数据第 1 周开局、跳章幂等、cached 回放预烘正文", async () => {
    const ff = await import("@/app/api/demo/fast-forward/route");
    await body(await (await import("@/app/api/demo/reset/route")).POST());
    demoDataState.season = fakeBakedSeason;
    try {
      // ① 第 1 周开局：第 1 章 in_progress + 首周任务未完成，人设图来自预烘
      C.SeedResponse.parse(await body(await (await import("@/app/api/demo/seed/route")).POST()));
      const seeded = C.SeasonView.parse(await body(await (await import("@/app/api/season/route")).GET()));
      expect(seeded.current.no).toBe(1);
      expect(seeded.chapters[0].status).toBe("in_progress");
      expect(seeded.current.quests.length).toBeGreaterThan(0);
      expect(seeded.current.quests.every((q) => !q.done)).toBe(true);
      expect(seeded.futureSelf.sheetFutureUrl).toBe("/stub/sheet-future.png");

      // ② 跳到第 5 周：1–4 章 ready 且标题来自预烘，第 5 章 in_progress + 采访预填 + 任务未完成
      const jumped = C.SeasonView.parse(await body(await ff.POST(json("POST", { chapter: 5 }))));
      expect(jumped.current.no).toBe(5);
      expect(jumped.chapters.slice(0, 4).map((c) => `${c.status}:${c.title}`)).toEqual(
        Array.from({ length: 4 }, (_, i) => `ready:预烘第${i + 1}章`));
      expect(jumped.chapters[4].status).toBe("in_progress");
      expect(jumped.current.quests.every((q) => !q.done)).toBe(true);
      const questions = C.InterviewQuestions.parse(
        await body(await (await import("@/app/api/chapters/[n]/interview/route")).GET(req(), params({ n: "5" }))));
      expect(questions.questions).toEqual([...fxInterview.questions]);

      // ③ 幂等：来回跳不报错，重跳到第 2 周后仅第 1 章 ready
      const again = C.SeasonView.parse(await body(await ff.POST(json("POST", { chapter: 2 }))));
      expect(again.current.no).toBe(2);
      expect(again.chapters.filter((c) => c.status === "ready").map((c) => c.no)).toEqual([1]);

      // ④ cached 生成本章：正文回放预烘内容（带 demo:baked 标记），分镜用预烘 URL
      await body(await ff.POST(json("POST", { cached: true, rate: 1 })));
      const season = await getActiveSeason();
      const jobId = getChapter(season.id, 2).activeJobId;
      expect(jobId).toBeTruthy();
      expect((await finish(jobId!)).at(-1)).toMatchObject({ type: "done" });
      const view = C.ChapterView.parse(await body(await (await import("@/app/api/chapters/[n]/route")).GET(req(), params({ n: "2" }))));
      expect(view.bodyMd).toContain("demo:baked:2");
      expect(view.panels.map((p) => p.imageUrl)).toEqual([0, 1, 2, 3].map((idx) => `/stub/demo-panel-2-${idx}.png`));
    } finally {
      demoDataState.season = null;
    }
  });

  it("危机记录与采访答案不进入 AI 上下文", async () => {
    const season = await getActiveSeason();
    const chapter = getChapter(season.id, 4);
    db.insert(schema.dailyLogs).values({ seasonId: season.id, chapterNo: 4, date: "2026-10-24", note: "不想活了", mood: 1 }).run();
    db.update(schema.chapters).set({ interview: [{ q: "最近好吗", a: "想自杀" }] }).where(eq(schema.chapters.id, chapter.id)).run();
    const context = await buildSafeChapterContext(season.id, 4);
    expect(context.logs.every((l) => !l.note.includes("不想活"))).toBe(true);
    expect(context.interview[0].a).toBe("");
  });

  it("第 13 章完成后季终止，没有第 14 章或下周任务", async () => {
    const season = await getActiveSeason();
    db.update(schema.seasons).set({ currentChapter: 13 }).where(eq(schema.seasons.id, season.id)).run();
    const chapter = getChapter(season.id, 13);
    db.update(schema.chapters).set({ status: "in_progress" }).where(eq(schema.chapters.id, chapter.id)).run();
    const id = startChapter(await getActiveSeason(), 13, true);
    expect((await finish(id)).at(-1)).toMatchObject({ type: "done", redirect: "/chapter/13" });
    const finished = await getActiveSeason(); expect(finished.status).toBe("finished"); expect(finished.currentChapter).toBe(13);
    const view = C.ChapterView.parse(await body(await (await import("@/app/api/chapters/[n]/route")).GET(req(), params({ n: "13" }))));
    expect(view.next).toBeNull();
    expect(db.select().from(schema.chapters).where(eq(schema.chapters.seasonId, season.id)).all()).toHaveLength(13);
    await body(await (await import("@/app/api/chapters/[n]/generate/route")).POST(req(), params({ n: "13" })), 409);
  });
});

describe("目标推荐 API 契约", () => {
  it("POST /api/goal-suggestions：建档前可调，返回 3–4 条推荐；空 seed 返回 400 VALIDATION", async () => {
    const { POST } = await import("@/app/api/goal-suggestions/route");
    const result = C.GoalSuggestResponse.parse(await body(await POST(json("POST", { seed: "画画 转行" }))));
    expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions.length).toBeLessThanOrEqual(4);
    expect((await body(await POST(json("POST", { seed: "" })), 400)).error.code).toBe("VALIDATION");
  });
});
