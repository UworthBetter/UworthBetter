/**
 * 契约锁检查。失败说明你修改了契约文件（lib/contracts/* 或 lib/server/db/schema.ts）。
 * 如果这是经过全员同意的向后兼容修改：运行 `pnpm contracts:lock`，并在 commit message 中加 [contract]。
 * 否则：撤销对契约的修改。
 */
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { computeContractHashes } from "@/scripts/contracts-lock";

describe("契约锁", () => {
  it("契约文件与 CONTRACTS.lock 一致", () => {
    const locked = JSON.parse(fs.readFileSync("CONTRACTS.lock", "utf8"));
    expect(computeContractHashes()).toEqual(locked);
  });
});
