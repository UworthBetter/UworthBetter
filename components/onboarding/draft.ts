import type { OnboardingRequest, StyleId, TimeBudget } from "@/lib/contracts";

export const DRAFT_KEY = "uwb-onboarding-v3";

export type Draft = {
  goal: string;
  futureDesc: string;
  futureName: string;
  obstacles: string[];
  timeBudget: TimeBudget;
  startingPoint: string;
  style: StyleId;
  nickname: string;
};

/** 界面示例，不从 fixtures 导入。 */
export const SAMPLE: Draft = {
  goal: "90 天后成为一个能靠画画接单的自由插画师，每天早起画两小时，有自己的作品集和第一位付费客户。",
  futureDesc: "她住在一间朝南的小工作室，桌上永远摊着速写本。说话慢慢的，但很笃定。穿宽松的亚麻衬衫，系一条芥末黄围巾。",
  futureName: "2027年的林夏",
  obstacles: ["拖延", "刷手机", "自我怀疑", "怕被评价"],
  timeBudget: "1h",
  startingPoint: "互联网运营，业余画了两年，没有系统练过人体，作品集为零。",
  style: "healing",
  nickname: "林夏",
};

export const PERSONAS: { title: string; draft: Pick<Draft, "goal" | "futureDesc" | "futureName" | "obstacles"> }[] = [
  {
    title: "想做点自己喜欢的事",
    draft: {
      goal: "90 天后，能把喜欢的事做成每周都在发生的习惯，并且拿出一件可以给别人看的作品。",
      futureDesc: "TA 有一处自己的角落，工具摊开着，说话不急，做完才肯停。",
      futureName: "一年后的我",
      obstacles: ["没时间", "自我怀疑"],
    },
  },
  {
    title: "想换一种活法",
    draft: {
      goal: "90 天后离开现在这种耗着的状态，有一份更靠近自己的工作或收入来源。",
      futureDesc: "TA 住得简单，日程自己排，说话直接，不再用忙来解释一切。",
      futureName: "换过活法的我",
      obstacles: ["怕被评价", "没时间", "拖延"],
    },
  },
  {
    title: "想先把自己照顾好",
    draft: {
      goal: "90 天后睡眠稳定，每周有几天能出门走走，情绪不再被同一件事拖一整天。",
      futureDesc: "TA 起得不早也不晚，衣服宽松，说话轻，桌上有一杯放凉了也没关系的水。",
      futureName: "把自己接住的我",
      obstacles: ["刷手机", "自我怀疑"],
    },
  },
];

export function emptyDraft(): Draft {
  return { ...SAMPLE, obstacles: [...SAMPLE.obstacles] };
}

export function loadDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<Draft>;
    const base = emptyDraft();
    return {
      ...base,
      ...parsed,
      obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles.filter((item) => typeof item === "string") : base.obstacles,
      timeBudget: parsed.timeBudget === "15m" || parsed.timeBudget === "30m" || parsed.timeBudget === "1h" || parsed.timeBudget === "2h+" ? parsed.timeBudget : base.timeBudget,
      style: parsed.style === "healing" || parsed.style === "wuxia" || parsed.style === "cyber" ? parsed.style : base.style,
    };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: Draft) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function toRequest(draft: Draft): OnboardingRequest {
  const nickname = draft.nickname.trim();
  return {
    goal: draft.goal.trim(),
    futureDesc: draft.futureDesc.trim(),
    futureName: draft.futureName.trim(),
    obstacles: draft.obstacles.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    timeBudget: draft.timeBudget,
    startingPoint: draft.startingPoint.trim(),
    style: draft.style,
    ...(nickname ? { nickname } : {}),
  };
}
