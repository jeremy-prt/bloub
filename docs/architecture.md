# Architecture

## The engine has no framework and no clock

`engine.sample(t)` is a pure function of time. That is what makes the `frozenAt`
prop, the frozen state board and the DOM-less tests possible.

So `src/bot/` must not gain internal state that depends on real time, nor
`Date.now()`, nor a Vue import. Vue code shared between components (composables,
display settings) goes in `src/ui/` instead.

**A state change landing inside a fade blends from the frozen frame.** The engine keeps
only one slot of history, so the origin of the new blend used to become the *full* pose of
the state being left, rather than the partly-blended frame that was actually on screen —
a jump of 26 to 43 px against the 10 to 14 px a spaced change produces. `setState` now
freezes the composite pose and blends from it, which is continuous however many changes
are chained.

**Only when a fade is in progress.** Freezing on every change would stop the outgoing
state's own animation dead for the whole fade — `alert`'s travelling "!" would halt
mid-course — and there is nothing to fix outside a fade, where the state being left *is*
the displayed frame. Montage playback, whose blocks last at least the longest fade, never
freezes anything and renders byte for byte what it did before: verified over 1921 frames
of the default cycle, the 15-state board, and a re-read of an arbitrary date.

**`sample()` must not mutate either.** Purging a "stale" previous state during
playback looks like an innocent optimisation and makes the engine non-replayable:
re-reading a date from before the end of a fade would no longer find it. This
already went wrong once, on the shape morph, and there is a dedicated test for it
(`engine.test.ts`, "reste une fonction pure du temps pendant un morph de forme").

## The montage holds or cuts, it never scales time

`cycles.ts` stretches a block by letting the state run longer (looping states do
extra turns, the others hold their final pose) and shortens it by cutting. It
never multiplies local time by a speed factor, which would be tempting and would
break every measured duration at once.

Hence two floors:

- `MIN_BLOCK`, **derived** from the longest `morph` in the catalogue (`orbit`, 0.6 s),
  not written by hand — it used to be, and it only worked because 0.6 happened to be
  that maximum.
  It no longer exists to prevent a jump: a state change landing *inside* a fade now
  blends from the frozen composite pose (see below), so it is continuous whatever the
  block length. What the floor still buys is readability — a track of tenth-of-a-second
  cards can't be edited — and a fade that has room to be seen.
- `StateDef.minDuration`: the date at which the animation resolves, read off the
  constants in that state's `pose()`. Worth filling in for any new narrative
  state.

## Every silhouette shares the same angular sampling

All profiles are sampled at the same angles (`PROFILE_SAMPLES`, 64), so any two
shapes have points that correspond one to one and a transition reduces to a linear
interpolation of radii. That is why there is no path-morphing library here.

Any new shape has to go through a radial profile, or through `profileFromPolygon`
if it isn't expressible as `r(theta)`.

## Two sources of shapes, not to be mixed

`profiles.ts` is generated from the video and drives the animated states.
`skins.ts` holds the customiser's shapes, built analytically. A shape the user
picks only replaces the body on states flagged `baseBody`: `idle`, `wink`,
`wide`, `notify` and `swirl`. Everywhere else the silhouette *is* the animation
and must not be overwritten.

## The eyes are holes in a `<mask>`

Not white shapes laid on top. That is what makes them clip themselves against the
silhouette when they slide towards the edge, with no cropping code. The
notification pastille's notch uses the same mask.

Because a hole shows whatever is drawn behind it, and the back half of the rings
and the burst particles *are* drawn behind the body to be occluded by it, the body
is backed by an opaque path in the page's `paper` colour. Without it, a ring
passing behind the ball reappears inside the eyes.

## Anything sitting "on" the body must follow its real radius

The eyes live on a sphere of radius 1; on a non-circular shape they leave the
silhouette and the mask cuts them. Hence `radiusAtAngle`, defined in `shape.ts`,
applied by `engine.ts` to the eyes and to the notification pastille. Any new
element anchored to the outline needs the same treatment.

That pro-rata places the eye's **centre** correctly, and that is not enough: the eye
has a size, and the margin left in front of the edge gets multiplied by the same
pro-rata. A shape that is narrow in the eye's direction therefore pushed it against
the edge until the mask opened it outwards — the capsule, the triangle, the cloud and
the teardrop all did, 55 shape × expression × state combinations out of 680, up to
11.6 units on a ball of radius 100.

