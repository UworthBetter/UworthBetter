// 路演导航：场景(scene) + 拍(beat)。「下一步」先推进拍，拍走完再进下一场景。

export type Pos = { scene: number; beat: number };
export type NavAction = { type: "next" } | { type: "prev" } | { type: "home" } | { type: "end" } | { type: "goto"; pos: Pos };

const clampInt = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.trunc(n)));

function clamp(beats: readonly number[], p: Pos): Pos {
  const scene = clampInt(p.scene, 0, beats.length - 1);
  return { scene, beat: clampInt(p.beat, 0, beats[scene] - 1) };
}

/** beats[i] = 场景 i 的拍数（≥1） */
export function navReducer(beats: readonly number[], pos: Pos, a: NavAction): Pos {
  const last = beats.length - 1;
  switch (a.type) {
    case "next":
      if (pos.beat < beats[pos.scene] - 1) return { ...pos, beat: pos.beat + 1 };
      return pos.scene < last ? { scene: pos.scene + 1, beat: 0 } : pos;
    case "prev":
      if (pos.beat > 0) return { ...pos, beat: pos.beat - 1 };
      return pos.scene > 0 ? { scene: pos.scene - 1, beat: beats[pos.scene - 1] - 1 } : pos;
    case "home":
      return { scene: 0, beat: 0 };
    case "end":
      return { scene: last, beat: beats[last] - 1 };
    case "goto":
      return clamp(beats, a.pos);
  }
}

export function formatHash(p: Pos): string {
  return `#${p.scene}.${p.beat}`;
}

/** 非法值夹紧到合法范围；完全无法解析 → 起点 */
export function parseHash(h: string, beats: readonly number[]): Pos {
  const m = /^#?(-?\d+)(?:\.(-?\d+))?$/.exec(h.trim());
  if (!m) return { scene: 0, beat: 0 };
  return clamp(beats, { scene: Number(m[1]), beat: Number(m[2] ?? 0) });
}

export type KeyCommand = "next" | "prev" | "home" | "end" | "fullscreen" | "black" | "video" | "notes" | null;

const KEYMAP: Record<string, KeyCommand> = {
  ArrowRight: "next", ArrowDown: "next", " ": "next", PageDown: "next", Enter: "next",
  ArrowLeft: "prev", ArrowUp: "prev", PageUp: "prev",
  Home: "home", End: "end",
  f: "fullscreen", b: "black", v: "video", s: "notes",
};

export function keyToCommand(key: string): KeyCommand {
  return KEYMAP[key] ?? KEYMAP[key.toLowerCase()] ?? null;
}

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** iframe 内的按键是否转发给路演页：只转发翻页类，且不在输入控件中 */
export function shouldForwardKey(key: string, target: { tagName: string; isContentEditable: boolean } | null): boolean {
  const cmd = keyToCommand(key);
  if (cmd !== "next" && cmd !== "prev") return false;
  return !target || (!EDITABLE.has(target.tagName) && !target.isContentEditable);
}
