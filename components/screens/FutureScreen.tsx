"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ApiClientError, api, streamChat } from "@/lib/client/api";
import type { FutureSelfView } from "@/lib/contracts";
import { Button } from "@/components/ui/Button";

type Msg = { role: "user" | "assistant"; content: string };

export function FutureScreen() {
  const [self, setSelf] = useState<FutureSelfView | null>(null);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.futureSelf().then(setSelf).catch((e) => setError(e instanceof ApiClientError ? e.message : "未来的你还没到"));
  }, []);

  async function send() {
    const content = draft.trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user" as const, content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      await streamChat(history, (text) => {
        setMessages((list) => {
          const next = [...list];
          const last = next[next.length - 1];
          if (!last || last.role !== "assistant") return list;
          next[next.length - 1] = { role: "assistant", content: last.content + text };
          return next;
        });
      });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "这句话没有送到");
    } finally {
      setBusy(false);
    }
  }

  if (error && !self) {
    return (
      <div className="screen-pad stack">
        <p>{error}</p>
        <Button href="/">回到封面</Button>
      </div>
    );
  }
  if (!self) return <div className="quiet-loading">灯塔那边还没回信…</div>;

  const profile = self.profile;
  return (
    <div className="screen-pad">
      <div className="chat-row">
        {self.sheetFutureUrl ? <Image className="chat-ava" src={self.sheetFutureUrl} alt="" width={30} height={30} /> : <div className="chat-ava" />}
        <div>
          <div className="display" style={{ fontSize: 22 }}>{profile.name}</div>
          <div className="faint">{profile.title}</div>
        </div>
      </div>
      <div className="chat-row">
        {self.sheetFutureUrl ? <Image className="chat-ava" src={self.sheetFutureUrl} alt="" width={30} height={30} /> : <div className="chat-ava" />}
        <div className="chat-bubble">{profile.catchphrase}</div>
      </div>
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`chat-row${message.role === "user" ? " me" : ""}`}>
          {message.role === "assistant" ? (self.sheetFutureUrl ? <Image className="chat-ava" src={self.sheetFutureUrl} alt="" width={30} height={30} /> : <div className="chat-ava" />) : null}
          <div className="chat-bubble">{message.content || "…"}</div>
        </div>
      ))}
      {error ? <p className="field-error">{error}</p> : null}
      <textarea className="input" rows={3} maxLength={1000} value={draft} placeholder="跟未来的你说一句" onChange={(e) => setDraft(e.target.value)} />
      <Button className="btn-block" style={{ marginTop: 8 }} disabled={busy || draft.trim().length === 0} onClick={() => void send()}>
        {busy ? "正在写回信…" : "发送"}
      </Button>
    </div>
  );
}

