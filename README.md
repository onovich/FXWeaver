# FXWeave

**Game Shader Studio**

FXWeave 是一个面向游戏效果的网页低代码节点创作工具。平台中的 Shader 都由这套节点工具生成。**第一步先做项目方自用版**，用它实际制作和迭代自己的效果；随后推出面向用户的网页第一版，让用户搭建节点图并生成所见即所得的 Shader 和效果；第二版在代码生成/编译层扩展到不同平台，并按需要适配各自的渲染管线。作品社区与分享是后续围绕同一节点源图发展的产品层。

**状态：Phase 0、Phase 1 与 Phase 2 均已通过独立技术验收。** 桌面 Chrome 中已有 PixiJS **8.21.0 WebGL2** Sprite/Container Filter 节点图、生成 GLSL、同源实时预览与可搬迁工程。首批 **03 径向燃烧、05 局部溶融、09 局部全息扫描** 均由编辑器从空图创作；示例入口可派生独立副本。[Phase 1 独立验收](./docs/28-phase1-planner-acceptance.md)记录通过范围；Phase 2 实际素材技术试用已通过[独立验收](./docs/34-phase2-planner-acceptance.md)，真实人工跨日编辑仍待验证。第二版目标平台和商业模式仍待确定。

## 运行与验证

需要 Node.js 24 与 Chrome。克隆仓库后运行：

```powershell
npm ci
npm run dev
```

打开终端给出的本地地址。选择 **Create Filter graph** 从空图开始，或在示例卡片点 **Edit a copy**。右侧 WebGL2 画面与只读生成代码来自同一次成功构建；修改节点、参数、时间或素材后可以检查变化。用 **Save As** 保存 `.fxweave.json`，再用 **Open project file** 重开。没有文件选择器的浏览器可以用 **Export JSON** 和 **Import JSON**；恢复草稿保存在本机浏览器中，与工程文件分开。入口上的清单和创作记录是原始示例的固定证据，编辑副本后的当前清单在工作台的生成结果区下载。

```powershell
npm run typecheck
npm test
npm run build
npm run smoke
npm run smoke:preview
```

`smoke:preview` 使用前一条 `build` 生成的生产文件。真实 Chrome/WebGL2 作品演示包含在 `smoke` 中；`npm run gallery:capture` 可重采集[示例入口](./docs/visuals/phase1-example-gallery.png)。

Phase 1 的 20 轮结果、验证矩阵和边界见[开发报告](./docs/27-phase1-validation-report.md)。三件作品各有可编辑工程、固定画面、构建清单和创作记录：[03](./docs/22-work03-radial-burn.md)、[05](./docs/23-work05-local-melt.md)、[09](./docs/24-work09-hologram-scan.md)。Phase 0 的[开发报告](./docs/11-phase0-validation-report.md)与[独立验收](./docs/12-phase0-planner-acceptance.md)仍可追溯；其测试图 `foundation.test` 继续受支持。

## 从这里开始

