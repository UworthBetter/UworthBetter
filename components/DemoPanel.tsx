"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { useMe } from "@/hooks/useMe";
import { useSeason } from "@/hooks/useSeason";

const CACHE_KEY = "uwb-demo-cached";

export function DemoPanel() {
  const { me } = useMe();
  const { refresh } = useSeason();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(0.6);
  const [cached, setCached] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (!me?.demoMode) return null;
  const lifted = path === "/season" || path === "/shelf" || path === "/future" || path === "/today";

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setNote("");
    try {
      await task();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "没有完成");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={`demo-fab${lifted ? "" : " no-tab-fab"}`} onClick={() => setOpen((v) => !v)}>
        {open ? "收起" : "演示"}
      </button>
      {open ? (
        <div className={`demo-panel card${lifted ? "" : " no-tab-fab"}`}>
          <b>演示控制</b>
          <div className="stack" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run(async () => { await api.demo.seed(); await refresh(); router.push("/season"); setNote("已载入林夏的故事"); })}>载入演示账号</button>
            <label>快进完成度 <input type="range" min={0} max={100} value={Math.round(rate * 100)} onChange={(e) => setRate(Number(e.target.value) / 100)} /></label>
            <label>缓存回放 <input type="checkbox" checked={cached} onChange={(e) => { setCached(e.target.checked); sessionStorage.setItem(CACHE_KEY, e.target.checked ? "1" : "0"); }} /></label>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(async () => { await api.demo.fastForward({ rate, cached }); await refresh(); setNote("这一周已经翻过去了"); })}>快进一周</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(async () => { await api.demo.reset(); await refresh(); router.push("/"); setNote("已重置"); })}>重置</button>
            {note ? <p className="faint" style={{ margin: 0 }}>{note}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
