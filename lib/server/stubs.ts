/**
 * Phase 0 桩数据：由 fixtures 拼出各接口的 View，让前端（C）在后端完成前即可开发。
 * B 轨道实现真实逻辑后，逐个路由把 stub* 调用替换为真实实现；全部替换后删除本文件。
 */
import type {
  ChapterCard,
  ChapterView,
  FogView,
  FutureSelfView,
  LogView,
  QuestView,
  SeasonView,
} from "@/lib/contracts/api";
import type { JobEvent } from "@/lib/contracts/events";
import { fxChapterBodyMd, fxChapterLetterMd, fxChapterPlan, fxInterview, fxOnboarding } from "@/fixtures";
import { actOf, isActFinale } from "@/lib/domain/skeleton";
import { completionRate, fogBlurPx, remainingToClear } from "@/lib/domain/progress";

/** 预生成的占位图（scripts/gen-stub-images.ts 生成，位于 public/stub/）。 */
export const STUB_IMG = {
  sheetFuture: "/stub/sheet-future.png",
  sheetPresent: "/stub/sheet-present.png",
  cover: (n: number) => `/stub/cover-${n}.png`,
  panel: (i: number) => `/stub/panel-${i}.png`,
};

const roadmapChapters = fxOnboarding.roadmap.acts.flatMap((a) => a.chapters);

// 桩状态：第 1 章已完成，第 2 章进行中（勾选了 1 个任务）
const STUB_CURRENT = 2;

export function stubQuests(chapterNo: number): QuestView[] {
  const src = chapterNo === 1 ? fxOnboarding.roadmap.week1Quests : fxChapterPlan.nextWeekQuests;
  return src.map((q, i) => ({ ...q, id: `stub-q${chapterNo}-${i}`, done: chapterNo < STUB_CURRENT || i === 0 }));
}

export function stubFog(chapterNo: number, quests: QuestView[]): FogView {
  const rate = completionRate(quests);
  return {
    coverUrl: STUB_IMG.cover(chapterNo),
    rate,
    blurPx: fogBlurPx(rate),
    remainingToClear: remainingToClear(quests),
  };
}

export function stubChapterCards(): ChapterCard[] {
  return roadmapChapters.map((c) => ({
    no: c.no,
    title: c.no === 1 ? fxChapterPlan.title : c.title,
    status: c.no < STUB_CURRENT ? "ready" : c.no === STUB_CURRENT ? "in_progress" : "locked",
    type: c.no < STUB_CURRENT ? fxChapterPlan.chapterType : null,
    coverUrl: c.no <= STUB_CURRENT ? STUB_IMG.cover(c.no) : null,
    act: actOf(c.no),
    isActFinale: isActFinale(c.no),
  }));
}

export function stubSeasonView(): SeasonView {
  const chapters = stubChapterCards();
  const cur = roadmapChapters.find((c) => c.no === STUB_CURRENT)!;
  const quests = stubQuests(STUB_CURRENT);
  const ranges = [
    [1, 4],
    [5, 9],
    [10, 13],
  ] as const;
  return {
    season: {
      id: "stub-season",
      title: fxOnboarding.bible.seasonTitle,
      style: fxOnboarding.input.style,
      logline: fxOnboarding.bible.logline,
      startDate: "2026-10-26",
      currentChapter: STUB_CURRENT,
      status: "active",
    },
    futureSelf: {
      name: fxOnboarding.futureSelf.name,
      title: fxOnboarding.futureSelf.title,
      catchphrase: fxOnboarding.futureSelf.catchphrase,
      sheetFutureUrl: STUB_IMG.sheetFuture,
      sheetPresentUrl: STUB_IMG.sheetPresent,
    },
    acts: fxOnboarding.roadmap.acts.map((a, i) => {
      const [from, to] = ranges[i];
      const ready = chapters.filter((c) => c.no >= from && c.no <= to && c.status === "ready").length;
      return { name: a.name, milestone: a.milestone, fromChapter: from, toChapter: to, progress: ready / (to - from + 1) };
    }),
    current: {
      no: cur.no,
      title: cur.title,
      beat: cur.beat,
      isActFinale: isActFinale(cur.no),
      daysLeft: 3,
      quests,
      fog: stubFog(cur.no, quests),
      canFinish: true,
      activeJobId: null,
    },
    chapters,
  };
}

export function stubFutureSelfView(): FutureSelfView {
  return {
    profile: fxOnboarding.futureSelf,
    sheetFutureUrl: STUB_IMG.sheetFuture,
    sheetPresentUrl: STUB_IMG.sheetPresent,
    firstLetterMd: fxOnboarding.firstLetterMd,
    seasonTitle: fxOnboarding.bible.seasonTitle,
    logline: fxOnboarding.bible.logline,
  };
}

/** 气泡默认布局：按分镜序号与对白序号分配锚点（B7 可沿用）。 */
export const BUBBLE_LAYOUT: [number, number][][] = [
  [
    [0.25, 0.18],
    [0.72, 0.3],
  ],
  [
    [0.7, 0.15],
    [0.3, 0.32],
  ],
  [
    [0.28, 0.15],
    [0.72, 0.28],
  ],
  [
    [0.5, 0.15],
    [0.5, 0.32],
  ],
];

