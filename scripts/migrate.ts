import "./_env";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

async function main() {
  const { db } = await import("@/lib/server/db/client");
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✔ migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
