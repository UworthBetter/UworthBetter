import { eq } from "drizzle-orm";
import { FastForwardRequest, SeasonView } from "@/lib/contracts/api";
import { assertDemo } from "@/lib/server/demoGuard";
import { demoJump, fastForward } from "@/lib/server/demo";
import { db, schema } from "@/lib/server/db/client";
import { handle, ok, readJson } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { toSeasonView } from "@/lib/server/views";
export const POST = handle(async (req: Request) => {
  assertDemo(); const data = await readJson(req, FastForwardRequest); const season = await getActiveSeason();
  if (data.chapter !== undefined) {
    demoJump(season, data.chapter);
    // 跳章后 currentChapter 已变化，重新读取季行再生成视图。
    const fresh = db.select().from(schema.seasons).where(eq(schema.seasons.id, season.id)).get()!;
    return ok(SeasonView, toSeasonView(fresh));
  }
  fastForward(season, data.rate, data.cached); return ok(SeasonView, toSeasonView(season));
});
