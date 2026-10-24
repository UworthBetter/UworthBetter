"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// 路演页图片内存缓存：加载时把全部图片取成 Blob，之后用 object URL 渲染。
// public/ 下的文件是 max-age=0，HTTP 缓存在断网时无法重新验证；Blob 缓存不依赖网络。

const ImageCacheContext = createContext<ReadonlyMap<string, string>>(new Map());

export function ImageCacheProvider({ urls, children }: { urls: string[]; children: ReactNode }) {
  const [cache, setCache] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    void Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const obj = URL.createObjectURL(await res.blob());
          created.push(obj);
          return [url, obj] as const;
        } catch {
          return null; // 取不到就退回原始 URL
        }
      }),
    ).then((pairs) => {
      if (alive) setCache(new Map(pairs.filter((p): p is readonly [string, string] => !!p)));
    });
    return () => {
      alive = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);
  return <ImageCacheContext.Provider value={cache}>{children}</ImageCacheContext.Provider>;
}

/** 已缓存则返回 object URL，否则原样返回 */
export function useCachedSrc(url: string | null): string | null {
  const cache = useContext(ImageCacheContext);
  return url ? cache.get(url) ?? url : null;
}
