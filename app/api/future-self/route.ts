// STUB → 任务卡 B3
import { FutureSelfView } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { stubFutureSelfView } from "@/lib/server/stubs";

export const GET = handle(async () => ok(FutureSelfView, stubFutureSelfView()));
