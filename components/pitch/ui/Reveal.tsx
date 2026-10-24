"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/** 按拍显现：show 变化即改目标值，framer 自动打断进行中的动画，连按「下一步」不会叠加 */
export function Reveal({ show, children, y = 24, delay = 0, className, style }: {
  show: boolean; children: ReactNode; y?: number; delay?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y, filter: "blur(6px)" }}
      transition={{ duration: 0.6, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
