import { describe, expect, it } from "vitest";
import { buildFateTree } from "@/components/pitch/model/fateTree";
import { placeholderBranches } from "@/components/pitch/model/placeholder";
import type { Direction, PitchBranch } from "@/components/pitch/model/types";

const OPTS = { width: 1600, height: 900, decorativeSeed: 7, decorativeCount: 40 };
const real: Direction[] = Array(13).fill("on_track");
const br = (id: string, path: Direction[]): PitchBranch => ({ id, path, imageUrl: null, headline: "" });
const BRANCHES12 = placeholderBranches(real);

describe("buildFateTree", () => {
  it("共享前缀合并为同一节点", () => {
    const t = buildFateTree(real, [br("a", [...real.slice(0, 5), ...Array<Direction>(8).fill("ahead")])], OPTS);
    const core = t.nodes.filter((n) => !n.decorative);
    expect(core.filter((n) => n.depth === 3)).toHaveLength(1);
    expect(core.filter((n) => n.depth === 6)).toHaveLength(2);
    expect(core.find((n) => n.depth === 0)!.id).toBe("r");
  });

  it("realPath 有 14 个节点且全部 real，首尾为根与真实叶子", () => {
    const t = buildFateTree(real, BRANCHES12, OPTS);
    expect(t.realPath).toHaveLength(14);
    expect(t.realPath[0]).toBe("r");
    for (const id of t.realPath) expect(t.nodes.find((n) => n.id === id)!.real).toBe(true);
    expect(t.nodes.filter((n) => n.real)).toHaveLength(14);
  });

  it("每条不同的非真实路径对应一个叶子；与真实路径重合的分支挂在真实叶子上", () => {
    const t = buildFateTree(real, [br("same", real), br("a", Array<Direction>(13).fill("ahead")), br("a2", Array<Direction>(13).fill("ahead"))], OPTS);
    const leaves = t.leaves.filter((l) => !t.nodes.find((n) => n.id === l.nodeId)!.decorative);
    expect(leaves).toHaveLength(2);
    expect(leaves.find((l) => l.nodeId === t.realPath[13])!.branchId).toBe("same");
  });

  it("边连接父子节点，深度差为 1", () => {
    const t = buildFateTree(real, BRANCHES12, OPTS);
    const byId = new Map(t.nodes.map((n) => [n.id, n]));
    for (const e of t.edges) expect(byId.get(e.to)!.depth - byId.get(e.from)!.depth).toBe(1);
    expect(t.edges.filter((e) => e.real)).toHaveLength(13);
  });

  it("x 按深度等分且节点都在画布内", () => {
    const t = buildFateTree(real, BRANCHES12, OPTS);
    for (const n of t.nodes) {
      expect(n.x).toBeCloseTo((n.depth / 13) * OPTS.width);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(OPTS.height);
    }
  });

  it("装饰分支按数量生成、确定性、不产生分支画像", () => {
    const a = buildFateTree(real, BRANCHES12, OPTS);
    expect(a).toEqual(buildFateTree(real, BRANCHES12, OPTS));
    const deco = a.nodes.filter((n) => n.decorative);
    expect(deco.length).toBeGreaterThan(0);
    const isDeco = new Map(a.nodes.map((n) => [n.id, n.decorative]));
    // 每条装饰分支从一个真实节点长出
    expect(a.edges.filter((e) => e.decorative && !isDeco.get(e.from))).toHaveLength(OPTS.decorativeCount);
    for (const l of a.leaves) expect(a.nodes.find((n) => n.id === l.nodeId)!.decorative).toBe(false);
  });

  it("末层（非装饰）叶子 y 间距 ≥ 8", () => {
    const t = buildFateTree(real, BRANCHES12, OPTS);
    const ys = t.nodes.filter((n) => n.depth === 13 && !n.decorative).map((n) => n.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(8);
  });
});
