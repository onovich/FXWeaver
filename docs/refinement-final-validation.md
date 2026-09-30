# 持续视觉优化最终实现验证

2026-10-01。实现者 subagent `visual_refinement`。等待规划者最终独立验收，未提交、未推送、未部署。`docs/38`、`docs/39`按规划者指示不再修改，本记录补充最终差异与结果。

## 四次视觉反馈的实际修正

1. 首轮几何素材仍有占位感：应用 imagegen 生成高质正常晶体护符，真实RGBA 1024×1536，三种效果共享正常素材，金属/晶体材质与Hero一致。提示见`refinement-imagegen-prompts.md`。
2. 默认调参与全图截图混淆：明确Tune和100%编辑两种实际状态；场景设置折叠、图属性抽屉隔离，Back to live tuning明确返回，主要运行覆盖参数优先显示。150%显示缩放可切换100%完整区域，原图对照共用缩放，真实输出不变。
3. 暴露节点只能看到Linked说明：当前节点直接出现关联参数default控件，使用已有set-property命令；全量参数定义折叠到Manage parameter definitions，不重复铺满运行参数。
4. 当前default值被解释挤出首屏：字段紧跟节点名称、解释移到字段后、长description折叠About this node。1440×900和1024×900均无需滚动即可看到完整输入框。主操作13px、100%节点标题14px/端口12px；类型颜色及端口形状一致，端口几何保持。

同一FilterPreview和canvas始终挂载；抽屉/全图/100%局部编辑/大预览不销毁成功构建，暂停时间与比较状态保持。新增回归验证画布身份、关联默认值编辑/撤销、保存后的graph.defaultValue及Scene覆盖值分离。导出后通知保留可关闭按钮，通知正文不拦截下面控件的点击。

## 最终验证矩阵

| 项目 | 结果 |
| --- | --- |
| npm run typecheck | PASS |
| npm test | 72项PASS |
| npm run build | PASS，main约583.78kB，既有500kB提示仍在 |
| npm run smoke | 44项Chrome/WebGL2 PASS，17.5秒 |
| npm run smoke:preview | 14项PASS，独立4174生产preview，10.8秒 |
| refinement.capture.spec.ts | 5项PASS，首页1440/390，工作台1440×900/1920×1080/1024×900 |
| git diff --check | PASS |

此前失败包括Scene披露后的可达路径、Summary选择、Inspector恢复展开及旧文案断言。全部修正后最终完整公共/生产通过。测试按新可发现路径打开Graph properties、Scene & image settings、Manage parameter definitions；没有降低原功能检查。

## 最终实际截图与真实效果

- `docs/visuals/refinement-home-1440.png`、`refinement-home-390.png`
- `refinement-tune-{1440,1920,1024}.png`、`refinement-edit-{1440,1920,1024}.png`
- `refinement-enlarged-preview.png`：1440×900真实同画布Split对照
- `showcase-{03,05,09}-original.png`、`showcase-{03,05,09}-effect.png`
- `showcase-*-evidence.json`：实际buildId、正确source及project/source/effect/original SHA256

正常原图在`public/art/game/crystal-ward-base.png`。派生工程`examples/showcase/*`使用原有同一graph，变化为公开素材、800×640场景、合法运行覆盖值（03 Radius=0.2，05 Amplitude=0.055，09 Scan intensity=0.55）。09临时0.65越界已修复，三入口均通过页面实际解析/渲染、保存重开与生产测试。

03裁切主体形成半消散、05UV形变、09扫描和红色通道偏移均来自节点生成Filter，原图无这些效果。捕获脚本提取真实canvas PNG，以及移除Filter后的Original host快照。原图SHA256为`d1275cb41ecbd8f48aba79928b9d152c3d09e2f4ccda4d992d2bc56aa7daaa90`，不是旧矢量稿。

## 清理与边界

同CSS作用域相同selector已合并，保留不同断点。output-port的小类型标签使用更明确的组合selector以维持连线端口排布。删除未使用的第一轮矢量素材、脚本与过时UI截图；旧Phase3截图保持原件。

图模型、compiler、runtime、storage及旧3个示例原件无差异；未操作Unity项目或`.fxweave-local`，无私有资产公开。Role/规划指南不修改，没有联系原开发会话。

## 尚存限制

长图概览无法同时保证文字可读，用户通过Select node → Edit selected · 100%进入局部编辑。五个以上参数仍可能滚动；当前Scene覆盖的主要参数固定优先，当前节点字段首屏可见。基础图约2MB，派生JSON内嵌使各懒加载示例块约2.77MB，主块未引入全部图像；公网性能优化不在本次自用验收范围。人工跨日验证仍未宣称完成。
