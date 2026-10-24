import { env } from "@/lib/env";
import { fail } from "./http";

/** Demo 接口守卫：DEMO_MODE 关闭时一律 403。 */
export function assertDemo(): void {
  if (!env.DEMO_MODE) throw fail("FORBIDDEN", "Demo 接口未开启", 403);
}
