// STUB → 任务卡 B1（匿名会话）
import { MeResponse } from "@/lib/contracts/api";
import { env } from "@/lib/env";
import { handle, ok } from "@/lib/server/http";

export const GET = handle(async () =>
  ok(MeResponse, { userId: "stub-user", seasonId: "stub-season", seasonStatus: "active", demoMode: env.DEMO_MODE }),
);
