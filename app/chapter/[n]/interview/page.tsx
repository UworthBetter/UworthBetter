import { Suspense } from "react";
import { InterviewScreen } from "@/components/screens/InterviewScreen";

export default function Page() {
  return (
    <Suspense fallback={<div className="quiet-loading">正在准备采访…</div>}>
      <InterviewScreen />
    </Suspense>
  );
}
