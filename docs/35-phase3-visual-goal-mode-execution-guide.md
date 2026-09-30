# Phase 3 官网与创作工作台视觉升级 Goal 模式执行指南

日期：2026-10-01。用户明确要求 UI 更美观，用生图技能重新设计官网并美化生产页面。本阶段 5 轮：3 轮实现、1 轮缓冲、1 轮最终验证。

## 0. 直接给执行者的 Goal Prompt

实现官网入口与生产工作台的视觉升级，严格以本指南和生成视觉板为参考，保留实际能力与交互，逐轮验证、提交、推送。5 轮后向规划会话报告，供独立视觉与功能验收。无需用户再次确认设计或触发技能。

## 1. 必读上下文

Role.md、docs/34-phase2-planner-acceptance.md、docs/32-phase2-user-trial.md、src/components/ProjectStart.tsx、WorkspaceShell.tsx、GraphCanvas.tsx、FilterPreview.tsx、src/styles.css。

设计板：docs/visuals/phase3-ui-design-board.png。
首页可用品牌插画：public/art/shader-crystal-hero.png。
两图由内置 image_gen 生成；生图内容只作设计参考与品牌插画。不要把晶体包装成节点工具的真实渲染结果。实际示例卡继续使用现有固定 WebGL2 效果图，可改善图片容器、尺寸和布局，不换成虚假效果图。

生成提示摘要：FXWeave / Game Shader Studio；石墨灰背景，冰蓝操作色，橙色燃烧与蓝色全息晶体，首页大标题 Shape the effect. / See it come alive.；侧栏节点库、中间点阵画布、右侧预览与属性，克制光效与清晰层次。晶体资产提示：floating faceted crystal, ice blue scanlines on left, warm orange pixel dissolve on right, charcoal background, no text, no UI, no private assets。完整图示以保存的视觉板为准。

## 2. 本阶段要完成什么

### 官网（现有入口页）

- 精致品牌导航、左右分栏 Hero、晶体插画，文案聚焦 2D 游戏创作者的节点创作；Create Filter graph 和 Open project file 在首屏。
- 使用清晰大标题 Shape the effect. / See it come alive.；正文说明浏览器内搭节点、调参和预览。
- 三件真实作品卡有更大图面、明确的 Edit a copy 操作。将 manifest/build/creation record 收入可展开的技术详情，减少首屏开发信息噪音，但保留下载能力。
- 保留 Import JSON、Create test graph、恢复草稿、错误状态；低频入口可下移。无虚假 Learn/Docs/Pricing 页按钮，无假指标、假客户。
- 插画附近克制标注 Concept artwork，避免误解为当前作品输出；可优化为 WebP，但保留原图及来源记录。

### 创作工作台（用户说的生产页面）

- 全局视觉体系：graphite #10141b，surface #1b212c，text #e8edf7，muted #97a3b9，ice #79c9ec，amber #f4ac72。系统字体配 Bahnschrift/Segoe UI 展示层，正文 Segoe UI/system-ui，数据 Cascadia Code/Consolas，无远端字体依赖。
- 顶栏品牌/工程/保存动作层级明确；节点库减少矩形堆叠感，搜索与类别清楚；中部点阵画布、节点标题/输入/端口对齐更精致，连接线和类型颜色可辨；右侧预览和属性有清晰分组与一致控件。
- 允许组件小幅调整 markup 和 CSS，但不改图模型、编译器、运行时语义、存储格式和节点能力。
- 大预览、Fit all/F、属性编辑、文件操作、恢复、错误/构建提示保持可用。1440/1920 桌面及 1024 中等宽度不被新 Hero 或装饰挤压；首页 390px 宽布局可读。
- 避免在 CSS 尾部无限追加互相覆盖规则：整理已有规则或提取明确范围的样式文件，保持选择器职责清晰。

## 3. 本阶段不做什么

不做公开部署、登录、支付、平台导出、Unity 修改、新节点/图语义；不宣称真实人工跨日门槛完成。不修改 .fxweave-local 用户工程或截图，不提交私有素材。

## 4. 每轮固定工作流

每轮报告本轮目标、完成内容、Debug 自检、架构自检、验证命令与结果、commit hash 与 push 结果、下轮目标、是否消耗缓冲轮。

Debug：定位到具体 UI 组件；确认空/加载/错误/恢复状态；本阶段实际视觉截图与功能 smoke 足够，不写只镜像 CSS 的测试。架构：源图仍为源，UI 不复制编译/运行时逻辑，范围不扩大，用户文件不动。

## 5. 每轮通过后提交推送工作流

相关验证通过后定向 git add、commit，使用 git -c http.proxy= -c https.proxy= push origin main。验证/提交/推送失败均不得进入下一轮。不得打包其他人的未提交内容。当前 dev 服务已有 127.0.0.1:4173，不占用该端口，使用已有服务或测试配置端口。

## 6. 分轮安排

1. 官网视觉实现，资产消费，1440 与 390 截图自检，入口相关 smoke。
2. 工作台视觉实现，含示例图、空图、属性、生成结果、大预览；typecheck 与有关 smoke。
3. 统一细节、对比度/键盘焦点/窄窗口检查，截图展示官网与03/05/09至少一件工作台。
4. 缓冲修复；无问题则检查死链接、构建状态与界面说明准确性，不扩范围。
5. 最终 typecheck、test、build、smoke、smoke:preview；生成 docs/36-phase3-visual-validation-report.md 与可追溯实际截图，更新 README/handoff。报告视觉板到实际页面的实现对应、未实现原因、验证矩阵和5轮提交。

## 7. PASS 标准

官网显著接近设计板的构图与层级，真实作品和主要操作可见；工作台完整统一、字可读、无截断遮挡、端口和连线可操作；布局桌面/窄窗口实测；公共功能与生产 smoke 通过，私有文件及 Unity 保持原状。

规划者将独立看实际截图并操作验收；如视觉或功能不通过，返回修复后再验。

## 8. 最终报告模板

交付提交/远端、5轮目标与提交、设计实现与截图路径、Debug/架构自检、所有验证结果、已知限制、私有素材边界、需要规划验收的项目。状态 READY_FOR_CHECK，return_to_thread 01a0efd1-4c98-7a43-bf33-4b0eafb92c90。