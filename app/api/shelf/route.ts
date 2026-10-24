// STUB → 任务卡 B9（书架）
import { ShelfResponse } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { stubChapterCards } from "@/lib/server/stubs";

export const GET = handle(async () => ok(ShelfResponse, { chapters: stubChapterCards() }));
