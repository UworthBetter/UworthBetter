import { OkResponse } from "@/lib/contracts/api";
import { assertDemo } from "@/lib/server/demoGuard";
import { resetUser } from "@/lib/server/demo";
import { handle, ok } from "@/lib/server/http";
import { getCurrentUser } from "@/lib/server/session";
export const POST = handle(async () => {
  assertDemo();
  await resetUser((await getCurrentUser()).id);
  return ok(OkResponse, { ok: true });
});
