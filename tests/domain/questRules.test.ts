import { describe, expect, it } from "vitest";
import type { Quest } from "@/lib/contracts/ai";
import { TINY_START_QUEST, adaptQuests } from "@/lib/domain/questRules";

const q = (text: string, difficulty: number, isKey = false): Quest => ({ text, difficulty, isKey, storyHook: "" });
const suggested = [q("A", 3, true), q("B", 3), q("C", 2), q("D", 1), q("E", 2)];
const keys = (qs: Quest[]) => qs.filter((x) => x.isKey).length;

describe("adaptQuests", () => {
  it("低谷：3 个任务、全部难度 1、首位为启动任务、关键任务恰好 1 个", () => {
    const r = adaptQuests(suggested, 0.2);
    expect(r).toHaveLength(3);
    expect(r[0].text).toBe(TINY_START_QUEST.text);
    expect(r.every((x) => x.difficulty === 1)).toBe(true);
    expect(keys(r)).toBe(1);
    expect(r[1].isKey).toBe(true);
  });

  it("挣扎：难度上限 2", () => {
    const r = adaptQuests(suggested, 0.5);
    expect(r.every((x) => x.difficulty <= 2)).toBe(true);
    expect(keys(r)).toBe(1);
  });

  it("高光：最多 1 个难度 3", () => {
    const r = adaptQuests(suggested, 0.9);
    expect(r.filter((x) => x.difficulty === 3)).toHaveLength(1);
    expect(keys(r)).toBe(1);
  });

  it("AI 没标关键任务时自动补一个", () => {
    const r = adaptQuests([q("A", 1), q("B", 1), q("C", 1)], 0.6);
    expect(keys(r)).toBe(1);
    expect(r[0].isKey).toBe(true);
  });
});
