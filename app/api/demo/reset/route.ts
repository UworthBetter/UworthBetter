// STUB → 任务卡 B10
import { OkResponse } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { assertDemo } from "@/lib/server/demoGuard";

export const POST = handle(async () => {
  assertDemo();
  return ok(OkResponse, { ok: true });
});
