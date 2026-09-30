# FXWeave V0 Phase 1 开发报告

日期：2026-10-01。阶段：节点生成 PixiJS Filter、同源实时预览与三件自用作品。**开发执行完成，状态为待规划会话独立验收**；此报告不代表 V0 自用版最终 PASS。执行依据为[20 轮指南](./15-v0-generated-filter-goal-mode-execution-guide.md)。交付分支为 `origin/main`，本报告所在的第 20 轮提交即交付提交；在检出仓库运行 `git rev-parse HEAD` 可得到其完整 SHA。

## 交付范围与可复验路径

正式 `pixi.filter2d` 图经现有图校验、类型化 IR、确定性 GLSL/绑定清单、PixiJS 8.21.0 WebGL2 Filter 运行适配器，进入工作台 Sprite/Container 预览。同一次成功构建驱动画面和只读代码区。拓扑或未暴露常量变化生成新构建；暴露参数默认值、运行时参数、时间及场景设置改变 uniform/预览状态而不伪造新代码身份。编译、素材或图失败时保留并标记旧画面与旧构建 ID。

运行 `npm ci`、`npm run dev`，在入口点 **Create Filter graph** 可从空图编辑；点三张示例卡片的 **Edit a copy** 会产生独立工程 ID。修改图/参数后检查真实画面和 **Generated code and bindings**，用 **Save As** 写工程，再从入口 **Open project file** 重开。原始示例文件作为只读来源；其固定构建清单和编辑器操作记录可从卡片下载。完整生产路径先运行 `npm run build`，再运行 `npm run smoke:preview`。

[三件示例入口实机截图](./visuals/phase1-example-gallery.png)由 `npm run gallery:capture` 重采。每件作品的创作过程由 `tests/work03.capture.spec.ts`、`work05.capture.spec.ts`、`work09.capture.spec.ts` 从空编辑器图录下，已提交的工程和生成物可供复验。重采集会产生新的随机节点 ID 和构建 ID，因此不能用新 ID 机械比较已提交清单；固定画面行为由普通 WebGL2 smoke 验证。

## 20 轮执行记录

| 轮 | 交付 / 缓冲原因 | 已推送提交 |
| --- | --- | --- |
| 1 | 锁定 Pixi 8.21.0；真实 WebGL2 Filter 采样、Alpha、区域、编译探针 | `831e56b` |
| 2 | 正式图种类与旧工程迁移 | `af4d155` |
| 3 | 依赖与预览素材、场景 Schema | `514619f` |
| 4 | 源、UV、时间、常量、参数、输出与类型规则 | `ef283f3` |
| 5 | 通用数学、阈值、混合和通道节点 | `5cb29ca` |
| 6 | 源图/额外纹理采样、UV 越界与过滤实测 | `72ffda7` |
| 7 | 类型化、拓扑排序的 IR 与诊断 | `32b86d1` |
| 8 | 确定性 GLSL、绑定清单与构建 ID | `23c2f29` |
| 9 | 真实 WebGL2 预检、绑定、销毁和错误归因 | `4b19d5f` |
| 10 | 工作台异步预览、Sprite/Container 与旧结果 | `3adbd98` |
| 11 | 时间/参数、原图对照和同构建只读代码 | `69f156e` |
| 12 | 带素材工程保存、重开、草稿和导入导出 | `09c0342` |
| 13 | 从空图创作 03 径向燃烧 | `5a360c9` |
| 14 | 从空图创作 05 局部溶融 | `0bbea7b` |
| 15 | 从空图创作 09 局部全息扫描；客户端重启检查点 | `821c509` |
| 16 | 统一示例入口、可编辑派生、原件清单和创作记录 | `d6719fd` |
| 17 | 缓冲：修复示例工程推高首屏包体与异步改选竞态 | `4376422` |
| 18 | 缓冲：补证据文件实际下载与生产构建兼容回归 | `2efc743` |
| 19 | 缓冲：补原件不被派生保存覆盖的回归与兼容说明 | `61288aa` |
| 20 | 全量回归、入口录证、README/接续说明与本报告 | 本报告所在 `origin/main` 提交 |

17–19 轮的具体原因、包体量化和测试入口见[缓冲轮审查](./26-phase1-buffer-review.md)。每轮均在对应验证和 `git diff --check` 通过后独立提交、推送，并核对 `main` 与 `origin/main` 一致。

## 三件由节点图生成的作品

| 作品、用途与宿主 | 可编辑源图、生成证据 | 固定画面与构建身份 |
| --- | --- | --- |
| **03 径向燃烧**：调查卡/拼图局部显隐；透明双层卡片 Container | [工程](../examples/03-radial-burn.fxweave.json)、[GLSL](../examples/generated/03-radial-burn.frag.glsl)、[清单](../examples/generated/03-radial-burn.manifest.json)、[创作记录](../examples/03-radial-burn.creation-log.json) | [固定画面](./visuals/work03-radial-burn.png)、[改半径](./visuals/work03-radius-change.png)，`f1-5f9ea9d2ed4943d9` |
| **05 局部溶融**：第一章局部 UI 转场；透明双层卡片 Container | [工程](../examples/05-local-melt.fxweave.json)、[GLSL](../examples/generated/05-local-melt.frag.glsl)、[清单](../examples/generated/05-local-melt.manifest.json)、[创作记录](../examples/05-local-melt.creation-log.json) | [固定 0.75 s](./visuals/work05-local-melt.png)、[改时间](./visuals/work05-time-change.png)，`f1-f8adda044117f170` |
| **09 局部全息扫描**：调查终端局部视觉；透明终端 Sprite | [工程](../examples/09-hologram-scan.fxweave.json)、[GLSL](../examples/generated/09-hologram-scan.frag.glsl)、[清单](../examples/generated/09-hologram-scan.manifest.json)、[创作记录](../examples/09-hologram-scan.creation-log.json) | [固定 0.5 s](./visuals/work09-hologram-scan.png)、[改时间](./visuals/work09-time-change.png)，`f1-eaace75cae26d3d5` |

