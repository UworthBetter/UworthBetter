import { Placeholder } from "@/components/layout/Placeholder";

export default function Page() {
  return <Placeholder card="C8" title="今日记录" apis={["GET /api/logs?chapter=n", "POST /api/logs"]} />;
}
