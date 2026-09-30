# ADR: V0 Filter 后端与 WebGL2 实测契约

日期：2026-09-30。状态：Phase 1 第 1 轮决定；后续图语义和生成器必须遵守本页实测边界。

## 决定

- 锁定 `pixi.js` **8.21.0**，并在锁文件中固定。V0 只运行 PixiJS Sprite/Container 的 **WebGL2 Filter**；启动先探测 WebGL2，初始化后再次核对真实上下文类型，不能把 `preferWebGLVersion: 2` 当作绝对保证。[PixiJS 8.21.0 发布](https://github.com/pixijs/pixijs/releases/tag/v8.21.0) · [Application 选项](https://pixijs.com/8.x/guides/components/application)
- 通用包装使用 PixiJS `Filter`、`GlProgram` 和默认 Filter 顶点模板；片段代码由后续节点图生成。额外纹理以 `Texture.source` 和对应 sampler 绑定，数值参数由资源 uniform 组绑定。[官方 Filter 指南](https://pixijs.com/8.x/guides/components/filters)
- Filter 输入是宿主已绘制内容的离屏纹理。`vTextureCoord` 用于这张输入纹理的采样；要得到滤镜区域归一化 UV，须按 `uOutputFrame.zw * uInputSize.zw` 换算。它不是 Sprite 图集原始 UV，也不能读取滤镜外的背景。[官方 Filter 指南](https://pixijs.com/8.x/guides/components/filters) · [Texture 与 TextureSource](https://pixijs.com/8.x/guides/components/textures)
- 生成器将输出 GLSL ES 3.0 风格代码；与默认顶点模板共享的浮点 uniform 在片段中显式声明 `highp`。实测未声明时，`uInputSize` 在顶点和片段阶段精度不一致，链接失败。
- 后续运行适配器必须自行确认编译和链接结果并保留诊断。PixiJS 对故意损坏的片段代码记录了错误，但本次 `renderer.render()` **没有抛异常**；仅靠 `try/catch` 会把失败误认成成功。

## 可复现实测

运行 `npm ci`、`npm run smoke:webgl` 和 `npm run spike:capture`。后者生成[实机画面](./visuals/phase1-webgl-spike.png)、[WebGL2 不可用画面](./visuals/phase1-webgl-unavailable.png)及[像素与诊断记录](./visuals/phase1-webgl-spike.json)。测试页为 `tests/fixtures/filter-spike.html`；它是后端契约探针，不是编辑器预览或作品实现。

环境：桌面 Chrome 154.0.8037.57，`gl.VERSION` 为 `WebGL 2.0 (OpenGL ES 3.0 Chromium)`，画布 320×180、分辨率 1、透明背景。宿主是带 50% Alpha 红色矩形的合成 Canvas Sprite。以下像素均由实际 PixiJS WebGL2 画布读回：

| 探针 | 结果 RGBA | 解释 |
| --- | --- | --- |
| 未施加 Filter 的中心 | `[255, 0, 0, 128]` | 合成宿主透明度约 0.5 |
| 输入采样乘 `uGain = 0.5` | `[128, 0, 0, 128]` | 生成的 Filter 片段确实改变颜色，Alpha 保留 |
| 额外纹理由白换黑 | `[0, 0, 0, 128]` | 第二纹理绑定实际参与采样，Alpha 未被误改 |
| Sprite 左侧 6 像素，padding 0 / 12 | `[0, 0, 0, 0]` / `[0, 255, 0, 127]` | padding 扩大输出区域；边缘效果必须申报所需边距 |
| 区域 UV 探针左 / 右 | `[34, 129, 64, 255]` / `[193, 129, 64, 255]` | 横向 UV 随屏幕采样位置变化；蓝通道编码 `uInputPixel.z * 16`，与本次 64 像素输入相符 |
| 故意无效 GLSL | 包含 `Could not initialize shader` 及片段编译错误 | Pixi 记录错误；绘制调用未抛异常 |

Alpha 观察：在相同 Alpha 128 下，颜色乘 0.5 后浏览器读回红色约 128。这与 PixiJS 默认的预乘 Alpha 色缓冲行为相符，是本探针上的推断；后续正式图须继续用透明 PNG、Container、边缘采样和不同背景验证，生成代码不可随意把 RGB 与 Alpha 当作独立直通值。[Application 的 `premultipliedAlpha` 选项](https://pixijs.com/8.x/guides/components/application)

## 后续实现约束

第 2–8 轮建立正式图、类型化 IR、确定性生成器；第 9–11 轮以本探针确认的 Filter 包装实现编译、资源绑定和同源预览。越界采样应明确使用 `uInputClamp` 或声明其他规则；图和预览设置须明确 padding、分辨率及纹理过滤方式。当前探针尚未覆盖 Container、图集 frame/trim、真实素材、时间更新或由节点图生成代码，不能据此宣称三件作品已完成。
