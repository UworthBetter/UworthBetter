/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图 */
"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { buildFateTree, type FateTree } from "@/components/pitch/model/fateTree";
import type { PitchData, PitchSnapshot } from "@/components/pitch/model/types";
import { buildWall } from "@/components/pitch/model/wall";
import type { SceneProps } from "@/components/pitch/scenes";
import { Portrait } from "@/components/pitch/ui/Portrait";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 11：画像演化（全场高潮）
// 0 快进到第 90 天 → 1 季初画像 → 2 命运树生长 → 3 光沿真实路径流动、停靠节点 → 4 终点亮起
// → 5 拉远成平行宇宙墙 → 6 逐个熄灭、只留真实的她 → 7 季初/季末对照
// 视觉原则：暗只表示「没走这条路」，分支画像不变暗、不灰度。

const TX = 330; // 树在画布中的偏移
const TY = 90;
const TW = 1360;
const TH = 900;
const LIGHT_SECONDS = 3.2;
const EASE = [0.22, 1, 0.36, 1] as const;

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
};

/** 停靠节点：方向发生变化的前 4 周，不足补幕终（4/9/13） */
function pickStops(snapshots: PitchSnapshot[]): number[] {
  const changed = snapshots.slice(1).filter((s, i) => i > 0 && s.direction !== snapshots[i].direction).map((s) => s.chapterNo);
  const stops = [...new Set([...changed.slice(0, 4), 4, 9, 13])].slice(0, 4);
  return stops.sort((a, b) => a - b);
}

