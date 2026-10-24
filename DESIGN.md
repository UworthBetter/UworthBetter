# UworthBetter
### 未来自我叙事规划师 —— 把你的 90 天，写成一部你会追更的连载

> 版本 v1.0 · 2026-10-24 · 黑客松设计文档（可直接照此开发）

---

## 0. 一页纸摘要（先读这里）

**一句话**：用户描述"想成为的自己"，AI 生成「未来的你」的形象与人格，并把 90 天目标改编成一季 13 章的连载漫画/小说；用户每周完成的真实行动会变成下一章的剧情，**不做事就没有新章节**。

**核心洞察**
1. "未来自我"是有学术验证的动机杠杆（Hershfield 系列研究，干预效应 d≈0.36–0.77；只看一张老化后的自己就能提升储蓄意愿）。
2. 习惯类 App 的问题是**动机不能靠意志力维持**。Finch 证明了"借来的动机"有效（为宠物而做，D1 留存近 60%）。我们的借来动机是：**为了看下一章**。
3. 叙事疗法的「问题外化」与「重写人生故事」：把拖延、焦虑具象成故事里的反派，把失败写成"低谷章"而非"打卡断了"。这样能**去羞耻化**，降低放弃率。

**差异化（一句话打给评委）**：MyFutureSelf 做的是"和未来的你聊天"，我们做的是"**看着自己变成未来的你**"。每一周都是一章有插画的故事，里面的细节全部来自用户的真实生活。

**MVP 范围（黑客松必须做完的 5 件事）**
1. 建档：文字/照片 → 未来自我人格卡 + 角色立绘
2. 季度路线图：AI 把目标拆成 3 幕 13 章 + 每周任务（"故事进度"视图）
3. 每日行动：打卡 + 一句话记录（可附照片）
4. **周末章节生成**：3 问小采访 → 叙事正文 + 4 格分镜插画 + 「来自未来的信」
5. **下一章迷雾封面**：下一章封面提前生成并高斯模糊，本周完成度越高越清晰（核心留存钩子 & Demo 高光）

**Demo 必备**：「时间快进」开发者按钮 + 预置演示账号（已有前 3 章），现场生成第 4 章。

---

## 1. 背景与研究依据

| 依据 | 内容 | 我们如何使用 |
|---|---|---|
| 未来自我连续性 (Future Self-Continuity) | Ersner-Hershfield 2009：与未来自我越"像同一个人"，越愿意为长期回报牺牲短期享受；Hershfield 2011：看过自己老化形象的被试，将更多薪水分配给退休储蓄 | 建档时生成**可视化的未来自我**；每章让"未来的你"以角色身份出现 |
| 写信给未来 | Rutchick 等 2018：给 20 年后的自己写信的被试，随后几天运动量更多 | 每章末「来自未来的信」；季初让用户给 90 天后的自己写信（季终揭晓） |
| 借来的动机 | Finch：为虚拟宠物而做自我照顾，D1 留存近 60%，D30 约 22% | 为"看下一章 / 让角色成长"而行动 |
| 叙事解锁 | Zombies, Run!：跑步里程解锁剧情片段 | 行动完成度解锁章节与迷雾封面 |
| 叙事疗法 | White & Epston：问题外化（"拖延在影响我"而非"我是拖延的人"）、重写人生故事 | 把阻力写成**反派**，失败写成剧情转折，从不责备主角 |
| 自我距离化 | Park, Ayduk & Kross 2016：表达性写作促进自我距离化，改善情绪调节 | 第三人称叙事口吻讲"你"的故事，提供自我距离 |

**风险提示（路演可主动说，显得严谨）**：未来自我干预多为短期实验，系统综述（Grekin 2025）指出部分研究缺少功效分析。因此我们**不宣称疗效**，定位为"动机与自我反思工具"。

---

## 2. 竞品与差异化

| 产品 | 做法 | 缺什么 |
|---|---|---|
| MyFutureSelf | AI 构建"未来成功的你"档案，给反馈和鼓励 | 对话式，没有视觉，没有长期叙事积累 |
| MIT "Future You" | 和 60 岁的自己聊天 | 一次性体验，不绑定行动 |
| Finch | 宠物 + 自我照顾任务 | 主角是宠物而不是你，与人生目标弱相关 |
| Habitica | RPG 化待办 | 游戏框架是固定模板，故事与你无关 |
| Zombies, Run! | 跑步解锁剧情 | 剧本预写，只适用于跑步 |
| 日记/复盘类 App | 记录 | 只有"记录"，没有"回报"，靠自律 |

**我们的定位**：**个性化的视觉叙事 × 真实行动驱动 × 未来自我**。三者的交集目前没有成熟产品。

---

## 3. 目标用户与场景

**主画像：林夏，26 岁，互联网运营**
- 想在 90 天内转型成能接单的独立插画师 / 减重 10 斤 / 考下某证书
- 用过 3 个打卡 App，每个都在第 2 周放弃："断了一天就不想再打开"
- 喜欢追漫、看网文，会为了更新而每天打开 App

**次画像**：备考学生、刚毕业的求职者、重启健身的上班族、想写书/做副业的人。

**关键场景**
1. **周日晚 9 点**：收到推送「第 5 章《雾港的第一笔订单》已就绪，未来的你给你留了一封信」→ 打开阅读 3 分钟 → 看到下一章模糊封面 → 查看下周任务。
2. **周三晚 11 点**：疲惫，不想做。打开 App 看到「下一章封面迷雾已散去 40%，再完成 2 个任务就能看清」→ 做一个 15 分钟的小任务。
3. **连续 4 天没做**：不推送"你断签了"，而是推送「灰雾笼罩了港口……未来的你想跟你说几句话」→ 进入"低谷章"剧情，AI 主动把下周任务调小。

---

## 4. 产品概念：世界观与叙事机制（核心设计）

### 4.1 概念映射表

| 人生规划概念 | 故事化包装 | 说明 |
|---|---|---|
| 90 天计划 | **一季 (Season)** | 一部完整作品，有片名、封面、世界观 |
| 3 个阶段 | **三幕 (Act)**：启程 / 试炼 / 蜕变 | 第 1–4 周、第 5–9 周、第 10–13 周 |
| 周 | **章 (Chapter)** | 每周一章，周日生成 |
| 关键里程碑 | **幕终高潮 / Boss 战** | 第 4、9、13 章是特别章（更多分镜，有特殊封面） |
| 每周任务 | **本章任务 (Quest)** | 3–5 个，难度分级 |
| 每日行动 | **场景素材 (Scene)** | 打卡 + 一句话 + 可选照片，是章节的原材料 |
| 阻力（拖延/焦虑/诱惑） | **反派 (Antagonist)** | 建档时 AI 根据用户自述的障碍具象化，如"灰雾""低语者" |
| 用户本人 | **主角**（现在的你） | 立绘随幕进化，逐渐接近未来形象 |
| 未来自我 | **导师/信使**（未来的你） | 每章出场，章末写信 |
| 用户反思 | **周末采访** | 3 个问题，真实细节注入剧情 |

### 4.2 世界观生成：目标 → 隐喻世界

AI 根据目标和用户选择的**文风**生成"故事圣经 (Story Bible)"。预置 5 种文风（MVP 做 3 种即可）：

