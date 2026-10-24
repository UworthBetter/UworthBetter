/* eslint-disable @next/next/no-img-element -- 路演页用本地静态图 */
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useCachedSrc } from "@/components/pitch/ImageCache";
import type { SceneProps } from "@/components/pitch/scenes";
import { Portrait } from "@/components/pitch/ui/Portrait";
import { Reveal } from "@/components/pitch/ui/Reveal";

// 场景 12–17：差异化、技术、严谨、商业化、Roadmap、收尾

// TODO(团队核实)：对外的事实陈述，依据 DESIGN.md §2 竞品表填写
const COLUMNS = ["个性化视觉叙事", "真实行动驱动", "未来自我", "随人拟合"];
const ROWS: { name: string; marks: boolean[] }[] = [
  { name: "MyFutureSelf", marks: [false, false, true, false] },
  { name: "MIT Future You", marks: [false, false, true, false] },
  { name: "Finch", marks: [false, true, false, false] },
  { name: "Habitica", marks: [false, true, false, false] },
  { name: "Zombies, Run!", marks: [false, true, false, false] },
  { name: "UworthBetter", marks: [true, true, true, true] },
];

export function Scene12Compare({ beat }: SceneProps) {
  return (
    <div className="pitch-center" style={{ gap: 56 }}>
      <motion.div
        initial={false}
        animate={{ scale: beat >= 2 ? 0.72 : 1, y: beat >= 2 ? -60 : 0 }}
        transition={{ duration: 0.8 }}
        style={{ display: "grid", gridTemplateColumns: `340px repeat(${COLUMNS.length}, 260px)`, rowGap: 14, alignItems: "center" }}
      >
        <div />
        {COLUMNS.map((c, ci) => (
          <Reveal key={c} show delay={ci * 0.1} className="pitch-body" style={{ fontSize: 30, textAlign: "center", color: ci === 3 ? "#e3b866" : undefined }}>{c}</Reveal>
        ))}
        {ROWS.map((r, ri) => {
          const us = ri === ROWS.length - 1;
          return [
            <div key={r.name} style={{ fontSize: 36, fontWeight: us ? 700 : 400, color: us ? "#e3b866" : "var(--p-dim)", textAlign: "left" }}>{r.name}</div>,
            ...r.marks.map((m, ci) => (
              <Reveal key={`${r.name}${ci}`} show={beat >= 1} delay={ci * 0.25 + (us ? 0.3 : 0)} style={{ textAlign: "center", fontSize: 44 }}>
                <span style={{ color: m ? (us ? "#e3b866" : "var(--p-text)") : "rgba(244,236,220,.18)",
                  textShadow: m && us ? "0 0 18px rgba(227,184,102,.8)" : "none" }}>{m ? "●" : "○"}</span>
              </Reveal>
            )),
          ];
        })}
      </motion.div>
      <Reveal show={beat >= 2} className="pitch-claim-sm" style={{ position: "absolute", bottom: 110, left: 0, right: 0 }}>
        别的产品让你追赶一个固定的目标，<br /><span className="pitch-gold">我们让未来的你跟着你一起长大。</span>
      </Reveal>
    </div>
  );
}

const PIPELINE = [
  { t: "用户输入", d: "目标 · 照片 · 每日一句" },
  { t: "文本模型", d: "人格卡 · Story Bible · 章节计划" },
  { t: "图像模型", d: "设定图 · 4 格分镜 · 角色锚点" },
  { t: "流式输出", d: "正文逐字 · 插画逐格" },
];
const MEMORY = ["Story Bible：世界观、人物、反派", "每章摘要：跨章节记忆", "伏笔表：埋下 → 回收"];

export function Scene13Tech({ beat }: SceneProps) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px", gap: 72 }}>
      <Reveal show className="pitch-kicker">技术实现</Reveal>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {PIPELINE.map((p, i) => (
          <div key={p.t} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Reveal show delay={i * 0.2} className="pitch-card" style={{ width: 340, padding: 32 }}>
              <div style={{ fontSize: 40, fontWeight: 700 }}>{p.t}</div>
              <div className="pitch-foot" style={{ marginTop: 10 }}>{p.d}</div>
            </Reveal>
            {i < PIPELINE.length - 1 ? <Reveal show delay={i * 0.2 + 0.1} style={{ fontSize: 44, color: "#e3b866" }}>→</Reveal> : null}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 40 }}>
        <Reveal show={beat >= 1} className="pitch-card" style={{ flex: 1 }}>
          <div className="pitch-gold" style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>跨章节记忆</div>
          {MEMORY.map((m) => <div key={m} className="pitch-body" style={{ fontSize: 30 }}>· {m}</div>)}
        </Reveal>
        <Reveal show={beat >= 2} className="pitch-card" style={{ flex: 1, borderColor: "#e3b866" }}>
          <div className="pitch-gold" style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>画像拟合环</div>
          <div className="pitch-body" style={{ fontSize: 30 }}>每章结束：真实记录 + 采访 → 拟合人格卡<br />幕终重绘画像 · 外貌锚点保证还是「她」<br />只拟合，不评判</div>
        </Reveal>
      </div>
    </div>
  );
}

