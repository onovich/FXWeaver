# 七个兴趣方向：证据、可行性与产品顺序

更新：2026-09-29。本文是产品判断。官方文档能证明现有能力和技术边界，不能单独证明用户不满意、某产品难用或购买意愿。对应逐项证据见 [竞品核查](./seven-direction-gap-audit.md)。

## 总判断

七项可以属于**同一个 2D 效果创作与交付产品**，但不能同时作为首版完整承诺。它们共享效果定义、参数、预览场景和导出测试；对象材质、对象/图层滤镜、全屏后效需要不同的渲染入口和适配器。首版只实现一个输出目标，同时在数据模型中保留 `scope`。

## 逐项判断

| 方向 | 已确认的竞品状况 | 机会可信度 | 技术可行性 | 产品位置 |
| --- | --- | --- | --- | --- |
| 2D 真实问题 | PixiJS 纹理有 `frame`、`trim`、`uvs`、`alphaMode`、`scaleMode` 等语义，Filter 也有 `padding`、`resolution`；Phaser FX 需要按对象范围设置 padding。相关细节确实存在，未证明现有用户因此大量受阻。[PixiJS 纹理](https://pixijs.com/8.x/guides/components/textures) · [PixiJS Filter API](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html) · [Phaser FX](https://docs.phaser.io/phaser/concepts/fx) | 中，需任务测试 | 单后端高，多后端中 | 首版最具体的用户体验差异 |
| 作用范围 | Phaser 已区分 Pre FX、Post FX 和 Camera FX；Unity 有 Sprite 与 Fullscreen 图；Construct 可对对象、图层和布局施加效果。不是竞品功能空白。[Phaser](https://docs.phaser.io/phaser/concepts/fx) · [Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/prebuilt-shader-graphs-urp.html) · [Construct](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) | 作为独占卖点低，作为正确产品模型高 | 高 | 第一阶段先设计，逐模式交付 |
| 动画与事件 | Construct 时间线可直接动画化效果参数，Tween 值也可接到效果参数；GDevelop 可用事件改参数，但官方说明名称区分大小写。已有成熟能力；机会只可能在特定宿主可移交、类型明确的短时效果资产。[Construct Timeline](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/timelines/timeline) · [Construct Tween](https://www.construct.net/en/make-games/manuals/construct-3/behavior-reference/tween) · [GDevelop](https://wiki.gdevelop.io/gdevelop5/interface/scene-editor/layer-effects/) | 独占功能低；交接流程待验证 | 单后端高，跨后端中 | 第二阶段 |
| 预览与运行结果对照 | 原生引擎内创作通常直接使用目标渲染器；NixieFX 官方也称预览使用游戏嵌入的同一运行时。独立网页工具若导出到另一引擎则必须逐目标验证。[NixieFX Editor](https://nixiefx.com/editor-manual/) · [PlayCanvas](https://developer.playcanvas.com/shader-editor/overview/file-handling/) | 同一后端高，跨引擎待验证 | 同一后端高，跨引擎低到中 | 首版用同一 PixiJS 渲染器；自动截图回归随适配器扩展 |
| 跟随节点的性能提示 | Unity 6 Shader Graph 已有节点估计性能热图，NixieFX 也显示 Tier、纹理采样数和预览统计；Unreal 有 Stats / Platform Stats。不是统计功能空白。[Unity 6](https://docs.unity3d.com/cn/current/Manual/WhatsNewUnity6.html) · [NixieFX Editor](https://nixiefx.com/editor-manual/) · [Unreal](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-material-editor-ui) | 独占功能低；结合实例数、面积和目标工程测量待验证 | 静态规则高；准确的逐节点 GPU 毫秒低 | 第二阶段先解释采样/Pass/处理面积，再做真实设备测量 |
| 多引擎适配 | NixieFX 已有 PixiJS／Three.js 后端和支持报告；ShaderFrog 输出 GLSL 与元数据后仍需引擎插件；Material Maker 各目标导出物形态不同。差异确实存在，无法保证任意图跨引擎等价。[NixieFX Editor](https://nixiefx.com/editor-manual/) · [ShaderFrog](https://github.com/ShaderFrog/core) · [Material Maker](https://rodzill4.github.io/material-maker/doc/export.html) | 跨独立引擎的可靠交付有潜力，需求待验证 | 受限节点子集、中；任意节点无损、低 | 单后端通过验收后逐个加 |
| 细分领域效果库 | Construct 已有 80 多种效果，Phaser 有许多内置 FX，GDevelop 有资产市场。通用效果数量不是空白；垂直审美、项目素材和可靠导出是否有需求待访谈。[Construct](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) · [Phaser](https://docs.phaser.io/phaser/concepts/fx) · [GDevelop](https://gdevelop.io/asset-store) | 低到中，取决于细分人群 | 少量精选模板高；市场与社区难 | 从首版放 3 个标杆效果，规模化以后再谈库/市场 |

## 推荐依赖顺序

1. **验证任务**：让目标用户带自己的素材完成 Sprite 溶解、受击闪白、图层/全屏效果，记录从开始到项目运行的时间、失败原因和返工。按同一任务对比现有工具。
2. **第一条完整链路**：选定一个用户群和一个运行时，例如 PixiJS 8 WebGL。先支持对象/容器 Filter：作用范围、上传素材、深浅背景和分辨率预览、3 个效果、可运行的工程导出。预览本身使用同一 PixiJS 渲染器。此处的 Filter 不等同于直接替换 Sprite 原生绘制材质。[PixiJS](https://pixijs.com/8.x/guides/components/filters)
3. **效果资产化**：添加暴露参数、短时间线、游戏调用接口、少量成本规则；效果包保留可编辑源图、预设与目标版本。只把已经验证的效果加入精选库。
4. **第二个作用范围**：根据用户任务加入单 Pass 全屏效果或真正的 Sprite 材质。多 Pass 模糊/Bloom 等需要另外处理缓冲区和成本；不要仅靠同一图的不同导出按钮冒充支持。
5. **第二个引擎**：根据真实需求选 Phaser、Godot 或 Unity URP 中一个；限定可移植节点子集、对每个目标编译并做视觉回归。之后再扩大适配器和垂直效果库。

## 一个产品，模块化实现

- **共享效果文档**：作用范围、带类型与坐标/颜色空间的图、参数及时间曲线、测试场景、目标约束。
- **不同的输出模式**：Sprite 材质、对象/图层滤镜、全屏后效分别定义合法输入、输出和渲染 Pass；只共用可共用的数学与采样节点。
- **目标适配器与测试包**：每个引擎和版本单独生成运行时代码/资源/安装说明，并维护编译及截图样例。适配器可独立成技术包，但由同一产品管理。
- **内容目录**：模板和细分领域包复用同一效果格式；社区市场不需要作为首版独立产品。

是否拆分应由用户群决定：如果未来 3D 材质、粒子 VFX 或模板交易服务对应不同的购买者和工作流，再考虑独立产品。当前七项服务同一条 2D 效果交付流程，宜先保持一个产品。

## 停线信号

- 用户在网页里完成得快，但导入目标工程仍要大量手工修正：先收窄图节点和导出范围。
- 2D 检查只提示常识，未减少真实返工：不把诊断当主要卖点。
- 第二引擎支持导致大量效果降级或视觉不一致：改为明确的目标专用效果，停止宣传通用跨引擎。
- 模板使用多、编辑和导出少：评估是否是效果素材生意，而非节点创作工具。
