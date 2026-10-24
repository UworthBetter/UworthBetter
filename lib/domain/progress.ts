export const MAX_BLUR_PX = 24;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function completionRate(quests: readonly { done: boolean }[]): number {
  if (quests.length === 0) return 0;
  return quests.filter((q) => q.done).length / quests.length;
}

export function fogBlurPx(rate: number): number {
  return Math.round(MAX_BLUR_PX * (1 - clamp01(rate)));
}

export function remainingToClear(quests: readonly { done: boolean }[]): number {
  return quests.filter((q) => !q.done).length;
}

/** 日期工具：统一使用本地日期字符串 YYYY-MM-DD。 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 第 n 章的结束日 = startDate + 7n - 1 天。返回距结束日剩余天数（含当天，最小 0）。 */
export function daysLeft(startDate: string, chapterNo: number, today: Date = new Date()): number {
  const end = parseDateStr(startDate);
  end.setDate(end.getDate() + 7 * chapterNo - 1);
  const t = parseDateStr(toDateStr(today));
  const diff = Math.round((end.getTime() - t.getTime()) / 86_400_000);
  return Math.max(0, diff + 1);
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export function weekdayOf(dateStr: string): string {
  return WEEKDAYS[parseDateStr(dateStr).getDay()];
}
