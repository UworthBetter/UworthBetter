"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ApiClientError, api } from "@/lib/client/api";
import type { ChapterCard } from "@/lib/contracts";
import { ActProgress } from "@/components/story/ActProgress";
import { Icon } from "@/components/ui/Icon";
import { TypeBadge } from "@/components/ui/Badge";
import { useSeason } from "@/hooks/useSeason";

const ACT_NAME = ["第一幕", "第二幕", "第三幕"];

export function ShelfScreen() {
  const { season } = useSeason();
  const router = useRouter();
  const [chapters, setChapters] = useState<ChapterCard[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.shelf().then((res) => setChapters(res.chapters)).catch((e) => setError(e instanceof ApiClientError ? e.message : "书架是空的"));
  }, []);

  if (error) return <div className="screen-pad"><p>{error}</p></div>;
  if (!chapters) return <div className="quiet-loading">正在把书立起来…</div>;

  return (
    <div className="screen-pad">
      <div className="shelf-head">
        <div className="kicker">书架</div>
        <h1 className="display" style={{ fontSize: 28, margin: "4px 0" }}>{season ? `《${season.season.title}》` : "这一季"}</h1>
      </div>
      {season ? <ActProgress acts={season.acts} /> : null}
      {[1, 2, 3].map((act) => (
        <section key={act}>
          <div className="act-name">{season?.acts[act - 1]?.name ?? ACT_NAME[act - 1]}</div>
          <div className="shelf-grid">
            {chapters.filter((chapter) => chapter.act === act).map((chapter) => {
              const locked = chapter.status === "locked";
              return (
                <button
                  key={chapter.no}
                  type="button"
                  className={`shelf-card${locked ? " locked" : ""}${chapter.isActFinale ? " finale" : ""}`}
                  disabled={locked}
                  onClick={() => router.push(`/chapter/${chapter.no}`)}
                >
                  {chapter.coverUrl && !locked ? <Image src={chapter.coverUrl} alt="" fill sizes="180px" style={{ objectFit: "cover" }} /> : <div className="cov" />}
                  <div className="ov" />
                  <div className="no">第 {chapter.no} 章</div>
                  {chapter.status === "in_progress" ? <span className="badge badge-live">进行中</span> : <TypeBadge type={chapter.type} />}
                  <div className="ti">{locked ? "未开启" : chapter.title}</div>
                  {locked ? <Icon name="lock" className="lock" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div className="finale-card" style={{ marginTop: 16 }}>
        <div className="display">季终合集</div>
        <p className="faint">十三章到齐之后，这里会装订成一本。现在先把这一周写完。</p>
      </div>
    </div>
  );
}
