"use client";

import { useEffect, useRef, useState } from "react";
import type { NavAction, Pos } from "@/components/pitch/model/nav";
import { keyToCommand } from "@/components/pitch/model/nav";
import { SCENES } from "@/components/pitch/scenes";

// 演讲者备注窗口：与主路演页通过 BroadcastChannel 同步；在这里按翻页键也能控制主窗口。

export const PITCH_CHANNEL = "uwb-pitch";
export type PitchMessage = { type: "pos"; pos: Pos } | { type: "nav"; action: NavAction };

export function SpeakerNotes() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const ch = new BroadcastChannel(PITCH_CHANNEL);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<PitchMessage>) => {
      if (e.data.type !== "pos") return;
      setPos(e.data.pos);
      setStartedAt((t) => t ?? Date.now());
    };
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const onKey = (e: KeyboardEvent) => {
      const cmd = keyToCommand(e.key);
      if (cmd === "next" || cmd === "prev") {
        e.preventDefault();
        ch.postMessage({ type: "nav", action: { type: cmd } } satisfies PitchMessage);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { ch.close(); window.clearInterval(tick); window.removeEventListener("keydown", onKey); };
  }, []);

  const scene = pos ? SCENES[pos.scene] : null;
  const next = pos ? SCENES[pos.scene + 1] : null;
  const elapsed = startedAt && now > startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#14110d", color: "#f4ecdc", padding: 40, display: "flex", flexDirection: "column", gap: 24, fontSize: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#e3b866" }}>
        <span>演讲者备注</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 32 }}>{mmss}</span>
      </div>
      {scene && pos ? (
        <>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{pos.scene}. {scene.title} <span style={{ fontSize: 24, color: "#9a9184" }}>拍 {pos.beat + 1} / {scene.beats}</span></div>
          <div style={{ fontSize: 30, lineHeight: 1.7, whiteSpace: "pre-wrap", flex: 1 }}>{scene.notes || "（无备注）"}</div>
          <div style={{ color: "#9a9184" }}>下一屏：{next ? next.title : "—"}</div>
        </>
      ) : (
        <div style={{ color: "#9a9184" }}>等待主窗口……在路演页按任意翻页键即可同步。</div>
      )}
    </div>
  );
}
