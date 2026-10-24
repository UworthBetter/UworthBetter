"use client";

import type { QuestView } from "@/lib/contracts";
import { Icon } from "@/components/ui/Icon";

export function QuestList({
  quests,
  onToggle,
}: {
  quests: QuestView[];
  onToggle?: (id: string, done: boolean) => void;
}) {
  return (
    <div>
      {quests.map((quest) => (
        <div key={quest.id} className={`quest-item${quest.done ? " done" : ""}`} title={quest.storyHook || undefined}>
          <button
            type="button"
            className={`tick${quest.done ? " on" : ""}`}
            role="checkbox"
            aria-checked={quest.done}
            aria-label={quest.text}
            disabled={!onToggle}
            onClick={() => onToggle?.(quest.id, !quest.done)}
          >
            <svg className="tick-svg" viewBox="0 0 24 24"><path d="M4.5 12.5 9.5 17.5 20 6" /></svg>
          </button>
          <span className="txt">{quest.text}</span>
          {quest.isKey ? <span className="key"><Icon name="flag" size="sm" />关键</span> : quest.storyHook ? <span className="plus">+剧情</span> : null}
        </div>
      ))}
    </div>
  );
}
