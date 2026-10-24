import { describe, expect, it } from "vitest";
import { completionRate, daysLeft, fogBlurPx, remainingToClear, weekdayOf } from "@/lib/domain/progress";
import { actOf, isActFinale } from "@/lib/domain/skeleton";

describe("progress", () => {
  it("completionRate / remainingToClear", () => {
    const qs = [{ done: true }, { done: false }, { done: true }, { done: false }];
    expect(completionRate(qs)).toBe(0.5);
    expect(remainingToClear(qs)).toBe(2);
    expect(completionRate([])).toBe(0);
  });

  it("fogBlurPx 在 0..24 之间并单调递减", () => {
    expect(fogBlurPx(0)).toBe(24);
    expect(fogBlurPx(0.5)).toBe(12);
    expect(fogBlurPx(1)).toBe(0);
    expect(fogBlurPx(2)).toBe(0);
    expect(fogBlurPx(-1)).toBe(24);
  });

  it("daysLeft：第 1 章 7 天，含当天", () => {
    expect(daysLeft("2026-10-26", 1, new Date(2026, 9, 26))).toBe(7);
    expect(daysLeft("2026-10-26", 1, new Date(2026, 10, 1))).toBe(1);
    expect(daysLeft("2026-10-26", 1, new Date(2026, 10, 5))).toBe(0);
    expect(daysLeft("2026-10-26", 2, new Date(2026, 10, 2))).toBe(7);
  });

  it("weekdayOf", () => {
    expect(weekdayOf("2026-10-26")).toBe("周一");
  });

  it("actOf / isActFinale", () => {
    expect([1, 4, 5, 9, 10, 13].map(actOf)).toEqual([1, 1, 2, 2, 3, 3]);
    expect([4, 9, 13].every(isActFinale)).toBe(true);
    expect(isActFinale(5)).toBe(false);
  });
});
