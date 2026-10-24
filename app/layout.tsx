import type { Metadata, Viewport } from "next";
import "./globals.css";

// TODO(C1)：引入霞鹜文楷 / 标题字体（next/font/local）、PaperBackground、MobileShell
export const metadata: Metadata = {
  title: "UworthBetter",
  description: "把你的 90 天，写成一部你会追更的连载",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f1e6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-style="healing" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto min-h-dvh w-full max-w-[430px]">{children}</main>
      </body>
    </html>
  );
}
