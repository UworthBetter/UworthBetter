/**
 * 文本类任务的 Mock 实现：返回 fixtures，带模拟延迟与模拟流式。
 */
import { env } from "@/lib/env";
import type { AITasks, OnDelta } from "@/lib/contracts/aiTasks";
import {
  fxChapterBodyMd,
  fxChapterLetterMd,
  fxChapterPlan,
  fxInterview,
  fxOnboarding,
} from "@/fixtures";
import { hitCrisisKeyword } from "../safety";

export type TextTasks = Omit<AITasks, "genCharacterSheet" | "genSceneImage">;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 模拟流式：每 50ms 推送 20 个字符。 */
export async function fakeStream(full: string, onDelta: OnDelta): Promise<string> {
  for (let i = 0; i < full.length; i += 20) {
    onDelta(full.slice(i, i + 20));
    await sleep(50);
  }
  return full;
}

export const mockTextTasks: TextTasks = {
  async genProfileAndBible(input) {
    await sleep(env.MOCK_LATENCY_MS);
    return {
      futureSelf: { ...fxOnboarding.futureSelf, name: input.futureName || fxOnboarding.futureSelf.name },
      bible: fxOnboarding.bible,
    };
  },
  async suggestGoals({ seed, timeBudget }) {
    await sleep(env.MOCK_LATENCY_MS);
    // 模板按关键词拼装，让 mock 模式下推荐也有"针对感"；不消耗额度。
    const topic = seed.trim().slice(0, 12) || "想做的事";
    const pace = timeBudget === "15m" || timeBudget === "30m" ? "每天 15 分钟" : "每天 1 小时";
    return [
      { tagline: "习惯养成", goal: `90 天后，${topic}成为每周都在发生的习惯：从 ${pace} 起步，累计拿出 3 件可以给别人看的作品。` },
      { tagline: "拿到回音", goal: `90 天后，${topic}换来第一个外部认可——一次公开展示、一位愿意付费的人，或一条具体的正面反馈。` },
      { tagline: "搭起系统", goal: `90 天后，为${topic}搭起一套自己的小系统：固定练习时段、素材库和每周复盘，不再靠情绪驱动。` },
      { tagline: "身份转变", goal: `90 天后，朋友提起我时会想到「${topic}」——它不再只是兴趣，而是我身上看得见的部分。` },
    ];
  },
  async genRoadmap() {
    await sleep(env.MOCK_LATENCY_MS);
    return fxOnboarding.roadmap;
  },
  async streamFirstLetter(_args, onDelta) {
    await sleep(env.MOCK_LATENCY_MS / 2);
    return fakeStream(fxOnboarding.firstLetterMd, onDelta);
  },
  async genInterviewQuestions() {
    await sleep(env.MOCK_LATENCY_MS);
    return [...fxInterview.questions];
  },
  async genChapterPlan(ctx) {
    await sleep(env.MOCK_LATENCY_MS);
    return { ...fxChapterPlan, chapterType: ctx.chapterType };
  },
  async streamChapterBody(_ctx, _plan, onDelta) {
    return fakeStream(fxChapterBodyMd(), onDelta);
  },
  async streamChapterLetter(_ctx, _plan, onDelta) {
    return fakeStream(fxChapterLetterMd(), onDelta);
  },
  async captionPhoto() {
    await sleep(env.MOCK_LATENCY_MS / 2);
    return "书桌上摊开的速写本和一支削短的铅笔";
  },
  async checkSafety(text) {
    return hitCrisisKeyword(text) ? { crisis: true, reason: "keyword" } : { crisis: false };
  },
};
