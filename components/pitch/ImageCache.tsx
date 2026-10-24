"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadBlobs } from "@/components/pitch/model/blobLoader";

// 路演页资源内存缓存（图片 + 备用视频）：加载时取成 Blob，之后用 object URL 渲染。
// public/ 下的文件是 max-age=0，HTTP 缓存在断网时无法重新验证；Blob 缓存不依赖网络。

const ImageCacheContext = createContext<ReadonlyMap<string, string>>(new Map());

export function ImageCacheProvider({ urls, children }: { urls: string[]; children: ReactNode }) {
  const [cache, setCache] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    // 每取到一张就生效；单个请求卡住按超时放弃，不拖累其他图片
    void loadBlobs(urls, (url, blob) => {
      const obj = URL.createObjectURL(blob);
      if (!alive) return URL.revokeObjectURL(obj); // 已卸载后晚到的结果立即释放
      created.push(obj);
      setCache((prev) => new Map(prev).set(url, obj));
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
