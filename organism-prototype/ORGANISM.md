# Living Field

A first interactive direction for the existing Tauri particle sketch: one soft organism whose response depends on the quality and recent history of an encounter.

## Try it

This folder is a standalone Tauri 2 project. From the `organism-prototype` folder:

```sh
npm install
npm run dev
```

`npm run tauri dev` also works. Use `npm run build` for a release build and platform installers, or `npm run build -- --no-bundle` for the executable alone. For a frontend-only preview, open `src/index.html` in a browser; no server or Tauri bridge is required.

Development requires Node.js/npm, Rust, and the platform toolchain. On Windows, install the MSVC C++ Build Tools and WebView2 as described in the [official Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). Initial dependency installation may need internet access.

The JavaScript tooling dependency is `@tauri-apps/cli`; native dependencies are declared in `src-tauri/Cargo.toml`. The animation has no frontend runtime dependencies and needs no bundler.

```text
organism-prototype/
  package.json            npm commands and Tauri CLI dependency
  package-lock.json       pinned npm dependency tree
  src/                    index.html, main.js, styles.css
  src-tauri/              Cargo.toml, Cargo.lock, build.rs, tauri.conf.json
    src/                  Rust application entry points
    capabilities/         native window permissions
    icons/                application bundle icons
  original-fluid/         preserved original sketch
  verify.cjs              browser interaction checks
  ORGANISM.md             this guide
```

- Leave it alone: its outline breathes, cells circulate, and cilia sway at different rhythms.
- Move slowly near its body: it gradually leans toward you and stretches locally toward your presence.
- Hold the mouse or a finger near it: connection builds, the body opens slightly, and luminous signals travel through the cells.
- Sweep quickly across it: it contracts, withdraws, and warms in color. Give it several seconds to recover.
- Leave: familiarity fades slowly, giving the encounter an aftereffect.

Focus the canvas to use arrow keys as a virtual touch, Enter to hold, Escape to leave, and Space to pause. Pause and Begin again are also available as buttons. Reduced-motion preferences start the scene paused; Resume is an explicit opt-in.

## How it works

`src/main.js` contains `LivingField`, a dependency-free Canvas 2D simulation. A deforming polar surface holds 6,200 spring-driven cells; the interior circulates faster than the membrane. Layered frequencies vary the outline, respiration, drift, and cilia. Three continuous state values drive the response:

- `trust` rises over seconds around calm nearby input and decays more slowly after departure.
- `alarm` responds quickly to rapid nearby movement and decays over several seconds.
- `contact` rises during a calm hold and controls expansion and signal frequency.

These are artistic behavioral controls, not a biological model or emotion detection. Input stays in memory and is discarded on reset/reload. There is no camera, microphone, telemetry, or saved interaction history.

Physics runs at a fixed 60 Hz with bounded catch-up after interruptions. Drawing follows the display refresh rate; backing resolution is capped at 2x. Pointer events handle mouse, pen, and touch. Capture cancellation, loss of focus, and page visibility clear the interaction.

Useful tuning points: `surface()` for body shape and respiration, `step()` for sensitivity and recovery, and `render()` for density, cilia, and light. The original sketch is preserved under `original-fluid/`.

## Verification

`npm test` (or `node verify.cjs`) runs local headless Chrome checks for breathing, familiarity, hold signals, startle/recovery, finite particle positions, cancellation, keyboard control, pause, resizing, touch, and reduced motion. It writes preview PNGs alongside the script. This runner expects Windows Chrome at its standard Program Files location and Node 22 or newer; the animation itself has no frontend runtime dependencies.

