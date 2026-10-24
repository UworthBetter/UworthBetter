import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { JobEvent, type JobType } from "@/lib/contracts/events";
import { db, schema } from "@/lib/server/db/client";
import { fail } from "@/lib/server/http";

export type JobContext = { emit: (event: JobEvent) => void };
type Listener = (event: JobEvent) => void;
const state = globalThis as unknown as { __storyJobs?: Map<string, Set<Listener>> };
const listeners = state.__storyJobs ??= new Map();

export function createJob(type: JobType, refId: string, runner: (ctx: JobContext) => Promise<void>): string {
  const id = nanoid(24);
  db.insert(schema.jobs).values({ id, type, refId }).run();
  listeners.set(id, new Set());
  const starts = new Map<string, number>();
  const emit = (raw: JobEvent) => {
    const event = JobEvent.parse(raw);
    if (event.type === "step") {
      if (event.status === "running") starts.set(event.step, Date.now());
      else if (starts.has(event.step)) event.data = { ...event.data, durationMs: Date.now() - starts.get(event.step)! };
    }
    const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get();
    if (!job || job.status === "done" || job.status === "error") return;
    if (event.type !== "delta") {
      db.update(schema.jobs).set({
        events: [...job.events, event],
        status: event.type === "done" ? "done" : event.type === "error" ? "error" : "running",
        error: event.type === "error" ? event.message : null,
      }).where(eq(schema.jobs.id, id)).run();
    }
    for (const listener of listeners.get(id) ?? []) listener(event);
    if (event.type === "done" || event.type === "error") listeners.delete(id);
  };
  // Node 持久进程中执行；与 SSE 连接生命周期无关。
  setImmediate(async () => {
    if (!db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get()) return;
    db.update(schema.jobs).set({ status: "running" }).where(eq(schema.jobs.id, id)).run();
    try {
      await runner({ emit });
      const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get();
      if (job?.status === "running") emit({ type: "done" });
    } catch (error) {
      console.error("生成任务失败", id, error);
      emit({ type: "error", code: "AI_FAILED", message: "生成失败，请重试" });
    }
  });
  return id;
}

export function subscribeJob(id: string, signal?: AbortSignal): AsyncIterableIterator<JobEvent> {
  const job = db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).get();
  if (!job) throw fail("NOT_FOUND", "任务不存在", 404);
  // 同步读取与注册，避免重放结束到订阅之间漏掉事件。
  const queue: JobEvent[] = [...job.events];
  let pending: ((result: IteratorResult<JobEvent>) => void) | undefined;
  let closed = false;
  const listener: Listener = (event) => {
    if (closed) return;
    if (pending) {
      const resolve = pending; pending = undefined; resolve({ done: false, value: event });
      if (event.type === "done" || event.type === "error") abort();
    }
    else queue.push(event);
  };
  const live = listeners.get(id);
  live?.add(listener);
  const abort = () => {
    closed = true;
    live?.delete(listener);
    signal?.removeEventListener("abort", abort);
    pending?.({ done: true, value: undefined });
    pending = undefined;
  };
  signal?.addEventListener("abort", abort, { once: true });
  return {
    [Symbol.asyncIterator]() { return this; },
    async next() {
      if (closed || signal?.aborted) { abort(); return { done: true, value: undefined }; }
      const event = queue.shift();
      if (event) {
        if (event.type === "done" || event.type === "error") abort();
        return { done: false, value: event };
      }
      if (!live) { abort(); return { done: true, value: undefined }; }
      return new Promise<IteratorResult<JobEvent>>((resolve) => { pending = resolve; });
    },
    async return() { abort(); return { done: true, value: undefined }; },
  };
}
