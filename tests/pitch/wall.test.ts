import { describe, expect, it } from "vitest";
import { buildWall } from "@/components/pitch/model/wall";

const OPTS = { width: 1920, height: 1080, count: 96, seed: 3 };
const SRC = ["/a.jpg", "/b.jpg", null, "/c.jpg"];

describe("buildWall", () => {
  const cells = buildWall(SRC, "/real.jpg", OPTS);
  const center = (c: { x: number; y: number; size: number }) => ({ cx: c.x + c.size / 2, cy: c.y + c.size / 2 });

  it("格子数量与唯一的真实格", () => {
    expect(cells).toHaveLength(96);
    const real = cells.filter((c) => c.real);
    expect(real).toHaveLength(1);
    expect(real[0].src).toBe("/real.jpg");
  });

  it("真实格靠近画布中心", () => {
    const { cx, cy } = center(cells.find((c) => c.real)!);
    expect(Math.hypot(cx - 960, cy - 540)).toBeLessThan(1920 / 6);
  });

  it("变体只做轻微色调变化：hue ∈ [-25, 25]，没有灰度/降亮度字段", () => {
    for (const c of cells) {
      expect(c.variant.hue).toBeGreaterThanOrEqual(-25);
      expect(c.variant.hue).toBeLessThanOrEqual(25);
      expect(Object.keys(c.variant).sort()).toEqual(["crop", "flip", "hue"]);
    }
  });

  it("格子在画布内且互不重叠", () => {
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.size).toBeLessThanOrEqual(1920);
      expect(c.y + c.size).toBeLessThanOrEqual(1080);
    }
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i], b = cells[j];
        const overlap = a.x < b.x + b.size && b.x < a.x + a.size && a.y < b.y + b.size && b.y < a.y + a.size;
        expect(overlap).toBe(false);
      }
  });

  it("离中心越远越先熄灭（最远者 delay 最小）", () => {
    const others = cells.filter((c) => !c.real);
    const dist = (c: (typeof cells)[number]) => { const { cx, cy } = center(c); return Math.hypot(cx - 960, cy - 540); };
    const far = others.reduce((a, b) => (dist(a) > dist(b) ? a : b));
    const near = others.reduce((a, b) => (dist(a) < dist(b) ? a : b));
    expect(far.delay).toBe(Math.min(...others.map((c) => c.delay)));
    expect(near.delay).toBeGreaterThan(far.delay);
  });

  it("非真实格的图片来自 sources；同 seed 结果确定", () => {
    for (const c of cells.filter((x) => !x.real)) expect(SRC).toContain(c.src);
    expect(buildWall(SRC, "/real.jpg", OPTS)).toEqual(cells);
  });

  it("sources 为空时用 realSrc 填充", () => {
    const w = buildWall([], "/real.jpg", { ...OPTS, count: 12 });
    expect(w.every((c) => c.src === "/real.jpg")).toBe(true);
  });
});
