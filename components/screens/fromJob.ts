import type { ChapterType, PanelView } from "@/lib/contracts";
import type { JobSnapshot } from "@/hooks/useJob";
import type { ReaderModel } from "@/components/story/ChapterReader";

const TYPES: ChapterType[] = ["highlight", "struggle", "low", "rest"];

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** 把任务事件收成阅读器模型。分镜对白如果没有坐标，就排在画面偏下的位置。 */
export function readerFromJob(no: number, snap: JobSnapshot, letterFrom: string): ReaderModel {
  const plan = snap.data.plan ?? {};
  const typeRaw = plan.chapterType;
  const rawPanels = Array.isArray(plan.panels) ? plan.panels : [];
  const failedPanels: number[] = [];
  const panels: PanelView[] = rawPanels.map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const idx = typeof row.idx === "number" ? row.idx : index;
    const status = snap.steps[`panel${idx}`];
    if (status === "error") failedPanels.push(idx);
    const dialogues = Array.isArray(row.dialogues) ? row.dialogues : [];
    return {
      idx,
      imageUrl: status === "error" ? null : str(snap.data[`panel${idx}`]?.url),
      narration: str(row.narration),
      dialogues: dialogues.map((line, j) => {
        const bubble = line && typeof line === "object" ? (line as Record<string, unknown>) : {};
        return {
          speaker: str(bubble.speaker) ?? "",
          text: str(bubble.text) ?? "",
          x: typeof bubble.x === "number" ? bubble.x : 0.18,
          y: typeof bubble.y === "number" ? bubble.y : Math.min(0.82, 0.58 + j * 0.16),
        };
      }),
    };
  });

  return {
    no,
    title: str(plan.title) ?? "",
    type: TYPES.includes(typeRaw as ChapterType) ? (typeRaw as ChapterType) : null,
    coverUrl: str(snap.data.cover?.url),
    bodyMd: snap.texts.body,
    letterMd: snap.texts.letter,
    letterFrom,
    panels,
    realEvents: [],
    next: null,
    streaming: !snap.done && !snap.error,
    failedPanels,
  };
}
