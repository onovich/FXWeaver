# Phase 1 生成 Filter 的 WebGL2 运行契约（第 9 轮）

`src/runtime/filterRuntime.ts` 在真实 `WebGL2RenderingContext` 上编译、链接 **PixiJS `GlProgram` 预处理后的**顶点与片段源码；成功后才创建 `Filter`。失败返回阶段、WebGL 原始日志、生成片段行号和可定位的节点 ID。预检对象随即释放；不能依赖 Pixi `renderer.render()` 抛错判断 Shader 是否有效。

运行资源按第 8 轮清单绑定。暴露参数和时间写入 Pixi uniform group；非法参数值在修改任何 uniform 前被拒绝。依赖纹理通过独立 TextureSource 绑定，保留上传格式和 Alpha 模式，sampler 固定 clamp-to-edge，并由预览设置控制 nearest/linear。替换素材无需生成新 Shader。`destroy()` 释放 Filter 和适配器自己的 TextureSource，不销毁调用方传入的原始图片纹理。

运行 `npm run smoke:webgl`、`npm run runtime:capture` 可重现[三路生成 Filter 画面](./visuals/phase1-generated-filter.png)和[像素/诊断记录](./visuals/phase1-generated-filter.json)。Chrome 154 / PixiJS 8.21.0 / WebGL2 中：源图红色半透明 `[255,0,0,128]`；uniform 更新使半透明红 `[255,0,0,127]` 变绿 `[0,255,0,127]`；2×1 红蓝依赖纹理在 linear/nearest 下分别约 `[124,0,131,255]` / `[0,0,255,255]`；替换为绿色图片后为 `[0,255,0,255]`。缺纹理返回 `MISSING_TEXTURE`；故意损坏生成片段返回 `FRAGMENT_COMPILE` 并关联源节点；销毁后更新被拒绝。测试用 Shader 破坏仅用于诊断验证，不在作品运行路径。

本轮验证的是生成链到单个 Sprite Filter 的实际编译和绘制。工作台的异步预览替换、Container 宿主和旧预览状态在第 10 轮处理。
