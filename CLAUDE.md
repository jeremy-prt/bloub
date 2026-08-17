# bloub: notes for Claude

## Commands

```bash
pnpm dev       # 5190 (set in vite.config.ts, mirrored in .claude/launch.json)
pnpm test      # vitest
pnpm build     # vue-tsc --noEmit && vite build
```

Vue 3.5 + Vite 8 + TS strict + Tailwind 4 (`@tailwindcss/vite` plugin, no
`tailwind.config.js`), pnpm.

Style: 2 spaces, single quotes, **no semicolons**, comments in French. No ESLint
and no Prettier: `vue-tsc` is the only gate, so run `pnpm build` before
concluding.

## The most important rule

**The bot's numeric constants are measurements taken off the reference video, not
settings.** Gaze angles, eye sizes, radii, timings, colours: all of it comes from
frame-by-frame analysis. Don't round them, don't simplify them, don't replace them
with values that look tidier: it breaks the resemblance, which is the only
success criterion here.

The verified traps that must not be "corrected" are listed in
[docs/measurements.md](docs/measurements.md). Read it before touching a number in
`src/bot/`.

One deliberate exception: **`--ink` (`styles.css`) is the interface colour, chosen,
not measured**, a night blue. The video's black is the bot's, in `skins.ts`
(`encre`, `#0a0a0c`). Retouching one doesn't touch the other.

## Invariants worth knowing before editing

Details and the reasoning behind each are in [docs/](docs/):

