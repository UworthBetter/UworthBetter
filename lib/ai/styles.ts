/**
 * 文风常量（DESIGN.md 附录 C.1）。前端通过 data-style 属性切换配色，AI 通过 styleSuffix 锁定画风。
 */
import type { StyleId } from "@/lib/contracts/ai";

export const NO_TEXT = "no text, no letters, no words, no captions, no speech bubbles, no watermark";

export const STYLES: Record<StyleId, { label: string; textTone: string; styleSuffix: string }> = {
  healing: {
    label: "治愈绘本",
    textTone: "温柔、细腻、带童话感的第二人称叙事，短句，多用颜色与光影描写",
    styleSuffix: `soft watercolor storybook illustration, warm pastel palette, gentle light, hand-drawn texture, Ghibli-inspired atmosphere, ${NO_TEXT}`,
  },
  wuxia: {
    label: "东方武侠",
    textTone: "古风白话，节奏利落，带江湖气，适度用四字词，不晦涩",
    styleSuffix: `Chinese ink wash painting style, dramatic brush strokes, muted colors with red accents, cinematic composition, misty mountains, no calligraphy, ${NO_TEXT}`,
  },
  cyber: {
    label: "赛博都市",
    textTone: "冷峻、电影感、霓虹意象，内心独白多，偶尔幽默",
    styleSuffix: `cyberpunk anime illustration, neon lights, rainy night city, cinematic lighting, high detail, no signs with writing, ${NO_TEXT}`,
  },
};