1. [新会话接续说明](./docs/00-handoff.md)：既定决策、待决事项和下一步。
2. [产品构想与定位](./docs/01-vision-positioning.md)：目标用户、价值主张、范围及商业假设。
3. [体验与作品设计](./docs/02-product-design.md)：用户路径、节点编辑器、社区、分类、交付物。
4. [技术设计草案](./docs/03-technical-design.md)：源图模型、编译与适配、预览验证、AI/MCP。
5. [阶段计划与验证](./docs/04-roadmap-validation.md)：首版顺序、验收指标、停线条件。
6. [竞品与证据](./docs/05-competitive-evidence.md)：可核查的事实、推断和研究缺口。
7. [可执行路线图（建议稿）](./docs/06-roadmap-proposal.md)：阶段交付、验证门槛与商业化试验。
8. [自用版功能与交互设计](./docs/07-self-use-product-spec.md)：V0 工作台、节点、预览、保存、生成与验收。
9. [自用版界面原画](./docs/08-v0-ui-concept.md)：桌面工作台视觉稿与生成提示词。
10. [V0 Phase 0 执行指南](./docs/09-v0-graph-foundation-goal-mode-execution-guide.md)：节点图与编辑器基础，16 轮开发和验收门槛。
11. [V0 Phase 0 验收报告](./docs/11-phase0-validation-report.md)：实现范围、16 轮提交、复现步骤、验证结果和后续决策。
12. [V0 Phase 0 架构验收](./docs/12-phase0-planner-acceptance.md)：独立复验、修复记录及通过范围。
13. [V0 2D 游戏效果候选](./docs/13-v0-2d-effect-candidates.md)：已定首批作品及其余候选的用途、节点能力和边界。
14. [UnregisteredScene Shader 使用核查](./docs/14-unregisteredscene-shader-usage-review.md)：根据实际运行时资产和代码接线调整首批推荐。
15. [V0 Phase 1 执行指南](./docs/15-v0-generated-filter-goal-mode-execution-guide.md)：节点生成 Filter、同源预览和三件作品，**20 轮**开发及验收门槛。
16. [V0 Phase 1 开发报告](./docs/27-phase1-validation-report.md)：20 轮提交、三件作品、WebGL2 验证与实际自用待验证项。
17. [V0 Phase 1 独立验收](./docs/28-phase1-planner-acceptance.md)：技术交付 PASS、独立复验和真实自用门槛。
18. [V0 Phase 2 执行指南](./docs/29-v0-local-selfuse-goal-mode-execution-guide.md)：本地实际素材试用、预览放大和适配全部节点，8 轮。

19. [V0 Phase 2 独立验收](./docs/34-phase2-planner-acceptance.md)：实际素材、大预览、全图适配及保存重开 PASS；人工跨日自用待验证。

此前讨论形成的完整研究文档存放在 [研究历史目录](./docs/research-history/INDEX.md)；它们保留原貌供追溯，以上主文档是当前项目口径。

## 当前已确定

- 产品名称 **FXWeave**，副标题 **Game Shader Studio**。
- 核心产品是网页低代码节点创作工具；平台里的 Shader 均由该工具生成。
- 第一阶段先做项目方自用版，由团队用它制作自己的 Shader/效果并持续迭代。
- 第一版在网页上生成所见即所得的 Shader 和效果。
- 第二版在代码生成/编译阶段生成不同平台的适配版本；不同渲染管线可能需要分别支持。
- 作品社区是后续产品方向；分享作品时同时分享节点图。
- 初期公开作品由项目方自己用同一工具制作；稳定后再开放其他创作者。
- 长期希望覆盖游戏中的材质、后效、转场、粒子等效果，并让 AI 可以通过结构化接口操作；各类型和引擎需要分阶段支持。
- V0 首个网页渲染目标为 PixiJS 8 WebGL 的 Sprite/Container Filter；首批效果为 03 径向燃烧、05 局部溶融和 09 单形态局部全息扫描。

## 当前建议，尚未定案

- 已在合成测试素材上证明「搭节点 → 实时预览 → 生成 Shader/效果 → 保存并再次编辑」；实际授权素材已通过自动技术试用，人工跨日持续编辑仍需验证。
- Phase 1 经独立验收且自用版持续使用稳定后，再考虑面向用户的网页第一版。
- 第二版再实现平台/管线适配及其验证；创作者社区和交易市场按实际使用情况推进。

本目录是后续会话的项目工作区。继续推进时先阅读主文档，并把新决策更新到这里。

**V0 Phase 0 与 Phase 1** 均通过独立技术验收。Phase 2 已完成三件本地实际素材工程、同源大预览与 Fit all nodes / F，已通过[独立验收](./docs/34-phase2-planner-acceptance.md)，见[开发报告](./docs/33-phase2-validation-report.md)。你可以按[本地试用入口](./docs/32-phase2-user-trial.md)直接打开工程继续创作。`npm run trial:local` 单独运行实际素材技术验证，`npm run trial:prepare` 准备私有恢复索引并保留人工记录；普通 smoke 不依赖 Unity。真实人工跨日继续使用尚待验证。
