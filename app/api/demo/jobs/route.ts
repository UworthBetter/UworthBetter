import { desc, eq } from "drizzle-orm";
import { assertDemo } from "@/lib/server/demoGuard";
import { db, schema } from "@/lib/server/db/client";
import { handle } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";

export const GET = handle(async () => {
  assertDemo();
  const user = await getCurrentUser();
  const seasonIds = new Set(db.select().from(schema.seasons).where(eq(schema.seasons.userId, user.id)).all().map((s) => s.id));
  const chapterIds = new Set(db.select().from(schema.chapters).all().filter((c) => seasonIds.has(c.seasonId)).map((c) => c.id));
  const jobs = db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt)).all()
    .filter((j) => j.type === "onboarding" ? seasonIds.has(j.refId) : chapterIds.has(j.refId)).slice(0, 20);
  return Response.json({ jobs });
});
