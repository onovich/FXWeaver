# Phase 1 workbench preview contract

Round 10 connects the saved `pixi.filter2d` graph to the same generated GLSL and PixiJS WebGL2 Filter path exercised by the runtime spike. The workbench validates the graph, lowers it to IR, generates one artifact, compiles it on the actual PixiJS WebGL2 context, binds project textures and uniforms, then renders it on a Sprite or Container host. `foundation.test` retains its test-only placeholder.

## Scene and assets

- Project file version 4 adds `preview.filterAreaInset`; version 3 files migrate with inset 0. Versions 1 and 2 keep their existing graph-kind and renderer-target migration. Stage width and height, host, source image, background, padding, resolution, sampling, time, and parameter values stay in the preview scene. Scene changes do not enter the graph build ID.
- The built-in source is a transparent two-color sample with a transparent center. Users can import PNG, JPEG, or WebP preview images. They are embedded in `assets.preview`, separate from formal graph dependencies, and selected by stable asset ID. Existing image limits apply: 2 MiB each, 3 MiB total, maximum 4096 pixels on either side. Failed import leaves the scene and project untouched.
- The checker/dark/light background is CSS behind the transparent Pixi canvas. The Filter is attached only to the host. It samples that host's rendered pixels, not the outside background or a Sprite's original atlas UV. The Container host uses two overlapping child Sprites. `filterAreaInset` clips the host-local filter area; Filter padding expands the effect around that area. The area is specified in host-local coordinates, as verified by real Chrome rendering.

## Replacement and failure

Each graph/scene/asset change increments a request number. Image decoding may complete out of order; only the latest request can install a Filter on the stage. Superseded textures and runtimes are destroyed. A new successful render replaces and disposes the previous display. A failed graph, missing asset, runtime error, or image decode preserves the last successful canvas and marks it **Old preview** with the old build ID and current error. Initial failure and WebGL2 unavailability have distinct states. An unfinished graph remains editable and saveable.

## Verification

- `npm run typecheck` and `npm test`: project V1–V4 migration and schema checks.
- `npm run build` and `npm run smoke`: Chrome WebGL2 UI rendering, Sprite/Container switch, host-local area crop, old preview after disconnect, delayed image decode losing to a newer request, embedded image upload and size rejection, unavailable WebGL2, plus existing Phase 0 and generator regressions.

Round 11 will add time/parameter playback, original/effect comparison, and a read-only code view tied to this component's successful generated artifact.
