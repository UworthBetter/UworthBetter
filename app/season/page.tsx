import { Placeholder } from "@/components/layout/Placeholder";

export default function Page() {
  return <Placeholder card="C7" title="故事进度主页" apis={["GET /api/season", "PATCH /api/quests/:id"]} />;
}
