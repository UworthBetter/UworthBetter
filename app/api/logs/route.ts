// STUB → 任务卡 B5（每日记录 + 照片 + 安全检查）
import { CreateLogRequest, CreateLogResponse, ListLogsResponse } from "@/lib/contracts/api";
import { handle, ok, readMultipart } from "@/lib/server/http";
import { STUB_IMG, stubLogs } from "@/lib/server/stubs";
import { CRISIS_MESSAGE, HOTLINES, getAITasks } from "@/lib/ai/tasks";

export const GET = handle(async (req: Request) => {
  const n = Number(new URL(req.url).searchParams.get("chapter") ?? 2);
  return ok(ListLogsResponse, { logs: stubLogs(n) });
});

export const POST = handle(async (req: Request) => {
  const { data, file } = await readMultipart(req, CreateLogRequest, "photo");
  const safety = await getAITasks().checkSafety(data.note);
  return ok(CreateLogResponse, {
    log: {
      id: `stub-log-${Date.now()}`,
      chapterNo: 2,
      date: new Date().toISOString().slice(0, 10),
      note: data.note,
      mood: data.mood,
      photoUrl: file ? STUB_IMG.panel(0) : null,
    },
    crisis: safety.crisis ? { message: CRISIS_MESSAGE, hotlines: HOTLINES } : undefined,
  });
});
