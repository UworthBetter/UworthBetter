/**
 * Fixture 统一入口：加载并用契约 schema 校验。供 Mock AI、API 桩、测试、评测脚本使用。
 * 内容归 D 维护，格式归 A 维护。修改 JSON 后运行 pnpm test 确认仍通过校验。
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ChapterContext,
  ChapterPlan,
  FutureSelfProfile,
  OnboardingInput,
  SeasonRoadmap,
  StoryBible,
} from "@/lib/contracts/ai";
import onboardingJson from "./onboarding.json";
import chapterPlanJson from "./chapter-plan.json";
import interviewJson from "./interview.json";
import chapterContextPartialJson from "./chapter-context.partial.json";

const readMd = (name: string) => fs.readFileSync(path.join(process.cwd(), "fixtures", name), "utf8");

export const fxOnboarding = z
  .object({
    input: OnboardingInput,
    futureSelf: FutureSelfProfile,
    bible: StoryBible,
    roadmap: SeasonRoadmap,
    firstLetterMd: z.string(),
  })
  .parse(onboardingJson);

export const fxChapterPlan = ChapterPlan.parse(chapterPlanJson);

export const fxInterview = z
  .object({ questions: z.array(z.string()).length(3), answers: z.array(z.string()).length(3) })
  .parse(interviewJson);

export const fxChapterContext = ChapterContext.parse({
  ...chapterContextPartialJson,
  futureSelf: fxOnboarding.futureSelf,
  bible: fxOnboarding.bible,
});

export const fxChapterBodyMd = () => readMd("chapter-body.md");
export const fxChapterLetterMd = () => readMd("chapter-letter.md");
