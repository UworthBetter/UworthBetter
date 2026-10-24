"use client";

import type { ReactNode } from "react";

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className={`chip${active ? " active" : ""}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}
