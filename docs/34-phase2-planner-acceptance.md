# Phase 2 独立技术验收

日期：2026-10-01。结论：**PASS（本阶段技术交付）**。

验收指南：[Phase 2 八轮指南](./29-v0-local-selfuse-goal-mode-execution-guide.md)。开发报告：[33](./33-phase2-validation-report.md)。独立检查基线为 `8d9c78c8085a8d3063a3117e86b8750d9f049afb`，包含交付提交 `80dc092ba0b94f3a0400fbeb2aeb03ab3e72939c`；检查前 main 与 origin/main 一致且工作区干净。

## 独立复验

| 命令 | 结果 |
| --- | --- |
| npm run typecheck | PASS |
| npm test | 72 项 PASS |
| npm run build | PASS；已有约 585 kB 主包提示，非本阶段阻塞 |
| npm run smoke | 40 项真实 Chrome/WebGL2 PASS |
| npm run smoke:preview | 11 项生产包测试 PASS |
| npm run trial:local | 6 项实际素材测试 PASS |
| npm run trial:prepare | PASS |
| npm run usability:capture | 1 项 PASS |
| git diff --check | PASS |

未跳过本阶段必需验证。实际图片导入、参数变化、透明区域、Sprite/Container、另存到物理文件并重开、大预览及全图适配均有覆盖。

## 代码与画面验收

- 大预览沿用同一个画布、成功构建和预览状态；Esc、焦点恢复、Tab 焦点约束及小窗口操作有回归覆盖。
- Fit all nodes / F 根据节点布局适配视口；恢复原视口和输入框中的 F 有覆盖，不修改源图或生成代码。
- 大尺寸 Sprite 的 filterArea 按 Sprite 缩放换算到局部坐标，实际素材裁切问题已修复并有回归验证。
- 独立查看三件私有大预览截图：03 燃烧边缘、05 局部波动、09 扫描与通道偏移可辨，透明外部保留。当前范围为 PixiJS 8.21.0 WebGL2 Filter。
- 三件实际工程独立重跑的 buildId 和 fixedCanvasHash 均与交付记录逐项一致，效果仍由节点图生成。

## 私有证据与边界

复验前将交付的本地文件保存到忽略目录 `.fxweave-local/planner-phase2-delivery-80dc092/`；重跑证据另存 `.fxweave-local/planner-phase2-recheck/`，随后恢复根目录交付文件，避免复验生成的新工程标识破坏原恢复索引。恢复后的三个工程 SHA256 与开发报告完全一致：

- 03：`0ae13f1bb73994b91b7b7d5ece7e9727d61852472cce378ebaa51266798eb0b5`
- 05：`9e0d7b0120bacebeb82b3bdfb8f71f7d84d9f2b2824397ca4c218d44fb296f94`
- 09：`fe3cced892ad9b0d0e7f40db60f520ef29f4797e04de5b3035264bc539f5b0ff`

实际素材工程和截图未被 Git 跟踪。Unity 原项目状态仍只有之前已有的两个字体修改；本阶段未新增 Unity 修改。普通 smoke 不依赖 Unity。未引入 Unity 导出、WebGPU、其他渲染管线、手写效果 Shader 或现成效果 Filter。

## 下一步

技术交付可以进入项目方试用，入口见 [32](./32-phase2-user-trial.md) 与本地 `.fxweave-local/CONTINUE.md`。人工使用及真实后一天继续编辑尚未发生，代理耗时与自动重开不能代替这一产品验证。

本次不派发新开发阶段。按 CheckAndGoal 的“Do not silently invent a next phase”，先收集实际使用卡点，再据此确定下一阶段；本报告不宣称自用版整体产品验收完成。