"use client";

import { useEffect, useState } from "react";
import { ApiClientError, api } from "@/lib/client/api";
import { compressImage } from "@/lib/client/image";
import type { CrisisNotice, LogView } from "@/lib/contracts";
import { QuestList } from "@/components/story/QuestList";
import { Button } from "@/components/ui/Button";
import { useSeason } from "@/hooks/useSeason";

const MOODS = [
  { value: 1, label: "低落" },
  { value: 2, label: "沉" },
  { value: 3, label: "平" },
  { value: 4, label: "亮" },
  { value: 5, label: "振奋" },
];

export function TodayScreen() {
  const { season, loading, toggleQuest, refresh } = useSeason();
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [logs, setLogs] = useState<LogView[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState<CrisisNotice | null>(null);

  const chapter = season?.current.no;

  useEffect(() => {
    if (!chapter) return;
    api.listLogs(chapter).then((res) => setLogs(res.logs)).catch(() => setLogs([]));
  }, [chapter]);

  if (loading) return <div className="quiet-loading">今天的纸还在…</div>;
  if (!season) {
    return (
      <div className="screen-pad stack">
        <h1 className="display" style={{ fontSize: 26 }}>还没有进行中的章节</h1>
        <Button href="/">回到封面</Button>
      </div>
    );
  }

  async function submit() {
    const text = note.trim();
    if (text.length < 1 || text.length > 140) {
      setError("写一句就好，1 到 140 字");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const file = photo ? await compressImage(photo) : null;
      const res = await api.createLog({ note: text, mood }, file);
      setLogs((list) => [...list, res.log]);
      setNote("");
      setPhoto(null);
      setMood(3);
      if (res.crisis) setCrisis(res.crisis);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "没有记下");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-pad">
      <div className="kicker">第 {season.current.no} 章 · 今日</div>
      <h1 className="display" style={{ fontSize: 26, marginTop: 6 }}>今天发生了什么</h1>
      <p className="muted">一句话就够。周末采访会用到它。</p>

      <div className="mood-scale" role="radiogroup" aria-label="心情">
        {MOODS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`seg${mood === item.value ? " active" : ""}`}
            style={{ opacity: mood === item.value ? 1 : 0.35 + item.value * 0.08 }}
            aria-checked={mood === item.value}
            role="radio"
            onClick={() => setMood(item.value)}
          />
        ))}
      </div>
      <div className="mood-labels">
        {MOODS.map((item) => <span key={item.value} className={mood === item.value ? "on" : ""}>{item.label}</span>)}
      </div>

      <textarea className="input" rows={4} maxLength={140} value={note} placeholder="例如：画了二十分钟，手没那么紧了" onChange={(e) => setNote(e.target.value)} />
      <label className="upload-box">
        {photo ? photo.name : "加一张照片（可选）"}
        <input type="file" accept="image/*" hidden onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      {error ? <p className="field-error">{error}</p> : null}
      <Button className="btn-block" disabled={busy} onClick={() => void submit()}>{busy ? "正在记下…" : "记下今天"}</Button>

      <div style={{ marginTop: 18 }}>
        <b>本章任务</b>
        <QuestList quests={season.current.quests} onToggle={(id, next) => void toggleQuest(id, next)} />
      </div>

      <h2 className="display" style={{ fontSize: 18 }}>已经写下的</h2>
      {logs.length === 0 ? <p className="faint">这一章还没有记录。</p> : null}
      <div className="stack">
        {logs.map((log) => (
          <div key={log.id} className="card">
            <div className="faint">{log.date} · 心情 {log.mood}</div>
            <p style={{ marginBottom: 0 }}>{log.note}</p>
          </div>
        ))}
      </div>

      {crisis ? (
        <div className="crisis" role="dialog" aria-modal>
          <div className="card">
            <div className="display" style={{ fontSize: 20 }}>先停一下</div>
            <p>{crisis.message}</p>
            <div className="stack">
              {crisis.hotlines.map((line) => (
                <a key={line.phone} href={`tel:${line.phone}`}>{line.name} {line.phone}</a>
              ))}
            </div>
            <Button onClick={() => setCrisis(null)}>我知道了</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
