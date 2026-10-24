// STUB → 任务卡 B10（演示账号）
import { SeedResponse } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { assertDemo } from "@/lib/server/demoGuard";

export const POST = handle(async () => {
  assertDemo();
  return ok(SeedResponse, { seasonId: "stub-season" });
});
