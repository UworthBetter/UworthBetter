"use client";

import { useState } from "react";
import type { Quest, QuestView } from "@/lib/contracts";
import { FogCover } from "@/components/story/FogCover";
import { Button } from "@/components/ui/Button";

export function NextChapterTeaser({
  next,
  onSave,
}: {
  next: { no: number; title: string; cliffhanger: string; coverUrl: string | null; quests: QuestView[] } | null;
  onSave: (quests: Quest[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<QuestView[]>(next?.quests ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!next) {
    return (
      <div className="finale-card">
        <div className="display">这一季写到这里</div>
        <p className="faint">十三章都在书架上。季终合集会等它们到齐。</p>
      </div>
    );
  }

  async function save() {
    for (const row of rows) {
      if (row.text.trim().length < 2 || row.text.trim().length > 60) {
        setError("每条任务写 2 到 60 个字");
        return;
      }
      if (row.storyHook.length > 40) {
        setError("剧情钩子不超过 40 字");
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      await onSave(rows.map((row) => ({ text: row.text.trim(), difficulty: row.difficulty, isKey: row.isKey, storyHook: row.storyHook })));
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "没有保存");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card center" style={{ marginTop: 16 }}>
      <div className="faint">下一章预告</div>
      <div className="display" style={{ fontSize: 18, margin: "4px 0" }}>第 {next.no} 章 · {next.title}</div>
      <p style={{ fontSize: 13.5 }}>{next.cliffhanger}</p>
      <FogCover coverUrl={next.coverUrl} blurPx={18} rate={0.15} short />
      {editing ? (
        <div className="stack" style={{ marginTop: 12, textAlign: "left" }}>
          {rows.map((row, index) => (
            <input
              key={row.id}
              className="input"
              value={row.text}
              maxLength={60}
              onChange={(e) => setRows((list) => list.map((item, i) => (i === index ? { ...item, text: e.target.value } : item)))}
            />
          ))}
          {error ? <p className="field-error">{error}</p> : null}
          <div className="row" style={{ justifyContent: "flex-start", gap: 10 }}>
            <Button size="sm" disabled={busy} onClick={() => void save()}>保存下周任务</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setRows(next.quests); setEditing(false); setError(""); }}>不改了</Button>
          </div>
        </div>
      ) : (
        <div className="row" style={{ marginTop: 12, justifyContent: "center" }}>
          {/* 已就绪 = 跳到下一章开始新一周；改任务是次级入口（勾过任务后服务端拒绝替换，直接隐藏）。 */}
          <Button size="sm" href={`/chapter/${next.no}`}>第 {next.no} 章任务已就绪 · 去新的一周</Button>
          {next.quests.some((q) => q.done) ? null : (
            <Button variant="ghost" size="sm" onClick={() => { setRows(next.quests); setEditing(true); }}>改任务</Button>
          )}
        </div>
      )}
    </div>
  );
}
