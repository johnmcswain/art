# Thermal Atlas — Luminous edition, iteration 01

Open `temp_viz.enhanced.html` in a WebGL2-capable browser. It is a standalone HTML file; no npm installation or build step is needed to use it.

## What changed

- Restored state borders and coastline ribbons by correcting their interpolated opacity.
- Corrected the reversed smoothstep calls in station markers and aligned contours to multiples of 5 F.
- Converted the palette texture to sRGB decoding, performed lighting in linear space, and encoded the final tone-mapped frame for display.
- Added FXAA to the actual offscreen scene and removed chromatic corner offsets. Reduced film grain from 0.020 to 0.0025, with none under reduced motion.
- Added broad dielectric highlights and retuned the atmosphere for the new color pipeline.
- Added a separate emission framebuffer attachment, so surface temperature colors do not become bloom sources. Fine borders, pins, and thermal traces supply the glow. The RGBA8 fallback is supported.
- Replaced independent large sinusoidal wandering with correlated spatial drift and short projected streaks. This is stylized convection, not measured wind.
- Added Look controls for Radiance, Atmosphere, and Flow. Look settings are included in shared URLs. Pause ambience freezes the particle and grain clock; timeline playback remains a separate control. Reduced-motion preferences disable automatic ambience and startup playback; Resume ambience explicitly opts back in.
- Made camera inertia time-based and handled cancelled/lost pointer capture for the map and timeline.

Open **Look** to tune the three layers. Its original-version link carries the current map state into `temp_viz.html` for comparison. The original ignores the enhanced-only appearance settings.

## Preservation

`temp_viz.html`, `temp_viz_original.html`, `temp_viz.backup.html`, and the archived baseline remain byte-for-byte unchanged. The embedded map dataset is identical in the enhanced version. Numeric interpolation and the temperature domain have not been changed.

The latest working original and `archive/temp_viz.2026-09-13.baseline.html` both have SHA-256:
`C14B8853810473FA39B5055143167B78B57DACDBE1031F2B95DA6D3AAE34BCC1`

## Verification

The final enhanced edition passed headless Chrome checks for shader setup, framebuffer completeness and WebGL errors, all five palettes, appearance sliders, reduced motion, ambience pause/resume, station pins, units, flat view, the data table, shared state, mobile overflow, touch cancellation, and the non-HDR framebuffer fallback. January, July, mobile, controls, and fallback screenshots are saved in `review/`.

Checks used the embedded data with live fetching disabled and a fixed random seed. Shader rendering used SwiftShader. This establishes correctness in that test renderer; hardware frame rate and other browser/GPU combinations have not been measured. The inherited live weather-update code is unchanged and was not tested in this pass.

From this directory, `node review/verify-enhanced.cjs` repeats the tests. The runner requires Node 22+ and Windows Chrome at its standard Program Files location, and writes screenshots and a test browser profile in `review/`.

`review/build-enhanced.cjs` records the exact changes as transformations of the archived baseline. Running it regenerates and replaces `temp_viz.enhanced.html`; update the builder as well if changes need to survive regeneration.

## Next iterations

More elaborate volumetric plumes, long particle trajectories, mobile camera composition, monthly-field caching, and hardware-adaptive quality remain future experiments. This iteration establishes the corrected rendering pipeline and adjustable visual layers first.
