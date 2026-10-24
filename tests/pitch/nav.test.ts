import { describe, expect, it } from "vitest";
import { applyDigit, formatHash, keyToCommand, navReducer, parseHash, shouldForwardKey, shouldSnap, type Pos } from "@/components/pitch/model/nav";

const B = [1, 3, 2];
const at = (scene: number, beat: number): Pos => ({ scene, beat });

describe("navReducer", () => {
  it("next 先推进拍，再进场景", () => {
    expect(navReducer(B, at(1, 0), { type: "next" })).toEqual(at(1, 1));
    expect(navReducer(B, at(1, 2), { type: "next" })).toEqual(at(2, 0));
  });
  it("prev 回到上一场景的最后一拍", () => {
    expect(navReducer(B, at(2, 0), { type: "prev" })).toEqual(at(1, 2));
    expect(navReducer(B, at(1, 2), { type: "prev" })).toEqual(at(1, 1));
  });
  it("边界不越界", () => {
    expect(navReducer(B, at(0, 0), { type: "prev" })).toEqual(at(0, 0));
    expect(navReducer(B, at(2, 1), { type: "next" })).toEqual(at(2, 1));
  });
  it("连续 5 次 next 恰好逐拍前进", () => {
    let p = at(0, 0);
    for (let i = 0; i < 5; i++) p = navReducer(B, p, { type: "next" });
    expect(p).toEqual(at(2, 1));
  });
  it("home / end / goto（goto 夹紧）", () => {
    expect(navReducer(B, at(1, 1), { type: "home" })).toEqual(at(0, 0));
    expect(navReducer(B, at(0, 0), { type: "end" })).toEqual(at(2, 1));
    expect(navReducer(B, at(0, 0), { type: "goto", pos: at(1, 9) })).toEqual(at(1, 2));
  });
});

describe("hash", () => {
  it("往返", () => {
    expect(formatHash(at(11, 3))).toBe("#11.3");
    expect(parseHash(formatHash(at(1, 2)), B)).toEqual(at(1, 2));
  });
  it.each([
    ["#99.9", at(2, 1)],
    ["#1.9", at(1, 2)],
    ["#3.-1", at(2, 0)],
    ["#2", at(2, 0)],
    ["#abc", at(0, 0)],
    ["", at(0, 0)],
  ])("parseHash(%s) 夹紧", (h, e) => expect(parseHash(h, B)).toEqual(e));
});

describe("按键", () => {
  it("映射", () => {
    for (const k of ["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"]) expect(keyToCommand(k)).toBe("next");
    for (const k of ["ArrowLeft", "ArrowUp", "PageUp"]) expect(keyToCommand(k)).toBe("prev");
    expect(keyToCommand("Home")).toBe("home");
    expect(keyToCommand("End")).toBe("end");
    expect(keyToCommand("f")).toBe("fullscreen");
    expect(keyToCommand("F")).toBe("fullscreen");
    expect(keyToCommand("b")).toBe("black");
    expect(keyToCommand("v")).toBe("video");
    expect(keyToCommand("s")).toBe("notes");
    expect(keyToCommand("x")).toBeNull();
  });
  it("输入框中不转发，且只转发翻页类", () => {
    const t = (tagName: string, isContentEditable = false) => ({ tagName, isContentEditable });
    expect(shouldForwardKey(" ", t("TEXTAREA"))).toBe(false);
    expect(shouldForwardKey("ArrowRight", t("INPUT"))).toBe(false);
    expect(shouldForwardKey("ArrowRight", t("SELECT"))).toBe(false);
    expect(shouldForwardKey("ArrowRight", t("DIV", true))).toBe(false);
    expect(shouldForwardKey("ArrowRight", t("BUTTON"))).toBe(true);
    expect(shouldForwardKey("PageUp", null)).toBe(true);
    // 焦点在 iframe（非输入框）时，备用视频 / 黑屏 / 全屏也必须能用
    expect(shouldForwardKey("v", t("BUTTON"))).toBe(true);
    expect(shouldForwardKey("b", t("DIV"))).toBe(true);
    expect(shouldForwardKey("f", t("BUTTON"))).toBe(true);
    expect(shouldForwardKey("7", t("DIV"))).toBe(true);
    expect(shouldForwardKey("v", t("TEXTAREA"))).toBe(false);
    expect(shouldForwardKey("x", t("DIV"))).toBe(false);
  });
});

describe("数字跳转", () => {
  it("数字键映射为 digit", () => {
    expect(keyToCommand("0")).toBe("digit");
    expect(keyToCommand("9")).toBe("digit");
  });
  it("累积数字，回车跳到该场景；无缓冲时回车仍是下一步", () => {
    expect(applyDigit("", "1")).toEqual({ buffer: "1", goto: null });
    expect(applyDigit("1", "1")).toEqual({ buffer: "11", goto: null });
    expect(applyDigit("11", "Enter")).toEqual({ buffer: "", goto: 11 });
    expect(applyDigit("", "Enter")).toEqual({ buffer: "", goto: null });
  });
  it("缓冲最多两位", () => expect(applyDigit("12", "3")).toEqual({ buffer: "23", goto: null }));
  it("其他键清空缓冲", () => expect(applyDigit("4", "ArrowRight")).toEqual({ buffer: "", goto: null }));
});

describe("shouldSnap：上一拍动画未结束就再按，直接跳终态", () => {
  it("在稳定时间内再按 → 跳终态", () => expect(shouldSnap(1000, 1500, 900)).toBe(true));
  it("超过稳定时间 → 正常播放", () => expect(shouldSnap(1000, 2000, 900)).toBe(false));
  it("首次（无上次时间）→ 正常播放", () => expect(shouldSnap(null, 1500, 900)).toBe(false));
});
