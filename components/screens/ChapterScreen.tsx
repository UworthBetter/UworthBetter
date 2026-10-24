"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ApiClientError, api } from "@/lib/client/api";
import type { ChapterView, Quest } from "@/lib/contracts";
import { ChapterReader, type ReaderModel } from "@/components/story/ChapterReader";
import { FogCover } from "@/components/story/FogCover";
import { QuestList } from "@/components/story/QuestList";
import { readerFromJob } from "@/components/screens/fromJob";
import { Button } from "@/components/ui/Button";
import { useJob } from "@/hooks/useJob";
import { useSeason } from "@/hooks/useSeason";

function chapterNo(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 13 ? n : null;
}

function toModel(view: ChapterView): ReaderModel {
  return {
    no: view.no,
    title: view.title,
    type: view.type,
    coverUrl: view.coverUrl,
    bodyMd: view.bodyMd,
    letterMd: view.letterMd,
    letterFrom: view.letterFrom,
    panels: view.panels,
    realEvents: view.realEvents,
    next: view.next,
    streaming: false,
  };
}

export function ChapterScreen() {
  const params = useParams<{ n: string }>();
  const search = useSearchParams();
  const no = chapterNo(params.n);
  const jobId = search.get("job");
  const router = useRouter();
  const snap = useJob(jobId);
  const { season, toggleQuest } = useSeason();
  const [view, setView] = useState<ChapterView | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestKey = `${no ?? "x"}:${jobId ?? ""}`;
  const [seenKey, setSeenKey] = useState(requestKey);
  if (seenKey !== requestKey) {
    setSeenKey(requestKey);
    setView(null);
    setLocked(false);
    setError("");
    setLoading(Boolean(no) && !jobId);
  }

  useEffect(() => {
    if (!snap.done || !snap.redirect) return;
    const t = window.setTimeout(() => router.replace(snap.redirect!), 700);
    return () => window.clearTimeout(t);
  }, [snap.done, snap.redirect, router]);

  useEffect(() => {
    if (!no || jobId) return;
    let stop = false;
    api.chapter(no)
      .then((data) => {
        if (stop) return;
        setView(data);
        setLocked(false);
        setError("");
      })
      .catch((e) => {
        if (stop) return;
        setView(null);
        if (e instanceof ApiClientError && e.code === "CHAPTER_LOCKED") setLocked(true);
        else setError(e instanceof ApiClientError ? e.message : "这一章没有打开");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [no, jobId]);

  if (!no) {
    return <div className="screen-pad"><p>章节号要在 1 到 13 之间。</p></div>;
  }

  if (jobId) {
    const from = season?.futureSelf.name ?? "";
    return (
      <>
        {snap.error ? <div className="screen-pad"><p className="field-error">{snap.error.message}</p></div> : null}
        <ChapterReader model={readerFromJob(no, snap, from)} onSaveQuests={async () => {}} />
      </>
    );
  }

  if (loading) return <div className="quiet-loading">正在翻开这一章…</div>;

  if (view) {
    return (
      <ChapterReader
        model={toModel(view)}
        onSaveQuests={async (quests: Quest[]) => {
          if (!view.next) return;
          const res = await api.replaceQuests(view.next.no, quests);
          setView({ ...view, next: { ...view.next, quests: res.quests } });
        }}
      />
    );
  }

  if (locked && season?.current.no === no) {
    const current = season.current;
    return (
      <div className="screen-pad">
        <div className="kicker">第 {no} 章还在写</div>
        <h1 className="display" style={{ fontSize: 26 }}>{current.title}</h1>
        <p className="muted">{current.beat}</p>
        <FogCover coverUrl={current.fog.coverUrl} blurPx={current.fog.blurPx} rate={current.fog.rate} tall pulse={current.fog.rate >= 1} />
        <QuestList quests={current.quests} onToggle={(id, done) => void toggleQuest(id, done)} />
        <div className="stack" style={{ marginTop: 14 }}>
          {current.activeJobId ? (
            <Button href={`/chapter/${no}?job=${encodeURIComponent(current.activeJobId)}`}>回到正在生成的正文</Button>
          ) : (
            <Button href={`/chapter/${no}/interview`}>去做周末采访</Button>
          )}
          <Button variant="ghost" href="/season">回进度</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-pad stack">
      <h1 className="display" style={{ fontSize: 26 }}>{locked ? "这一章还锁着" : "没有打开"}</h1>
      <p className="muted">{error || "写到它的那一周，封面才会亮。"}</p>
      <Button href="/shelf">回书架</Button>
    </div>
  );
}
