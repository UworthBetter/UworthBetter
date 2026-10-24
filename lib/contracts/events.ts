/**
 * 契约：SSE 事件（GET /api/jobs/:id/events）。
 * ⚠️ 已冻结（见 CLAUDE.md「契约规则」）。
 *
 * 线格式：每个事件一行 `data: <JSON JobEvent>\n\n`；每 15s 发送心跳 `: ping\n\n`。
 * 重连：服务端先重放已持久化的 step/done/error 事件（delta 不持久化），再推送后续事件。
 *      正文以 `step: body, status: done` 携带的 data.bodyMd 为准。
 */
import { z } from "zod";

export const OnboardingStep = z.enum([
  "profile", // data: { futureSelf, seasonTitle, logline }
  "sheet_future", // data: { url }
  "sheet_present", // data: { url }
  "roadmap", // data: { acts: [{ name, milestone }] }
  "letter", // data: { letterMd }
  "cover1", // data: { url }
]);
export type OnboardingStep = z.infer<typeof OnboardingStep>;

export const ChapterStep = z.enum([
  "plan", // data: { title, chapterType, panels: [{ idx, narration, dialogues }] }
  "body", // data: { bodyMd }
  "cover", // data: { url }
  "panel0",
  "panel1",
  "panel2",
  "panel3", // data: { url }
  "letter", // data: { letterMd }
  "next_cover", // data: { url }
  "save", // data: {}
]);
export type ChapterStep = z.infer<typeof ChapterStep>;

export const StepStatus = z.enum(["running", "done", "error"]);
export type StepStatus = z.infer<typeof StepStatus>;

export const JobEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("step"),
    step: z.union([OnboardingStep, ChapterStep]),
    status: StepStatus,
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({ type: z.literal("delta"), target: z.enum(["body", "letter"]), text: z.string() }),
  z.object({ type: z.literal("done"), redirect: z.string().optional() }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
]);
export type JobEvent = z.infer<typeof JobEvent>;

export const JobType = z.enum(["onboarding", "chapter"]);
export type JobType = z.infer<typeof JobType>;
