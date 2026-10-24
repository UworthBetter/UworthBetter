// 逐个把资源取成 Blob：每取到一个立即回调；单个请求超时即放弃，不拖累其他资源。
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function loadBlobs(
  urls: string[],
  onLoaded: (url: string, blob: Blob) => void,
  opts: { fetcher?: Fetcher; timeoutMs?: number } = {},
): Promise<void> {
  const fetcher = opts.fetcher ?? ((u, i) => fetch(u, i));
  const timeoutMs = opts.timeoutMs ?? 15_000;
  await Promise.all(
    urls.map(async (url) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetcher(url, { signal: ctrl.signal });
        if (res.ok) onLoaded(url, await res.blob());
      } catch {
        // 取不到就退回原始 URL
      } finally {
        clearTimeout(timer);
      }
    }),
  );
}
