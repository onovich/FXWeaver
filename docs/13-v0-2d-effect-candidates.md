# FXWeave V0：2D 游戏效果候选

日期：2026-09-30。状态：**首批作品已选定**。用户已同意以 **PixiJS 8 WebGL 的 Sprite/Container Filter** 作为 V0 首个网页渲染目标，并批准 **03 径向燃烧／烧蚀 + 05 局部溶融／波纹扭曲 + 09 局部全息扫描／信号故障**。实施范围见 [Phase 1 执行指南](./15-v0-generated-filter-goal-mode-execution-guide.md)；其余条目为后续候选。

## 筛选依据

PixiJS 8 的 Filter 可以作用于 Sprite 或 Container，并提供自定义 WebGL Shader 与参数资源；官方滤镜覆盖颜色调整、模糊、位移和噪声。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) PixiJS 维护的扩展滤镜目录还列有描边、发光、换色、像素化、冲击波和故障画面等效果。[pixi-filters 目录](https://github.com/pixijs/filters/blob/main/README.md) 独立的 GDQuest 2D Shader 示例也包含溶解、描边、换色、水面等题材。[GDQuest Shader 示例](https://github.com/gdquest-demos/godot-shaders) 更细的官方来源与实现边界见[专题研究笔记](./research-history/2d-game-filter-effect-candidates.md)。

这些来源证明效果类型有可参考的实现与使用场景，**不构成使用率排名**。下表的游戏用途、优先级和难度是针对 FXWeave 首个自用版的策划判断；最终应由项目方的游戏类型、素材和近期需求决定。

## 候选清单

| 编号 | 效果名 | 2D 游戏中的用途 | 对节点工具的验证价值 | V0 难度与边界 |
| --- | --- | --- | --- | --- |
| **01** | **受击闪白／闪色** | 角色受伤、无敌帧、可破坏物受击反馈 | 源图采样、颜色混合、强度参数、保留原透明度 | **低**；适合第一条完整生成链路，但单独不足以证明节点工具的深度 |
| **02** | **交互描边／目标高亮** | 鼠标悬停、可拾取物、锁定目标、任务物件提示 | 透明边缘、邻近像素采样、像素尺寸、轮廓颜色和宽度 | **中**；必须检验滤镜区域扩展，避免轮廓在 Sprite 边界被裁切 |
| **03** | **径向燃烧／烧蚀** | 拼图、调查 UI、物体局部显隐 | 第二张噪声纹理、径向距离、边缘着色、进度与 Alpha 裁切 | **中**；素材与预览参数需随工程保存，不能用手写 Shader 补边缘效果 |
| **04** | **阵营换色／调色板替换** | 敌我阵营、角色皮肤、装备染色、状态变色 | 颜色比较与容差、替换映射、透明度和阴影保留 | **中**；抗锯齿与压缩纹理可能使精确颜色匹配失效 |
| **05** | **局部溶融／波纹扭曲** | 调查界面与第一章 UI 的局部转场 | 时间、频率、振幅和强度驱动 UV 偏移并重新采样源图 | **中**；需说明采样越界和作用范围，不应误称为能读取滤镜外的背景 |
| **06** | **径向冲击波** | 爆炸、技能命中、地面震荡 | 中心点、距离、波前、时间、UV 位移 | **中高**；作用区域与坐标空间需要明确，若扭曲整屏要用场景容器预览 |
| **07** | **拾取物／技能发光** | 稀有掉落、充能、关键道具、危险提示 | Alpha 外扩、邻域采样、颜色与强度 | **高**；边界扩展及多次采样成本明显，可能需要多 Pass，不宜作为第一条生成链路 |
| **08** | **像素化／马赛克** | 复古风格、受干扰状态、转场 | UV 量化、纹理采样、像素块大小参数 | **低中**；需在不同分辨率与最近邻／线性采样下检查一致性 |
| **09** | **局部全息扫描／信号故障** | 调查终端、人物投影、科幻 UI | 扫描线、通道偏移、时间、噪声与局部遮罩 | **高**；首批只取一个局部形态；整屏 CRT 和完整多变体全息系统后置 |
| **10** | **笔记页揭示** | 图鉴、调查日志、剧情页的渐进显现 | 进度、确定性噪声、柔边、Alpha | **低中**；便于快速完成，但与 03 都属于揭示类结构 |

上述 01、02、04、07、08、09 可对照 [pixi-filters 目录](https://github.com/pixijs/filters/blob/main/README.md)中的 ColorOverlay、Outline、ColorReplace、Glow、Pixelate、Glitch 家族；05 可对照 [PixiJS 内置 DisplacementFilter](https://pixijs.com/8.x/guides/components/scene-objects)；06 对照扩展目录中的 Shockwave；03 可对照 [GDQuest 2D dissolve 示例](https://github.com/gdquest-demos/godot-shaders)。03、05、09、10 另有用户项目中的实际资产和代码线索，见[使用核查](./14-unregisteredscene-shader-usage-review.md)。FXWeave 应用自己的节点图生成 Shader，这些现成滤镜和 Unity Shader 仅供验证题材与预期外观，不能作为最终作品的隐藏实现。

## 已选定的首批三个

基于用户项目实际接线，**首批确定为：03 径向燃烧／烧蚀 + 05 局部溶融／波纹扭曲 + 09 局部全息扫描／信号故障**。03 对应多个运行时 UI 场景、第一章 Timeline 和参数驱动；05 对应第一章 UI/Timeline 的动画扭曲；09 对应调查 UI 的全息风格。它们分别检验噪声遮罩/Alpha、UV 重采样/时间、扫描线/通道偏移/局部遮罩。

09 只做一个局部版本；现有 Unity Shader 的多变体、人物遮罩和图集投影不进入首批。**10 笔记页揭示**保留为后续备选。先前的 01 受击闪色和 02 外描边仍是通用 2D 候选，但在该项目没有发现同等级的运行时使用证据。

这里的“源图采样”指 Filter 对宿主已渲染内容的输入纹理，不自动等同于 Sprite 原图集 UV。开发前还需固定具体 PixiJS 8 小版本、Filter 区域/像素尺寸与预乘 Alpha 语义；边缘外扩的效果必须检查 padding、透明 PNG、图集帧和不同分辨率。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [PixiJS Textures](https://pixijs.com/8.x/guides/components/textures) · [FilterOptions](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html)

## 执行边界

没有适宜入仓的实际素材时，可先用有透明边缘的 Sprite、UI Container 组合和噪声贴图做可重复的测试素材；在把某项宣布为自用版作品前，再用项目方素材复验。三件作品都应从空节点图制作，详情见 [Phase 1 执行指南](./15-v0-generated-filter-goal-mode-execution-guide.md)。

未选定的效果保留为后续节点能力候选。
