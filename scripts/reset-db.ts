import "./_env";
import fs from "node:fs";
import { execSync } from "node:child_process";

const file = (process.env.DATABASE_URL ?? "file:./data/app.db").replace(/^file:/, "");
for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
console.log(`✔ removed ${file}`);
execSync("pnpm db:migrate", { stdio: "inherit" });
