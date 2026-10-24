# 路演网页 `/pitch` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Next 应用中新增 `/pitch` 路由：一个取代 PPT 的 18 场景大屏路演网页，含嵌入真实 App 的现场演示与「命运树 → 平行宇宙墙」画像演化高潮。

**Architecture:** `app/pitch/page.tsx`（服务端组件）静态导入 seed JSON，经适配器裁成 `PitchData` 传给客户端 `PitchDeck`。`PitchDeck` 持有 `{scene, beat}` 导航状态（纯 reducer），把 1920×1080 舞台等比缩放到视口，按场景注册表渲染场景组件。纯逻辑（导航、按键映射、hash、数据适配、树/墙布局）放 `components/pitch/model/` 并有 Vitest 单测；视觉用 Playwright 截图人工验收。

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 + `app/globals.css` 变量 · framer-motion 14（已装） · Vitest（node 环境，只测 `.ts`）

**Spec:** `docs/superpowers/specs/2026-10-25-pitch-page-design.md`（关联数据约定：`docs/todo/2026-10-25-portrait-evolution-and-reroute.md` §0.1、§0.2、E7、E8）

## Global Constraints

- 不新增依赖；`lib/contracts/`、`lib/server/db/schema.ts` 只读。
- 注释与 UI 文案简体中文；标识符英文；跨目录用 `@/`。
- 前端文件（`app/**/page.tsx`、`components/**`）不得导入 `node:*`、`@/lib/server`、`@/lib/ai`、`@/fixtures`（ESLint 强制）；seed 只能用 JSON 静态 import，且只在 `app/pitch/page.tsx` 中。
- 画布固定 1920×1080；主张 ≥72px，正文 ≥32px，注脚 ≥20px。
- 每屏最多一个主张；偏离/转向分支画像不得变暗、灰度、变丑（暗只表示「没走这条路」）。
- 除场景 10 外，所有场景断网可用（不请求接口、不加载外部资源）。
- 所有动画可被「下一步」打断并直接跳到终态。
- 改 `components/layout/*`（C 轨道）与 `lib/env.ts`、`app/api/chapters/[n]/generate/route.ts`（B 轨道）前，在群里打招呼。
- 每个任务结束前 `pnpm check` 通过。

## Review Focus

1. 焦点在 iframe 内、正在 App 输入框里打字（采访作答）时按空格/方向键 → 不翻页，文字正常输入。（Task 2 测 `shouldForwardKey`）
2. URL hash 被手改成非法值（`#99.9`、`#abc`、`#3.-1`）或刷新到 beat 超出该场景拍数 → 落到最近的合法位置，不崩溃。（Task 2 测 `parseHash`）
3. seed 中某章缺 `logs`/封面为 null、快照或分支画像 `imageUrl` 为 null → 适配器给出占位，页面渲染文风占位块而不是破图。（Task 1 测适配器）
4. 动画进行中连续快速按「下一步」→ 每次只前进一拍、直接跳终态，不叠加、不跳过拍。（Task 3 在 reducer 层测连续 dispatch；Task 8 人工验收）
5. 在场景 0 按「上一步」/ 在场景 17 末拍按「下一步」→ 停在边界不越界。（Task 2 测 reducer）

---

## 文件结构

```
app/pitch/page.tsx                    服务端：导入 seed → toPitchData → <PitchDeck data>
app/pitch/notes/page.tsx              P1：演讲者备注窗口
components/pitch/
  model/types.ts                      PitchData 等类型（数据形状唯一来源）
  model/adapter.ts                    seed JSON → PitchData；占位兜底
  model/placeholder.ts                E7/E8 未就绪时的同结构占位
  model/nav.ts                        场景拍数表、reducer、hash、按键映射
  model/fateTree.ts                   命运树布局（纯函数）
  model/wall.ts                       平行宇宙墙布局（纯函数）
  PitchDeck.tsx                       客户端：导航状态、键盘、hash 同步、进度条
  Stage.tsx                           1920×1080 等比缩放容器 + 黑场
  scenes/index.tsx                    SCENES 注册表（组件 + 拍数 + 备注）
  scenes/Scene00Title.tsx … Scene17End.tsx
  ui/Portrait.tsx                     带 null 占位的画像
  ui/Puzzle.tsx                       研究段落的拼图块
tests/pitch/nav.test.ts · adapter.test.ts · fateTree.test.ts · wall.test.ts
components/layout/MobileShell.tsx     改：/pitch 直出 children
components/layout/AppChrome.tsx       改：/pitch 直出；embed 模式隐藏 DemoPanel
lib/env.ts · app/api/chapters/[n]/generate/route.ts   改：DEMO_CACHED_GENERATE
```

