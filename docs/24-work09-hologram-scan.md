# Work 09 · local hologram scan

Use: a local investigation-terminal Sprite. One scan treatment combines moving horizontal lines and a small red-channel offset. It does not use a full-screen CRT, history frame, portrait variant, or atlas projection.

- Editable source: [`examples/09-hologram-scan.fxweave.json`](../examples/09-hologram-scan.fxweave.json)
- Generated evidence: [`fragment GLSL`](../examples/generated/09-hologram-scan.frag.glsl), [`binding manifest`](../examples/generated/09-hologram-scan.manifest.json)
- Build ID: `f1-eaace75cae26d3d5` on PixiJS 8.21.0 WebGL2.
- [Fixed 0.5 s preview](./visuals/work09-hologram-scan.png), [1.4 s comparison](./visuals/work09-time-change.png), [editor view](./visuals/work09-workbench.png).
- [Editor operation log](../examples/09-hologram-scan.creation-log.json): starting at **Create Filter graph**, UI actions added 28 common nodes, connected 33 edges, exposed four parameters, imported a synthetic transparent terminal panel, changed fixed time, exported the generated artifact and project, and reopened it. Automated editor actions took 4.595 seconds; design and review time was not measured.

The graph uses `sin(UV.y × Line frequency + Time × Scan speed)`, remaps it into 0–1, applies a `Smoothstep`, then multiplies by Scan intensity to dim narrow lines. Separately, it adds a small vec2 Red channel offset to UV and resamples the same host once. It composes shifted red with base green/blue and base alpha, multiplying the shifted red by base alpha to preserve premultiplied output at transparent boundaries. The line brightness scales the resulting RGBA. The Filter is attached to one Sprite; the preview background is outside its scope.

The 0.5 s canvas SHA-256 is `ec4465cf966d2d71d8ba9e4a14cd8a3fb292aee793902d76d38db86248a5f88a`; at 1.4 s it is `62943b11d278025460b9b559c59f87c97507f11543952352119fd34fa2f6f40d`. Returning to 0.5 s restores the first hash. Chrome smoke confirms line intensity zero removes time dependence, zero red offset changes only red pixels while green/blue remain identical, the corner is transparent, pause freezes the frame, and the code/preview build IDs match.

The effect uses one additional host source sample, one sine, one smoothstep, and ordinary scalar/channel operations on a local host. There is no dependency texture or feedback pass. The main editing friction was the 33 manual connections; the editor command path handled them without new node types. The source image is synthetic and embedded for portability. Recreate the trace with `npm run work09:capture`; verify the committed example with `npx playwright test tests/work09.smoke.spec.ts`. A recapture creates new node IDs and build ID while preserving the fixed visual result.
