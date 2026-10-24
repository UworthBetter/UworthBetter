import { describe, expect, it } from "vitest";
import { decideChapterType } from "@/lib/domain/chapterType";

describe("decideChapterType", () => {
  it.each([
    [1, "highlight"],
    [0.8, "highlight"],
    [0.79, "struggle"],
    [0.4, "struggle"],
    [0.39, "low"],
    [0, "low"],
  ] as const)("rate=%s → %s", (rate, expected) => {
    expect(decideChapterType(rate, [])).toBe(expected);
  });

  it("连续两周低谷 → 休整章", () => {
    expect(decideChapterType(0.2, ["highlight", "low"])).toBe("rest");
  });

  it("休整章之后再次低谷 → 低谷章（不连续休整）", () => {
    expect(decideChapterType(0.2, ["low", "rest"])).toBe("low");
  });
});
