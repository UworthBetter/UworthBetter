import type { SeasonView } from "@/lib/contracts";

export function ActProgress({ acts }: { acts: SeasonView["acts"] }) {
  return (
    <div>
      <div className="act-label">
        {acts.map((act) => <span key={act.name}>{act.name}</span>)}
      </div>
      <div className="act-bar" aria-hidden>
        {acts.map((act) => (
          <div className="act-seg" key={act.name}>
            <i style={{ width: `${Math.round(act.progress * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
