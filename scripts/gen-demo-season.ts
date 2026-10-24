/**
 * 一次性全季预生成：pnpm gen:demo-season [--chapters=1,2] [--force]
 *
 * 用真实文本（TEXT_MODEL_FAST = glm-5.3-flash，按用户要求全部走 fast 档）+ 真实图像
 * （AI_IMAGE_PROVIDER，当前 sidrune.ai / gpt-image-2）把林夏的 13 章离线生成一遍：
 *   - 文本固化到 seed/demo-season.json（供 demoData.ts 加载、cached 回放）
 *   - 图像 sharp 压缩为 JPEG 固化到 public/demo/
 * 支持断点续跑：JSON 里已有的章节跳过文本（--force 重生成），图片文件已存在则跳过。
 * 幂等可中断，失败章节下次重跑即可。
 */
import "./_env";

// 必须在 import 任何 lib 模块之前设置：本脚本固定真实双通道
process.env.AI_TEXT_PROVIDER = "openai-compat";
process.env.AI_SUGGEST_PROVIDER = "mock";
process.env.IMAGE_CONCURRENCY = process.env.IMAGE_CONCURRENCY || "4";

import fs from "node:fs";
import path from "node:path";
import pLimit from "p-limit";
import sharp from "sharp";
import { z } from "zod";
import { ChapterPlan } from "@/lib/contracts/ai";
import type { Quest } from "@/lib/contracts/ai";
import type { DemoSeasonData } from "@/lib/server/demoData";
import { STYLES } from "@/lib/ai/styles";
import { actOf, isActFinale } from "@/lib/domain/skeleton";
import { adaptQuests } from "@/lib/domain/questRules";

// ───────────── 参数 ─────────────
const argv = process.argv.slice(2);
const force = argv.includes("--force");
const chaptersArg = argv.find((a) => a.startsWith("--chapters="))?.slice(11);
const wanted = new Set<number>(chaptersArg ? chaptersArg.split(",").map(Number).filter((n) => n >= 1 && n <= 13) : Array.from({ length: 13 }, (_, i) => i + 1));

// ───────────── 章节弧线（预设剧本：覆盖 4 种章节类型 + 幕终高潮）─────────────
const ARC: { type: "highlight" | "struggle" | "low" | "rest"; rate: number }[] = [
  { type: "highlight", rate: 1 }, { type: "highlight", rate: 1 }, { type: "low", rate: 0.2 }, { type: "highlight", rate: 1 },
  { type: "highlight", rate: 1 }, { type: "struggle", rate: 0.6 }, { type: "highlight", rate: 1 }, { type: "struggle", rate: 0.6 }, { type: "highlight", rate: 1 },
  { type: "highlight", rate: 1 }, { type: "low", rate: 0.2 }, { type: "rest", rate: 0.7 }, { type: "highlight", rate: 1 },
];
const TYPE_TONE: Record<string, string> = {
  highlight: "明亮、有突破感，主角击退反派一次进攻，获得新能力或道具",
  struggle: "有拉锯，小胜与小挫交织，主角发现一个关键卡点",
  low: "主角被反派困住，氛围压抑但温柔；结尾未来的你出现或回忆闪回，点燃一束光",
  rest: "营地休整，主角回忆初心，与盟友对话，为重新出发蓄力",
};
const LOG_POOL: Record<string, { note: string; mood: number }[]> = {
  highlight: [
    { note: "画完了一张练习稿，手终于不抖了", mood: 5 },
    { note: "在街上捡到一组新的配色，记在了本子上", mood: 4 },
    { note: "今天提前半小时开始画，居然不难", mood: 4 },
  ],
  struggle: [
    { note: "画到一半卡住了，出去走了一圈", mood: 3 },
    { note: "人体结构又画歪了，明天重来", mood: 3 },
    { note: "今天只画了二十分钟，但好歹画了", mood: 4 },
  ],
  low: [
    { note: "好累，今天先让自己休息", mood: 2 },
    { note: "坐在画本前半小时，一笔没动", mood: 2 },
    { note: "又刷了一晚上手机，不想说话", mood: 1 },
  ],
  rest: [
    { note: "睡到自然醒，去海边走了走", mood: 4 },
    { note: "和阿婆聊了一下午天，她年轻时的事", mood: 4 },
    { note: "翻旧速写本，居然看到进步", mood: 4 },
  ],
};
/** 林夏外貌的英文锚点（bible 里是中文，图像 prompt 需要英文）。 */
const EN_PROTAGONIST = "short black bob hair, round glasses, grey hoodie";
const EN_MENTOR = "young woman with short black bob hair, round glasses, mustard-yellow scarf over white linen shirt, pencil tucked behind her ear";

