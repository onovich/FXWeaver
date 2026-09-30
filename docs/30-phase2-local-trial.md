# Phase 2 local trial record

Operator: Codex through Playwright, 2026-10-01 Asia/Shanghai. This is agent-operated technical use; human and overnight use remain unverified. The Unity repository is read-only. Its existing two modified font assets are recorded in `.fxweave-local/source-baseline.json`; the test compares source image hashes and Git status before and after every run.

Run `npm run trial:local` with the default Unity root `D:/UnityProjects/UnregisteredScene`, or set `UNITY_PROJECT_ROOT`. Missing/unreadable input produces an explicit failing test, verified with a deliberately missing root. Ordinary `npm run smoke` does not select `.local.spec.ts` tests.

| Work | Source relative to Unity root | Dimensions / Alpha | SHA-256 |
| --- | --- | --- | --- |
| 03 | `Assets/Resources_Runtime/Sprite/UI/Investigation/Anomaly/Chapters/Chapter01/anomaly-ch01-001.png` | 884×419; 157044 transparent pixels | `3d19bb9feb71be1c7868bea7360841a0f90d7fec7e59b414631b9360ef8fe7e2` |
| 05 | `Assets/Resources_Editor/sample_card_a.png` | 350×450; 45086 transparent, 3818 partial Alpha pixels | `a6d67df59ea59d29449fb08445da720f8ad8de08071167d7bb14353e2a835f90` |
| 09 | `Assets/Resources_Editor/InvestigationVisualSystem/Hologram/HologramPartner.png` | 1199×1312; 989799 transparent pixels | `6820bddb207c2f09e31bf51bc1b6d3d2876ccde2fc9367eaa1f3645b57880b21` |

Round 1: all three example copies opened, actual images imported through the existing UI, and preview/code build IDs matched in real Chrome WebGL2. Results and full private evidence remain under ignored `.fxweave-local/`; no artwork payload is committed. Typecheck passed. Import actions took about 0.5–0.9 seconds each in this automated run, excluding design/review time.

Round 2: `.fxweave-local/work03.fxweave.json`, `work05.fxweave.json`, and `work09.fxweave.json` now contain actual source images, modified graph defaults and runtime controls. UI Save As uses a disk-writing file-handle bridge, then the physical JSON file is reimported through the UI. Each reopened build ID and fixed canvas hash equals its saved state. Private `work*-result.json`, `work*-original.png`, and `work*-effect.png` record parameters, hashes, timing and comparison. Automated actions took about 1.6–1.8 seconds per work, excluding review/design.

- 03: Radius graph default 0.4 / runtime 0.3, Sprite, fixed time 0. The horizontal anomaly is revealed through an orange burn edge. A circle in normalized UV appears as an ellipse on the 884×419 source; this trial preserves that graph definition rather than silently correcting it. Transparent corners remain clear.
- 05: Amplitude default 0.06 / runtime 0.1, Container, 0.75 s. Both overlapping card copies distort horizontally, including the transparent side contours; changing time to 1.2 s changes the wave, returning restores the frame. Source sampling outside UV 0–1 remains transparent.
- 09: Scan intensity default 0.25 / runtime 0.4, Sprite, 0.5 s. The character silhouette stays transparent outside its outline; scan bands and channel offset act locally. 1.2 s changes the scan and returning restores the frame. The narrow workbench preview makes this character small, confirming the need for round 3.

The larger Sprite exposed a pre-existing area bug: display dimensions were passed as local `filterArea` dimensions and Pixi multiplied them by Sprite scale again, clipping the character to a transparent corner. Round 2 converts display area/inset back to unscaled Sprite local coordinates. A public synthetic 1200×1300 transparent image regression proves visible pixels remain and area inset still crops. This corrects host rendering, with no graph/compiler semantic change; Phase 1 Sprite screenshots are historical captures before this correction.

Round 2 validation: typecheck, 72 unit tests, build, 34 public Chrome smoke tests, and 6 isolated actual-asset tests pass. Image hashes and the Unity Git-status baseline remain unchanged.

Round 5: all three actual-material projects were fitted, enlarged, adjusted in the enlarged view, compared with Split, returned with Esc, saved and physically reopened. Every node stays inside a 30-pixel minimum margin; saved viewport, build identity and fixed pixels survive reopen. Enlarged display width exceeds twice the workbench width. The same canvas pixels survive enlarge/return; parameters respond and restoring values restores pixels. Private `work*-workbench.png`, `work*-enlarged-split.png` and `work*-enlarged-effect.png` are the evidence. Automated editing actions took about 2.2–2.4 seconds per work; visual review is separate.

Visual review of the three enlarged effect captures confirms: 03 has a jagged orange elliptical burn boundary on the horizontal source; 05 shows two heavily waved card silhouettes in Container; 09 makes the local blue scan bands and cyan/magenta channel fringes clearly inspectable around the character. The larger display resolves the observed small-preview problem. No further tool defect appeared in this walkthrough. Graph defaults remain Radius 0.4, Amplitude 0.06 and Scan intensity 0.25; runtime overrides remain 0.3, 0.1 and 0.4. The normalized-UV ellipse in 03 remains an explicit artistic choice of this derivative.

Round 5 Debug check: actual disk Save As/reimport verifies layout and image state, including parameter restoration and paused frame; local missing-source failure remains explicit. Architecture check: only tests/records changed, viewport stays outside shader identity, and Unity status/image hashes match baseline. Validation: `npm run trial:local` (6) and `npm run typecheck` PASS. Buffer round not used.
