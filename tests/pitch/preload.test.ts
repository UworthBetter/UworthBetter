import { describe, expect, it } from "vitest";
import seed from "@/seed/demo-season.json";
import { toPitchData } from "@/components/pitch/model/adapter";
import { imageUrlsOf } from "@/components/pitch/model/preload";

describe("imageUrlsOf", () => {
  const urls = imageUrlsOf(toPitchData(seed));
  it("包含各场景用到的图片：设定图、前 4 章封面、低谷章分镜、快照与分支画像", () => {
    for (const u of ["/demo/sheet-present.jpg", "/demo/sheet-future.jpg", "/demo/cover-1.jpg", "/demo/cover-4.jpg", "/demo/panel-3-1.jpg"])
      expect(urls).toContain(u);
  });
  it("去重且不含 null", () => {
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((u) => typeof u === "string" && u.length > 0)).toBe(true);
  });
});
