"use client";

import { motion } from "framer-motion";

// 研究推理链的四块拼图：每段研究点亮一块，场景 7 合拢成产品。
export const PUZZLE_LABELS = ["被看见", "对话", "下一章", "可重写"] as const;

// 2×2 拼图块的路径（每块 200×200，凸起/凹口互相咬合）
const PIECES = [
  "M0 0H200V80a20 20 0 1 1 0 40V200H120a20 20 0 1 0-40 0H0Z",
  "M200 0H400V200H320a20 20 0 1 1-40 0H200V120a20 20 0 1 0 0-40Z",
  "M0 200H80a20 20 0 1 0 40 0H200V280a20 20 0 1 1 0 40V400H0Z",
  "M200 200H280a20 20 0 1 0 40 0H400V400H200V320a20 20 0 1 0 0-40Z",
];
const LABEL_POS = [[100, 110], [300, 110], [100, 310], [300, 310]] as const;

/** lit：已点亮的块数（0–4）；merged：合拢（去掉缝隙、整体发光） */
export function Puzzle({ lit, merged = false, size = 400, focus }: { lit: number; merged?: boolean; size?: number; focus?: number }) {
  const gap = merged ? 0 : 14;
  return (
    <svg viewBox="-20 -20 440 440" width={size} height={size} style={{ overflow: "visible" }}>
      {PIECES.map((d, i) => {
        const on = i < lit;
        const dx = (i % 2 ? 1 : -1) * gap;
        const dy = (i < 2 ? -1 : 1) * gap;
        return (
          <motion.g key={i} initial={false} animate={{ x: dx, y: dy }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <motion.path
              d={d}
              initial={false}
              animate={{
                fill: on ? (merged ? "#e3b866" : "rgba(227,184,102,0.22)") : "rgba(244,236,220,0.03)",
                stroke: on ? "#e3b866" : "rgba(244,236,220,0.22)",
              }}
              strokeWidth={3}
              style={{ filter: on && (merged || i === focus) ? "drop-shadow(0 0 18px rgba(227,184,102,.7))" : "none" }}
              transition={{ duration: 0.6 }}
            />
            <motion.text
              x={LABEL_POS[i][0]}
              y={LABEL_POS[i][1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={40}
              fontWeight={700}
              initial={false}
              animate={{ opacity: on ? 1 : 0.25, fill: merged ? "#14110d" : "#f4ecdc" }}
            >
              {PUZZLE_LABELS[i]}
            </motion.text>
          </motion.g>
        );
      })}
    </svg>
  );
}
