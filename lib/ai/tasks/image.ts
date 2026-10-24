/**
 * 图像类任务：根据 AI_IMAGE_PROVIDER 选择 mock 或真实 provider（与文本 provider 相互独立）。
 */
import type { AITasks } from "@/lib/contracts/aiTasks";
import { getImageProvider } from "../providers/image";
import { STYLES } from "../styles";

export const imageTasks: Pick<AITasks, "genCharacterSheet" | "genSceneImage"> = {
  async genCharacterSheet({ which, style, futureSelf, bible, selfie }) {
    // TODO(A5)：迁移到 prompts/sheets.ts 并按 DESIGN.md 附录 C.3 调优
    const who =
      which === "future"
        ? `${futureSelf.appearance}, ${futureSelf.signatureItem}`
        : `${bible.protagonist.appearanceAnchor}, the same person as the reference but at the start of the journey, simpler clothes, slightly tired but hopeful expression`;
    const prompt = `Character turnaround reference sheet of ${who}, front view, three-quarter view and full body, neutral standing pose, plain white background, consistent outfit, ${STYLES[style].styleSuffix}`;
    const p = await getImageProvider();
    return p.generate({ prompt, refs: selfie ? [selfie] : [], aspect: "landscape", label: `sheet_${which}` });
  },

  async genSceneImage({ prompt, style, refs, aspect }) {
    const suffix = STYLES[style].styleSuffix;
    const full = prompt.includes(suffix) ? prompt : `${prompt}. ${suffix}`;
    const p = await getImageProvider();
    return p.generate({ prompt: full, refs, aspect, label: "scene" });
  },
};
