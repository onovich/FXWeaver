# Work 05 · local melt / wave distortion

Use: a local first-chapter UI transition on a PixiJS Container. The host contains two overlapping copies of a synthetic transparent transition card; its background is outside the Filter and cannot be sampled. This work makes no URP RenderGraph claim.

- Editable source: [`examples/05-local-melt.fxweave.json`](../examples/05-local-melt.fxweave.json)
- Generated evidence: [`fragment GLSL`](../examples/generated/05-local-melt.frag.glsl), [`binding manifest`](../examples/generated/05-local-melt.manifest.json)
- Build ID: `f1-f8adda044117f170` on PixiJS 8.21.0 WebGL2.
- [Fixed 0.75 s preview](./visuals/work05-local-melt.png), [1.2 s comparison](./visuals/work05-time-change.png), [editor view](./visuals/work05-workbench.png).
- [Editor operation log](../examples/05-local-melt.creation-log.json): from **Create Filter graph**, the UI added 17 common nodes, connected 18 edges, exposed four parameters, imported a preview-only card, changed the fixed time, exported the generated artifact and project, and reopened it. The automated editor actions took 3.352 seconds; design and review time was not measured.

The generic graph splits Filter UV, computes `sin(UV.y × Frequency + Time × Speed) × Amplitude × Strength`, composes the result as a horizontal vec2 offset, adds it to UV, then resamples the host through `Sample Source`. The sampler returns transparent outside 0–1 and clamps only interior sample coordinates, as verified by the earlier WebGL2 sampler tests. No work-specific generator branch or hand-written melt Shader exists.

At the fixed scene time 0.75 s, the canvas SHA-256 is `c355d85419407897a1d045f36579fbcae8871d496673ee655d859b7c4c55a469`. At 1.2 s it becomes `42cdffc0d69c95e883f4660365bc443c676f378bf6b42a60fd016622b7d8eccd`; restoring 0.75 s restores the first hash. Browser smoke confirms fixed-time equality, pause stability, amplitude zero freezing the image across time, frequency changes, transparent outside pixels, and one unchanged build ID across runtime controls.

The main editing friction was assembling a long scalar chain for a simple UV wave; the existing generic nodes covered it without new runtime semantics. The preview source is synthetic and embedded, so the project is portable. Recreate the editor trace with `npm run work05:capture`; verify the committed project with `npx playwright test tests/work05.smoke.spec.ts`. A recapture creates new node IDs and build ID while preserving the same fixed pixels.
