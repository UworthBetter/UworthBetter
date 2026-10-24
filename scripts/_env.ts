// 脚本专用：与 Next.js 一致地加载 .env.local → .env（先加载的优先）
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