| 文风 | 画风关键词 | 示例：目标"成为独立插画师" |
|---|---|---|
| 🌸 治愈绘本 | 水彩、柔光、吉卜力感 | 小镇上的"颜色修补师"，帮失去颜色的街道重新上色 |
| ⚔️ 东方武侠 | 水墨、留白 | 画剑派弟子，以笔为剑，十三关后出师 |
| 🌃 赛博都市 | 霓虹、电影感 | 在被灰色广告吞没的城市里做地下涂鸦艺术家 |
| 📖 日系轻小说 | 赛璐璐、明亮 | （MVP 可选） |
| 🚀 太空歌剧 | 厚涂、宏大 | （P2） |

**原则**：隐喻要和真实行动**一一对应**，让读者认得出这是自己。比如"完成 3 张练习稿"对应剧情里"修复了 3 扇褪色的窗"，旁白里也要点名真实行动："那天夜里，你画完了第三张人体速写。"

### 4.3 剧情分支：完成度决定章节类型

章节类型由**本周完成度 r** 决定（同时参考情绪记录）：

| 完成度 | 章节类型 | 叙事基调 | 未来的你的来信 |
|---|---|---|---|
| r ≥ 80% | **高光章** | 突破、战胜反派的一次进攻、获得道具 | 骄傲，点出一个具体细节 |
| 40% ≤ r < 80% | **挣扎章** | 有得有失、与反派拉锯 | 肯定已做的部分，帮你找卡点 |
| r < 40% | **低谷章** | 主角被反派困住，但故事末尾出现**转折之光** | 绝不责备："我也经历过这一周。"并提议缩小下周任务 |
| 连续两周 < 40% | **番外·休整章** | 主角在营地休息，回忆初心 | 邀请用户重新确认目标或调整计划 |

> 关键设计：**没有"失败"，只有不同类型的章节**。低谷章往往是情感最打动人的一章，用户会为了看主角如何翻身而回来。这一点是区别于打卡 App 的根本。

### 4.4 留存钩子组合

1. **迷雾封面**（主钩子）：每章生成完毕后，**立即生成下一章封面**，以 `blur(24px)` + 雾化遮罩显示。本周每完成一个任务，模糊度下降：`blur = 24 × (1 − r)px`，r=100% 时完全清晰，并获得「抢先看」标记。
2. **章末悬念**：每章最后一段固定是悬念钩子（"港口尽头出现了一个陌生的身影……"），并与下周关键任务绑定（"想知道他是谁？完成本周的【第一次投稿】"）。
3. **伏笔系统**：Story Bible 中维护 `foreshadowing[]`（埋下的伏笔与预计回收章节），让故事跨章节连贯，用户会想知道伏笔怎么回收。
4. **形象进化**：主角立绘每幕更新（服装、道具、神态），第 13 章与未来自我同框。这正是"未来自我连续性"的可视化。
5. **季终合集**：13 章合成一本可分享的长图/PDF 漫画书 + 季初写给自己的信揭晓。

### 4.5 一季的叙事骨架（给 AI 的结构约束）

```
第一幕·启程 (Ch1–4)
  Ch1  平凡世界 + 召唤：未来的你第一次出现
  Ch2  拒绝与跨越门槛：第一个小胜利
  Ch3  结识盟友/获得工具：建立节奏
  Ch4  ★幕终：第一次正面遭遇反派（里程碑 1）
第二幕·试炼 (Ch5–9)
  Ch5–6 新挑战、技能升级
  Ch7  中点反转：发现目标的更深意义
  Ch8  至暗时刻（常与真实低谷重合）
  Ch9  ★幕终：重整旗鼓（里程碑 2）
第三幕·蜕变 (Ch10–13)
  Ch10–12 最终准备、所有伏笔回收
  Ch13 ★终章：主角与未来的你相遇/重合（里程碑 3）+ 季初来信揭晓
```

> 骨架是"软约束"：AI 根据真实完成情况调整，但每幕的情绪曲线要保持。

---

## 5. 核心循环

```
          ┌────────────────────────────────────────┐
          ▼                                        │
   [查看本章任务] → [每日行动 + 一句话记录] → [迷雾逐渐散去]
                                                   │
                                          周日 / 手动"结束本章"
                                                   ▼
   [下一章迷雾封面] ← [阅读新章节 + 来自未来的信] ← [3 问周末采访]
          │
          └→ [AI 生成下周任务（根据完成度自适应难度）] → 回到顶部
```

- **日循环**（30 秒）：打开 → 勾任务 → 写一句 → 看迷雾变化
- **周循环**（5 分钟）：采访 → 阅读章节 → 确认下周任务
- **季循环**（90 天）：13 章 → 合集 → 开启第二季（续作）

---

## 6. 功能清单与优先级

### P0（黑客松必须完成，Demo 依赖）
| # | 功能 | 验收标准 |
|---|---|---|
| F1 | 建档向导 | 填写目标/未来画像/障碍/文风，可选上传自拍；生成人格卡 + 未来自我立绘 + 现在主角立绘 |
| F2 | 季度路线图 | AI 生成片名、3 幕、13 章标题与对应里程碑；用户可编辑后确认 |
| F3 | 本章任务 | 每周 3–5 个任务，可勾选；显示完成度与迷雾进度 |
| F4 | 每日记录 | 一句话 + 心情（5 档 emoji）+ 可选照片 |
| F5 | 周末采访 | AI 根据本周数据生成 3 个问题，用户回答（可跳过） |
| F6 | 章节生成 | 流式输出正文（800–1200 字）+ 4 格分镜插画 + 章末来信 + 悬念 |
| F7 | 章节阅读器 | 漫画格 + 对白气泡（前端渲染文字）+ 正文翻页 |
| F8 | 迷雾封面 | 下一章封面模糊度随完成度变化 |
| F9 | 故事进度页 | 书架/时间线：已解锁章节、当前章、锁定章节剪影、三幕进度条 |
| F10 | Demo 工具 | 时间快进（模拟一周数据）、预置账号一键载入 |

### P1（有时间就做，加分）
- 与未来的你对话（以人格卡为 system prompt 的聊天）
- 照片融入分镜：用户上传的真实照片经风格化后成为某一格
- 章节 TTS 朗读（"未来的你"的声音读信）
- 季终合集长图分享 / 生成分享卡片
- 主角立绘随幕进化

### P2（路演时作为 Roadmap 讲）
- 好友"客串"：朋友的角色出现在你的故事里（社交传播）
- 多季续作、跨季角色延续
- 接入日历/运动/读书等数据自动生成场景素材
- 小程序 / App 推送

### 明确不做
- 账号体系的复杂功能（MVP 用邮箱/昵称 + 本地 session 即可）
- 支付
- 复杂的任务管理（子任务、提醒时间等）

---

## 7. 页面与交互设计

整体视觉：**"一本正在被书写的书"**。米白纸张底色 + 书脊/书签元素 + 手写感标题字体。阅读器内切换到漫画格布局。移动端优先（评委用手机扫码体验），桌面端居中 430px 宽。

