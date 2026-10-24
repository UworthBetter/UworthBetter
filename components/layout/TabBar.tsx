"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useSeason } from "@/hooks/useSeason";

export function TabBar() {
  const path = usePathname();
  const { season } = useSeason();
  const current = season?.chapters.find((c) => c.no === season.current.no);
  const chapterHref = !current || current.status === "locked"
    ? "/season"
    : current.status === "generating" && season?.current.activeJobId
      ? `/chapter/${current.no}?job=${encodeURIComponent(season.current.activeJobId)}`
      : `/chapter/${current.no}`;

  const tabs: { href: string; icon: IconName; label: string; on: boolean }[] = [
    { href: "/season", icon: "home", label: "进度", on: path === "/season" },
    { href: chapterHref, icon: "book", label: "当前章", on: path.startsWith("/chapter") && !path.includes("/interview") },
    { href: "/shelf", icon: "shelf", label: "书架", on: path.startsWith("/shelf") },
    { href: "/future", icon: "mail", label: "未来的你", on: path.startsWith("/future") },
  ];

  return (
    <nav className="tabbar" aria-label="主导航">
      {tabs.map((tab) => (
        <Link key={tab.label} href={tab.href} className={`tab${tab.on ? " active" : ""}`}>
          <Icon name={tab.icon} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
