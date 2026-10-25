import pLimit from "p-limit";
import { eq } from "drizzle-orm";
import { ChapterPlan } from "@/lib/contracts/ai";
import type { ImageRef } from "@/lib/contracts/aiTasks";
import { coverPrompt, getAITasks, panelPrompt } from "@/lib/ai/tasks";
import { env } from "@/lib/env";
import { adaptQuests } from "@/lib/domain/questRules";
import { db, schema } from "@/lib/server/db/client";
import { buildSafeChapterContext } from "@/lib/server/context";
import { createJob } from "@/lib/server/jobs";
import { bubbleLayout, getChapter, insertQuests, requireEditable } from "@/lib/server/records";
import { futureSelf } from "@/lib/server/views";
import { imageStep } from "@/lib/server/pipeline/steps";
import { demoChapter } from "@/lib/server/demoData";
import { fxChapterBodyMd, fxChapterLetterMd, fxChapterPlan } from "@/fixtures";

const PANEL_STEPS = ["panel0", "panel1", "panel2", "panel3"] as const;

export function startChapter(season: typeof schema.seasons.$inferSelect, n: number, cached = false): string {
  const chapter = requireEditable(season, n);
  const jobId = createJob("chapter", chapter.id, async (ctx) => {
    const ai = getAITasks();
    try {
      const context = await buildSafeChapterContext(season.id, n);
      const self = futureSelf(season);
      const refs: ImageRef[] = [self.sheetPresentUrl, self.sheetFutureUrl].flatMap((url) => url ? [{ url }] : []);
      // 预生成演示数据：cached 回放时优先使用（无预烘数据则完全走原 fixture 回放）。
      const baked = cached ? demoChapter(n) : undefined;
      ctx.emit({ type: "step", step: "plan", status: "running" });
      const plan = ChapterPlan.parse(cached
        ? { ...(baked ? baked.plan : fxChapterPlan), chapterType: baked ? baked.chapterType : context.chapterType }
        : await ai.genChapterPlan(context));
      // 完成度类型由领域规则决定，不能被 AI 输出覆盖；预烘数据例外（正文按预设完成度写成，类型用预烘值）。
      if (!baked) plan.chapterType = context.chapterType;
      ctx.emit({ type: "step", step: "plan", status: "done", data: { title: plan.title, chapterType: plan.chapterType,
        panels: plan.panels.map((p, idx) => ({ idx, narration: p.narration ?? null, dialogues: p.dialogues.map((d, j) => ({ ...d, x: bubbleLayout[idx][j * 2], y: bubbleLayout[idx][j * 2 + 1] })) })) } });
      const limit = pLimit(env.IMAGE_CONCURRENCY);
      const scene = (step: "cover" | "next_cover" | "panel0" | "panel1" | "panel2" | "panel3", prompt: string, sceneRefs = refs) => limit(async () => {
        if (cached) {
          // 预烘图像直接 emit done；缺失（null）时回退到 stub 路径。
          const bakedUrl = !baked ? null
            : step === "cover" ? baked.cover
            : step === "next_cover" ? baked.nextCover
            : baked.panels[Number(step.slice(-1))];
          const url = bakedUrl ?? (step.startsWith("panel") ? `/stub/panel-${step.slice(-1)}.png` : `/stub/cover-${step === "next_cover" ? n + 1 : n}.png`);
          ctx.emit({ type: "step", step, status: "done", data: { url } });
          return url;
        }
        return imageStep(ctx, step, () => ai.genSceneImage({ prompt, style: season.style, refs: sceneRefs, aspect: step.startsWith("panel") ? "landscape" : "portrait" }));
      });
      const coverTask = chapter.coverUrl
        ? Promise.resolve(chapter.coverUrl).then((url) => { ctx.emit({ type: "step", step: "cover", status: "done", data: { url } }); return url; })
        : scene("cover", coverPrompt(plan.coverPrompt, context.bible));
      const panelTasks = plan.panels.map((p, i) => {
        const panelRefs = [p.characters.includes("protagonist") ? self.sheetPresentUrl : null,
          p.characters.includes("mentor") ? self.sheetFutureUrl : null].flatMap((url) => url ? [{ url }] : []);
        return scene(PANEL_STEPS[i], panelPrompt(p, context.futureSelf, context.bible), panelRefs);
      });
      const nextTask = n < 13 ? scene("next_cover", coverPrompt(plan.nextCoverPrompt, context.bible)) : Promise.resolve(null);
      const textTask = (async () => {
        ctx.emit({ type: "step", step: "body", status: "running" });
        const replay = async (target: "body" | "letter", full: string) => {
          for (let i = 0; i < full.length; i += 40) {
            ctx.emit({ type: "delta", target, text: full.slice(i, i + 40) });
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          return full;
        };
        const bodyMd = cached ? await replay("body", baked ? baked.bodyMd : fxChapterBodyMd())
          : await ai.streamChapterBody(context, plan, (text) => ctx.emit({ type: "delta", target: "body", text }));
        ctx.emit({ type: "step", step: "body", status: "done", data: { bodyMd } });
        ctx.emit({ type: "step", step: "letter", status: "running" });
        const letterMd = cached ? await replay("letter", baked ? baked.letterMd : fxChapterLetterMd())
          : await ai.streamChapterLetter(context, plan, (text) => ctx.emit({ type: "delta", target: "letter", text }));
        ctx.emit({ type: "step", step: "letter", status: "done", data: { letterMd } });
        return { bodyMd, letterMd };
      })();
      const results = await Promise.allSettled([textTask, Promise.all([coverTask, ...panelTasks, nextTask])]);
      const [textResult, imageResult] = results;
      if (textResult.status === "rejected") throw textResult.reason;
      if (imageResult.status === "rejected") throw imageResult.reason;
      const [coverUrl, ...images] = imageResult.value;
      ctx.emit({ type: "step", step: "save", status: "running" });
      db.transaction((tx) => {
        tx.update(schema.chapters).set({ status: "ready", title: plan.title, plan, ...textResult.value,
          summary: plan.summary, chapterType: baked ? baked.chapterType : context.chapterType,
          completionRate: baked ? baked.completionRate : context.completionRate,
          coverUrl, generatedAt: new Date(), activeJobId: null }).where(eq(schema.chapters.id, chapter.id)).run();
        tx.delete(schema.panels).where(eq(schema.panels.chapterId, chapter.id)).run();
        tx.insert(schema.panels).values(plan.panels.map((p, idx) => ({ chapterId: chapter.id, idx,
          sceneDesc: p.scene, narration: p.narration ?? null, imageUrl: images[idx],
          dialogues: p.dialogues.map((d, j) => ({ ...d, x: bubbleLayout[idx][j * 2], y: bubbleLayout[idx][j * 2 + 1] })),
        }))).run();
        const foreshadowing = new Map(context.bible.foreshadowing.filter((f) => !plan.foreshadowingResolve.includes(f.id)).map((f) => [f.id, f]));
        for (const f of plan.foreshadowingAdd) foreshadowing.set(f.id, f);
        tx.update(schema.seasons).set({ bible: { ...context.bible, foreshadowing: [...foreshadowing.values()] },
          currentChapter: Math.min(n + 1, 13), status: n === 13 ? "finished" : "active" }).where(eq(schema.seasons.id, season.id)).run();
        if (n < 13) {
          const next = getChapter(season.id, n + 1);
          tx.update(schema.chapters).set({ status: "in_progress", coverUrl: images[4] }).where(eq(schema.chapters.id, next.id)).run();
          insertQuests(season.id, n + 1, adaptQuests(plan.nextWeekQuests, context.completionRate, context.questCount), tx);
        }
      });
      ctx.emit({ type: "step", step: "save", status: "done", data: {} });
      ctx.emit({ type: "done", redirect: `/chapter/${n}` });
    } catch (error) {
      db.update(schema.chapters).set({ status: "in_progress", activeJobId: null }).where(eq(schema.chapters.id, chapter.id)).run();
      throw error;
    }
  });
  db.update(schema.chapters).set({ status: "generating", activeJobId: jobId }).where(eq(schema.chapters.id, chapter.id)).run();
  return jobId;
}
