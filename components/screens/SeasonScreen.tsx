"use client";

import { ActProgress } from "@/components/story/ActProgress";
import { ChapterStrip } from "@/components/story/ChapterStrip";
import { FogCover } from "@/components/story/FogCover";
import { QuestList } from "@/components/story/QuestList";
import { Button } from "@/components/ui/Button";
import { useSeason } from "@/hooks/useSeason";

export function SeasonScreen() {
  const { season, loading, error, pulse, toggleQuest } = useSeason();

  if (loading) return <div className="quiet-loading">正在摊开这一季…</div>;
  if (!season) {
    return (
      <div className="screen-pad stack">
        <h1 className="display" style={{ fontSize: 26 }}>{error === "NO_SEASON" ? "还没有一季故事" : "进度没有打开"}</h1>
        <p className="muted">{error === "NO_SEASON" ? "先写下一个愿望，或者载入演示。" : "过一会儿再试。"}</p>
        <Button href="/">回到封面</Button>
      </div>
    );
  }

  const current = season.current;
  const quests = current.quests;
  const done = quests.filter((quest) => quest.done).length;
  const allDone = quests.length > 0 && done === quests.length;
  const sunday = new Date().getDay() === 0;
  const lit = allDone || sunday;
  const interview = `/chapter/${current.no}/interview`;

  return (
    <div className="screen-pad">
      <div className="kicker">第一季</div>
      <h1 className="display" style={{ fontSize: 28, margin: "6px 0" }}>《{season.season.title}》</h1>
      <p className="muted">{season.season.logline}</p>
      <ActProgress acts={season.acts} />

      <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
        <div>
          <div className="faint">第 {current.no} 章{current.isActFinale ? " · 幕终" : ""}</div>
          <div className="display" style={{ fontSize: 22 }}>{current.title}</div>
        </div>
        <div className="faint">还剩 {current.daysLeft} 天</div>
      </div>
      <p className="muted">{current.beat}</p>

      <FogCover
        coverUrl={current.fog.coverUrl}
        blurPx={current.fog.blurPx}
        rate={current.fog.rate}
        tall
        pulse={pulse && current.fog.rate >= 1}
      />
      <p className="faint center">
        {current.fog.rate >= 1 ? "这一章的雾已经散尽" : `再完成 ${current.fog.remainingToClear} 项就能看清`}
      </p>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>本章任务</b>
        <span className="faint">{done}/{quests.length}</span>
      </div>
      <QuestList quests={quests} onToggle={(id, next) => void toggleQuest(id, next)} />

      <div className="stack" style={{ marginTop: 16 }}>
        {current.activeJobId ? (
          <Button className="btn-block" href={`/chapter/${current.no}?job=${encodeURIComponent(current.activeJobId)}`}>章节正在生成</Button>
        ) : lit ? (
          <Button className="btn-block cta-dynamic ready" href={interview}>结束本章 · 开始周末采访</Button>
        ) : current.canFinish ? (
          <>
            <Button className="btn-block" variant="secondary" href={interview}>结束本章</Button>
            <p className="faint center">勾完本章任务，这颗按钮会亮起来。周日也可以直接去采访。</p>
          </>
        ) : (
          <Button className="btn-block" disabled>本章还不能结束</Button>
        )}
        <Button className="btn-block" variant="ghost" href="/today">记录今天</Button>
      </div>

      <ChapterStrip chapters={season.chapters} current={current.no} />
    </div>
  );
}
