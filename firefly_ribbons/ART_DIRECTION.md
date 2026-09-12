# Firefly Ribbons — art direction

The central idea is an atlas of fleeting light: a calm, readable planet carrying delicate, almost handwritten signatures. The globe supplies orientation; the light trails supply emotion. Give the composition one dominant object and enough darkness for the light to matter.

## Implemented in this edition

- **Teal atmosphere, copper light, ivory highlights.** Warm trails separate from the cool globe without an indiscriminate rainbow. Logarithmic radiated energy controls brightness, width, and sweep length, so weaker events remain visible.
- **Calligraphic ribbons.** A tapered luminous core, fine filaments, diffuse emission, and traveling glints replace the original unrenderable point meshes. Geometry is deterministic, so filtering never randomly changes a record’s shape.
- **An observatory composition.** Large serif type, a dotted schematic Earth, fine graticules, and peripheral instrument ticks establish a visual hierarchy. Decorative stars stay quiet.
- **A way into the data.** Select a spark, archive bar, or dropdown entry to inspect date, hemispheres, radiated energy, altitude, and impact energy. Selecting from the archive brings that location forward and pauses motion.
- **Motion with restraint.** Slow rotation and subtle glints, with pause, keyboard controls, and a static initial state for reduced-motion preferences. Dragging temporarily stops rotation.

## What the picture means

The original 19 sample records are preserved, but have not been independently verified against NASA. This is explicit in the interface. The original HTML is saved as `firefly_ribbons.original.html`.

The location is the point of peak brightness. Radiated energy is in 10¹⁰ joules; impact energy is in kilotons. Unknown optional values remain unknown. Brightness is an energy encoding, not a measured temperature. Tail direction, curvature, length, and animated speed are artistic, not reconstructed trajectories. Altitude is exaggerated; geographic silhouettes are intentionally schematic.

The archive bars are ordered observations, not a uniform time axis. Their height encodes relative logarithmic energy. The day filter counts backward from the latest record, so a saved archive does not disappear with age. Ribbon detail changes filament count, not event count.

Sources: [NASA/JPL field definitions](https://ssd-api.jpl.nasa.gov/doc/fireball.html), [API service policy](https://ssd-api.jpl.nasa.gov/doc/index.php). NASA's service policy disallows embedding these APIs directly in a website. This edition makes no browser API requests; it accepts a locally saved `fields`/`data` JSON response through **Import NASA JSON**. Use a curated set of at most 100 records (for example, an API response requested with `limit=100`). Records without valid locations, dates, or positive energy are skipped and counted. Files stay in the browser; nothing is uploaded.

## Interactive edition: follow, unfold, recolor

- **Follow a light.** Select a spark or archive entry. The globe gently turns toward its location, surrounding ribbons dim, the selected trail draws into view, and a short observation card reveals the date and measurements. **Return** or Escape restores the saved camera position, zoom, and motion preference. Selecting another record keeps the original return point.
- **Weave time.** The same ribbon vertices interpolate from globe coordinates to a chronological loom over 1.65 seconds. Heads lie on their actual dates, while width and vertical reach encode logarithmic radiated energy. The axis remains anchored to the full loaded archive during filtering. Selected identity survives both directions of the transformation. This loom has a proportional time axis; the small archive bars below remain ordered event buttons.
- **A brief opening.** On the first visit in a browser tab session, atmosphere, land dots, and ribbons emerge over approximately 3.8 seconds. **Skip opening** immediately reveals the finished scene; **Replay opening** returns to the globe and runs it again. Direct interaction also ends the opening. Reduced-motion preferences skip it and make focus/view transitions immediate.
- **Color harmonies.** Ember (complementary), Aurora (analogous), Iris (split complementary), Solstice (triadic), and Moonstone (monochromatic) recolor the globe, atmosphere, trails, legend, and interface accents. A ±180° slider rotates the harmony together. Selecting a preset resets its hue offset. Appearance is saved locally when browser storage is available; no event data or geometry changes. Width and reach retain the energy encoding across palettes.

A potential next edition could offer a paused, high-resolution poster with archive dates, an energy legend, source attribution, and the selected encounter.

## Running and checking

Open `firefly_ribbons.html` directly in a modern browser. It is a single offline HTML file with no packages, fonts, textures, or CDN downloads required.

`node verify.cjs` runs the included checks with an isolated headless Chrome profile. The script assumes Chrome's standard Windows install location. It verifies rendering, coordinates, missing fields, filters, empty states, JSON import, sample restore, encounter camera restoration, actual pointer selection, date-proportional loom positions, rapid view switching, palette persistence and data preservation, opening replay/skip/completion, responsive layouts, and reduced motion. It captures desktop, phone, tablet, loom, and focused encounter PNGs. Transition checks wait for completion rather than assuming a fixed frame rate. It uses `--no-sandbox` only for this disposable local-file browser check in the restricted workspace environment.