- **`src/bot/` has no framework and no clock.** `engine.sample(t)` is a pure
  function of time. That's what makes `frozenAt`, the state board and the
  DOM-less tests work. No real-time state, no `Date.now()`, no Vue import. And
  **`sample()` must not mutate**: purging a stale previous state during playback
  makes the engine non-replayable (there's a dedicated test). Shared Vue code goes
  in `src/ui/`.
- **The montage holds or cuts, it never scales time** (`cycles.ts`). Hence
  `MIN_BLOCK` (0.6 s) and `StateDef.minDuration`, which is read off the state's
  `pose()` constants. Fill it in for any new narrative state.
- **All silhouettes share the same angular sampling** (`PROFILE_SAMPLES`), which is
  what makes morphing a linear interpolation of radii. A new shape must go through
  a radial profile, or `profileFromPolygon`.
- **The eyes are holes in a `<mask>`**, not white shapes on top. That's what makes
  them clip against the silhouette on their own.
- **The render frame lives in `src/bot/repere.ts`**: `RAYON` (100) and `DEMI_VIEWBOX`
  (158) define what `sample()` returns, so they can't sit in a `<script setup>` where
  nothing can import them — `export.ts` used to redeclare one by hand. The Vue component
  is a client of the engine, not its definition.
- **Anything sitting "on" the body must follow its real radius**: `radiusAtAngle`
  (defined in `shape.ts`, applied by `engine.ts`) for the eyes and the notification
  pastille. A new element anchored to the outline needs the same treatment.
- **That pro-rata places the eye's centre, not the eye.** Since the margin in front of the
  edge is multiplied by the same factor, a narrow shape pushed the eye out through the mask.
  `src/bot/eyefit.ts` adds a **common offset to both eyes** — a translation, so an isometry —
  only on a customiser shape. **It is a table built at import, not a solver in the render
  loop**, and that distinction *is* the fix: seven per-frame versions all trembled, because
  everything they read (gaze drift, pointer, expression mid-morph, which edge is nearest)
  moves every frame. The engine reads the table on the **boundaries** of each morph and
  interpolates with that morph's own curve — never on the interpolated value, which has no
  identity and exists in no table. `docs/architecture.md` lists the six variants that were
  measured and rejected; don't re-try them. `skins.test.ts` locks the lot, and it sweeps
  **time as well as combinations** — one instant per combination is what let
  `capsule` + `effraye` through.
- **States declare `ArcSpec`; only the engine rasterises.** Don't call `arcRender`
  from `states.ts`.
- **A state change landing inside a fade blends from the FROZEN composite pose**
  (`setState`), not from the full pose of the state being left — the engine has one slot of
  history, and using it naively jumped 26–43 px where a spaced change moves 10–14. It
  freezes **only** when a fade is in progress: doing it always would halt the outgoing
  state's own animation for the whole fade. Spaced playback is byte-identical, and a test
  locks both halves.
- **Transitions are exponential ease-outs and the body never overshoots.** The one
  spring is the notification pop (`NOTIF_POP = 1.14`). There is deliberately no
  spring engine. A new bouncing effect belongs in the state that needs it.
- **Two sources of shapes, not to be mixed.** `profiles.ts` is generated from the
  video and drives the animated states; `skins.ts` holds the customiser's shapes,
  built analytically. A user's shape only replaces the body on `baseBody` states
  (`idle`, `wink`, `wide`, `notify`, `swirl`); elsewhere the silhouette IS the
  animation.
- **Among catalogue states only `idle` carries `baseFace: true`** (`swirl` does too,
  but it isn't in the catalogue). The other face states have an expression measured
  off the video. That's the point.
- **A tilt is only visible on an elongated eye.** `expressions.test.ts` enforces it:
  width/height outside `[0.6, 1.7]` for a tilt of 20°+, outside `[0.8, 1.25]` below.
  Already went wrong once.
- **Labels don't live in `src/bot/`.** The catalogues carry ids and the display
  resolves `t('states.orbit')`. Their ids are **literal unions** so the compiler
  checks that every entry has a label in all three languages. Adding a shape
  without its label doesn't compile.
- **One state isn't measured: `swirl`**, the settings view's entry transition. It's
  deliberately outside `SEQUENCE` (a test locks that) and carries both `baseBody`
  and `baseFace`.
- **`mediabunny` is the only dependency besides Vue, and it must stay a DYNAMIC import.**
  It encodes the cycle's MP4 (`src/ui/video.ts`). Imported statically it adds **43 kB gzip**
  to the initial bundle, more than the 34 kB that got `vue-i18n` rejected in favour of the
  in-house layer. Behind `await import(...)` it costs 0.7 kB and only arrives when someone
  exports a video. Turning it into a top-level import would silently undo that.
- **Don't declare `role="menu"` without the keyboard contract.** Those roles *promise*
  arrow-key navigation and focus moved into the menu on open, and they stop exposing the
  children as ordinary buttons. Three popups declared them and implemented none of it, so
  the Tab order didn't match what was announced — they are plain button lists now, with
  `aria-haspopup="true"` and `aria-expanded`. `Settings.vue` shows the other route: a real
  `radiogroup` with a moving `tabindex`. Pick one, never the label alone.
- **64rem is the only breakpoint, and it separates two different layouts, not two sizes.**
  Above it the scene is the three-column grid and the page never scrolls (`#app { overflow:
  clip }`): things can float in the margins and be anchored to the window. Below it
  everything stacks and the page scrolls for real, which breaks exactly those three
  assumptions — so the rail becomes a top bar, the montage bar gets an opaque background
  (without one, content scrolls visibly through it), and the wordmark returns to the flow.
  Anything new that is `fixed`, or anchored to the bottom of `#app`, needs its own answer
  below 64rem. `--timeline` also changes there (236 → 200 px); the fine positioning that
  reads it lives inside the `>= 64rem` query and never sees the other value.
- **`prefers-reduced-motion` is followed at runtime, not read once**, and it draws a line:
  it cancels box transitions and the settings view's `swirl` entry, which are decoration;
  it does **not** cancel the breathing, gaze drift and blinking, which are what the bot IS.
- **A UI element that must appear once uses a `transition`, not an `animation`.** An
  animation replays on every mount: every view change, every reload. A transition
  doesn't run on an element's first computed style, so it stays quiet there. That's
  why `.panneau` and `.barre-export` are built that way, and why the latter is
  mounted-but-hidden during the arrival rather than absent.
- **`Look` aims in ABSOLUTE terms on both axes, and the engine does the mixing**:
  only it knows the pose at instant t. `mix` and `wander` are distinct, and drift is
  added *after* the mix. **`setLook` refuses a non-finite target**: the engine keeps
  the last one, so a single `NaN` would settle in forever.

## Where to read more

| | |
|---|---|
| [docs/architecture.md](docs/architecture.md) | The engine, morphing, mask eyes, `Look` |
| [docs/measurements.md](docs/measurements.md) | What was measured, the traps, regenerating `profiles.ts` |
| [docs/intro.md](docs/intro.md) | The arrival sequence, and why it plays only `idle` |
| [docs/interface.md](docs/interface.md) | Three-column scene, CSS traps, icons |
| [docs/export.md](docs/export.md) | The export bar, SVG/PNG/GIF/MP4, why the still export has no GIF |
| [docs/i18n.md](docs/i18n.md) | The hand-rolled translation layer |

The README is for people arriving at the repository: what the project is, how to
run it, the component's API. Don't duplicate it here.

## Tests

`pnpm test` runs in `node` by default. **One file asks for a DOM** and says so on its first
line (`// @vitest-environment happy-dom`): `ui/capture.test.ts`, which mounts `BloubBot.vue`
to check the off-screen player — the exported render must be the component's own, not a
second drawing built beside it. That is also why `vitest.config.ts` carries the Vue plugin.
Keep the DOM per-file: a global DOM environment would slow the whole suite for one test.

`capture.test.ts` is the one that catches what nothing else can — the export defects are
invisible short of stepping through an MP4 frame by frame.

## Generated files

`src/bot/profiles.ts` is produced by `tools/extract-profiles.py` from the video's
frames (see [docs/measurements.md](docs/measurements.md)). Don't edit it by hand;
regenerate it.

`public/favicon.svg` is not an approximation: its circle and **both eye matrices**
are what `engine.sample(1)` returns for `idle`, byte for byte. `favicon.ico` and
`apple-touch-icon.png` are rasterised from it.

`docs/demo.gif` and `docs/states.png` are the same idea: rendered by walking
`engine.sample(t)` and writing the SVG layers in `BloubBot.vue`'s order, then
`rsvg-convert` + `ffmpeg`. They are **not** browser captures: the browser pane
suspends `requestAnimationFrame` when hidden, so an animation can't be captured
there at all. To redo them, drive the engine, don't reach for a screenshot.

Same pane, related trap: when it is hidden it also **clamps `setTimeout` to ~1 s**
and freezes CSS transitions. So no sub-second timing can be measured there: a poll
written at 40 ms actually fires at 1 s, which reads as a delay the code never had.
Assert on the *state* instead (a `MutationObserver` still fires; an
`animation-delay` of `-1.5s` samples an animation mid-way while it is frozen).

## Useful URLs

- `#planche`: the 14 states side by side, frozen. The only safe path: it doesn't
  depend on any montage.
- `#arrivee`: replays the arrival. It otherwise only plays on a genuine visit, so
  without this link you can't see it again in a session.
- `#etat=<id>&stop`: opens one state, playback paused. It looks the state up in the
  user's montages, which are all editable: if they've removed it everywhere, the
  link doesn't apply.
