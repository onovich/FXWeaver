# 竞品与证据

核查基线：2026-09-30。本页以官方文档、项目源码/文档为主，记录可确认的能力与产品推断。此前未进行系统性的实际购买、同任务上手对比或用户访谈。**资料没有写某项能力，不等于产品不存在该能力。**

## 与 FXWeave 最相关的竞品

| 产品/生态 | 可确认的强项和边界 | 对 FXWeave 的启示 |
| --- | --- | --- |
| [Shadertoy](https://www.shadertoy.com/view/MtV3W1) | 有统一的创作/展示输入接口（例如 `iResolution`、`iTime`、`iChannel`）与作品分享；该接口服务其演示环境，不直接定义 Sprite、材质或游戏后效的安装方式。 | 第一版可对比网页创作和即时反馈体验；第二版再解决目标适配。尚无数据证明「多数 Shadertoy 作品不能导入游戏」。 |
| [Unity Asset Store](https://assetstore.unity.com/vfx/shaders) / [Unity 管线](https://docs.unity3d.com/cn/2020.2/Manual/BestPracticeMakingBelievableVisuals0.html) | 大量可购买资源；官方确认部分 Built-in 管线 Shader/渲染扩展不能直接兼容 URP/HDRP。市场作品不保证一种共同可编辑图格式。 | 按目标版本和管线声明兼容；不要笼统写「支持 Unity」。 |
| [Godot Shaders](https://godotshaders.com/shader/) / [Godot Shader 参考](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/) | 面向游戏的作品目录，已有类型、标签、许可筛选；Godot 有统一 Shader 语言，涵盖 CanvasItem、Spatial 等不同 Shader 类型。 | 不能说它只是代码粘贴站；第一版验证节点图创作体验，第二版再验证面向 Godot 等目标的适配价值。 |
| [Godot 渲染器](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html) | Forward+、Mobile、Compatibility 的能力和表现不同；切换可能需要调整。 | 即使单一引擎也要按渲染器验证。 |
| [Material Maker](https://www.materialmaker.org/doc) | 已有节点材料编辑器及社区素材分享。 | 「节点 + 社区」不是空白；第一版必须在网页节点创作、所见即所得与生成一致性上接受同任务比较。 |
| [PlayCanvas Shader Editor](https://developer.playcanvas.com/shader-editor/overview/file-handling/) | 浏览器节点创作；文档明确运行时 Shader Pack 不含项目图与节点，只含生成代码和参数。 | 第一版应直接对比网页节点编辑与预览体验；分享作品时把源图与生成物作为同一个版本管理是后续设计选择。不能据此说 PlayCanvas 完全不能分享图，其项目文件可另行保存。 |
| [NixieFX](https://nixiefx.com/editor-manual/) / [CLI](https://nixiefx.com/cli-reference/) | 浏览器 VFX、节点材质、时间线、运行时支持报告、CLI/AI 工具等能力已存在。 | 动画、性能提示、AI 可操作、支持报告单独都不是空白；第一版应按选定效果类型比较节点创作任务，而非仅比较功能清单。 |
| [PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) | Filter 可应用于 Sprite、Container、Graphics，并支持自定义 GPU 程序；运行位置和渲染后端有具体语义。 | 可作为首发候选，但 Filter 不是 Sprite 原生绘制材质。 |
| [Unity Shader Graph](https://docs.unity3d.com/cn/current/Manual/WhatsNewUnity6.html) / [Construct Timeline](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/timelines/timeline) | Unity 6 有节点性能估计热图；Construct 可用时间线动画化效果参数。 | 不宣称竞品普遍缺少性能提示或动画。 |

## 证据能与不能说明什么

- **能说明**：特定产品已有的功能、官方声明的兼容限制、引擎中存在的渲染语义差异。
- **不能说明**：用户有多痛、这些限制多常遇到、竞品整体体验差、用户愿意付费、FXWeave 的方案一定更快。
- **必须实测**：第一版的从空图创作成功率、首次有效效果耗时、改图与预览一致性、保存/重开与二次编辑；第二版的目标工程导入成功率、视觉偏差和运行成本。

## 名称粗筛记录

用户已选定 **FXWeave** / **Game Shader Studio**。公开搜索中发现相近名称 [ShaderWeave](https://jacob-neel.com/projects)（生成图形编辑器/API）、[NodeFX](https://github.com/pshengcode/NodeFX)（浏览器节点 Shader 编辑器）和 [VFX Loom](https://vfxloom.com/docs/getting-started/)（节点 VFX 工具），因此不建议改用这些近名。公开搜索不是 FXWeave 商标、域名或应用商店名称可用性的正式核查；对外发布前需专项确认。

更细的历史资料和逐项来源见 [研究历史目录](./research-history/INDEX.md)。
