import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createJob, subscribeJob } from "@/lib/server/jobs";
import { db, schema } from "@/lib/server/db/client";
import type { JobEvent } from "@/lib/contracts/events";
import { ensureServerRecovery, recoverInterruptedJobs } from "@/lib/server/db/recovery";
describe("Job runner", () => {
  it("启动恢复中断任务，保留已完成任务并允许章节重试", () => {
    const user = db.insert(schema.users).values({}).returning().get();
    const season = db.insert(schema.seasons).values({ userId: user.id, style: "healing", timeBudget: "15m", onboardingInput: {}, startDate: "2026-10-24" }).returning().get();
    const chapter = db.insert(schema.chapters).values({ seasonId: season.id, chapterNo: 1, title: "测试", status: "generating", activeJobId: "interrupted" }).returning().get();
    db.insert(schema.jobs).values({ id: "interrupted", type: "chapter", refId: chapter.id, status: "running" }).run();
    recoverInterruptedJobs(db);
    const recovered = db.select().from(schema.chapters).where(eq(schema.chapters.id, chapter.id)).get()!;
    expect(recovered.status).toBe("in_progress"); expect(recovered.activeJobId).toBeNull();
    const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, "interrupted")).get()!;
    expect(job.status).toBe("error"); expect(job.events.at(-1)).toMatchObject({ type: "error", code: "AI_FAILED" });
    ensureServerRecovery(db);
    db.update(schema.chapters).set({ status: "generating", activeJobId: "live" }).where(eq(schema.chapters.id, chapter.id)).run();
    db.insert(schema.jobs).values({ id: "live", type: "chapter", refId: chapter.id, status: "running" }).run();
    ensureServerRecovery(db);
    expect(db.select().from(schema.jobs).where(eq(schema.jobs.id, "live")).get()?.status).toBe("running");
  });
  it("晚连接完整重放持久化步骤；多个订阅者可同时接收", async () => {
    let proceed!: () => void;
    const gate = new Promise<void>((resolve) => { proceed = resolve; });
    const id = createJob("onboarding", "test", async ({ emit }) => {
      emit({ type: "step", step: "profile", status: "done" }); await gate;
      emit({ type: "delta", target: "letter", text: "内容" });
      emit({ type: "step", step: "letter", status: "done", data: { letterMd: "内容" } }); emit({ type: "done" });
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const collect = async () => { const events: JobEvent[] = []; for await (const e of subscribeJob(id)) events.push(e); return events; };
    const a = collect(), b = collect(); proceed(); expect(await a).toEqual(await b);
    const late = await collect(); expect(late).toHaveLength(3); expect(late.some((e) => e.type === "delta")).toBe(false);
    expect(db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get()?.status).toBe("done");
  });
  it("客户端断开不取消后台任务；失败事件持久化", async () => {
    const abort = new AbortController();
    const id = createJob("chapter", "test", async () => { throw new Error("failure"); });
    const iterator = subscribeJob(id, abort.signal)[Symbol.asyncIterator]();
    abort.abort(); expect((await iterator.next()).done).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const events = []; for await (const event of subscribeJob(id)) events.push(event);
    expect(events.at(-1)).toMatchObject({ type: "error", code: "AI_FAILED" });
  });
});
