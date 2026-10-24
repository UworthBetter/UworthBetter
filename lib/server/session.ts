import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/server/db/client";
import { fail } from "@/lib/server/http";
import { env } from "@/lib/env";
import { ensureServerRecovery } from "@/lib/server/db/recovery";

export async function getCurrentUser() {
  const jar = await cookies();
  ensureServerRecovery(db);
  const uid = jar.get("uid")?.value;
  const user = uid ? db.select().from(schema.users).where(eq(schema.users.id, uid)).get() : undefined;
  if (user) return user;
  const created = db.insert(schema.users).values({ id: nanoid(32) }).returning().get();
  jar.set("uid", created.id, { httpOnly: true, sameSite: "lax", secure: env.PUBLIC_BASE_URL.startsWith("https://"), path: "/", maxAge: 180 * 86400 });
  return created;
}

export async function getActiveSeason() {
  const user = await getCurrentUser();
  const season = user.activeSeasonId
    ? db.select().from(schema.seasons).where(eq(schema.seasons.id, user.activeSeasonId)).get()
    : undefined;
  if (!season || season.userId !== user.id) throw fail("NO_SEASON", "请先完成建档", 404);
  return season;
}
