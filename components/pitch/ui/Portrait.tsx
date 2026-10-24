/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图，避免依赖图片优化服务 */
"use client";

import { useCachedSrc } from "@/components/pitch/ImageCache";

/** 画像 / 插画；src 为 null（生成失败或数据未就绪）时显示文风渐变占位 */
export function Portrait({ src, alt, size, round = true, className = "", style }: {
  src: string | null; alt: string; size: number; round?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const cached = useCachedSrc(src);
  // maxWidth: none —— 覆盖预置样式 img { max-width: 100% }，否则贴近容器边缘时会被挤扁
  const box: React.CSSProperties = { width: size, height: size, maxWidth: "none", flex: "none", borderRadius: round ? "50%" : 16, objectPosition: "50% 18%", ...style };
  if (!cached) {
    return (
      <div aria-label={alt} className={`pitch-ph ${className}`} style={box}>
        <span>{alt.slice(0, 2)}</span>
      </div>
    );
  }
  return <img src={cached} alt={alt} className={`object-cover ${className}`} style={box} draggable={false} />;
}
