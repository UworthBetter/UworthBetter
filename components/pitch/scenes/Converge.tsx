/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图 */
"use client";

import { motion } from "framer-motion";
import { useCachedSrc } from "@/components/pitch/ImageCache";
import type { SceneProps } from "@/components/pitch/scenes";
import { END_COVER_URL } from "@/components/pitch/scenes/Closing";
import { Puzzle } from "@/components/pitch/ui/Puzzle";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 7：四块拼图合拢 → 一句话简介 → 核心循环

const LOOP = ["建档：看见未来的你", "每周任务", "每日一句记录", "周末生成一章", "未来画像拟合", "下一章迷雾封面"];
const R = 300;

function LoopDiagram({ show }: { show: boolean }) {
  return (
    <div style={{ position: "relative", width: 2 * R + 360, height: 2 * R + 120 }}>
      <svg width="100%" height="100%" viewBox={`${-R - 180} ${-R - 60} ${2 * R + 360} ${2 * R + 120}`} style={{ position: "absolute", inset: 0 }}>
        <motion.circle
          r={R}
          fill="none"
          stroke="#e3b866"
          strokeWidth={3}
          strokeDasharray="10 14"
          initial={false}
          animate={{ pathLength: show ? 1 : 0, opacity: show ? 0.7 : 0 }}
          transition={{ duration: 1.2 }}
        />
      </svg>
      {LOOP.map((t, i) => {
        const a = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2;
        return (
          // 外层负责环形定位，内层 Reveal 的位移动画不会覆盖定位 transform
          <div
            key={t}
            style={{ position: "absolute", left: "50%", top: "50%",
              transform: `translate(calc(-50% + ${Math.cos(a) * R}px), calc(-50% + ${Math.sin(a) * R}px))` }}
          >
            <Reveal
              show={show}
              delay={0.2 + i * 0.15}
              className="pitch-card"
              style={{
                padding: "18px 28px", fontSize: 32, whiteSpace: "nowrap",
                background: i === 4 ? "#e3b866" : "#1f1a14", color: i === 4 ? "#14110d" : undefined, fontWeight: i === 4 ? 700 : 400,
              }}
            >
              {t}
            </Reveal>
          </div>
        );
      })}
    </div>
  );
}

export function Scene07Converge({ beat }: SceneProps) {
  const coverSrc = useCachedSrc(END_COVER_URL);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* 拼图合拢、点出产品名时，封面画面从暗处浮现；讲核心循环时再压暗让位给图示 */}
      <motion.div
        className="pitch-cover pitch-cover-dim"
        aria-hidden
        initial={false}
        animate={{ opacity: beat === 1 ? 0.55 : beat >= 2 ? 0.22 : 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        <img src={coverSrc ?? END_COVER_URL} alt="" draggable={false} />
      </motion.div>
      <motion.div
        initial={false}
        animate={beat >= 2 ? { x: -470, scale: 0.56 } : { x: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, position: "absolute" }}
      >
        <Puzzle lit={4} merged size={beat >= 1 ? 340 : 460} />
        <Reveal show={beat >= 1} className="pitch-center" style={{ position: "static", padding: 0, gap: 24 }}>
          <div className="pitch-kicker">这就是 UWORTHBETTER</div>
          <div className="pitch-claim-sm" style={{ maxWidth: 1500 }}>
            AI 把你的 90 天改编成一季 13 章的连载，<br />每周的真实行动，变成下一章的剧情。
          </div>
        </Reveal>
      </motion.div>
      <div style={{ position: "absolute", right: 120 }}>
        <LoopDiagram show={beat >= 2} />
      </div>
    </div>
  );
}
