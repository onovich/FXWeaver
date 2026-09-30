# UnregisteredScene Shader 使用核查与 FXWeave 首批建议

日期：2026-09-30。状态：**项目实证分析，待用户选型**。只读核查 `D:\UnityProjects\UnregisteredScene` 的提交 `5bdf4c4f81d3dcf7f9eb12721fc889d420c72dc2`；该工作区已有两处字体资产修改，分析未触碰它们，也未启动 Unity。方法是核对 Shader `.meta` GUID、Material 的 `m_Shader`、运行时 Prefab/SO/Timeline 引用和 C# 的参数驱动。**静态接线证明作品配置与代码路径存在，不能证明某次玩家流程已经播放或实际播放频率。**

## 哪些效果接入了项目

| 效果 | 可核对的使用链 | 对 FXWeave V0 的判断 |
| --- | --- | --- |
| **径向燃烧／烧蚀** `Shader_Burn` | `Mat_Burn` 被拼图 Prefab、第一章 UI 布局和调查界面 Theme 引用；`SO_FPTransition_Burn_001` 在第一章 Timeline 中；`UIInvestigationAnomalyView` 和 `UIInvestigationFieldCompositeView` 在运行时复制材质并改 `_Radius`、`_Position`。 | **首批优先**。比通用受击闪白更贴近当前项目，包含源图、噪声、径向距离、边缘着色和 Alpha 裁切。对应[候选 03](./13-v0-2d-effect-candidates.md)。 |
| **溶融／波纹扭曲** `Shader_Melt` | `Mat_Melt` 被第一章 UI 布局与 `SO_FPTransition_Melt_003` 引用，后者由第一章 Timeline 引用；`FPTransitionDomain` 经 `FPMaterialModel` 驱动 `_DistortionStrength`、`_RippleFrequency` 和 `_RippleAmplitude`。 | **首批优先**。可先做局部 Sprite/Container Filter 版本，验证时间、UV 扭曲及源纹理重新采样。对应[候选 05](./13-v0-2d-effect-candidates.md)。 |
| **全息扫描／信号故障** `Shader_UIHologramVariants`、`Shader_UITerminalHologram` | 运行时 `UIInvestigationTheme` 引用全息材质，调查界面 Prefab 引用 Theme；`FPHologramEffect`、`UIInvestigationTerminalHologram` 驱动强度、时间、扫描和信号参数。 | **首批第三项的候选**。只选一个局部扫描／通道错位形态，不把多变体、肖像遮罩和图集投影整体搬入 V0。对应修订后的[候选 09](./13-v0-2d-effect-candidates.md)。 |
| **笔记页揭示** `Shader_UIJournalReveal` | 运行时 `CollectionArt.asset` 引用 Shader；`UICollectionPanel.FirstReveal` 动态建材质并更新 `_Reveal`。 | **低风险备选第三项**。适合先验证 UI 进度与确定性噪声，但与燃烧效果同属 Alpha 揭示，覆盖的节点结构较接近。对应新增[候选 10](./13-v0-2d-effect-candidates.md)。 |
| **场景遮罩转场** `Shader_Transition` | 两个运行时材质挂在 `UISceneMaskPanel.prefab`；`SO_SceneTransition_BlackScreen_Then_Circle` 被第一章及两个小游戏 Timeline 引用；`UISceneMaskDomain` 先捕获 UI Camera 到 RenderTexture，再由 `UISceneMaskPanel` 驱动两层材质的 `_T` 和溶解贴图。 | **使用证据强，暂缓首批**。完整效果含场景截图、双层合成与时序，超出单个 Sprite/Container Filter 图的生成边界。可作为 V0 后续宿主集成任务。 |
| **贴图发光** `Shader_Glow` | `Mat_Glow_Sample` 被第一章 UI 布局与 `SO_FPTransition_Glow_002` 引用，后者在第一章 Timeline 中；`FPMaterialModel` 改 `_GlowIntensity`。 | **后置**。这里是 EmissionMap 旋转/叠色和 URP HDR 色值，不能等同于先前清单中的“外轮廓 Glow/Bloom”；PixiJS 默认单 Filter 预览不应宣称与 Unity HDR/Bloom 画面一致。 |
| **通用 Dissolve、Ripple、RGBShift 等** | 各自材质只在 `Resources_Editor/SceneShaderTest.unity` 找到引用，未发现与上述相当的运行时 Prefab/SO 连接。 | **实验素材，不按项目常用排序**。原先建议的受击闪白和外描边也未在当前项目中发现对应的自有 Shader 使用链。 |

关键原始证据位于另一仓库的 `Assets/Scripts_Runtime/Shaders/Shader_Burn.shader`、`Shader_Melt.shader`、`Shader_Glow.shader`、`Shader_UIHologramVariants.shader`、`Shader_UIJournalReveal.shader`；运行时链路见 `Assets/Resources_Runtime/Timeline/SO_Timeline_Ch1_01.asset`、`Assets/Resources_Runtime/UI/UIInvestigation/UIInvestigationTheme.asset`、`Assets/Scripts_Runtime/Application_FP/Domains/FPTransitionDomain.cs` 和 `Assets/Scripts_Runtime/Application_UI/Panels/UISceneMask/UISceneMaskPanel.cs`。

## 更新后的首批建议

**推荐 `03 径向燃烧／烧蚀 + 05 局部溶融／波纹扭曲 + 09 局部全息扫描／信号故障`。** 前两项有明确的第一章运行时资源与参数驱动链，分别检验噪声遮罩/Alpha 和时间驱动的 UV 重采样。第三项来自调查 UI 的实用风格，但只做一个可从空图搭出的局部版本。若希望降低首批难度，用 **10 笔记页揭示**替换 09；如只选两项，优先 03 和 05。

这是一组 **PixiJS Web 自用版的创作目标**，不是把现有 Unity Shader 原样转译成 WebGL，更不是 Unity 运行时导出。Unity 的 Burn 使用原图 UV 与 UI Stencil，Melt 同时支持 UI 与 URP Render Graph，场景转场依赖 RenderTexture；Pixi Filter 接收宿主已渲染内容。V0 应以视觉意图和参数行为为对照，明确源纹理、Alpha、坐标、时间和滤镜区域的 Web 语义；Unity URP 集成属于后续目标适配阶段。

## 选型门槛

用户从上述编号中拍板 2–3 项后，才把这些候选写入 `$goalnext` 执行指南。首批每件作品都应由 FXWeave 节点图从空图制作，预览使用其生成 Shader，保存重开可重现；现有 Unity Shader 只作视觉/行为参考，不得作为隐藏的运行时实现。
