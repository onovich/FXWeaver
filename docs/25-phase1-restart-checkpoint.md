# Phase 1 restart checkpoint

Historical checkpoint for the Codex client restart after round 15. The user explicitly resumed work on 2026-10-01; rounds 16–20 are recorded in the [Phase 1 development report](./27-phase1-validation-report.md). The stop instruction below applied only during that pause.

## Saved state

- Repository: `D:\WebProjects\FXWeaver`, branch `main`, remote `origin/main`. The round 15 commit containing this note and Work 09 is the checkpoint; use `git log -1 --oneline` to identify its exact hash after restoring the client.
- Rounds 1–14 were already committed and pushed. Round 15 finishes 09 local hologram scan using an editable graph, operation log, generated GLSL/manifest, fixed preview images, and a real WebGL2 smoke test. No round 16 work has started.
- Works 03, 05, 09 live under [`examples/`](../examples/) with their capture scripts under `tests/work*.capture.spec.ts` and ordinary regression tests under `tests/work*.smoke.spec.ts`. Generated code in `examples/generated/` is evidence; each `.fxweave.json` graph remains the source of truth.
- Round 15 adds no runtime effect-specific Shader branch or node type. The work is limited to a local Sprite Filter with moving scan lines and red-channel displacement.

## Resume

1. Open `D:\WebProjects\FXWeaver`; run `git fetch origin`, `git switch main`, `git pull --ff-only origin main`, and `git status --short --branch`. The checkout should be clean and aligned with `origin/main`.
2. Read this checkpoint, the [execution guide](./15-v0-generated-filter-goal-mode-execution-guide.md), and the three work notes (`22`, `23`, `24`). Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run smoke` if the restarted environment needs a baseline.
3. When the user says continue, start **round 16**: add a unified example entry, editable derivation flow, build manifest access, and creation records for all three works. Then use rounds 17–19 only for repair and focused regression, and round 20 for the full report and planner handoff. Follow the per-round commit/push gate.

Verification and exact pushed HEAD are also reported to the planning chat in the checkpoint confirmation. Do not treat this pause as Phase 1 or V0 acceptance.
