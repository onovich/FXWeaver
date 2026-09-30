# 正常游戏素材生图记录

2026-10-01，使用内置 imagegen 技能。公开合成素材，不使用 Unity 私有素材。

资产：`public/art/game/crystal-ward-base.png`，1024×1536 RGBA，2,066,054 bytes。保留原始生成 alpha；没有裁切、预烘焙效果或颜色后处理。三种效果均使用同一正常素材，便于比较。官网 Hero 仍明确为 Concept artwork。

提示：

> Create one polished professional 2D game inventory sprite, square canvas, real transparent alpha background. Subject: a premium enchanted crystal ward / pendant, tall faceted icy blue quartz crystal mounted in a sculptural dark silver and antique brass protective frame, subtle engraved angular runes, small mechanical hinges, beveled edges, convincing painted metal material and polished crystal with internal facets. Front three-quarter view, crisp illustrated game art, fine surface detail, clean readable silhouette, a studio-quality hand-painted fantasy/sci-fi game item matching a dark graphite and icy cyan shader creation studio. Object occupies 90 percent of height and 70 percent of width with tight transparent margins, centered, fully visible. No environment, no floor, no text, no UI. This is the NORMAL undamaged base sprite for later real shader effects: absolutely no burning, particles, disintegration, scanlines, hologram lines, RGB offsets, warping, melting, or baked effect glow. Gentle material lighting only. Save a transparent PNG.

实际返回竖向素材而非提示中的方形；保留完整对象，使用它的真实尺寸。官网卡片及工程以实际节点图 Pixi WebGL2 输出展示，不把原图当作效果成果。默认预览150%是可切换的显示缩放，Original 与 Effect 共用，截图输出仍是原始画布。

`scripts/capture-showcase.mjs` 从每个示例入口实际打开工程，记录构建身份，提取真实canvas PNG及移除Filter的Original快照。对应 `docs/visuals/showcase-*-evidence.json`、`showcase-*-effect.png`、`showcase-*-original.png`。
