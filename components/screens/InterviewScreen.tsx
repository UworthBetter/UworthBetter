"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ApiClientError, api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";

function chapterNo(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 13 ? n : null;
}

export function InterviewScreen() {
  const params = useParams<{ n: string }>();
  const no = chapterNo(params.n);
  const router = useRouter();
  const [name, setName] = useState("未来的你");
  const [sheet, setSheet] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [shown, setShown] = useState("");
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [phase, setPhase] = useState<"load" | "ask" | "review" | "send" | "error">("load");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!no) return;
    let stop = false;
    Promise.all([api.interviewQuestions(no), api.futureSelf().catch(() => null)])
      .then(([qs, self]) => {
        if (stop) return;
        setQuestions(qs.questions);
        if (self) {
          setName(self.profile.name);
          setSheet(self.sheetFutureUrl);
        }
        setPhase("ask");
      })
      .catch((e) => {
        if (stop) return;
        setError(e instanceof ApiClientError ? e.message : "采访没有开始");
        setPhase("error");
      });
    return () => {
      stop = true;
    };
  }, [no]);

  useEffect(() => {
    const full = questions[index];
    if (phase !== "ask" || !full) return;
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) window.clearInterval(t);
    }, 28);
    return () => window.clearInterval(t);
  }, [index, phase, questions]);

  if (!no) {
    return <div className="screen-pad"><p>章节号不对。</p><Button href="/season">回进度</Button></div>;
  }
  if (phase === "load") return <div className="quiet-loading">{name} 正在想这一周…</div>;
  if (phase === "error") {
    return (
      <div className="screen-pad stack">
        <p>{error}</p>
        <Button href="/season">回进度</Button>
      </div>
    );
  }

  function push(answer: string) {
    const next = [...answers, answer];
    setAnswers(next);
    setDraft("");
    setShown("");
    if (next.length < 3) {
      setIndex(next.length);
      return;
    }
    if (next.every((item) => item.trim() === "")) {
      api.listLogs(no!).then((res) => {
        const best = [...res.logs].sort((a, b) => b.note.length - a.note.length)[0];
        setExcerpt(best?.note ?? "");
        setPhase("review");
      }).catch(() => {
        setExcerpt("");
        setPhase("review");
      });
      return;
    }
    setPhase("review");
  }

  async function send() {
    setPhase("send");
    setError("");
    try {
      await api.submitInterview(no!, answers);
      const job = await api.generateChapter(no!);
      router.push(`/chapter/${no}?job=${encodeURIComponent(job.jobId)}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "没有写成章节");
      setPhase("review");
    }
  }

  const skippedAll = answers.length === 3 && answers.every((item) => item.trim() === "");

  return (
    <div className="screen-pad">
      <div className="kicker">第 {no} 章 · 周末采访</div>
      <h1 className="display" style={{ fontSize: 24 }}>{name}</h1>
      {questions.slice(0, answers.length).map((question, i) => (
        <div key={question}>
          <div className="chat-row">
            {sheet ? <Image className="chat-ava" src={sheet} alt="" width={30} height={30} /> : <div className="chat-ava" />}
            <div className="chat-bubble">{question}</div>
          </div>
          <div className="chat-row me">
            <div className="chat-bubble">{answers[i] || "先跳过"}</div>
          </div>
        </div>
      ))}

      {phase === "ask" && questions[index] ? (
        <>
          <div className="chat-row">
            {sheet ? <Image className="chat-ava" src={sheet} alt="" width={30} height={30} /> : <div className="chat-ava" />}
            <div className="chat-bubble">{shown}</div>
          </div>
          <textarea className="input" rows={3} maxLength={300} value={draft} placeholder="你的回答" onChange={(e) => setDraft(e.target.value)} />
          <div className="row" style={{ marginTop: 8 }}>
            <Button variant="ghost" onClick={() => push("")}>跳过</Button>
            <Button className="btn-block" onClick={() => push(draft.trim())}>发送</Button>
          </div>
        </>
      ) : null}

      {phase === "review" || phase === "send" ? (
        <div className="stack" style={{ marginTop: 8 }}>
          {skippedAll ? (
            <div className="card">
              <div className="faint">三题都空着。故事会从这句日记写起</div>
              <p className="serif" style={{ marginBottom: 0 }}>{excerpt || "这周还没有日记。空白也会被写成安静的一章。"}</p>
            </div>
          ) : (
            <p className="muted">回答会写进这一章。准备好了就生成。</p>
          )}
          {error ? <p className="field-error">{error}</p> : null}
          <Button className="btn-block" disabled={phase === "send"} onClick={() => void send()}>
            {phase === "send" ? "正在铺开这一章…" : "写成这一章"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
