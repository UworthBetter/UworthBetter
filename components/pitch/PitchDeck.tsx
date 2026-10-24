"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Stage } from "@/components/pitch/Stage";
import { formatHash, keyToCommand, navReducer, parseHash, shouldForwardKey, type NavAction, type Pos } from "@/components/pitch/model/nav";
import { LiveDemo } from "@/components/pitch/scenes/Live";
import { PITCH_CHANNEL, type PitchMessage } from "@/components/pitch/SpeakerNotes";
import type { PitchData } from "@/components/pitch/model/types";
import { BEATS, SCENES } from "@/components/pitch/scenes";

const reducer = (pos: Pos, a: NavAction) => navReducer(BEATS, pos, a);

const noop = () => () => {};

/** 舞台尺寸、位置都取决于浏览器（视口、hash），只在客户端渲染 */
export function PitchDeck({ data }: { data: PitchData }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? <Deck data={data} /> : null;
}

function Deck({ data }: { data: PitchData }) {
  // 刷新后从 hash 恢复位置
  const [pos, dispatch] = useReducer(reducer, undefined, () => parseHash(window.location.hash, BEATS));
  const [black, setBlack] = useState(false);
  const [video, setVideo] = useState(false);
  const isLive = SCENES[pos.scene].id === "live";
  // 现场演示 iframe 首次进入后常驻，离开再回来 App 状态还在
  const [liveVisited, setLiveVisited] = useState(isLive);
  if (isLive && !liveVisited) setLiveVisited(true);

  // 与演讲者备注窗口同步（按 S 打开）
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    const ch = new BroadcastChannel(PITCH_CHANNEL);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<PitchMessage>) => { if (e.data.type === "nav") dispatch(e.data.action); };
    return () => ch.close();
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", formatHash(pos));
    channel.current?.postMessage({ type: "pos", pos } satisfies PitchMessage);
  }, [pos]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const cmd = keyToCommand(e.key);
    if (!cmd) return;
    e.preventDefault();
    if (cmd === "next" || cmd === "prev" || cmd === "home" || cmd === "end") dispatch({ type: cmd });
    else if (cmd === "black") setBlack((b) => !b);
    else if (cmd === "video") setVideo((v) => !v);
    else if (cmd === "notes") window.open("/pitch/notes", "uwb-notes", "width=900,height=640");
    else if (cmd === "fullscreen") {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // 焦点在 iframe 里时，翻页键由 iframe 窗口转发过来；App 输入框里打字不转发。
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
          <Scene data={data} beat={pos.beat} active />
        </motion.section>
      </AnimatePresence>
      {liveVisited ? <LiveDemo beat={isLive ? pos.beat : 0} visible={isLive} video={video && isLive} onFrame={onFrame} /> : null}
      <ProgressBar pos={pos} onGoto={(p) => dispatch({ type: "goto", pos: p })} />
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
