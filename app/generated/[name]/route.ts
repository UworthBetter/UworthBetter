import fs from "node:fs/promises";
import path from "node:path";
import { fail, handle } from "@/lib/server/http";

// 新生成的文件不依赖 Next.js 启动时扫描的 public 文件清单。
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ name: string }> }) => {
  const { name } = await ctx.params;
  if (!/^[\w-]{24}\.(png|jpg|webp)$/.test(name)) throw fail("NOT_FOUND", "图片不存在", 404);
  let buffer: Buffer;
  try { buffer = await fs.readFile(path.resolve("public/generated", name)); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw fail("NOT_FOUND", "图片不存在", 404);
    throw error;
  }
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": name.endsWith(".jpg") ? "image/jpeg" : name.endsWith(".webp") ? "image/webp" : "image/png",
    "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff",
  } });
});