function Tree({ tree, beat, data }: { tree: FateTree; beat: number; data: PitchData }) {
  const byId = useMemo(() => new Map(tree.nodes.map((n) => [n.id, n])), [tree]);
  const grown = beat >= 2;
  const lit = beat >= 3;
  const realD = tree.realPath.map((id, i) => {
    const n = byId.get(id)!;
    if (i === 0) return `M${n.x} ${n.y}`;
    const p = byId.get(tree.realPath[i - 1])!;
    return curve(p.x, p.y, n.x, n.y).replace(/^M[^C]+/, "");
  }).join("");
  const branchImg = new Map(data.branches.map((b) => [b.id, b.imageUrl]));
  const realLeaf = tree.realPath[tree.realPath.length - 1];
  const leafSize = Math.max(28, Math.min(64, (TH / Math.max(1, tree.leaves.length)) * 0.8));

  return (
    <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: TH }}>
      <svg width={TW} height={TH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {tree.edges.map((e) => {
          const a = byId.get(e.from)!;
          const b = byId.get(e.to)!;
          return (
            <motion.path
              key={`${e.from}>${e.to}`}
              d={curve(a.x, a.y, b.x, b.y)}
              fill="none"
              stroke={e.real && lit ? "rgba(227,184,102,.35)" : "rgba(244,236,220,.16)"}
              strokeWidth={e.decorative ? 1.2 : 2}
              initial={false}
              animate={{ pathLength: grown ? 1 : 0, opacity: grown ? (e.decorative ? (beat >= 5 ? 1 : 0) : 1) : 0 }}
              transition={{ duration: 0.5, delay: grown ? a.depth * 0.11 : 0 }}
            />
          );
        })}
        <motion.path
          d={realD}
          fill="none"
          stroke="#e3b866"
          strokeWidth={5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 10px rgba(227,184,102,.9))" }}
          initial={false}
          animate={{ pathLength: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
          transition={{ duration: lit ? LIGHT_SECONDS : 0.2, ease: "linear" }}
        />
      </svg>
      {tree.leaves.map((l) => {
        const n = byId.get(l.nodeId)!;
        if (l.nodeId === realLeaf) return null;
        return (
          <motion.div
            key={l.nodeId}
            initial={false}
            animate={{ opacity: grown ? 1 : 0, scale: grown ? 1 : 0.4 }}
            transition={{ duration: 0.5, delay: grown ? 1.5 : 0 }}
            style={{ position: "absolute", left: n.x + 14, top: n.y - leafSize / 2 }}
          >
            <Portrait src={l.branchId ? branchImg.get(l.branchId) ?? null : null} alt="另一个她" size={leafSize} style={{ border: "2px solid rgba(244,236,220,.35)" }} />
          </motion.div>
        );
      })}
    </div>
  );
}

const CARD_W = 330;

/** 停靠说明卡：交替放在树上方/下方的带上，同侧卡片不重叠，用细线连到节点 */
function Stops({ tree, data, beat }: { tree: FateTree; data: PitchData; beat: number }) {
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const stops = pickStops(data.snapshots);
  const lastX = { above: -Infinity, below: -Infinity };
  const placed = stops.map((no, i) => {
    const n = byId.get(tree.realPath[no])!;
    const side = i % 2 === 0 ? "above" : "below";
    const x = Math.min(Math.max(n.x - CARD_W / 2, lastX[side] + CARD_W + 30), TW - CARD_W);
    lastX[side] = x;
    return { no, n, side, x };
  });
  const show = beat >= 3 && beat < 5;
  return (
    <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: TH, pointerEvents: "none" }}>
      <svg width={TW} height={TH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {placed.map(({ no, n, side, x }) => (
          <motion.line
            key={no}
            x1={n.x} y1={n.y} x2={x + CARD_W / 2} y2={side === "above" ? 150 : TH - 150}
            stroke="rgba(227,184,102,.6)" strokeDasharray="4 6" strokeWidth={2}
            initial={false}
            animate={{ opacity: show ? 1 : 0 }}
            transition={{ duration: 0.3, delay: beat === 3 ? (no / 13) * LIGHT_SECONDS : 0 }}
          />
        ))}
      </svg>
      {placed.map(({ no, side, x }) => {
        const s = data.snapshots[no];
        return (
          <motion.div
            key={no}
            initial={false}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : side === "above" ? 12 : -12 }}
            transition={{ duration: 0.4, delay: beat === 3 ? (no / 13) * LIGHT_SECONDS : 0 }}
            style={{ position: "absolute", left: x, top: side === "above" ? -60 : undefined, bottom: side === "below" ? -60 : undefined, width: CARD_W }}
          >
            <div className="pitch-card" style={{ padding: 20, background: "rgba(20,17,13,.94)", borderColor: "rgba(227,184,102,.5)" }}>
              <div style={{ fontSize: 20, color: "#e3b866" }}>第 {no} 周 · {DIRECTION_LABEL[s.direction]}</div>
              <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0" }}>{s.headline}</div>
              {s.evidence[0] ? <div style={{ fontSize: 20, color: "var(--p-dim)" }}>「{s.evidence[0]}」</div> : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const DIRECTION_LABEL = { ahead: "超额", on_track: "照做", drift: "偏离", pivot: "转向" } as const;

function Wall({ data, beat, realSrc }: { data: PitchData; beat: number; realSrc: string | null }) {
  const cells = useMemo(() => {
    const sources = [...data.branches.map((b) => b.imageUrl), ...data.snapshots.map((s) => s.imageUrl)].filter((u): u is string => !!u);
    return buildWall(sources, realSrc, { width: 1920, height: 1080, count: 96, seed: 11 });
  }, [data, realSrc]);
  const shown = beat >= 5;
  const collapsed = beat >= 6;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {cells.map((c, i) => {
        const visible = shown && (c.real || !collapsed);
        // 出现：从中心向外（delay 越大越靠中心 → 反过来用）；熄灭：离中心越远越先
        const delay = !shown ? 0 : collapsed ? c.delay : 1.6 - c.delay;
        const big = c.real && collapsed;
        const S = 520;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: big ? (1920 - S) / 2 : c.x,
              top: big ? (1080 - S) / 2 - 40 : c.y,
              width: big ? S : c.size,
              height: big ? S : c.size,
              borderRadius: "50%",
              overflow: "hidden",
              opacity: visible ? 1 : 0,
              transform: `scale(${visible ? 1 : 0.6})`,
              transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s, left 1s ${collapsed ? 1.8 : 0}s, top 1s ${collapsed ? 1.8 : 0}s, width 1s ${collapsed ? 1.8 : 0}s, height 1s ${collapsed ? 1.8 : 0}s`,
              boxShadow: c.real && collapsed ? "0 0 80px rgba(227,184,102,.6)" : "none",
              border: c.real ? "3px solid #e3b866" : "none",
            }}
          >
            {c.src ? (
              <img
                src={c.src}
                alt=""
                draggable={false}
                style={{ width: "100%", height: "100%", maxWidth: "none", objectFit: "cover", objectPosition: "50% 15%", transformOrigin: "50% 20%",
                  transform: `scale(${c.variant.crop}) scaleX(${c.variant.flip ? -1 : 1})`, filter: c.variant.hue ? `hue-rotate(${c.variant.hue}deg)` : undefined }}
              />
            ) : (
              <div className="pitch-ph" style={{ width: "100%", height: "100%" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Scene11Evolution({ data, beat }: SceneProps) {
  const realPath = useMemo(() => data.snapshots.slice(1).map((s) => s.direction), [data]);
  const tree = useMemo(() => buildFateTree(realPath, data.branches, { width: TW, height: TH, decorativeSeed: 2026, decorativeCount: 160 }), [realPath, data]);
  const start = data.snapshots[0];
  const end = data.snapshots[13];
  const endSrc = end.imageUrl ?? data.sheets.future;
  const root = tree.nodes[0];
  const realLeaf = tree.nodes.find((n) => n.id === tree.realPath[13])!;
  const treePhase = beat >= 1 && beat <= 5;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Reveal show={beat === 0} className="pitch-center">
        <div className="pitch-kicker">快进到第 90 天</div>
        <div className="pitch-claim">她这 90 天，<br />是怎么走过来的？</div>
      </Reveal>

      {/* 镜头：拍 5 拉远并淡出，让位给墙 */}
      <motion.div
        initial={false}
        animate={{ opacity: treePhase ? (beat >= 5 ? 0 : 1) : 0, scale: beat >= 5 ? 0.42 : 1 }}
        transition={{ duration: beat >= 5 ? 1.4 : 0.6, ease: EASE }}
        style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}
      >
        <Tree tree={tree} beat={beat} data={data} />
        <Stops tree={tree} data={data} beat={beat} />
        <div style={{ position: "absolute", left: TX + root.x - 110, top: TY + root.y - 110 }}>
          <Portrait src={start.imageUrl} alt="季初的她" size={220} style={{ border: "4px solid #e3b866", boxShadow: "0 0 40px rgba(227,184,102,.4)" }} />
          <div className="pitch-foot" style={{ textAlign: "center", marginTop: 12 }}>季初 · 她以为的未来</div>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: beat >= 4 ? 1 : 0, scale: beat >= 4 ? 1 : 0.5 }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ position: "absolute", left: TX + realLeaf.x - 20, top: TY + realLeaf.y - 110 }}
        >
          <Portrait src={endSrc} alt="第 90 天的她" size={220} style={{ border: "4px solid #e3b866", boxShadow: "0 0 60px rgba(227,184,102,.7)" }} />
        </motion.div>
      </motion.div>

      <Wall data={data} beat={beat <= 6 ? beat : 4} realSrc={endSrc} />

      <Reveal show={beat === 5} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "120px 0 60px", textAlign: "center",
        background: "linear-gradient(transparent, rgba(20,17,13,.92) 45%)" }}>
        <div className="pitch-claim-sm" style={{ textShadow: "0 4px 24px #000" }}>每一个节点，她都可能成为另一个人。</div>
      </Reveal>
      <Reveal show={beat === 6} delay={2.4} style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center" }}>
        <div className="pitch-claim-sm pitch-gold">这是她自己选出来的。</div>
      </Reveal>

      <Reveal show={beat >= 7} className="pitch-center" style={{ flexDirection: "row", gap: 80 }}>
        <div style={{ textAlign: "center" }}>
          <Portrait src={start.imageUrl} alt="季初的她" size={460} style={{ border: "3px solid rgba(244,236,220,.4)" }} />
          <div className="pitch-body" style={{ marginTop: 24 }}>第 1 天 · 她以为的未来</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="pitch-num" style={{ fontSize: 140 }}>13</div>
          <div className="pitch-body">次拟合</div>
          <div style={{ fontSize: 64, color: "#e3b866" }}>→</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Portrait src={endSrc} alt="第 90 天的她" size={460} style={{ border: "4px solid #e3b866", boxShadow: "0 0 60px rgba(227,184,102,.5)" }} />
          <div className="pitch-body" style={{ marginTop: 24, color: "var(--p-text)" }}>第 90 天 · 她真正成为的人</div>
        </div>
      </Reveal>
    </div>
  );
}
