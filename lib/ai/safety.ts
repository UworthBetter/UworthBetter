/**
 * 安全护栏（DESIGN.md 8.7）。A11 负责完善：关键词快筛 + 小模型二次确认。
 */
export const CRISIS_KEYWORDS = ["不想活", "想死", "自杀", "轻生", "结束生命", "割腕", "跳楼", "活着没意思", "活不下去"];

export const CRISIS_MESSAGE =
  "看到你写下的这些话，我们很在意你。故事可以先停一停，你现在的感受更重要。如果你正经历很难熬的时刻，请联系身边信任的人，或拨打下面的心理援助热线。";

// ⚠️ 上线前请核实号码（A11 / D5 负责）
export const HOTLINES = [
  { name: "全国心理援助热线", phone: "400-161-9995" },
  { name: "北京心理危机研究与干预中心", phone: "010-82951332" },
];

export function hitCrisisKeyword(text: string): boolean {
  return CRISIS_KEYWORDS.some((k) => text.includes(k));
}
