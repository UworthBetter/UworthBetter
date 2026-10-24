"use client";

import { useEffect, useState, type ReactNode } from "react";

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/** 固定 1920×1080 画布，按视口等比缩放、四周留黑边 */
export function Stage({ children, black, dark }: { children: ReactNode; black: boolean; dark: boolean }) {
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      <div
        className="pitch-canvas absolute left-1/2 top-1/2 overflow-hidden"
        data-dark={dark ? "1" : "0"}
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})`, opacity: scale ? 1 : 0 }}
      >
        {children}
      </div>
      {black ? <div className="absolute inset-0 z-[60] bg-black" /> : null}
    </div>
  );
}