---

### Task 1: 数据类型、适配器与占位数据

**Files:**
- Create: `components/pitch/model/types.ts`, `components/pitch/model/adapter.ts`, `components/pitch/model/placeholder.ts`
- Test: `tests/pitch/adapter.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Direction = "ahead" | "on_track" | "drift" | "pivot";
  export type PitchChapter = { no: number; title: string; chapterType: "highlight"|"struggle"|"low"|"rest";
    coverUrl: string | null; panelUrl: string | null; letterQuote: string; logQuotes: string[] };
  export type PitchSnapshot = { chapterNo: number; imageUrl: string | null; headline: string;
    direction: Direction; evidence: string[] };
  export type PitchBranch = { id: string; path: Direction[]; imageUrl: string | null; headline: string };
  export type PitchData = { seasonTitle: string; logline: string;
    sheets: { present: string | null; future: string | null };
    persona: { name: string; title: string; catchphrase: string }; firstLetterQuote: string;
    chapters: PitchChapter[];        // 恒为 13 项，按 no 升序
    snapshots: PitchSnapshot[];      // 恒为 14 项（0–13）
    branches: PitchBranch[];         // ≥ 8 项，每项 path.length === 13
    team: { name: string; role: string }[]; siteUrl: string };
  export function toPitchData(season: unknown, branches?: unknown): PitchData;
  export function directionOf(t: PitchChapter["chapterType"]): Direction;
  export const PLACEHOLDER_BRANCHES: PitchBranch[];  // placeholder.ts
  ```

- [ ] **Step 1: 写失败测试 `tests/pitch/adapter.test.ts`**

  ```ts
  import seed from "@/seed/demo-season.json";
  it("真实 seed 产出 13 章、14 快照", () => {
    const d = toPitchData(seed);
    expect(d.chapters).toHaveLength(13);
    expect(d.snapshots.map((s) => s.chapterNo)).toEqual([...Array(14).keys()]);
    expect(d.seasonTitle).toBe("雾港颜色修补师");
  });
  it("无 portraitSnapshots 时按 chapterType 映射 direction", () => {
    const d = toPitchData(seed);
    expect(d.snapshots[3].direction).toBe(directionOf(d.chapters[2].chapterType)); // 第 3 章 low → drift
    expect(directionOf("highlight")).toBe("ahead");
    expect(directionOf("struggle")).toBe("on_track");
    expect(directionOf("rest")).toBe("drift");
  });
  it("有 portraitSnapshots 时优先用其 shift.direction 与 headline", () => { /* 构造 seed 副本加 portraitSnapshots[5].shift.direction="pivot"，断言 snapshots[5].direction==="pivot" */ });
  it("缺字段不抛错：封面 null、logs 缺失、imageUrl null", () => {
    const broken = structuredClone(seed); broken.chapters[0].cover = null; delete broken.chapters[1].logs;
    const d = toPitchData(broken);
    expect(d.chapters[0].coverUrl).toBeNull(); expect(d.chapters[1].logQuotes).toEqual([]);
  });
  it("未传 branches 用占位，每条 path 长 13", () => {
    const d = toPitchData(seed);
    expect(d.branches.length).toBeGreaterThanOrEqual(8);
    d.branches.forEach((b) => expect(b.path).toHaveLength(13));
  });
  it("branches 中 path 长度不为 13 的条目被丢弃", () => { /* 传 [{id:"x",path:["ahead"],imageUrl:null,headline:""}] + 合法项，断言只剩合法项 */ });
  it("完全非法输入（null）回落到占位数据而不抛错", () => { expect(toPitchData(null).chapters).toHaveLength(13); });
  ```

- [ ] **Step 2: 运行 `pnpm vitest run tests/pitch/adapter.test.ts`**，Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 types.ts / adapter.ts / placeholder.ts**
  - 适配器用宽松读取（zod `safeParse` 逐字段 `.catch()`），不信任输入；`persona` 与 `firstLetterQuote` 从 seed 取不到时用 placeholder（seed 当前无人格卡，取 `fixtures` 是前端禁止的 → 在 placeholder.ts 手写林夏人格：`{ name: "2027年的林夏", title: "颜色修补师", catchphrase: TODO(团队) }`）。
  - seed 章节字段（已核实）：`no, chapterType, title, cover, panels: string[]`（图片 URL 或 null）`, logs[].note, letterMd, plan.interviewQuote`。`panelUrl` = `panels[1] ?? panels[0] ?? null`。
  - `letterQuote` 取 `letterMd` 中第一句含「我」的句子，截 ≤40 字；`logQuotes` 取 `logs[].note` 前 3 条。
  - 无快照时：第 0 张 imageUrl = `sheets.future`，headline 用章节标题，evidence 用 `logQuotes[0]`。
  - `PLACEHOLDER_BRANCHES`：12 条，imageUrl 全为 `/demo/sheet-future.jpg`，path 用确定性伪随机（固定种子）生成，其中一条与真实路径相同。`team` 占位 3 人，`siteUrl` 占位 `"https://TODO"`。

