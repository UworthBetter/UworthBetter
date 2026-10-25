# UworthBetter

> **把你的 90 天，写成一部你会追更的连载。**
> **Turn your next 90 days into a serialized story you can't wait to keep reading.**

![UworthBetter hero](public/landing/hero.jpg)

**中文**：用户描述"想成为的自己"，AI 生成「未来的你」的形象与人格，并把 90 天目标改编成一季 13 章的图文连载。用户每周完成的真实行动会写进下一章剧情：**不行动，就没有新章节。**

**English**: You describe the person you want to become. AI creates a portrait and personality for your *future self*, then adapts your 90-day goal into a 13-chapter illustrated season. Each week, what you actually did becomes the next chapter's plot. **No action, no new chapter.**

---

## 1 分钟上手 · Try it in 1 minute

| 方式 Way | 步骤 Steps |
|---|---|
| **在线 Online** | 打开 <https://www.uworthbetter.top> → 点「载入演示账号」，载入林夏的故事，从揭晓页和第 1 周开始。右下角「演示」菜单可以快进本周或跳到任意一周，直接读到已解锁的章节 / Open the site → tap "载入演示账号" (Load demo account) to start Lin Xia's story at the reveal page and week 1. The "演示" (Demo) menu at the bottom right fast-forwards the week or jumps to any week, so you can read the unlocked chapters right away. |
| **自己的故事 Your own story** | 首页点「开始写你的故事」→ 5 步建档（可用 AI 推荐目标）→ 揭晓未来的你 → 进入第 1 周 / Tap "开始写你的故事" (Start your story) → 5-step onboarding (AI can suggest a goal) → future-self reveal → week 1. |
| **本地 Local** | `pnpm install && cp .env.example .env.local && pnpm db:migrate && pnpm dev`。**无需任何 API Key**（默认 mock 模式）/ **No API key needed** (mock mode by default). |

---

## 评分对照 · Rubric map

