/**
 * 服务端环境变量（唯一读取 process.env 的地方）。缺省值保证 mock 模式零配置可运行。
 * 只允许 lib/server、lib/ai、scripts 导入（前端禁止，ESLint 已限制）。
 */
import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("file:./data/app.db"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),

  // openai-compat 且填了 Key 时走真实模型；每次调用超时 → 重试 1 次 → 仍失败则回退 mock（见 lib/ai/resilient.ts）
  AI_TEXT_PROVIDER: z.enum(["mock", "openai-compat"]).default("mock"),
  OPENAI_COMPAT_BASE_URL: z.string().default("https://open.bigmodel.cn/api/paas/v4"),
  OPENAI_COMPAT_API_KEY: z.string().default(""),
  TEXT_MODEL_SMART: z.string().default("glm-5.3"),
  TEXT_MODEL_FAST: z.string().default("glm-5.3-flash"),
  TEXT_MODEL_VISION: z.string().default("glm-5.3-flash"),
  // 目标推荐（suggestGoals）单独通道：auto=跟随 AI_TEXT_PROVIDER；real=全局 mock 时也走真实 API；mock=强制模板。
  AI_SUGGEST_PROVIDER: z.enum(["auto", "mock", "real"]).default("auto"),

  AI_IMAGE_PROVIDER: z.enum(["mock", "zhipu", "openai"]).default("mock"),
  IMAGE_BASE_URL: z.string().default("https://open.bigmodel.cn/api/paas/v4"),
  IMAGE_API_KEY: z.string().default(""),
  IMAGE_MODEL: z.string().default("cogview-4-250304"),
  IMAGE_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(3),

  // 单次尝试的超时（毫秒）。JSON/看图按整次调用计时（含一次格式修复），流式按整段输出计时。
  // FAST 用于同步接口（目标推荐、采访问题、照片描述）：2 次尝试 + mock 回退要在反向代理默认的 60s 内返回。
  AI_TEXT_TIMEOUT_MS: z.coerce.number().int().min(100).default(90_000),
  AI_FAST_TIMEOUT_MS: z.coerce.number().int().min(100).default(25_000),
  AI_STREAM_TIMEOUT_MS: z.coerce.number().int().min(100).default(120_000),
  AI_IMAGE_TIMEOUT_MS: z.coerce.number().int().min(100).default(120_000),

  MOCK_LATENCY_MS: z.coerce.number().int().min(0).default(800),
  DEMO_MODE: z
    .string()
    .default("1")
    .transform((v) => v === "1" || v === "true"),
  // 路演：正常流程的「生成本章」也走预生成章节回放（仅在 DEMO_MODE 下生效）
  DEMO_CACHED_GENERATE: z
    .string()
    .default("0")
    .transform((v) => v === "1" || v === "true"),
});

export type Env = z.infer<typeof Env>;
export const env: Env = Env.parse(process.env);
