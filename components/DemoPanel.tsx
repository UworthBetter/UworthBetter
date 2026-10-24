"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { useMe } from "@/hooks/useMe";
import { useSeason } from "@/hooks/useSeason";

const CACHE_KEY = "uwb-demo-cached";

/** 跳章目标周：第 2..13 周（第 1 周是开局默认周） */
const CHAPTERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function DemoPanel() {
  const { me } = useMe();
  const { refresh } = useSeason();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(0.6);
  // 演示稳定优先：默认打开缓存回放；用户显式关闭过则记住该选择（SSR 阶段无 sessionStorage，按默认 true）
  const [cached, setCached] = useState(() => (typeof window === "undefined" ? true : sessionStorage.getItem(CACHE_KEY) !== "0"));
  const [chapter, setChapter] = useState(2);
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
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run(async () => { await api.demo.seed(); await refresh(); router.push("/reveal"); setNote("已载入林夏的故事"); })}>载入演示账号</button>
            <label>快进完成度 <input type="range" min={0} max={100} value={Math.round(rate * 100)} onChange={(e) => setRate(Number(e.target.value) / 100)} /></label>
            <label>
              跳过生成等待（回放预生成章节）
              <input type="checkbox" checked={cached} onChange={(e) => { setCached(e.target.checked); sessionStorage.setItem(CACHE_KEY, e.target.checked ? "1" : "0"); }} />
            </label>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(async () => {
              await api.demo.fastForward({ rate, cached });
              await refresh();
              if (cached) router.push("/season"); // 缓存回放时直接去季视图，那里有「章节生成中」入口
              setNote("这一周已经翻过去了");
            })}>快进本周</button>
            <p className="faint" style={{ margin: 0 }}>快进本周会自动勾任务、补记录。</p>
            <label>
              跳到第
              <select value={chapter} style={{ fontSize: 12 }} onChange={(e) => setChapter(Number(e.target.value))}>
                {CHAPTERS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              周
            </label>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run(async () => {
              await api.demo.fastForward({ chapter }); // 预生成数据未就绪时后端返回 400，错误文案落在下方提示区
              await refresh();
              router.push("/season");
              setNote(`已跳到第 ${chapter} 周`);
            })}>跳到第 {chapter} 周</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(async () => { await api.demo.reset(); await refresh(); router.push("/"); setNote("已重置"); })}>重置</button>
            {note ? <p className="faint" style={{ margin: 0 }}>{note}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
