import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import type { ImageResult } from "@/lib/contracts/aiTasks";
import { fail } from "@/lib/server/http";

const root = path.resolve("public/generated");

export async function saveImage(image: ImageResult): Promise<string> {
  await fs.mkdir(root, { recursive: true });
  const ext = image.mime === "image/jpeg" ? "jpg" : image.mime === "image/webp" ? "webp" : "png";
  const name = `${nanoid(24)}.${ext}`;
  await fs.writeFile(path.join(root, name), image.buffer);
  return `/generated/${name}`;
}

export async function saveUpload(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw fail("VALIDATION", "请上传 10MB 以内的 JPG、PNG 或 WebP 图片", 400);
  }
  try {
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    return await saveImage({ buffer, mime: "image/webp" });
  } catch {
    throw fail("VALIDATION", "无法读取图片", 400);
  }
}

export async function deleteImage(url: string): Promise<void> {
  if (!/^\/generated\/[\w-]+\.(png|jpg|webp)$/.test(url)) return;
  await fs.rm(path.join(root, path.basename(url)), { force: true });
}
