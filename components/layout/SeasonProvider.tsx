"use client";

import type { ReactNode } from "react";
import { SeasonContext, useSeasonState } from "@/hooks/useSeason";

export function SeasonProvider({ children }: { children: ReactNode }) {
  const value = useSeasonState();
  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}
