/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图 */
"use client";

import { motion } from "framer-motion";
import type { SceneProps } from "@/components/pitch/scenes";
import { Portrait } from "@/components/pitch/ui/Portrait";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 8–9：进入她的故事（纸色舞台）

export function Scene08Linxia({ data, beat }: SceneProps) {
  const flipped = beat >= 1;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 160px", gap: 120 }}>
      <div style={{ perspective: 2000 }}>
        <motion.div
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", width: 620, height: 820, transformStyle: "preserve-3d" }}
        >
          {[
            { src: data.sheets.present, label: "现在的林夏", back: false },
            { src: data.sheets.future, label: "90 天后的她", back: true },
          ].map((f) => (
            <div
              key={f.label}
              style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: f.back ? "rotateY(180deg)" : undefined,
                borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(28,26,22,.5)", background: "#fffcf6" }}
            >
              <Portrait src={f.src} alt={f.label} size={620} round={false} style={{ height: 820, borderRadius: 0 }} />
              <div className="pitch-foot" style={{ position: "absolute", left: 28, bottom: 24, color: "#fff", textShadow: "0 2px 8px #0008" }}>{f.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40 }}>
        <Reveal show className="pitch-kicker">认识林夏 · 26 岁 · 互联网运营</Reveal>
        <Reveal show className="pitch-claim-sm">「90 天，成为能接单的插画师。」</Reveal>
        <Reveal show={flipped} className="pitch-body" style={{ color: "var(--p-text)" }}>
          她上传一张照片，写下理想的样子——<br />这是 <span className="pitch-gold">90 天后的她</span>。
        </Reveal>
        <Reveal show={beat >= 2} className="pitch-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{data.persona.name} · <span className="pitch-gold">{data.persona.title}</span></div>
          <div className="pitch-body">口头禅：「{data.persona.catchphrase}」</div>
          <div className="pitch-body" style={{ color: "var(--p-text)" }}>她写来的第一封信：「{data.firstLetterQuote}」</div>
        </Reveal>
      </div>
    </div>
  );
}

// 镜头推近第 3 章：使其中心落到画布中心（1.9 倍缩放，变换原点为网格左上角）
const SHOWN = 3; // 演示时间点：第 1–3 章已完成，第 4 章迷雾，其余锁定
const BOOK_W = 220;
const BOOK_H = 300;

export function Scene09Shelf({ data, beat }: SceneProps) {
  const focus = beat >= 1;
  const low = data.chapters[2];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <motion.div
        initial={false}
        animate={focus ? { scale: 1.9, x: -281, y: -5, opacity: beat >= 2 ? 0 : 1 } : { scale: 1, x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "absolute", left: 120, top: 260, display: "grid", gridTemplateColumns: `repeat(7, ${BOOK_W}px)`, gap: 20, transformOrigin: "0 0" }}
      >
        {data.chapters.map((c) => {
          const state = c.no <= SHOWN ? "done" : c.no === SHOWN + 1 ? "fog" : "locked";
          return (
            <div key={c.no} style={{ position: "relative", width: BOOK_W, height: BOOK_H, borderRadius: 12, overflow: "hidden", background: "#e9e1d0",
              boxShadow: "0 18px 40px -20px rgba(28,26,22,.45)", outline: c.no === 3 && focus ? "4px solid #a8822f" : "none" }}>
              {state !== "locked" ? (
                <Portrait src={c.coverUrl} alt={c.title} size={BOOK_W} round={false}
                  style={{ height: BOOK_H, borderRadius: 0, filter: state === "fog" ? "blur(24px) saturate(.7)" : undefined }} />
              ) : null}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 14px 12px", fontSize: 22,
                background: state === "locked" ? "none" : "linear-gradient(transparent, rgba(0,0,0,.65))", color: state === "locked" ? "#9a9184" : "#fff" }}>
                第 {c.no} 章{state === "done" ? ` · ${c.title}` : state === "fog" ? " · 迷雾中" : ""}
              </div>
            </div>
          );
        })}
      </motion.div>
      <Reveal show={!focus} className="pitch-center" style={{ inset: "auto 0 90px", position: "absolute", padding: 0 }}>
        <div className="pitch-claim-sm">她的 90 天，变成了一部连载。</div>
      </Reveal>
      <Reveal show={beat >= 2} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 160px", gap: 100 }}>
        <Portrait src={low.panelUrl} alt={low.title} size={720} round={false} style={{ height: 720, borderRadius: 24, boxShadow: "0 40px 90px -30px rgba(28,26,22,.5)" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 36 }}>
          <div className="pitch-kicker">第 3 章 · 低谷章 · 《{low.title}》</div>
          <div className="pitch-body" style={{ color: "var(--p-text)" }}>那一周她几乎什么都没做：<br />「{low.logQuotes[1] ?? low.logQuotes[0] ?? ""}」</div>
          <div className="pitch-body" style={{ color: "var(--p-text)" }}>未来的她写来：<br /><span className="pitch-gold">「{low.letterQuote}」</span></div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.35 }}>别的 App 提醒她「断签了」。<br />在这里，这是最动人的一章。</div>
        </div>
      </Reveal>
    </div>
  );
}
