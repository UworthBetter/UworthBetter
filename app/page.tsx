import { Suspense } from "react";
import { Landing } from "@/components/screens/Landing";

export default function Page() {
  return (
    <Suspense fallback={<div className="quiet-loading">编辑室正在铺纸…</div>}>
      <Landing />
    </Suspense>
  );
}
