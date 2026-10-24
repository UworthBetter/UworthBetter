"use client";

import Image from "next/image";

export function FogCover({
  coverUrl,
  blurPx,
  rate,
  tall = false,
  short = false,
  pulse = false,
}: {
  coverUrl: string | null;
  blurPx: number;
  rate: number;
  tall?: boolean;
  short?: boolean;
  pulse?: boolean;
}) {
  const opacity = Math.max(0, 0.95 - rate * 0.72);
  return (
    <div
      className={`fog-box${tall ? " fog-core" : ""}${short ? " short" : ""}${pulse ? " clearing" : ""}`}
      style={{ ["--blur" as string]: `${blurPx}px`, ["--fog-opacity" as string]: String(opacity) }}
    >
      <div className="fog-img">
        {coverUrl ? <Image src={coverUrl} alt="" fill sizes="390px" style={{ objectFit: "cover" }} priority /> : null}
      </div>
      <div className="fog-overlay" />
      {pulse ? (
        <>
          <i className="spark" />
          <i className="spark" />
          <i className="spark" />
        </>
      ) : null}
      <div className="fog-pct">{rate >= 1 ? "迷雾散尽" : `迷雾已散去 ${Math.round(rate * 100)}%`}</div>
    </div>
  );
}
