import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    // 测试中禁止调用真实 AI；数据库使用内存库
    env: {
      AI_TEXT_PROVIDER: "mock",
      AI_IMAGE_PROVIDER: "mock",
      MOCK_LATENCY_MS: "0",
      DATABASE_URL: ":memory:",
      DEMO_MODE: "1",
    },
  },
});
