/**
 * 图像 prompt 构建器（DESIGN.md 附录 C.3 / C.9）。风格后缀由 genSceneImage / genCharacterSheet 统一拼接，
 * 这里只负责画面内容；任何 prompt 都不要求出现文字（中文对白由前端叠加）。
 */
import type { FutureSelfProfile, PanelPlan, StoryBible } from "@/lib/contracts/ai";

const SHOT: Record<PanelPlan["shot"], string> = {
  wide: "Wide establishing shot",
  medium: "Medium shot",
  closeup: "Close-up shot",
  over_shoulder: "Over-the-shoulder shot",
};

/** 角色设定图：future=未来的你，present=故事开始时的主角（同一人，更朴素）。 */
export function characterSheetPrompt(which: "future" | "present", futureSelf: FutureSelfProfile, bible: StoryBible): string {
  const who =
    which === "future"
      ? `the future self "${futureSelf.title}": ${futureSelf.appearance}; signature item: ${futureSelf.signatureItem}; calm, confident, warm expression`
      : `the protagonist at the start of the journey: ${bible.protagonist.appearanceAnchor}; the same person as the future self (${futureSelf.appearanceAnchor}) but simpler everyday clothes, slightly tired yet hopeful expression; starting point: ${bible.protagonist.startState}`;
  return `Character turnaround reference sheet of ${who}. Front view, three-quarter view and full body, neutral standing pose, plain light background, consistent outfit and colors across all views, single character only`;
}

/** 分镜：镜头 + 出场角色（带外貌锚点保持一致性）+ 模型规划的画面。 */
export function panelPrompt(panel: PanelPlan, futureSelf: FutureSelfProfile, bible: StoryBible): string {
  const who = panel.characters
    .map((c) =>
      c === "protagonist" ? `the protagonist (${bible.protagonist.appearanceAnchor})`
      : c === "mentor" ? `the future self (${futureSelf.appearanceAnchor}, ${futureSelf.signatureItem})`
      : c === "antagonist" ? `the antagonist "${bible.antagonist.name}" visualized as an abstract, non-violent force (${bible.antagonist.embodies})`
      : bible.allies[0] ? `an ally (${bible.allies.map((a) => a.name).join(" / ")})` : "a friendly ally",
    )
    .join(", ");
  return `${SHOT[panel.shot]}${who ? ` of ${who}` : ""}. ${panel.scene}. Comic panel illustration, expressive faces, clear storytelling composition`;
}

/** 章节封面（含下一章的"迷雾封面"）：竖版，主角在画面中，留出故事世界的氛围。 */
export function coverPrompt(scene: string, bible: StoryBible): string {
  return `Storybook chapter cover illustration, vertical composition. ${scene}. The protagonist (${bible.protagonist.appearanceAnchor}) in the world of "${bible.seasonTitle}": ${bible.world.slice(0, 160)}. Atmospheric, emotional, plenty of negative space at the top`;
}

/** 建档后第 1 章封面：还没有 ChapterPlan，用第 1 章标题与世界观构图。 */
export function firstCoverPrompt(bible: StoryBible, chapterTitle: string): string {
  return coverPrompt(`Opening chapter "${chapterTitle}": ${bible.logline}`, bible);
}
