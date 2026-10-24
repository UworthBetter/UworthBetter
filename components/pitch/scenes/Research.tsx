"use client";

import type { ReactNode } from "react";
import type { SceneProps } from "@/components/pitch/scenes";
import { Puzzle } from "@/components/pitch/ui/Puzzle";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 3–6：研究推理链。每段 = 一个问题 → 研究发现 → 产品落点（点亮一块拼图）。

type Research = { index: number; question: string; findings: ReactNode[]; landing: ReactNode; source: string };

function ResearchScene({ r, beat }: { r: Research; beat: number }) {
  const landed = beat >= 2;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 140px", gap: 120 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 44 }}>
        <Reveal show className="pitch-kicker">0{r.index + 1} · {r.question}</Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {r.findings.map((f, i) => (
            <Reveal key={i} show={beat >= 1} delay={i * 0.35} className="pitch-body" style={{ color: "var(--p-text)", fontSize: 40 }}>
              {f}
            </Reveal>
          ))}
        </div>
        <Reveal show={landed} className="pitch-claim-sm pitch-gold">→ {r.landing}</Reveal>
        <Reveal show={beat >= 1} delay={0.6} className="pitch-foot">{r.source}</Reveal>
      </div>
      <Puzzle lit={r.index + (landed ? 1 : 0)} focus={r.index} size={460} />
    </div>
  );
}

const big = (n: string) => <span className="pitch-gold" style={{ fontSize: 56, fontWeight: 700 }}>{n}</span>;

const RESEARCH: Research[] = [
  {
    index: 0,
    question: "为什么目标会被放下？",
    findings: [
      <>想到「未来的自己」时，大脑的反应<br />更像在想 {big("一个陌生人")}。</>,
      <>我们不愿为陌生人吃苦。</>,
    ],
    landing: "要让未来的你被看见",
    source: "Ersner-Hershfield et al., 2009 · 未来自我连续性（fMRI）",
  },
  {
    index: 1,
    question: "怎么把未来拉近？",
    findings: [
      <>看过自己「变老后」照片的人，<br />把 {big("更多薪水")} 存进了退休账户。</>,
      <>给 20 年后的自己写一封信，<br />接下来几天 {big("运动更多")}。</>,
    ],
    landing: "未来画像 + 来自未来的信",
    source: "Hershfield et al., 2011 · Rutchick et al., 2018",
  },
  {
    index: 2,
    question: "怎么坚持下去？",
    findings: [
      <>为一只虚拟小鸟照顾自己：<br />Finch 次日留存 {big("近 60%")}。</>,
      <>Zombies, Run!：跑步里程 {big("解锁剧情")}。</>,
    ],
    landing: "借来的动机：为了看下一章",
    source: "Finch 公开数据 · Zombies, Run!",
  },
  {
    index: 3,
    question: "计划变了怎么办？",
    findings: [
      <>叙事疗法：把问题 {big("外化")}——<br />「拖延在影响我」，而不是「我是拖延的人」。</>,
      <>人生故事可以被 {big("重写")}。</>,
    ],
    landing: "偏离也是剧情，故事一直在被重写",
    source: "White & Epston, 1990 · 叙事疗法",
  },
];

export const Scene03Stranger = ({ beat }: SceneProps) => <ResearchScene r={RESEARCH[0]} beat={beat} />;
export const Scene04See = ({ beat }: SceneProps) => <ResearchScene r={RESEARCH[1]} beat={beat} />;
export const Scene05Borrowed = ({ beat }: SceneProps) => <ResearchScene r={RESEARCH[2]} beat={beat} />;
export const Scene06Rewrite = ({ beat }: SceneProps) => <ResearchScene r={RESEARCH[3]} beat={beat} />;
