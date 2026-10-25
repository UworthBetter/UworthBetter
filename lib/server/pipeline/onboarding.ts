import { eq } from "drizzle-orm";
import { OnboardingInput, SeasonRoadmap } from "@/lib/contracts/ai";
import { firstCoverPrompt, getAITasks } from "@/lib/ai/tasks";
import { adaptQuests } from "@/lib/domain/questRules";
import { db, schema } from "@/lib/server/db/client";
import { createJob } from "@/lib/server/jobs";
import { insertQuests } from "@/lib/server/records";
import { deleteImage } from "@/lib/server/storage";
import { imageStep } from "@/lib/server/pipeline/steps";

export function startOnboarding(seasonId: string, input: OnboardingInput): string {
  return createJob("onboarding", seasonId, async (ctx) => {
    const ai = getAITasks();
    try {
      ctx.emit({ type: "step", step: "profile", status: "running" });
      const { futureSelf, bible } = await ai.genProfileAndBible(input);
      const self = db.insert(schema.futureSelves).values({
        userId: db.select().from(schema.seasons).where(eq(schema.seasons.id, seasonId)).get()!.userId,
        profile: futureSelf,
      }).returning().get();
      db.update(schema.seasons).set({ futureSelfId: self.id, bible, title: bible.seasonTitle }).where(eq(schema.seasons.id, seasonId)).run();
      ctx.emit({ type: "step", step: "profile", status: "done", data: { futureSelf, seasonTitle: bible.seasonTitle, logline: bible.logline } });
      const args = { style: input.style, futureSelf, bible, selfie: input.selfieUrl ? { url: input.selfieUrl } : undefined };
      // 等待所有分支结束后才处理失败，避免迟到分支在回滚后继续写入。
      const results = await Promise.allSettled([
        imageStep(ctx, "sheet_future", () => ai.genCharacterSheet({ ...args, which: "future" })),
        imageStep(ctx, "sheet_present", () => ai.genCharacterSheet({ ...args, which: "present" })),
        (async () => {
          ctx.emit({ type: "step", step: "roadmap", status: "running" });
          const roadmap = SeasonRoadmap.parse(await ai.genRoadmap({ input, futureSelf, bible }));
          const numbers = roadmap.acts.flatMap((a) => a.chapters.map((c) => c.no));
          if (numbers.length !== 13 || numbers.some((n, i) => n !== i + 1) ||
            roadmap.acts[0].chapters.length !== 4 || roadmap.acts[1].chapters.length !== 5) throw new Error("路线图章节范围不正确");
          ctx.emit({ type: "step", step: "roadmap", status: "done", data: { acts: roadmap.acts.map(({ name, milestone }) => ({ name, milestone })) } });
          return roadmap;
        })(),
      ]);
      const [future, present, road] = results;
      if (road.status === "rejected") throw road.reason;
      const roadmap = road.value;
      db.update(schema.futureSelves).set({ sheetFutureUrl: future.status === "fulfilled" ? future.value : null,
        sheetPresentUrl: present.status === "fulfilled" ? present.value : null }).where(eq(schema.futureSelves.id, self.id)).run();
      ctx.emit({ type: "step", step: "letter", status: "running" });
      const letter = await ai.streamFirstLetter({ input, futureSelf, bible }, (text) => ctx.emit({ type: "delta", target: "letter", text }));
      ctx.emit({ type: "step", step: "letter", status: "done", data: { letterMd: letter } });
      db.transaction((tx) => {
        tx.update(schema.seasons).set({ roadmap, firstLetterMd: letter }).where(eq(schema.seasons.id, seasonId)).run();
        tx.insert(schema.chapters).values(roadmap.acts.flatMap((a) => a.chapters).map((c) => ({
          seasonId, chapterNo: c.no, title: c.title, status: c.no === 1 ? "in_progress" as const : "locked" as const,
        }))).run();
        // 首周没有完成度数据，rate 传 1（不触发低谷规则），但仍受 questCount 上限约束。
        insertQuests(seasonId, 1, adaptQuests(roadmap.week1Quests, 1, input.questCount), tx);
      });
      const url = await imageStep(ctx, "cover1", () => ai.genSceneImage({
        prompt: firstCoverPrompt(bible, roadmap.acts[0].chapters[0].title), style: input.style,
        refs: future.status === "fulfilled" && future.value ? [{ url: future.value }] : [], aspect: "portrait",
      }));
      const chapter = db.select().from(schema.chapters).all().find((c) => c.seasonId === seasonId && c.chapterNo === 1)!;
      db.update(schema.chapters).set({ coverUrl: url }).where(eq(schema.chapters.id, chapter.id)).run();
      if (input.selfieUrl) await deleteImage(input.selfieUrl);
      db.update(schema.seasons).set({ status: "active" }).where(eq(schema.seasons.id, seasonId)).run();
      ctx.emit({ type: "done", redirect: "/reveal" });
    } finally {
      if (input.selfieUrl) await deleteImage(input.selfieUrl).catch((error) => console.error("自拍清理失败", error));
    }
  });
}