export function stubChapterView(n: number): ChapterView {
  const plan = fxChapterPlan;
  const next = roadmapChapters.find((c) => c.no === n + 1);
  return {
    no: n,
    title: plan.title,
    type: plan.chapterType,
    act: actOf(n),
    isActFinale: isActFinale(n),
    coverUrl: STUB_IMG.cover(n),
    bodyMd: fxChapterBodyMd(),
    letterMd: fxChapterLetterMd(),
    letterFrom: fxOnboarding.futureSelf.name,
    panels: plan.panels.map((p, i) => ({
      idx: i,
      imageUrl: STUB_IMG.panel(i),
      narration: p.narration ?? null,
      dialogues: p.dialogues.map((d, j) => ({ ...d, x: BUBBLE_LAYOUT[i][j][0], y: BUBBLE_LAYOUT[i][j][1] })),
    })),
    realEvents: plan.realEventsMapping,
    interview: fxInterview.questions.map((q, i) => ({ q, a: fxInterview.answers[i] })),
    completionRate: 1,
    next: next
      ? {
          no: next.no,
          title: next.title,
          cliffhanger: plan.cliffhanger,
          coverUrl: STUB_IMG.cover(next.no),
          quests: stubQuests(next.no),
        }
      : null,
  };
}

export function stubLogs(chapterNo: number): LogView[] {
  return [
    { id: "stub-log-1", chapterNo, date: "2026-11-02", note: "画手好难，差点放弃", mood: 2, photoUrl: null },
    { id: "stub-log-2", chapterNo, date: "2026-11-03", note: "手机放客厅，画了四十分钟", mood: 4, photoUrl: STUB_IMG.panel(1) },
  ];
}

// ───────────── SSE 桩：按真实节奏回放事件 ─────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function* streamText(target: "body" | "letter", full: string): AsyncGenerator<JobEvent> {
  for (let i = 0; i < full.length; i += 20) {
    yield { type: "delta", target, text: full.slice(i, i + 20) };
    await sleep(50);
  }
}

export async function* stubOnboardingEvents(): AsyncGenerator<JobEvent> {
  const fx = fxOnboarding;
  yield { type: "step", step: "profile", status: "running" };
  await sleep(1500);
  yield {
    type: "step",
    step: "profile",
    status: "done",
    data: { futureSelf: fx.futureSelf, seasonTitle: fx.bible.seasonTitle, logline: fx.bible.logline },
  };
  yield { type: "step", step: "sheet_future", status: "running" };
  yield { type: "step", step: "sheet_present", status: "running" };
  yield { type: "step", step: "roadmap", status: "running" };
  await sleep(1500);
  yield {
    type: "step",
    step: "roadmap",
    status: "done",
    data: { acts: fx.roadmap.acts.map((a) => ({ name: a.name, milestone: a.milestone })) },
  };
  yield { type: "step", step: "letter", status: "running" };
  yield* streamText("letter", fx.firstLetterMd);
  yield { type: "step", step: "letter", status: "done", data: { letterMd: fx.firstLetterMd } };
  yield { type: "step", step: "sheet_future", status: "done", data: { url: STUB_IMG.sheetFuture } };
  yield { type: "step", step: "sheet_present", status: "done", data: { url: STUB_IMG.sheetPresent } };
  yield { type: "step", step: "cover1", status: "running" };
  await sleep(1000);
  yield { type: "step", step: "cover1", status: "done", data: { url: STUB_IMG.cover(1) } };
  yield { type: "done", redirect: "/reveal" };
}

export async function* stubChapterEvents(n: number): AsyncGenerator<JobEvent> {
  const plan = fxChapterPlan;
  yield { type: "step", step: "plan", status: "running" };
  await sleep(1500);
  yield {
    type: "step",
    step: "plan",
    status: "done",
    data: {
      title: plan.title,
      chapterType: plan.chapterType,
      panels: plan.panels.map((p, idx) => ({ idx, narration: p.narration ?? null, dialogues: p.dialogues })),
    },
  };
  yield { type: "step", step: "cover", status: "done", data: { url: STUB_IMG.cover(n) } }; // 封面已由上一章生成
  yield { type: "step", step: "body", status: "running" };
  const body = fxChapterBodyMd();
  const half = Math.floor(body.length / 2);
  yield* streamText("body", body.slice(0, half));
  yield { type: "step", step: "panel0", status: "done", data: { url: STUB_IMG.panel(0) } };
  yield { type: "step", step: "panel1", status: "done", data: { url: STUB_IMG.panel(1) } };
  yield* streamText("body", body.slice(half));
  yield { type: "step", step: "body", status: "done", data: { bodyMd: body } };
  yield { type: "step", step: "panel2", status: "done", data: { url: STUB_IMG.panel(2) } };
  yield { type: "step", step: "panel3", status: "error" }; // 故意演示单图失败 → 前端应显示占位
  yield { type: "step", step: "letter", status: "running" };
  const letter = fxChapterLetterMd();
  yield* streamText("letter", letter);
  yield { type: "step", step: "letter", status: "done", data: { letterMd: letter } };
  yield { type: "step", step: "next_cover", status: "done", data: { url: STUB_IMG.cover(n + 1) } };
  yield { type: "step", step: "save", status: "done", data: {} };
  yield { type: "done", redirect: `/chapter/${n}` };
}
