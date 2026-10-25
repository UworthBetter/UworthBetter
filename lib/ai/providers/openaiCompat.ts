/**
 * OpenAI 兼容接口的文本 Provider。默认对接智谱 BigModel（https://open.bigmodel.cn/api/paas/v4）。
 * 已验证（2026-10-24）：glm-5.3 / glm-5.3-flash 支持 response_format=json_object 与 thinking.disabled；
 * 部分模型会把 JSON 包在 ```json 代码块里，extractJson 负责兼容。
 * SDK 自带重试关闭（maxRetries=0）：超时与重试统一由 lib/ai/resilient.ts 控制，避免重试次数相乘。
 */
import OpenAI from "openai";
import type { ChatCompletionContentPart, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { env } from "@/lib/env";
import { AIError } from "@/lib/contracts/aiTasks";
import type { JsonCallOptions, StreamCallOptions, TextMessage, TextProvider, TextTier } from "./text";

const modelOf = (tier: TextTier = "smart") => (tier === "smart" ? env.TEXT_MODEL_SMART : env.TEXT_MODEL_FAST);

// 智谱扩展参数：flash 模型强制开启思考（不可关闭），用 low budget 降延迟；
// 非 flash 模型关闭思考；其他兼容服务会忽略未知字段。
const thinkingFor = (model: string): Record<string, unknown> =>
  model.includes("flash")
    ? { thinking: { type: "enabled", budget_token: "low" } }
    : { thinking: { type: "disabled" } };

function toMessages(system: string, messages: TextMessage[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "user" && m.images?.length) {
      const parts: ChatCompletionContentPart[] = [
        ...m.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
        { type: "text", text: m.content },
      ];
      out.push({ role: "user", content: parts });
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

/** 从模型输出中提取 JSON：兼容 ```json 代码块与前后多余文字。 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("模型输出不是合法 JSON");
  }
}

export function createOpenAICompatProvider(): TextProvider {
  if (!env.OPENAI_COMPAT_API_KEY) throw new Error("缺少 OPENAI_COMPAT_API_KEY（见 .env.example）");
  const client = new OpenAI({
    baseURL: env.OPENAI_COMPAT_BASE_URL,
    apiKey: env.OPENAI_COMPAT_API_KEY,
    timeout: Math.max(env.AI_TEXT_TIMEOUT_MS, env.AI_STREAM_TIMEOUT_MS),
    maxRetries: 0,
  });

  const log = (label: string, t0: number, usage?: { prompt_tokens?: number; completion_tokens?: number } | null) =>
    console.log(`[ai:text] ${label} ${Date.now() - t0}ms in=${usage?.prompt_tokens ?? "?"} out=${usage?.completion_tokens ?? "?"}`);

  async function json<T>(opts: JsonCallOptions<T>): Promise<T> {
    const messages = toMessages(opts.system, opts.messages);
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now();
      const model = modelOf(opts.tier);
      const res = await client.chat.completions.create({
        model,
        messages,
        temperature: opts.temperature ?? 0.8,
        response_format: { type: "json_object" },
        ...thinkingFor(model),
      }, { signal: opts.signal });
      log(opts.label, t0, res.usage);
      const raw = res.choices[0]?.message?.content ?? "";
      try {
        return opts.schema.parse(extractJson(raw));
      } catch (e) {
        lastErr = e;
        // 修复重试：把错误回传给模型
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: `你的输出没有通过校验，错误如下。请只输出修正后的完整 JSON，不要任何解释。\n${String(e).slice(0, 2000)}`,
        });
      }
    }
    throw new AIError("结构化输出校验失败", opts.label, lastErr);
  }

  async function stream(opts: StreamCallOptions): Promise<string> {
    const t0 = Date.now();
    const streamModel = modelOf(opts.tier);
    const s = await client.chat.completions.create({
      model: streamModel,
      messages: toMessages(opts.system, opts.messages),
      temperature: opts.temperature ?? 0.9,
      stream: true,
      ...thinkingFor(streamModel),
    }, { signal: opts.signal });
    let full = "";
    for await (const chunk of s) {
      const d = chunk.choices[0]?.delta?.content;
      if (d) {
        full += d;
        opts.onDelta(d);
      }
    }
    log(opts.label, t0);
    return full;
  }

  async function vision(opts: { prompt: string; imageUrl: string; label: string; signal?: AbortSignal }): Promise<string> {
    const t0 = Date.now();
    const visionModel = env.TEXT_MODEL_VISION;
    const res = await client.chat.completions.create({
      model: visionModel,
      messages: toMessages("你是一个简洁的图片描述助手。", [{ role: "user", content: opts.prompt, images: [opts.imageUrl] }]),
      ...thinkingFor(visionModel),
    }, { signal: opts.signal });
    log(opts.label, t0, res.usage);
    return res.choices[0]?.message?.content?.trim() ?? "";
  }

  return { json, stream, vision };
}