### 7.1 页面列表

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 落地页 | 一句 slogan + "开始写你的故事" + 示例章节轮播 |
| `/onboarding` | 建档向导（5 步） | 见 7.2 |
| `/reveal` | 未来自我揭晓 | 立绘翻牌动画 + 人格卡 + 第一封信 |
| `/season` | 故事进度（主页） | 三幕进度、当前章任务、迷雾封面 |
| `/today` | 今日记录 | 打卡 + 一句话 |
| `/chapter/[n]/interview` | 周末采访 | 3 问 |
| `/chapter/[n]` | 章节阅读器 | 漫画 + 正文 + 来信 |
| `/shelf` | 书架 | 所有章节 + 合集 |
| `/future` | 未来的你（P1 对话） | 人格卡 + 聊天 |

### 7.2 建档向导（5 步）

```
Step 1  你想在 90 天后成为谁？
        [ 大文本框：例如"一个能靠画画接单养活自己的人，每天早起画两小时……" ]
        [ 灵感标签：转行 / 健身 / 备考 / 创作 / 副业 / 自定义 ]

Step 2  描述那个"未来的你"
        - 她/他/TA 平时穿什么？在哪里生活？说话是什么风格？
        - 上传一张你的照片（可选，用于生成形象，原图生成后即删除）
        - 对未来的自己的称呼：[ 2027 年的林夏 ]

Step 3  是什么一直在阻止你？（反派素材）
        [ 多选 + 自由输入：拖延 / 刷手机 / 自我怀疑 / 没时间 / 怕被评价 ]

Step 4  你现在的情况
        - 每天能投入多少时间：[15分钟 | 30分钟 | 1小时 | 2小时+]
        - 现在的水平/起点（一句话）

Step 5  选择你的故事风格
        [ 🌸治愈绘本 ] [ ⚔️东方武侠 ] [ 🌃赛博都市 ]  （每个附示例插画）

        → [ 开始书写 ]  → 生成中动画（约 30–60 秒）："正在为你寻找未来……"
```

**生成中动画的设计要点**：生成等待是体验的一部分。分阶段显示文案："正在聆听你的愿望…""未来的你正在赶来…""世界正在成形…"，并**先流式显示人格卡文字**，图像到达后再翻牌，这样等待不会显得空。

### 7.3 未来自我揭晓页（情感高光）

```
┌─────────────────────────────┐
│      ✦ 2027年1月 · 林夏 ✦      │
│   ┌───────────────────┐     │
│   │                   │     │
│   │   [未来自我立绘]    │  ← 卡牌翻转动画
│   │                   │     │
│   └───────────────────┘     │
│  "颜色修补师"                 │
│  性格：温柔、笃定、有点倔       │
│  口头禅："先画，再说。"         │
│  她每天的样子：6点起床……       │
│ ─────────────────────────── │
│  ✉ 她给你写了第一封信  [展开]   │
│ ─────────────────────────── │
│  你的故事：《雾港颜色修补师》    │
│  第一幕·启程 ▸ 第一章即将开始   │
│        [ 查看我的路线图 ]       │
└─────────────────────────────┘
```

### 7.4 故事进度主页 `/season`

```
┌─────────────────────────────┐
│ 《雾港颜色修补师》 第一季        │
│ 启程 ████████░░ 试炼 ░░░ 蜕变 ░ │ ← 三幕进度条，当前在 Ch4
│─────────────────────────────│
│ 第 4 章 · 进行中  ★幕终章        │
│ 「灰雾第一次来袭」               │
│                             │
│  ┌───────────────┐          │
│  │ ░░▒▒[迷雾封面]▒▒░░ │ 迷雾已散去 60%│
│  └───────────────┘ 再完成2项看清  │
│                             │
│ 本章任务 3/5                   │
│ ☑ 完成 5 张人体速写      +剧情   │
│ ☑ 在小红书发布第一张作品          │
│ ☑ 研究 3 位插画师的定价          │
│ ☐ 联系 1 位潜在客户  ⚔Boss任务   │
│ ☐ 整理作品集首页                 │
│─────────────────────────────│
│ [ 📝 记录今天 ]  [ 📚 书架 ]     │
│ 距离本章完结：2 天  [结束本章 ▸]  │
└─────────────────────────────┘
```

### 7.5 章节阅读器 `/chapter/[n]`

结构自上而下：
1. **章节封面**（全宽插画 + 章节号 + 标题，入场动画：纸张展开）
2. **正文第 1 段** → **分镜格 1** → 正文第 2 段 → 分镜格 2 …… 图文交错，像条漫
3. 分镜格上叠加**对白气泡 / 旁白框**（HTML 渲染，中文清晰）
4. **「本章真实记录」折叠卡**：列出本章对应的真实行动（"本章取材自你的 7 条记录"），这是建立"这是我的故事"认同感的关键
5. **来自未来的信**（信纸样式，手写字体，可 TTS 朗读）
6. **下一章预告**：一句悬念 + 迷雾封面 + "下一章任务已就绪"按钮

### 7.6 周末采访 `/chapter/[n]/interview`

聊天式 UI，未来的你以头像出现，逐个提问（问题由 AI 根据本周数据生成）：
- "这周你完成了 5 张速写，哪一张画的时候你最想放弃？"
- "周四你写了'好累'，那天发生了什么？"
- "如果这一周是一部电影，最后一个镜头是什么？"

每题可语音/文字输入，可跳过。**回答会被原样引用进章节**，制造"被看见"的感觉。

---

## 8. AI 管线设计

### 8.1 模型选型（适配层设计，可替换）

| 用途 | 首选 | 国内备选 | 备注 |
|---|---|---|---|
| 文本（人格、路线图、章节） | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | DeepSeek / 通义千问（OpenAI 兼容接口） | 章节正文对文学质量要求高，优先选写作强的模型 |
| 快速小任务（采访问题、任务生成） | Claude Haiku 5.5 (`claude-haiku-5-5`) | 同上的小模型 | 低延迟 |
| 图像（立绘、分镜、封面） | Gemini 3.1 Flash Image (Nano Banana 2) 或 FLUX.2 | 豆包 Seedream 5.0 / 通义万相 | **必须支持参考图输入**，用来保持角色一致 |
| TTS（P1） | 任意中文 TTS | 火山 / 阿里云 TTS | 来信朗读 |

> **开赛第 1 小时必须完成**：用手上能拿到的 API Key 跑通 1 次文本 + 1 次"带参考图"的图像生成，确定最终组合。所有调用都经过 `lib/ai/text.ts` 与 `lib/ai/image.ts` 两个适配器，业务代码不直接依赖某家 SDK。

### 8.2 角色一致性方案（视觉的成败关键）

**问题**：每章 5 张图，13 章 65 张，主角必须一直是"同一个人"。

**方案：角色设定图 + 参考图注入 + 风格锁定**
1. 建档时生成**角色设定图 (Character Sheet)**：单张图里包含正面、3/4 侧面、全身，白底，指定风格。分别为「现在的你」和「未来的你」各生成一张。
   - 有自拍：自拍作为参考图，prompt 要求"保留面部特征，转为 {风格}"
   - 无自拍：仅用文字外貌描述
