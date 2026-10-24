/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图，避免依赖图片优化服务 */
"use client";

/** 画像 / 插画；src 为 null（生成失败或数据未就绪）时显示文风渐变占位 */
export function Portrait({ src, alt, size, round = true, className = "", style }: {
  src: string | null; alt: string; size: number; round?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const box: React.CSSProperties = { width: size, height: size, borderRadius: round ? "50%" : 16, ...style };
  if (!src) {
    return (
      <div aria-label={alt} className={`pitch-ph ${className}`} style={box}>
        <span>{alt.slice(0, 2)}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} style={box} draggable={false} />;
}
