import { seeded } from "@/components/pitch/model/placeholder";
import { DIRECTIONS, SEASON_WEEKS, type Direction, type PitchBranch } from "@/components/pitch/model/types";

// 命运树布局：从季初（depth 0）到第 13 周（depth 13）从左往右展开。
// 节点 id 是路径前缀（"r.ahead.drift"），相同前缀的分支自然合并。
// 装饰分支只为拉远阶段的画面密度服务，没有画像。

export type TreeNode = { id: string; depth: number; x: number; y: number; direction: Direction | null; real: boolean; decorative: boolean };
export type TreeEdge = { from: string; to: string; real: boolean; decorative: boolean };
export type FateTree = { nodes: TreeNode[]; edges: TreeEdge[]; leaves: { nodeId: string; branchId: string | null }[]; realPath: string[] };

type Trie = { id: string; depth: number; direction: Direction | null; real: boolean; children: Map<Direction, Trie>; branchId: string | null };

const PAD_RATIO = 0.06;

export function buildFateTree(
  realPath: Direction[],
  branches: PitchBranch[],
  opts: { width: number; height: number; decorativeSeed: number; decorativeCount: number },
): FateTree {
  const root: Trie = { id: "r", depth: 0, direction: null, real: true, children: new Map(), branchId: null };
  const insert = (path: Direction[], real: boolean, branchId: string | null) => {
    let node = root;
    for (const d of path.slice(0, SEASON_WEEKS)) {
      let next = node.children.get(d);
      if (!next) {
        next = { id: `${node.id}.${d}`, depth: node.depth + 1, direction: d, real: false, children: new Map(), branchId: null };
        node.children.set(d, next);
      }
      if (real) next.real = true;
      node = next;
    }
    if (branchId && !node.branchId) node.branchId = branchId;
  };
  insert(realPath, true, null);
  for (const b of branches) insert(b.path, false, b.id);

  // 叶子按深度优先顺序自上而下等距排布，内部节点取子节点 y 的均值
  const leavesInOrder: Trie[] = [];
  const order = (n: Trie) => (n.children.size ? DIRECTIONS.forEach((d) => { const c = n.children.get(d); if (c) order(c); }) : leavesInOrder.push(n));
  order(root);
  const pad = opts.height * PAD_RATIO;
  const span = opts.height - 2 * pad;
  const yOf = new Map<Trie, number>();
  leavesInOrder.forEach((l, i) => yOf.set(l, leavesInOrder.length === 1 ? opts.height / 2 : pad + (i * span) / (leavesInOrder.length - 1)));
  const place = (n: Trie): number => {
    if (yOf.has(n)) return yOf.get(n)!;
    const ys = [...n.children.values()].map(place);
    const y = ys.reduce((a, b) => a + b, 0) / ys.length;
    yOf.set(n, y);
    return y;
  };
  place(root);

  const xOf = (depth: number) => (depth / SEASON_WEEKS) * opts.width;
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  const walk = (n: Trie) => {
    nodes.push({ id: n.id, depth: n.depth, x: xOf(n.depth), y: yOf.get(n)!, direction: n.direction, real: n.real, decorative: false });
    for (const c of n.children.values()) {
      edges.push({ from: n.id, to: c.id, real: n.real && c.real, decorative: false });
      walk(c);
    }
  };
  walk(root);

  const realIds = ["r"];
  for (const d of realPath.slice(0, SEASON_WEEKS)) realIds.push(`${realIds[realIds.length - 1]}.${d}`);

  // 装饰分支：从随机的非叶子真实节点长出 1–3 层
  const rnd = seeded(opts.decorativeSeed);
  const anchors = nodes.filter((n) => n.depth >= 1 && n.depth <= SEASON_WEEKS - 2);
  const step = opts.height / 14;
  for (let k = 0; k < opts.decorativeCount && anchors.length; k++) {
    let parent = anchors[Math.floor(rnd() * anchors.length)];
    const len = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < len && parent.depth < SEASON_WEEKS; j++) {
      const y = Math.min(opts.height, Math.max(0, parent.y + (rnd() * 2 - 1) * step));
      const child: TreeNode = { id: `${parent.id}~d${k}.${j}`, depth: parent.depth + 1, x: xOf(parent.depth + 1), y, direction: null, real: false, decorative: true };
      nodes.push(child);
      edges.push({ from: parent.id, to: child.id, real: false, decorative: true });
      parent = child;
    }
  }

  return {
    nodes,
    edges,
    leaves: leavesInOrder.map((l) => ({ nodeId: l.id, branchId: l.branchId })),
    realPath: realIds,
  };
}
