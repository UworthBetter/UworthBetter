/**
 * SSE 工具：把 JobEvent 异步序列写成 text/event-stream 响应，带心跳。
 * B0 实现真正的 Job runner 时复用 sseResponse。
 */
import type { JobEvent } from "@/lib/contracts/events";

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // nginx 关闭缓冲
};

export function sseResponse(source: AsyncIterable<JobEvent>, signal?: AbortSignal): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 15_000);
      const close = () => {
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* 已关闭 */
        }
      };
      signal?.addEventListener("abort", close);
      try {
        for await (const ev of source) {
          if (signal?.aborted) break;
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
          if (ev.type === "done" || ev.type === "error") break;
        }
      } finally {
        close();
      }
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
