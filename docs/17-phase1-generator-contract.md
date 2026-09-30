# Phase 1 生成器契约（第 8 轮）

`src/compiler/ir.ts` 只接受已通过正式图校验的 `pixi.filter2d`；所有节点按拓扑顺序输出类型化 IR。相同的节点、边、参数和属性，即使源数组顺序不同，也得到相同的规范化 IR。画布布局不进入 IR。

`src/compiler/generate.ts` 根据 IR 生成 PixiJS 8.21.0 WebGL2 Filter 的 GLSL 片段、参数及依赖纹理绑定表、节点代码行映射和构建 ID。Shader 变量与 uniform 名称按稳定顺序分配，不拼入用户输入的节点名、参数名或素材 ID。代码区和预览应消费同一个 `GeneratedFilter` 对象，不各自重新生成。

构建 ID 包含图 IR、生成器版本、目标后端与 Pixi 小版本，以及 `highp`、预乘 Alpha、越界透明的编译契约。暴露参数的默认值从构建身份中剔除：它变动时，GLSL 与构建 ID 不变，预览只更新 uniform；未暴露常量或拓扑变化则形成新构建。依赖素材 **ID** 参与构建，图片字节和预览测试素材、时间、宿主、画布布局属于运行/预览状态，不进入代码构建 ID。

内部 RGBA 约定为**预乘 Alpha**。源采样保留 Pixi 输入语义；十六进制颜色转 RGBA 时预乘 RGB；`Compose RGBA` 接收已预乘的 RGB。采样 UV 超过 0–1 直接返回透明黑；宿主源在有效 UV 内再受 `uInputClamp` 限制。额外纹理的过滤方式由运行适配器绑定的 TextureSource sampler 决定。WebGL2 的真实编译、绑定与像素验证属于第 9 轮门槛，当前生成器单元测试不代替它。
