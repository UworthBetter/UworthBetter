// STUB → 任务卡 B10（时间快进）
import { FastForwardRequest, SeasonView } from "@/lib/contracts/api";
import { handle, ok, readJson } from "@/lib/server/http";
import { assertDemo } from "@/lib/server/demoGuard";
import { stubSeasonView } from "@/lib/server/stubs";

export const POST = handle(async (req: Request) => {
  assertDemo();
  await readJson(req, FastForwardRequest);
  return ok(SeasonView, stubSeasonView());
});
