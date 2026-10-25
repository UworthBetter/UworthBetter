"use client";

import { motion } from "framer-motion";
import { useCachedSrc } from "@/components/pitch/ImageCache";
import type { SceneProps } from "@/components/pitch/scenes";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 0–2：开场。不以「失败」开场——目标是静态的，人是动态的。

// 封面图自带标题「UworthBetter 你值得更好」（右上），标语放在右下水面留白处
export const COVER_URL = "/pitch/project-cover-reflection-titled.jpg";

export function Scene00Title() {
  const src = useCachedSrc(COVER_URL);
  return (
    <div className="pitch-cover">
      <motion.img
        src={src ?? COVER_URL}
        alt="UworthBetter 封面：码头上的她，与水中倒影里未来的她"
        draggable={false}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: "easeOut" }}
      />
      <div className="pitch-cover-shade" />
      <div className="pitch-cover-copy">
        <Reveal show delay={1.2} className="pitch-cover-claim">把你的 90 天，<br />写成一部你会追更的连载</Reveal>
        <Reveal show delay={1.8} className="pitch-cover-foot">◆ 未来自我叙事规划师</Reveal>
      </div>
    </div>
  );
}

export function Scene01Question({ beat }: SceneProps) {
  return (
    <div className="pitch-center" style={{ gap: 24 }}>
      <Reveal show className="pitch-claim">你在第 1 天写下的目标，</Reveal>
      <Reveal show={beat >= 1} className="pitch-claim">到第 90 天，<span className="pitch-gold">还是你想要的吗？</span></Reveal>
    </div>
  );
}

// TODO(团队)：换成团队成员的真实原话
const PEOPLE = [
  { tag: "忘了", quote: "不是不想坚持，是那周加班到凌晨，回过神来已经断了五天。" },
  { tag: "懒了", quote: "就是不想动。打开 App 看到一串红叉，干脆就卸载了。" },
  { tag: "超额完成", quote: "计划说每周画 3 张，我画了 7 张——可 App 只给我打了个勾。" },
];

export function Scene02Three({ beat }: SceneProps) {
  return (
    <div className="pitch-center" style={{ gap: 64 }}>
      <div style={{ display: "flex", gap: 48 }}>
        {PEOPLE.map((p, i) => (
          <Reveal key={p.tag} show={beat >= i} className="pitch-card" style={{ width: 460, textAlign: "left" }}>
            <div className="pitch-claim-sm pitch-gold" style={{ marginBottom: 24 }}>{p.tag}</div>
            <div className="pitch-body" style={{ color: "var(--p-text)" }}>「{p.quote}」</div>
          </Reveal>
        ))}
      </div>
      <Reveal show={beat >= 3} className="pitch-claim-sm">三种人，都是真实的人生。<br /><span className="pitch-gold">打卡 App 只认识其中一种。</span></Reveal>
      <Reveal show={beat >= 3} delay={0.4} className="pitch-foot" style={{ position: "absolute", right: 64, bottom: 48 }}>
        常被引用的统计：92% 的新年计划未能坚持
      </Reveal>
    </div>
  );
}
