# FXWeave V0 Phase 0 架构验收

日期：2026-09-30。结果：**PASS**。验收对象为 [节点图与编辑器基础执行指南](./09-v0-graph-foundation-goal-mode-execution-guide.md)；最终开发提交 `5c8677cb7dcc0738f3edf1e0f9d8d795775c4865`，核对时与 `origin/main` 一致。

## 独立验证

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS，37 项 |
| `npm run build` | PASS |
| `npm run smoke` | PASS，12 项 Chrome 浏览器测试 |
| `npm run demo:capture` | PASS，实际页面截图与录像可重采集 |
| `git diff --check` | PASS |
| 工作区与推送 | 开发提交与远端一致；验收期间的录证文件变化已撤回，仅保留规划验收相关文档与角色状态更新 |

目视检查了 [1366×768 工作台截图](./visuals/phase0-workbench.png)：节点画布与预览占位区同屏，测试图身份、正式文件/草稿状态以及“尚未配置渲染器”均有明确文案。源码扫描未发现正式 Shader 生成、PixiJS/WebGL 宿主或伪造构建成功状态。

## 验收期间发现并修复

1. 草稿写入配额失败曾阻断正式工程保存；从编辑器取消文件与草稿的版本选择曾退出当前会话。`ced557e` 修复，并把浏览器回归纳入 `tests/qa-review.smoke.spec.ts`。
2. 浏览器完全禁止访问 `localStorage` 时，项目入口曾在初始化崩溃。`5c8677c` 修复，并把入口、正式保存、打开及导入的回归纳入 `tests/qa-localstorage.smoke.spec.ts`。

最终复验中，正式工程文件操作不再依赖恢复草稿可用；取消版本选择后，编辑器的数值与撤销历史仍在。缺失输入、类型不匹配、环、保存重开与不兼容项目文件的原有测试继续通过。

## 通过范围与下一门槛

本次 PASS 仅表示**版本化测试图、图规则、桌面编辑交互和工程保存重开**达到 Phase 0 指南。`foundation.test` 不会生成 Shader；预览仍是明确的占位区，不能据此宣布 V0 自用版完成。

下阶段需要先确定项目方近期真正要制作的 2–3 个效果，并确认**一个首个效果宿主及网页渲染后端**。当前文档仅把 PixiJS 8 WebGL 的 2D Sprite/Container Filter 列为候选，评审原画不构成技术定案。在这些决定明确前，不派发 Shader 生成与同源预览阶段的执行指南。
