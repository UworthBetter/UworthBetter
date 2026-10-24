import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { deleteImage, saveUpload } from "@/lib/server/storage";
import { GET } from "@/app/generated/[name]/route";

describe("图片存储", () => {
  it("缩放、移除原始元信息，新文件通过路由读取，删除后返回 404", async () => {
    const original = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#776655" } }).jpeg().toBuffer();
    const url = await saveUpload(new File([new Uint8Array(original)], "photo.jpg", { type: "image/jpeg" }));
    const params = { params: Promise.resolve({ name: url.split("/").at(-1)! }) };
    try {
      const response = await GET(new Request(`http://test${url}`), params);
      expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("image/webp");
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      expect(metadata.width).toBe(1024); expect(metadata.height).toBe(768); expect(metadata.exif).toBeUndefined();
    } finally { await deleteImage(url); }
    expect((await GET(new Request(`http://test${url}`), params)).status).toBe(404);
    expect((await GET(new Request("http://test/generated/x"), { params: Promise.resolve({ name: "../../.env.local" }) })).status).toBe(404);
  });
});
