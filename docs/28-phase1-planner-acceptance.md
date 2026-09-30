# FXWeave V0 Phase 1 独立验收

日期：2026-10-01。结果：**PASS（Phase 1 技术交付）**。对象为 [Phase 1 指南](./15-v0-generated-filter-goal-mode-execution-guide.md)和[开发报告](./27-phase1-validation-report.md)。开发交付提交 `e630cefed003ea95fd9e9ef8236621c61dd81c03`，报告登记后的检查基线 `65b4dab3594579129ae162962ecd2482c2357ea9` 与 `origin/main` 一致。

## 独立复验

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS，72 项 |
| `npm run build` | PASS；主包 582.51 KB，保留已说明的 Vite 包体提示 |
| `npm run smoke` | PASS，33 项真实 Chrome/WebGL2 测试 |
| `npm run smoke:preview` | PASS，5 项生产文件浏览器测试 |
| `npm run gallery:capture` | PASS，1 项；重采后工作区没有录证文件差异 |
| 独立生成物核对 | PASS，临时核对 03/05/09 源工程各自经过解析、IR 和生成器所得的 GLSL 字节及清单每个字段均与已提交文件一致；核对用临时测试已移除 |
| `git diff --check` / 工作区 / 远端 | PASS；检查结束工作区干净，HEAD 与 origin/main 一致 |

读取图/工程模型、代码生成器、运行适配器、预览组件和浏览器测试，并目视检查三件固定效果与 09 工作台截图。三件作品的源图都可编辑；通用节点经过类型化 IR 生成代码，PixiJS 预览使用同一生成结果。核心图、编译和运行模块的作品名/Unity/现成滤镜扫描没有发现效果专属实现分支。旧 `foundation.test` 工程、正式文件/草稿、缺失输入、旧画面提示、异步请求竞态、示例派生与重开由复跑的浏览器测试覆盖。

## 通过范围和实际使用门槛

本次 PASS 确认一个 PixiJS 8.21.0 WebGL2 Sprite/Container Filter 的可运行创作链：编辑节点、生成 GLSL、同源预览、参数/时间控制、完整工程保存重开、三件合成素材示例。Filter 输入、UV 和预乘 Alpha 的边界按本阶段文档和实测约束成立；没有验证 Unity/URP 导出或其他渲染后端。

**这不是 V0 持续自用的最终认证。** 授权实际项目素材上的制作和真实跨日继续编辑尚未完成，自动操作日志中的秒数不能视为人工制作耗时。长节点链的连线成本、较小的预览画面和主包提示已有开发记录，后续应按真实自用卡点确定优先级。

当前不自动派发新开发阶段。下一步先由项目方在现有工作台用实际素材创作/修改，保留工程并跨日重开，记录具体卡点；有这些反馈后，规划会话再以 GoalNext 确定下一轮开发范围。当前开发交付无需返工。
