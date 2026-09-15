# Iteration 02 — My places and season comparison

Open `temp_viz.enhanced.html`. No installation is required.

## My places

Search actual atlas locations by city, state abbreviation, or state name. Each result identifies its city and state. Choosing it pins the location, pauses timeline playback, closes search, and moves the camera toward it. The move is immediate when reduced motion is active. Revisiting an already-pinned place does not unpin it. The existing four-pin limit remains; the oldest pin is replaced when a fifth location is selected.

There is no geolocation permission, external geocoding, nearest-city substitution, or personal journal storage. Pins persist in the view URL. No-match results explain the dataset's coverage instead of selecting a misleading substitute.

## Compare

Compare defaults to January and July of the currently selected year, falling back to the available record bounds when necessary. Both selects expose the full monthly axis and mark partial months.

The left side shows A; the right shows B. Drag the divider with mouse, pen, or touch. Keyboard arrows move it 2%, Shift-arrows 10%, and Home/End move to 5%/95%. The explicit 50 / 50 control recenters it. Done returns to month A, preserving pins, camera, palette, and visual settings.

Pinned locations show their stored monthly values and Δ = B − A. Celsius changes are converted as differences, without applying a temperature offset. Comparing a month to itself gives zero change. Partial-month comparisons remain visibly labeled.

Both scenes share the same camera matrices, viewport, palette, and temperature domain. Each month retains its own temperature-dependent relief and seasonal lighting; the geographic surface can therefore step at the divider. Hover picking uses the field on the pointer's side. Timeline playback is disabled during comparison, so the selected months remain stable.

The URL uses month keys (`ca`, `cb`) and `split`, alongside existing pins and camera settings. This restores the comparison even when additional months are appended. It remains a view link, not a frozen data snapshot.

## Implementation

`review/experience.cjs` transforms the iteration-01 output; `review/build-enhanced.cjs` invokes it before checking the embedded data and writing the enhanced file.

The previous scene pipeline is factored into `renderScene(clip)`. Comparison renders each month into the existing offscreen scene/emission/bloom buffers, then clips only its final composite onto the left or right of the canvas. One camera update occurs per frame. This preserves the bloom neighborhood on both sides of the divider.

Two cached scalar fields and textures are rebuilt only when the selected month or underlying temperature array changes. Moving the divider does not recompute station interpolation. Cache textures are deleted on replacement and exit. Pinned readings also invalidate when the underlying data array changes.

Two full scene passes cost more GPU time than one; no hardware frame-rate guarantee is made. Adaptive quality remains a future optimization.

## Verification

Run `node review/verify-experience.cjs` for the new checks, and `node review/verify-enhanced.cjs` for the prior edition's regression checks. Both use the documented Node 22+/Windows Chrome setup.

Passed checks include city and full-state search, no-match handling, keyboard selection, idempotent revisiting, pin preservation, A/B values against the embedded payload, Fahrenheit/Celsius differences, same-month zero changes, partial-month labels, pointer and keyboard divider movement, shared-state restoration, mobile layout, touch cancellation, comparison exit, and the non-HDR framebuffer fallback. The original rendering/interaction regression suite also passed after the new renderer extraction.

Visual review used desktop and mobile screenshots in Chrome with SwiftShader and live updates disabled. Real GPU performance, additional browser engines, and live network refresh were not exercised; cache invalidation for data replacement is implemented but was not network-tested.

## Preservation

The original `temp_viz.html`, its two earlier backups, and the September baseline were not edited. Iteration 01 of the enhanced app is saved at `archive/temp_viz.iteration-01.html`. The embedded data payload remains unchanged in iteration 02.