- [ ] **Step 4: 运行同一测试**，Expected: PASS。

- [ ] **Step 5: Commit** `feat(pitch): data model and seed adapter`

---

### Task 2: 导航模型（reducer / hash / 按键）

**Files:**
- Create: `components/pitch/model/nav.ts`
- Test: `tests/pitch/nav.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Pos = { scene: number; beat: number };
  export type NavAction = { type: "next" } | { type: "prev" } | { type: "goto"; pos: Pos } | { type: "home" } | { type: "end" };
  export function navReducer(beats: readonly number[], pos: Pos, a: NavAction): Pos; // beats[i] = 场景 i 的拍数（≥1）
  export function formatHash(p: Pos): string;               // "#11.3"
  export function parseHash(h: string, beats: readonly number[]): Pos; // 非法 → 夹紧到合法范围；完全无法解析 → {0,0}
  export type KeyCommand = "next" | "prev" | "home" | "end" | "fullscreen" | "black" | "video" | "notes" | null;
  export function keyToCommand(key: string): KeyCommand;
  export function shouldForwardKey(key: string, target: { tagName: string; isContentEditable: boolean } | null): boolean;
  ```

- [ ] **Step 1: 写失败测试**

  ```ts
  const B = [1, 3, 2];
  it("next 先推进拍，再进场景", () => {
    expect(navReducer(B, {scene:1,beat:0}, {type:"next"})).toEqual({scene:1,beat:1});
    expect(navReducer(B, {scene:1,beat:2}, {type:"next"})).toEqual({scene:2,beat:0});
  });
  it("prev 回到上一场景的最后一拍", () => expect(navReducer(B,{scene:2,beat:0},{type:"prev"})).toEqual({scene:1,beat:2}));
  it("边界不越界", () => {
    expect(navReducer(B,{scene:0,beat:0},{type:"prev"})).toEqual({scene:0,beat:0});
    expect(navReducer(B,{scene:2,beat:1},{type:"next"})).toEqual({scene:2,beat:1});
  });
  it("连续 5 次 next 恰好逐拍前进", () => { let p={scene:0,beat:0}; for(let i=0;i<5;i++) p=navReducer(B,p,{type:"next"}); expect(p).toEqual({scene:2,beat:1}); });
  it("hash 往返", () => expect(parseHash(formatHash({scene:1,beat:2}), B)).toEqual({scene:1,beat:2}));
  it.each([["#99.9",{scene:2,beat:1}],["#1.9",{scene:1,beat:2}],["#3.-1",{scene:2,beat:0}],["#abc",{scene:0,beat:0}],["",{scene:0,beat:0}]])
    ("parseHash(%s) 夹紧", (h, e) => expect(parseHash(h, B)).toEqual(e));
  it("按键映射", () => {
    for (const k of ["ArrowRight","ArrowDown"," ","PageDown","Enter"]) expect(keyToCommand(k)).toBe("next");
    for (const k of ["ArrowLeft","ArrowUp","PageUp"]) expect(keyToCommand(k)).toBe("prev");
    expect(keyToCommand("f")).toBe("fullscreen"); expect(keyToCommand("b")).toBe("black");
    expect(keyToCommand("v")).toBe("video"); expect(keyToCommand("s")).toBe("notes"); expect(keyToCommand("x")).toBeNull();
  });
  it("输入框中不转发", () => {
    expect(shouldForwardKey(" ", {tagName:"TEXTAREA",isContentEditable:false})).toBe(false);
    expect(shouldForwardKey("ArrowRight", {tagName:"INPUT",isContentEditable:false})).toBe(false);
    expect(shouldForwardKey("ArrowRight", {tagName:"DIV",isContentEditable:true})).toBe(false);
    expect(shouldForwardKey("ArrowRight", {tagName:"BUTTON",isContentEditable:false})).toBe(true);
    expect(shouldForwardKey("f", {tagName:"BUTTON",isContentEditable:false})).toBe(false); // 只转发翻页类
  });
  ```

