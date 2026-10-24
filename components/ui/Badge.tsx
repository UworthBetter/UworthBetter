import type { ChapterType } from "@/lib/contracts";
import { Icon } from "@/components/ui/Icon";

const LABEL: Record<ChapterType, { cls: string; text: string }> = {
  highlight: { cls: "badge-highlight", text: "高光章" },
  struggle: { cls: "badge-struggle", text: "挣扎章" },
  low: { cls: "badge-low", text: "低谷章" },
  rest: { cls: "badge-rest", text: "番外·休整章" },
};

export function TypeBadge({ type, className = "" }: { type: ChapterType | null; className?: string }) {
  if (!type) return null;
  const item = LABEL[type];
  return (
    <span className={`badge ${item.cls} ${className}`.trim()}>
      {type === "highlight" ? <Icon name="diamond" size="sm" className="icon-fill" /> : null}
      {item.text}
    </span>
  );
}
