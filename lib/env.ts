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

  AI_TEXT_PROVIDER: z.enum(["mock", "openai-compat"]).default("mock"),
  OPENAI_COMPAT_BASE_URL: z.string().default("https://open.bigmodel.cn/api/paas/v4"),
  OPENAI_COMPAT_API_KEY: z.string().default(""),
  TEXT_MODEL_SMART: z.string().default("glm-5.3"),
  TEXT_MODEL_FAST: z.string().default("glm-5.3-flash"),
  TEXT_MODEL_VISION: z.string().default("glm-5.3-flash"),
  // 目标推荐（suggestGoals）单独通道：auto=跟随 AI_TEXT_PROVIDER；real=全局 mock 时也走真实 API。
  // 主流程真实实现仍是 TODO，切全局开关会弄坏建档，这个开关只影响 suggestGoals 一个方法。
  AI_SUGGEST_PROVIDER: z.enum(["auto", "mock", "real"]).default("auto"),

  AI_IMAGE_PROVIDER: z.enum(["mock", "zhipu", "openai"]).default("mock"),
  IMAGE_BASE_URL: z.string().default("https://open.bigmodel.cn/api/paas/v4"),
  IMAGE_API_KEY: z.string().default(""),
  IMAGE_MODEL: z.string().default("cogview-4-250304"),
  IMAGE_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(3),

  MOCK_LATENCY_MS: z.coerce.number().int().min(0).default(800),
  DEMO_MODE: z
    .string()
    .default("1")
    .transform((v) => v === "1" || v === "true"),
});

export type Env = z.infer<typeof Env>;
export const env: Env = Env.parse(process.env);
