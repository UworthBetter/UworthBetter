"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { Stage } from "@/components/pitch/Stage";
import { formatHash, keyToCommand, navReducer, parseHash, type NavAction, type Pos } from "@/components/pitch/model/nav";
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

  useEffect(() => {
    window.history.replaceState(null, "", formatHash(pos));
  }, [pos]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const cmd = keyToCommand(e.key);
    if (!cmd) return;
    e.preventDefault();
    if (cmd === "next" || cmd === "prev" || cmd === "home" || cmd === "end") dispatch({ type: cmd });
    else if (cmd === "black") setBlack((b) => !b);
    else if (cmd === "fullscreen") {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

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
