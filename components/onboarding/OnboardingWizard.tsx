"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, api } from "@/lib/client/api";
import { compressImage } from "@/lib/client/image";
import type { StyleId, TimeBudget } from "@/lib/contracts";
import { DRAFT_KEY, PERSONAS, loadDraft, saveDraft, toRequest, type Draft } from "@/components/onboarding/draft";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";

const STEPS = ["愿望", "未来的你", "阻碍", "现在", "文风"];
const IDEAS = ["转行", "健身", "备考", "创作", "副业"];
const OBSTACLES = ["拖延", "刷手机", "自我怀疑", "没时间", "怕被评价", "完美主义"];
const BUDGETS: { id: TimeBudget; label: string }[] = [
  { id: "15m", label: "15 分钟" },
  { id: "30m", label: "30 分钟" },
  { id: "1h", label: "1 小时" },
  { id: "2h+", label: "2 小时以上" },
];
const STYLES: { id: StyleId; name: string; line: string; icon: IconName; cls: string }[] = [
  { id: "healing", name: "治愈绘本", line: "雾、灯塔、慢慢亮起来的颜色", icon: "leaf", cls: "style-healing-ic" },
  { id: "wuxia", name: "东方武侠", line: "山门、剑意、一招一式的功课", icon: "brush", cls: "style-wuxia-ic" },
  { id: "cyber", name: "赛博都市", line: "夜雨、霓虹、把生活改写成协议", icon: "city", cls: "style-cyber-ic" },
];

