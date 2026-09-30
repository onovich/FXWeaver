# Phase 2 preview and canvas controls

The preview's **Enlarge preview** action turns the same preview component into a viewport-sized dialog. **Return to workbench** or Esc closes it. The Pixi canvas, Filter, successful build, original/effect comparison, time and parameter controls remain the same instances/state. Expansion is UI state and is neither saved as graph data nor included in build identity. Paused time does not advance on opening or returning. Focus stays in the dialog and returns to the opening button after close.

`tests/preview-enlarge.smoke.spec.ts` checks actual canvas bounds grow, the same canvas is retained, fixed pixels/time/build ID stay equal, comparison and parameter edits work, and Esc restores the small preview and focus. No second Shader pipeline is created.

**Fit all nodes** and unmodified `F` measure the rendered node elements' local positions and actual sizes, then center their bounds inside the visible canvas with 32 px padding. Fit can go below the previous 50% floor; manual zoom allows 1%–200%. **Restore view** returns to the viewport before the last fit. These are layout changes only. `F` does not intercept text fields, select controls, contenteditable content, or the enlarged preview dialog.

Three real Chrome tests verify all node rectangles, including each output root, lie inside the visible canvas for 03/05/09; restore returns exactly to the earlier transform, and both build ID and generated GLSL remain unchanged. The same paths remain usable with ordinary zoom and pan for further editing.
