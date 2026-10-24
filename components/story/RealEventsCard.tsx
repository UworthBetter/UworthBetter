"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function RealEventsCard({ events }: { events: { real: string; story: string }[] }) {
  const [open, setOpen] = useState(true);
  if (events.length === 0) return null;
  return (
    <div className={`fold-card${open ? " open" : ""}`}>
      <button type="button" className="fold-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="label"><Icon name="link" />本章取材自你的 {events.length} 条真实记录</span>
        <Icon name="chevron-down" className="chev" />
      </button>
      {open ? (
        <div className="fold-body">
          {events.map((event) => (
            <div className="map-row" key={event.real}>
              <span className="real">{event.real}</span>
              <span className="story"><Icon name="chevron-right" size="sm" />{event.story}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