03 的通用图链为 UV/源 RGBA、噪声图片、距离、Smoothstep、边缘颜色混合和预乘 Alpha 裁切；05 为 UV.y 与时间驱动正弦偏移，再用 Sample Source 重采样；09 为时间扫描线与一次红通道偏移重采样，最后按源 Alpha 组合。各自的参数、节点数量、编辑器操作时间、固定像素 SHA-256 和重现命令见[03 作品说明](./22-work03-radial-burn.md)、[05 作品说明](./23-work05-local-melt.md)、[09 作品说明](./24-work09-hologram-scan.md)。三份合成透明素材与所需依赖内嵌于工程，不借用 Unity 资产或现成效果 Shader。

## WebGL2 与边界实测

最终环境为 Node.js v24.13.1、桌面 Chrome 154.0.8037.57、PixiJS 精确版本 8.21.0，实际图形上下文为 WebGL2。早期[Filter ADR](./16-phase1-webgl2-filter-adr.md)记录输入纹理、区域归一化 UV、padding、透明 Alpha、额外纹理和 nearest/linear 的像素证据；[运行契约](./18-phase1-runtime-webgl2-contract.md)记录生成片段真实编译、绑定、颜色变化、缺纹理与 GLSL 错误归因。Filter 采样宿主已绘制内容；UV 不等于 Sprite 图集原图 UV，也不能读滤镜外背景。源图与额外纹理的图定义域越界返回透明黑，宿主源有效区域再受 Pixi 输入 clamp 限制。内部 RGBA 按预乘 Alpha 处理。边距和宿主局部区域由预览场景控制；09 只覆盖一个局部形态。

## 最终验证矩阵

| 命令 / 检查 | 本阶段最终结果 | 关键覆盖 |
| --- | --- | --- |
| `npm run typecheck` | PASS | TypeScript 与测试/配置类型 |
| `npm test` | PASS，72 项 | 图、IR、生成器、项目版本与素材边界 |
| `npm run build` | PASS | 锁定依赖下的生产构建；主入口 582.51 KB，仍有 Vite 500 KB 提示 |
| `npm run smoke` | PASS，33 项 | Chrome/WebGL2 实际编译、像素、三件作品、状态和工程往返 |
| `npm run smoke:preview`（构建后） | PASS，5 项 | 生产文件的示例派生、下载、另存、重开、竞态与原件隔离 |
| `npm run gallery:capture` | PASS，1 项 | 入口三件示例的可重复实机截图 |
| `git diff --check` 与边界扫描 | PASS | 无空白错误；`src/graph`、`src/compiler`、`src/runtime` 无作品名分支 |

Debug 自检覆盖无效/缺线图、缺失与超限图片、WebGL2 不可用、编译失败、旧画面标记、异步较旧请求、保存取消与不兼容文件拒绝。架构自检确认图和依赖是源、布局不参与代码构建身份、前端不复制 Shader 语义、预览与代码区使用同一成功构建、三件作品无专属生成器分支。Phase 0 的 `foundation.test` 工程继续可读且不会误迁移成 Filter。

## 自用反馈、已知限制与待核验

- 操作日志的自动编辑动作耗时：03 为 4.04 秒、05 为 3.352 秒、09 为 4.595 秒；它们**不是**设计、审阅或真实人工创作总耗时。03 暴露了旧参数滑杆范围过宽，已加通用范围编辑；05 与 09 分别需要 18 和 33 次手工连线，说明长标量链和多通道组合的操作成本。03 在窄预览区的卡片标签偏小。详情见各作品说明。
- 三件作品都由通用节点完成，没有为单个效果补专属节点。03 的绕行是参数范围编辑而非缺少 Shader 节点；05/09 的主要缺口是长链连线效率。
- 本阶段使用仓库内合成素材。Unity 项目仅作为效果题材与参数行为参考，未复制 Unity Shader、Stencil、URP RenderGraph、全屏 CRT 或历史帧。WebGL2 Chrome 以外的浏览器/图形驱动尚未实测；真实授权项目素材的接入也待项目方复验。
- 自用规格中的**真实“隔天继续编辑”尚未验证**。目前证明的是同日的正式文件、草稿和浏览器重开等价，不能把这些模拟过程当作跨日使用。
- Vite 对当前主入口仍给出大于 500 KB 的建议提示；缓冲轮已把示例源工程按需拆包，其余编辑器拆分不在此阶段修复范围。

下一步由 `Role.md` 指向的规划验收会话使用 `$checkandgoal` 独立检查此报告和仓库证据；在其给出结论前，本报告只声明开发交付就绪。
