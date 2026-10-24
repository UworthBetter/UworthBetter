import { describe, expect, it } from "vitest";
import { formatHash, keyToCommand, navReducer, parseHash, shouldForwardKey, type Pos } from "@/components/pitch/model/nav";

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
    expect(shouldForwardKey("f", t("BUTTON"))).toBe(false);
  });
});
