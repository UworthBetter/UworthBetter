/**
 * 季度叙事骨架与章节/幕的换算。纯函数，前后端均可导入。
 */

export const TOTAL_CHAPTERS = 13;

/** 每幕覆盖的章节区间（闭区间）。 */
export const ACT_RANGES = [
  { act: 1, from: 1, to: 4 },
  { act: 2, from: 5, to: 9 },
  { act: 3, from: 10, to: 13 },
] as const;

export const ACT_FINALES = [4, 9, 13] as const;

export function actOf(chapterNo: number): 1 | 2 | 3 {
  if (chapterNo <= 4) return 1;
  if (chapterNo <= 9) return 2;
  return 3;
}

export function isActFinale(chapterNo: number): boolean {
  return (ACT_FINALES as readonly number[]).includes(chapterNo);
}

/** 给 AI 的叙事骨架提示（DESIGN.md 4.5）。 */
export const SKELETON: Record<number, string> = {
  1: "平凡世界 + 召唤：未来的你第一次出现",
  2: "拒绝与跨越门槛：第一个小胜利",
  3: "结识盟友/获得工具：建立节奏",
  4: "★幕终：第一次正面遭遇反派（里程碑 1）",
  5: "新挑战、技能升级",
  6: "新挑战、技能升级",
  7: "中点反转：发现目标的更深意义",
  8: "至暗时刻（常与真实低谷重合）",
  9: "★幕终：重整旗鼓（里程碑 2）",
  10: "最终准备、回收伏笔",
  11: "最终准备、回收伏笔",
  12: "最终准备、回收伏笔",
  13: "★终章：主角与未来的你相遇/重合（里程碑 3）+ 季初来信揭晓",
};