export function Scene14Rigor() {
  return (
    <div className="pitch-center" style={{ gap: 48 }}>
      <Reveal show className="pitch-claim">我们<span className="pitch-gold">不宣称疗效</span>。</Reveal>
      <Reveal show delay={0.3} className="pitch-body" style={{ maxWidth: 1300 }}>
        未来自我干预多为短期实验，部分研究缺少功效分析（Grekin, 2025）。<br />
        UworthBetter 是一个<span style={{ color: "var(--p-text)" }}>动机与自我反思工具</span>。
      </Reveal>
      <Reveal show delay={0.6} className="pitch-card pitch-body" style={{ fontSize: 30 }}>
        安全护栏：危机关键词检测 → 暂停叙事，给出求助热线
      </Reveal>
    </div>
  );
}

const PLANS = [
  { name: "免费", price: "¥0", items: ["1 季", "1 种文风", "每章 2 格分镜"] },
  { name: "会员", price: "¥18/月", items: ["全部文风", "4 格 + 高清", "和未来的你对话"], hot: true },
  { name: "实体书", price: "¥99", items: ["季终合集印成漫画书", "适合送礼"] },
  { name: "B 端", price: "合作", items: ["学校：学期 = 一季", "企业：新员工 90 天", "健身房 / 教培联名"] },
];

export function Scene15Business() {
  return (
    <div className="pitch-center" style={{ gap: 64 }}>
      <Reveal show className="pitch-claim-sm">商业化</Reveal>
      <div style={{ display: "flex", gap: 32 }}>
        {PLANS.map((p, i) => (
          <Reveal key={p.name} show delay={i * 0.15} className="pitch-card"
            style={{ width: 360, textAlign: "left", borderColor: p.hot ? "#a8822f" : undefined, borderWidth: p.hot ? 3 : 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{p.name}</div>
            <div className="pitch-gold" style={{ fontSize: 52, fontWeight: 700, margin: "12px 0 20px" }}>{p.price}</div>
            {p.items.map((t) => <div key={t} className="pitch-body" style={{ fontSize: 28, lineHeight: 1.7 }}>· {t}</div>)}
          </Reveal>
        ))}
      </div>
    </div>
  );
}

const ROADMAP = [
  { t: "好友客串", d: "朋友出现在你的故事里" },
  { t: "季终合集", d: "13 章合成一本可分享的漫画书" },
  { t: "更多文风", d: "武侠 · 赛博 · 轻小说 · 太空歌剧" },
];

export function Scene16Roadmap() {
  return (
    <div className="pitch-center" style={{ gap: 64 }}>
      <Reveal show className="pitch-claim-sm">下一季</Reveal>
      <div style={{ display: "flex", gap: 48 }}>
        {ROADMAP.map((r, i) => (
          <Reveal key={r.t} show delay={i * 0.2} className="pitch-card" style={{ width: 460 }}>
            <div className="pitch-gold" style={{ fontSize: 44, fontWeight: 700 }}>{r.t}</div>
            <div className="pitch-body" style={{ marginTop: 16, fontSize: 30 }}>{r.d}</div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export const QR_URL = "/pitch/qr.svg"; // 网址定下来后离线生成放到这里；不存在时只显示网址文本

export function Scene17End({ data, beat }: SceneProps) {
  const [qr, setQr] = useState(true);
  const qrSrc = useCachedSrc(QR_URL);
  return (
    <div className="pitch-center" style={{ gap: 48 }}>
      <motion.div initial={false} animate={{ y: beat >= 1 ? -30 : 0 }} style={{ display: "flex", gap: 48, alignItems: "center" }}>
        <Portrait src={data.sheets.present} alt="现在的林夏" size={300} style={{ border: "3px solid rgba(28,26,22,.2)" }} />
        <div style={{ fontSize: 56, color: "var(--p-gold)" }}>→</div>
        <Portrait src={data.snapshots[13].imageUrl ?? data.sheets.future} alt="90 天后的她" size={300} style={{ border: "4px solid #a8822f" }} />
      </motion.div>
      <Reveal show className="pitch-claim-sm">看着自己，变成未来的你。</Reveal>
      <Reveal show style={{ display: "flex", gap: 40 }}>
        {data.team.map((m, i) => (
          <div key={i} className="pitch-body" style={{ fontSize: 28 }}>
            <span style={{ color: "var(--p-text)" }}>{m.name}</span>{m.role ? ` · ${m.role}` : null}
          </div>
        ))}
      </Reveal>
      <Reveal show={beat >= 1} style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div className="pitch-claim">谢谢</div>
        {qr ? <img src={qrSrc ?? QR_URL} alt="网址二维码" width={160} height={160} onError={() => setQr(false)} /> : null}
        <div className="pitch-body">{data.siteUrl}</div>
      </Reveal>
    </div>
  );
}
