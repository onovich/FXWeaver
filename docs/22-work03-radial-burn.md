# Work 03 · radial burn / dissolve

Use: reveal or burn away a local investigation card or puzzle tile. Host: a PixiJS Container containing two overlapping copies of a synthetic transparent evidence tile. This is a self-use preview, not a Unity stencil reproduction.

- Editable source: [`examples/03-radial-burn.fxweave.json`](../examples/03-radial-burn.fxweave.json)
- Generated evidence: [`fragment GLSL`](../examples/generated/03-radial-burn.frag.glsl), [`binding manifest`](../examples/generated/03-radial-burn.manifest.json)
- Build ID: `f1-5f9ea9d2ed4943d9` on PixiJS 8.21.0 WebGL2.
- [Fixed preview](./visuals/work03-radial-burn.png), [radius property change](./visuals/work03-radius-change.png), [editor view](./visuals/work03-workbench.png).
- [Editor operation log](../examples/03-radial-burn.creation-log.json): started with **Create Filter graph**, then used the UI to add 19 common nodes, connect 22 edges, expose five parameters, import one dependency and one preview source, edit a parameter default, export the project and generated artifact, and reopen the project. The automated editor actions took 4.04 seconds; design and review time was not measured.

The graph reads Filter UV and host source RGBA. A deterministic grayscale noise image perturbs the radius. `distance(UV, center)` enters a `Smoothstep` against the perturbed radius and outer edge; a `Subtract` turns it into an interior alpha mask. A generic color conversion and vec4 mix tint the edge before vec4 scaling produces premultiplied RGBA. The edge outside the radius is transparent. No Burn node or hand-written effect Shader participates in the runtime path.

The fixed Chrome capture uses radius 0.34, center `(0.5, 0.5)`, edge width 0.07, noise amount 0.08, and orange edge color. Changing the radius default to 0.18 changed the canvas SHA-256 from `c682c64ac2c3569732c6d6a6c36e8c44aa4fdf8adae106a78cf21a9db360f12b` to `008d9b000fba9c14ade2e08df4fec63ada7d9560174e2faf48b782e39ecb59b8`, then restoring 0.34 restored the original hash. The normal smoke also verifies smaller visible area, center movement, edge-width change, blue edge tint, transparent corner, and matching code/preview build IDs.

Recreate the editor trace and artifacts with `npm run work03:capture`; verify the saved work with `npx playwright test tests/work03.smoke.spec.ts`. Capture generates new node IDs and therefore a new build ID, while the fixed canvas pixels remain equivalent.

The first editing friction was the inherited `-10000..10000` scalar slider range. A generic parameter-range command and inspector control now set practical ranges for Radius, Edge width, and Noise amount; the same control is available to other graphs. The source tile and noise are synthetic and embedded in the project, so the work does not depend on the Unity repository or external asset permissions. The narrow right preview makes the card label small; a larger standalone preview would help later self-use, but is outside this round's graph and rendering contract.
