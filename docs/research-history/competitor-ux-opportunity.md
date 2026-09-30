# 后效、2D 与 3D 材质工具：优劣和产品机会

研究日期：2026-09-28。本文把“劣势”定义为**相对于目标任务的边界或摩擦**，不等同于产品质量差。证据主要是官方文档、项目仓库与公开的一手说明；尚未进行系统性上手计时或用户访谈。主观体验结论均标为推论。详细来源另见 [后效和 2D 核对](./2d-postfx-competitor-strengths-weaknesses.md)、[3D 材质核对](./3d-competitor-strengths-weaknesses.md)、[原始竞品核对](./competitive-landscape.md)。

## 竞品地图

| 类型与工具 | 对用户最强的地方 | 对“浏览器创作后交付到项目”任务的边界或摩擦 |
| --- | --- | --- |
| **后效：Unity URP Fullscreen Shader Graph** | 图形化做全屏 Shader；Full Screen Pass Renderer Feature 允许指定注入时机与材质，和项目渲染管线结合。[图类型](https://docs.unity3d.com/cn/6000.0/Manual/urp/prebuilt-shader-graphs-urp-fullscreen.html) · [Renderer Feature](https://docs.unity3d.com/cn/6000.0/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) | 交付不止 Shader 图，还需要材质、Renderer Feature 和注入设置；这是从官方接入步骤推导的集成摩擦。[Unity 低代码后效教程](https://docs.unity3d.com/cn/current/Manual/urp/post-processing/post-processing-custom-effect-low-code.html) |
| **后效：Unreal Post Process Material** | 深度集成 Unreal 的材质和后处理体系，有丰富的场景输入与编辑器统计。[Unreal 后效材质](https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-materials-in-unreal-engine) | 与 Unreal 的渲染流程、材质域和混合位置绑定；转到 Web/Unity 需重新实现，这属于平台边界而非缺陷。[Unreal 后效材质](https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-materials-in-unreal-engine) |
| **后效：Godot** | `canvas_item` Shader 可读屏幕纹理，能用 ColorRect 做全屏处理。[Godot 后效教程](https://docs.godotengine.org/en/stable/tutorials/shaders/custom_postprocessing.html) | 单通道需搭 CanvasLayer/ColorRect；多通道需叠放，官方指出屏幕纹理与其他缓冲区的可见范围有限。[Godot 后效教程](https://docs.godotengine.org/en/stable/tutorials/shaders/custom_postprocessing.html) |
| **2D 效果：Construct 3** | 80 多种现成效果，挂在对象、图层或布局上；可串联、在运行时调参数，第一次看到效果很快。[Construct 效果](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) | 自定义效果需写插件，WebGL 与 WebGPU 分别处理 GLSL/WGSL；成果主要在 Construct 项目里使用。[Construct Effect SDK](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/configuring-effects) |
| **2D 效果：Phaser FX** | 内置 Bloom、Blur、Pixelate、Vignette 等，可加到对象或相机；对 Phaser 项目上手直接。[Phaser FX](https://docs.phaser.io/phaser/concepts/fx) | 官方明确 FX 只在 WebGL 模式可用，Canvas 模式不支持；要超出内置效果需进入 Pipeline/Shader 开发。[Phaser FX](https://docs.phaser.io/phaser/concepts/fx) · [PostFXPipeline](https://docs.phaser.io/api-documentation/3.88.2/class/renderer-webgl-pipelines-postfxpipeline) |
| **2D 效果：GDevelop** | 提供对象和图层效果，适合选效果、调参数，并能用事件调整。[对象效果](https://wiki.gdevelop.io/gdevelop5/objects/effects/) · [图层效果](https://wiki.gdevelop.io/gdevelop5/interface/scene-editor/layer-effects/) | 图层效果只作用于整层；通过事件调参需填写效果和参数名称，官方提示名称区分大小写。这里有改善参数绑定和预览定位的机会。[图层效果](https://wiki.gdevelop.io/gdevelop5/interface/scene-editor/layer-effects/) |
| **2D 效果：PixiJS Filters** | Filter 可加到 Sprite/Container，多个 Filter 可排序叠加；自定义 API 和 WebGL/WebGPU 后端都存在。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) | 自定义需写 GPU 程序与资源；两种后端都支持时还需对应的 GPU 程序。它是开发框架，不提供完整的无代码节点作者流程。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) |
| **2D 材质：Unity Sprite Shader Graph** | 有 Sprite Lit、Unlit、Custom Lit 目标，能与 Unity 2D 光照交互。[Unity 图类型](https://docs.unity3d.com/ja/6000.0/Manual/urp/prebuilt-shader-graphs-urp.html) | 2D 光照有专门的 Shader Graph 子目标和渲染通道；成果适配 Unity URP，而非任意 Web 2D 引擎。[Unity 2D 光照](https://docs.unity3d.com/cn/6000.0/Manual/urp/Lights-2D-intro.html) |
| **2D 材质：Godot VisualShader** | 原生节点工作流，`canvas_item` Shader 面向 2D/UI，能与 Godot 项目素材配合。[VisualShader](https://docs.godotengine.org/en/stable/tutorials/shaders/visual_shaders.html) · [CanvasItem](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html) | 官方说明 VisualShader 未覆盖文本 Shader 的全部能力；更复杂的目标仍可能要改写 Shader 代码。[VisualShader](https://docs.godotengine.org/en/stable/tutorials/shaders/visual_shaders.html) |
| **2D VFX 邻域：NixieFX** | 免费网页粒子编辑器，有节点材质、时间线、PixiJS/Three.js 预览和后端支持报告。[NixieFX 功能](https://nixiefx.com/vfx-runtime-docs/) | 核心任务是粒子系统。概览称 PixiJS 材质多经烘焙和逐粒子通道呈现；详细手册同时说明 PixiJS Tier 2 可运行动态粒子 Shader。因此不能笼统称其 PixiJS 路径只有烘焙，但其功能范围也未覆盖通用 Sprite/全屏后效。[NixieFX 功能](https://nixiefx.com/vfx-runtime-docs/) · [编辑器手册](https://nixiefx.com/editor-manual/) |
| **3D 材质：Unity Shader Graph** | 原生材质工作流、节点预览、子图、参数暴露、URP/HDRP/Built-in 目标。[Unity Shader Graph](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/) · [Targets](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/Graph-Target.html) | Unity 官方提醒跨管线结果可能不同；关键字组合会急剧增加变体和构建成本。跨 Unity 管线尚需处理差异，跨引擎更不能默认一致。[Targets](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/Graph-Target.html) · [Keywords](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.6/manual/Keywords-concepts.html) |
| **3D 材质：Unreal Material Editor** | 深度渲染集成，材质实例、函数、节点预览、平台统计和生成 HLSL 查看器。[Unreal 材质编辑器](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-editor-reference?application_version=4.27) | Unreal 文档自己指出复杂图连线会难读，且复杂材质预览更新耗时；其工具能通过 reroute、关闭 Live Update 和材质实例缓解。这里不是说它缺少这些能力。[编辑器参考](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-editor-reference?application_version=4.27) · [预览说明](https://dev.epicgames.com/documentation/en-us/unreal-engine/previewing-and-applying-your-materials?application_version=4.27) |
| **3D 材质：Blender Shader Editor** | Cycles/EEVEE 内创建丰富的 BSDF、过程纹理与节点组，适合 Blender 场景创作。[Blender Shader Nodes](https://docs.blender.org/manual/en/latest/render/shader_nodes/introduction.html) | glTF 导出只把其识别的节点结构转换为目标 PBR/Unlit 材质；任意 Blender 节点网络无法据此直接变成游戏引擎 Shader。[Blender glTF](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html) |
| **3D 贴图：Substance 3D Designer** | 强大的程序化贴图图、参数暴露、2D/3D 预览、SBSAR 与位图输出。[Designer 工作区](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/workspace/interface) · [参数暴露](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/manage-parameters/exposing-a-parameter) | 核心 Substance Graph 的结果是图像/值输出，不等同于游戏运行时的任意动态 Shader。官方说明发布的 SBSAR 不能反编译回可编辑的 SBS 源图，因此交接时应保留源文件。[Graph 概念](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/substance-compositing-graph-key-concepts) · [SBSAR 发布](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/publishing-substance-3d-asset-files-sbsar) |
| **3D 贴图：Material Maker** | 开源、200 多节点、PBR 材质和社区库；可面向多引擎导出。[Material Maker 官网](https://materialmaker.org/) | 各目标交付形态不同：Unity `.mat`，Godot `.tres`，Unreal 5 用脚本，Blender 需用导出的贴图手工重建材质；不能视为同一实时 Shader 图无损移植。[Material Maker 导出](https://rodzill4.github.io/material-maker/doc/export.html) |
| **网页材质：PlayCanvas / Babylon / Three.js TSL** | 无需安装即可编辑或预览，且和各自 Web 运行时结合紧密。[PlayCanvas Shader Editor](https://developer.playcanvas.com/shader-editor/introduction/) · [Babylon NME](https://nme.babylonjs.com/) · [Three.js TSL](https://threejs.org/tsl/) | 交付通常仍依赖对应运行时；PlayCanvas 官方称其独立 Shader Editor 当前工作流仍较初级、未来计划整合主 Editor，且 Shader Pack 不含源节点图。这里不推断其他两者没有保存/分享功能。[PlayCanvas 工作流](https://developer.playcanvas.com/shader-editor/overview/workflow/) · [文件处理](https://developer.playcanvas.com/shader-editor/overview/file-handling/) |
| **网页材质：ShaderFrog** | Hybrid Graph 结合 GLSL 图编译与目标引擎插件，验证了独立于单一渲染器的作者工具路线。[ShaderFrog core](https://github.com/ShaderFrog/core) | 核心仓库将 API 标为实验性，输出 GLSL 与元数据后仍需引擎插件接入；这说明“导出 GLSL”不等于“材质在项目里可用”。[ShaderFrog core](https://github.com/ShaderFrog/core) |
| **交换标准：MaterialX** | 定义可跨应用交换的材质节点语义和格式，可作为 3D 子集的互操作基础。[MaterialX 规范](https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/documents/Specification/MaterialX.Specification.md) | 它是标准与实现库，不是直接替代 Unity/Blender 的完整作者工具；目标应用仍需实现节点和着色语义，标准本身不保证视觉一致。[MaterialX 规范](https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/documents/Specification/MaterialX.Specification.md) |

## “更好用”应怎样定义

仅有更精致的节点卡片、搜索、分组、节点预览、参数面板、分享链接或性能数字，很难形成优势。Unity/Unreal 已有节点预览与快捷键/统计；Substance Designer 有 2D/3D 预览和参数暴露；Babylon 的节点材质编辑器已有分享链接。因此评价应按**用户任务完整成功**，而不只按图编辑器的手感。[Unity 快捷键](https://docs.unity.cn/cn/Packages-cn/com.unity.shadergraph%4014.1/manual/shader-graph-keyboard.html) · [Unreal 统计](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-editor-ui?application_version=4.27) · [Substance 参数](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/manage-parameters/exposing-a-parameter) · [Babylon Node Material](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/materials/node_material/nodeMaterial.md)

建议的产品体验：

1. **先选作用范围和目标平台**：Sprite、对象/图层滤镜、全屏后效或 3D 表面是不同图类型。所选运行时决定可添加的节点和可导出的能力。Unity、Construct 和 Godot 的流程均说明这些位置语义不同。[Unity 图类型](https://docs.unity3d.com/ja/6000.0/Manual/urp/prebuilt-shader-graphs-urp.html) · [Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects) · [Godot 后效](https://docs.godotengine.org/en/stable/tutorials/shaders/custom_postprocessing.html)
2. **从视觉目标进入，图是进阶视图**：先呈现可交互效果和语义参数（例如溶解边宽、闪白持续时间、CRT 扫描线强度），允许用户再打开图查看或修改实现。这是设计建议，未验证哪种 UI 用户更偏好。
3. **在自己的素材和场景里实时比较**：上传 Sprite/序列帧/模型、切换背景与灯光、A/B 对比和动画时间线；保存这个测试场景随效果分享。已有工具具备各式预览，差异点是把“用户自己的实际场景”与导出验收绑定。
4. **错误和性能跟着图走**：对类型、色彩空间、坐标空间、透明度、采样次数、额外 Pass、Shader 变体给出具体节点定位和建议。Unreal/Unity 已有统计或变体警告；机会是把成本与目标平台、导出结果直接关联。[Unreal Stats](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-editor-ui?application_version=4.27) · [Unity Keywords](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.6/manual/Keywords-concepts.html)
5. **导出完整、可复现**：源图、Shader、材质参数、纹理、渲染配置、运行时代码和最小示例项目一起导出；给出目标版本、未支持节点和预览差异。跨引擎没有可免费获得的通用等价性，必须限定节点/目标并实际测试。[MaterialX 规范](https://materialx.org/Specification.html) · [Blender glTF](https://docs.blender.org/manual/en/4.2/addons/import_export/scene_gltf2.html)

## 能否建立优势

**能，但要靠持续兑现的交付质量来巩固体验优势。** 单一 UI 细节易被已有编辑器复制；更难复制的是经过大量真实项目验证的目标适配器、效果模板与示例、兼容性测试矩阵、版本升级路径和创作者社区。这是战略判断，需通过使用数据验证。

建议按当前 2D 切入：先解决“导入自己的 Sprite → 做出独特效果 → 导出 PixiJS WebGL 效果 → 在真实项目里正确运行”。再加单通道屏幕后效与 Unity URP 2D；3D 保留在研究和架构中，直到证明同一群用户确实需要。不要一次把后效、2D 材质、3D 材质做成一个号称万能的图系统。

## 验证方法（建议实验，不是已测结果）

- 选 3 个任务：Sprite 溶解、全屏 CRT、3D PBR 表面。每个任务给竞品和原型同样素材、同样目标项目。
- 记录首次可用预览耗时、完成并导入项目耗时、需查文档/写代码次数、最终视觉差异、重新编辑成功率。
- 用户包括初学者与有经验的技术美术/开发者，至少覆盖两种背景。避免仅靠专家主观评分。
- 预设停线条件：若原型只在网页预览时更快，导入目标项目仍更慢或不可靠，则设计优势尚未成立。
