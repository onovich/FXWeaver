# Phase 2 local trial record

Operator: Codex through Playwright, 2026-10-01 Asia/Shanghai. This is agent-operated technical use; human and overnight use remain unverified. The Unity repository is read-only. Its existing two modified font assets are recorded in `.fxweave-local/source-baseline.json`; the test compares source image hashes and Git status before and after every run.

Run `npm run trial:local` with the default Unity root `D:/UnityProjects/UnregisteredScene`, or set `UNITY_PROJECT_ROOT`. Missing/unreadable input produces an explicit failing test, verified with a deliberately missing root. Ordinary `npm run smoke` does not select `.local.spec.ts` tests.

| Work | Source relative to Unity root | Dimensions / Alpha | SHA-256 |
| --- | --- | --- | --- |
| 03 | `Assets/Resources_Runtime/Sprite/UI/Investigation/Anomaly/Chapters/Chapter01/anomaly-ch01-001.png` | 884×419; 157044 transparent pixels | `3d19bb9feb71be1c7868bea7360841a0f90d7fec7e59b414631b9360ef8fe7e2` |
| 05 | `Assets/Resources_Editor/sample_card_a.png` | 350×450; 45086 transparent, 3818 partial Alpha pixels | `a6d67df59ea59d29449fb08445da720f8ad8de08071167d7bb14353e2a835f90` |
| 09 | `Assets/Resources_Editor/InvestigationVisualSystem/Hologram/HologramPartner.png` | 1199×1312; 989799 transparent pixels | `6820bddb207c2f09e31bf51bc1b6d3d2876ccde2fc9367eaa1f3645b57880b21` |

Round 1: all three example copies opened, actual images imported through the existing UI, and preview/code build IDs matched in real Chrome WebGL2. Results and full private evidence remain under ignored `.fxweave-local/`; no artwork payload is committed. Typecheck passed. Import actions took about 0.5–0.9 seconds each in this automated run, excluding design/review time.
