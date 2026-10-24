"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError, api } from "@/lib/client/api";
import { useMe } from "@/hooks/useMe";
import { useSeason } from "@/hooks/useSeason";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

// 示例章节用预生成演示季的真实封面（高光开场 → 低谷 → 幕终 → 终章）
const COVERS = ["/demo/cover-1.jpg", "/demo/cover-3.jpg", "/demo/cover-9.jpg", "/demo/cover-13.jpg"];

export function Landing() {
  const { me, loading } = useMe();
  const { refresh } = useSeason();
  const params = useSearchParams();
  const preview = params.get("preview") === "1";
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const redirecting = Boolean(me && !preview && (me.seasonStatus === "active" || me.seasonStatus === "finished"));

  useEffect(() => {
    if (redirecting) router.replace("/season");
  }, [redirecting, router]);

  useEffect(() => {
    const t = window.setInterval(() => setSlide((n) => (n + 1) % COVERS.length), 4200);
    return () => window.clearInterval(t);
  }, []);

  if (loading || redirecting || !me) {
    return (
      <div className="quiet-loading">
        <div className="pulse-dot" />
        <div>编辑室正在铺纸…</div>
      </div>
    );
  }

  async function loadDemo() {
    setBusy(true);
    setError("");
    try {
      await api.demo.seed();
      await refresh();
      // 先进揭晓页认识林夏（人格卡 + 首封信），再开始第 1 周
      router.push("/reveal");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "演示账号没有载入");
      setBusy(false);
    }
  }

  return (
    <div className="screen-pad">
      <div className="kicker"><Icon name="diamond" className="icon-fill" /> UWORTHBETTER</div>
      <h1 className="display" style={{ fontSize: 32, lineHeight: 1.25, margin: "10px 0" }}>把 90 天，写成一部你会追更的连载</h1>
      <p className="muted">未来的你先走一步。你负责这一周的灯，故事负责把雾掀开。</p>

      <div className="hero" aria-hidden>
        <Image src="/landing/hero.jpg" alt="" fill sizes="480px" priority
          style={{ objectFit: "cover", objectPosition: "50% 45%" }} />
        <div className="fog-layer" />
        <div className="hero-fade" />
      </div>

      <div className="card slide-card">
        <div className="faint">示例章节</div>
        <Image src={COVERS[slide]!} alt="" width={640} height={960} style={{ width: "100%", height: 148, objectFit: "cover", objectPosition: "50% 30%", borderRadius: 12, marginTop: 8 }} />
        <div className="dots">
          {COVERS.map((src, index) => (
            <button key={src} type="button" className={index === slide ? "on" : ""} aria-label={`第 ${index + 1} 张`} onClick={() => setSlide(index)} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="faint">低谷章也会被写下来</div>
        <p className="serif" style={{ marginBottom: 0 }}>有一周你只写下「好累」。那一章不会催你，信会先到，正文跟在后面。</p>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <Button className="btn-block" href="/onboarding">开始写你的故事</Button>
        {me.demoMode ? (
          <Button className="btn-block" variant="secondary" disabled={busy} onClick={() => void loadDemo()}>
            {busy ? "正在铺开演示季…" : "载入演示账号"}
          </Button>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
      </div>
    </div>
  );
}
