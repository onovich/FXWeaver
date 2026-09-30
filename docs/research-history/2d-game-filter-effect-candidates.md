# FXWeaver：2D 游戏 Filter 效果候选

研究日期：2026-09-30。目标是为 **PixiJS 8 WebGL 的 Sprite/Container Filter** 选择 V0 自用作品；下列“游戏用途”和实现拆解是产品策划推断，**不是使用率统计**。PixiJS、Phaser 与 Construct 官方资料证实这些效果类型有现成实现或相近能力，但不证明玩家或开发者使用频率。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [Phaser FX](https://docs.phaser.io/phaser/concepts/fx) · [Construct Effects](https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/effects)

## 宿主事实与边界

- PixiJS 的 Filter 可以挂在 Sprite 或 Container 上，并对对象及其子对象**渲染后的内容**做处理；多个 Filter 按数组顺序执行。自定义 WebGL Filter 使用 `glProgram` 和 `resources`。这与直接读取原始图集纹理、改 Sprite 几何或全屏相机后效不是同一种契约。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [Scene Objects](https://pixijs.com/8.x/guides/components/scene-objects) · [Mesh](https://pixijs.com/8.x/guides/components/scene-objects/mesh)
- 官方内置能力有颜色矩阵、位移、模糊和噪声；官方 `pixi-filters` 另有描边、辉光、换色、像素化、冲击波、Bloom 等。`pixi-filters` v6 对应 PixiJS v8；v8 迁移文档说明旧 `@pixi/filter-*` 包不再维护，应使用 `pixi-filters` 子模块。**这些实现仅用来确认效果可行与对照画面；FXWeaver 作品仍须由节点图生成 Shader。** [PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [pixi-filters](https://pixijs.io/filters/docs/index.html) · [v8 migration](https://pixijs.com/8.x/guides/migrations/v8)
- Filter 选项包括 `padding`、`resolution` 等；向对象外扩的效果需要边距，否则会裁切。PixiJS 提醒 Filter 会增加性能和内存成本。Texture 的 `frame`、`trim`、`uvs`、`alphaMode`、`scaleMode` 也会影响带透明边的 Sprite/图集预览。因此每个候选都应检查透明 PNG、图集帧、缩放及边界。[FilterOptions v8.14.0](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html) · [Scene Objects](https://pixijs.com/8.x/guides/components/scene-objects) · [Textures](https://pixijs.com/8.x/guides/components/textures)

## 候选清单

“建议级别”是 **FXWeaver 内部验证价值**，不是市场热度。节点/输入列是从 Filter 宿主与对应效果推导出的最小能力，具体算法和性能要以生成后的实例验证。

| 候选作品 | 2D 游戏用途（策划推断） | 节点与输入需求（实现推断） | 建议级别与依据 |
| --- | --- | --- | --- |
| **受击闪白 / 颜色脉冲** | 角色或敌人受击反馈；颜色和持续时间可调 | 源颜色/Alpha、颜色常量、时间或外部强度、`mix`；保留原透明轮廓 | **首批 A**：单次源采样，验证生成、实时参数和透明语义。`pixi-filters` 的 ColorOverlayFilter 证实颜色覆盖与强度参数存在；注意单纯闪烁显隐已有非 Shader 行为，作品应是“轮廓内颜色脉冲”。[ColorOverlayFilter](https://pixijs.io/filters/docs/ColorOverlayFilter.html) · [Construct Flash](https://www.construct.net/en/make-games/manuals/construct-3/scripting/scripting-reference/behavior-interfaces/flash) |
| **噪声溶解 / 生成消失** | 怪物死亡、道具出现、传送/关卡物件转换 | 源颜色/Alpha、进度、噪声纹理或确定性噪声、阈值、`smoothstep`、边缘颜色；进度 `0→1` | **首批 A**：与调色不同，验证第二纹理或程序噪声、时间/进度、Alpha 剪裁。Phaser 官方 Wipe/Reveal 有可控进度；噪声溶解是我们在同一“进度遮罩”任务上的创作扩展，并非 PixiJS 内置同名效果。[Phaser Wipe](https://docs.phaser.io/api-documentation/3.90.0/class/fx-wipe) · [PixiJS custom Filter](https://pixijs.com/8.x/guides/components/filters) |
| **交互描边 / 选中高亮** | 鼠标悬停、可拾取物、目标锁定 | 源 Alpha 的邻域采样、像素尺寸、厚度、颜色、内/外侧混合；宿主 `padding` | **首批 A，风险最高**：验证多次采样、像素单位、透明外扩、边缘裁切和采样成本。官方 OutlineFilter 暴露厚度、颜色、质量，明确质量提高会更慢。[OutlineFilter](https://pixijs.io/filters/docs/OutlineFilter.html) · [FilterOptions](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html) |
| **换色 / 队伍变体** | 同一 Sprite 做阵营色、稀有度或状态变体 | RGB 颜色距离/容差、目标色、遮罩保护、高透明边处理；可扩为多色映射 | **第二批 B**：很实用，但单色版结构与闪白接近。官方 ColorReplaceFilter 用原色、目标色、容差；多色版最大色数在构造时决定，提醒“变体数量”可能是编译期选择。[ColorReplaceFilter](https://pixijs.io/filters/docs/ColorReplaceFilter.html) · [MultiColorReplaceFilter options](https://pixijs.io/filters/docs/MultiColorReplaceFilterOptions.html) |
| **流光扫过 / 奖励闪光** | 战利品、按钮、装备品质或互动提示 | 滤镜局部坐标、进度、方向、带宽、柔边、加色/混色、Alpha 遮罩 | **第二批 B**：验证空间渐变与动画；Phaser 官方有 Shine，说明该类效果可用于对象；参数设计由我们推断。[Phaser FX](https://docs.phaser.io/phaser/concepts/fx) |
| **热浪 / 水波扭曲** | 水面、火焰附近、魔法波纹 | 源 UV、时间、噪声或位移图、方向/振幅、二次源采样、边界处理 | **第二批 B**：验证 UV 重采样及额外纹理。PixiJS 官方把 DisplacementFilter 作为波浪水效果例子；ShockwaveFilter 有中心、速度、振幅、波长。[Scene Objects](https://pixijs.com/8.x/guides/components/scene-objects) · [ShockwaveFilter](https://pixijs.io/filters/docs/ShockwaveFilter.html) |
| **像素化** | 传送、冻结/失焦、复古过渡 | 像素网格量化、像素尺寸、源纹理重采样、缩放/分辨率适配 | **第二批 B**：节点结构短，但能验证像素单位与缩放。官方 PixelateFilter 控制 X/Y 块尺寸；Phaser 也提供 Pixelate。[PixelateFilter](https://pixijs.io/filters/docs/PixelateFilter.html) · [Phaser FX](https://docs.phaser.io/phaser/concepts/fx) |
| **外发光 / Bloom** | 魔法道具、能量物、技能预警 | 邻域采样或多 Pass 模糊、阈值、颜色、强度、外扩边距 | **后置 C**：视觉吸引力强，但会把 V0 首批拖入大采样或多 Pass。官方 GlowFilter 有距离/内外强度/质量；AdvancedBloomFilter 明示比普通 Bloom 更慢。[GlowFilter](https://pixijs.io/filters/docs/GlowFilter.html) · [AdvancedBloomFilter](https://pixijs.io/filters/docs/AdvancedBloomFilter.html) |
| **故障/RGB 分离** | 电子敌人、受干扰 UI、科幻过场 | 通道偏移、多次采样、带状位移、随机种子/时间 | **后置 C**：较强风格依赖，随机性与多采样增加验收复杂度。官方 GlitchFilter 有带数、偏移、种子和通道偏移。[GlitchFilter](https://pixijs.io/filters/docs/GlitchFilter.html) · [RGBSplitFilter](https://pixijs.io/filters/docs/RGBSplitFilter.html) |

## 推荐让团队拍板的首批 3 件

1. **受击闪白**：确认颜色输出与运行时参数最短闭环。验收时在透明 PNG 和图集帧上检查轮廓不变，强度归零与原图相同。
2. **噪声溶解**：确认“图内进度 + 噪声 + Alpha + 边缘色”。验收 `0`、`0.5`、`1` 三个固定时间/进度点，保存重开后画面相同。
3. **交互描边**：确认邻域采样、像素尺寸和宿主边距。验收不同 Sprite 尺寸、容器组合、1×/2× 分辨率和画布边缘，不能裁掉外描边。

三件分别覆盖逐像素颜色、程序/纹理遮罩、邻域采样。选择是**架构试验组合**，不是宣称这三件商业价值最高。若团队当前没有描边任务，可把第三件替换为“热浪/水波扭曲”，仍能验证不同结构，但会少测外扩边距。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [OutlineFilter](https://pixijs.io/filters/docs/OutlineFilter.html) · [ShockwaveFilter](https://pixijs.io/filters/docs/ShockwaveFilter.html)

## 需要在开发前固定的语义

1. **源输入**是 Filter 已渲染的 RGBA/区域坐标；“原始 Sprite 纹理 UV”和“图集帧 UV”不自动等同于 Filter 输入。预览要明确纹理、滤镜区域、坐标/像素尺寸和缩放测试。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters) · [Textures](https://pixijs.com/8.x/guides/components/textures)
2. **时间、进度、随机种子**应由预览场景/运行时参数显式提供，固定输入能重现固定画面。此为 FXWeaver 产品约束；PixiJS 自定义 Filter 文档仅示范通过 ticker 更新 uniform。[PixiJS Filters](https://pixijs.com/8.x/guides/components/filters)
3. **透明表示与邻域越界**须有统一规则；描边的 padding、溶解边缘和缩放均会暴露差异。PixiJS Application 默认假定颜色缓冲为预乘 Alpha，纹理源另有 `alphaMode`。[Application](https://pixijs.com/8.x/guides/components/application) · [Textures](https://pixijs.com/8.x/guides/components/textures) · [FilterOptions](https://pixijs.download/v8.14.0/docs/filters.FilterOptions.html)
4. **锁定具体 PixiJS v8 小版本并用真实编译验收**。官方 8.x 指南中的 GLSL 片段写法与 API 站的当前示例并非逐字一致；生成器应以所锁版本的 API 和运行结果为准。[8.x Filters guide](https://pixijs.com/8.x/guides/components/filters) · [Filter API overview](https://pixijs.download/dev/docs/filters.html)
