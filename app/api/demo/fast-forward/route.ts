import { FastForwardRequest, SeasonView } from "@/lib/contracts/api";
import { assertDemo } from "@/lib/server/demoGuard";
import { fastForward } from "@/lib/server/demo";
import { handle, ok, readJson } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { toSeasonView } from "@/lib/server/views";
export const POST = handle(async (req: Request) => {
  assertDemo(); const data = await readJson(req, FastForwardRequest); const season = await getActiveSeason();
  fastForward(season, data.rate, data.cached); return ok(SeasonView, toSeasonView(season));
});