- [ ] **Step 2: 运行 `pnpm vitest run tests/pitch/nav.test.ts`**，Expected: FAIL。
- [ ] **Step 3: 实现 `nav.ts`**（`shouldForwardKey` 只对 `next`/`prev` 命令返回 true，且 target 为 INPUT/TEXTAREA/SELECT 或 contentEditable 时为 false）。
- [ ] **Step 4: 运行测试**，Expected: PASS。
- [ ] **Step 5: Commit** `feat(pitch): navigation model`

---

### Task 3: 舞台骨架、布局绕开、键盘与 hash

**Files:**
- Create: `app/pitch/page.tsx`, `components/pitch/PitchDeck.tsx`, `components/pitch/Stage.tsx`, `components/pitch/scenes/index.tsx`, `components/pitch/ui/Portrait.tsx`
- Modify: `components/layout/MobileShell.tsx`, `components/layout/AppChrome.tsx`

**Interfaces:**
- Consumes: Task 1 `toPitchData`, `PitchData`；Task 2 全部导出。
- Produces:
  ```ts
  // scenes/index.tsx
  export type SceneProps = { data: PitchData; beat: number; active: boolean };
  export type SceneDef = { id: string; title: string; beats: number; dark: boolean; notes: string;
    Component: React.ComponentType<SceneProps> };
  export const SCENES: SceneDef[];            // 18 项，本任务先全部用 <PlaceholderScene> 占位
  // ui/Portrait.tsx
  export function Portrait(p: { src: string | null; alt: string; size: number; className?: string }): JSX.Element; // src 为 null 显示文风渐变占位
  ```

- [ ] **Step 1: 布局绕开**：`MobileShell` 与 `AppChrome` 中 `usePathname()?.startsWith("/pitch")` 时直接返回 `children`。`AppChrome`：`useSearchParams().get("embed")==="1"` 时 `sessionStorage.setItem("uwb-embed","1")`；读到该键时不渲染 `<DemoPanel />`（`useSearchParams` 需要 Suspense 边界，按 Next 16 文档 `node_modules/next/dist/docs/` 处理）。
- [ ] **Step 2: `Stage`**：外层 `position:fixed; inset:0; background:#000`，内层 1920×1080 绝对定位，`transform: scale(min(vw/1920, vh/1080))` 居中；监听 `resize`。`black` 为 true 时覆盖纯黑层。
- [ ] **Step 3: `PitchDeck`**：`useReducer(navReducer)`，初值 `parseHash(location.hash)`（在 effect 中读，避免水合不一致）；每次 pos 变化 `history.replaceState(null,"",formatHash(pos))`；`window` keydown → `keyToCommand`；`fullscreen` 调 `document.documentElement.requestFullscreen()`/`exitFullscreen()`。底部 6px 进度条，悬停展开为场景标题列表，点击 `goto`。场景切换用 framer-motion `AnimatePresence` 淡入淡出（300ms）。
- [ ] **Step 4: `app/pitch/page.tsx`**：`import seed from "@/seed/demo-season.json"`；`export const metadata = { title: "UworthBetter · 路演" }`；渲染 `<PitchDeck data={toPitchData(seed)} />`。branches 暂不传（Task 1 占位）。
- [ ] **Step 5: 人工验证**：`pnpm dev`，Playwright 打开 `/pitch`，在 1920×1080、1366×768、2560×1440 三个视口截图：无手机外框、无 TabBar/DemoPanel、画布居中留黑边。按 → 推进、刷新后停留原位、`#99.9` 被夹紧。打开 `/season?embed=1` 确认 DemoPanel 不显示，再进入 `/today` 仍不显示；打开 `/season`（新标签）DemoPanel 正常显示。
- [ ] **Step 6: `pnpm check`** → 全部通过。
- [ ] **Step 7: Commit** `feat(pitch): stage, deck navigation and layout bypass`

---

### Task 4: 场景 0–7（开场 + 研究推理链 + 汇合）

**Files:**
- Create: `components/pitch/scenes/Scene00Title.tsx` … `Scene07Converge.tsx`, `components/pitch/ui/Puzzle.tsx`
- Modify: `components/pitch/scenes/index.tsx`（替换 0–7 的占位）

**Interfaces:**
- Consumes: Task 3 `SceneProps`、`SceneDef`。
- Produces: `Puzzle({ index: 0|1|2|3, lit: boolean, label: string })`——四块拼图共享一个固定排布，场景 3–6 依次点亮，场景 7 合拢。

