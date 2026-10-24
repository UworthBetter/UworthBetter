/**
 * 文本类任务的真实实现（AI_TEXT_PROVIDER=openai-compat）。
 * 每个方法对应 ENGINEERING.md 中的一张任务卡，A 轨道逐个替换 TODO。
 * 未实现的方法会抛出 AIError，B 轨道联调时可临时切回 mock。
 */
import { AIError } from "@/lib/contracts/aiTasks";
import { getTextProvider } from "../providers/text";
import { hitCrisisKeyword } from "../safety";
import type { TextTasks } from "./textMock";

const todo = (card: string, task: string): never => {
  throw new AIError(`${task} 尚未实现（任务卡 ${card}），请暂用 AI_TEXT_PROVIDER=mock`, task);
};

export const realTextTasks: TextTasks = {
  async genProfileAndBible() {
    return todo("A4", "genProfileAndBible");
  },
  async genRoadmap() {
    return todo("A6", "genRoadmap");
  },
  async streamFirstLetter() {
    return todo("A6", "streamFirstLetter");
  },
  async genInterviewQuestions() {
    return todo("A7", "genInterviewQuestions");
  },
  async genChapterPlan() {
    return todo("A8", "genChapterPlan");
  },
  async streamChapterBody() {
    return todo("A9", "streamChapterBody");
  },
  async streamChapterLetter() {
    return todo("A9", "streamChapterLetter");
  },
  async captionPhoto(photo) {
    const tp = await getTextProvider();
    return tp.vision({
      label: "captionPhoto",
      imageUrl: photo.url,
      prompt: "用一句不超过 30 字的中文描述这张照片里的场景，只描述看得见的内容。",
    });
  },
  async checkSafety(text) {
    // TODO(A11)：关键词命中后再用 fast 模型二次确认，减少误报
    return hitCrisisKeyword(text) ? { crisis: true, reason: "keyword" } : { crisis: false };
  },
};
