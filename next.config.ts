import type { NextConfig } from "next";

// 注意：刻意不开启 cacheComponents（黑客松阶段降低心智负担，所有路由默认按请求动态渲染）
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
