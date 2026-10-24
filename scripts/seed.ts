import "./_env";
import { db, schema } from "@/lib/server/db/client";
import { assertDemo } from "@/lib/server/demoGuard";
import { seedDemo } from "@/lib/server/demo";
import { eq } from "drizzle-orm";

assertDemo();
const uid = process.argv[2];
const user = uid ? db.select().from(schema.users).where(eq(schema.users.id, uid)).get()
  : db.insert(schema.users).values({ nickname: "演示账号" }).returning().get();
if (!user) throw new Error("指定的用户不存在；从 /api/me 获取 userId 后重试");
console.log({ userId: user.id, seasonId: seedDemo(user.id) });
console.log("为已有浏览器会话导入：pnpm seed:demo <userId>；新浏览器通过 POST /api/demo/seed 载入。");