拍数与文案（spec §6 原文为准，`TODO(团队)` 保留为可见占位）：

| 场景 | dark | beats | 每拍内容 |
|---|---|---|---|
| 0 标题 | ✓ | 1 | Logo「UWORTHBETTER」+「把你的 90 天，写成一部你会追更的连载」 |
| 1 问题 | ✓ | 2 | ① 「你在第 1 天写下的目标，」② 「到第 90 天，还是你想要的吗？」 |
| 2 三种人 | ✓ | 4 | ①忘了 ②懒了 ③超额完成（每卡一句 `TODO(团队)` 原话）④「打卡 App 只认识其中一种人」+ 角落「常被引用的统计：92% 的新年计划未能坚持」 |
| 3 陌生人 | ✓ | 3 | ①问题「为什么会放弃？」②Hershfield：想到未来的自己，大脑反应像在想陌生人 ③落点「要让未来的你被看见」+ 拼图 0 亮 |
| 4 看见与对话 | ✓ | 3 | ①老化照片实验 ②Rutchick 2018 写信 ③「未来画像 + 来自未来的信」+ 拼图 1 亮 |
| 5 借来的动机 | ✓ | 3 | ①Finch D1≈60% 大数字 ②Zombies, Run! ③「为了看下一章」+ 拼图 2 亮 |
| 6 故事可以重写 | ✓ | 3 | ①White & Epston 问题外化 ②重写人生故事 ③「偏离也是剧情，故事一直在被重写」+ 拼图 3 亮 |
| 7 汇合 | ✓ | 3 | ①四块拼图飞向中心合成 Logo ②一句话简介 ③核心循环环形图（建档→每周任务→每日记录→周末章节→画像拟合→下一章） |

- [ ] **Step 1: 实现 `Puzzle` 与场景 0–3**，每拍元素用 `motion` 的 `animate={beat >= k ? "on" : "off"}`；`active` 为 false 时直接取终态（满足「可打断跳终态」）。
- [ ] **Step 2: 实现场景 4–7**。
- [ ] **Step 3: 人工验证**：1920×1080 逐拍截图，检查字号下限（主张 ≥72px）、每屏一个主张、断网（DevTools offline）下全部正常；快速连按 → 不出现叠影。
- [ ] **Step 4: `pnpm check`** → 通过。
- [ ] **Step 5: Commit** `feat(pitch): opening and research chain scenes`

---

### Task 5: 场景 8–9（林夏、书架与低谷章）

**Files:**
- Create: `components/pitch/scenes/Scene08Linxia.tsx`, `Scene09Shelf.tsx`
- Modify: `components/pitch/scenes/index.tsx`

**Interfaces:**
- Consumes: `PitchData.sheets/persona/firstLetterQuote/chapters`，`Portrait`。

| 场景 | dark | beats | 每拍 |
|---|---|---|---|
| 8 林夏 | ✗（纸色） | 3 | ①`sheets.present` ②翻转为 `sheets.future`（rotateY）③人格卡三要点 + `firstLetterQuote` |
| 9 书架 | ✗ | 3 | ①13 本书：1–3 封面、4 迷雾（`blur(24px)`）、5–13 锁定 ②镜头推近第 3 章 ③第 3 章 `panelUrl` + `letterQuote` + 「失败也是故事」 |

- [ ] **Step 1: 实现两场景**；所有图片经 `Portrait`/同等 null 占位；用 `<img>` 而非 `next/image`（静态本地资源，避免优化服务在断网/服务器上的额外依赖）。
- [ ] **Step 2: 人工验证**：截图；把 `toPitchData` 输入中第 3 章封面改为 null 再看一次，确认占位块正常。
- [ ] **Step 3: `pnpm check`** → 通过。
- [ ] **Step 4: Commit** `feat(pitch): linxia and shelf scenes`

---

### Task 6: 场景 10 现场演示 + 缓存生成开关

**Files:**
- Create: `components/pitch/scenes/Scene10Live.tsx`
- Modify: `components/pitch/scenes/index.tsx`, `components/pitch/PitchDeck.tsx`, `lib/env.ts`, `app/api/chapters/[n]/generate/route.ts`, `.env.example`
- Test: `tests/contract/routes.test.ts`（只需确认现有用例仍通过）

**Interfaces:**
- Consumes: `api.demo.seed()`、`api.demo.fastForward({ chapter })`（`lib/client/api.ts`）；Task 2 `shouldForwardKey`。
- Produces: `PitchDeck` 增加 `registerFrame(win: Window | null)`，经 React context 提供给场景 10；`export const DEMO_START_CHAPTER = 4;`（`Scene10Live.tsx`）。

