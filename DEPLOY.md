# 后端运行与部署

后端使用 SQLite 持久化数据，通过 SSE 推送生成进度。部署目标为持久运行的
Node.js 单进程；当前任务队列不适用于多实例、PM2 cluster 或无服务器部署。

## 本地运行

在项目目录执行以下命令。Node.js 22 和项目指定的 pnpm 版本必须已安装。

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

开发默认使用 mock。浏览器首次访问 `/api/me` 后会收到 180 天的匿名会话
cookie。你可以通过前端调用 `POST /api/demo/seed`，载入前三章已完成、第四章
进行中的演示季。当前演示内容来自 fixtures 和 `/stub` 图片；设计轨道尚未提供
`seed/demo-linxia.json` 与真实演示图片，后端没有将占位资产标记为真实生成资产。

命令行导入已有会话时，先从该浏览器的 `/api/me` 获取 `userId`，再执行：

```sh
pnpm seed:demo <userId>
```

不带参数会创建独立的演示用户并打印其 ID。命令行无法为浏览器设置会话
cookie，因此新浏览器需要调用演示 seed 接口。重复 seed 会创建新季并切换当前
季；reset 仅清除当前用户的数据。存在进行中的任务时，seed 和 reset 返回 409。

## 服务器准备

先安装 Node.js 22、pnpm、PM2、nginx 和 HTTPS 证书工具，再把代码放到
`/srv/uworthbetter`。将数据库和图片放在发布目录以外的持久化路径。

```sh
sudo mkdir -p /var/lib/uworthbetter/data /var/lib/uworthbetter/generated
sudo chown -R "$USER":"$USER" /var/lib/uworthbetter
cd /srv/uworthbetter
ln -s /var/lib/uworthbetter/generated public/generated
```

创建符号链接前，确认 `public/generated` 不存在；若已有生成图片，先备份并迁移
到持久化目录。配置 `.env.local`，密钥只保存在服务器上：

```dotenv
DATABASE_URL=file:/var/lib/uworthbetter/data/app.db
PUBLIC_BASE_URL=https://story.example.com
AI_TEXT_PROVIDER=mock
AI_IMAGE_PROVIDER=mock
DEMO_MODE=1
```

公开使用时可将 `DEMO_MODE=0`。启用真实模型：设置 `AI_TEXT_PROVIDER=openai-compat` +
`OPENAI_COMPAT_API_KEY`（文本），`AI_IMAGE_PROVIDER=openai|zhipu` + `IMAGE_API_KEY`
（图像，另见 `IMAGE_BASE_URL` / `IMAGE_MODEL`），并保持 `DEMO_CACHED_GENERATE=0`；
完整说明见 `.env.example` 与 README「启用真实模型」。每次调用超时后重试 1 次，仍失败或
Key 为空时回退 mock，日志中搜索 `回退 mock` 可发现问题。`STORAGE_DRIVER=s3`
尚未实现，当前只支持本地文件存储。

## 构建与启动

先停止旧进程，再备份 SQLite 数据和图片，最后构建、迁移和启动。数据库连接
初始化时会运行迁移，因此构建期间必须避免旧实例仍在生成章节。

```sh
cd /srv/uworthbetter
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm db:migrate
pm2 start ecosystem.config.js
pm2 save
```

将 [nginx 配置](deploy/nginx.conf) 中的域名替换为你的域名，安装到 nginx 的
站点目录，通过 `nginx -t` 后重载。然后使用证书工具为该站点启用 HTTPS。
`PUBLIC_BASE_URL` 为 HTTPS 时，会话 cookie 使用 Secure 属性。

## 恢复和验证

后台任务独立于 SSE 连接运行。重连会重放持久化的步骤事件；正文和来信以
`body`、`letter` 完成事件中的完整文本为准，delta 不持久化。进程重启会把
中断的章节在重启后的首个会话请求中恢复为 `in_progress`，并把中断任务标为失败，
用户可以重新生成。CLI seed、迁移与构建不会触发恢复逻辑，避免中断在线任务。
中断的建档可以重新提交。失败任务不会自动消耗额度重跑。

你可以按以下顺序验证部署：

1. 在浏览器访问 `/api/me`，确认重复访问的用户 ID 相同。
2. 通过前端调用 demo seed，确认当前章为第 4 章，前三章可以阅读。
3. 完成任务、添加记录、提交采访，再生成第 4 章。
4. 生成中刷新页面，确认进度能恢复，结束后当前章为第 5 章。
5. 查看 `/api/demo/jobs`，检查最近任务及步骤 `durationMs`。
6. 使用手机网络验证 HTTPS、图片和 SSE。

`POST /api/demo/fast-forward` 的 `cached=true` 使用本地 fixture 回放文本及
占位图片，并通过同一事务推进章节，不调用外部 AI。当前未来对话属于 P1，
仍返回明确的占位文案。本次只交付部署配置，未执行服务器发布或公网验收。
