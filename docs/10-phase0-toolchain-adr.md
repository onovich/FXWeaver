# ADR: Phase 0 editor toolchain

Date: 2026-09-30. Status: accepted for V0 Phase 0.

## Decision

Use TypeScript, React, and Vite for the local desktop web editor. Keep the graph schema, registry, validation, commands, and serialization in framework-free TypeScript modules. Use Vitest for the graph core and Playwright against installed Chrome for desktop interaction smoke tests. Use npm and commit `package-lock.json` for repeatable installs.

The browser UI may render graph nodes and wires, but it must call the graph core for editing and diagnostics. A minimal test graph kind will exercise the editor before the first Shader host and renderer are decided.

## Why now

The repository has no application code. This stack gives a short path to an interactive browser editor and repeatable checks without choosing a Shader API or making React part of the source graph format. Chrome is installed on the development machine, so Playwright can use its `chrome` channel without downloading a test browser.

## Boundaries

This ADR does not choose the first effect host, rendering backend, graph color/alpha/UV semantics, or any V2 target. Phase 0 must never label a static illustration as a live preview or claim that it generated Shader code.

## Commands

`npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run smoke` are stable phase checks. `npm run smoke` starts its own Vite server on 127.0.0.1:4173.
