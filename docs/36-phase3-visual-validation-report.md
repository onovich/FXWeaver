# Phase 3 视觉升级执行记录

日期：2026-10-01。状态：实施中，完成后交规划会话独立视觉与功能验收。指南：[5 轮执行指南](./35-phase3-visual-goal-mode-execution-guide.md)。

## 第 1 轮：官网

实现双栏 Hero、品牌导航、首屏 Create Filter graph / Open project file、Concept artwork 标注；使用规划生成的 `public/art/shader-crystal-hero.png`。作品卡仍用现有固定 WebGL2 图，大图面、明确副本操作、折叠技术详情和原下载。Import JSON、test graph、恢复与错误保留。首页样式整理到 `src/entry.css`，移除原首页规则，未在 CSS 尾部重复叠加。

实际截图：`docs/visuals/phase3-home-1440.png`、`phase3-home-390.png`。目视确认：桌面标题与晶体左右分栏，冰蓝第二行；移动端按钮完整、晶体下移、卡片单列，无水平溢出。没有虚假导航、指标或客户信息；插画不作为效果输出。

Debug：入口/作品派生/物理文件重开/恢复取消与错误导入回归通过。作品技术详情隐藏后，测试改为展开再下载。架构：只改入口 markup、样式与验证，图、编译、运行时和存储未改；私有工程与 Unity 未操作。

验证：typecheck PASS；11 入口/保存/恢复 Chrome smoke PASS；2 个实际截图采集 PASS；diff check PASS。无缓冲使用。提交为 `phase3 round1`（精确 SHA 见 Git 历史和轮次回报）。

## 第 2 轮：工作台

统一石墨灰底色、冰蓝操作、琥珀值节点与紫色向量；节点库用分类标题和轻量行，画布改点阵，连接按输出类型着色。顶栏 Save As 提升层级，节点标题/端口排布与原 188px 宽、28px 行及连线锚点保持对应。预览、属性与生成结果沿用原组件，控件颜色与边界统一。规划提前验收指出的底栏 Test graph 硬编码已改为从 shell 传简单目标显示：Filter graph · WebGL2；测试图保留原说明。

实际截图：`phase3-studio-1440.png`、`phase3-empty-filter.png`、`phase3-generated-output.png`、`phase3-enlarged-preview.png`。目视自检发现大预览打开长 GLSL 后 grid 控制区被 min-content 撑出屏幕，给控制区与生成 details 设置 min-width:0 后已修复，并重采截图。

Debug：旧按钮 accessible name 中的分类移到独立标题，一项 smoke 定位更新到库内 Number；40 项公共 smoke 重跑 PASS，5 项相关测试在 min-width 修复后 PASS；typecheck、截图 PASS。架构：只改变显示、颜色、CSS与简单目标文案，无模型/编译/运行时/存储变化，无私有文件操作。无缓冲使用。

## 第 3 轮：细节和宽度

1920×900、1024×900 实际工作台截图保存为 `phase3-studio-1920.png` 和 `phase3-studio-1024.png`，显示真实 03 图与数字节点属性。文件动作保持在窗口内，键盘添加 Number、编辑属性、适配、放大、下载 GLSL 和 Esc 返回焦点通过。小屏全图缩小是适配结果，可放大继续编辑。节点类别显示按原首次出现顺序集中分组，避免重复 Input 标题；控件增加明确键盘焦点环，合并重复品牌选择器。

对比度计算（sRGB）：主文字/背景 15.72:1；muted/surface 6.35:1；ice/surface 8.75:1；主按钮文字/ice 9.26:1。此核查针对主文字与操作色，不声称完整自动无障碍审计。无远程字体与装饰动画。

Debug：8 项适配/大预览/宽度回归 PASS；最终分组/焦点调整后的4项编辑与窄窗回归、2截图、typecheck与diff check PASS。架构：显示分组只排序临时节点库列表，不修改注册定义或图。私有文件不动，无缓冲使用。
