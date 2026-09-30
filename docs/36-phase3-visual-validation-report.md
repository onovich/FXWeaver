# Phase 3 视觉升级执行记录

日期：2026-10-01。状态：**READY_FOR_CHECK**，等待规划会话独立视觉与功能验收。指南：[5 轮执行指南](./35-phase3-visual-goal-mode-execution-guide.md)。分支 main，远端 origin/main；最终交付为包含本报告的 `phase3 round5` 提交，精确 SHA 由通知与 Git 历史提供。

## 设计板到实现

| 设计方向 | 实现与实际证据 |
| --- | --- |
| 左文案 / 右晶体、双行标题 | Hero 按设计板构图，冰蓝第二行；[桌面官网](./visuals/phase3-home-1440.png) |
| 品牌导航、主要操作 |真实锚点导航；Create Filter graph / Open project file 首屏，[390px](./visuals/phase3-home-390.png) |
| 三张作品卡 | 继续使用已有真实固定 WebGL2 图；更大图面、Edit a copy，技术详情折叠且下载回归通过 |
| 石墨灰工具、清晰层级 | 统一色彩及系统字体；轻量分类节点库、点阵画布、类型连线、分组属性，[1440工作台](./visuals/phase3-studio-1440.png) |
| 桌面与中等宽度操作 | [1920](./visuals/phase3-studio-1920.png)、[1024](./visuals/phase3-studio-1024.png)；键盘添加/属性编辑、文件动作、生成物下载通过 |
| 保留状态与比较 | [空图](./visuals/phase3-empty-filter.png)、[生成结果](./visuals/phase3-generated-output.png)、[大预览 Split](./visuals/phase3-enlarged-preview.png) |

设计板中的 Learn/Docs、Assets/Settings 伪标签以及晶体效果节点没有对应当前产品能力，未实现这些入口或虚构输出。生成晶体只在官网作品牌图，旁边标注 Concept artwork；工作台始终显示图生成的真实效果。两张生成图片来源与提示记录见指南，原 PNG 保留。本阶段直接使用规划提供的 image_gen 资产，未重新生成作品图。展示字体 Bahnschrift/Segoe UI，正文 Segoe UI/system-ui，数据 Cascadia Code/Consolas，无远端字体。

## 五轮提交

| 轮 | 提交 | 范围 |
| --- | --- | --- |
| 1 | `b29f042` | 官网、资产消费、真实作品与技术详情 |
| 2 | `1533224` | 工作台统一、底栏目标文案、大预览控制区宽度修复 |
| 3 | `24f1b76` | 分组、焦点、1920/1024 实测 |
| 4 | `fd7bd02` | 缓冲准确性回归、独立生产端口 |
| 5 | 本报告所在提交 | 规划滚动条反馈修复、完整验证、最终截图、README/handoff、交付通知 |

各轮相关验证通过后才提交并推送，推送成功后进入下一轮。第4轮缓冲用于准确性/生产配置检查，没有新增产品范围。

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

## 第 4 轮：缓冲准确性核查

检查真实导航锚点、390px 首屏创建/打开按钮、测试图目标说明以及恢复/错误导入状态。9 项相关 smoke、typecheck/build PASS。没有新增产品功能；缓冲用于准确性回归与生产配置冲突处理。生产预览改独立 4174 端口，保持 reuseExistingServer=false 并实际起 vite preview，未占用现有 4173 dev；加入视觉布局操作验证，14 项生产测试 PASS。未拿 dev 冒充生产包。

Debug：链接定位到真实页面区域，测试图仍明确无 Renderer；Filter 正式目标信息不谎报成功构建。架构：配置及测试变动，没有改产品运行语义。私有目录最近文件写入时间仍早于 Phase 3 派发，三份交付文件校验与 Phase 2 基线一致，Unity 仍只有原先两个字体修改。第 4 轮消耗缓冲，范围未扩大。

## 第 5 轮：最终矩阵与交付

| 验证 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | 11 文件 / 72 项 PASS |
| `npm run build` | PASS；主包 586.83 kB，原有500 kB提示仍在 |
| `npm run smoke` | 43 项真实 Chrome/WebGL2 PASS |
| `npm run smoke:preview` | 14 项生产包 PASS，独立4174端口 |
| `npm run visual:capture` | 5 项 PASS，最终8张截图 |
| `git diff --check` / 定向暂存 | PASS |
| 私有边界 / Unity 状态 | PASS，未改私有文件及Unity |

最终矩阵执行日期为 2026-10-01 Asia/Shanghai。默认 smoke 不访问 Unity、不写 `.fxweave-local`；本阶段没有运行会重写实际工程的 local trial。根目录三份私有工程 SHA-256 逐项仍等于 Phase2 报告，目录最近写入为 03:34:19，早于本阶段派发；Unity 状态与来源基线一致，三个源图哈希未变。`git ls-files .fxweave-local` 为空。

规划会话在实际 IAB 操作中发现系统白色滚动轨道与深色界面冲突，截图未充分显示；第5轮补 `color-scheme:dark`、scrollbar-color/width 及 WebKit 轨道/滑块回退样式。滚动条保持可见，没有隐藏或禁用滚动。修复后重新执行最终矩阵与截图。

最终 Debug：新官网的真实入口、示例派生/保存重开/下载、恢复取消与错误导入；节点连线/断线、属性、适配、时间、比较、旧画面与不可用状态均由实际 smoke 覆盖。截图期间发现的生成结果 min-content 宽度问题已修复且下载在1920/1024可操作。架构审查：本阶段改动仅入口/工作台显示组件、样式、测试与文档；graph/compiler/runtime/storage 没有文件差异，示例图及构建语义不变。

已知边界：工作台以桌面为主；1024全图适配后节点小，可缩放编辑。主包提示尚在；Hero 原PNG约1.85MB，未压缩转换。没有公开部署、登录、支付、平台导出、新节点或Unity变更。人工跨日自用仍未验证。视觉自检不替代规划者独立验收，也不宣称最终V0持续自用通过。

复验：运行 dev 打开官网，或 `build` 后 `smoke:preview` 检查生产包；`visual:capture` 重采实际截图。原来4173开发服务保留，生产测试结束后4174释放。请规划会话对照设计板目视全部截图并操作验收；本阶段完成状态为 READY_FOR_CHECK。
