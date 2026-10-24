import { Suspense } from "react";
import { ChapterScreen } from "@/components/screens/ChapterScreen";

export default function Page() {
  return (
    <Suspense fallback={<div className="quiet-loading">正在翻开这一章…</div>}>
      <ChapterScreen />
    </Suspense>
  );
}
