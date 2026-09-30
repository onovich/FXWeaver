# Phase 2 preview and canvas controls

The preview's **Enlarge preview** action turns the same preview component into a viewport-sized dialog. **Return to workbench** or Esc closes it. The Pixi canvas, Filter, successful build, original/effect comparison, time and parameter controls remain the same instances/state. Expansion is UI state and is neither saved as graph data nor included in build identity. Paused time does not advance on opening or returning. Focus stays in the dialog and returns to the opening button after close.

`tests/preview-enlarge.smoke.spec.ts` checks actual canvas bounds grow, the same canvas is retained, fixed pixels/time/build ID stay equal, comparison and parameter edits work, and Esc restores the small preview and focus. No second Shader pipeline is created.
