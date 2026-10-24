import { eq, inArray } from "drizzle-orm";
import type { DB } from "@/lib/server/db/client";
import { chapters, jobs } from "@/lib/server/db/schema";

/** 恢复进程中断状态；命令行脚本仅打开数据库时不能调用。 */
export function recoverInterruptedJobs(db: DB) {
  db.transaction((tx) => {
    tx.update(chapters).set({ status: "in_progress", activeJobId: null }).where(eq(chapters.status, "generating")).run();
    for (const job of tx.select().from(jobs).where(inArray(jobs.status, ["queued", "running"])).all()) {
      const message = "服务已重启，请重试";
      tx.update(jobs).set({ status: "error", error: message,
        events: [...job.events, { type: "error", code: "AI_FAILED", message }],
      }).where(eq(jobs.id, job.id)).run();
    }
  });
}

const state = globalThis as unknown as { __storyRecoveryDb?: DB };

/** 首个会话请求初始化一次，避免 CLI seed、迁移或构建中断正在运行的服务任务。 */
export function ensureServerRecovery(db: DB) {
  if (state.__storyRecoveryDb === db) return;
  recoverInterruptedJobs(db);
  state.__storyRecoveryDb = db;
}
