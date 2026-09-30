# 竞品之间可争取的产品机会

更新：2026-09-29。以下是依据竞品官方文档提出的产品假设，不是已验证的市场空白或付费意愿。竞品的原生集成往往很强；我们应针对“跨创作、预览、交付的完整任务”建立优势。

后续更细的[七方向竞品核查](./seven-direction-gap-audit.md)已证实：Construct 时间线能动画化效果参数、Unity Shader Graph 有节点估计性能热图、NixieFX 有同运行时预览和后端支持报告。因此下表这些单项能力不能被当作竞品缺失；优先级以[可行性与路线](./seven-direction-feasibility-roadmap.md)中的修正为准。

## 方向清单

| 方向 | 用户得到的结果 | 相对机会 | 建议阶段 |
| --- | --- | --- | --- |
| **1. 从效果目标开始** | 选“受击闪白 / 溶解 / 水波 / CRT”等，上传素材、调语义参数，必要时再打开节点 | 节点编辑能力已很普遍；缩短做出项目可用效果的总时间更有意义 | 首版 |
| **2. 2D 专项预览与诊断** | 检查透明边缘、纹理图集边距、像素画采样、滤镜裁剪、多实例叠加、不同分辨率 | 2D 的实际故障经常只在真实素材和场景里出现；这是需用户实测的假设 | 首版 |
| **3. 效果作用范围向导** | 明确 Sprite 绘制、对象/图层滤镜、全屏后效；自动说明可用输入和导出步骤 | Unity 将 Sprite Graph 与 Fullscreen Graph 分开；PixiJS Filter 作用于绘制后的对象内容；不能用同一输出名义掩盖渲染语义差异。[Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/prebuilt-shader-graphs-urp.html) · [PixiJS](https://pixijs.com/8.x/guides/components/filters) | 首版 |
| **4. 可验证的工程导出** | 一包得到源图、Shader、参数接口、贴图、运行时代码、最小示例和支持报告 | PixiJS 自定义 Filter 需要 GPU 程序及资源；Unity 全屏后效还需 Renderer Feature、材质和注入设置。只导出 GLSL 不足以完成任务。[PixiJS](https://pixijs.com/8.x/guides/components/filters) · [Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) | 首版限一个目标 |
| **5. 时间线与游戏事件参数** | 做受击、拾取、传送、场景切换等短效果；导出可由代码触发、取消和重复播放的接口 | 静态效果与游戏内短时序列之间有交接摩擦；是否构成强需求须访谈 | 第二阶段 |
| **6. 性能预算与实时解释** | 提前知道采样次数、额外 Pass、图层分辨率、目标设备预算，定位造成开销的节点 | Unity 额外输入可能产生额外渲染 Pass；PixiJS 文档提示 Filter 有内存和计算成本。[Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) · [PixiJS](https://pixijs.com/8.x/guides/components/filters) | 第二阶段 |
| **7. 设计师与开发者交接** | 共享可复现测试场景、参数预设和版本；开发者可比较变更并稳定更新 | PlayCanvas Shader Pack 不含源节点图；说明作者文件与运行时包需一起管理。[PlayCanvas](https://developer.playcanvas.com/shader-editor/overview/file-handling/) | 第二阶段 |
| **8. 有边界的多目标适配** | 每个效果明确“支持、降级、不支持”；分别在 PixiJS、Phaser、Unity URP 等目标编译和截图验收 | 这些引擎有不同的对象与全屏效果接口；跨目标视觉一致需要逐个验证。[Phaser](https://docs.phaser.io/phaser/concepts/fx) · [Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html) | 后续逐个加 |
| **9. 垂直效果库与创作者生态** | 面向像素游戏、卡牌 UI、互动网页等特定用例提供可改的高质量效果包 | 内置效果已经很多；优势必须是贴近项目类型、可交付、质量一致。商业价值待验证 | 后续 |
| **10. 高级用户的图与代码双向检视** | 查看生成代码、节点对应代码、错误位置，并允许受控的自定义函数 | 原生节点工具已有高级能力；这更像留住技术美术的必要出口，难单独构成护城河 | 后续 |

## 推荐切口

以 **2D Sprite / Container 效果** 作为第一个完整任务，先面向 **PixiJS WebGL** 做“上传自己的 Sprite → 套用并改造效果 → 在真实场景预览 → 导出可运行的 Filter 与参数接口”。随后再扩展单 Pass 全屏效果。这里说的是 PixiJS Filter；它不等同于直接替换 Sprite 的原生绘制材质。[PixiJS 文档](https://pixijs.com/8.x/guides/components/filters)

首版差异化组合建议：**2D 专项预览 + 从效果目标开始 + 可信导出**。单独的漂亮节点 UI、更多模板、分享链接都容易被复制或已有竞品覆盖。工程适配、测试素材和已验证效果库更有可能累积优势。

## 如何验证机会

拿相同素材在竞品和原型完成“Sprite 溶解”“图层模糊”“全屏 CRT”：记录从开始到真实项目运行的时间、查文档次数、首次导出成功率、预览与工程结果差异、重编辑成功率。观察设计师和开发者各一组。付费研究要围绕节省的集成与返工时间，而不是仅问用户是否喜欢节点 UI。
