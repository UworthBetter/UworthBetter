import { Suspense } from "react";
import { GeneratingScreen } from "@/components/onboarding/GeneratingScreen";

export default function Page() {
  return (
    <Suspense fallback={<div className="quiet-loading">正在聆听你的愿望…</div>}>
      <GeneratingScreen />
    </Suspense>
  );
}
