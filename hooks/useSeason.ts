"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiClientError, api } from "@/lib/client/api";
import type { SeasonView } from "@/lib/contracts";
import { completionRate, fogBlurPx, remainingToClear } from "@/lib/domain/progress";

export type SeasonApi = {
  season: SeasonView | null;
  loading: boolean;
  error: string | null;
  pulse: boolean;
  refresh: () => Promise<void>;
  toggleQuest: (id: string, done: boolean) => Promise<void>;
};

export const SeasonContext = createContext<SeasonApi | null>(null);

function withFog(season: SeasonView, quests: SeasonView["current"]["quests"], coverUrl: string | null): SeasonView {
  const rate = completionRate(quests);
  return {
    ...season,
    current: {
      ...season.current,
      quests,
      fog: {
        coverUrl,
        rate,
        blurPx: fogBlurPx(rate),
        remainingToClear: remainingToClear(quests),
      },
    },
  };
}

export function useSeasonState(): SeasonApi {
  const [season, setSeason] = useState<SeasonView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.season();
      setSeason(data);
      document.documentElement.dataset.style = data.season.style;
      setError(null);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.code : "LOAD");
    } finally {
      setLoading(false);
    }
  }, []);

  const path = usePathname();
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh, path]);

  const toggleQuest = useCallback(async (id: string, done: boolean) => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 700);
    setSeason((cur) => {
      if (!cur) return cur;
      const quests = cur.current.quests.map((q) => (q.id === id ? { ...q, done } : q));
      return withFog(cur, quests, cur.current.fog.coverUrl);
    });
    try {
      const res = await api.patchQuest(id, done);
      setSeason((cur) => {
        if (!cur) return cur;
        const quests = cur.current.quests.map((q) => (q.id === res.quest.id ? { ...q, done: res.quest.done } : q));
        return withFog(cur, quests, res.fog.coverUrl);
      });
    } catch {
      setSeason((cur) => {
        if (!cur) return cur;
        const quests = cur.current.quests.map((q) => (q.id === id ? { ...q, done: !done } : q));
        return withFog(cur, quests, cur.current.fog.coverUrl);
      });
    }
  }, []);

  return { season, loading, error, pulse, refresh, toggleQuest };
}

export function useSeason(): SeasonApi {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("SeasonProvider 缺失");
  return ctx;
}
