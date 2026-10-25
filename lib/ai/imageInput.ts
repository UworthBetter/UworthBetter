/**
 * 把 ImageRef.url 转成模型能读取的地址：公网 URL / data URL 原样返回；
 * 站内路径（/generated/x.webp）读取本地文件，压缩为 JPEG data URL（部分视觉模型不接受 webp）。
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = path.resolve("public");

export async function toModelImageUrl(url: string): Promise<string> {
  if (/^(https?:|data:)/i.test(url)) return url;
  const file = path.resolve(PUBLIC_DIR, `.${url.startsWith("/") ? url : `/${url}`}`);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) throw new Error(`非法图片路径：${url}`);
  const buffer = await sharp(await fs.readFile(file), { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
