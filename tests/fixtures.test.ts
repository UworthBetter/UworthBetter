import { describe, expect, it } from "vitest";

describe("fixtures 符合契约", () => {
  it("全部 fixture 可加载并通过 schema 校验", async () => {
    const fx = await import("@/fixtures");
    expect(fx.fxOnboarding.roadmap.acts.flatMap((a) => a.chapters).map((c) => c.no)).toEqual(
      Array.from({ length: 13 }, (_, i) => i + 1),
    );
    expect(fx.fxChapterBodyMd().match(/<!--panel:\d-->/g)).toHaveLength(4);
    expect(fx.fxChapterContext.futureSelf.name).toBeTruthy();
  });
});
