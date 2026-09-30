# 本地实际素材：打开与继续创作

## 直接开始

1. 在 `D:\WebProjects\FXWeaver` 运行 `npm run dev`，打开终端显示的地址。
2. 点击 **Open project file**，打开 `.fxweave-local/work03.fxweave.json`、`work05.fxweave.json` 或 `work09.fxweave.json`。它们包含本地图片和已修改的图、时间、运行参数以及适配视口。
3. 用 **Fit all nodes** 或 `F` 查看全图；文本输入中的 F 正常输入。用 **Enlarge preview** 检查细节和 Original / Split 对照，Esc 返回。
4. 03 从 Radius 默认 0.4 / 运行 0.3、Sprite、0 秒继续；05 从 Amplitude 0.06 / 0.1、Container、0.75 秒继续；09 从 Scan intensity 0.25 / 0.4、Sprite、0.5 秒继续。
5. 改节点、连接或参数，观察生成代码/预览构建 ID。用 **Save As** 保存到 `.fxweave-local/` 中的新文件名，再从入口重开。没有文件选择器时用 Export JSON 保存文件，再 Open project file。
6. 打开 `.fxweave-local/human-selfuse-record.md` 填写实际操作者、日期、耗时、卡点、保存文件及下次继续位置。后一天用自己的新工程继续修改并记录。

`.fxweave-local/CONTINUE.md` 给出每件工程的绝对路径、哈希、构建及恢复位置。打开带素材的工程不需要 Unity；原 Unity 项目保持只读。私有工程和截图留在本机忽略目录。

## 重现自动技术试用

```powershell
npm run trial:local
npm run trial:prepare
```

默认读取 `D:/UnityProjects/UnregisteredScene`，可通过 `UNITY_PROJECT_ROOT` 改根目录。缺素材明确失败。`trial:local` 会重新生成三个 `workXX` 工程和自动截图，因此人工版本必须另取文件名；`trial:prepare` 校验自动工程哈希，再刷新恢复索引，已有人工记录不会被覆盖。如果自动工程已被手工修改，prepare 明确失败并保留文件。

普通 `npm run smoke` 不依赖 Unity。来源、观察及私有证据关联见 [本地试用记录](./30-phase2-local-trial.md)，交互行为见 [可用性改进](./31-phase2-usability.md)。自动结果中的耗时只算代理操作，不算人工设计时间。当前技术试用及同日保存重开已验证；人工使用、跨日继续编辑与最终 V0 持续自用门槛仍待真实发生。

第 6 轮 Debug 自检：prepare 对缺工程、哈希不符明确失败；恢复入口读已有自动结果，人工记录以排他新建保存。架构自检：此脚本只管理本地证据，不读取 Unity、不改变图或生成器。验证：prepare 重跑保留人工记录字节；普通 smoke 与 typecheck 通过。缓冲未使用。
