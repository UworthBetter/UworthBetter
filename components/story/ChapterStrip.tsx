import Link from "next/link";
import type { ChapterCard } from "@/lib/contracts";

export function ChapterStrip({ chapters, current }: { chapters: ChapterCard[]; current: number }) {
  return (
    <div className="strip" aria-label="十三章">
      {chapters.map((chapter) => {
        const inner = (
          <>
            <span>第 {chapter.no} 章</span>
          </>
        );
        const cls = `strip-item${chapter.no === current ? " on" : ""}${chapter.status === "locked" ? " locked" : ""}${chapter.isActFinale ? " finale" : ""}`;
        const style = chapter.coverUrl ? { backgroundImage: `url(${chapter.coverUrl})` } : undefined;
        if (chapter.status === "locked") {
          return <div key={chapter.no} className={cls} style={style} aria-label={`第 ${chapter.no} 章未解锁`}>{inner}</div>;
        }
        return (
          <Link key={chapter.no} href={`/chapter/${chapter.no}`} className={cls} style={style}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
