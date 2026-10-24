"use client";

import type { SceneProps } from "@/components/pitch/scenes";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 0–2：开场。不以「失败」开场——目标是静态的，人是动态的。

export function Scene00Title() {
  return (
    <div className="pitch-center">
      <Reveal show className="pitch-kicker">◆ UWORTHBETTER</Reveal>
      <Reveal show delay={0.3} className="pitch-claim">把你的 90 天，<br />写成一部你会追更的连载</Reveal>
      <Reveal show delay={0.8} className="pitch-foot">未来自我叙事规划师</Reveal>
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
