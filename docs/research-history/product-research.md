# 浏览器节点式 Shader 编辑器：产品机会研究

研究日期：2026-09-28。这里的“价值”“定位”和产品建议是基于公开资料的判断，不是已验证的用户需求或收入预测。竞品细节另见 [competitive-landscape.md](./competitive-landscape.md)。

## 一页结论

**值得做一个范围清晰的验证版，但不宜以“网页版 Unity/Blender Shader Graph”作为定位。** Unity、Blender、PlayCanvas、Babylon.js、Material Maker 等已经覆盖了节点编辑、实时预览或跨工具导出的不同部分。PlayCanvas 的 Shader Editor 明确是浏览器里的节点式着色器工具；Material Maker 已宣称可导出供 Godot、Unity、Unreal 使用的 PBR 材质。因此，“可以在网页上拖节点做 Shader”本身难以构成优势。[PlayCanvas Shader Editor](https://developer.playcanvas.com/shader-editor/introduction/)；[Material Maker](https://materialmaker.org/)

更有希望的切入点是：**让缺少 Shader 专业知识的开发者和技术美术，在浏览器里快速制作可复用效果，并且明确、可靠地交付到目标项目。** 最初聚焦 Web 项目，再以经过真实 Unity 项目验收的有限节点集支持 Unity URP。对于每个目标格式，显示支持范围、导出警告和效果差异。不要承诺任意图都能无损转到所有引擎。

现有付费供给说明用户可能愿意为成熟工作流付费，但不足以证明新产品能取得收入。Unity Asset Store 将 Amplify Shader Editor 列为付费工具；PlayCanvas 对私有项目和团队功能收取订阅费。它们分别证明工具销售和编辑器协作存在收费先例，无法推算本产品的市场规模或转化率。[Unity Asset Store 付费工具榜](https://assetstore.unity.com/top-assets/top-paid)；[PlayCanvas 定价](https://playcanvas.com/plans)

| 已有方案 | 已经强在哪里 | 本产品可测试的切入点 |
| --- | --- | --- |
| Unity Shader Graph | 与 Unity 材质、管线和项目资产深度集成 | 零安装的效果探索、带实例的交接；Unity 内的最终效果仍须实测。 |
| Blender Shader Editor | 完整的 Blender 场景创作和渲染工作流 | 针对实际目标项目说明哪些节点可以交付，避免把 Blender 预览误当作通用导出。 |
| PlayCanvas Shader Editor | 已有网页节点编辑、预览和运行时 Shader Pack | 它的独立编辑器文档说明图保存在浏览器 IndexedDB，运行时包不含节点图；可测试带源图的分享和版本交接。 |
| Babylon.js Node Material Editor | 已有浏览器里的节点材质编辑器和图的导入导出 | 面向不限定 Babylon.js 的目标项目交付；其具体能力需按目标逐项比较。 |
| Material Maker | 大量程序化节点和多引擎材质输出 | 面向动态交互效果、可编辑参数及目标项目的可运行验收样例。 |

以上是产品切入假设，不是竞品没有其他实现的断言。逐项证据和边界见 [竞品核对](./competitive-landscape.md)，尤其是 [PlayCanvas 文件与导出说明](https://developer.playcanvas.com/shader-editor/overview/file-handling/) 与 [Material Maker 导出说明](https://rodzill4.github.io/material-maker/doc/export.html)。

## 目标用户和首个任务

建议首批目标用户：做互动网站、Web 游戏、产品展示和视觉原型的前端/创意开发者。他们需要在网页里看到结果，并将效果复制进 Three.js 项目。第二批再覆盖使用 Unity URP 的独立游戏团队。教育用户适合传播和模板增长，但付费能力须另行验证。

首个要完成的任务应当具体到：**从一个“溶解/描边/水波”模板出发，改 3 个参数，在自己的模型或 Sprite 上预览，下载资源包，放进一个空白 Web 项目后保持同样效果。** 与“支持几百种节点”相比，端到端成功率更能体现产品价值。

## 怎样比 Unity/Blender 的连线工具体验更好

这里的“更好”指上述任务的完成体验，不指全面取代这两个成熟工具。

| 用户环节 | 建议体验 | 为什么有机会 |
| --- | --- | --- |
| 起步 | 按视觉目标搜索模板；打开即有可编辑效果，而非空白画布 | 缩短第一次看到结果的时间。 |
| 调整 | 图上节点与右侧“外观参数”同步；改值立即预览；可拖入自己的 2D 图或 3D 模型 | 用户先调效果，再逐步理解图结构。 |
| 理解 | 每个节点展示小预览、输入输出类型、颜色空间/坐标空间；错误连线给出替代节点建议 | 减少技术术语和黑屏调试。 |
| 编辑 | 智能插入连线、常用节点搜索、自动整理、节点分组、撤销和版本历史 | 提升复杂图的可读性。 |
| 验证 | 预览可切换 Sprite/平面/球/自定义模型，切换灯光、背景、透明排序和移动端配置；同时显示性能预算 | 让效果更接近实际使用场景。 |
| 交付 | 先选目标平台，再编辑；每个节点显示兼容标记；导出包含 Shader、材质参数、纹理、示例调用及版本信息 | 解决“预览好看，项目里不能用”的落差。 |
| 复用 | 分享只读链接、效果分支、参数预设、嵌入式预览 | Web 入口比本地引擎编辑器更利于展示和协作。 |

核心设计原则：**在编辑时就暴露目标引擎限制，而不是到导出时才报错。** Unity Shader Graph 自身也区分 URP、HDRP、Built-In Render Pipeline 目标，且 Sprite Lit 是 URP 的专门图类型，这说明“Unity 导出”必须具体到管线和用途。[Unity Graph 设置](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/Graph-Settings-Tab.html)；[Unity URP 2D Sprite 图](https://docs.unity.cn/Packages/com.unity.render-pipelines.universal%4017.0/manual/ShaderGraph.html)

## 输出与技术边界

1. **保存可编辑图**：版本化 JSON/IR，包括节点、连线、参数、纹理引用、色彩空间和目标平台。它是产品的源文件，不能只保存生成的 GLSL/HLSL。
2. **Web V1**：选择一个明确运行时，例如 Three.js，导出可直接导入的 TypeScript/JavaScript 材质模块、资源文件、参数清单及最小示例。Three.js 的 TSL 已基于节点系统，`WebGPURenderer` 具备 WebGL 2 回退，这使它成为值得试验的后端；仍需锁定支持版本并做实际集成测试。[Three.js TSL 指南](https://threejs.org/tsl/)；[Three.js WebGPURenderer 手册](https://threejs.org/manual/pages/webgpurenderer)
3. **Unity V1**：限制为指定 Unity/URP 版本和少量 Unlit、Sprite、基础 Lit 效果。优先生成 HLSL/ShaderLab 或配套的 Unity 导入包，由导入器创建材质；是否能稳定生成可继续编辑的 `.shadergraph`，需要单独验证。Unity 官方支持 Shader Graph 自定义 HLSL 函数，也提供使用代码创建 Shader 资源的 API。[Unity Custom Function Node](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/Custom-Function-Node.html)；[Unity ShaderUtil.CreateShaderAsset](https://docs.unity3d.com/jp/current/ScriptReference/ShaderUtil.CreateShaderAsset.html)
4. **通用材质输出**：当图只使用标准 PBR 参数时可导出 glTF/GLB；任意过程纹理、顶点变形和自定义着色效果不能简单等同于 glTF 材质。glTF 2.0 的核心材质以 PBR 参数及标准扩展为主，Blender 也仅把识别到的节点映射为可导出的 glTF 材质。[Khronos glTF 2.0 规格](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc)；[Blender glTF 导出手册](https://docs.blender.org/manual/en/4.0/addons/import_export/scene_gltf2.html)
5. **长期互操作**：MaterialX 是值得研究的开放节点材质表示格式，可以评估为交换格式或部分节点语义参考；它不会自动解决不同引擎的灯光、渲染通道和自定义节点差异。[MaterialX 规格](https://materialx.org/Specification.html)；[MaterialX 格式定义](https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/documents/Specification/MaterialX.Specification.md)

需要明确告知用户：Shader 代码是 GPU 程序；**材质**还涉及参数值、纹理、渲染状态、目标管线和对象上的几何数据。仅提供一段代码往往不足以在目标项目里复现预览。此处是基于上述格式和 Unity 材质工作流的产品推论。[Unity 创建材质流程](https://docs.unity.cn/Packages/com.unity.shadergraph%4017.0/manual/First-Shader-Graph.html)；[glTF 材质结构](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc)

## 建议的最小验证版

只做两类可完整交付的效果：**2D Unlit/Sprite** 和 **3D Unlit + 少量基础 PBR 参数**。节点先覆盖常量、颜色、UV、纹理采样、时间、常用数学、混合、噪声、遮罩和输出；以效果模板组织它们。先不做后处理、复杂多 Pass、屏幕采样、自定义光照、任意用户代码和跨所有引擎的“无损导出”。

建议交付顺序：

1. Web 原型：模板 → 调参 → 自己的图片/模型预览 → Three.js 示例项目跑通。
2. 编译核心：类型检查、坐标空间和颜色空间、依赖排序、错误定位、各目标能力矩阵。
3. Unity URP 小范围导出：选定版本、选定节点集，通过空白项目导入验证。
4. 分享、历史和团队能力：在确认多人复用是购买理由后再建。

## 变现假设

| 方案 | 适合卖什么 | 主要风险 |
| --- | --- | --- |
| 免费基础编辑器 + Pro | 私有项目、版本历史、更多存储、团队审阅、品牌化展示、批量导出 | 不能把基本可用的导出锁死，否则难以建立信任。 |
| 团队席位 | 共享库、权限、品牌模板、审阅和可追溯版本 | 需要先证明团队真实协作频率。 |
| Unity/其他引擎集成包 | 经版本验证的导入器、更新兼容和优质模板 | 维护成本高，随引擎版本变化；适合限定支持范围。 |
| 模板市场与教育 | 精品特效、教程、课程授权 | 供给和质量审核成本高，前期收入不确定。 |

价格只应作为测试假设。可以用 PlayCanvas 的免费、个人订阅、团队席位价格和 Unity 插件的一次性售价做参照，但这两类工具交付的价值不同，不能直接照搬。[PlayCanvas 定价](https://playcanvas.com/plans)；[Unity Asset Store 付费工具榜](https://assetstore.unity.com/top-assets/top-paid)

## 先验证，再扩大范围

以下数字是**建议的决策门槛**，不是现有市场数据：

- 找 15–20 位目标用户，记录最近一次做 Shader 的实际过程、使用工具、从预览到项目的失败点、是否付费过。
- 让至少 5 位用户带自己的资产完成同一任务；观察能否在 10 分钟内产出并在自己的 Web 项目中使用。
- 用 3 个代表性效果做 Web 与 Unity 对照：编译通过、外观差异可解释、材质参数和纹理全部带齐。
- 在展示可工作的导出包后询问购买承诺或试用付费意愿；不要只询问“觉得这个想法好不好”。

如果用户只把它当免费玩具，或者导出可靠性持续达不到预期，应收窄为 Web 特效创作工具；如果团队持续需要共享、审阅和版本管理，再投入协作 SaaS。

## 当前判断与待证问题

**我的判断：有产品价值，也有变现机会；但护城河不是节点数量，而是清晰场景、顺手的创作过程，以及可复现的导出结果。** 最大的技术风险是跨引擎视觉一致性，最大的商业风险是用户在免费成熟工具已经满足需求时，没有足够强的理由迁移或付费。

待证问题：首批用户究竟更重视 Web 项目导出、Unity 导出，还是无需安装的教学/分享？他们愿意为“省下哪一步”付款？这些需要访谈和可运行原型回答。
