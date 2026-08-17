# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **The Settings and Animations views were unusable below 64rem.** Everything stacks
  there, but three pieces were still placed as if the three-column desktop grid were
  around them. Measured at 375 × 812: the navigation rail floated over the middle of the
  content (over the animations panel's heading, over the avatar in Settings); the
  montage bar had no background, so the palette scrolled through the track and its
  labels landed on top of the zoom slider; and the wordmark sat 812 px down the
  *document* rather than at the foot of the page, covering the credits and then drifting
  into mid-screen once scrolled.
- **The montage bar took 29 % of a phone screen** and its toolbar overflowed a 327 px
  row. It is 200 px below 64rem — still the ruler plus a card at full thumbnail size —
  the two counters flanking the play button give way to the identical pair already in
  the toolbar, and the export button keeps its icon, its label staying as the accessible
  name.

### Changed

- Below 64rem the navigation rail is a horizontal bar at the top rather than a floating
  column on the left, and the wordmark sits in the flow at the foot of the page,
  centred and cropped at the baseline. Above 64rem nothing moves.

## [0.1.1] — 2026-08-17

First batch of post-launch fixes. Every entry was reproduced and measured before being
fixed, and the measurement is in the commit that fixes it.

### Fixed

- **Playback could never get past a repeated animation.** Writing `#etat=` fired a
  `hashchange` the listener read as an incoming navigation, and the lookup returns a
  state's *first* occurrence — so a montage holding the same animation twice looped
  forever on the first one. One click in the palette was enough to trigger it.
- **Three image defects in the montage export**, none visible short of stepping through
  an MP4 frame by frame: one corrupt frame at every block joint (the eye trajectory
  jumped up to 53.4 units, now 0.6 max), the GIF opening on an eyeless ball, and a
  montage not starting on the resting animation fading in from it anyway.
- **The eyes left the silhouette on non-circular shapes.** The eye is placed by a
  pro-rata of the local body radius, which divides its margin at the edge by the same
  factor — so the capsule, triangle, cloud and teardrop pushed it through the mask.
  Five state × shape pairs let an eye out of the body, up to 14.5 units on a ball of
  radius 100; now none do.
- **A failed montage export said nothing.** The failure went to a component only
  rendered in another view, so the progress bar vanished and nothing explained why.
- **MP4 stayed selected on browsers that cannot encode it.** The option was hidden but
  the value still won, and the export failed on the spot.
- **`versMp4` leaked its encoder on failure.** Chrome caps simultaneous hardware
  encoders, so after a few failures later exports died at startup for an unrelated
  reason.
- **A forbidden `localStorage` made the page blank.** Reading the property throws a
  `SecurityError` when access is denied — blocked cookies, third-party iframe,
  enterprise policy — and that propagated out of setup. Persistence is now optional;
  the application never is.
- **A hand-edited montage could freeze the tab.** 4.65 MB of JSON, inside the storage
  budget, produced 1.5 million tick objects and a track 29 700 000 px wide.
- **A state change landing inside a fade jumped.** The blend restarted from the full
  pose of the state being left instead of the frame actually on screen: 26 to 43 px
  against the 10 to 14 px a spaced change produces.
- **Modals still slid under `prefers-reduced-motion`**, and the setting was read once at
  startup rather than followed.
- **Three popups declared `role="menu"` without the keyboard contract it promises**, so
  the Tab order did not match what was announced.

### Added

- **Continuous integration.** There was none, so a pull request checked nothing.
- **Cancelling a montage export.** Escape used to close the box while the export ran to
  completion and downloaded a file nobody was waiting for.
- **Reordering a block by keyboard** (`Alt` + arrows), the one editing gesture that had
  no keyboard route, plus arrow keys to move the playhead.
- **33 tests** (178 → 211), including the first that mounts the component to check the
  off-screen render — the export defects above were invisible to everything else.

### Changed

- `RAYON` and `DEMI_VIEWBOX` moved to `src/bot/repere.ts`. They define what the engine
  returns, so they could not stay in a `<script setup>` that exports nothing.
- `MIN_BLOCK` is derived from the longest fade in the catalogue instead of written by
  hand — it only worked because the two happened to match.

### Removed

- `StateDef.hint`: 15 hardcoded French strings nothing read, inside a type meant to
  become public.

[unreleased]: https://github.com/jeremy-prt/bloub/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/jeremy-prt/bloub/releases/tag/v0.1.1
