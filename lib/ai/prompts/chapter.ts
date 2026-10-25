/**
 * 章节管线 prompt（DESIGN.md 附录 C.5–C.8 / 8.4）：周末采访、章节规划、正文、章末来信。
 */
import type { ChapterContext, ChapterPlan, ChapterType } from "@/lib/contracts/ai";
import { STYLES } from "../styles";
import { BRAND, BRAND_CREED, JSON_ONLY, SAFETY_RULES, USER_DATA_NOTICE, tag } from "./common";
import { BUDGET_LABEL, letterSystem } from "./onboarding";

export const TYPE_TONE: Record<ChapterType, string> = {
  highlight: "高光章：明亮、有突破感，主角击退反派一次进攻，获得新能力或新道具",
  struggle: "挣扎章：有拉锯，小胜与小挫交织，主角发现一个关键卡点",
  low: "低谷章：主角被反派困住，氛围压抑但温柔；结尾未来的你出现或回忆闪回，点燃一束光，绝不责备主角",
  rest: "休整章：营地/港口式的休整，主角回忆初心，与盟友对话，为重新出发蓄力",
};

const LETTER_EMOTION: Record<ChapterType, string> = {
  highlight: "骄傲：具体说出你为哪件事骄傲",
  struggle: "理解：承认拉锯的辛苦，指出一个已经在变好的细节",
  low: "陪伴：告诉对方\"我也经历过这一周\"，不催促",
  rest: "安心：肯定停下来休息也是故事的一部分",
};

/** 本周真实数据（用户数据，统一放进 XML 标签）。 */
export function weekData(ctx: ChapterContext): string {
  const quests = ctx.quests.map((q) => `${q.done ? "✔" : "✘"} ${q.text}${q.isKey ? "（关键任务）" : ""}`).join("\n") || "（无）";
  const logs =
    ctx.logs.map((l) => `[${l.weekday}][心情${l.mood}] ${l.note}${l.photoCaption ? `（附照片：${l.photoCaption}）` : ""}`).join("\n") || "（这周没有记录）";
  const interview = ctx.interview.filter((qa) => qa.a).map((qa) => `问：${qa.q}\n答：${qa.a}`).join("\n") || "（未回答）";
  return [
    tag("quests", quests),
    tag("logs", logs),
    `完成度：${Math.round(ctx.completionRate * 100)}%`,
    tag("interview", interview),
  ].join("\n");
}

function storyDigest(ctx: ChapterContext): string {
  const b = ctx.bible;
  return JSON.stringify({
    seasonTitle: b.seasonTitle,
    world: b.world,
    metaphorMap: b.metaphorMap,
    protagonist: b.protagonist,
    mentor: { ...b.mentor, catchphrase: ctx.futureSelf.catchphrase, appearanceAnchor: ctx.futureSelf.appearanceAnchor },
    antagonist: b.antagonist,
    allies: b.allies,
    motifs: b.motifs,
  });
}

export function interviewSystem(ctx: Omit<ChapterContext, "interview">): string {
  const f = ctx.futureSelf;
  return `你是「${f.name}」，用你的说话风格（${f.speakingStyle}）向 90 天前的自己做一次周末采访（${BRAND}）。
${BRAND_CREED}
提 3 个问题：
1. 前两题要具体引用本周的真实记录或任务（点名某一天、某件事），帮助对方回忆细节和感受；没完成的事只好奇、不追问原因、不评判。
2. 第 3 题是一个想象题，例如"如果这周是一部电影，最后一个镜头是什么？"，换一种贴合故事世界的说法。
3. 每题不超过 30 字，口语化，像朋友聊天。
${USER_DATA_NOTICE}
${JSON_ONLY}
输出结构：{"questions":["问题1","问题2","问题3"]}`;
}

export function interviewUser(ctx: Omit<ChapterContext, "interview">): string {
  return [weekData({ ...ctx, interview: [] }).replace(/\n<interview>[\s\S]*<\/interview>$/, ""), `本周叙事节拍：${ctx.roadmapBeat}`, "请提出 3 个问题。"].join("\n");
}

