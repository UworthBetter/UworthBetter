"use client";

import { useEffect, useState } from "react";
import { ApiClientError, api } from "@/lib/client/api";
import type { FutureSelfView } from "@/lib/contracts";
import { CharacterReveal } from "@/components/story/CharacterReveal";
import { LetterCard } from "@/components/story/LetterCard";
import { Button } from "@/components/ui/Button";

export function RevealScreen() {
  const [view, setView] = useState<FutureSelfView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.futureSelf().then(setView).catch((e) => setError(e instanceof ApiClientError ? e.message : "还没有揭晓"));
  }, []);

  if (error) {
    return (
      <div className="screen-pad stack">
        <p>{error}</p>
        <Button href="/onboarding">去建档</Button>
      </div>
    );
  }
  if (!view) return <div className="quiet-loading">灯还没亮…</div>;

  const profile = view.profile;
  return (
    <div className="screen-pad">
      <div className="center kicker">{profile.name}</div>
      <CharacterReveal imageUrl={view.sheetFutureUrl} />
      <h1 className="display center" style={{ fontSize: 28, margin: "8px 0 4px" }}>{profile.title}</h1>
      <p className="center muted">{profile.personality.join("、")}</p>
      <p className="center serif">「{profile.catchphrase}」</p>
      <div className="card">
        <div className="faint">现实里的身份</div>
        <p>{profile.realIdentity}</p>
        <div className="faint">每天的样子</div>
        <p style={{ marginBottom: 0 }}>{profile.dailyRoutine}</p>
      </div>
      <div style={{ marginTop: 12 }}>
        <LetterCard markdown={view.firstLetterMd ?? ""} from={profile.name} />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="kicker">你的故事</div>
        <div className="display" style={{ fontSize: 22 }}>《{view.seasonTitle}》</div>
        <p className="muted">{view.logline}</p>
        <p className="faint" style={{ marginBottom: 0 }}>第一幕从下一页展开。十三章，一周一张。</p>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button className="btn-block" href="/season">查看我的路线图</Button>
      </div>
    </div>
  );
}
