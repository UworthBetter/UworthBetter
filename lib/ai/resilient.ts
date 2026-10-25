/**
 * 真实模型调用护栏：每次尝试有超时 → 失败重试 1 次 → 仍失败（或未配置 Key）回退 mock。
 * 目标是演示永不中断；回退时打印一行警告，便于在服务器日志里定位问题。
 */

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * 运行 run(signal)，单次超时 timeoutMs；失败后再试一次（共 attempts 次）。
 * 超时会 abort signal，并且不等待不响应 signal 的底层实现（放弃的 Promise 被吞掉，不会产生未处理拒绝）。
 */
export async function withRetry<T>(
  label: string,
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
  attempts = 2,
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    const ctrl = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`超时（${timeoutMs}ms）`);
        ctrl.abort(err);
        reject(err);
      }, timeoutMs);
    });
    const pending = run(ctrl.signal);
    pending.catch(() => {});
    try {
      return await Promise.race([pending, timeout]);
    } catch (e) {
      lastError = e;
      console.warn(`[ai] ${label} 第 ${i}/${attempts} 次尝试失败：${message(e)}`);
    } finally {
      clearTimeout(timer);
      ctrl.abort();
    }
  }
  throw lastError;
}

/** real 为 null（未配置）或最终失败时调用 fallback。 */
export async function withFallback<T>(
  label: string,
  real: (() => Promise<T>) | null,
  fallback: () => Promise<T>,
): Promise<T> {
  if (real) {
    try {
      return await real();
    } catch (e) {
      console.warn(`[ai] ${label} 真实模型不可用，回退 mock：${message(e)}`);
    }
  }
  return fallback();
}

/** 包装流式回调：尝试结束（超时/失败被放弃）后不再转发迟到的增量。 */
export function guardDelta(onDelta: (text: string) => void, signal: AbortSignal): (text: string) => void {
  return (text) => {
    if (!signal.aborted) onDelta(text);
  };
}
