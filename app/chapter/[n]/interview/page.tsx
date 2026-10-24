import { Placeholder } from "@/components/layout/Placeholder";

export default function Page() {
  return <Placeholder card="C9" title="周末采访" apis={["GET/POST /api/chapters/:n/interview", "POST /api/chapters/:n/generate"]} />;
}
