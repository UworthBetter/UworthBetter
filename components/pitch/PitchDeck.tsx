"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Stage } from "@/components/pitch/Stage";
import { applyDigit, formatHash, keyToCommand, navReducer, parseHash, shouldForwardKey, shouldSnap, type NavAction, type Pos } from "@/components/pitch/model/nav";
import { END_COVER_URL, QR_URL } from "@/components/pitch/scenes/Closing";
import { COVER_URL } from "@/components/pitch/scenes/Opening";
import { BACKUP_VIDEO_URL, LiveDemo } from "@/components/pitch/scenes/Live";
import { PITCH_CHANNEL, type PitchMessage } from "@/components/pitch/SpeakerNotes";
import { ImageCacheProvider } from "@/components/pitch/ImageCache";
import { imageUrlsOf } from "@/components/pitch/model/preload";
import type { PitchData } from "@/components/pitch/model/types";
import { BEATS, SCENES } from "@/components/pitch/scenes";

const reducer = (pos: Pos, a: NavAction) => navReducer(BEATS, pos, a);

const noop = () => () => {};

// 换拍后动画稳定所需时间：在此之前再次换拍，直接渲染新拍终态（不叠加、不残留延迟动画）
const SETTLE_MS: Record<string, number> = { evolution: 3600, converge: 1500, stranger: 1200, see: 1200, borrowed: 1200, rewrite: 1200 };
const DEFAULT_SETTLE_MS = 1000;
const DIGIT_TIMEOUT_MS = 1500;

/** 舞台尺寸、位置都取决于浏览器（视口、hash），只在客户端渲染 */
export function PitchDeck({ data }: { data: PitchData }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  // 加载时预取全部图片与备用视频到内存，现场断网时其余场景与备用视频仍可用
  const urls = useMemo(() => [...imageUrlsOf(data), COVER_URL, END_COVER_URL, QR_URL, BACKUP_VIDEO_URL], [data]);
  return mounted ? <ImageCacheProvider urls={urls}><Deck data={data} /></ImageCacheProvider> : null;
}

function Deck({ data }: { data: PitchData }) {
  // 刷新后从 hash 恢复位置
  const [pos, dispatch] = useReducer(reducer, undefined, () => parseHash(window.location.hash, BEATS));
  const [black, setBlack] = useState(false);
  const [video, setVideo] = useState(false);
  const [snap, setSnap] = useState(0);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const lastChangeAt = useRef<number | null>(null);
  const digits = useRef({ buffer: "", timer: 0 });

  const navigate = useCallback((a: NavAction) => {
    const now = performance.now();
    const id = SCENES[posRef.current.scene].id;
    if (shouldSnap(lastChangeAt.current, now, SETTLE_MS[id] ?? DEFAULT_SETTLE_MS)) setSnap((n) => n + 1);
    lastChangeAt.current = now;
    dispatch(a);
  }, []);
  const isLive = SCENES[pos.scene].id === "live";
  // 现场演示 iframe 首次进入后常驻，离开再回来 App 状态还在
  const [liveVisited, setLiveVisited] = useState(isLive);
  if (isLive && !liveVisited) setLiveVisited(true);

  // 与演讲者备注窗口同步（按 S 打开）
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    const ch = new BroadcastChannel(PITCH_CHANNEL);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<PitchMessage>) => { if (e.data.type === "nav") navigate(e.data.action); };
    return () => ch.close();
  }, [navigate]);

  useEffect(() => {
    window.history.replaceState(null, "", formatHash(pos));
    channel.current?.postMessage({ type: "pos", pos } satisfies PitchMessage);
  }, [pos]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const cmd = keyToCommand(e.key);
    if (!cmd) return;
    e.preventDefault();
    // 数字 + 回车跳到指定场景；没有数字缓冲时回车仍是下一步
    const d = applyDigit(digits.current.buffer, e.key);
    window.clearTimeout(digits.current.timer);
    digits.current.buffer = d.buffer;
    if (d.buffer) digits.current.timer = window.setTimeout(() => { digits.current.buffer = ""; }, DIGIT_TIMEOUT_MS);
    if (d.goto !== null) return navigate({ type: "goto", pos: { scene: d.goto, beat: 0 } });
    if (cmd === "digit") return;
    if (cmd === "next" || cmd === "prev" || cmd === "home" || cmd === "end") navigate({ type: cmd });
    else if (cmd === "black") setBlack((b) => !b);
    else if (cmd === "video") setVideo((v) => !v);
    else if (cmd === "notes") window.open("/pitch/notes", "uwb-notes", "width=900,height=640");
    else if (cmd === "fullscreen") {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // 焦点在 iframe 里时，路演命令由 iframe 窗口转发过来；App 输入框里打字不转发。
  // iframe 每次整页加载都会换掉内部 window 的监听，所以每次 onLoad 都重新挂。
  const detachFrame = useRef<(() => void) | null>(null);
  const onFrame = useCallback((win: Window | null) => {
    detachFrame.current?.();
    detachFrame.current = null;
    if (!win) return;
    const forward = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const target = t && "tagName" in t ? { tagName: t.tagName, isContentEditable: t.isContentEditable } : null;
      if (shouldForwardKey(e.key, target)) onKey(e);
    };
    win.addEventListener("keydown", forward);
    detachFrame.current = () => win.removeEventListener("keydown", forward);
  }, [onKey]);
  useEffect(() => () => detachFrame.current?.(), []);

  const scene = SCENES[pos.scene];
  const Scene = scene.Component;

  return (
    <Stage black={black} dark={scene.dark}>
      <AnimatePresence mode="sync">
        <motion.section
          key={scene.id}
          className="pitch-scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* snap 变化 → 重挂场景，所有元素以 initial={false} 直接呈现当前拍终态 */}
          <div key={snap} className="pitch-scene">
            <Scene data={data} beat={pos.beat} active />
          </div>
        </motion.section>
      </AnimatePresence>
      {liveVisited ? <LiveDemo beat={isLive ? pos.beat : 0} visible={isLive} video={video && isLive} onFrame={onFrame} /> : null}
      <ProgressBar pos={pos} onGoto={(p) => navigate({ type: "goto", pos: p })} />
    </Stage>
  );
}

/** 底部细进度条；悬停展开场景目录（演讲者自用） */
function ProgressBar({ pos, onGoto }: { pos: Pos; onGoto: (p: Pos) => void }) {
  const total = BEATS.reduce((a, b) => a + b, 0);
  const done = BEATS.slice(0, pos.scene).reduce((a, b) => a + b, 0) + pos.beat + 1;
  return (
    <div className="pitch-progress group">
      <div className="pitch-progress-toc">
        {SCENES.map((s, i) => (
          <button key={s.id} type="button" data-on={i === pos.scene ? "1" : "0"} onClick={() => onGoto({ scene: i, beat: 0 })}>
            {i}. {s.title}
          </button>
        ))}
      </div>
      <div className="pitch-progress-bar" style={{ width: `${(done / total) * 100}%` }} />
    </div>
  );
}
