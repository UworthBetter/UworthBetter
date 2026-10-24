import type { Metadata, Viewport } from "next";
import "@fontsource/noto-serif-sc/chinese-simplified-400.css";
import "@fontsource/noto-serif-sc/chinese-simplified-600.css";
import "@fontsource/noto-serif-sc/chinese-simplified-700.css";
import "@fontsource/noto-serif-sc/latin-400.css";
import "@fontsource/noto-serif-sc/latin-600.css";
import "@fontsource/noto-serif-sc/latin-700.css";
import { AppChrome } from "@/components/layout/AppChrome";
import { MobileShell } from "@/components/layout/MobileShell";
import { PaperBackground } from "@/components/layout/PaperBackground";
import { IconSprite } from "@/components/ui/Icon";
import "./globals.css";

export const metadata: Metadata = {
  title: "UworthBetter",
  description: "把你的 90 天，写成一部你会追更的连载",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3eee2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-style="healing" className="h-full">
      <body>
        <IconSprite />
        <PaperBackground />
        <MobileShell>
          <AppChrome>{children}</AppChrome>
        </MobileShell>
      </body>
    </html>
  );
}