2. 设定图存储为可访问 URL，作为后续**所有**分镜生成的参考图（主角出场 → 带主角设定图；未来的你出场 → 带两张）。
3. **外貌锚点文本**：AI 从设定图描述中抽取固定外貌描述（`appearance_anchor`，如"齐肩黑色短发、圆框眼镜、芥末黄色围巾"），每次 prompt 都附带。标志性道具/配色是一致性最便宜的保障。
4. **风格后缀锁定**：每种文风有固定的 `style_suffix` 常量（见附录 C），所有图像 prompt 末尾统一拼接。
5. **图中永不出现文字**：prompt 统一加 "no text, no letters, no speech bubbles"。中文对白全部由前端叠加，避免出现乱码汉字。

### 8.3 管线一：建档生成

```
输入: 目标、未来画像、障碍、时间预算、起点、文风、[自拍]
  │
  ├─①[文本] 生成 FutureSelfProfile（人格卡 JSON）         ~8s
  ├─②[文本] 生成 StoryBible（世界观/角色/反派/片名）        ~10s   ← ①②可合并为一次调用
  │
  ├─③[图像] 未来自我设定图（参考：自拍）     ┐ 并行         ~15–30s
  ├─④[图像] 现在主角设定图（参考：自拍）     ┘
  │
  ├─⑤[文本] 生成 SeasonRoadmap（3幕13章+里程碑+第1周任务）   ~10s
  ├─⑥[文本] 第一封来自未来的信                              ~5s
  └─⑦[图像] 第 1 章迷雾封面
```

前端通过 SSE 订阅任务进度，逐项点亮。

### 8.4 管线二：章节生成（最核心）

**输入上下文组装（Context Builder）**
```
- StoryBible（世界观、角色、反派、文风、外貌锚点）
- 季度骨架 + 当前章在骨架中的位置（第几幕、是否幕终）
- 前情摘要：最近 3 章的 summary（每章生成时会产出 150 字摘要，用于压缩记忆）
- 未回收伏笔列表 foreshadowing[]
- 本周数据：任务列表与完成情况、每日记录（一句话+心情+照片描述）、完成度 r
- 周末采访问答
- 章节类型（高光/挣扎/低谷/休整，由 r 计算）
```

**分三步生成（保证结构可控 + 体验流畅）**

```
Step A [结构化, ~8s]  生成 ChapterPlan JSON
        - title, chapter_type, beats[4]（4个情节节拍）
        - real_events_mapping（真实事件 → 故事隐喻 的对照）
        - panels[4]：每格的画面描述 / 出场角色 / 对白 / 旁白
        - cover_prompt
        - cliffhanger, foreshadowing_add[], foreshadowing_resolve[]
        - summary（150 字，存入记忆）
        - next_week_quests[3-5]（下周任务建议）

Step B [流式, ~20s]   基于 ChapterPlan 流式生成正文 800–1200 字（4 段对应 4 个节拍）
        并行 →
Step C [图像, ~30s]   并行生成：封面 + 4 格分镜 + 下一章迷雾封面（共 6 张）
        并行 →
Step D [流式, ~5s]    来自未来的信（200–300 字）
```

前端体验：用户点击"生成"后，**封面先以占位渐变 + 标题出现**，正文开始像打字机一样流出，插画在各自位置淡入。总可感知等待约 5 秒，全部完成约 40 秒。

### 8.5 管线三：下周任务自适应

规则 + AI 混合：
- r ≥ 80%：难度 +1 级，可加入一个"挑战任务"
- 40–80%：保持难度，换掉未完成任务的表述（拆得更小）
- < 40%：任务数减到 3 个，每个 ≤ 15 分钟，加入一个"超小启动任务"（如"打开画板 5 分钟就算完成"）
- 每周保证 1 个任务直接推进下一个里程碑（标记为 ⚔ 关键任务，并与悬念绑定）

用户在建档时可自选**每周任务条数**（1–5 条，缺省 = 交给故事节奏 3–5 条）。自选条数优先于低谷压缩：任何完成度档位下都是最终条数上限；低谷档仍会强制全部低难度并保留超小启动任务（启动任务计入条数）。该选择贯穿首周任务、逐章生成的下周任务与手动替换三条路径。

AI 给出建议，用户在"确认下周任务"界面可以增删改。建档第 0 步支持 **AI 目标推荐**：输入几个关键词，POST /api/goal-suggestions 返回 3–4 个 90 天目标草稿，点选填入愿望栏后仍可自由编辑（`AI_SUGGEST_PROVIDER=real` 时走真实模型，不影响全局 mock）。

### 8.6 管线四：与未来的你对话（P1）

System prompt = 人格卡 + StoryBible 摘要 + 最近 3 章 summary + 本周进度。约束：用"我"说话，记得共同经历过的章节，不说教，回复 ≤ 120 字，每次回复最多给一个小建议。

### 8.7 安全护栏（写进所有 system prompt）

- 不美化极端节食、过度训练、熬夜等有害行为；检测到相关目标时改为健康表述
- 用户记录中出现自伤/危机信号时：停止故事化，显示温和的关怀文案与心理援助热线（如全国心理援助热线 400-161-9995、北京心理危机研究与干预中心 010-82951332）
- 未来自我**不承诺结果**（"你一定会年入百万"），只描述状态与习惯
- 照片只用于生成形象，生成后删除原图（隐私承诺写在上传按钮旁）

---

## 9. 数据模型

使用 SQLite + Drizzle ORM（黑客松单机部署最省事；上线可换 Postgres）。JSON 字段用 `text` 存储。

```ts
// users
id, nickname, created_at

// future_selves  —— 人格卡
id, user_id,
name,                  // "2027年的林夏"
title,                 // "颜色修补师"
profile_json,          // FutureSelfProfile（见附录 A）
appearance_anchor,     // 外貌锚点文本
sheet_future_url,      // 未来自我设定图
sheet_present_url,     // 现在主角设定图
selfie_deleted bool

// seasons  —— 一季 = 90 天路线图
id, user_id, future_self_id,
title,                 // 《雾港颜色修补师》
style,                 // healing | wuxia | cyber
story_bible_json,      // StoryBible（世界观/角色/反派/伏笔）
roadmap_json,          // 3幕13章骨架 + 里程碑
start_date, current_chapter int,
letter_to_future,      // 季初用户写给自己的信（季终揭晓）
status                 // active | finished

// quests  —— 本章任务
id, season_id, chapter_no,
text, difficulty(1-3), is_key bool,
done bool, done_at

// daily_logs  —— 场景素材
id, season_id, chapter_no, date,
note,                  // 一句话
mood(1-5),
photo_url, photo_caption   // 照片由视觉模型生成一句描述，供章节使用

// chapters
id, season_id, chapter_no,
status,                // locked | in_progress | generating | ready
chapter_type,          // highlight | struggle | low | rest
completion_rate real,
title,
plan_json,             // ChapterPlan（附录 B）
body_md,               // 正文
letter_md,             // 来自未来的信
summary,               // 150 字记忆摘要
cover_url,             // 本章封面（上一章生成时就已产出，即"迷雾封面"）
interview_json,        // [{q, a}]
generated_at

// panels
id, chapter_id, idx(0-3),
image_url, scene_desc,
dialogues_json,        // [{speaker, text, x, y}] 气泡位置
narration

// jobs  —— 异步任务进度（SSE 推送）
id, type, ref_id, status, progress_json, error, created_at
```

