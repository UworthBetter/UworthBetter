"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function DeviceStatus() {
  const [time, setTime] = useState("9:41");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="device-status">
      <span>{time}</span>
      <span className="status-dots"><span /><span /><span /></span>
    </div>
  );
}

export function MobileShell({ children }: { children: ReactNode }) {
  // 路演页自带 1920×1080 舞台，不套手机外框
  if (usePathname()?.startsWith("/pitch")) return <>{children}</>;
  return (
    <div className="desk">
      <div className="device">
        <div className="device-notch" aria-hidden />
        <DeviceStatus />
        <div className="device-screen">{children}</div>
      </div>
    </div>
  );
}
