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
