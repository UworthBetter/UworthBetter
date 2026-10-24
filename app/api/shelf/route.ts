import { ShelfResponse } from "@/lib/contracts/api";
import { handle, ok } from "@/lib/server/http";
import { getActiveSeason } from "@/lib/server/session";
import { chapterCards } from "@/lib/server/views";
export const GET = handle(async () => ok(ShelfResponse, { chapters: chapterCards((await getActiveSeason()).id) }));
