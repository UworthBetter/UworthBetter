/**
 * 前端类型化 API 客户端。所有页面/组件只能通过这里访问后端。
 * 开发环境下用契约 schema 校验响应：后端返回不符合契约会立即在控制台报错。
 */
import { z } from "zod";
import {
  ApiError,
  ChapterView,
  CreateLogResponse,
  FutureSelfView,
  GenerateResponse,
  InterviewQuestions,
  ListLogsResponse,
  MeResponse,
  OkResponse,
  OnboardingResponse,
  PatchQuestResponse,
  ReplaceQuestsResponse,
  SeasonView,
  SeedResponse,
  ShelfResponse,
  type CreateLogRequest,
  type ErrorCode,
  type FastForwardRequest,
  type OnboardingRequest,
  type Quest,
} from "@/lib/contracts";
import { JobEvent } from "@/lib/contracts/events";

export class ApiClientError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const isDev = process.env.NODE_ENV !== "production";

async function request<T>(schema: z.ZodType<T>, url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "same-origin" });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = ApiError.safeParse(body);
    if (err.success) throw new ApiClientError(err.data.error.code, err.data.error.message, res.status);
    throw new ApiClientError("INTERNAL", `HTTP ${res.status}`, res.status);
  }
  if (!isDev) return body as T;
  const r = schema.safeParse(body);
  if (!r.success) {
    console.error(`[契约不一致] ${url}\n${z.prettifyError(r.error)}`);
    throw new ApiClientError("INTERNAL", "响应不符合契约", res.status);
  }
  return r.data;
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

function multipart(data: unknown, fileField: string, file?: File | Blob | null): RequestInit {
  const fd = new FormData();
  fd.set("data", JSON.stringify(data));
  if (file) fd.set(fileField, file);
  return { method: "POST", body: fd };
}

export const api = {
  me: () => request(MeResponse, "/api/me"),
  season: () => request(SeasonView, "/api/season"),
  futureSelf: () => request(FutureSelfView, "/api/future-self"),

  onboarding: (data: OnboardingRequest, selfie?: File | Blob | null) =>
    request(OnboardingResponse, "/api/onboarding", multipart(data, "selfie", selfie)),

  patchQuest: (id: string, done: boolean) =>
    request(PatchQuestResponse, `/api/quests/${encodeURIComponent(id)}`, json("PATCH", { done })),

  listLogs: (chapter: number) => request(ListLogsResponse, `/api/logs?chapter=${chapter}`),
  createLog: (data: CreateLogRequest, photo?: File | Blob | null) =>
    request(CreateLogResponse, "/api/logs", multipart(data, "photo", photo)),

  interviewQuestions: (n: number) => request(InterviewQuestions, `/api/chapters/${n}/interview`),
  submitInterview: (n: number, answers: string[]) =>
    request(OkResponse, `/api/chapters/${n}/interview`, json("POST", { answers })),

  generateChapter: (n: number) => request(GenerateResponse, `/api/chapters/${n}/generate`, { method: "POST" }),
  chapter: (n: number) => request(ChapterView, `/api/chapters/${n}`),
  replaceQuests: (n: number, quests: Quest[]) =>
    request(ReplaceQuestsResponse, `/api/chapters/${n}/quests`, json("PUT", { quests })),

  shelf: () => request(ShelfResponse, "/api/shelf"),

  demo: {
    seed: () => request(SeedResponse, "/api/demo/seed", { method: "POST" }),
    fastForward: (data: FastForwardRequest = {}) => request(SeasonView, "/api/demo/fast-forward", json("POST", data)),
    reset: () => request(OkResponse, "/api/demo/reset", { method: "POST" }),
  },
};

/** 订阅任务事件（SSE）。出错时关掉连接，由 useJob 决定要不要重连。 */
export function subscribeJob(jobId: string, onEvent: (e: JobEvent) => void, onError?: (e: Event) => void): () => void {
  const es = new EventSource(`/api/jobs/${encodeURIComponent(jobId)}/events`);
  es.onmessage = (msg) => {
    const parsed = JobEvent.safeParse(JSON.parse(msg.data));
    if (!parsed.success) {
      console.error("[契约不一致] JobEvent", z.prettifyError(parsed.error));
      return;
    }
    onEvent(parsed.data);
    if (parsed.data.type === "done" || parsed.data.type === "error") es.close();
  };
  es.onerror = (e) => {
    es.close();
    onError?.(e);
  };
  return () => es.close();
}

/** 与未来的你对话。响应是 SSE，不是 JSON。 */
export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/future/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    credentials: "same-origin",
    body: JSON.stringify({ messages: messages.slice(-30) }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body: unknown = await res.json().catch(() => null);
    const err = ApiError.safeParse(body);
    if (err.success) throw new ApiClientError(err.data.error.code, err.data.error.message, res.status);
    throw new ApiClientError("INTERNAL", `HTTP ${res.status}`, res.status);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const parsed = JobEvent.safeParse(JSON.parse(line.slice(6)));
      if (!parsed.success) continue;
      if (parsed.data.type === "delta") onDelta(parsed.data.text);
      if (parsed.data.type === "error") throw new ApiClientError("AI_FAILED", parsed.data.message, 500);
    }
  }
}
