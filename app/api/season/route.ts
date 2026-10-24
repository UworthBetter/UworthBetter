// STUB → 任务卡 B3（季视图）
import { SeasonView } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { stubSeasonView } from "@/lib/server/stubs";

export const GET = handle(async () => ok(SeasonView, stubSeasonView()));
