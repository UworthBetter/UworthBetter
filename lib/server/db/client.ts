import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

function open(): DB {
  const file = env.DATABASE_URL.replace(/^file:/, "");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

// 开发模式热更新时复用同一个连接
const g = globalThis as unknown as { __uworthBetterDb?: DB };
export const db: DB = g.__uworthBetterDb ?? (g.__uworthBetterDb = open());

export { schema };
