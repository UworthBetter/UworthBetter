import { SeedResponse } from "@/lib/contracts/api";
import { assertDemo } from "@/lib/server/demoGuard";
import { seedDemo } from "@/lib/server/demo";
import { handle, ok } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";
export const POST = handle(async () => { assertDemo(); return ok(SeedResponse, { seasonId: seedDemo((await getCurrentUser()).id) }); });
