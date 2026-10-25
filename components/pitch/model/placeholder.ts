import { DIRECTIONS, SEASON_WEEKS, type Direction, type PitchBranch, type PitchData } from "@/components/pitch/model/types";

// E7/E8 数据就绪前的同结构占位。TODO(团队) 标注的文案需要团队补齐。

export const PLACEHOLDER_META: Pick<PitchData, "persona" | "firstLetterQuote" | "team" | "siteUrl"> = {
  persona: { name: "2027年的林夏", title: "颜色修补师", catchphrase: "先画，再说。" },
  firstLetterQuote: "我知道你现在还不信，但我就是你。",
  team: [{ name: "UworthBetter 团队", role: "" }],
  siteUrl: "http://101.200.150.64", // 二维码 public/pitch/qr.svg 编码的是 http://101.200.150.64
};

// 固定种子的线性同余发生器：同一份占位每次渲染一致
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function placeholderBranches(realPath: Direction[]): PitchBranch[] {
  const rnd = seeded(20261025);
  const out: PitchBranch[] = [{ id: "real", path: realPath, imageUrl: "/demo/sheet-future.jpg", headline: "她走过的路" }];
  for (let i = 1; i < 12; i++) {
    // 从真实路径的某一周岔开，之后各自随机
    const fork = 1 + Math.floor(rnd() * (SEASON_WEEKS - 2));
    const path = realPath.map((d, w) => (w < fork ? d : DIRECTIONS[Math.floor(rnd() * DIRECTIONS.length)]));
    out.push({ id: `p${i}`, path, imageUrl: "/demo/sheet-future.jpg", headline: "另一个她" });
  }
  return out;
}