So a **common offset** is added to both eyes, only when a customiser shape has replaced
the body. It is a translation and nothing else, hence an isometry: spacing, sizes and
tilts are all preserved to the pixel. The face simply sits a little lower on a body that
has no room up there — the gesture you would make by hand.

### The offset is a table, not a solver

This is the whole fix, far more than the geometry it contains. `src/bot/eyefit.ts` solves
the problem **once, at import**, and yields one entry per (shape, base-body state,
expression).

Seven versions solved it inside the render loop instead, and every one of them produced a
visible motion artefact, because everything the solver reads moves at sixty frames per
second: the resting gaze drift, the pointer, the expression mid-morph, which edge is
nearest, which eye is tightest. The names for what went wrong are established ones — an
**active-set change** when the nearest edge switches (26 units of backtracking), a
**non-smooth objective** because `min` is C0 but not C1, and **chattering** from a
per-frame feedback loop. The defect was in none of their geometries; it was in solving per
frame.

The rest of the engine does not work that way: poses are **declared** and it only
interpolates them along known curves. A tabulated offset fits that mould, and the engine
reads the table on the **boundaries** of each morph — `shapePrev`/`shape`,
`exprPrev`/`expr`, `prev`/`cur` — then interpolates with that morph's own `easeOutQuint`.
Never on the interpolated value: during a shape morph `shapeAtTime` allocates a fresh array
with no identity, and `blendExpression` already carries the target's id, so neither exists
in any table. Feeding those to the solver is exactly what made the eyes tremble.

The same approach has a name in character rigging: **pose space deformation** (Lewis,
Cordner & Fong, SIGGRAPH 2000) — a corrective authored per pose, resolved at setup and
merely looked up at runtime.

A pleasant corollary: the solver no longer has any continuity requirement, since it doesn't
run during the animation. It can therefore iterate to convergence and take the worst case
over everything that varies — the gaze drift included, whose analytic bounds it covers.
A per-frame version could afford neither.

The table is a module constant built from pure data, the same nature as the pre-drawn blink
schedule in `face.ts`: deterministic and stateless, so `engine.sample(t)` stays a pure
function of time.

### What not to try again

Each of these was written and measured, and each broke something visible:

- **Bounding per eye.** The two eyes don't aim in the same direction, so they don't retreat
  by the same amount: the pair spreads, and a distorted face reads far worse than the
  clipping being fixed.
- **Retreating radially towards the centre.** That travels a long diagonal to gain a little
  vertical room, so aiming for the circle's margin dragged both eyes to the middle where
  they merged into one blob — 283 combinations out of 680.
- **Scaling the face.** Scaling position *and* eye size keeps every ratio and is stable,
  but the eyes get visibly smaller on a flat body and a change of expression then animates
  that resize. `skins.test.ts` locks the eye's `d` against it.
- **Taking the worst eye.** `Math.min` over the two is a discrete choice: the binding eye
  changes mid-morph and the push direction flips with it, 11.6 units on the triangle whose
  two slanted edges compete for the pair.
- **One entry per shape, worst case over expressions.** Tempting, since a constant offset
  cannot move when the expression changes — but on a capsule `neutre` has its eyes high and
  needs to go down while `effraye` has them low and needs to go up. No single translation
  satisfies both, measured: 4 combinations still overflowing.
- **Giving up when nothing fits.** `wide` has 87-unit gélules and `notify` 50-unit ones; on
  a triangle or a teardrop they overflow whatever you do, and "no worse than the circle" is
  then satisfied degenerately. The rule is to aim for the least bad, never to leave a real
  overflow unimproved.

The margin aimed for is the one the **original profile** gave, not clearance: on the circle
the outer eye already grazes the edge and that is deliberate, it is what gives the volume.
Aiming for clearance left the eye exactly tangent, which shows. On the circle both outlines
are the same, so the offset is `0, 0` by construction and the reference does not move —
which is also what protects `public/favicon.svg`.

`src/bot/skins.test.ts` locks all of it. It measures back-and-forths frame by frame rather
than speed — a morph moves the eyes fast anyway, trembling is going *and coming back* — it
separates what would tremble permanently (resting drift, shape morph: no more than the
circle) from a change of expression, and it sweeps **time as well as combinations**: one
instant per combination is what let `capsule` + `frightened` through, since it was the
resting drift that carried the eye over the edge.

