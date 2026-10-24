import { GoalSuggestRequest, GoalSuggestResponse } from "@/lib/contracts/api";
import { getAITasks } from "@/lib/ai/tasks";
import { fail, handle, ok, readJson } from "@/lib/server/http";

// 建档前可用：不要求已有 season，也不要求数据库会话。
export const POST = handle(async (req: Request) => {
  const { seed, timeBudget } = await readJson(req, GoalSuggestRequest);
  const suggestGoals = getAITasks().suggestGoals;
  if (!suggestGoals) throw fail("AI_FAILED", "目标推荐未启用", 503);
  try {
    const suggestions = await suggestGoals({ seed, timeBudget });
    return ok(GoalSuggestResponse, { suggestions });
  } catch (error) {
    // AI 调用失败统一映射为 AI_FAILED，而不是让它落进 handle() 的 500 INTERNAL。
    console.error("目标推荐失败", error);
    throw fail("AI_FAILED", "目标推荐失败，请重试", 502);
  }
});
