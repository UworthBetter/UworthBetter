/**
 * Route Handler 通用工具：统一的成功/失败响应、请求体校验、错误捕获。
 */
import { z } from "zod";
import type { ErrorCode } from "@/lib/contracts/api";
import { env } from "@/lib/env";

export class HttpError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const fail = (code: ErrorCode, message: string, status: number) => new HttpError(code, message, status);

/** 返回 JSON；开发/测试环境下先用契约 schema 自检，契约不一致时立刻暴露。 */
export function ok<T>(schema: z.ZodType<T>, data: T, init?: ResponseInit): Response {
  const body = env.NODE_ENV === "production" ? data : schema.parse(data);
  return Response.json(body, init);
}

export async function readJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw fail("VALIDATION", "请求体不是合法 JSON", 400);
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw fail("VALIDATION", z.prettifyError(r.error), 400);
  return r.data;
}

/** multipart：字段 "data" 为 JSON 字符串，其余为文件。 */
export async function readMultipart<T>(
  req: Request,
  schema: z.ZodType<T>,
  fileField: string,
): Promise<{ data: T; file: File | null }> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw fail("VALIDATION", "请求体不是合法表单", 400);
  }
  const rawData = form.get("data");
  if (typeof rawData !== "string") throw fail("VALIDATION", "缺少 data 字段", 400);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    throw fail("VALIDATION", "data 字段不是合法 JSON", 400);
  }
  const r = schema.safeParse(parsed);
  if (!r.success) throw fail("VALIDATION", z.prettifyError(r.error), 400);
  const f = form.get(fileField);
  return { data: r.data, file: f instanceof File && f.size > 0 ? f : null };
}

/** 包装 handler：HttpError → ApiError JSON；其余错误 → 500 INTERNAL。 */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      }
      console.error(e);
      return Response.json({ error: { code: "INTERNAL", message: "服务器内部错误" } }, { status: 500 });
    }
  };
}

export function parseChapterNo(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 13) throw fail("NOT_FOUND", "章节不存在", 404);
  return n;
}
