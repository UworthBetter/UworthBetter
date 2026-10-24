import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ChapterPlan, FutureSelfProfile, GoalSuggestion, SeasonRoadmap, StoryBible } from "@/lib/contracts/ai";
import { getAITasks } from "@/lib/ai/tasks";
import { fxChapterContext, fxOnboarding } from "@/fixtures";
import { extractJson } from "@/lib/ai/providers/openaiCompat";
import { STYLES } from "@/lib/ai/styles";

describe("mock AITasks 符合契约", () => {
  const ai = getAITasks();

  it("建档链路", async () => {
    const { futureSelf, bible } = await ai.genProfileAndBible(fxOnboarding.input);
    FutureSelfProfile.parse(futureSelf);
    StoryBible.parse(bible);
    SeasonRoadmap.parse(await ai.genRoadmap({ input: fxOnboarding.input, futureSelf, bible }));
    let streamed = "";
    const letter = await ai.streamFirstLetter({ input: fxOnboarding.input, futureSelf, bible }, (t) => (streamed += t));
    expect(streamed).toBe(letter);
  });

  it("目标推荐", async () => {
    expect(ai.suggestGoals).toBeDefined();
    const suggest = ai.suggestGoals!;
    const Suggestions = z.array(GoalSuggestion).min(3).max(4);
    const first = await suggest({ seed: "学吉他", timeBudget: "1h" });
    const second = await suggest({ seed: "学吉他", timeBudget: "1h" });
    Suggestions.parse(first); // 条数 3–4；goal 5–500 字；tagline 1–20 字
    expect(second).toEqual(first); // 同入参两次调用结果一致
    expect(first.some((s) => s.goal.includes("学吉他"))).toBe(true); // 覆盖 seed 主题词
  });

  it("章节链路", async () => {
    const plan = ChapterPlan.parse(await ai.genChapterPlan({ ...fxChapterContext, chapterType: "low" }));
    expect(plan.chapterType).toBe("low");
    const body = await ai.streamChapterBody(fxChapterContext, plan, () => {});
    expect(body.match(/<!--panel:\d-->/g)).toHaveLength(4);
    expect(await ai.genInterviewQuestions(fxChapterContext)).toHaveLength(3);
  });

  it("图像返回非空 PNG", async () => {
    const img = await ai.genSceneImage({ prompt: "test", style: "healing", refs: [], aspect: "square" });
    expect(img.mime).toBe("image/png");
    expect(img.buffer.length).toBeGreaterThan(1000);
  });

  it("安全检查", async () => {
    expect((await ai.checkSafety("今天画了三张")).crisis).toBe(false);
    expect((await ai.checkSafety("真的不想活了")).crisis).toBe(true);
  });
});

describe("AI 工具函数", () => {
  it("extractJson 兼容代码块与多余文字", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('好的：{"a":1} 以上')).toEqual({ a: 1 });
  });

  it("所有文风后缀都禁止图中文字", () => {
    for (const s of Object.values(STYLES)) expect(s.styleSuffix).toContain("no text");
  });
});
