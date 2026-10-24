"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { DemoPanel } from "@/components/DemoPanel";
import { SeasonProvider } from "@/components/layout/SeasonProvider";
import { TabBar } from "@/components/layout/TabBar";

const TAB_PATHS = ["/season", "/shelf", "/future", "/today"];
const EMBED_KEY = "uwb-embed";

/** 路演页 iframe 以 ?embed=1 打开 App：记入 sessionStorage，之后 iframe 内跳转也持续隐藏开发者面板 */
function readEmbedded() {
  if (new URLSearchParams(window.location.search).get("embed") === "1") sessionStorage.setItem(EMBED_KEY, "1");
  return sessionStorage.getItem(EMBED_KEY) === "1";
}
const noop = () => () => {};
function useEmbedded() {
  return useSyncExternalStore(noop, readEmbedded, () => false);
}

function Chrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const showTab = TAB_PATHS.some((p) => path === p);
  const embedded = useEmbedded();
  return (
    <>
      <div className={`screen-scroll${showTab ? " has-tab" : ""}`}>{children}</div>
      {showTab ? <TabBar /> : null}
      {embedded ? null : <DemoPanel />}
    </>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  // 路演页离线可用：不挂季度数据请求、TabBar 与开发者面板
  if (usePathname()?.startsWith("/pitch")) return <>{children}</>;
  return (
    <SeasonProvider>
      <Chrome>{children}</Chrome>
    </SeasonProvider>
  );
}