- [ ] **Step 1: 缓存开关（B 轨道文件）**：`lib/env.ts` 新增 `DEMO_CACHED_GENERATE`（与 `DEMO_MODE` 同样的布尔解析，默认 false）；generate route 改为 `startChapter(season, n, env.DEMO_MODE && env.DEMO_CACHED_GENERATE)`；`.env.example` 加 `DEMO_CACHED_GENERATE=1` 并注释「路演：现场生成走预生成章节回放」。
- [ ] **Step 2: `pnpm test`** → 现有 routes 测试全部通过（默认 false，行为不变）。
- [ ] **Step 3: 场景 10 组件**（纸色，beats = 5）：左侧手机外框（430×932，复用 `.device` 视觉但自绘，放大 1.05），内嵌 `<iframe src="/season?embed=1">`，**首次 active 时才挂载**、之后保持挂载；右侧字幕按拍：①「她的第 4 周」②「勾选最后的任务」③「迷雾散开」④「回答一个采访问题」⑤「故事流式写出，插画逐格出现」（字幕常量集中在文件顶部，便于演示流程定稿后修改）。左下角悬停才可见的「重置演示」：`await api.demo.seed(); await api.demo.fastForward({ chapter: DEMO_START_CHAPTER }); iframe 重新加载`，失败显示错误文本。
- [ ] **Step 4: iframe 按键转发**：iframe `onLoad` 时 `registerFrame(iframe.contentWindow)`；`PitchDeck` 在该 window 上挂 keydown，`shouldForwardKey(e.key, e.target)` 为真则 `preventDefault` 并 dispatch；每次 iframe 内导航都会重新触发 onLoad，需先移除旧监听。
- [ ] **Step 5: 备用视频**：场景 10 内 `video` 命令切换显示 `<video src="/pitch/backup-demo.mp4" controls autoPlay>`；`onError` 时显示「备用视频未放置：public/pitch/backup-demo.mp4」，不抛错。
- [ ] **Step 6: 人工验证**（本地 `.env.local` 设 `DEMO_MODE=1`、`DEMO_CACHED_GENERATE=1`）：点重置 → iframe 中林夏在第 4 周；点进 iframe 后按 → 字幕推进；在采访输入框打空格/方向键只输入文字不翻页；走完勾任务 → 迷雾散开 → 采访 → 生成，生成为缓存回放（无真实 API 调用，看服务端日志）；按 V 切视频。
- [ ] **Step 7: `pnpm check`** → 通过。
- [ ] **Step 8: Commit** `feat(pitch): live demo scene with embedded app and cached generation flag`

---

### Task 7: 命运树布局（纯函数）

**Files:**
- Create: `components/pitch/model/fateTree.ts`
- Test: `tests/pitch/fateTree.test.ts`

**Interfaces:**
- Consumes: `PitchBranch`、`Direction`（Task 1）。
- Produces:
  ```ts
  export type TreeNode = { id: string; depth: number; x: number; y: number; direction: Direction | null; real: boolean; decorative: boolean };
  export type TreeEdge = { from: string; to: string; real: boolean; decorative: boolean };
  export type FateTree = { nodes: TreeNode[]; edges: TreeEdge[]; leaves: { nodeId: string; branchId: string | null }[]; realPath: string[] };
  export function buildFateTree(realPath: Direction[], branches: PitchBranch[], opts: { width: number; height: number; decorativeSeed: number; decorativeCount: number }): FateTree;
  ```
  节点 id 为路径前缀串（根为 `"r"`，如 `"r.ahead.drift"`），从而相同前缀自动合并。depth 0–13；x 按 depth 等分 `width`；y 由叶子顺序自底向上取子节点均值。真实路径作为一条 branch（`branchId: null`）参与合并。装饰分支用固定种子在随机深度上长出 1–3 层，`decorative: true`，不产生 leaves。

