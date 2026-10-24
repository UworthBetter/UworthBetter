import { describe, expect, it } from "vitest";
import { loadBlobs } from "@/components/pitch/model/blobLoader";

const ok = (body: string) => Promise.resolve(new Response(body));
const hang = (signal?: AbortSignal | null) =>
  new Promise<Response>((_, reject) => signal?.addEventListener("abort", () => reject(new Error("aborted"))));

describe("loadBlobs", () => {
  it("逐张回调：一个请求卡住不影响其他图片生效，卡住的按超时放弃", async () => {
    const got: string[] = [];
    const fetcher = (url: string, init?: RequestInit) => (url === "/slow" ? hang(init?.signal) : ok(url));
    const t0 = Date.now();
    await loadBlobs(["/a", "/slow", "/b"], (url) => got.push(url), { fetcher, timeoutMs: 200 });
    expect(got.sort()).toEqual(["/a", "/b"]);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
  it("404 与网络错误被忽略", async () => {
    const got: string[] = [];
    const fetcher = (url: string) => (url === "/404" ? Promise.resolve(new Response("", { status: 404 })) : Promise.reject(new Error("net")));
    await loadBlobs(["/404", "/err"], (url) => got.push(url), { fetcher, timeoutMs: 200 });
    expect(got).toEqual([]);
  });
});
