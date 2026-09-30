# FXWeave V0：2D 游戏效果候选

日期：2026-09-30。状态：**待用户选定首批作品**。用户已同意以 **PixiJS 8 WebGL 的 Sprite/Container Filter** 作为 V0 首个网页渲染目标。现已结合用户的 [UnregisteredScene Shader 使用核查](./14-unregisteredscene-shader-usage-review.md)调整推荐顺序；本文仍是待选择的清单。

## 筛选依据

PixiJS 8 的 Filter 可以作用于 Sprite 或 Container，并提供自定义 WebGL Shader 与参数资源；官方滤镜覆盖颜色调整、模糊、位移和噪声。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) PixiJS 维护的扩展滤镜目录还列有描边、发光、换色、像素化、冲击波和故障画面等效果。[pixi-filters 目录](https://github.com/pixijs/filters/blob/main/README.md) 独立的 GDQuest 2D Shader 示例也包含溶解、描边、换色、水面等题材。[GDQuest Shader 示例](https://github.com/gdquest-demos/godot-shaders) 更细的官方来源与实现边界见[专题研究笔记](./research-history/2d-game-filter-effect-candidates.md)。

这些来源证明效果类型有可参考的实现与使用场景，**不构成使用率排名**。下表的游戏用途、优先级和难度是针对 FXWeave 首个自用版的策划判断；最终应由项目方的游戏类型、素材和近期需求决定。

## 候选清单

| 编号 | 效果名 | 2D 游戏中的用途 | 对节点工具的验证价值 | V0 难度与边界 |
| --- | --- | --- | --- | --- |
| **01** | **受击闪白／闪色** | 角色受伤、无敌帧、可破坏物受击反馈 | 源图采样、颜色混合、强度参数、保留原透明度 | **低**；适合第一条完整生成链路，但单独不足以证明节点工具的深度 |
| **02** | **交互描边／目标高亮** | 鼠标悬停、可拾取物、锁定目标、任务物件提示 | 透明边缘、邻近像素采样、像素尺寸、轮廓颜色和宽度 | **中**；必须检验滤镜区域扩展，避免轮廓在 Sprite 边界被裁切 |
| **03** | **噪声溶解／重组** | 敌人死亡、召唤、传送、物体出现与消失 | 第二张纹理、阈值、平滑过渡、边缘着色、时间或进度参数 | **中**；素材与预览时间需随工程保存，不能用手写 Shader 补边缘效果 |
| **04** | **阵营换色／调色板替换** | 敌我阵营、角色皮肤、装备染色、状态变色 | 颜色比较与容差、替换映射、透明度和阴影保留 | **中**；抗锯齿与压缩纹理可能使精确颜色匹配失效 |
| **05** | **水波／热浪扭曲** | 水面、火焰、护盾、传送门局部折射 | UV 偏移、噪声或位移贴图、时间、重新采样源图 | **中**；需说明采样越界和作用范围，不应误称为能读取滤镜外的背景 |
| **06** | **径向冲击波** | 爆炸、技能命中、地面震荡 | 中心点、距离、波前、时间、UV 位移 | **中高**；作用区域与坐标空间需要明确，若扭曲整屏要用场景容器预览 |
| **07** | **拾取物／技能发光** | 稀有掉落、充能、关键道具、危险提示 | Alpha 外扩、邻域采样、颜色与强度 | **高**；边界扩展及多次采样成本明显，可能需要多 Pass，不宜作为第一条生成链路 |
| **08** | **像素化／马赛克** | 复古风格、受干扰状态、转场 | UV 量化、纹理采样、像素块大小参数 | **低中**；需在不同分辨率与最近邻／线性采样下检查一致性 |
| **09** | **局部全息扫描／信号故障** | 调查终端、人物投影、科幻 UI | 扫描线、通道偏移、时间、噪声与局部遮罩 | **高**；首批只取一个局部形态；整屏 CRT 和完整多变体全息系统后置 |
| **10** | **笔记页揭示** | 图鉴、调查日志、剧情页的渐进显现 | 进度、确定性噪声、柔边、Alpha | **低中**；便于快速完成，但与 03 都属于揭示类结构 |

上述 01、02、04、07、08、09 可对照 [pixi-filters 目录](https://github.com/pixijs/filters/blob/main/README.md)中的 ColorOverlay、Outline、ColorReplace、Glow、Pixelate、Glitch 家族；05 可对照 [PixiJS 内置 DisplacementFilter](https://pixijs.com/8.x/guides/components/scene-objects)；06 对照扩展目录中的 Shockwave；03 可对照 [GDQuest 2D dissolve 示例](https://github.com/gdquest-demos/godot-shaders)。03、05、09、10 另有用户项目中的实际资产和代码线索，见[使用核查](./14-unregisteredscene-shader-usage-review.md)。FXWeave 应用自己的节点图生成 Shader，这些现成滤镜和 Unity Shader 仅供验证题材与预期外观，不能作为最终作品的隐藏实现。

## 我建议先选哪三个

基于用户项目实际接线，**推荐组合改为：03 径向燃烧／烧蚀 + 05 局部溶融／波纹扭曲 + 09 局部全息扫描／信号故障**。03 对应多个运行时 UI 场景、第一章 Timeline 和参数驱动；05 对应第一章 UI/Timeline 的动画扭曲；09 对应调查 UI 的全息风格。它们分别检验噪声遮罩/Alpha、UV 重采样/时间、扫描线/通道偏移/局部遮罩。

09 只建议做一个局部版本；现有 Unity Shader 的多变体、人物遮罩和图集投影不进入首批。如果希望更快完成三件作品，用 **10 笔记页揭示**替换 09；若只做两件，先做 **03 + 05**。先前的 01 受击闪色和 02 外描边仍是通用 2D 候选，但在该项目没有发现同等级的运行时使用证据。

这里的“源图采样”指 Filter 对宿主已渲染内容的输入纹理，不自动等同于 Sprite 原图集 UV。开发前还需固定具体 PixiJS 8 小版本、Filter 区域/像素尺寸与预乘 Alpha 语义；边缘外扩的效果必须检查 padding、透明 PNG、图集帧和不同分辨率。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [PixiJS Textures](https://pixijs.com/8.x/guides/components/textures) · [FilterOptions](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html)

## 拍板时需要确定的内容

请从编号中选 **2–3 项**；可直接回复如 `03 + 05 + 09` 或 `03 + 05 + 10`。没有实际素材时可先用有透明边缘的 Sprite、UI Container 组合和噪声贴图做可重复的测试素材；在把某项宣布为自用版作品前，再用项目方素材复验。

选定后，架构会话再用 `$goalnext` 编写下一阶段执行指南并派发给开发会话；未选定的效果保留为后续节点能力候选。
