// P1 → 任务卡 A13 + B11（与未来的你对话）。返回 SSE：delta(target=letter) … done
import { ChatRequest } from "@/lib/contracts/api";
import type { JobEvent } from "@/lib/contracts/events";
import { handle, readJson } from "@/lib/server/http";
import { sseResponse } from "@/lib/server/sse";

export const POST = handle(async (req: Request) => {
  await readJson(req, ChatRequest);
  async function* events(): AsyncGenerator<JobEvent> {
    yield { type: "delta", target: "letter", text: "（P1 尚未实现）先画，再说。" };
    yield { type: "done" };
  }
  return sseResponse(events(), req.signal);
});
