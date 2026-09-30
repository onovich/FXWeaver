# FXWeave

**Game Shader Studio**

FXWeave 是一个面向游戏效果的网页低代码节点创作工具。平台中的 Shader 都由这套节点工具生成。**第一步先做项目方自用版**，用它实际制作和迭代自己的效果；随后推出面向用户的网页第一版，让用户搭建节点图并生成所见即所得的 Shader 和效果；第二版在代码生成/编译层扩展到不同平台，并按需要适配各自的渲染管线。作品社区与分享是后续围绕同一节点源图发展的产品层。

**状态：V0 Phase 0 节点图与编辑器基础已实现，待架构验收。** 现在可以在桌面 Chrome 中创建、编辑、校验、保存并重开测试图。此阶段尚无 Shader 生成或真实实时预览；首个效果宿主、网页渲染后端、第二版目标平台和商业模式仍待确定。文档中的「已确定」「建议」「待验证」有不同含义，不能将建议当作已批准的实现需求。

## 运行 Phase 0

需要 Node.js 24 与 Chrome。克隆仓库后运行：

```powershell
npm ci
npm run dev
```

打开终端给出的本地地址，选择 **Create test graph**。依次添加 Number、从 Number 输出端连到 Test Output 输入端、修改数值、撤销和重做，再用 **Save As** 保存为 `.fxweave.json`，返回入口后重新打开。没有文件选择器的浏览器可以用 **Export JSON** 和 **Import JSON**。恢复草稿保存在本机浏览器中，与工程文件分开。

完整验收记录、测试命令及已知边界见 [Phase 0 验收报告](./docs/11-phase0-validation-report.md)。[工作台截图](./docs/visuals/phase0-workbench.png)、[拒绝连接截图](./docs/visuals/phase0-rejected-connection.png) 与 [浏览器演示录像](./docs/visuals/phase0-demo.webm) 均由 `npm run demo:capture` 从实际编辑器生成。

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

## 当前建议，尚未定案

- 自用版先选一个网页渲染后端，证明「搭节点 → 实时预览 → 生成 Shader/效果 → 保存并再次编辑」，并让项目方用它完成数个真实作品；2D Web 与 PixiJS 8 WebGL Filter 只是候选切口。
- 自用版稳定后再打磨为面向用户的网页第一版。
- 第二版再实现平台/管线适配及其验证；创作者社区和交易市场按实际使用情况推进。

本目录是后续会话的项目工作区。继续推进时先阅读主文档，并把新决策更新到这里。

**V0 Phase 0** 已交付可编辑、可校验、可保存重开的测试源图，下一步是架构验收。正式 Shader 生成和实时预览在首个渲染目标确定后的阶段进行。开发执行与架构验收由 `Role.md` 中的两个会话分别负责。