**状态机（chapters.status）**
```
locked ──(上一章 ready 后)──► in_progress ──(结束本章)──► generating ──► ready
                                  ▲                                │
                                  └────── 下一章变为 in_progress ◄───┘
```

---

## 10. 系统架构与技术栈

### 10.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | **Next.js 15 (App Router) + TypeScript** | 前后端一体，一个仓库、一次部署 |
| UI | Tailwind CSS + shadcn/ui + Framer Motion | 速度快；翻牌、纸张展开、迷雾动画 |
| 字体 | 霞鹜文楷（正文/信件）+ 站酷快乐体或类似字体（标题） | 书卷感、手写感 |
| 数据库 | SQLite + Drizzle | 零运维 |
| 文件存储 | 本地 `public/generated/` 或 OSS/R2 | 图像 API 往往需要公网 URL 作参考图，**部署时要用对象存储** |
| 异步 | 进程内 Promise 队列 + `jobs` 表 + SSE | 黑客松不引入 Redis |
| 部署 | Vercel（注意函数超时）或一台云服务器 + `next start` + pm2 | **推荐云服务器**：章节生成约 40 秒，Serverless 有超时风险 |

### 10.2 架构图

```
┌──────────── Browser (Mobile-first) ────────────┐
│ Onboarding │ Season │ Today │ Reader │ Shelf  │
└──────┬──────────────────────────▲──────────────┘
       │ fetch / Server Actions   │ SSE (job progress, text stream)
┌──────▼──────────────────────────┴──────────────┐
│              Next.js Route Handlers              │
│  /api/onboarding  /api/quests  /api/logs        │
│  /api/chapters/:n/interview  /generate  /stream │
│  /api/jobs/:id/events   /api/demo/*             │
├─────────────────────────────────────────────────┤
│  Domain Services                                 │
│  ContextBuilder · ChapterPipeline · QuestPlanner │
│  OnboardingPipeline · SafetyFilter               │
├─────────────────────────────────────────────────┤
│  AI Adapters: text.ts (stream/json) · image.ts   │
│  (Claude / DeepSeek / Qwen | NanoBanana / FLUX / │
│   Seedream)                                      │
├───────────────┬─────────────────────────────────┤
│ SQLite(Drizzle)│ Object Storage (images)         │
└───────────────┴─────────────────────────────────┘
```

### 10.3 目录结构

```
uworthbetter/
├─ app/
│  ├─ page.tsx                      # 落地页
│  ├─ onboarding/page.tsx
│  ├─ reveal/page.tsx
│  ├─ season/page.tsx
│  ├─ today/page.tsx
│  ├─ chapter/[n]/page.tsx          # 阅读器
│  ├─ chapter/[n]/interview/page.tsx
│  ├─ shelf/page.tsx
│  └─ api/
│     ├─ onboarding/route.ts
│     ├─ quests/[id]/route.ts
│     ├─ logs/route.ts
│     ├─ chapters/[n]/interview/route.ts
│     ├─ chapters/[n]/generate/route.ts
│     ├─ jobs/[id]/events/route.ts  # SSE
│     └─ demo/{seed,fast-forward}/route.ts
├─ lib/
│  ├─ ai/{text.ts,image.ts,prompts/*.ts,schemas.ts}
│  ├─ pipeline/{onboarding.ts,chapter.ts,quests.ts,context.ts}
│  ├─ db/{schema.ts,index.ts}
│  ├─ story/{styles.ts,skeleton.ts,chapterType.ts}
│  └─ safety.ts
├─ components/
│  ├─ FogCover.tsx                  # 迷雾封面
│  ├─ ComicPanel.tsx                # 分镜 + 气泡叠加
│  ├─ LetterCard.tsx
│  ├─ ActProgress.tsx
│  ├─ CharacterReveal.tsx
│  └─ StreamingText.tsx
├─ seed/demo-linxia.json            # 预置演示数据（含已生成图片）
└─ public/generated/
```

### 10.4 关键 API

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/onboarding` | 提交建档表单（multipart，含自拍），返回 `jobId` |
| GET | `/api/jobs/:id/events` | SSE：`{step, status, data}` |
| GET | `/api/season` | 当前季全部状态（路线图、当前章、任务、完成度） |
| PATCH | `/api/quests/:id` | 勾选/取消任务，返回新完成度 |
| POST | `/api/logs` | 每日记录（含照片） |
| POST | `/api/chapters/:n/interview` | 获取 3 个采访问题（GET）/ 提交回答（POST） |
| POST | `/api/chapters/:n/generate` | 触发章节生成，返回 `jobId` |
| GET | `/api/chapters/:n` | 章节内容 |
| PUT | `/api/chapters/:n/next-quests` | 用户确认下周任务 |
| POST | `/api/demo/seed` | 载入演示账号 |
| POST | `/api/demo/fast-forward` | 为当前章随机生成 5–7 条每日记录并勾选部分任务（可传 `rate` 指定完成度） |

### 10.5 迷雾封面实现

```tsx
// components/FogCover.tsx
const blur = Math.round(24 * (1 - rate));        // 24px → 0
const fogOpacity = 0.85 * (1 - rate);
<div className="relative overflow-hidden rounded-xl">
  <img src={coverUrl} style={{ filter: `blur(${blur}px) saturate(${0.4 + 0.6 * rate})`,
       transition: 'filter 1.2s ease' }} />
  <div className="absolute inset-0 bg-[url('/fog.png')] animate-drift"
       style={{ opacity: fogOpacity, transition: 'opacity 1.2s' }} />
  <span className="absolute bottom-2 right-3 text-xs">迷雾已散去 {Math.round(rate*100)}%</span>