## States declare `ArcSpec`, the engine rasterises

Geometry in `ArcSpec` is expressed in ball-radius units; only the engine knows the
viewBox scale. Don't call `arcRender` from `states.ts`.

The rings are 3D circles in orthographic projection: the `z` component splits each
arc in two, and the back half is drawn *before* the body so the body occludes it.
That depth sort is what makes them read as orbits rather than as flat drawing.

## Springs are local and deliberate

Transitions are exponential ease-outs (the curve measured on the video) and the
body never overshoots. The one spring effect is the notification pastille's pop
(`NOTIF_POP = 1.14`). There is deliberately **no spring engine** in the project;
a new bouncing effect belongs in the state that needs it.

## The rest expression is adjustable, the states' silhouettes are not

Among the catalogue states, only `idle` carries `baseFace: true`. The other states
that show a face (wink, wide eyes, notification) have an expression measured off
the video, and that is precisely what's being reproduced. (`swirl` also carries
`baseFace`, for the reason below.)

## A tilt is only visible on an elongated eye

`EyeCfg.tilt` tilts each eye independently, which anger and sadness need since
they call for mirrored tilts. But an eye whose width/height ratio approaches 1 is
a circle: it looks the same at every angle and the tilt is invisible. This went
wrong once, so `expressions.test.ts` now enforces a two-tier rule: the ratio must
fall outside `[0.6, 1.7]` for a tilt of 20° or more, and outside `[0.8, 1.25]`
below that.

## Labels don't live in `src/bot/`

The catalogues (`states.ts`, `skins.ts`, `expressions.ts`) carry **ids**, and the
display resolves `t('states.orbit')`. The corollary is that their ids are
**literal unions** (`ShapeId`, `ColorId`, `ExpressionId`, `StateId`), not for
neatness, but because that is what makes the compiler check that every entry has
its label in all three languages. Adding a shape without its label doesn't
compile.

There used to be one exception, `StateDef.hint`: a hardcoded French string per state that
nothing read. It is gone — a label in `src/bot/` contradicts the rule above, and this
field would have gone out in a public type.

## One state is not measured: `swirl`

It's the entry transition for the settings view, chosen rather than measured (like
`--ink`). It sits deliberately **outside `SEQUENCE`** (so it appears in neither
the palette nor the board, and a test locks that) and carries both `baseBody` and
`baseFace`, which is what lets it morph from the user's chosen shape towards the
ball and lets gaze tracking apply from its very first frame.

## `Look` aims in absolute terms, and the engine does the mixing

`yaw` and `pitch` replace the pose's own as `mix` rises, and that mix has to be
done by the engine because only it knows the pose *at instant t*. A caller
compensating for the expression's orientation would read its **arrival** value
while the morph was still running, and the eyes would jump on every mood change.

It also has to be absolute on **both** axes. In relative terms the eye height
followed each expression's own, and "neutral" looks about 30° higher than the
others, so the eyes dropped all at once on the first mood change. What
distinguishes a mood during tracking is the **shape** of its eyes, not where it
looks.

`spin` is a turn taken *on the way*: free on a sphere, and with no effect on the
destination since -360° is the same angle as 0.

**`mix` and `wander` are not the same thing.** `mix` says how much the outside
world commands the direction; `wander` is what remains of automatic drift. When
the pointer moves, the drift must die out: added together, the bot would look
like it was hunting for the cursor without ever holding it. But with **no** pointer
(arriving by keyboard, by touch, or the mouse having left the window) the head must
stay turned *and* keep living. Conflating them froze the gaze the moment the view
opened. So drift is added **after** the mix, otherwise the target would cancel it
along with the pose.

**`setLook` refuses a non-finite target.** The engine keeps the last one: a `NaN`
set even once takes up residence and the bot never rests again. This happened for
real: a `getBoundingClientRect` on a zero-sized box (hidden browser pane) gives
`0 / 0` in the caller. The caller is fixed, but the engine shouldn't depend on its
callers being careful.

## Colours: two blacks that don't move together

`--ink` (`styles.css`) is the **interface** colour, a night blue, chosen, not
measured. The video's black is the bot's, in `skins.ts` (`encre`, `#0a0a0c`).
Retouching one doesn't touch the other.
