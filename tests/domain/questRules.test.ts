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

  it("未传 questCount 时与现状一致：低谷 3 条、中/高完成度最多 5 条", () => {
    expect(adaptQuests(suggested, 0.2)).toHaveLength(3);
    expect(adaptQuests(suggested, 0.5)).toHaveLength(5);
    expect(adaptQuests(suggested, 0.9)).toHaveLength(5);
  });

  it("中/高完成度按 questCount 截断：AI 给 5 条、questCount=2 → 2 条", () => {
    const mid = adaptQuests(suggested, 0.5, 2);
    expect(mid).toHaveLength(2);
    expect(mid.every((x) => x.difficulty <= 2)).toBe(true);
    expect(keys(mid)).toBe(1);
    const high = adaptQuests(suggested, 0.9, 2);
    expect(high).toHaveLength(2);
    expect(high.filter((x) => x.difficulty === 3)).toHaveLength(1);
    expect(keys(high)).toBe(1);
  });

  it("低谷档全额尊重 questCount=5：启动任务 + 4 条全难度 1", () => {
    const r = adaptQuests(suggested, 0.2, 5);
    expect(r).toHaveLength(5);
    expect(r[0].text).toBe(TINY_START_QUEST.text);
    expect(r.every((x) => x.difficulty === 1)).toBe(true);
    expect(keys(r)).toBe(1);
  });

  it("低谷档 questCount=2：启动任务 + 1 条", () => {
    const r = adaptQuests(suggested, 0.2, 2);
    expect(r).toHaveLength(2);
    expect(r[0].text).toBe(TINY_START_QUEST.text);
    expect(r.every((x) => x.difficulty === 1)).toBe(true);
    expect(keys(r)).toBe(1);
  });

  it("低谷档 questCount=1：仅剩启动任务，它本身就是关键任务", () => {
    const r = adaptQuests(suggested, 0.2, 1);
    expect(r).toHaveLength(1);
    expect(r[0].text).toBe(TINY_START_QUEST.text);
    expect(keys(r)).toBe(1);
  });
});