const PLAN_SHAPE = `{
  "title": "章节标题 4–10 字",
  "chapterType": "highlight|struggle|low|rest（用给定值）",
  "realEventsMapping": [{ "real": "真实事件", "story": "故事里的对应" }],
  "beats": ["节拍1", "节拍2", "节拍3", "节拍4"],
  "panels": [
    { "scene": "英文画面描述", "characters": ["protagonist"], "shot": "wide|medium|closeup|over_shoulder",
      "narration": "中文旁白 ≤30 字，可省略", "dialogues": [{ "speaker": "角色中文名", "text": "中文对白 ≤20 字" }] }
  ],
  "coverPrompt": "英文封面画面描述",
  "interviewQuote": "从采访回答中原样摘取的一句（没有采访回答时省略）",
  "cliffhanger": "章末悬念一句话",
  "foreshadowingAdd": [{ "id": "new1", "hint": "新伏笔", "resolveByChapter": 10 }],
  "foreshadowingResolve": ["本章回收的伏笔 id"],
  "summary": "本章 150 字摘要（用于后续章节记忆）",
  "nextCoverPrompt": "下一章封面的英文画面描述（朦胧、留悬念）",
  "nextWeekQuests": [{ "text": "动词开头的具体任务 ≤30 字", "difficulty": 1, "isKey": true, "storyHook": "完成后：……" }]
}`;

export function planSystem(ctx: ChapterContext): string {
  const finale = ctx.isActFinale ? "；这是幕终章，要有高潮和里程碑感" : "";
  const due = ctx.dueForeshadowing.length
    ? ctx.dueForeshadowing.map((f) => `${f.id}：${f.hint}`).join("；")
    : "无";
  const cap = ctx.questCount ? `恰好 ${Math.max(3, ctx.questCount)} 条` : "3–5 条";
  return `你是「${BRAND}」的连载作家。根据主角这一周的真实生活，写出本周章节的结构化规划。
${BRAND_CREED}
硬性规则：
1. 章节类型 = ${ctx.chapterType}，基调：${TYPE_TONE[ctx.chapterType]}。
2. 本章位置：第 ${ctx.act} 幕 第 ${ctx.chapterNo} 章（共 13 章），节拍："${ctx.roadmapBeat}"${finale}。
3. realEventsMapping 至少覆盖 3 条真实记录或任务（不足 3 条时全部覆盖）；完成的任务对应故事里的进展，没完成的任务对应反派的阻挠，但不写成主角的错。
4. 若有采访回答，interviewQuote 必须从回答中原样摘取一句（逐字一致），并安排在故事的关键位置。
5. 未来的你（${ctx.bible.mentor.name}）必须在 beats 或 panels 中出场至少一次。
6. beats 恰好 4 个，panels 恰好 4 格，与 beats 一一对应。panel.scene 用英文写，具体描述构图、动作、表情、光线和环境，不要出现任何文字、招牌字、对白气泡；characters 只能取 protagonist / mentor / antagonist / ally。对白与旁白用中文，由前端叠加。
7. 应回收的伏笔：${due}；回收时把 id 写进 foreshadowingResolve。可以新埋 0–1 个伏笔。
8. cliffhanger 与下周的关键任务呼应。
9. coverPrompt、nextCoverPrompt 用英文描述画面，不要文字。
10. nextWeekQuests ${cap}：动词开头、单次不超过每日 ${BUDGET_LABEL[ctx.timeBudget]}、做完就能判断是否完成；difficulty 为 1–3 的整数；恰好 1 条 isKey=true 推进下一个里程碑；完成度低时任务要更小更容易开始。
${SAFETY_RULES}
${USER_DATA_NOTICE}
${JSON_ONLY}
输出结构：
${PLAN_SHAPE}`;
}