function subscribeDraft(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === DRAFT_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

let draftSnapshot: Draft | null = null;
let draftSnapshotRaw: string | null = null;

function draftFromStorage(): Draft {
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (draftSnapshot && raw === draftSnapshotRaw) return draftSnapshot;
  draftSnapshotRaw = raw;
  draftSnapshot = loadDraft();
  return draftSnapshot;
}

function validate(step: number, draft: Draft): string {
  if (step === 0) {
    const goal = draft.goal.trim();
    if (goal.length < 5) return "再用几句话写清楚，至少 5 个字";
    if (goal.length > 500) return "愿望不超过 500 字";
  }
  if (step === 1) {
    const name = draft.futureName.trim();
    if (name.length < 1 || name.length > 30) return "给未来的自己起一个 1 到 30 字的称呼";
    if (draft.futureDesc.trim().length > 800) return "画像不超过 800 字";
    if (draft.nickname.trim().length > 20) return "昵称不超过 20 字";
  }
  if (step === 2 && draft.obstacles.map((item) => item.trim()).filter(Boolean).length < 1) return "至少留下一个阻碍";
  if (step === 3 && draft.startingPoint.trim().length > 200) return "起点不超过 200 字";
  return "";
}

export function OnboardingWizard() {
  const router = useRouter();
  const stored = useSyncExternalStore(subscribeDraft, draftFromStorage, () => null);
  const [override, setOverride] = useState<Draft | null>(null);
  const draft = override ?? stored;
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [unsure, setUnsure] = useState(false);
  const [custom, setCustom] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selfieRef = useRef<File | null>(null);

  useEffect(() => {
    if (!draft) return;
    saveDraft(draft);
    document.documentElement.dataset.style = draft.style;
  }, [draft]);

  function chooseSelfie(file: File | null) {
    selfieRef.current = file;
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  if (!draft) return <div className="quiet-loading">正在翻开稿纸…</div>;

  function patch(partial: Partial<Draft>) {
    setOverride((cur) => {
      const base = cur ?? stored;
      return base ? { ...base, ...partial } : cur;
    });
    setError("");
  }

  function toggleObstacle(label: string) {
    setOverride((cur) => {
      const base = cur ?? stored;
      if (!base) return cur;
      const has = base.obstacles.includes(label);
      const obstacles = has ? base.obstacles.filter((item) => item !== label) : [...base.obstacles, label].slice(0, 6);
      return { ...base, obstacles };
    });
    setError("");
  }

  function next() {
    const message = validate(step, draft!);
    if (message) {
      setError(message);
      return;
    }
    setStep((n) => Math.min(4, n + 1));
  }

  async function submit() {
    const message = validate(4, draft!);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const photo = selfieRef.current ? await compressImage(selfieRef.current) : null;
      const res = await api.onboarding(toRequest(draft!), photo);
      router.push(`/onboarding/generating?job=${encodeURIComponent(res.jobId)}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "这次没有送出去，可以再试一次");
      setBusy(false);
    }
  }

  return (
    <div className="screen-pad">
      <div className="kicker">建档 · {STEPS[step]}</div>
      <div className="step-dots" aria-hidden>
        {STEPS.map((label, index) => <span key={label} className={index <= step ? "done" : ""} />)}
      </div>

      {step === 0 ? (
        <div className="stack">
          <h1 className="display" style={{ fontSize: 26, margin: 0 }}>你想在 90 天后成为谁？</h1>
          <p className="muted">写得具体一点。故事会从这句话里长出来。</p>
          <textarea className="input" rows={6} maxLength={500} value={draft.goal} onChange={(e) => patch({ goal: e.target.value })} />
          <div className="chip-row">
            {IDEAS.map((idea) => (
              <Chip key={idea} active={draft.goal.includes(idea)} onClick={() => patch({ goal: draft.goal.includes(idea) ? draft.goal : `${draft.goal}${draft.goal ? "，" : ""}${idea}` })}>
                {idea}
              </Chip>
            ))}
          </div>
          <button type="button" className="unsure-entry" onClick={() => setUnsure((v) => !v)}>
            <Icon name="question" size="sm" />我还不太确定
          </button>
          {unsure ? (
            <div className="stack">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.title}
                  type="button"
                  className="persona-card"
                  onClick={() => {
                    patch(persona.draft);
                    setUnsure(false);
                  }}
                >
                  <span className="ic ic-sm persona-ic"><Icon name="sparkle" /></span>
                  <span>
                    <b>{persona.title}</b>
                    <span className="faint" style={{ display: "block" }}>{persona.draft.goal.slice(0, 28)}…</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="stack">
          <h1 className="display" style={{ fontSize: 26, margin: 0 }}>描述那个未来的你</h1>
          <p className="muted">TA 穿什么、住在哪、说话是什么样子。</p>
          <textarea className="input" rows={5} maxLength={800} value={draft.futureDesc} onChange={(e) => patch({ futureDesc: e.target.value })} />
          <label className="faint">怎么称呼 TA</label>
          <input className="input" maxLength={30} value={draft.futureName} onChange={(e) => patch({ futureName: e.target.value })} />
          <label className="faint">你的昵称（可选，信里会用）</label>
          <input className="input" maxLength={20} value={draft.nickname} onChange={(e) => patch({ nickname: e.target.value })} />
          <label className={`upload-box${preview ? " hot" : ""}`}>
            <Icon name="camera" />
            <span>{preview ? "已选一张照片，点此更换" : "上传一张近照"}</span>
            <span className="optional-strong">不上传也能正常生成形象</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => chooseSelfie(e.target.files?.[0] ?? null)}
            />
          </label>
          {preview ? <div className="thumb" role="img" aria-label="自拍预览" style={{ backgroundImage: `url(${preview})`, backgroundSize: "cover" }} /> : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="stack">
          <h1 className="display" style={{ fontSize: 26, margin: 0 }}>是什么一直在阻止你？</h1>
          <p className="muted">这些会变成故事里的反派。选 1 到 6 个。</p>
          <div className="chip-row">
            {OBSTACLES.map((label) => (
              <Chip key={label} active={draft.obstacles.includes(label)} onClick={() => toggleObstacle(label)}>{label}</Chip>
            ))}
            {draft.obstacles.filter((label) => !OBSTACLES.includes(label)).map((label) => (
              <Chip key={label} active onClick={() => toggleObstacle(label)}>{label}</Chip>
            ))}
          </div>
          <div className="row">
            <input
              className="input"
              placeholder="自己写一个"
              maxLength={40}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const text = custom.trim();
                if (!text || draft.obstacles.includes(text) || draft.obstacles.length >= 6) return;
                patch({ obstacles: [...draft.obstacles, text] });
                setCustom("");
              }}
            >
              加上
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="stack">
          <h1 className="display" style={{ fontSize: 26, margin: 0 }}>你现在的情况</h1>
          <p className="muted">每天能拿出来的时间，决定这一季的任务有多重。</p>
          <div className="chip-row">
            {BUDGETS.map((item) => (
              <Chip key={item.id} active={draft.timeBudget === item.id} onClick={() => patch({ timeBudget: item.id })}>{item.label}</Chip>
            ))}
          </div>
          <label className="faint">现在的起点，一句话</label>
          <textarea className="input" rows={3} maxLength={200} value={draft.startingPoint} onChange={(e) => patch({ startingPoint: e.target.value })} />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="stack">
          <h1 className="display" style={{ fontSize: 26, margin: 0 }}>选择故事的文风</h1>
          <p className="muted">点一下，整间编辑室会换成那种光线。</p>
          {STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`style-card${draft.style === item.id ? " active" : ""}`}
              onClick={() => patch({ style: item.id })}
            >
              <span className={`ic ${item.cls}`}><Icon name={item.icon} /></span>
              <span>
                <b>{item.name}</b>
                <span className="faint" style={{ display: "block" }}>{item.line}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="field-error">{error}</p> : null}
      <div className="row" style={{ marginTop: 16 }}>
        {step > 0 ? <Button variant="ghost" onClick={() => { setError(""); setStep((n) => n - 1); }}>上一步</Button> : null}
        {step < 4 ? <Button className="btn-block" onClick={next}>继续</Button> : <Button className="btn-block" disabled={busy} onClick={() => void submit()}>{busy ? "正在送出…" : "开始书写"}</Button>}
      </div>
    </div>
  );
}