const SEED_PATH = path.resolve("seed/demo-season.json");
const IMG_DIR = path.resolve("public/demo");
const START_DATE = new Date();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 451/429 等失败图像的补生成：低并发 + 请求间隔，顺带清洗标题前缀（"第1幕第4章：xxx"→"xxx"）。 */
async function repairImages() {
  const { fxOnboarding } = await import("@/fixtures");
  const { getImageProvider } = await import("@/lib/ai/providers/image");
  const img = await getImageProvider();
  const suffix = STYLES[fxOnboarding.input.style].styleSuffix;
  const data = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as {
    sheets: { future: string | null; present: string | null };
    chapters: { no: number; title: string; cover: string | null; panels: (string | null)[]; nextCover: string | null;
      plan: { coverPrompt: string; nextCoverPrompt: string; panels: { scene: string; characters: string[]; shot: string }[] } }[];
  };
  const limit = pLimit(2);
  const ensure = (name: string, prompt: string, aspect: "portrait" | "landscape") => {
    const file = path.join(IMG_DIR, `${name}.jpg`);
    if (fs.existsSync(file)) return Promise.resolve(`/demo/${name}.jpg`);
    return limit(async () => {
      await sleep(2500); // 避开中转站限流
      try {
        const { buffer } = await img.generate({ prompt, refs: [], aspect, label: `repair-${name}` });
        const jpg = await sharp(buffer).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        fs.writeFileSync(file, jpg);
        console.log(`  [repair] ${name} ok ${Math.round(jpg.length / 1024)}KB`);
        return `/demo/${name}.jpg`;
      } catch (e) {
        console.warn(`  [repair] ${name} 失败：${e instanceof Error ? e.message.slice(0, 120) : e}`);
        return null;
      }
    });
  };
  const panelPrompt = (p: { scene: string; characters: string[]; shot: string }) => {
    const who = p.characters.map((c) => c === "protagonist" ? `the protagonist (${EN_PROTAGONIST})` : c === "mentor" ? `the future self (${EN_MENTOR})` : c === "antagonist" ? "the antagonist: grey fog visualized as an abstract force" : "an ally").join(", ");
    const shot: Record<string, string> = { wide: "Wide shot", medium: "Medium shot", closeup: "Close-up", over_shoulder: "Over-the-shoulder shot" };
    return `${shot[p.shot] ?? "Medium shot"} of ${who}. ${p.scene}. ${suffix}`;
  };
  for (const c of data.chapters) {
    const n = c.no;
    if (!c.cover) c.cover = await ensure(`cover-${n}`, `${c.plan.coverPrompt}. ${suffix}`, "portrait");
    for (let i = 0; i < 4; i++) if (!c.panels[i]) c.panels[i] = await ensure(`panel-${n}-${i}`, panelPrompt(c.plan.panels[i]), "landscape");
    if (n < 13 && !c.nextCover) c.nextCover = await ensure(`cover-${n + 1}`, `${c.plan.nextCoverPrompt}. ${suffix}`, "portrait");
    // 标题清洗：去掉模型自加的"第X幕第Y章："前缀与繁体"時"
    c.title = c.title.replace(/^第[一二三1-3]幕\s*第?\d+\s*[章周][：:·、\s]*/, "").replace(/^第\d+\s*[章周][：:·、\s]*/, "").replace(/時/g, "时").trim() || c.title;
    fs.writeFileSync(SEED_PATH, JSON.stringify(data, null, 2));
  }
  const missing = data.chapters.flatMap((c) => [c.cover, ...c.panels, c.nextCover].filter((u) => !u));
  console.log(`补图完成，仍缺失 ${missing.length} 张（前端会显示占位图）`);
}