</div>
```
勾选任务时迷雾散开 + 轻微粒子效果，这是一个**很适合现场演示的瞬间**。

> 防"开发者工具偷看"：完成度低于 100% 时，后端只返回一张预先模糊处理的缩略图（sharp 生成），完全清晰的原图在 r=100% 或章节生成后才下发。MVP 可跳过。

---

## 11. 黑客松执行计划（按 36–48 小时，4 人团队）

### 11.1 分工

| 角色 | 负责 |
|---|---|
| **A · AI 工程** | 适配器、所有 prompt、建档/章节管线、一致性调优 |
| **B · 全栈** | 数据库、API、SSE、任务/记录/采访流程、Demo 工具 |
| **C · 前端** | 建档向导、揭晓页、进度主页、阅读器、迷雾封面、动画 |
| **D · 产品/设计** | 视觉规范、示例素材、**提前生成演示数据**、路演 PPT 与视频、测试 |

（3 人团队：D 的职责由 A/C 分担，砍掉 P1）

### 11.2 时间线

| 时段 | 里程碑 | 产出 |
|---|---|---|
| H0–H2 | **技术验证** | 跑通文本 JSON 输出 + 参考图生图；定模型与文风；仓库脚手架 |
| H2–H8 | **骨架** | DB schema、建档向导 UI、建档管线（无动画）；D 定视觉稿 |
| H8–H14 | **主流程打通** | 路线图、任务勾选、每日记录、章节生成（先不加图） |
| H14–H20 | **图像接入** | 设定图 + 分镜 + 封面；阅读器图文排版；气泡叠加 |
| H20–H24 | **钩子与 Demo 工具** | 迷雾封面、时间快进、预置账号；**此时必须能完整演示一遍** ✅ |
| H24–H32 | **打磨** | 动画、生成中体验、prompt 质量迭代（逐章读并改）、错误降级 |
| H32–H40 | **P1 选做** | 与未来对话 / TTS / 分享卡（选 1–2 个） |
| H40–H46 | **冻结功能** | 演示数据最终版、彩排 3 次、录备用视频 |
| H46–H48 | 缓冲 | — |

**砍功能顺序**（时间不够时从上往下砍）：P1 全部 → 周末采访（改为固定问题）→ 现在主角设定图（只保留未来自我）→ 分镜从 4 格降为 2 格。**迷雾封面和章节生成不可砍。**

### 11.3 演示数据准备（D 在 H8 开始）

- 人物：林夏，目标"90 天成为能接单的插画师"，文风：治愈绘本
- 预先生成并人工挑选：设定图 ×2、第 1–3 章（含所有插画）、第 4 章迷雾封面
- 第 1 章高光章、第 2 章挣扎章、**第 3 章低谷章**（展示"失败也是故事"）
- 第 4 章（幕终 Boss 章）的任务和每日记录准备好，现场生成

---

## 12. 路演 Demo 脚本（3 分钟）

| 时间 | 画面 | 台词要点 |
|---|---|---|
| 0:00–0:20 | 黑屏 → 一组数据 | "92% 的新年计划会失败。不是因为我们不想变好，而是**未来的自己感觉像陌生人**。"（引用 Hershfield：大脑看待未来的自己，像在看另一个人） |
| 0:20–0:50 | 建档 → 揭晓页翻牌 | "林夏想成为插画师。她上传了一张照片，写下了理想的样子——这是 90 天后的她。" 展开第一封信 |
| 0:50–1:20 | 书架：第 1–3 章 | "她的 90 天变成了一部连载。"翻到**第 3 章低谷章**："那一周她几乎什么都没做。别的 App 会提醒她'断签了'，而在这里，这是故事里最动人的一章。" |
| 1:20–2:20 | **现场**：第 4 章主页 | 勾选最后 2 个任务 → **迷雾散开，封面清晰** → 结束本章 → 回答 1 个采访问题（可请评委代答）→ 正文流式出现，插画逐格淡入 → 读出"来自未来的信"中引用的那句真实回答 |
| 2:20–2:45 | 下一章预告 + 进度 | "她为了看下一章，会继续行动。这就是我们的借来的动机。" |
| 2:45–3:00 | 差异化 + 愿景 | "MyFutureSelf 让你和未来的自己聊天，**我们让你看着自己变成 TA**。" Roadmap：好友客串、季终合集 |

**备份**：现场网络/API 失败 → 立即切换到预先录好的同流程视频；同时 `/api/demo/fast-forward?cached=1` 可以直接载入预生成好的第 4 章，伪装成实时生成（流式效果由前端模拟）。

---

## 13. 风险与降级方案

| 风险 | 概率 | 应对 |
|---|---|---|
| 图像生成慢/失败 | 高 | 每张图 3 次重试 → 失败用文风渐变占位图 + 金句；分镜并行生成；Demo 用缓存 |
| 角色不一致 | 中 | 设定图 + 外貌锚点 + 标志性配饰；演示数据人工挑选；最坏情况下分镜改为"背影/剪影/远景"构图，降低对脸部一致性的依赖 |
| 图中出现乱码文字 | 中 | prompt 禁止文字；所有文字由前端叠加 |
| LLM JSON 格式错误 | 中 | 使用结构化输出/工具调用 + zod 校验 + 1 次自动修复重试 |
| 章节文笔像流水账 | 中 | 先出 plan 再写正文；few-shot 示范段落；要求"每段至少 1 个具体感官细节 + 1 处真实记录引用"；H24 后专人逐章调 prompt |
| 生成超时（Serverless） | 中 | 部署在云服务器；或拆成多个短请求，由前端串联 |
| API 额度/费用 | 低 | 单章约 6 张图 + 约 4 次文本调用；开发时用小模型与低分辨率 |
| 心理安全 | 低 | 安全护栏 + 危机关键词检测 |

---

## 14. 评分维度映射（写进 PPT）

| 常见评分项 | 我们的亮点 |
|---|---|
| 创新性 | 首个把"未来自我 + 个性化视觉连载 + 真实行动"结合的产品；"迷雾封面"机制 |
| 技术实现 | 多模态管线、跨章节记忆（Story Bible + 摘要 + 伏笔）、角色一致性方案、流式体验 |
| 用户价值 | 有研究依据（未来自我连续性、叙事疗法）；去羞耻化的失败处理 |
| 完成度 | 端到端可用，现场实时生成 |
| 商业潜力 | 订阅（更多文风/季/高清合集）、实体书印刷、企业/学校版（学期 = 一季） |

---

## 15. 商业化与后续（路演 1 页即可）

- **免费**：1 季、1 种文风、每章 2 格分镜
- **会员 ¥18/月**：全部文风、4 格 + 高清、未来对话、TTS
- **实体书**：季终合集印刷成漫画书（¥99，强情感价值，适合礼物）
- **B 端**：学校（学期计划）、企业（新员工 90 天成长故事）、健身房/教培机构联名
- **传播**：好友客串、章节分享卡片（"我的第 7 章"）

---

## 附录 A：数据结构（zod）

```ts
// lib/ai/schemas.ts
import { z } from 'zod';

export const FutureSelfProfile = z.object({
  name: z.string(),                 // "2027年的林夏"
  title: z.string(),                // "颜色修补师"（故事中的身份）
  real_identity: z.string(),        // "能稳定接单的自由插画师"
  personality: z.array(z.string()).max(4),   // ["温柔","笃定","有点倔"]
  catchphrase: z.string(),          // "先画，再说。"
  daily_routine: z.string(),        // 一段话描述 TA 的一天
  core_beliefs: z.array(z.string()).max(3),
  speaking_style: z.string(),       // "简短、温暖、偶尔开玩笑，叫你'小夏'"
  appearance: z.string(),           // 详细外貌（生成设定图用）
  appearance_anchor: z.string(),    // 一句话外貌锚点（每张分镜都附带）
  signature_item: z.string(),       // 标志性道具："一支总别在耳后的铅笔"
});

export const StoryBible = z.object({
  season_title: z.string(),         // 《雾港颜色修补师》
  logline: z.string(),              // 一句话故事
  world: z.string(),                // 世界观 150 字
  metaphor_map: z.array(z.object({  // 真实概念 → 故事隐喻
    real: z.string(), story: z.string() })),
  protagonist: z.object({ name: z.string(), appearance_anchor: z.string(),
                          start_state: z.string() }),
  mentor: z.object({ name: z.string(), role: z.string() }),  // 未来的你
  antagonist: z.object({ name: z.string(), embodies: z.string(),   // "灰雾" / 拖延+自我怀疑
                         tactics: z.array(z.string()) }),         // 反派常用手段（对应真实阻力）
  allies: z.array(z.object({ name: z.string(), desc: z.string() })).max(3),
  motifs: z.array(z.string()),      // 反复出现的意象：颜色、灯塔、铅笔
  foreshadowing: z.array(z.object({ id: z.string(), hint: z.string(),
                                    resolve_by_chapter: z.number() })),
});

