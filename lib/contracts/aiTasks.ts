/**
 * 契约：AI 任务边界。后端（B）只能通过 getAITasks() 调用这些方法；AI 轨道（A）负责实现。
 * ⚠️ 已冻结（见 CLAUDE.md「契约规则」）。只允许新增可选方法。
 *
 * 约定：
 * - 所有 gen* 方法内部负责 zod 校验 + 1 次修复重试，最终失败抛出 AIError。
 * - stream* 方法通过 onDelta 推送增量文本，并 resolve 完整文本。
 * - genSceneImage / genCharacterSheet 只生成单张；并发、重试由调用方（B 的编排层）控制。
 * - 图片引用 ImageRef.url 可以是站内路径（/generated/x.png）或公网 URL，由 provider 自行转换。
 */
import type {
  ChapterContext,
  ChapterPlan,
  FutureSelfProfile,
  OnboardingInput,
  SeasonRoadmap,
  StoryBible,
  StyleId,
} from "./ai";

export type ImageRef = { url: string };
export type ImageMime = "image/png" | "image/jpeg" | "image/webp";
export type ImageResult = { buffer: Buffer; mime: ImageMime };
export type ImageAspect = "square" | "portrait" | "landscape";

export type OnDelta = (text: string) => void;

export type SafetyResult = { crisis: boolean; reason?: string };

export interface AITasks {
  /** 一次调用产出人格卡 + 故事圣经。 */
  genProfileAndBible(input: OnboardingInput): Promise<{ futureSelf: FutureSelfProfile; bible: StoryBible }>;

  /** 角色设定图。which=present 为「现在的主角」，future 为「未来的你」。 */
  genCharacterSheet(args: {
    which: "future" | "present";
    style: StyleId;
    futureSelf: FutureSelfProfile;
    bible: StoryBible;
    selfie?: ImageRef;
  }): Promise<ImageResult>;

  /** 3 幕 13 章路线图 + 第 1 周任务。 */
  genRoadmap(args: {
    input: OnboardingInput;
    futureSelf: FutureSelfProfile;
    bible: StoryBible;
  }): Promise<SeasonRoadmap>;

  /** 建档时的第一封「来自未来的信」。 */
  streamFirstLetter(
    args: { input: OnboardingInput; futureSelf: FutureSelfProfile; bible: StoryBible },
    onDelta: OnDelta,
  ): Promise<string>;

  /** 周末采访 3 问（返回长度恰为 3）。 */
  genInterviewQuestions(ctx: Omit<ChapterContext, "interview">): Promise<string[]>;

  /** 章节结构化规划。 */
  genChapterPlan(ctx: ChapterContext): Promise<ChapterPlan>;

  /** 章节正文（Markdown，含 4 个 <!--panel:i--> 标记）。 */
  streamChapterBody(ctx: ChapterContext, plan: ChapterPlan, onDelta: OnDelta): Promise<string>;

  /** 章末「来自未来的信」。 */
  streamChapterLetter(ctx: ChapterContext, plan: ChapterPlan, onDelta: OnDelta): Promise<string>;

  /** 场景图（封面 / 分镜）。prompt 应由 lib/ai 的 prompt 构建器生成，不含风格后缀时由实现自动拼接。 */
  genSceneImage(args: {
    prompt: string;
    style: StyleId;
    refs: ImageRef[];
    aspect: ImageAspect;
  }): Promise<ImageResult>;

  /** 照片 → 一句中文描述，供章节取材。 */
  captionPhoto(photo: ImageRef): Promise<string>;

  /** 危机信号检测。crisis=true 时调用方必须停止故事化并展示关怀信息。 */
  checkSafety(text: string): Promise<SafetyResult>;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly task: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIError";
  }
}
