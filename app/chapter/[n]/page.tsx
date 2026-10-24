import { Placeholder } from "@/components/layout/Placeholder";

export default function Page() {
  return <Placeholder card="C10" title="章节阅读器" apis={["GET /api/chapters/:n", "GET /api/jobs/:id/events（试试 stub-chapter-2）", "PUT /api/chapters/:n/quests"]} />;
}