const ensurePanelMarkers = (body: string): string => {
  const count = (body.match(/<!--panel:\d-->/g) ?? []).length;
  if (count >= 4) return body;
  const paras = body.split(/\n{2,}/);
  const missing = 4 - count;
  const step = Math.max(1, Math.floor(paras.length / (missing + 1)));
  let inserted = 0;
  const out: string[] = [];
  paras.forEach((p, i) => {
    out.push(p);
    if (inserted < missing && (i + 1) % step === 0) {
      out.push(`<!--panel:${count + inserted}>`);
      inserted++;
    }
  });
  return out.join("\n\n");
};

/** 宽松版 ChapterPlan：先收下 flash 模型的输出，再在本地归一化到严格契约。 */
const LoosePlan = z.object({
  title: z.string().default(""),
  chapterType: z.string().default("highlight"),
  realEventsMapping: z.array(z.any()).default([]),
  beats: z.array(z.any()).default([]),
  panels: z.array(z.any()).default([]),
  coverPrompt: z.string().default(""),
  interviewQuote: z.string().nullish(),
  cliffhanger: z.string().default(""),
  foreshadowingAdd: z.array(z.any()).default([]),
  foreshadowingResolve: z.array(z.any()).default([]),
  summary: z.string().default(""),
  nextCoverPrompt: z.string().default(""),
  nextWeekQuests: z.array(z.any()).default([]),
});

