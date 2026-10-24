import { asc, eq } from "drizzle-orm";
import { CreateLogRequest, CreateLogResponse, ListLogsResponse } from "@/lib/contracts/api";
import { getAITasks, CRISIS_MESSAGE, HOTLINES } from "@/lib/ai/tasks";
import { toDateStr } from "@/lib/domain/progress";
import { db, schema } from "@/lib/server/db/client";
import { fail, handle, ok, parseChapterNo, readMultipart } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { requireEditable } from "@/lib/server/records";
import { deleteImage, saveUpload } from "@/lib/server/storage";
export const GET = handle(async (req: Request) => {
  const season = await getActiveSeason();
  const raw = new URL(req.url).searchParams.get("chapter");
  const n = raw === null ? season.currentChapter : parseChapterNo(raw);
  return ok(ListLogsResponse, { logs: db.select().from(schema.dailyLogs).where(eq(schema.dailyLogs.seasonId, season.id))
    .orderBy(asc(schema.dailyLogs.createdAt)).all().filter((l) => l.chapterNo === n) });
});
export const POST = handle(async (req: Request) => {
  const { data, file } = await readMultipart(req, CreateLogRequest, "photo");
  const season = await getActiveSeason();
  requireEditable(season, season.currentChapter);
  const safety = await getAITasks().checkSafety(data.note);
  const photoUrl = file ? await saveUpload(file) : null;
  try {
    const latest = await getActiveSeason();
    if (latest.id !== season.id) throw fail("CHAPTER_LOCKED", "当前季已切换，请刷新后重试", 409);
    requireEditable(latest, season.currentChapter);
  } catch (error) {
    if (photoUrl) await deleteImage(photoUrl);
    throw error;
  }
  const log = db.insert(schema.dailyLogs).values({ ...data, seasonId: season.id, chapterNo: season.currentChapter,
    date: toDateStr(new Date()), photoUrl }).returning().get();
  if (photoUrl && !safety.crisis) {
    void getAITasks().captionPhoto({ url: photoUrl }).then((photoCaption) => {
      db.update(schema.dailyLogs).set({ photoCaption }).where(eq(schema.dailyLogs.id, log.id)).run();
    }).catch((error) => console.error("照片描述失败", error));
  }
  return ok(CreateLogResponse, { log, ...(safety.crisis ? { crisis: { message: CRISIS_MESSAGE, hotlines: HOTLINES } } : {}) });
});
