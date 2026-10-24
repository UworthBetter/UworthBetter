"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { useCachedSrc } from "@/components/pitch/ImageCache";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 10：现场演示。iframe 嵌入真实 App（同源，部署到哪个域名都适用）。
// 演示流程定稿后，只需调整下面两个常量。

export const DEMO_START_CHAPTER = 4;
// 备用视频（D 轨道录制）；页面加载时预取到内存，现场断网也能播
export const BACKUP_VIDEO_URL = "/pitch/backup-demo.mp4";
const CAPTIONS = [
  { head: `她的第 ${DEMO_START_CHAPTER} 周`, sub: "这是真实运行的 App，不是录屏。" },
  { head: "勾选最后的任务", sub: "每完成一个任务，下一章封面的迷雾就散去一点。" },
  { head: "迷雾散开", sub: "完成度越高，越早看清下一章。" },
  { head: "回答一个采访问题", sub: "可以请评委替她回答。" },
  { head: "故事流式写出，插画逐格出现", sub: "每一章都由她这一周的真实记录写成。" },
];

const PHONE_W = 430;
const PHONE_H = 932;
const BEZEL = 14;

/** 挂在 Deck 上、首次进入后常驻（离开再回来状态还在）；visible=false 时隐藏 */
export function LiveDemo({ beat, visible, video, onFrame }: {
  beat: number; visible: boolean; video: boolean; onFrame: (win: Window | null) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [resetNote, setResetNote] = useState("");
  const [videoMissing, setVideoMissing] = useState(false);
  const videoSrc = useCachedSrc(BACKUP_VIDEO_URL);

  async function reset() {
    setResetNote("重置中…");
    try {
      await api.demo.seed();
      await api.demo.fastForward({ chapter: DEMO_START_CHAPTER });
      frame.current?.contentWindow?.location.replace("/season?embed=1");
      setResetNote("");
    } catch (e) {
      setResetNote(`重置失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const caption = CAPTIONS[Math.min(beat, CAPTIONS.length - 1)];
  return (
    <div style={{ position: "absolute", inset: 0, display: visible ? "flex" : "none", alignItems: "center", padding: "0 160px", gap: 140, zIndex: 5 }}>
      <div style={{ position: "relative", flex: "none", width: PHONE_W + BEZEL * 2, height: PHONE_H + BEZEL * 2, padding: BEZEL, borderRadius: 64,
        background: "linear-gradient(165deg, #2a2722, #1a1814)", boxShadow: "0 50px 110px -30px rgba(28,26,22,.6), inset 0 0 0 1px rgba(255,255,255,.06)" }}>
        <iframe
          ref={frame}
          src="/season?embed=1"
          title="UworthBetter 现场演示"
          onLoad={() => onFrame(frame.current?.contentWindow ?? null)}
          style={{ width: PHONE_W, height: PHONE_H, border: 0, borderRadius: 50, background: "#f3eee2", display: video ? "none" : "block" }}
        />
        {video ? (
          videoMissing ? (
            <div className="pitch-ph" style={{ width: PHONE_W, height: PHONE_H, borderRadius: 50, fontSize: 22, padding: 40, textAlign: "center" }}>
              备用视频加载失败：未放置 public/pitch/backup-demo.mp4，或页面加载时网络不可用
            </div>
          ) : (
            <video src={videoSrc ?? BACKUP_VIDEO_URL} controls autoPlay onError={() => setVideoMissing(true)}
              style={{ width: PHONE_W, height: PHONE_H, borderRadius: 50, background: "#000", objectFit: "cover" }} />
          )
        ) : null}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 36 }}>
        <div className="pitch-kicker">现场演示 · {beat + 1} / {CAPTIONS.length}{video ? " · 备用视频" : ""}</div>
        <Reveal key={beat} show className="pitch-claim-sm">{caption.head}</Reveal>
        <Reveal key={`s${beat}`} show delay={0.2} className="pitch-body">{caption.sub}</Reveal>
      </div>
      {/* 演讲者专用：悬停左下角才显示 */}
      <div className="pitch-reset">
        <button type="button" onClick={reset}>重置演示（第 {DEMO_START_CHAPTER} 周）</button>
        {resetNote ? <span>{resetNote}</span> : null}
      </div>
    </div>
  );
}