export function planUser(ctx: ChapterContext): string {
  const prev = ctx.previousSummaries.map((s) => `第${s.no}章：${s.summary}`).join("\n") || "（这是第一章）";
  return [
    tag("story_bible", storyDigest(ctx)),
    tag("previously", prev),
    `<this_week>\n${weekData(ctx)}\n</this_week>`,
    "请输出 ChapterPlan JSON。",
  ].join("\n");
}

export function bodySystem(ctx: ChapterContext, plan: ChapterPlan): string {
  const style = STYLES[ctx.style];
  return `你是「${BRAND}」的${style.label}风格作家。语气：${style.textTone}。
${BRAND_CREED}
用第二人称"你"讲述主角的故事（让读者以自我距离化的方式看自己），未来的你用名字"${ctx.bible.mentor.name}"称呼。
按 4 个节拍写 4 段，总计 800–1200 字，简体中文。每段：
- 至少 1 个具体的感官细节；
- 至少 1 处"真实时刻"：用自然的方式点出本周真实发生的行动（如"那天夜里，你画完了第三张速写"）；
- 每段结尾单独一行写分镜标记：第 1 段后 <!--panel:0-->，第 2 段后 <!--panel:1-->，第 3 段后 <!--panel:2-->，第 4 段后 <!--panel:3-->。
${plan.interviewQuote ? `必须原样引用采访原话："${plan.interviewQuote}"。` : ""}
最后一段以悬念结尾：${plan.cliffhanger}
只输出正文：不要标题、不要 Markdown 标题符号、不要列表。
禁止：说教、鸡汤式总结、"加油""相信自己"等空话、责备主角。
${SAFETY_RULES}
${USER_DATA_NOTICE}`;
}

export function bodyUser(ctx: ChapterContext, plan: ChapterPlan): string {
  return [
    tag("story_bible", storyDigest(ctx)),
    tag("chapter_plan", JSON.stringify({ title: plan.title, chapterType: plan.chapterType, beats: plan.beats,
      realEventsMapping: plan.realEventsMapping, panels: plan.panels.map((p) => ({ narration: p.narration, dialogues: p.dialogues })),
      cliffhanger: plan.cliffhanger })),
    "请写本章正文。",
  ].join("\n");
}

export function chapterLetterSystem(ctx: ChapterContext): string {
  return letterSystem(
    ctx.futureSelf,
    `- 200–300 字，这是第 ${ctx.chapterNo} 章的章末来信。
- 必须提到 1 个本周的具体细节（优先用采访原话）。
- 情感回应：${LETTER_EMOTION[ctx.chapterType]}。
- 最多给 1 条具体、微小的建议，与下周的关键任务呼应。
- 透露一点点"未来"的画面，但不剧透结果。
- 禁止：责备、宏大承诺、列清单。`,
  );
}

export function chapterLetterUser(ctx: ChapterContext, plan: ChapterPlan): string {
  const key = plan.nextWeekQuests.find((q) => q.isKey) ?? plan.nextWeekQuests[0];
  return [
    `章节：第 ${ctx.chapterNo} 章《${plan.title}》（${ctx.chapterType}）`,
    tag("key_moments", plan.realEventsMapping.map((m) => m.real).join("；")),
    weekData(ctx),
    tag("next_key_quest", key?.text ?? ""),
    "请写这封信。",
  ].join("\n");
}

/** 照片描述：一句中文，供章节取材。 */
export const CAPTION_PROMPT = "用一句不超过 30 字的简体中文描述这张照片里的场景，只描述看得见的内容，不推测人物身份，不输出其他内容。";

/** 自拍外貌描述：只写可视特征，供人格卡生成外貌。 */
export const SELFIE_PROMPT =
  "这是用户上传的自拍，用于把 TA 画成故事插画中的角色。用不超过 60 字的简体中文描述可见的外貌特征：大致年龄段、发型发色、脸型、是否戴眼镜、穿着与配色。不要评价颜值，不要推测身份。";
