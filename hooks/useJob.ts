"use client";

import { useEffect, useState } from "react";
import { subscribeJob } from "@/lib/client/api";
import type { JobEvent } from "@/lib/contracts";

export type JobSnapshot = {
  steps: Record<string, "running" | "done" | "error">;
  data: Record<string, Record<string, unknown>>;
  texts: { body: string; letter: string };
  done: boolean;
  error: { code: string; message: string } | null;
  redirect: string | null;
};

function empty(): JobSnapshot {
  return { steps: {}, data: {}, texts: { body: "", letter: "" }, done: false, error: null, redirect: null };
}

function reduce(state: JobSnapshot, event: JobEvent): JobSnapshot {
  if (event.type === "step") {
    const data = { ...state.data };
    if (event.data) data[event.step] = event.data;
    let texts = state.texts;
    if (event.status === "done" && event.step === "body" && typeof event.data?.bodyMd === "string") {
      texts = { ...texts, body: event.data.bodyMd };
    }
    if (event.status === "done" && event.step === "letter" && typeof event.data?.letterMd === "string") {
      texts = { ...texts, letter: event.data.letterMd };
    }
    return { ...state, steps: { ...state.steps, [event.step]: event.status }, data, texts };
  }
  if (event.type === "delta") {
    const key = event.target;
    return { ...state, texts: { ...state.texts, [key]: state.texts[key] + event.text } };
  }
  if (event.type === "done") return { ...state, done: true, redirect: event.redirect ?? null };
  return { ...state, error: { code: event.code, message: event.message } };
}

/**
 * 订阅一条任务。断线最多重连 4 次；重连后清空半截 delta，
 * 等 body/letter 的 step done 用完整正文覆盖。
 */
export function useJob(jobId: string | null, epoch = 0) {
  const [state, setState] = useState<JobSnapshot>(empty);
  const key = `${jobId ?? ""}:${epoch}`;
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setState(empty());
  }

  useEffect(() => {
    if (!jobId) return;
    const snap = { current: empty() };
    let stopped = false;
    let finished = false;
    let attempt = 0;
    let cancel = () => {};
    let timer = 0;

    const publish = () => setState(snap.current);

    const connect = () => {
      if (attempt > 0) {
        snap.current = empty();
        publish();
      }
      attempt += 1;
      cancel = subscribeJob(
        jobId,
        (event) => {
          if (stopped) return;
          if (event.type === "done" || event.type === "error") finished = true;
          snap.current = reduce(snap.current, event);
          publish();
        },
        () => {
          if (stopped || finished || attempt > 4) return;
          timer = window.setTimeout(connect, 900);
        },
      );
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      cancel();
    };
  }, [jobId, epoch]);

  return state;
}
