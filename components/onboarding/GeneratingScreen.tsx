"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useJob } from "@/hooks/useJob";
import { GeneratingStages, stagePercent } from "@/components/story/GeneratingStages";
import { StreamingText } from "@/components/story/StreamingText";
import { Button } from "@/components/ui/Button";

const LABELS = [
  { id: "profile", label: "听清你的愿望" },
  { id: "sheet_future", label: "未来的你正在走来" },
  { id: "sheet_present", label: "现在的你站到灯下" },
  { id: "roadmap", label: "十三章路线正在铺开" },
  { id: "letter", label: "第一封信在落笔" },
  { id: "cover1", label: "点亮第一章的灯" },
];

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function GeneratingScreen() {
  const params = useSearchParams();
  const jobId = params.get("job");
  const router = useRouter();
  const [epoch, setEpoch] = useState(0);
  const snap = useJob(jobId, epoch);

  useEffect(() => {
    if (!snap.done) return;
    const t = window.setTimeout(() => router.replace(snap.redirect || "/reveal"), 700);
    return () => window.clearTimeout(t);
  }, [snap.done, snap.redirect, router]);

  const profile = snap.data.profile ?? {};
  const future = profile.futureSelf && typeof profile.futureSelf === "object" ? (profile.futureSelf as Record<string, unknown>) : null;
  const personality = Array.isArray(future?.personality) ? future.personality.filter((item) => typeof item === "string").join("、") : "";
  const futureUrl = textOf(snap.data.sheet_future?.url);
  const presentUrl = textOf(snap.data.sheet_present?.url);
  const percent = stagePercent(snap.steps, LABELS);
  const profileReady = snap.steps.profile === "done";

  if (!jobId) {
    return (
      <div className="screen-pad stack">
        <h1 className="display" style={{ fontSize: 26 }}>没有找到这场生成</h1>
        <Button href="/onboarding">回到建档</Button>
      </div>
    );
  }

  return (
    <div className="screen-pad">
      <div className="gen-ring ritual-ring" style={{ ["--p" as string]: `${Math.max(percent, 6)}%` }}>
        <div className="pct">{percent}%</div>
      </div>
      <div className="ritual-wrap" aria-live="polite">
        <div className="ritual-line">正在聆听你的愿望…</div>
        <div className="ritual-line">未来的你正在赶来…</div>
        <div className="ritual-line">正在为她/他点亮第一盏灯…</div>
      </div>
      <GeneratingStages steps={snap.steps} labels={LABELS} />

      {profileReady ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="kicker">{textOf(profile.seasonTitle) || "你的故事"}</div>
          <div className="display" style={{ fontSize: 22 }}>{textOf(future?.name) || "未来的你"}</div>
          <p>{textOf(future?.title)}</p>
          {personality ? <p className="muted">性格：{personality}</p> : null}
          {textOf(future?.catchphrase) ? <p className="serif">「{textOf(future?.catchphrase)}」</p> : null}
          {textOf(profile.logline) ? <p className="faint">{textOf(profile.logline)}</p> : null}
        </div>
      ) : null}

      {futureUrl || presentUrl ? (
        <div className="row" style={{ marginTop: 12 }}>
          {futureUrl ? <Image className="thumb" src={futureUrl} alt="未来的你" width={84} height={112} /> : null}
          {presentUrl ? <Image className="thumb" src={presentUrl} alt="现在的你" width={84} height={112} /> : null}
        </div>
      ) : null}

      {snap.texts.letter || snap.steps.letter ? (
        <div style={{ marginTop: 14 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>第一封信</div>
          <StreamingText text={snap.texts.letter} streaming={snap.steps.letter !== "done" && !snap.error} />
        </div>
      ) : null}

      {snap.error ? (
        <div className="stack" style={{ marginTop: 16 }}>
          <p className="field-error">{snap.error.message || "生成中断了"}</p>
          <Button onClick={() => setEpoch((n) => n + 1)}>再试一次</Button>
          <Button variant="ghost" href="/onboarding">返回修改</Button>
        </div>
      ) : null}
    </div>
  );
}