export const SeasonRoadmap = z.object({
  acts: z.array(z.object({
    name: z.string(),               // "启程"
    real_goal: z.string(),          // "建立每日练习习惯，完成 20 张练习稿"
    milestone: z.string(),          // 可验证的里程碑
    chapters: z.array(z.object({
      no: z.number(), title: z.string(), beat: z.string(),
      real_focus: z.string(),       // 本周真实重点
    })),
  })).length(3),
  week1_quests: z.array(Quest).min(3).max(5),
});

export const Quest = z.object({
  text: z.string(),                 // 具体、可验证、≤ 每日时间预算
  difficulty: z.number().min(1).max(3),
  is_key: z.boolean(),              // 是否推进里程碑（与悬念绑定）
  story_hook: z.string(),           // "完成后：修复第一扇窗"
});
```

## 附录 B：ChapterPlan 结构

```ts
export const ChapterPlan = z.object({
  title: z.string(),
  chapter_type: z.enum(['highlight','struggle','low','rest']),
  real_events_mapping: z.array(z.object({
    real: z.string(),               // "周二完成第3张人体速写"
    story: z.string(),              // "修好了面包店的第三扇窗"
  })),
  beats: z.array(z.string()).length(4),
  panels: z.array(z.object({
    scene: z.string(),              // 画面描述（英文，给图像模型）
    characters: z.array(z.enum(['protagonist','mentor','antagonist','ally'])),
    shot: z.enum(['wide','medium','closeup','over_shoulder']),
    narration: z.string().optional(),       // 中文旁白框
    dialogues: z.array(z.object({ speaker: z.string(), text: z.string() })).max(2),
  })).length(4),
  cover_prompt: z.string(),
  interview_quote: z.string(),      // 必须原样引用的一句用户采访回答
  cliffhanger: z.string(),
  foreshadowing_add: z.array(z.object({ id: z.string(), hint: z.string(),
                                        resolve_by_chapter: z.number() })),
  foreshadowing_resolve: z.array(z.string()),
  summary: z.string(),              // 150 字
  next_cover_prompt: z.string(),    // 下一章封面（迷雾封面）
  next_week_quests: z.array(Quest).min(3).max(5),
});
```

## 附录 C：Prompt 模板

### C.1 文风常量

```ts
// lib/story/styles.ts
export const STYLES = {
  healing: {
    label: '治愈绘本',
    text_tone: '温柔、细腻、带童话感的第二人称叙事，短句，多用颜色与光影描写',
    style_suffix: 'soft watercolor storybook illustration, warm pastel palette, gentle light, ' +
      'hand-drawn texture, Studio-Ghibli-inspired atmosphere, no text, no letters, no speech bubbles',
  },
  wuxia: {
    label: '东方武侠',
    text_tone: '古风白话，节奏利落，带江湖气，适度用四字词，不晦涩',
    style_suffix: 'Chinese ink wash painting style, dramatic brush strokes, muted colors with red accents, ' +
      'cinematic composition, misty mountains, no text, no letters, no calligraphy, no speech bubbles',
  },
  cyber: {
    label: '赛博都市',
    text_tone: '冷峻、电影感、霓虹意象，内心独白多，偶尔幽默',
    style_suffix: 'cyberpunk anime illustration, neon lights, rainy night city, cinematic lighting, ' +
      'high detail, no text, no letters, no signs with writing, no speech bubbles',
  },
};
```

### C.2 建档：人格卡 + 故事圣经（合并调用）

```
【System】
你是「UworthBetter」的首席编剧兼人生规划师。你的任务是把一个普通人的成长目标，改编成一部以 TA 为主角的连载故事的设定。
原则：
1. 未来的自己必须真实可信：描述状态、习惯和信念，不承诺财富或名气。
2. 隐喻要和真实行动一一对应，读者能认出"这就是我"。
3. 反派是用户内在阻力的外化（叙事疗法），它永远是"问题"，而不是用户本人。
4. 如果目标涉及极端节食、过度训练等不健康内容，改写为健康版本。
5. 只输出符合 schema 的 JSON。

【User】
用户自述：
- 90 天后想成为：{goal}
- 未来的自己的样子：{future_desc}
- 称呼：{future_name}
- 阻碍：{obstacles}
- 每日可投入时间：{time_budget}
- 当前起点：{starting_point}
- 故事风格：{style.label}（语气：{style.text_tone}）
- 外貌参考：{selfie ? "见附图，请据此描述外貌" : appearance_text}

请输出 {"future_self": FutureSelfProfile, "story_bible": StoryBible}。
要求：season_title 4–8 字且有画面感；antagonist 的 tactics 至少 3 条，并分别对应用户的阻碍；
埋下 2 个伏笔，分别在第 7 章和第 13 章回收。
```

### C.3 设定图（图像）

```
Character turnaround reference sheet of {appearance}, {signature_item},
showing front view, three-quarter view and full body, neutral standing pose,
plain white background, consistent outfit, {style.style_suffix}
[若有自拍：Keep the facial features of the person in the reference photo, restyled as illustration.]
[现在的主角：same person but {start_state_visual}, simpler clothes, slightly tired but hopeful expression]
```

### C.4 路线图

```
【System】你是严谨的目标规划教练，同时也是编剧。把 90 天拆成 3 幕 13 周。
每幕的 real_goal 和 milestone 必须具体、可验证（数字/产出物）。
每周任务必须：动词开头、单次 ≤ {time_budget}、做完就能判断是否完成。
章节标题与 beat 遵循以下叙事骨架：{SKELETON}
【User】{future_self} {story_bible} {starting_point} {time_budget}
输出 SeasonRoadmap JSON。
```

### C.5 周末采访问题

```
【System】你是「{future_self.name}」，用 TA 的说话风格（{speaking_style}）向过去的自己提 3 个问题。
问题要具体引用本周的真实记录，帮助对方回忆细节和感受。不评判。每题 ≤ 30 字。
第 3 题固定为一个想象题（如"如果这周是一部电影，最后一个镜头是什么？"），可以换一种说法。
【User】本周任务完成：{quests}；每日记录：{logs}；完成度：{rate}
输出 {"questions": [string, string, string]}
```

### C.6 章节规划（Step A）

```
【System】
你是连载作家。根据主角这一周的真实生活，写出本周章节的规划。
硬性规则：
1. 章节类型 = {chapter_type}，基调：{TYPE_TONE[chapter_type]}
2. 本章在骨架中的位置：第{act}幕 第{n}章，节拍："{roadmap_beat}"{n in [4,9,13] ? "；这是幕终章，要有高潮" : ""}
3. real_events_mapping 至少覆盖 3 条真实记录；完成的任务对应故事里的进展，
   没完成的任务对应反派的阻挠（但不写成主角的错）。
4. interview_quote 必须从采访回答中原样摘取一句，并安排在故事的关键位置。
5. 未来的你（{mentor.name}）必须出场至少一次。
6. panels 的 scene 用英文写，具体描述构图、动作、表情、环境；每格都要写出主角的
   appearance_anchor："{anchor}"
7. 适时回收伏笔：{due_foreshadowing}
8. cliffhanger 与下周的关键任务呼应。
9. 低谷章必须在结尾出现"转折之光"，绝不责备主角。
输出 ChapterPlan JSON。

