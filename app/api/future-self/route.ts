import { FutureSelfView } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { futureSelf } from "@/lib/server/views";
export const GET = handle(async () => {
  const season = await getActiveSeason();
  const self = futureSelf(season);
  return ok(FutureSelfView, { profile: self.profile, sheetFutureUrl: self.sheetFutureUrl,
    sheetPresentUrl: self.sheetPresentUrl, firstLetterMd: season.firstLetterMd, seasonTitle: season.title, logline: season.bible!.logline });
});
