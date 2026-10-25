"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * 插画按文件自身比例占满宽度。解码前用 fallback 占位，解码后改成真实比例，
 * object-fit: contain 保证整张图都在框里。
 */
export function FitImage({
  src,
  alt,
  sizes,
  ratio = "2 / 3",
  priority = false,
  className,
  onError,
}: {
  src: string;
  alt: string;
  sizes: string;
  ratio?: string;
  priority?: boolean;
  className?: string;
  onError?: () => void;
}) {
  const [tracked, setTracked] = useState(src);
  const [aspect, setAspect] = useState(ratio);
  if (tracked !== src) {
    setTracked(src);
    setAspect(ratio);
  }

  return (
    <div className={`fit-frame${className ? ` ${className}` : ""}`} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: "contain" }}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
          }
        }}
        onError={onError}
      />
    </div>
  );
}