| 评分维度 Dimension | 本文对应章节 Section | 关键证据 Key evidence |
|---|---|---|
| **完成度与可用性 Completeness & usability** | [§A](#a-完成度与可用性--completeness--usability) | 在线可用；演示账号一键载入；任意目标都能走完全流程；无 Key 也能本地运行；99 个自动化测试全部通过；真实界面截图 / Live site; one-click demo account; any goal runs the full flow; runs locally without keys; all 99 automated tests pass; real UI screenshots |
| **创意 Creativity** | [§B](#b-创意--creativity) | 行动解锁剧情、迷雾封面、"没有失败，只有不同类型的章节"、真实生活映射成故事隐喻 / Actions unlock the story, fog cover, "no failure, only different chapter types", real life mapped to story metaphors |
| **场景价值 Scenario value** | [§C](#c-场景价值--scenario-value) | 具体用户画像与使用时刻、研究依据、竞品空白、安全护栏 / A concrete persona and moments of use, research basis, competitor gap, safety guardrails |
| **展示 Presentation**（路演 / live pitch） | [§D](#d-展示与下一步--presentation--next-steps) | 网页路演 `/pitch`、截图、路线图 / Web pitch deck `/pitch`, screenshots, roadmap |

---

## A. 完成度与可用性 · Completeness & usability

### 真实界面 · The real app

以下为应用在本地运行时的截图（2026-10-25，演示账号，移动端 390px 宽）。Screenshots of the running app (2026-10-25, demo account, 390px mobile width).

| 建档 Onboarding | 未来的你揭晓 Reveal | 故事进度 + 迷雾封面 Season + fog cover |
|---|---|---|
| ![](docs/screenshots/onboarding.jpg) | ![](docs/screenshots/reveal.jpg) | ![](docs/screenshots/season.jpg) |
| **今日记录 Today** | **章节阅读器 Chapter reader** | **书架 Shelf** |
| ![](docs/screenshots/today.jpg) | ![](docs/screenshots/chapter-4.jpg) | ![](docs/screenshots/shelf.jpg) |

### 主流程全部可用 · The full loop works end to end

| 功能 Feature | 状态 | 位置 Where |
|---|---|---|
| 5 步建档 + AI 目标推荐 / 5-step onboarding + AI goal suggestions | ✅ | `/onboarding`, `POST /api/goal-suggestions` |
| 未来自我揭晓（人格卡 + 角色设定图）/ Future-self reveal (persona card + character sheets) | ✅ | `/reveal`, `/future` |
| 一季路线图（3 幕 13 章）/ Season roadmap (3 acts, 13 chapters) | ✅ | `/season` |
| 每日任务、心情与一句话记录 / Daily quests, mood, one-line log | ✅ | `/today` |
| 周末采访 → 章节生成（SSE 实时进度）/ Weekly interview → chapter generation (live SSE progress) | ✅ | `/chapter/[n]/interview`, `/api/jobs/:id/events` |
| 漫画阅读器（前端叠加中文对白）/ Comic reader (frontend overlays the Chinese dialogue) | ✅ | `/chapter/[n]` |
| 迷雾封面随完成度变清晰 / Fog cover clears as quests are completed | ✅ | `lib/domain/progress.ts` |
| 书架 / Shelf | ✅ | `/shelf` |
| 演示账号、时间快进、重置 / Demo account, fast-forward, reset | ✅ | `/api/demo/*` |
| 危机关键词检测 + 心理援助热线 / Crisis keyword detection + support hotlines | ✅ | `lib/ai/safety.ts` |

### 换个输入也能跑 · Works with any input

- **任意目标 Any goal**：建档接受自由文本目标，也可以输入关键词让 AI 推荐 3–4 个 90 天目标草稿。The onboarding accepts any free-text goal, or a few keywords from which AI suggests 3–4 draft 90-day goals.
- **3 种文风 3 art styles**：治愈绘本 / 东方武侠 / 赛博都市，每种有独立配色与固定画风后缀（`lib/ai/styles.ts`）。Healing storybook, Chinese ink wuxia, and cyberpunk, each with its own color theme and a locked art-style suffix.
- **每周任务条数可选 Adjustable quest count**：1–5 条，或交给故事节奏决定。Choose 1–5 quests a week, or let the story pacing decide.
- **完成度驱动分支 Completion-driven branches**：同一章会因本周完成度不同生成高光 / 挣扎 / 低谷 / 休整四种类型（规则见 `lib/domain/chapterType.ts`，有单测）。The same chapter comes out as one of four types depending on the week's completion (rules in `lib/domain/chapterType.ts`, unit-tested).
- **任务自适应是硬规则 Adaptive quests are hard rules**：完成度 <40% 时下周任务全部降为最低难度，并插入"打开工具 5 分钟就算完成"的启动任务；每周恰好 1 个关键任务（`lib/domain/questRules.ts`，有单测）。After a week under 40%, every quest drops to the lowest difficulty and a "5 minutes counts" starter task is added. Each week has exactly one key quest (`lib/domain/questRules.ts`, unit-tested).

### 为什么稳定 · Why it's reliable

- **契约优先 / Contract-first**：所有 API 请求与响应、AI 结构化输出都用 zod v4 schema 校验（`lib/contracts/`）。`CONTRACTS.lock` 哈希锁定契约文件，测试会检查是否被意外修改。
  Every API request/response and AI structured output is validated by zod v4 schemas. `CONTRACTS.lock` hashes the contract files, and tests fail on unapproved changes.
- **修复重试 / Self-repair**：AI 输出校验失败时，把错误回传给模型重新生成（`lib/ai/providers/openaiCompat.ts`）。If AI output fails validation, the error goes back to the model for a corrected retry.
- **图片失败有占位 / Image failure fallback**：图片 URL 可能为空，前端始终渲染占位。Image URLs may be null, and the frontend always renders a placeholder.
- **无 Key 可运行 / Runs with no key**：默认 mock 模式可走完整流程；测试中禁止调用真实 AI。Mock mode runs the whole flow, and tests never call a real model.
- **质量门禁 / Quality gate**：`pnpm check` = TypeScript strict + ESLint + Vitest。2026-10-25 在 Node 22 上：类型检查与 lint 无错误，15 个测试文件、99 个用例全部通过（覆盖领域规则、前后端契约、任务队列、存储与路演页）。
  `pnpm check` runs TypeScript strict, ESLint, and Vitest. On 2026-10-25 with Node 22: no type or lint errors, and all 99 tests in 15 files pass (domain rules, API contracts, job queue, storage, pitch page).

### 真实模型 · Real models

- 文本：智谱 GLM-5.3（OpenAI 兼容接口）。图像：mock / 智谱 / OpenAI 兼容中转站三种 provider，用环境变量切换。所有 AI 调用只经过 `lib/ai/tasks` 一个出口。
  Text: Zhipu GLM-5.3 via an OpenAI-compatible API. Images: mock, Zhipu, or an OpenAI-compatible relay, switched by environment variables. All AI calls go through one exit point, `lib/ai/tasks`.
- 演示季的全部图片（13 张封面、52 格分镜、立绘、12 张平行分支图）由真实图像模型预生成，见 `public/demo/`。
  Every image in the demo season (13 covers, 52 panels, portraits, 12 parallel-branch images) was pre-generated with a real image model. See `public/demo/`.
- 现场路演时，章节生成可以切换为回放预生成内容（`DEMO_CACHED_GENERATE=1`），避免网络波动影响演示。
  For the live pitch, chapter generation can be switched to replay pre-generated content (`DEMO_CACHED_GENERATE=1`) so network problems can't break the demo.

### 演示季插画 · Demo season artwork

| 现在的你 Present self | 未来的你 Future self | 第 1 章 Chapter 1 | 第 13 章 Finale |
|---|---|---|---|
| ![](public/demo/sheet-present.jpg) | ![](public/demo/sheet-future.jpg) | ![](public/demo/cover-1.jpg) | ![](public/demo/cover-13.jpg) |

| 分镜 Panel 4-0 | 分镜 Panel 4-1 | 分镜 Panel 4-2 | 分镜 Panel 4-3 |
|---|---|---|---|
| ![](public/demo/panel-4-0.jpg) | ![](public/demo/panel-4-1.jpg) | ![](public/demo/panel-4-2.jpg) | ![](public/demo/panel-4-3.jpg) |

---

## B. 创意 · Creativity

> 其他产品让你*和*未来的你聊天；我们让你*看着自己变成*未来的你。
> Other apps let you *chat with* your future self. UworthBetter lets you *watch yourself become* them.

1. **行动解锁剧情 / Actions unlock the story**：打卡不再是勾选框，而是下一章的素材。不行动就没有新章节，"为了看下一章"成了动机。Checking off a task becomes material for the next chapter. With no action there is no new chapter, so wanting to read on becomes the motivation.
2. **没有"失败"，只有不同类型的章节 / No "failure", only different chapter types**：完成度 ≥80% 高光章，40–80% 挣扎章，<40% 低谷章（结尾一定有转折之光），连续两周 <40% 休整章。断签不会被惩罚，而是被写成剧情。≥80% Highlight, 40–80% Struggle, <40% Low point (always ending on a turn toward hope), two weeks <40% Rest. A missed streak is never punished. It becomes plot.
3. **迷雾封面 / Fog cover**：下一章封面提前生成并模糊，`blur = 24 × (1 − r)px`。每完成一个任务，雾就散一点。The next chapter's cover is generated early and blurred. Each completed quest clears some of the fog.
4. **真实生活变成隐喻 / Real life becomes metaphor**：拖延被具象成故事里的反派（如"灰雾"）；"完成 3 张练习稿"变成"修复了 3 扇褪色的窗"，旁白也会点名真实行动。Procrastination becomes a villain (e.g. "the grey fog"). "Finished 3 practice sketches" becomes "restored 3 faded windows", and the narration also names the real actions.
5. **画像演化（设计中）/ Portrait evolution (in design)**：未来的你的画像会随你真实的进度调整，只拟合、不评判。目前演示季中预生成了各阶段的画像快照，在路演页 `/pitch` 展示；应用内的逐章演化是下一步。Your future self's portrait adapts to your real progress, fitting it rather than judging it. The demo season includes pre-generated portrait snapshots shown on `/pitch`; per-chapter evolution inside the app is the next step.

| ![](public/demo/portrait-0.jpg) | ![](public/demo/portrait-4.jpg) | ![](public/demo/portrait-9.jpg) | ![](public/demo/portrait-13.jpg) |
|---|---|---|---|
| 开季 Start | 第 4 章 Ch. 4 | 第 9 章 Ch. 9 | 第 13 章 Ch. 13 |

6. **有记忆的连载 / A serial with memory**：三步章节管线先生成结构化 ChapterPlan（节拍、真实事件映射、分镜、伏笔、摘要），再写正文、并行出图、写来信。前情摘要与伏笔列表让 13 章前后连贯。
   The three-step chapter pipeline first produces a structured ChapterPlan (beats, real-event mapping, panels, foreshadowing, summary), then writes the prose, generates images in parallel, and writes the letter. Rolling summaries and a foreshadowing list keep 13 chapters coherent.

---

## C. 场景价值 · Scenario value

### 谁会用、在什么时候用 · Who uses it, and when

**用户画像 / Target persona**：林夏，26 岁，互联网运营，想在 90 天内转型成能接单的独立插画师。用过 3 个打卡 App，每个都在第 2 周放弃："断了一天就不想再打开。"但她追漫画、看网文，会为了更新每天打开 App。
Lin Xia, 26, works in internet operations and wants to become a freelance illustrator within 90 days. She has quit three habit apps, each in week 2: "I missed one day and never opened it again." But she follows comics and web novels and opens apps daily for new chapters.

其他典型用户 / Also for：备考学生、求职中的应届生、重启健身的上班族、想写书或做副业的人。Students preparing for exams, new graduates job-hunting, office workers getting back into fitness, people starting a book or side project.

| 时刻 Moment | 发生什么 What happens |
|---|---|
| 周三晚 11 点，很累 / Wed 11 pm, exhausted | 看到"再完成 2 个任务，下一章封面就能看清"，于是做了一个 15 分钟的小任务。Sees "2 more quests and the next cover clears", and does one 15-minute task. |
| 周日晚 / Sunday evening | 回答 3 个问题，读到本周的新章节和"来自未来的信"，确认下周任务。Answers 3 questions, reads the new chapter and the letter from the future, and confirms next week's quests. |
| 连续几天没做 / A few days missed | 不会收到"你断签了"，而是进入低谷章剧情，AI 主动把下周任务调小。No "you broke your streak". The story enters a low-point chapter and the AI shrinks next week's quests. |

### 为什么有效 · Why it works

| 依据 Basis | 内容 What it shows | 我们怎么用 How we use it |
|---|---|---|
| 未来自我连续性 Future-self continuity | 越觉得未来的自己"是同一个人"，越愿意为长期目标付出（Ersner-Hershfield 2009；Hershfield 2011）/ Feeling connected to your future self increases long-term investment | 可视化的未来自我，每章出场 / A visible future self who appears in every chapter |
| 写信给未来 Letters to the future | 给未来的自己写信后，随后几天运动更多（Rutchick 2018）/ Writing to your future self increased exercise in the following days | 每章末「来自未来的信」/ A letter from the future ends each chapter |
| 借来的动机 Borrowed motivation | Finch（为宠物而做）、Zombies, Run!（跑步解锁剧情）/ Finch (care for a pet), Zombies, Run! (running unlocks story) | 为了看下一章而行动 / Act in order to read the next chapter |
| 叙事疗法 Narrative therapy | 问题外化、重写人生故事（White & Epston）/ Externalizing problems, re-authoring one's story | 阻力写成反派，失败写成转折 / Obstacles become villains, setbacks become turning points |

**严谨声明 / Honest caveat**：未来自我干预的研究多为短期实验（Grekin 2025 综述），我们**不宣称疗效**，定位为动机与自我反思工具。Most future-self studies are short-term (Grekin 2025 review). We make **no therapeutic claims**. This is a motivation and self-reflection tool.

### 市场空白 · The gap

| 产品 Product | 缺什么 What's missing |
|---|---|
| MyFutureSelf、MIT "Future You" | 对话式、一次性，不绑定长期行动 / Conversational and one-off, not tied to ongoing action |
| Finch | 主角是宠物而不是你 / The hero is a pet, not you |
| Habitica | 固定的游戏模板，故事与你无关 / A fixed game template, and the story isn't about you |
| Zombies, Run! | 剧本预写，只适用于跑步 / Pre-written story, running only |

**我们的定位 / Our position**：个性化视觉叙事 × 真实行动驱动 × 未来自我。我们没有找到同时做到这三点的成熟产品。Personalized visual storytelling × driven by real actions × future self. We haven't found a mature product that combines all three.

### 安全与伦理 · Safety & ethics

- 记录中出现危机信号时停止故事化，显示关怀文案与心理援助热线（`lib/ai/safety.ts`）。When a log shows crisis signals, the story pauses and the app shows a caring message with support hotlines.
- 不美化极端节食、过度训练等有害目标；未来的你**不承诺结果**；低谷章从不责备主角。Harmful goals such as extreme dieting are never glorified, the future self **never promises outcomes**, and low-point chapters never blame the protagonist.
- 用户输入用 XML 标签包裹，system prompt 声明标签内是数据而非指令，防止提示词注入。User input is wrapped in XML tags declared as data, not instructions, to defend against prompt injection.

---

## D. 展示与下一步 · Presentation & next steps

- **网页路演 / Web pitch deck**：`/pitch`（大屏路演，离线可用，图片预加载）+ `/pitch/notes`（讲者备注）。A full-screen pitch deck that works offline with preloaded images, plus a speaker-notes window.
- **下一步 / Roadmap**：与未来的你实时对话（界面已就绪，模型尚未接入）· 应用内逐章画像演化 · 照片风格化后融入分镜 · 用"未来的你"的声音朗读来信（TTS）· 季终合集长图分享 · 好友客串 · 多季续作 · 接入日历和运动数据自动生成场景素材。
  Live chat with your future self (UI ready, model not yet connected) · per-chapter portrait evolution in the app · stylized user photos inside panels · TTS letters in the future self's voice · shareable end-of-season compilations · friend cameos · multi-season sequels · calendar and fitness data as automatic story material.

---

## 本地运行 · Run locally

```bash
pnpm install
cp .env.example .env.local   # 默认 mock，无需 Key / mock by default, no key needed
pnpm db:migrate
pnpm dev                     # http://localhost:3000 → 「载入演示账号」/ "Load demo account"
pnpm check                   # typecheck + lint + test
```

需要 Node.js 22。接入真实模型：在 `.env.local` 设置 `AI_TEXT_PROVIDER` / `AI_IMAGE_PROVIDER` 与对应 Key，详见 `.env.example`；部署见 [DEPLOY.md](./DEPLOY.md)。
Requires Node.js 22. To use real models, set `AI_TEXT_PROVIDER` / `AI_IMAGE_PROVIDER` and the matching keys in `.env.local` (see `.env.example`). Deployment steps are in [DEPLOY.md](./DEPLOY.md).

**技术栈 / Stack**：Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · zod v4 · Drizzle + SQLite · SSE · Vitest · pnpm

```
Browser (mobile-first)  ──fetch / SSE──►  Next.js Route Handlers (app/api)
                                               │  ok(Schema, data) 契约校验 / contract-validated
                                               ▼
                                   lib/server: 管线 pipelines · job queue · SQLite
                                               │  只经 lib/ai/tasks / only via lib/ai/tasks
                                               ▼
                                   lib/ai: prompts · safety · text/image providers
```

## 文档 · Docs

| 文档 Doc | 内容 Contents |
|---|---|
| [DESIGN.md](./DESIGN.md) | 产品设计：研究依据、叙事机制、页面、AI 管线、Prompt / Product design: research, narrative mechanics, pages, AI pipelines, prompts |
| [ENGINEERING.md](./ENGINEERING.md) | 工程方案：契约、任务卡、排期、测试 / Engineering plan: contracts, task cards, schedule, testing |
| [DEPLOY.md](./DEPLOY.md) | 部署与运维 / Deployment & operations |
| [CLAUDE.md](./CLAUDE.md) | 团队与 AI 编码代理的开发约束 / Development rules for the team and AI coding agents |
