# 面向游戏的 Shader／特效平台：现有供给与边界

核查日期：2026-09-30。本文仅把官方站点、官方文档、项目自有仓库与 MCP 规范作为事实来源。「推论」表示尚待用户访谈或原型验证的产品判断。目录数字为核查时页面快照，不代表稳定市场规模。

## 平台供给已经存在

| 产品 | 已核实的能力 | 对新产品的含义（推论） |
| --- | --- | --- |
| Shadertoy | 官方作品页提供直接链接和 iframe 嵌入，编辑器使用 WebGL/GLSL、固定输入如 `iTime`、`iResolution`、`iChannel0..3`，可做 image/buffer/sound 内容。[作品页及分享入口](https://www.shadertoy.com/view/ttVXDy) | 在线编写、展示、嵌入、分享代码已经是基线。把它转为游戏里的 Sprite 材质、粒子、后效，还需要宿主输入、作用范围、渲染 Pass、资源及生命周期定义。不能把普通可展示的 shader 自动视为可交付游戏资产。 |
| Godot Shaders | 自称社区驱动的 Godot shader 库，允许投稿、搜索、点赞。当前目录按 Canvas item、Spatial、Sky、Particles、Fog 类型及许可筛选，并有标签页；核查时目录显示约 2290 件。[首页](https://godotshaders.com/) · [目录](https://godotshaders.com/shader/) · [2D 标签例](https://godotshaders.com/shader-tag/2d/) | 「面向游戏」「分类／标签」「社区分享」已经有实例。机会更可能是作品可编辑、可测试、可安装的完整程度，而非补一套分类名称。 |
| Material Maker | 官方网站可从编辑器浏览、导入社区材料、节点、环境和笔刷；作者可在编辑器上传材料／自定义节点并填写关键词、许可、说明，导入者无需账号。产品提供节点建材和面向游戏引擎的导出。[社区站说明](https://www.materialmaker.org/doc) · [产品页](https://www.materialmaker.org/) | 编辑器、社区库、节点复用、授权字段的闭环也不是空白。值得研究其面向「效果」而非纹理材料的工作流差别。 |
| Unity Asset Store | 有 VFX/Shaders 与 Fullscreen & Camera Effects 等分类、价格及 Unity 版本筛选；发布者可售卖包，发布须经历验证、上传、审核。商品页能标注渲染管线与 Unity 版本兼容性。[Shaders 分类](https://assetstore.unity.com/vfx/shaders) · [发布流程](https://docs.unity3d.com/ja/current/Manual/asset-store-workflow.html) · [商品兼容性示例](https://assetstore.unity.com/packages/vfx/quibli-anime-shaders-and-tools-203178) | Unity 内效果资产已有成熟交易和分发渠道。新平台若进入交易，应该证明跨宿主或更短的「找到→调参→导入」流程，而不能以有商城本身作为优势。 |
| NixieFX | 浏览器粒子编辑器保存本地 JSON；PixiJS、Three.js 预览有逐后端支持状态；导出含 `manifest`、资源与支持报告，受阻时给诊断。官方还提供 CLI 的创建／验证／导出及 AI agent skills。[编辑器手册](https://nixiefx.com/editor-manual/) · [CLI](https://nixiefx.com/cli-reference/) · [Skills](https://nixiefx.com/skills/) | 「游戏可运行导出」「后端兼容诊断」「AI 可操作」均已有强先例。若定位覆盖粒子特效，必须找到更窄的差异，或扩展到它未证明覆盖的使用情境。 |
| PlayCanvas Shader Editor | 浏览器节点编辑；工程图、材料和纹理在浏览器 IndexedDB，可存取本地；运行用 Shader Pack 不含源图和节点。官方称目前工作流仍较初级，计划加强与 PlayCanvas Editor 集成。[简介](https://developer.playcanvas.com/shader-editor/introduction/) · [文件](https://developer.playcanvas.com/shader-editor/overview/file-handling/) · [工作流](https://developer.playcanvas.com/shader-editor/overview/workflow/) | 可编辑作品和可运行包作为同一件可分享资产，是可研究的方向；不能据此断言所有 PlayCanvas 内容都无法在线分享，因为其主编辑器能发布完整应用。[发布说明](https://developer.playcanvas.com/user-manual/editor/publishing/web/playcanvas-hosting/) |
| Babylon.js Node Material Editor | Babylon 自有社区论坛中的编辑器链接使用 `nme.babylonjs.com/#...` 唯一 URL 共享；官方仓库的 NodeMaterial 类型与编辑器支持加载 snippet；NodeMaterial 有 Material、PostProcess、Particle、ProceduralTexture 模式。[Babylon 社区示例](https://forum.babylonjs.com/t/nodematerial-texture-uv-not-fit-on-mesh/25006) · [官方论坛中的 NME 接入示例](https://forum.babylonjs.com/t/how-to-properly-implement-babylon-nme-in-react/23581) | 可分享节点图和多作用模式也不是独占特性。需检验把这些模式组合为可发现、可复用游戏资产的流程是否更好。 |
| ShaderFrog | 官方开源仓库称线上编辑器从数据库读取、创建并保存 shader；其独立仓库只提供不持久化的编辑器。核心库把输出定义为 GLSL 与元数据，宿主引擎需实现插件。[编辑器仓库](https://github.com/ShaderFrog/editor) · [核心仓库](https://github.com/ShaderFrog/core) | 此例说明跨引擎要处理宿主专用变量与插件；不宜把原始 GLSL 输出等同于「可直接用于任何引擎」。其线上社区功能和当前导出能力需另行实测，不能由仓库推断有或没有。 |

## 许可与作品来源边界

- Godot Shaders 投稿时要求作者选择 CC0、MIT 或 GPLv3；其页面明确代码许可不覆盖封面图、截图、视频及其中资产。[许可说明](https://godotshaders.com/license/) 因此一个「下载可用特效」的包必须逐项标记代码、贴图、音效、演示资产的权利范围。Godot Shaders 官网虽写可用于个人与商业作品，但具体仍受所选许可条款约束。
- Shadertoy 官方作品页可确认分享与嵌入；本次未能从可访问的 Shadertoy 官方条款／API 文档核实统一许可、公共 API 覆盖率或可再分发规则。**不可**据此批量搬运、改编其作品并作为平台种子内容。应先取得单个作者明确授权，或由原作者自主投稿。
- Unity 的平台分发需要资产包验证及审核；作者和产品是否可以将同一资产多处售卖应依据具体协议核查，本文未做法律结论。[上传验证](https://docs.unity3d.com/Manual/AssetStoreUpload.html)

## MCP 的真实作用

MCP 规范允许服务端提供可发现、带输入 JSON Schema 的工具，通过 `tools/list` 和 `tools/call` 让模型调用；工具也可返回带输出 Schema 的结构化结果。资源可通过 URI 供客户端读取。[MCP 工具规范](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) · [MCP 资源规范](https://modelcontextprotocol.io/specification/2025-06-18/server/resources/)

**推论：** MCP 是操作接口，不是 shader 语义、生成质量或游戏兼容性的保证。适合先开放 `search_effects`、`get_effect`、`fork_effect`、`set_parameters`、`validate_target`、`render_preview`、`export_bundle` 这类可验证动作；每次调用返回作品版本、目标运行时、诊断、资源依赖和许可证。修改／发布类动作需要身份、权限与审计。MCP 规范也要求服务端验证输入、访问控制、限流及清理输出。[MCP 工具规范安全章节](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

**竞争提醒：** NixieFX 已提供机器可读 JSON、CLI 验证／导出和 AI agent skills；「AI 易用」本身不能作为独特定位。若 MCP 能让 agent 从平台检索合适作品、在用户项目中修改并在目标运行时自动验收，才可能形成可观察的优势。[NixieFX CLI](https://nixiefx.com/cli-reference/) · [NixieFX Skills](https://nixiefx.com/skills/)

## 待验证机会（推论，不是已证实的竞品缺口）

1. **可运行作品单元：** 一件作品同时有源节点图、参数与动画、作用范围、依赖资源、许可、目标适配器、测试场景和预览／导出结果。现有产品分别覆盖多项，要验证组合是否让实际集成更省时间。
2. **游戏任务搜索：** 除视觉标签外，记录「受击」「冲刺」「切场」「水面」「UI 强调」等用途，并以 Sprite／粒子／全屏、透明度、2D 灯光、目标版本、性能预算筛选。Godot Shaders 与 Unity Asset Store 已有分类和版本筛选，新增字段需要以搜索成功率证明价值。
3. **agent 可闭环调用：** agent 不只生成 GLSL，还能检索、分叉、调参、预览、验证并导出；所有步骤用稳定资产 ID 和版本回溯。它应作为底层 API 能力逐步建立，不应先投入完整 MCP 产品和大规模社区运营。
4. **先单目标再扩展：** 先用一个运行时验收作品和导出，随后用第二目标验证资产模型；跨引擎时显示支持、部分支持、阻断。NixieFX 已实现逐后端报告，机会在其他效果类型、目标和作品工作流。

## 尚未证实

- 未有证据证明游戏开发者对新社区平台有足够迁移意愿、创作者供给或交易需求。
- 未有证据证明原有平台「没有」上述功能；本文件只陈述可核实的官方能力和技术边界。
- 未核实 Shadertoy 官方 API 使用条款及作品默认授权，不应把任何第三方 shader 当成可自动转售的内容。