/** 归一化：裁剪长度、补默认值，最后过严格 ChapterPlan 校验。 */
/* eslint-disable @typescript-eslint/no-explicit-any -- 一次性生成脚本：flash 输出的中间形态需要宽松类型 */
const normalizePlan = (raw: unknown): ChapterPlan => {
  const p = LoosePlan.parse(raw) as Record<string, any> & { panels: any[]; beats: any[] };
  const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  const quests = (p.nextWeekQuests as any[])
    .filter((q) => typeof q?.text === "string" && q.text.trim().length >= 2)
    .slice(0, 5)
    .map((q) => ({ text: str(q.text, 60), difficulty: Math.min(3, Math.max(1, Number(q.difficulty) || 1)),
      isKey: q.isKey === true, storyHook: typeof q.storyHook === "string" ? str(q.storyHook, 40) : "" }));
  // flash 偶尔给出的任务缺字段被过滤后不足 3 条，用保底任务补齐（契约要求 min 3）
  const PAD: { text: string; difficulty: number; isKey: boolean; storyHook: string }[] = [
    { text: "每天画 20 分钟速写，共 5 天", difficulty: 1, isKey: false, storyHook: "完成后：港口的颜色亮了一格" },
    { text: "把本周最满意的一张画贴到墙上", difficulty: 1, isKey: false, storyHook: "完成后：晾衣绳上多了一件作品" },
    { text: "整理这周的练习稿到一个文件夹", difficulty: 1, isKey: false, storyHook: "完成后：颜色图鉴厚了一页" },
  ];
  while (quests.length < 3) quests.push({ ...PAD[quests.length % 3] });
  const keyIdx = quests.findIndex((q) => q.isKey);
  p.nextWeekQuests = quests.map((q, i) => ({ ...q, isKey: i === (keyIdx >= 0 ? keyIdx : 0) }));
  p.panels = p.panels.slice(0, 4).map((x) => ({
    scene: str(x?.scene, 600), characters: Array.isArray(x?.characters) ? x.characters.slice(0, 4) : ["protagonist"],
    shot: ["wide", "medium", "closeup", "over_shoulder"].includes(x?.shot) ? x.shot : "medium",
    narration: typeof x?.narration === "string" ? str(x.narration, 60) : undefined,
    dialogues: (Array.isArray(x?.dialogues) ? x.dialogues : []).slice(0, 2)
      .filter((d: any) => typeof d?.text === "string" && d.text.trim()).map((d: any) => ({ speaker: str(d.speaker, 20), text: str(d.text, 40) })),
  }));
  while (p.panels.length < 4) p.panels.push({ scene: "the protagonist by the harbor", characters: ["protagonist"], shot: "medium", dialogues: [] });
  p.beats = [...(p.beats as any[]).slice(0, 4).map((b) => String(b)), ...Array(Math.max(0, 4 - p.beats.length)).fill("")];
  p.foreshadowingAdd = (p.foreshadowingAdd as any[]).filter((f) => f?.id && f?.hint)
    .map((f) => ({ id: str(f.id, 20), hint: str(f.hint, 120), resolveByChapter: Math.min(13, Math.max(1, Number(f.resolveByChapter) || 13)) }));
  p.foreshadowingResolve = (p.foreshadowingResolve as any[]).map(String);
  const mappings = (Array.isArray(p.realEventsMapping) ? p.realEventsMapping : []).filter((m) => m?.real && m?.story)
    .slice(0, 6).map((m) => ({ real: str(m.real, 120), story: str(m.story, 120) }));
  p.realEventsMapping = mappings.length ? mappings : [{ real: "本周的记录", story: "小镇一角的变化" }];
  p.interviewQuote = typeof p.interviewQuote === "string" && p.interviewQuote ? p.interviewQuote : undefined;
  p.title = p.title || "无题的一周";
  p.chapterType = ["highlight", "struggle", "low", "rest"].includes(p.chapterType) ? p.chapterType : "highlight";
  p.summary = p.summary || str(p.title, 300);
  p.cliffhanger = p.cliffhanger || "雾在灯塔的方向退开了一线。";
  p.coverPrompt = p.coverPrompt || "misty harbor town at dawn, warm light returning";
  p.nextCoverPrompt = p.nextCoverPrompt || "the harbor under thinning fog";
  return ChapterPlan.parse(p);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

async function main() {
  if (argv.includes("--repair")) return repairImages();
  const { fxOnboarding } = await import("@/fixtures");
  const { getTextProvider } = await import("@/lib/ai/providers/text");
  const { getImageProvider } = await import("@/lib/ai/providers/image");
  const tp = await getTextProvider();
  const img = await getImageProvider();
  const style = STYLES[fxOnboarding.input.style];
  const bible = structuredClone(fxOnboarding.bible);
  const summaries: { no: number; summary: string }[] = [];

  // 断点续跑：读已有 JSON
  type Saved = DemoSeasonData["chapters"];
  let done: Saved = [];
  // 路演用的画像快照（E7）是手工补的数据，重写 JSON 时原样保留
  let portraitSnapshots: unknown;
  if (fs.existsSync(SEED_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as { chapters?: Saved; portraitSnapshots?: unknown };
      portraitSnapshots = prev.portraitSnapshots;
      if (!force) done = prev.chapters ?? [];
    } catch { done = []; }
  }
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(SEED_PATH), { recursive: true });

  const limit = pLimit(Number(process.env.IMAGE_CONCURRENCY || 4));
  const saveImage = async (name: string, prompt: string, aspect: "square" | "portrait" | "landscape"): Promise<string | null> => {
    const file = path.join(IMG_DIR, `${name}.jpg`);
    if (fs.existsSync(file)) return `/demo/${name}.jpg`; // 断点续跑
    return limit(async () => {
      const t0 = Date.now();
      try {
        const { buffer } = await img.generate({ prompt, refs: [], aspect, label: name });
        const jpg = await sharp(buffer).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        fs.writeFileSync(file, jpg);
        console.log(`  [img] ${name} ${Date.now() - t0}ms ${Math.round(jpg.length / 1024)}KB`);
        return `/demo/${name}.jpg`;
      } catch (e) {
        console.warn(`  [img] ${name} 失败：${e instanceof Error ? e.message : e}`);
        return null;
      }
    });
  };

  // 人设图 ×2（C.3 模板）
  const fs1 = await saveImage("sheet-future",
    `Character turnaround reference sheet of ${fxOnboarding.futureSelf.appearance}, ${fxOnboarding.futureSelf.signatureItem}, showing front view, three-quarter view and full body, neutral standing pose, plain white background, consistent outfit. ${style.styleSuffix}`, "portrait");
  const fs2 = await saveImage("sheet-present",
    `Character turnaround reference sheet of the same person but younger office worker look, ${EN_PROTAGONIST}, simpler tired clothes, slightly tired but hopeful expression, plain white background. ${style.styleSuffix}`, "portrait");

  const chapters: Saved = [...done];
  const futureDate = `${START_DATE.getFullYear() + (START_DATE.getMonth() > 2 ? 1 : 0)} 年 ${((START_DATE.getMonth() + 3) % 12) + 1} 月`;

  let prevQuests: Quest[] = fxOnboarding.roadmap.week1Quests; // 第 1 周任务来自路线图
  let prevRate = 1;
  // 用已完成章节恢复链式状态
  for (const c of done) { prevQuests = c.plan.nextWeekQuests; prevRate = c.completionRate; summaries.push({ no: c.no, summary: c.plan.summary }); }
  const chainState = new Map(done.map((c) => [c.no, c]));

  for (let n = 1; n <= 13; n++) {
    const quests = n === 1 ? fxOnboarding.roadmap.week1Quests : adaptQuests(chainState.get(n - 1)?.plan.nextWeekQuests ?? prevQuests, chainState.get(n - 1)?.completionRate ?? prevRate);
    const saved = chainState.get(n);
    if (saved && !force) { chainState.set(n, saved); continue; } // 断点续跑跳过文本
    if (!wanted.has(n)) {
      // 不在本轮范围：若已有数据保留，否则记录占位（后续重跑补齐）
      if (!saved) console.log(`第 ${n} 章不在本轮 --chapters 范围，跳过（JSON 暂缺，重跑补齐）`);
      continue;
    }
    const arc = ARC[n - 1];
    const beat = fxOnboarding.roadmap.acts.flatMap((a) => a.chapters).find((c) => c.no === n)!.beat;
    const logs = LOG_POOL[arc.type].map((l, i) => ({ day: (n - 1) * 7 + i * 2, note: l.note, mood: l.mood }));
    const doneCount = Math.round(quests.length * arc.rate);
    const questLines = quests.map((q, i) => `${i < doneCount ? "✓" : "✗"} ${q.text}${q.isKey ? "（关键）" : ""}`).join("；");
    const logLines = logs.map((l) => `[第${l.day}天][心情${l.mood}] ${l.note}`).join("\n");
    console.log(`\n=== 第 ${n} 章（${arc.type}，rate ${arc.rate}）===`);

    // ① 采访 3 问（C.5，fast）
    const { questions } = await tp.json({
      schema: z.object({ questions: z.array(z.string()).min(3).max(3) }),
      label: `demo-ch${n}-questions`, tier: "fast",
      system: `你是「${fxOnboarding.futureSelf.name}」，用 TA 的说话风格（${fxOnboarding.futureSelf.speakingStyle}）向过去的自己提 3 个问题。问题要具体引用本周的真实记录，帮助对方回忆细节和感受。不评判，每题不超过 30 字。第 3 题固定为一个想象题（如"如果这周是一部电影，最后一个镜头是什么？"），可以换一种说法。只输出 JSON。`,
      messages: [{ role: "user", content: `本周任务完成：${questLines}\n每日记录：\n${logLines}\n完成度：${arc.rate}\n输出 {"questions": [string, string, string]}` }],
    });
    // ② 林夏的回答（fast）
    const { answers } = await tp.json({
      schema: z.object({ answers: z.array(z.string().min(4).max(120)).min(3).max(3) }),
      label: `demo-ch${n}-answers`, tier: "fast",
      system: `你是林夏，正在接受「${fxOnboarding.futureSelf.name}」的周末采访。说话自然口语化，像真人一样有细节、有情绪，不完美也没关系。每个回答 20 到 80 字。只输出 JSON。`,
      messages: [{ role: "user", content: `本周记录：\n${logLines}\n\n问题：\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n输出 {"answers": [string, string, string]}` }],
    });

    // ③ 章节规划（C.6，fast + 宽松 schema + 本地归一化 + 2 次重试）
    let plan: ChapterPlan | null = null;
    for (let attempt = 0; attempt < 2 && !plan; attempt++) {
      try {
        plan = normalizePlan(await tp.json({
          schema: LoosePlan,
          label: `demo-ch${n}-plan`, tier: "fast", temperature: 0.8,
      system:
        `你是连载作家。根据主角这一周的真实生活，写出本周章节的规划。硬性规则：\n` +
        `1. 章节类型 = ${arc.type}，基调：${TYPE_TONE[arc.type]}。\n` +
        `2. 本章位置：第${actOf(n)}幕 第${n}章，节拍："${beat}"${isActFinale(n) ? "；这是幕终章，要有高潮" : ""}。\n` +
        `3. real_events_mapping 至少覆盖 3 条真实记录；完成的任务对应故事进展，没完成的对应反派「${bible.antagonist.name}」的阻挠（但不写成主角的错）。\n` +
        `4. interview_quote 必须从下面采访回答中原样摘取一句，安排在故事关键位置。\n` +
        `5. 未来的你（${bible.mentor.name}）必须出场至少一次。\n` +
        `6. panels 的 scene 用英文写，具体描述构图、动作、表情、环境；每格包含主角外貌（${EN_PROTAGONIST}）；dialogues 是中文对白，每格最多 2 条、每条不超过 40 字；narration 是中文旁白，不超过 60 字。\n` +
        `7. 适时回收伏笔：${JSON.stringify(bible.foreshadowing.filter((f) => f.resolveByChapter <= n + 1))}\n` +
        `8. cliffhanger 与下周的关键任务呼应。\n` +
        `9. ${arc.type === "low" ? "低谷章必须在结尾出现转折之光，绝不责备主角。" : ""}nextWeekQuests 给 3 到 5 条下周任务建议。\n` +
        `只输出 ChapterPlan JSON（字段：title, chapterType, realEventsMapping, beats, panels, coverPrompt, interviewQuote, cliffhanger, foreshadowingAdd, foreshadowingResolve, summary, nextCoverPrompt, nextWeekQuests）。`,
      messages: [{
        role: "user",
        content: `<story_bible>${JSON.stringify(bible)}</story_bible>\n<previously>${JSON.stringify(summaries.slice(-3))}</previously>\n<this_week>\n任务：${questLines}\n每日记录：\n${logLines}\n完成度：${arc.rate}\n采访：\n${questions.map((q, i) => `问：${q}\n答：${answers[i]}`).join("\n")}\n</this_week>\nchapterType 固定为 "${arc.type}"。`,
      }],
        }));
      } catch (e) {
        console.warn(`  第 ${n} 章规划失败（第 ${attempt + 1} 次）：${e instanceof Error ? e.message.slice(0, 200) : e}`);
      }
    }
    if (!plan) throw new Error(`第 ${n} 章规划两次尝试均失败`);
    plan.chapterType = arc.type;
    if (plan.interviewQuote && !answers.some((a) => a.includes(plan.interviewQuote!))) plan.interviewQuote = undefined;

    // ④ 正文（C.7，fast 流式）
    let bodyMd = "";
    for (let attempt = 0; attempt < 2 && (bodyMd.length < 700 || bodyMd.length > 1400); attempt++) {
      bodyMd = await tp.stream({
        onDelta: () => {},
        label: `demo-ch${n}-body`, tier: "fast",
        system:
          `你是${style.label}风格的作家。语气：${style.textTone}。\n` +
          `用第二人称"你"讲述主角的故事，未来的你用名字称呼。按 4 个节拍写 4 段，总计 800 到 1200 字。每段：至少 1 个具体的感官细节；至少 1 处"真实时刻"（自然点出真实行动）；段与段之间留出插画位置，用 <!--panel:0--> 到 <!--panel:3--> 标记。最后一段以悬念结尾：${plan.cliffhanger}\n` +
          `禁止：说教、鸡汤式总结、"加油""相信自己"等空话。只输出正文。`,
        messages: [{ role: "user", content: JSON.stringify({ plan, chapterType: arc.type, 真实事件: plan.realEventsMapping, 采访引用: plan.interviewQuote ?? "" }) }],
      });
    }
    bodyMd = ensurePanelMarkers(bodyMd.trim());

    // ⑤ 章末来信（C.8，fast 流式）
    const letterMd = (await tp.stream({
      onDelta: () => {},
      label: `demo-ch${n}-letter`, tier: "fast",
      system:
        `你是${fxOnboarding.futureSelf.name}，${fxOnboarding.futureSelf.realIdentity}。你正在给 90 天前的自己写信。说话风格：${fxOnboarding.futureSelf.speakingStyle}。口头禅：${fxOnboarding.futureSelf.catchphrase}（自然地用一次）。200 到 300 字，像真的写信，有称呼和落款。\n` +
        `必须：提到 1 个本周的具体细节（优先用采访原话）；按章节类型给出情感回应（${arc.type === "highlight" ? "骄傲" : arc.type === "struggle" ? "理解" : arc.type === "low" ? "陪伴，我也经历过这一周" : "心疼与鼓励休整"}）；最多给 1 条具体微小的建议；透露一点点未来的画面但不剧透。禁止责备、宏大承诺、列清单。只输出信。`,
      messages: [{ role: "user", content: `章节类型：${arc.type}\n本周记录：\n${logLines}\n采访：\n${questions.map((q, i) => `问：${q}\n答：${answers[i]}`).join("\n")}\n下周关键任务：${plan.nextWeekQuests.find((q) => q.isKey)?.text ?? ""}` }],
    })).trim();
    const letter = /——/.test(letterMd) ? letterMd : `${letterMd}\n\n—— ${futureDate}`;

    // ⑥ 图像任务（进队列，不等本章完成）
    const coverPrompt = n === 1
      ? `${bible.world.split("。")[0]}. ${beat}. the protagonist (${EN_PROTAGONIST}) from behind looking at the misty harbor. ${style.styleSuffix}`
      : null; // 第 n 章封面来自第 n-1 章的 nextCoverPrompt，在上一轮已排入队列
    const coverPromise = coverPrompt
      ? saveImage(`cover-${n}`, coverPrompt, "portrait")
      : Promise.resolve(chainState.get(n - 1) ? saveImage(`cover-${n}`, `${chainState.get(n - 1)!.plan.nextCoverPrompt}. ${style.styleSuffix}`, "portrait") : null);
    const panelPromises = plan.panels.map((p, i) => {
      const who = p.characters.map((c) => c === "protagonist" ? `the protagonist (${EN_PROTAGONIST})` : c === "mentor" ? `the future self (${EN_MENTOR})` : c === "antagonist" ? `the antagonist: grey fog visualized as an abstract force` : "an ally").join(", ");
      const shot: Record<string, string> = { wide: "Wide shot", medium: "Medium shot", closeup: "Close-up", over_shoulder: "Over-the-shoulder shot" };
      return saveImage(`panel-${n}-${i}`, `${shot[p.shot]} of ${who}. ${p.scene}. ${style.styleSuffix}`, "landscape");
    });
    const nextCoverPromise = n < 13 ? saveImage(`cover-${n + 1}`, `${plan.nextCoverPrompt}. ${style.styleSuffix}`, "portrait") : Promise.resolve(null);

    const [cover, panels, nextCover] = await Promise.all([coverPromise, Promise.all(panelPromises), nextCoverPromise]);

    const chapter = {
      no: n, chapterType: arc.type, completionRate: arc.rate, title: plan.title,
      questions, answers, quests, logs, plan, bodyMd, letterMd: letter,
      cover, panels, nextCover,
    } as Saved[number];
    chapters.push(chapter);
    chainState.set(n, chapter);
    summaries.push({ no: n, summary: plan.summary });
    // 伏笔推进
    const map = new Map(bible.foreshadowing.map((f) => [f.id, f]));
    for (const id of plan.foreshadowingResolve) map.delete(id);
    for (const f of plan.foreshadowingAdd) map.set(f.id, f);
    bible.foreshadowing = [...map.values()];

    chapters.sort((a, b) => a.no - b.no);
    fs.writeFileSync(SEED_PATH, JSON.stringify({
      seasonTitle: fxOnboarding.bible.seasonTitle, logline: fxOnboarding.bible.logline,
      sheets: { future: fs1, present: fs2 }, chapters, portraitSnapshots,
    }, null, 2));
    console.log(`第 ${n} 章完成：${plan.title}（正文 ${bodyMd.length} 字，图 ${[cover, ...panels, nextCover].filter(Boolean).length}/6）`);
  }

  console.log(`\n全部完成 → ${SEED_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
