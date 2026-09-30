# 新会话接续说明

更新：2026-10-01。Phase 2 [独立技术验收](./34-phase2-planner-acceptance.md)已 PASS；下一步是实际项目素材与真实跨日自用反馈。

用户已要求继续。[Phase 2 执行指南](./29-v0-local-selfuse-goal-mode-execution-guide.md)安排 **8 轮**本地实际素材试用及预览放大/适配全部节点。实际素材工程与截图仅存本机忽略目录，Unity 原项目只读；真实人工跨日自用仍须后续验证。

## 背景

本项目由「浏览器中的拖拽连线 Shader 编辑器，能预览 2D/3D 并导出到 Web、Unity 等」逐步收敛。当前明确的顺序是：**先做项目方自用版，用同一节点工具实际制作自己的 Shader/效果；再推出面向用户的网页第一版，提供所见即所得的节点创作；第二版在代码生成/编译阶段扩展不同平台的适配版本，并按需要覆盖不同渲染管线。** 平台中的所有 Shader 都来自这套工具。作品社区仍是产品方向，初期公开作品由项目方用工具制作；以后再开放创作者。

名称由用户确定为 **FXWeave**，副标题 **Game Shader Studio**。历史工作区曾叫 Shader Node Studio，历史文件标题中可能保留旧名称；这些不是当前品牌。

## 已确定的产品决策

| 事项 | 当前决定 |
| --- | --- |
| 产品核心 | 网页低代码节点工具；平台 Shader 全部由节点图生成 |
| 第一步：自用版 | 项目方用节点工具制作和迭代自己的真实 Shader/效果，边用边修工具 |
| 第一版 | 在网页上搭建节点图，实时预览并生成所见即所得的 Shader 和效果 |
| 第二版 | 在代码生成/编译层生成各平台适配版本；按目标管线分别处理能力与验证 |
| 后续产品层 | 作品展示/分享社区 |
| 公开作品源文件 | 每件作品附可编辑节点图；图与作品同时分享 |
| 初期内容供给 | 项目方自己使用同一工具创作和发布，不开放自由投稿 |
| V0 首个网页目标 | PixiJS 8 WebGL 的 Sprite/Container Filter；首批已定 03 径向燃烧、05 局部溶融、09 单形态局部全息扫描 |
| 后续社区 | 格式、质量与审核流程稳定后开放其他创作者 |
| 长期方向 | 服务游戏中的效果应用，支持分类/标签、运行时导出、AI 易操作及 MCP 接口 |

## 工作假设与建议，不应视为最终决定

- 2D Web 游戏的首批效果见[候选清单](./13-v0-2d-effect-candidates.md)；结合用户项目的[Shader 使用核查](./14-unregisteredscene-shader-usage-review.md)，用户已批准 03 径向燃烧、05 局部扭曲和 09 单形态局部全息扫描，实施边界见[Phase 1 指南](./15-v0-generated-filter-goal-mode-execution-guide.md)。
- 「2D 材质」「对象/图层滤镜」「全屏后效」「粒子系统」「3D 材质」共享部分节点运算，但有不同的输入、输出、渲染流程与导出器。分阶段支持。
- 平台节点图是正式源文件；生成的 Shader、材质配置和项目包是目标交付物。导出 Unity 包不代表导出 Unity 原生 Shader Graph。
- AI/MCP 应建立在稳定的图模型和 API 之上。先支持搜索、读取、派生、调参、预览、导出；结构编辑在图格式稳定后再推出。

## 尚未做的事

- 没有真实用户访谈、付费测试或可量化的市场需求结论。
- 没有完成竞品的同任务上手对比，也没有运行时视觉回归数据。
- Phase 1 已交付三件合成素材作品并通过独立技术验收；Phase 2 已完成授权实际素材上的三件本地派生工程及大预览/F 适配，见 [开发报告](./33-phase2-validation-report.md)，已通过[独立技术验收](./34-phase2-planner-acceptance.md)。自用版规格中的“隔天继续编辑”尚未进行真实人工跨日验证。第二版的首批平台/渲染管线尚未选定。
- 尚无公开站点、域名或商标审查。当前 WebGL2 Filter 后端与 PixiJS 8.21.0 锁定，WebGPU、Unity 导出及其他渲染管线不在 Phase 1 范围。

## 新会话推荐起点

当前分工：Phase 0 的[开发报告](./11-phase0-validation-report.md)与[独立验收](./12-phase0-planner-acceptance.md)已完成，结论 **PASS**。Phase 1 也已按[20 轮执行指南](./15-v0-generated-filter-goal-mode-execution-guide.md)交付节点生成 Filter、同源预览和 03/05/09 三件作品，并通过[独立技术验收](./28-phase1-planner-acceptance.md)。[开发报告](./27-phase1-validation-report.md)保留原始交付记录。Phase 2 已完成实际素材技术试用与交互改进，已通过[独立技术验收](./34-phase2-planner-acceptance.md)；人工跨日编辑仍需项目方实际使用反馈。会话路由见根目录 `Role.md`。

1. 阅读 [定位](./01-vision-positioning.md)、[产品设计](./02-product-design.md)、[技术草案](./03-technical-design.md)、[阶段草案](./04-roadmap-validation.md)、[可执行路线图建议稿](./06-roadmap-proposal.md) 和 [自用版功能与交互设计](./07-self-use-product-spec.md)。
2. 复验 [03](./22-work03-radial-burn.md)、[05](./23-work05-local-melt.md)、[09](./24-work09-hologram-scan.md) 的真实 WebGL2 构建身份、图变化、固定画面、另存与重开。运行 `npm run smoke`，并在 `npm run build` 后运行 `npm run smoke:preview`。
3. 当前 Phase 2 按 [8 轮指南](./29-v0-local-selfuse-goal-mode-execution-guide.md)完成，规划会话已完成[独立复验](./34-phase2-planner-acceptance.md)，全部必需检查通过。用户可从 [本地试用入口](./32-phase2-user-trial.md)与 `.fxweave-local/CONTINUE.md` 打开工程；Save As 改新文件名，人工使用及真实后一天继续编辑写入私有记录。代理操作和同日重开不能代替此门槛。
4. 自用版能支持团队持续创作后，再安排外部创作者试用、对比现有节点工具；第二版再测试跨平台/管线适配与真实项目导入。
5. 每次确定新范围或改变定位时更新主文档，而不是只保留在聊天记录里。

历史研究原稿在 [research-history](./research-history/INDEX.md)，主文档优先于旧稿。


用户要求官网与生产工作台美化，按 [Phase 3 视觉升级指南](./35-phase3-visual-goal-mode-execution-guide.md) 执行 5 轮；由规划者生成视觉稿并负责验收。