- [ ] **Step 1: 写失败测试**

  ```ts
  const real: Direction[] = Array(13).fill("on_track");
  const br = (id: string, path: Direction[]) => ({ id, path, imageUrl: null, headline: "" });
  it("共享前缀合并为同一节点", () => {
    const t = buildFateTree(real, [br("a", [...real.slice(0,5), ...Array(8).fill("ahead")])], OPTS);
    expect(t.nodes.filter((n) => n.depth === 3)).toHaveLength(1);
    expect(t.nodes.filter((n) => n.depth === 6 && !n.decorative)).toHaveLength(2);
  });
  it("realPath 有 14 个节点且全部 real", () => { const t = buildFateTree(real, [], OPTS); expect(t.realPath).toHaveLength(14); expect(t.realPath.every((id) => t.nodes.find((n) => n.id === id)!.real)).toBe(true); });
  it("每条非装饰分支对应一个叶子", () => { const t = buildFateTree(real, BRANCHES12, OPTS); expect(t.leaves.filter((l) => l.branchId).length).toBe(new Set(BRANCHES12.map((b) => b.path.join())).size - (BRANCHES12.some((b) => b.path.join() === real.join()) ? 1 : 0)); });
  it("x 随 depth 单调递增、节点坐标在画布内", () => { const t = buildFateTree(real, BRANCHES12, OPTS); for (const n of t.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x).toBeLessThanOrEqual(OPTS.width); expect(n.y).toBeGreaterThanOrEqual(0); expect(n.y).toBeLessThanOrEqual(OPTS.height); } });
  it("同种子结果确定", () => expect(buildFateTree(real, BRANCHES12, OPTS)).toEqual(buildFateTree(real, BRANCHES12, OPTS)));
  it("同 depth 的叶子 y 不重叠（间距 ≥ 8）", () => { /* 取 depth 13 节点 y 排序，相邻差 ≥ 8 */ });
  ```

- [ ] **Step 2: 运行**，Expected: FAIL。
- [ ] **Step 3: 实现 `buildFateTree`**。
- [ ] **Step 4: 运行**，Expected: PASS。
- [ ] **Step 5: Commit** `feat(pitch): fate tree layout`

---

### Task 8: 场景 11 画像演化（树 → 墙 → 收拢 → 对照）

**Files:**
- Create: `components/pitch/model/wall.ts`, `components/pitch/scenes/Scene11Evolution.tsx`
- Modify: `components/pitch/scenes/index.tsx`
- Test: `tests/pitch/wall.test.ts`

**Interfaces:**
- Consumes: Task 7 `buildFateTree`；`PitchData.snapshots/branches`；`Portrait`。
- Produces:
  ```ts
  export type WallCell = { x: number; y: number; size: number; src: string | null; variant: { flip: boolean; hue: number; crop: number }; real: boolean; delay: number };
  export function buildWall(sources: (string | null)[], realSrc: string | null, opts: { width: number; height: number; count: number; seed: number }): WallCell[];
  ```
  `variant.hue` 取值 ∈ [-25, 25]（仅轻微色调变化，**禁止灰度与降亮度**）；恰好一个 `real: true` 的格子，位于画布中央附近；`delay` 用于逐个熄灭顺序（离中心越远越先熄）。

- [ ] **Step 1: 写 wall 失败测试**：`count` 个格子；恰好 1 个 `real`；real 格中心距画布中心 < width/6；所有 `hue` ∈ [-25,25]；所有格子在画布内且互不重叠；`delay` 与到中心距离负相关（最远者 delay 最小）；同 seed 结果确定。
- [ ] **Step 2: 运行 `pnpm vitest run tests/pitch/wall.test.ts`** → FAIL；**Step 3: 实现**；**Step 4: 运行** → PASS。
- [ ] **Step 5: 场景组件**（dark，beats = 8）：
  0 转场字幕「快进到第 90 天」→ 1 左侧 `snapshots[0]` 画像，右侧黑暗 → 2 树逐层生长（SVG，暗线 `stroke-opacity .15`）→ 3 光沿 `realPath` 流动（`pathLength` 动画），在 4 个停靠节点弹出 `snapshots[n].headline` 与 `evidence[0]`，停靠章选 direction 发生变化的前 4 章，不足则补幕终 4/9/13 → 4 终点 `snapshots[13]` 亮起 → 5 镜头拉远（整组 `scale` 1→0.35），装饰分支出现，叶子开出画像并过渡到 `buildWall(…, count: 96)` 网格，字幕「每一个节点，她都可能成为另一个人。」→ 6 按 `delay` 逐个淡出，real 格移到中央放大，字幕「这是她自己选出来的。」→ 7 `snapshots[0]` 与 `snapshots[13]` 并排，中间「拟合 13 次」。
  每拍的子动画可被下一次「next」打断直接跳终态（用 `key={beat}` 重挂或 `animate` 终值切换实现）。墙格子用 CSS `transform`/`opacity` 动画，不对 96 个元素用 layout 动画。
