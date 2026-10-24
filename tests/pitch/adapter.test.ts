import { describe, expect, it } from "vitest";
import seed from "@/seed/demo-season.json";
import { directionOf, toPitchData } from "@/components/pitch/model/adapter";
import type { Direction, PitchBranch } from "@/components/pitch/model/types";

const clone = () => structuredClone(seed) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("toPitchData", () => {
  it("真实 seed 产出 13 章、14 快照", () => {
    const d = toPitchData(seed);
    expect(d.chapters).toHaveLength(13);
    expect(d.chapters.map((c) => c.no)).toEqual([...Array(13).keys()].map((i) => i + 1));
    expect(d.snapshots.map((s) => s.chapterNo)).toEqual([...Array(14).keys()]);
    expect(d.seasonTitle).toBe("雾港颜色修补师");
    expect(d.sheets.future).toBe("/demo/sheet-future.jpg");
  });

  it("章节字段：封面、分镜、来信摘句、记录原话", () => {
    const c3 = toPitchData(seed).chapters[2];
    expect(c3.chapterType).toBe("low");
    expect(c3.coverUrl).toBe("/demo/cover-3.jpg");
    expect(c3.panelUrl).toBe("/demo/panel-3-1.jpg");
    expect(c3.logQuotes[0]).toBe("好累，今天先让自己休息");
    expect(c3.logQuotes.length).toBeLessThanOrEqual(3);
    expect(c3.letterQuote).toContain("我");
    expect(c3.letterQuote.length).toBeLessThanOrEqual(40);
  });

  it("chapterType → direction 映射", () => {
    expect(directionOf("highlight")).toBe("ahead");
    expect(directionOf("struggle")).toBe("on_track");
    expect(directionOf("low")).toBe("drift");
    expect(directionOf("rest")).toBe("drift");
  });

  it("无 portraitSnapshots 时按 chapterType 映射 direction", () => {
    const d = toPitchData(seed);
    expect(d.snapshots[3].direction).toBe("drift");
    expect(d.snapshots[1].direction).toBe("ahead");
    expect(d.snapshots[0].imageUrl).toBe("/demo/sheet-future.jpg");
  });

  it("有 portraitSnapshots 时优先用其 shift", () => {
    const s = clone();
    s.portraitSnapshots = [
      { chapterNo: 5, imageUrl: "/x.jpg", profile: {}, shift: { direction: "pivot", headline: "她转身了", changedTraits: [], evidence: ["原话"] } },
    ];
    const d = toPitchData(s);
    expect(d.snapshots[5]).toMatchObject({ direction: "pivot", headline: "她转身了", imageUrl: "/x.jpg", evidence: ["原话"] });
    expect(d.snapshots[4].direction).toBe(directionOf(d.chapters[3].chapterType));
  });

  it("缺字段不抛错：封面 null、logs 缺失", () => {
    const s = clone();
    s.chapters[0].cover = null;
    delete s.chapters[1].logs;
    s.chapters[2].panels = [null, null];
    const d = toPitchData(s);
    expect(d.chapters[0].coverUrl).toBeNull();
    expect(d.chapters[1].logQuotes).toEqual([]);
    expect(d.chapters[2].panelUrl).toBeNull();
  });

  it("缺章时补足 13 章", () => {
    const s = clone();
    s.chapters = s.chapters.slice(0, 5);
    expect(toPitchData(s).chapters).toHaveLength(13);
  });

  it("未传 branches 用占位，≥8 条且每条 path 长 13", () => {
    const d = toPitchData(seed);
    expect(d.branches.length).toBeGreaterThanOrEqual(8);
    d.branches.forEach((b) => expect(b.path).toHaveLength(13));
  });

  it("branches 中 path 长度不为 13 或含非法值的条目被丢弃", () => {
    const ok: PitchBranch = { id: "ok", path: Array<Direction>(13).fill("ahead"), imageUrl: null, headline: "" };
    const bad = [{ id: "short", path: ["ahead"], imageUrl: null, headline: "" },
      { id: "weird", path: Array(13).fill("sideways"), imageUrl: null, headline: "" }];
    const many = Array.from({ length: 8 }, (_, i) => ({ ...ok, id: `ok${i}` }));
    const d = toPitchData(seed, [...bad, ...many]);
    expect(d.branches.map((b) => b.id)).toEqual(many.map((b) => b.id));
  });

  it("完全非法输入（null）回落到占位而不抛错", () => {
    const d = toPitchData(null);
    expect(d.chapters).toHaveLength(13);
    expect(d.snapshots).toHaveLength(14);
  });
});
