/**
 * 契约锁：对 lib/contracts/*.ts 与 lib/server/db/schema.ts 计算哈希，写入 CONTRACTS.lock。
 * tests/contracts-lock.test.ts 会比对哈希——契约文件被改动但没有重新加锁，pnpm check 就会失败。
 *
 * 修改契约的流程（见 CLAUDE.md）：在群里说明 → 只做向后兼容的修改 → pnpm contracts:lock → 提交时 commit message 带 [contract]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const CONTRACT_FILES = [
  "lib/contracts/ai.ts",
  "lib/contracts/aiTasks.ts",
  "lib/contracts/api.ts",
  "lib/contracts/events.ts",
  "lib/contracts/index.ts",
  "lib/server/db/schema.ts",
];

export function computeContractHashes(root = process.cwd()): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of CONTRACT_FILES) {
    const text = fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n");
    out[f] = crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  }
  return out;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/contracts-lock.ts")) {
  const hashes = computeContractHashes();
  fs.writeFileSync("CONTRACTS.lock", JSON.stringify(hashes, null, 2) + "\n");
  console.log("✔ CONTRACTS.lock updated");
  console.table(hashes);
}
