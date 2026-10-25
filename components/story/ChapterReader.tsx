"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChapterType, PanelView, Quest, QuestView } from "@/lib/contracts";
import { ComicPanel } from "@/components/story/ComicPanel";
import { LetterCard } from "@/components/story/LetterCard";
import { NextChapterTeaser } from "@/components/story/NextChapterTeaser";
import { RealEventsCard } from "@/components/story/RealEventsCard";
import { firstParagraph, segmentBody } from "@/components/story/segment";
import { TypeBadge } from "@/components/ui/Badge";
import { FitImage } from "@/components/ui/FitImage";

export type ReaderModel = {
  no: number;
  title: string;
  type: ChapterType | null;
  coverUrl: string | null;
  bodyMd: string;
  letterMd: string;
  letterFrom: string;
  panels: PanelView[];
  realEvents: { real: string; story: string }[];
  next: { no: number; title: string; cliffhanger: string; coverUrl: string | null; quests: QuestView[] } | null;
  streaming: boolean;
  /** 生成中单张失败的分镜，立刻换成渐变占位，不再转骨架。 */
  failedPanels?: number[];
};

export function ChapterReader({ model, onSaveQuests }: { model: ReaderModel; onSaveQuests: (quests: Quest[]) => Promise<void> }) {
  const low = model.type === "low";
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const scroller = document.querySelector(".screen-scroll");
    if (!scroller) return;
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      setProgress(max > 0 ? scroller.scrollTop / max : 0);
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [model.bodyMd]);

  const segments = segmentBody(model.bodyMd);
  const shown = new Set<number>();
  const failed = new Set(model.failedPanels ?? []);

  return (
    <article className={low ? "low-reader" : undefined}>
      <div className="readbar" aria-hidden><i style={{ width: `${progress * 100}%` }} /></div>
      <div className="screen-pad">
        <div className="chapter-cover">
          {model.coverUrl ? <FitImage src={model.coverUrl} alt="" sizes="390px" priority /> : <div className="fit-frame" style={{ aspectRatio: "2 / 3" }} />}
          <div className="vignette" />
          <div className="meta">
            <div className="no">第 {model.no} 章</div>
            <div className="ti">{model.title || "正在铺开这一章"}</div>
          </div>
          <TypeBadge type={model.type} className="" />
        </div>

        {low && model.letterMd ? (
          <div className="future-early">
            <b>提前出现的来信：</b>
            {firstParagraph(model.letterMd)}
          </div>
        ) : null}

        {segments.length === 0 && model.streaming ? <p className="prose-p faint">正文正在落笔…</p> : null}

        {segments.map((segment, index) => {
          if (segment.kind === "text") {
            return <ReactMarkdown key={`t-${index}`} components={{ p: ({ children }) => <p className="prose-p">{children}</p> }}>{segment.text}</ReactMarkdown>;
          }
          shown.add(segment.idx);
          const panel = model.panels.find((item) => item.idx === segment.idx);
          if (!panel) return null;
          const pending = model.streaming && !panel.imageUrl && !failed.has(segment.idx);
          return <ComicPanel key={`p-${segment.idx}`} panel={panel} pending={pending} />;
        })}

        {model.streaming
          ? model.panels.filter((panel) => !shown.has(panel.idx)).map((panel) => <ComicPanel key={`wait-${panel.idx}`} panel={panel} pending={!panel.imageUrl && !failed.has(panel.idx)} />)
          : null}

        <RealEventsCard events={model.realEvents} />

        {model.letterMd || model.streaming ? (
          <div style={{ marginTop: 8 }}>
            <LetterCard markdown={model.letterMd} from={model.letterFrom} kicker="来自未来的信" defaultOpen={!model.streaming || model.letterMd.length > 0} />
          </div>
        ) : null}

        {!model.streaming ? <NextChapterTeaser next={model.next} onSave={onSaveQuests} /> : null}
      </div>
    </article>
  );
}
