import { SeasonView } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { toSeasonView } from "@/lib/server/views";
export const GET = handle(async () => ok(SeasonView, toSeasonView(await getActiveSeason())));
