import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * 架构边界（见 CLAUDE.md「目录所有权与依赖方向」）：
 *   前端(app 页面 / components / hooks / lib/client) ──HTTP──▶ app/api + lib/server ──▶ lib/ai/tasks ──▶ lib/ai/*
 *   所有层都可以依赖 lib/contracts 与 lib/domain；lib/contracts 不依赖任何项目代码。
 * 违反边界 = lint 报错 = pnpm check 失败。
 */
const FRONTEND_FORBIDDEN = [
  { group: ["@/lib/server", "@/lib/server/*"], message: "前端不能导入服务端代码，请通过 lib/client/api.ts 调用 HTTP 接口。" },
  { group: ["@/lib/ai", "@/lib/ai/*"], message: "前端不能导入 AI 层。" },
  { group: ["@/lib/env"], message: "前端不能读取服务端环境变量。" },
  { group: ["@/fixtures", "@/fixtures/*"], message: "前端不能直接读取 fixtures（走 API 桩）。" },
  { group: ["node:*", "better-sqlite3", "drizzle-orm", "drizzle-orm/*", "sharp", "openai"], message: "前端不能导入 Node/服务端依赖。" },
];

const UI_FORBIDDEN = [
  { group: ["@/components", "@/components/*", "@/hooks", "@/hooks/*", "@/lib/client", "@/lib/client/*"], message: "服务端/AI 代码不能导入前端代码。" },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**", "public/**"]),

  // 契约：只依赖 zod 与自身
  {
    files: ["lib/contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/*", "../*"], message: "契约层不能依赖任何项目代码（只允许 zod 与同目录文件）。" }] }],
    },
  },

  // 领域纯函数：只依赖契约
  {
    files: ["lib/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/lib/server", "@/lib/server/*", "@/lib/ai", "@/lib/ai/*", "@/lib/client", "@/lib/client/*", "@/lib/env", "@/components", "@/components/*", "@/hooks", "@/hooks/*", "@/app/*", "@/fixtures", "@/fixtures/*"], message: "领域层只能依赖 lib/contracts。" },
            { group: ["node:*"], message: "领域层必须是纯函数，前后端共用。" },
          ],
        },
      ],
    },
  },

  // AI 层：不碰数据库与前端
  {
    files: ["lib/ai/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/lib/server", "@/lib/server/*", "../server/*", "../../server/*"], message: "AI 层不能访问数据库/服务端编排（A 轨道只实现 lib/ai/tasks 的函数）。" },
            { group: ["better-sqlite3", "drizzle-orm", "drizzle-orm/*"], message: "AI 层不能访问数据库。" },
            ...UI_FORBIDDEN,
          ],
        },
      ],
    },
  },

  // 服务端：只能通过 lib/ai/tasks 调用 AI
  {
    files: ["lib/server/**/*.ts", "app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/lib/ai/*", "!@/lib/ai/tasks"], message: "服务端只能从 @/lib/ai/tasks 导入 AI 能力，不能直接用 provider/prompt。" },
            ...UI_FORBIDDEN,
          ],
        },
      ],
    },
  },

  // 前端
  {
    files: ["app/**/*.tsx", "components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}", "lib/client/**/*.ts"],
    ignores: ["app/api/**"],
    rules: { "no-restricted-imports": ["error", { patterns: FRONTEND_FORBIDDEN }] },
  },
]);
