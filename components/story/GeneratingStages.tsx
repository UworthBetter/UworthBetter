import { Icon } from "@/components/ui/Icon";

export function GeneratingStages({
  steps,
  labels,
}: {
  steps: Record<string, string | undefined>;
  labels: { id: string; label: string }[];
}) {
  const current = labels.find((item) => steps[item.id] !== "done")?.id;
  return (
    <div>
      {labels.map((item) => {
        const status = steps[item.id];
        const cls = status === "done" ? "done" : item.id === current ? "now" : "todo";
        return (
          <div key={item.id} className={`gen-step ${cls}`}>
            <div className="dot">{status === "done" ? <Icon name="check" size="sm" /> : null}</div>
            <span className="txt">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function stagePercent(steps: Record<string, string | undefined>, labels: { id: string }[]) {
  if (labels.length === 0) return 0;
  const done = labels.filter((item) => steps[item.id] === "done").length;
  return Math.round((done / labels.length) * 100);
}
