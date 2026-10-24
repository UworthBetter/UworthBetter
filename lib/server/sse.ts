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
  const iterator = source[Symbol.asyncIterator]();
  let stop: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const ping = setInterval(() => { if (!closed) controller.enqueue(enc.encode(": ping\n\n")); }, 15_000);
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        signal?.removeEventListener("abort", close);
        void iterator.return?.();
        try {
          controller.close();
        } catch {
          /* 已关闭 */
        }
      };
      stop = close;
      signal?.addEventListener("abort", close, { once: true });
      try {
        if (signal?.aborted) return;
        while (!closed) {
          const result = await iterator.next();
          if (result.done || closed) break;
          const ev = result.value;
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
          if (ev.type === "done" || ev.type === "error") break;
        }
      } catch (error) {
        if (!closed) {
          console.error("事件推送失败", error);
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", code: "INTERNAL", message: "事件推送失败，请重新连接" })}\n\n`));
        }
      } finally {
        close();
      }
    },
    cancel() { stop?.(); },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
