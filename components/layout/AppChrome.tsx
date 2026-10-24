"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DemoPanel } from "@/components/DemoPanel";
import { SeasonProvider } from "@/components/layout/SeasonProvider";
import { TabBar } from "@/components/layout/TabBar";

const TAB_PATHS = ["/season", "/shelf", "/future", "/today"];

function Chrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const showTab = TAB_PATHS.some((p) => path === p);
  return (
    <>
      <div className={`screen-scroll${showTab ? " has-tab" : ""}`}>{children}</div>
      {showTab ? <TabBar /> : null}
      <DemoPanel />
    </>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <SeasonProvider>
      <Chrome>{children}</Chrome>
    </SeasonProvider>
  );
}
