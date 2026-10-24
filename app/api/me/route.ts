import { eq } from "drizzle-orm";
import { MeResponse } from "@/lib/contracts/api";
import { env } from "@/lib/env";
import { db, schema } from "@/lib/server/db/client";
import { handle, ok } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";
export const GET = handle(async () => {
  const user = await getCurrentUser();
  const season = user.activeSeasonId ? db.select().from(schema.seasons).where(eq(schema.seasons.id, user.activeSeasonId)).get() : undefined;
  return ok(MeResponse, { userId: user.id, seasonId: season?.id ?? null, seasonStatus: season?.status ?? null, demoMode: env.DEMO_MODE });
});
