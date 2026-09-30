# 收窄到 2D 材质与后效：产品判断

研究日期：2026-09-28。本文把“2D”理解为游戏 Sprite、图层、UI 或整个画面的实时视觉效果，而非仅生成静态贴图。策略与商业判断是待验证假设，产品能力陈述附官方来源。竞品核对另见 [2d-competitive-landscape.md](./2d-competitive-landscape.md)。

## 结论

**比同时做 2D 和 3D 更适合作为第一款产品，但应进一步选定“2D 游戏特效交付”这个任务。** 2D 可以先避开网格、PBR、复杂灯光、法线和多渲染管线兼容的大部分工作；用户也容易拿自己的 PNG、Sprite Sheet 和游戏画面来判断效果。它并不消除引擎差异：Sprite 材质、对象滤镜和全屏后处理进入渲染流程的位置不同，同一个节点图不一定能直接共用一个导出文件。

“可视化编写 2D Shader”仍不是空白市场。Unity URP 已有 Sprite Lit/Unlit 和 Fullscreen Shader Graph；Phaser 有内置的对象与相机 FX；PixiJS 支持给对象/容器添加滤镜和自定义 Shader。因此产品定位应是**快速制作有风格的 2D 效果，并交付到项目中可复现**，而不是单纯的拖线编辑器。[Unity URP 图类型](https://docs.unity3d.com/ja/6000.0/Manual/urp/prebuilt-shader-graphs-urp.html)；[Phaser FX](https://docs.phaser.io/phaser/concepts/fx)；[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters)

更强的对照是 Construct 3：官方文档列出 80 多种可挂在对象、图层或整幅画面的效果，还能串联和运行时调参。免费浏览器工具 NixieFX 甚至已有节点材质、预览和后端兼容报告，不过重心是粒子 VFX。它的 PixiJS 路径既有烘焙层级，也有动态 Tier 2 粒子 Shader；因此不能把它说成仅会烘焙。因而“模板多”“兼容报告”也不能单独成为卖点；本产品需在**非粒子的 Sprite 和画面后效，并且无需专有运行时即可集成**这项承诺上拿出可测试的结果。[Construct 效果手册](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects)；[NixieFX 功能说明](https://nixiefx.com/vfx-runtime-docs/)；[NixieFX 编辑器手册](https://nixiefx.com/editor-manual/)

## 三个容易混淆的输出

| 输出类型 | 作用对象 | 例子 | 导出时要交付什么 |
| --- | --- | --- | --- |
| Sprite 材质 | 单个 Sprite/纹理，通常逐像素处理并保留透明度 | 溶解、换色、受击闪白、流光、UV 扭曲 | Shader、纹理、参数、混合/透明状态、应用示例。 |
| 对象或图层滤镜 | Sprite 或整组对象渲染完后再处理 | 描边、模糊、投影、局部 Bloom | Shader、输入纹理尺寸、滤镜区域与边距、渲染目标配置、应用代码。 |
| 全屏后效 | 相机或整个画面输出 | CRT、像素化、故障、渐晕、调色、全屏模糊 | Shader、通道顺序、屏幕纹理输入、必要的渲染通道/Renderer Feature、应用示例。 |

这三个类型应在产品中作为不同的“画布模式”和输出节点。PixiJS 允许把滤镜加到 Sprite/Container，Phaser 明确区分 Pre FX 与 Post FX，并可在 Camera 上用 FX。Unity 则分别提供 Sprite 图类型与 Fullscreen 图类型，后者须通过 Full Screen Pass Renderer Feature 连接渲染流程。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters)；[Phaser FX](https://docs.phaser.io/phaser/concepts/fx)；[Unity Fullscreen 图](https://docs.unity3d.com/cn/6000.0/Manual/urp/prebuilt-shader-graphs-urp-fullscreen.html)；[Unity Full Screen Pass](https://docs.unity3d.com/cn/6000.0/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html)

## 第一版产品建议

目标用户先定为**制作 2D Web 游戏和互动内容的小团队**。首个导出后端只选一个运行时，建议 PixiJS 8 的 WebGL 路径；它有明确的自定义 Filter API，可在 Sprite 或容器上应用效果。此时导出的是 Sprite/容器滤镜，并非 PixiJS 的原生 Sprite 材质。真正需要自定义几何与 Shader 时，PixiJS 另有 Mesh API；若要同时支持其 WebGPU 后端，自定义滤镜还须提供 `gpuProgram`，应作为后续独立验收目标。第二个引擎根据访谈结果选 Unity URP 2D 或 Phaser。Unity 2D 光照是专门的 2D 渲染流程，涉及独立的光源、Shader Graph 子目标和渲染通道，必须以指定版本的项目实际验收。[PixiJS 自定义滤镜](https://pixijs.com/8.x/guides/components/filters)；[PixiJS Mesh](https://pixijs.com/8.x/guides/components/scene-objects/mesh)；[Unity 2D 光照系统](https://docs.unity3d.com/cn/6000.0/Manual/urp/Lights-2D-intro.html)

一个可验证的最小流程：导入用户的 Sprite 或 Sprite Sheet → 从效果模板选“溶解/受击闪白/换色” → 直接调参数和动画曲线 → 切换深色/浅色背景与不同分辨率预览 → 下载带代码、纹理和示例场景的 PixiJS 包 → 在用户自己的项目运行。第二个模式再做单通道全屏效果，如像素化、调色或 CRT；模糊、Bloom 和复杂多通道效果放在后面，因为它们常需要额外渲染目标和多次渲染。[PixiJS 场景对象和滤镜](https://pixijs.com/8.x/guides/components/scene-objects)；[Godot 多通道后效说明](https://docs.godotengine.org/en/stable/tutorials/shaders/custom_postprocessing.html)

相比通用节点图，2D 专属体验应优先做：

- **用实际游戏素材预览**：透明边缘、精灵图动画、九宫格/Tile、像素画缩放、不同背景和分辨率。用户能直接发现裁边、采样和锯齿问题。
- **动画作为一等概念**：时间、曲线、事件触发参数；用户可把“受击闪白 0.15 秒”作为完整预设导出，而非手动写一段参数更新代码。
- **明确应用范围**：单个 Sprite、容器/图层、相机/全屏，用三类出口区分可用节点和性能成本。
- **导出即集成**：示例代码和工程、依赖版本、参数 API、纹理资源、截图对照。编辑时实时显示目标运行时支持与降级信息。
- **性能可见**：显示采样次数、额外渲染通道、滤镜面积以及低端设备预览档位；不要把它们藏在导出说明里。

## 商业判断

收窄 2D 会降低首版研发和展示成本，但潜在客户群也更窄，许多常见效果在 Construct、Phaser、PixiJS 或引擎自身已有实现。付费理由不能只是“能做模糊和渐晕”，而应该是**更快地制作团队独有的效果、管理参数版本，以及拿到可直接使用的目标项目包**。Construct 和 Phaser 的内置 FX 清单说明基础特效可能难以单独收费。[Construct 效果手册](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects)；[Phaser FX](https://docs.phaser.io/phaser/concepts/fx)

建议的收费试验：基础创作与本地导出免费；专业版提供私有项目、可回溯版本、团队模板库、批量变体、协作审阅和已验证的引擎导出包。也可试一次性购买的引擎集成工具，但要预留随 Unity 等版本维护的成本。定价和购买意愿均需通过展示真实导出结果来验证，不能从其他编辑器的标价直接推算。

## 下一步验证门槛

以下是建议目标，不是市场数据：做一个交互原型，包含 3 个 Sprite 效果和 1 个全屏效果；在空白 PixiJS 项目中验证导出。让 5 位真实 2D 创作者带自己的素材完成任务，观察是否比他们现有流程更快，以及是否愿意用在正式项目。若“效果编辑”受欢迎但导出困难，应继续缩窄节点能力；若“快速出效果”只被当作玩具，应转向模板资产或教学定位。
