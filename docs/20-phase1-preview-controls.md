# Phase 1 runtime controls and generated output

Round 11 adds playback, fixed time, exposed-parameter controls, comparison, and a read-only generated output panel to the workbench Filter preview.

The generated artifact is installed by the round 10 preview pipeline. Time and parameter edits call `FilterRuntime.update` and redraw the existing PixiJS stage; they do not lower the graph or allocate another Filter. The build ID therefore stays fixed for those edits. Playback advances with `requestAnimationFrame`, caps long frame gaps, updates its label roughly every 100 ms, and checkpoints the current seconds into the project scene roughly every 500 ms. Pause, reset, and fixed-time entry save an exact scene time. Invalid runtime values leave the last valid pixels visible and mark the preview old.

The original view is captured by rendering the same Sprite or Container host once without its generated Filter, then restoring the Filter and rendering the effect. Original, effect, and split modes only change the display overlay. The original image uses the same source asset and host bounds; the checker/dark/light background stays outside the host.

The generated output panel holds the **same `GeneratedFilter` object** that was installed by the last successful preview. It shows build ID, backend, PixiJS/generator versions, parameter and texture bindings, and exact fragment GLSL. Copy and downloads are enabled only while that build is the current successful preview. When the graph becomes invalid, the panel labels the previous build and disables those actions; the old code remains inspectable for diagnosis.

Chrome WebGL2 smoke tests verify parameter color changes with an unchanged build ID, fixed-time pixel equality, play/pause and reset, scene-time export while playing, original/effect comparison, GLSL download matching the displayed build, and disabled download after an invalid graph. The time test uses generic Number, Time, and Compose Vector 4 nodes, not an effect-specific Shader path.
