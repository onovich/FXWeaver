# Phase 1 buffer rounds 17–19

These rounds addressed the example gallery delivered in round 16. They added no Filter node, generator branch, effect Shader, or renderer target.

| Round | Reason and change | Evidence |
| --- | --- | --- |
| 17 | Bundling all three source projects raised the production entry JavaScript from 552.99 KB before the gallery to 641.49 KB in round 16. Each committed project now loads only when its card is selected. A request token prevents an older, slower selection from replacing a newer one. | Main JavaScript became 582.51 KB, with 16.19/19.75/23.73 KB project chunks. Chrome test delays work 03 while work 05 opens and verifies the editor stays on 05. |
| 18 | The first gallery test checked evidence URLs but did not exercise browser downloads or production asset paths. Tests now download and parse each original manifest and creation log. A production-preview Playwright lane checks the same editor round trip against built files; its delayed-load matcher accepts both development and hashed production URLs. | `npm run build` then `npm run smoke:preview`; all gallery tests pass on the built site. |
| 19 | A derived project's Save As path needed an explicit regression that the bundled original remained available and that a second copy had a distinct ID. | The Chrome test saves an edited work 03, opens work 03 from the gallery again, checks the original Radius/default graph and build ID, and checks both derived IDs differ from each other and the source. |

The buffer checks used desktop Chrome 154.0.8037.57 with real WebGL2. The application still targets PixiJS 8.21.0 WebGL2. No non-Chrome browser or WebGPU compatibility claim follows from these tests. The 582.51 KB entry chunk still triggers Vite's 500 KB advisory; the three example projects are already split and further general editor splitting was outside this repair scope.

`git grep` over `src/compiler`, `src/runtime`, and `src/graph` found no work-name or work-number branches. Example names and original evidence paths live in the entry catalog; the editable graph remains the source of generated code and preview.
