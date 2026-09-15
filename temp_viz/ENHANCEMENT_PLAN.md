# Thermal Atlas: visual enhancement review

Reviewed 13 September 2026. Direction: combine cinematic material and light, expressive atmospheric motion, and precise cartography.

## Preservation

All three existing HTML files remain unchanged. The current working file is the appropriate starting point: it includes additions absent from the two older, identical backups. A byte-for-byte snapshot is saved as `archive/temp_viz.2026-09-13.baseline.html`.

SHA-256 of working file and new snapshot:
`C14B8853810473FA39B5055143167B78B57DACDBE1031F2B95DA6D3AAE34BCC1`

SHA-256 of both `temp_viz_original.html` and `temp_viz.backup.html`:
`0AFB4AA004478B3987493581A767CB46FE931A2326F7C899654543A14ABBC01E`

Future experiments should use a separate `temp_viz.enhanced.html`, with the same embedded data as this baseline. Iteration 01 is now implemented in that separate file. See ITERATION_01.md for changes, controls, and validation.

## Existing strengths

This is a standalone HTML application, not a framework project. Its custom WebGL2 renderer already provides a subdivided thermal surface, coastline thickness, five OKLab-interpolated palettes, seasonal light, height-dependent atmospheric attenuation, 4,200 animated motes, floating-point scene buffers when supported, bloom at two resolutions, an ACES-style tone curve, and responsive HTML controls. Station pins, comparison charts, camera controls, and URL state are worth retaining.

The embedded dataset contains 159 locations and 32 months, January 2024 through August 2026, with the page reporting observations through 21 August 2026. These describe the baked payload, not a newly verified live weather record. Rendering inspection reported 224,679 terrain vertices (74,893 triangles per surface pass), and a 300 x 166 interpolation field using ten neighboring stations per cell.

## Concrete findings

| Priority | Evidence in temp_viz.html | Consequence and proposed change |
| --- | --- | --- |
| First | Lines 1014 and 1027: `vFade = abs(aCorner.y)` at vertices whose side values are -1 and +1. | Every vertex exports 1, so the interpolated fade is also 1 and fragment alpha is zero. Pass the signed side to the fragment shader and take its absolute value there. A browser-only experiment visibly restored state borders and coastline. |
| First | Lines 1061-1062: reversed `smoothstep` edges in station rings and cores. | These results are undefined by GLSL. Rewrite as `1.0 - smoothstep(low, high, r)` to make the intended marker shape portable. See the [Khronos specification](https://github.khronos.org/Vulkan-Site/glsl/latest/chapters/builtinfunctions.html). |
| First | Lines 436-460 and 1364 produce sRGB palette bytes in RGBA8; shaders use those values directly for lighting; lines 1156-1182 apply a tone curve without explicit output encoding. | Establish a consistent linear-light working pipeline, then encode for display once. Retune exposure and lighting together so the result does not simply become brighter. Retain an analytical view whose palette can be compared directly to the legend. The [color-management explanation](https://threejs.org/manual/en/color-management.html) describes the relevant principle; migrating to Three.js is not necessary. |
| High | Line 721 disables context antialiasing; the custom scene framebuffer is single-sample. | Add antialiasing to the actual scene pipeline. A quality tier can use multisampled scene rendering plus resolve; a cheaper tier can use post-process edge smoothing. Merely turning on context antialiasing will not multisample this offscreen target. |
| High | Lines 1136-1182 and 2450-2483 implement threshold bloom, corner color offsets, grain, and vignette. | Make brightness selective: an emission mask for coastline, pinned stations, and chosen filaments; soft-threshold bloom; substantially lower default grain. Preserve local contrast and dark separation. |
| High | Lines 1073-1128 use independent sinusoidal wandering and vertical point cycles. | Introduce coherent flow and short trails, retaining a sparse point layer for depth. Derive visual intensity from temperature and gradients, but label motion as stylized convection, not measured wind. |
| Medium | Lines 570-584 recompute 498,000 weighted contributions per animation frame during playback, followed by a field upload. | Cache fields at monthly endpoints, then interpolate those fields. Explore GPU interpolation with matching CPU picking only if hardware profiling justifies it. |
| Medium | Lines 1415-1418 add camera velocity and multiply by 0.90 each frame. | Make inertia time-based so orbit release feels consistent across refresh rates. |
| Medium | The 390 x 844 inspection fits the controls but leaves the map small amid substantial empty space. | Fit the camera to the usable scene rectangle, reduce the persistent mobile legend footprint, and offer a focused scene layout. |

The isotherm shader also centers each line at half a five-degree interval (`fract(degF / 5.0) - 0.5`, line 934). If the intended values are multiples of 5 F, correct this offset when refining contours.

## One integrated visual direction

Aim for a luminous thermal sculpture with readable geography and organized motion.

**Precision underneath.** Sharp coastlines, subdued internal boundaries, clear major/minor contours, legible station markers, and a stable temperature scale. Make effects independent of the numeric data. Keep flat view and readable palettes available.

**Material and light above it.** Give the surface broad, soft highlights with controllable roughness, a restrained grazing rim, and subtle shading that reveals changes of slope. Preserve the existing seasonal key light. Use shadow and atmospheric separation to make height readable, without adding decorative displacement to temperature-encoded geometry.

**Motion with structure.** Build broad, slow convection paths, shorter local curls, and a few fine luminous trails. Fade them by age and depth. Let a selected station briefly organize nearby light, while the station value and contour geometry remain unchanged. Avoid filling every region with equally bright activity.

**Controlled presentation.** Expose a few meaningful controls: Radiance, Atmosphere, and Flow, plus rendering quality and motion pause. All three visual directions should work together at the default setting. Reduced motion should stop decorative animation, including time-varying grain. Keep the interface out of the bloom pass.

## Iteration sequence

1. **Restore and calibrate:** border/marker fixes, correct color handling, antialiasing, restrained grain. Compare January and July in Thermal, Ice-Fire, and Viridis with the same camera and data. Establish a crisp baseline before tuning elaborate effects.
2. **Sculpt light:** refine material response, selective bloom, atmospheric depth, and coastline hierarchy. Compare both grazing and overhead views; verify that hot areas remain distinguishable.
3. **Organize motion:** introduce flow trails and selected-station reactions, with a static alternative and reduced-motion support. Keep particles subordinate to geographic and thermal information.
4. **Compose and optimize:** improve mobile framing, make inertia time-based, profile on the actual GPU, and choose quality tiers from measured frame times. A 60 fps desktop target means a 16.7 ms total frame budget; this is a target, not a measured result.

For each iteration: preserve the embedded payload, use fixed month/camera/particle seeds for comparisons, check station cards and pin values, test mouse/touch/keyboard paths, and capture desktop/mobile views. Avoid introducing a large renderer rewrite before these localized improvements are evaluated.

## Inspection evidence and limits

`review/thermal-border-before.png` and `review/thermal-border-experiment.png` compare the original shader with the signed-side correction. Both use reduced motion to remove particles and the opening transition. The fix was injected into browser memory only; it was not applied to project source. These images demonstrate the defect correction, not the full proposed enhancement.

`review/thermal-current-mobile.png` records the current mobile composition. `review/thermal-inspection.json` contains scene metadata.

The scenes loaded without JavaScript exceptions in headless Chrome using SwiftShader. Live network updates were disabled so the embedded dataset stayed fixed. This verifies visual output under that renderer; it does not establish hardware GPU performance, cross-browser compatibility, or live-data accuracy.

