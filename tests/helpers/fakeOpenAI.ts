/**
 * 测试用的本地 OpenAI 兼容服务（文本 / 流式 / 看图 / 生图），不访问外网、不消耗额度。
 * 用法：startFake() 后把 env 的 BASE_URL 指向 fake.base；fake.route 决定每个请求的回复。
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import sharp from "sharp";
import { fxChapterPlan, fxInterview, fxOnboarding } from "@/fixtures";

export type Body = {
  model?: string;
  stream?: boolean;
  prompt?: string;
  size?: string;
  messages?: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[];
};
export type Call = { path: string; auth?: string; body: Body };
export type Reply =
  | { json: unknown; status?: number }
  | { content: string }
  | { stream: string[]; breakAfter?: number }
  | { hang: true }
  | { raw: Buffer; type: string };

const completion = (content: string) => ({
  id: "c1",
  object: "chat.completion",
  created: 0,
  model: "fake",
  choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});
const chunk = (content: string) =>
  `data: ${JSON.stringify({ id: "c1", object: "chat.completion.chunk", created: 0, model: "fake", choices: [{ index: 0, delta: { content }, finish_reason: null }] })}\n\n`;

export type Fake = { base: string; calls: Call[]; route: (call: Call) => Reply; close: () => void };

export async function startFake(): Promise<Fake> {
  const fake: Fake = { base: "", calls: [], route: () => ({ json: { error: { message: "未设置" } }, status: 500 }), close: () => {} };
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      const call: Call = { path: req.url ?? "", auth: req.headers.authorization, body: raw ? JSON.parse(raw) : {} };
      if (req.method === "POST") fake.calls.push(call);
      const reply = fake.route(call);
      if ("hang" in reply) return;
      if ("raw" in reply) return void res.writeHead(200, { "content-type": reply.type }).end(reply.raw);
      if ("stream" in reply) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        reply.stream.forEach((piece, i) => {
          if (reply.breakAfter !== undefined && i >= reply.breakAfter) return;
          res.write(chunk(piece));
        });
        if (reply.breakAfter !== undefined) return void res.destroy();
        return void res.end("data: [DONE]\n\n");
      }
      const payload = "content" in reply ? completion(reply.content) : reply.json;
      res.writeHead("status" in reply && reply.status ? reply.status : 200, { "content-type": "application/json" }).end(JSON.stringify(payload));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  fake.base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v4`;
  fake.close = () => {
    server.closeAllConnections();
    server.close();
  };
  return fake;
}

export const system = (c: Call) => String(c.body.messages?.[0]?.content ?? "");
export const userText = (c: Call) => JSON.stringify(c.body.messages?.slice(1));

let pngB64: string | undefined;
/** 预先生成一张小 PNG（b64），供生图接口返回。 */
export async function preparePng(): Promise<string> {
  pngB64 ??= (await sharp({ create: { width: 4, height: 4, channels: 3, background: "#88aacc" } }).png().toBuffer()).toString("base64");
  return pngB64;
}

/** 按 system prompt 识别任务，返回一份合法输出（部分故意用蛇形命名 / 错误编号，验证宽容预处理）。 */
export function happyRoute(c: Call): Reply {
  if (c.path.endsWith("/images/generations")) return { json: { data: [{ b64_json: pngB64 }] } };
  const sys = system(c);
  if (c.body.stream) {
    if (sys.includes("写信")) return { stream: ["小夏：\n\n", "这周你画了五张速写。\n\n", "—— 2027 年 1 月，在工作室里的林夏"] };
    return { stream: ["第一段。\n\n", "第二段。\n\n第三段。\n\n", "第四段。"] }; // 故意不带分镜标记
  }
  if (Array.isArray(c.body.messages?.[1]?.content)) return { content: "书桌上摊开的速写本\n" };
  if (sys.includes("目标教练"))
    return { content: JSON.stringify({ suggestions: [1, 2, 3, 4, 5].map((i) => ({ goal: `90 天后，每周弹完第 ${i} 首完整的吉他曲子`, tagline: "习惯养成习惯养成习惯养成习惯养成习惯养成" })) }) };
  if (sys.includes("首席编剧")) {
    const { futureSelf, bible } = fxOnboarding;
    return { content: "```json\n" + JSON.stringify({ future_self: { ...futureSelf, name: "模型起的名字", personality: ["a", "b", "c", "d", "e"] }, story_bible: { ...bible, mentor: { name: "别名", role: "导师" } } }) + "\n```" };
  }
  if (sys.includes("目标规划教练")) {
    const r = fxOnboarding.roadmap;
    return { content: JSON.stringify({ ...r, acts: r.acts.map((a) => ({ ...a, chapters: a.chapters.map((ch) => ({ ...ch, no: 99 })) })) }) };
  }
  if (sys.includes("周末采访")) return { content: JSON.stringify({ questions: [...fxInterview.questions, "多余的第四题"] }) };
  if (sys.includes("结构化规划")) {
    return {
      content: JSON.stringify({
        ...fxChapterPlan,
        title: "真实模型写的章节",
        chapterType: "low",
        interviewQuote: "用户从没说过的话",
        foreshadowingResolve: ["f1", "不存在的伏笔"],
        panels: fxChapterPlan.panels.map((p) => ({ ...p, shot: "Close-up", dialogues: p.dialogues.map((d) => ({ ...d, text: "很长".repeat(30) })) })),
      }),
    };
  }
  return { json: { error: { message: `未知请求 ${sys.slice(0, 20)}` } }, status: 400 };
}