- [ ] **Step 6: 人工验证**：逐拍截图；DevTools Performance 录拍 5–6，目标 60fps、不低于 30fps（中等笔记本）；快速连按不叠加；确认墙中没有灰度/变暗格子。
- [ ] **Step 7: `pnpm check`** → 通过。
- [ ] **Step 8: Commit** `feat(pitch): portrait evolution climax scene`

---

### Task 9: 场景 12–17（差异化、技术、严谨、商业、Roadmap、收尾）

**Files:**
- Create: `components/pitch/scenes/Scene12Compare.tsx` … `Scene17End.tsx`
- Modify: `components/pitch/scenes/index.tsx`

| 场景 | dark | beats | 内容（DESIGN.md §2/§13–15 与 spec §6） |
|---|---|---|---|
| 12 差异化 | ✓ | 3 | ①矩阵：行 MyFutureSelf / MIT Future You / Finch / Habitica / Zombies, Run! / UworthBetter；列 视觉叙事 · 真实行动 · 未来自我 · 随人拟合（按 DESIGN §2 填，角标 `TODO(团队核实)`）②逐列点亮，只有我们一行全亮 ③金句「别的产品让你追赶一个固定的目标，我们让未来的你跟着你一起长大。」 |
| 13 技术 | ✓ | 3 | ①管线：输入→文本模型（人格/Story Bible/章节计划）→图像模型（设定图/分镜，角色锚点）→流式输出 ②跨章记忆：Story Bible + 摘要 + 伏笔 ③画像拟合环 |
| 14 严谨 | ✓ | 1 | 「我们不宣称疗效」+ Grekin 2025 + 危机关键词检测 |
| 15 商业 | ✗ | 1 | 免费 / 会员 ¥18/月 / 实体书 ¥99 / B 端 |
| 16 Roadmap | ✗ | 1 | 好友客串、季终合集、更多文风 |
| 17 收尾 | ✗ | 2 | ①林夏双画像 + `team` ②「谢谢」+ `siteUrl`；若 `/pitch/qr.svg` 存在则显示（`<img onError>` 隐藏） |

- [ ] **Step 1: 实现 12–14**；**Step 2: 实现 15–17**。
- [ ] **Step 3: 人工验证**：截图；断网下全部正常；`qr.svg` 不存在时只显示网址。
- [ ] **Step 4: `pnpm check`** → 通过。
- [ ] **Step 5: Commit** `feat(pitch): closing scenes`

---

### Task 10（P1）: 演讲者备注窗口

**Files:**
- Create: `app/pitch/notes/page.tsx`
- Modify: `components/pitch/PitchDeck.tsx`

**Interfaces:**
- Consumes: `SCENES[i].notes`、`Pos`、`formatHash`。
- Produces: `BroadcastChannel("uwb-pitch")` 消息 `{ type: "pos", pos: Pos }`；备注页亦可发 `{ type: "nav", action: NavAction }` 反向控制。

- [ ] **Step 1**：`notes` 命令 `window.open("/pitch/notes","uwb-notes")`；pos 变化时广播。备注页显示当前场景标题、拍号、`notes`、下一场景标题、计时器（从首次收到消息起）。`/pitch/notes` 同样被 Task 3 的布局绕开覆盖（路径前缀 `/pitch`）。
- [ ] **Step 2: 为每个 SceneDef 填 `notes`**（台词要点，取自 DESIGN.md §12 与 spec §6）。
- [ ] **Step 3: 人工验证**：两窗口同步；在备注窗口按 → 主窗口翻页。
- [ ] **Step 4: `pnpm check`** → 通过；**Step 5: Commit** `feat(pitch): speaker notes window`

---

### Task 11: 收尾验收

- [ ] **Step 1**：`pnpm check` 全绿。
- [ ] **Step 2**：三视口（1920×1080 / 1366×768 / 2560×1440）各从场景 0 用键盘走到 17 并回退，截图存档到 `.playwright-mcp/`（不入库）。
- [ ] **Step 3**：DevTools offline，确认除场景 10 外全部正常。
- [ ] **Step 4**：`pnpm build && pnpm start`（生产模式）复跑场景 10 全流程，确认 `DEMO_MODE=1`、`DEMO_CACHED_GENERATE=1` 下可用、生产模式下 iframe 未被拦截。
- [ ] **Step 5**：在 spec 顶部把状态改为「已实现」，列出仍为占位的项（团队原话、竞品核实、92% 出处、team、siteUrl、qr.svg、backup-demo.mp4、E7/E8 数据接入点 `app/pitch/page.tsx`）。Commit `docs(pitch): mark implemented`。
