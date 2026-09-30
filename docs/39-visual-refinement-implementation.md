# 官网与创作页持续优化：实现与视觉复验

2026-10-01。实现者 subagent `visual_refinement`。本文件保留第二版实现过程；第四版最终通过规划者独立验收，见 refinement-final-validation.md 和 39-visual-refinement-review-log.md。

## 设计判断与已迭代问题

以效果实验台为主方向：石墨蓝表面、冰蓝品牌、琥珀标量、紫色向量与青色颜色数据；字体回到可编辑尺度，类型的线和端口形状一致。第一次采用几何矢量游戏素材，规划者指出仍有占位图质感，已退回并替换为内置 imagegen 生成的高质正常晶体护符。

三种效果共用一份公开合成基础图，通过既有节点图产生效果；03半消散状态、05明显UV形变、09扫描与红色通道偏移均可肉眼比较。旧示例JSON/GLSL/manifest/log/截图保留。新入口来自 `examples/showcase/`，其graph与旧工程一致，Scene改用真实尺寸1024×1536嵌入图、800×640预览、适当运行参数。

## 信息架构与交互

- 默认右栏为实时调参：Preview、比较、播放、时间和运行值。已有Scene覆盖值优先显示且排序在该会话固定，不随每次修改跳动。
- Scene & image settings 显式折叠，保留Host/Source/导入/背景/区域/采样等完整能力。
- Graph properties抽屉单独处理图默认值/属性/定义，选中节点自动打开，Back to live tuning明确返回运行调参。
- 同一个FilterPreview与canvas始终挂载；展开抽屉不销毁构建、时间、比较或视图缩放。
- 默认150%显示聚焦主体，100% entire stage可检查完整Filter区域。Original与真实canvas使用同一CSS缩放，图像输出、生成代码和保存格式不变。
- Fit all供概览；Edit selected · 100%定位选中节点并进入可读尺度。底部提示区分Overview与Editing。100%标题14px，端口12px，操作13px。原端口几何43px标题/28px行/188px宽保持，连线锚点未改变。

## 实际证据

- `refinement-home-1440.png`、`refinement-home-390.png`
- `refinement-tune-1440.png`、`refinement-edit-1440.png`，同样采1920×1080、1024×900
- `showcase-{03,05,09}-original.png`与`showcase-{03,05,09}-effect.png`：真实Original host快照、真实generated Filter canvas输出
- `showcase-*-evidence.json`记录原图/派生工程/实际buildId；提示和原始资产见`refinement-imagegen-prompts.md`
- `scripts/capture-showcase.mjs`重采效果，`npx playwright test --config=playwright.capture.config.ts tests/refinement.capture.spec.ts`重采页面

## 已验证

typecheck PASS；72单测PASS；第二轮5个页面截图检查PASS，覆盖尺寸/无横向溢出/100%定位/回调参构建保留。第一次完整43个公共回归找出抽屉重开可达性和summary选择问题；实际修复后相关8个回归PASS（保存重开、3个示例、时间/运行值、焦点）。所有三种新入口已由capture脚本实际打开并渲染。

规划者检查期间的09入口短暂失效由运行值0.65超出max0.6造成，已改为合法0.55，重新打开和提取真实输出成功。

最终完整公共回归、生产回归与build等待视觉通过后运行，当前不宣称最终全量PASS。Unity与`.fxweave-local`未操作；compiler/runtime/graph/storage未修改。没有公开部署，未声称人工跨日验证已完成。

## 剩余限制

正常节点图仍较长，不能在Overview同时做到文字可读，现提供明显的100%局部编辑路径。右栏较多参数仍需滚动，默认至少关键运行参数可直接操作，图定义抽屉可以随时返回实时调参。高质基础图约2MB，派生工程内嵌导致每个工程较大；采用异步工程导入，不放入主首屏bundle。
