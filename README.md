# UworthBetter

> 把你的 90 天，写成一部你会追更的连载。

黑客松项目：用户描述"想成为的未来自己"，AI 生成未来自我的形象与人格，并把 90 天目标改编成 13 章的图文连载。用户每周完成的真实行动会变成下一章剧情。

## 快速开始

```bash
pnpm install
cp .env.example .env.local   # 默认 mock 模式，不需要 Key 也能跑
pnpm db:migrate
pnpm dev                     # http://localhost:3000
```

试一下桩接口：
- http://localhost:3000/api/season
- http://localhost:3000/api/jobs/stub-onboarding/events （SSE 回放建档过程）
- http://localhost:3000/api/jobs/stub-chapter-2/events （SSE 回放章节生成）

## 文档

| 文档 | 内容 |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | **开发约束（必读）**：契约规则、目录所有权、编码约定 |
| [DESIGN.md](./DESIGN.md) | 产品设计：叙事机制、页面、AI 管线、Prompt |
| [ENGINEERING.md](./ENGINEERING.md) | 工程方案：契约、任务卡（A/B/C/D 四条轨道）、排期、测试 |