【User】
<story_bible>{story_bible}</story_bible>
<previously>{last_3_summaries}</previously>
<this_week>
任务：{quests_with_status}
每日记录：{logs}  // 例：[周二][心情4] "画完了第3张，手终于不抖了"（附照片：书桌上的速写本）
完成度：{rate}
采访：{interview_qa}
</this_week>
```

`TYPE_TONE`：
- highlight：明亮、有突破感，主角击退反派一次进攻，获得新能力/道具
- struggle：有拉锯，小胜与小挫交织，主角发现一个关键卡点
- low：主角被反派困住，氛围压抑但温柔；结尾未来的你出现或回忆闪回，点燃一束光
- rest：营地/港口休整，主角回忆初心，与盟友对话，为重新出发蓄力

### C.7 章节正文（Step B，流式）

```
【System】
你是 {style.label} 风格的作家。语气：{style.text_tone}。
用第二人称"你"讲述主角的故事（让读者以自我距离化的方式看自己），未来的你用名字称呼。
按 4 个节拍写 4 段，总计 800–1200 字。每段：
- 至少 1 个具体的感官细节
- 至少 1 处"真实时刻"：用自然的方式点出真实行动（如"那天夜里，你画完了第三张速写"）
- 段与段之间留出放插画的位置，用 <!--panel:0--> 到 <!--panel:3--> 标记
最后一段以悬念结尾：{cliffhanger}
禁止：说教、鸡汤式总结、"加油"、"相信自己"等空话。
【User】{chapter_plan}
```

### C.8 来自未来的信（Step D）

```
【System】
你是 {future_self.name}，{real_identity}。你正在给 90 天前的自己写信。
说话风格：{speaking_style}。口头禅：{catchphrase}（可以自然地用一次）。
200–300 字，像真的写信，有称呼和落款（落款带日期：{future_date}）。
必须：
- 提到 1 个本周的具体细节（优先用采访原话）
- 对应章节类型给出情感回应（高光：骄傲 / 挣扎：理解 / 低谷：陪伴，"我也经历过这一周"）
- 最多给 1 条具体、微小的建议
- 透露一点点"未来"的画面，但不剧透结果
禁止：责备、宏大承诺、列清单。
【User】{chapter_type} {key_moments} {interview_qa} {next_key_quest}
```

### C.9 分镜图像 prompt 拼接

```ts
function panelPrompt(panel, bible, style) {
  const who = panel.characters.map(c =>
    c === 'protagonist' ? `the protagonist (${bible.protagonist.appearance_anchor})` :
    c === 'mentor'      ? `the future self (${futureSelf.appearance_anchor}, ${futureSelf.signature_item})` :
    c === 'antagonist'  ? `the antagonist: ${bible.antagonist.name} visualized as an abstract force` : ''
  ).join(', ');
  return `${shotMap[panel.shot]} of ${who}. ${panel.scene}. ${style.style_suffix}`;
}
// 参考图：characters 中包含 protagonist → sheet_present_url；包含 mentor → sheet_future_url
// 第 4/9/13 章：主角参考图换成"进化版"立绘（P1）
```

---

## 附录 D：示例输出（用于对齐 prompt 质量）

**第 3 章 · 低谷章《灰雾漫进窗台》**（节选）

> 那一周，雾港下了七天的雨。
>
> 你的画板一直立在窗边，蒙了一层薄薄的灰。周二你写下"好累，什么都不想做"，那天的雾特别浓，浓到你看不清对面面包店那扇刚被你修好颜色的窗。
>
> 灰雾很擅长这种事。它不会大声嘲笑你，只是轻轻地说："明天再画吧。"然后明天就变成了下一个明天。
>
> <!--panel:2-->
>
> 周五深夜，你打开了画板，只画了一条线。一条歪歪扭扭的、不太像样的线。
>
> 但就在那条线落下的瞬间，窗台上那盆早就褪色的薄荷，叶尖亮起了一点点绿。
>
> 你没注意到。可是港口尽头的灯塔，在那一刻，闪了一下。

**来自未来的信**（节选）

> 小夏：
>
> 我知道这周你几乎没碰画笔，也知道你周四晚上盯着天花板，觉得自己又要放弃了。
>
> 我也经历过这一周。真的。
>
> 你说"只画了一条线，好像没什么意义"——可我现在还记得那条线。它是我们之间最细、也最结实的一根绳子。
>
> 下周只做一件事：每天打开画板 5 分钟。画不画都算数。
>
> 先画，再说。
>
> —— 2027 年 1 月，在洒满阳光的工作室里的林夏

---

## 附录 E：开发检查清单

- [ ] H2：文本 JSON + 参考图生图跑通，选定模型
- [ ] 适配器统一接口：`generateJSON(schema, messages)`、`streamText(messages)`、`generateImage({prompt, refs[], size})`
- [ ] zod 校验 + 失败自动修复重试
- [ ] 图像存储为公网可访问 URL
- [ ] SSE 进度推送 + 前端订阅组件
- [ ] 章节类型计算函数 + 单元测试（边界：0、40%、80%、100%、连续低谷）
- [ ] 迷雾封面组件 + 勾选任务时的动画
- [ ] 预置演示账号 + 快进接口 + 缓存模式
- [ ] 所有图像 prompt 带"no text"
- [ ] 安全护栏 + 危机关键词
- [ ] 移动端 430px 适配、扫码体验
- [ ] 备用演示视频

---

## 参考资料

- Hershfield et al. (2011). Increasing Saving Behavior Through Age-Progressed Renderings of the Future Self. https://www.dangoldstein.com/papers/Hershfield_Goldstein_et_al_Increasing_Saving_Behavior_Age_Progressed_Renderings_Future_Self.pdf
- Ersner-Hershfield et al. (2009). Individual differences in future self-continuity. https://www-apache.anderson.ucla.edu/faculty_pages/hal.hershfield/resources/Research/2009-Ersner-Hershfield.pdf
- Hershfield & Bartels (2018). The Future Self. https://home.uchicago.edu/bartels/papers/Hershfield-Bartels-2018-Chapter.pdf
- Rutchick et al. (2018). Future Self-Continuity Is Associated With Improved Health. https://anderson-review.ucla.edu/wp-content/uploads/2021/03/2018_Rutchick-Slepian-Reyes-Pleskus-Hershfield_JEPA.pdf
- Grekin et al. (2025). Effects of Future Self-Continuity Interventions: A Systematic Review. https://journals.sagepub.com/doi/10.1177/27000710251391610
- MyFutureSelf. https://myfutureself-website.vercel.app/
- Naavik: New Horizons in Habit-Building Gamification. https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/
- Deconstructor of Fun: How Finch Uses Gamified Widgets to Drive Retention. https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl
- Narrative Approaches: Externalizing Conversations. https://narrativeapproaches.com/making-trouble-for-problems-therapeutic-assumptions-and-research-behind-the-narrative-practice-of-externalizing-conversations/
- Character Consistency in AI Image APIs. https://apiframe.ai/guides/character-consistency-ai-image-api
- Consistent AI Character Generator: Test 5 Models (2026). https://tech-insider.org/consistent-ai-character-generator-test-2026/
