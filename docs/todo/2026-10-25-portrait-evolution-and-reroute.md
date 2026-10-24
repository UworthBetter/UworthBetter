# 待办：画像演化（E）与目标改道（R）

> 2026-10-25 · 来源：路演叙事讨论。路演网页（`/pitch`）把这两项当作**已实现功能**来讲，必须在路演前做到可演示。
> 核心立意：**目标是静态的，人是动态的。** 少做、照做、超额，未来画像都只**拟合**、不评判。

## 0. 先过契约（阻塞 E/R 全部任务）

按 CLAUDE.md 契约流程：群里说明 → 修改 → `pnpm contracts:lock` → commit 带 `[contract]`。AI 代理不得自行修改。
以下全部是**新增**（新表 / 可选字段 / 新 schema / 新可选方法），不破坏现有契约。

### 0.1 `lib/server/db/schema.ts` 新表 `portrait_snapshots`

| 列 | 类型 | 说明 |
|---|---|---|
| id | pk | |
| seasonId | text, FK seasons, cascade | |
| chapterNo | integer | 0 = 季初（建档时那张），1–13 = 该章结束后 |
| profile | json\<FutureSelfProfile\> | 拟合后的完整人格卡（沿用现有 schema） |
| imageUrl | text, 可空 | 拟合后的设定图；生成失败为 null |
| shift | json\<PortraitShift\> | 本次变化说明（见 0.2） |
| createdAt | createdAt() | |

唯一索引 `(seasonId, chapterNo)`。`future_selves` 保持不变，继续代表「季初画像」，避免改动现有读取逻辑。

### 0.2 `lib/contracts/ai.ts` 新增 schema

```ts
export const PortraitShift = z.object({
  direction: z.enum(["ahead", "on_track", "drift", "pivot"]), // 超额 / 照做 / 偏离 / 转向（R 用）
  headline: z.string().max(40),          // "她比预想中更早学会了拒绝"
  changedTraits: z.array(z.object({ from: z.string(), to: z.string() })).max(4),
  evidence: z.array(z.string()).min(1).max(3), // 引用的真实记录原文
});
```

### 0.3 `lib/contracts/aiTasks.ts` 新增**可选**方法

```ts
fitPortrait?(args: {
  prev: FutureSelfProfile; chapterNo: number; chapterType: ChapterType;
  completionRate: number; logs: LogForAI[]; interview: QA[];
}): Promise<{ profile: FutureSelfProfile; shift: PortraitShift }>;

replanRoadmap?(args: {
  bible: StoryBible; roadmap: SeasonRoadmap; fromChapter: number;
  newGoal: string; reason: string;
}): Promise<{ roadmap: SeasonRoadmap; bridgeNote: string }>;
```

### 0.4 `lib/contracts/api.ts` 新增

- `GET /api/portraits` → `{ snapshots: PortraitSnapshotView[] }`（按 chapterNo 升序）
- `SeasonView` 新增可选字段 `latestPortraitUrl?: string | null`
- `POST /api/season/reroute` 请求 `{ newGoal, reason }` → `{ jobId }`
- `seasons` 新增可空列 `goal_history_json`（`{ chapterNo, goal, reason }[]`）

---

## E · 画像演化

- [ ] **E1 [A] AI 任务 `fitPortrait`**：`lib/ai/tasks/textReal.ts` + `textMock.ts`。
  - 原则写进 system：只拟合不评判；`drift` 不等于变差，是「成为了另一种人」；禁止贬义词；`evidence` 必须引用真实记录。
  - `appearanceAnchor` 与 `signatureItem` 默认保持不变（保证角色一致性），只微调神态、服装、道具细节。
  - 用户记录用 XML 标签包裹。mock 返回确定性数据。
- [ ] **E2 [A] 画像重绘**：复用 `genCharacterSheet`，传入拟合后的 profile，加上上一张图作为参考。
- [ ] **E3 [B] 接入章节管线**：在 `lib/server/pipeline/chapter.ts` 的 `save` 步骤之后新增 `portrait` 步骤（新增 SSE step 名需要在 `events.ts` 加枚举值，也属于契约改动，0 步一并提）。失败不阻塞章节，只记录 null。
  - 频率：建议**每章**都更新文字画像，**每幕结束（第 4/9/13 章）+ 方向变化时**才重绘图片，以省额度。
- [ ] **E4 [B] 建档写入第 0 张快照**：`lib/server/pipeline/onboarding.ts` 完成时插入 chapterNo=0。
- [ ] **E5 [B] `GET /api/portraits`** + `tests/contract/routes.test.ts` 补用例。
- [ ] **E6 [C] 前端展示**：`/future` 页增加「画像演化」时间轴（季初 → 当前），每个节点显示 headline + evidence；章节阅读页末尾提示「未来的你变了一点」。
- [ ] **E7 [D] 演示数据**：在 `seed/demo-season.json` 顶层新增 `portraitSnapshots[]`，为林夏补齐第 **0–13** 章的快照，每项 `{ chapterNo, imageUrl, profile, shift }`，字段与 0.1、0.2 一致。图片至少要有 0、4、9、13 这四张（幕终），其余可以为 null。**路演网页直接读这份数据**，命运树的真实路径、季末画像都来自这里。
- [ ] **E8 [D] 路演专用分支画像**：额外生成 8–16 张「平行林夏」终点画像（同一锚点，不同 direction/气质），放在 `public/demo/branches/`，并配一份 `seed/pitch-branches.json`：`{ id, path: ("ahead"|"on_track"|"drift"|"pivot")[], imageUrl, headline }[]`。`path` 的长度固定为 13（第 1–13 周各一项），命运树按这些路径构建。只用于路演，不进产品。
  - 画面原则：偏离 / 转向的画像**气质不同，但同样好看**，不能变暗、变丑或改成灰度。

## R · 目标改道（目标变了 → 故事换路线）

- [ ] **R1 [B] 入口**：`POST /api/season/reroute`。允许在任意已完成章节之后发起；写入 `goal_history_json`；后续未开始的章节由 R2 重新规划，已生成章节保持不变。
- [ ] **R2 [A] AI 任务 `replanRoadmap`**：保留三幕情绪曲线和已埋伏笔；`bridgeNote` 是一段剧情过渡（「她在港口转身，走向另一条街」），用于下一章开头。
- [ ] **R3 [B] 重新生成后续任务**：根据新路线图重建 `quests`（当前章节起），并对当前画像快照写一条 `direction: "pivot"`。
- [ ] **R4 [C] 前端**：`/season` 增加「我的目标变了」入口（低调，不放主按钮）；番外·休整章末尾的「重新确认目标」直接链接到这里；路线图上标出改道节点。
- [ ] **R5 [D] 演示数据**：林夏在第 6 章附近发生一次轻度转向（例如从「接商单」转为「做个人绘本」），让路演网页的命运树和真实 App 能对上。

## 降级（时间不够时按顺序砍）

1. E 只做文字画像，图片只在幕终重绘
2. R 只做「休整章 → 重新确认目标 → 调整后续任务」，不重写路线图标题
3. R 整体放到 Roadmap 讲；E 必须保留（这是路演高潮）

## 和路演网页的接口约定

`/pitch` 只读两份静态数据：`seed/demo-season.json`（包括 E7 的快照）与 `seed/pitch-branches.json`（E8）。在它们就绪前，网页使用同结构的占位数据。
