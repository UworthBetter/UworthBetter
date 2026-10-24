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
          <Button size="sm" disabled={busy} onClick={() => void save()}>保存下周任务</Button>
        </div>
      ) : (
        <Button className="btn-secondary" variant="secondary" size="sm" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>
          第 {next.no} 章任务已就绪
        </Button>
      )}
    </div>
  );
}
