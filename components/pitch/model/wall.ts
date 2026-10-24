import { seeded } from "@/components/pitch/model/placeholder";

// 平行宇宙墙：几十个「可能的她」铺满画布，最后只留中央真实的那一张。
// 变体只允许镜像、裁切、轻微色调（±25°），不做灰度和降亮度——偏离不是变差。

export type WallCell = {
  x: number;
  y: number;
  size: number;
  src: string | null;
  variant: { flip: boolean; hue: number; crop: number };
  real: boolean;
  delay: number; // 熄灭顺序（秒）：离中心越远越早
};

const GAP_RATIO = 0.1;
const MAX_DELAY = 1.6;

export function buildWall(
  sources: (string | null)[],
  realSrc: string | null,
  opts: { width: number; height: number; count: number; seed: number },
): WallCell[] {
  const { width: W, height: H, count } = opts;
  const cols = Math.ceil(Math.sqrt((count * W) / H));
  const rows = Math.ceil(count / cols);
  const pitch = Math.min(W / cols, H / rows);
  const size = pitch * (1 - GAP_RATIO);
  const ox = (W - cols * pitch) / 2 + (pitch - size) / 2;
  const oy = (H - rows * pitch) / 2 + (pitch - size) / 2;
  const rnd = seeded(opts.seed);

  const cells: WallCell[] = Array.from({ length: count }, (_, i) => ({
    x: ox + (i % cols) * pitch,
    y: oy + Math.floor(i / cols) * pitch,
    size,
    src: sources.length ? sources[Math.floor(rnd() * sources.length)] : realSrc,
    variant: { flip: rnd() < 0.5, hue: Math.round((rnd() * 2 - 1) * 25), crop: 1 + Math.round(rnd() * 30) / 100 },
    real: false,
    delay: 0,
  }));

  const dist = (c: WallCell) => Math.hypot(c.x + size / 2 - W / 2, c.y + size / 2 - H / 2);
  const maxDist = Math.max(...cells.map(dist)) || 1;
  let nearest = cells[0];
  for (const c of cells) {
    c.delay = ((maxDist - dist(c)) / maxDist) * MAX_DELAY;
    if (dist(c) < dist(nearest)) nearest = c;
  }
  Object.assign(nearest, { real: true, src: realSrc, variant: { flip: false, hue: 0, crop: 1 } });
  return cells;
}
