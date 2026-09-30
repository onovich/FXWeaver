# 七个方向的竞品能力与机会核查

核查日期：2026-09-29。范围：竞品官方文档和官方 API 文档；未进行用户访谈、实际购买、完整产品操作或目标工程测试。本文的“机会”只表示从公开资料可推导的设计空间，不等于已经证实的痛点或付费需求。

## 证据标记

- **A｜官方明确**：官方文档直接说明该能力或限制。
- **B｜文档推断**：多个明确事实支持的产品判断，仍需动手验证。
- **C｜待验证**：官方资料无法证明用户频率、严重度、转换意愿或付费意愿。

## 总览

| 方向 | 已存在的能力（A） | 可检验的边界与机会 | 痛点证据 / 判断 |
| --- | --- | --- | --- |
| **2D 真实问题** | PixiJS Filter 提供 `padding`、`resolution`、`clipToViewport` 等配置；官方说明 padding 可避免模糊外扩被裁剪，分辨率影响性能与质量。[PixiJS API](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html) Phaser 明确区分纹理大小的 Pre FX 与画布大小的 Post FX 缓冲区。[Phaser FX API](https://docs.phaser.io/api-documentation/3.88.2/class/gameobjects-components-fx) | 让用户用自己的 Sprite、图集和真实背景预览，提示透明边、采样、外扩裁剪、分辨率等组合问题，属于 **B**。不能说竞品无这些控制；更可能的机会是将控制、解释和测试场景连起来。 | 特定故障机制有 **A** 级依据；“用户在竞品里常因此失败”仍为 **C**。Unity 也提供图集 padding 以防低 mip 层相邻 Sprite 串色。[Unity API](https://docs.unity3d.com/cn/6000.0/ScriptReference/Sprites.AtlasSettings-paddingPower.html) |
| **明确作用范围** | Unity URP 已有 Sprite Lit／Unlit、Canvas、Fullscreen 等不同 Graph。[Unity Graph 列表](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/prebuilt-shader-graphs-urp.html) Construct 效果可用于对象、图层、布局，部分背景混合效果不能用于布局。[Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) Phaser 内置 Pre／Post FX，后者可用于相机。[Phaser FX](https://docs.phaser.io/phaser/concepts/fx) | 机会是**在创作和导出流程中持续说明输入来源、采样坐标、作用范围与运行成本**（B），而不是发明作用范围分类。Unity 全屏通道还必须选择注入点及 Color／Depth 等输入。[Unity Full Screen Pass](https://docs.unity3d.com/cn/6000.0/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) | “分类不清造成多少返工”为 **C**。 |
| **动画与游戏事件编排** | Construct 时间线可以直接动画化效果参数，也可通过事件启停和设置参数。[Construct Timeline](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/timelines/timeline) [Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) GDevelop 可通过事件修改效果参数。[GDevelop 官方说明](https://gdevelop.io/blog/last-months-overview-1) Phaser Tween 可操作任意对象并提供启动、停止、完成回调；FX 暴露可修改的 `progress` 等属性。[Phaser Tween](https://docs.phaser.io/phaser/concepts/tweens) [Phaser FX](https://docs.phaser.io/phaser/concepts/fx) NixieFX 有多发射器时间线和运行时生命周期 API。[NixieFX](https://nixiefx.com/vfx-runtime-docs/) | 时间线、事件、可触发效果已高度拥挤。可能的窄机会是**将一个短效果的参数曲线、触发／取消／重播语义一起导出给特定宿主**（B）；必须先确认宿主工作流是否真的更省事。 | “缺少动画功能”已被 **A** 级资料否定；跨工具交接的摩擦及付费意愿为 **C**。 |
| **预览与实际运行对照** | Unity Shader Graph 有实时主预览与自定义预览网格。[Unity Main Preview](https://docs.unity3d.com/Packages/com.unity.shadergraph@10.0/manual/Main-Preview.html) PlayCanvas Shader Editor 支持导入 glTF／GLB 模型、HDR 环境及动画播放预览。[PlayCanvas Preview](https://developer.playcanvas.com/shader-editor/window-layout/preview-pane/) NixieFX 文档称预览使用游戏嵌入的同一运行时，并可切换后端。[NixieFX Editor](https://nixiefx.com/editor-manual/) | “有预览”不能当差异点。针对**导出目标工程的可重复截图比较**有潜在价值（B）。确切的预览边界例：NixieFX 的 bloom 仅是预览辅助，参数不会导出，游戏需自行实现 bloom。[NixieFX Editor](https://nixiefx.com/editor-manual/) PlayCanvas 的 Shader Pack 不含源节点图，但包含运行所需代码和参数。[PlayCanvas File Handling](https://developer.playcanvas.com/shader-editor/overview/file-handling/) | 公共文档不能证明其它产品均无回归比较，也不能证明用户愿意接受截图差异阈值（C）。跨不同渲染器的逐像素一致更不能预设可实现。 |
| **节点性能提示** | Unity 6 Shader Graph 已有默认显示每节点估计性能影响的可定制热图。[Unity 6 新功能](https://docs.unity3d.com/cn/current/Manual/WhatsNewUnity6.html) NixieFX 材质图已有 Tier、纹理采样次数（超过 3 提示）、shader 程序数和预览运行统计。[NixieFX Editor](https://nixiefx.com/editor-manual/) Construct 有 CPU／GPU Profiler，并指出多个对象分别用效果可能不如对图层用一次。[Construct Debugger](https://www.construct.net/en/make-games/manuals/construct-3/interface/debugger) [Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) | 静态节点成本提示已有竞品实现。进一步机会是**将节点静态估计、滤镜区域／分辨率／实例数、目标工程运行测量合在一起**（B）。PixiJS 官方指出过多 Filter 会拖慢性能，限定 `filterArea` 可加快处理。[PixiJS Performance](https://pixijs.com/8.x/guides/concepts/performance-tips) | “节点性能提示是空白”被 **A** 级资料否定。准确预测最终 GPU 毫秒数高度依赖场景和设备；预测可靠性需实验（C）。 |
| **逐个验证的多引擎适配** | NixieFX 已有 PixiJS／Three.js 双后端、实时支持点、`supported／partial／blocked` 报告和导出验证。[NixieFX Editor](https://nixiefx.com/editor-manual/) Construct 自定义效果为 WebGL／WebGPU 分别提供 GLSL／WGSL，官方要求在两种渲染器测试。[Construct Effect SDK](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/configuring-effects) PixiJS 自定义 Filter 的 WebGL／WebGPU 双支持也需相应 GPU 程序。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) | 支持报告并非原创优势。跨**彼此独立的引擎**做统一源图、受限共同子集、逐目标验证，是比双后端更大范围的机会（B），但每增加宿主都需适配效果语义、资源、运行时接口、版本和测试。 | 真实跨引擎需求规模及用户接受“部分支持”的程度为 **C**。NixieFX 的材料图主要服务其粒子运行时，不能据此断言其是通用 Sprite／全屏效果编辑器。[NixieFX 功能范围](https://nixiefx.com/vfx-runtime-docs/) |
| **细分领域效果库** | Construct 已有 80 多种效果及示例。[Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) GDevelop 有免费／付费资产与模板市场，以及可编辑的层效果示例。[GDevelop Asset Store](https://gdevelop.io/asset-store) [GDevelop Layer Effects](https://gdevelop.io/game-example/free/layer-effects) NixieFX 有起步模板。[NixieFX](https://nixiefx.com/vfx-runtime-docs/) | “有模板”本身没有稀缺性。可能的机会是围绕像素风、卡牌 UI、剧情切换等**单一工作流**提供可修改图、测试素材、参数动画、版本化工程包和兼容报告（B）。 | 哪一类用户重复购买、哪类效果在现有库不足，必须用市场访谈／交易／任务测试验证（C）。官方目录只能证明供给，不能证明质量和购买动机。 |

## 对战略判断的修正

1. **不应把“时间线”“节点成本提示”“后端支持报告”作为竞品缺失点。** Construct、Unity 6、NixieFX 官方资料已明确覆盖。[Construct Timeline](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/timelines/timeline) [Unity 6 新功能](https://docs.unity3d.com/cn/current/Manual/WhatsNewUnity6.html) [NixieFX Editor](https://nixiefx.com/editor-manual/)
2. **最有证据支撑的产品缝隙是工作流集成，不是单项功能。** PixiJS 的 Filter 尺寸和像素配置、Unity 全屏通道的输入及注入配置、Construct 对多实例效果成本的建议，均说明同一个视觉效果涉及创作图之外的宿主设置。[PixiJS API](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html) [Unity Full Screen Pass](https://docs.unity3d.com/cn/6000.0/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) [Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) 这只支持“可做完整任务工具”的假设，不支持“现有工具都不好用”的结论。
3. **最值得先验证的场景**：用同一组真实 Sprite、图集和背景完成一个单对象效果与一个图层效果；记录从选效果到宿主工程运行的时间、首次成功率、裁剪／透明边／分辨率错误、预览偏差及需要手工修改的代码。与至少一个原生编辑器和一个代码库直接比较。以上是研究设计建议（B／C），不是竞品事实。

## 资料限制

- 本次主要依据官方功能文档，未对安装版／最新线上 UI 做逐项实测。文档未提及某功能，不等于功能不存在。
- NixieFX 的[概览](https://nixiefx.com/vfx-runtime-docs/)将 PixiJS 材质概括为烘焙纹理及粒子通道；较详细的[编辑器手册](https://nixiefx.com/editor-manual/)还描述 PixiJS Tier 2 动态图的 batched particle shader。关于其 PixiJS 动态材质的具体覆盖，应该以手册、源码和实际测试为准，不能笼统说“只有烘焙”。
- 官方案例和商品目录是供给证据，不是需求强度或付费意愿证据。验证后才可排优先级。
