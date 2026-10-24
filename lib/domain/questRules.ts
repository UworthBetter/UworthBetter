import type { Quest } from "@/lib/contracts/ai";
import { HIGHLIGHT_THRESHOLD, STRUGGLE_THRESHOLD } from "./chapterType";

/** 低谷后插入的「超小启动任务」。 */
export const TINY_START_QUEST: Quest = {
  text: "打开工具 5 分钟，做不做都算完成",
  difficulty: 1,
  isKey: false,
  storyHook: "完成后：雾里亮起一盏小灯",
};

/**
 * 在 AI 建议的下周任务上应用硬规则（DESIGN.md 8.5）：
 * - rate < 40%：最多 3 个，全部 difficulty=1，首位插入超小启动任务
 * - 40% ≤ rate < 80%：difficulty 最高 2
 * - rate ≥ 80%：最多允许 1 个 difficulty=3
 * - 始终恰好 1 个 isKey=true（优先保留 AI 标注的第一个）
 */
export function adaptQuests(suggested: readonly Quest[], rate: number): Quest[] {
  let qs = suggested.map((q) => ({ ...q }));

  if (rate < STRUGGLE_THRESHOLD) {
    qs = qs.slice(0, 2).map((q) => ({ ...q, difficulty: 1 }));
    qs.unshift({ ...TINY_START_QUEST });
  } else if (rate < HIGHLIGHT_THRESHOLD) {
    qs = qs.slice(0, 5).map((q) => ({ ...q, difficulty: Math.min(q.difficulty, 2) }));
  } else {
    let hardSeen = false;
    qs = qs.slice(0, 5).map((q) => {
      if (q.difficulty < 3) return q;
      if (hardSeen) return { ...q, difficulty: 2 };
      hardSeen = true;
      return q;
    });
  }

  // 没有 AI 标注的关键任务时：低谷档跳过首位的启动任务，其余取第一个
  const keyIdx = qs.findIndex((q) => q.isKey);
  const fallback = rate < STRUGGLE_THRESHOLD && qs.length > 1 ? 1 : 0;
  const target = keyIdx >= 0 ? keyIdx : fallback;
  return qs.map((q, i) => ({ ...q, isKey: i === target }));
}
