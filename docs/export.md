# Export

The Personnaliser view's export bar. `src/ui/export.ts` is pure and tested (frame,
catalogue, filename); `src/ui/capture.ts` is the DOM layer (canvas, clipboard);
`src/components/ExportBar.vue` is presentational and only emits a format, like
`Customizer.vue`. Everything still images is dependency-free: `XMLSerializer` and a canvas
are enough. Only the **cycle video** pulls a library, and only on demand (see below).

## Nothing is reserved for the bar, and nothing should be

`--timeline` is already subtracted from the avatar column's height in **both** views
(otherwise the centred avatar would change place when switching tabs), so the band
under the ball is already empty here. Adding an `--export` variable would duplicate
a calculation that already exists.

## The bar is pinned to the WINDOW, like the montage bar

`position: fixed` with the montage bar's own `left: 4.5rem` / `right: 24.5rem`, and
it centres its content. That is what stops it moving: anchored inside the avatar
column it rode the grid's interpolation, and coming back from the settings the
closing left panel moves that column's centre by **320 px**, so the button slid
into place instead of being there. The montage bar never slides for exactly this
reason. The Personnaliser view has only one grid layout, so this position is a
constant.

Vertically it is aimed at the bottom of the avatar's **box**, not the column's: the
silhouette fills only about 65 % of its box's side (the viewBox keeps room for the
animated states' rings, absent at rest), so aiming at the column left **176 px** of
measured dead space between the ball and the button. The `min()` in the `top` calc is
**the one from `.avatar`'s `max-w`**, same box, so the bar follows it as it shrinks
on a short window instead of landing on top of it.

## It's a `transition`, not an `animation`: the main trap

An animation replays on **every mount**: on reload, and on every view change. A
transition doesn't run on an element's first computed style, so the bar is born
visible and stays quiet. That is exactly how `.panneau` works.

Corollary: the bar is **mounted during the arrival**, merely hidden (`--cachee` plus
`inert`, because an `opacity: 0` element is still clickable and focusable). Without a
start state present on screen there would be nothing to interpolate from.

## It only animates on arrival, never on a view change

The one reveal is after the intro, delayed in `App.vue` (400 ms) so the avatar reaches
its place first. Switching views does **not** fade it in: it is pinned to the window,
so it is born already in position, and an element that doesn't move has no business
announcing itself. That is the montage bar's rule too: it doesn't animate between the
settings and the animations, because it is already there.

## The live SVG is serialised, not rebuilt

This works because the bot's SVG is already self-contained: no `var(--...)`, no
Tailwind class, every shape carries its `fill` as a literal hex. Rebuilding a second
render beside it would be a second source of drawing, and it would drift.

`width`/`height` are set explicitly, because without an intrinsic size Firefox refuses to
rasterise an SVG loaded into an `<img>` and the canvas comes out empty. An uploaded
background is embedded as a `data:` URL, so it does not taint the canvas.

Measured on the output at 512²: 71.4 % transparent, 26.7 % body, 1.5 % `paper` for the
eyes, the rest antialiasing.

## The eyes export OPAQUE, in `paper`, and that's a win

A paper-coloured `<path>` sits under the body (`BloubBot.vue`), so the exported image
keeps light eyes on a dark background: real holes would make them disappear there.
Don't "fix" this into transparency. The selected background is behind the bot's opaque
paper-coloured eye openings.

## The export frame is tighter than the screen's, and shared by all shapes

±125 against ±158. Not a per-shape crop: `skins.ts` normalises radii so that "all
shapes weigh the same to the eye" (the squircle peaks at 1.15 on its diagonal), and
cropping each one separately would put them all back at the same size and break that
tuning. A test checks the frame contains **every** shape, so adding a wider one moves
the frame on its own instead of getting clipped.

## The animation is an SVG, and that is what makes it smooth

A flipbook format (WebP, GIF, APNG) is capped by its frame count. The blink lasts
0.18 s (`BLINK_DUR`), so at 20 fps it gets three or four frames and reads as a stutter.
An animated **SVG** doesn't have frames: the browser interpolates between keyframes, so
the motion is smooth at the display's refresh rate however few keyframes we emit. That is
the whole reason for this choice: an animated WebP was built first, measured, and dropped
for being both choppier and 10× heavier (167 kB against 16 kB).

**The measured idle animation is mostly in the eyes.** At rest the silhouette moves by
1.17 units on a radius of 100 over three seconds, about a pixel and a half at export
size. The optional horizontal eye sweep is captured alongside the eye and accessory
matrices. The silhouette and separate hands remain unchanged.

**The drawing is not rebuilt.** `svgAnime` takes the SVG `BloubBot` already rendered for
the first keyframe and swaps the eye and accessory transforms for animated classes.
One source of drawing, same rule as the still export.

The background can be left transparent, set to a solid color, made into a two-color gradient,
or use an uploaded PNG, JPEG or WebP photo (up to 10 MB). Gradients can run horizontally,
vertically, or diagonally. The selected background sits behind the entire character with
subtly rounded corners, and is carried by its SVG, so PNG, SVG, animated SVG, GIF and MP4
all export the same composition.
Uploaded photos remain embedded at their original resolution; raster formats render at
their normal output resolution. Settings stay in memory until the page is reloaded.

Three things that are not optional:

- **`transform-box: view-box` and `transform-origin: 0 0`.** A CSS transform on an SVG
  element rotates around its bounding-box centre, not the user-space origin, so without
  these the eye flies to the other side of the ball.
- **`animation-direction: alternate`.** The gaze drift is not periodic: the periods in
  `liveliness` are deliberately coprime so the movement never visibly repeats, so a plain
  loop would jump at the seam. Played forwards then backwards it rejoins itself exactly,
  and a blink in reverse is still a blink. This is the one thing the bitmap export could
  never have.
- **The eye holes are the only transformed shapes inside the mask.** The character
  projection lives outside the mask, so document order still identifies the eyes.

Keyframes are emitted at 30/s: a keyframe is one matrix of text, so density is nearly free,
and it follows the blink's asymmetric curve faithfully. Measured on the output: eye area
921 → 193 → 933 px across the blink, sampled every 40 ms against 33 ms keyframes, the
values fall between keyframes, which is the interpolation showing.

## One PNG size, and no GIF

1024 covers every profile-picture spec (Discord 128, X 400, GitHub 500, Slack 512) and
downscales cleanly. Offering 2048 as well made the user decide something that isn't
theirs to decide; whoever wants bigger takes the SVG, which has no size.

GIF is ruled out **for the still export** by its 1-bit transparency: a staircase edge where
PNG has 8 bits of alpha.

## The animated GIF exists only for platform reach

Discord and Slack accept a GIF as an animated avatar and an SVG nowhere, which is its whole
reason to exist. Everywhere else the animated SVG is better on every axis.

**It is the only export that asks a question**, and only because GIF alpha is one bit: the
ball's antialiased rim has to be thresholded at 50 %, which comes out as a staircase. A solid
background smooths that rim back out because it has something to blend into, at the cost of
baking the colour in. Neither choice wins everywhere, so a dialog offers both, white first
(`GifDialog.vue`, native radios so the browser gives grouping and arrow keys). The
white/transparent exterior-background choice remains available when no custom background
is selected. A custom color, gradient or photo replaces it and is shared with the MP4 cycle
export. Exporting at
320 px while an avatar displays at 40-128 px softens the transparent edge further, since the
browser's downscale re-smooths it.

**With a solid exterior background, the eyes must take its exact colour.** They are holes
filled with `paper`, so left at the site's off-white they show up as a slightly darker ring
inside a white frame. `sequenceDuBot` therefore passes the matte through as `paper`,
measured: eyes at `255,255,255` on a white background against `249,249,249` on a transparent
one.

`gifAnime` **deduces** transparency from the pixels rather than being told: flattened frames
must not declare a transparent index, and above all must not be disposed to background between
frames, which would flash the background. Transparent frames dispose to background (2),
opaque ones stay in place (1). Both cases are locked by a test.

Its LZW encoder is hand-rolled (no dependency), and it holds **the one trap of the format**:
the encoder writes its dictionary entry right after emitting a code, while the decoder only
writes its own when it reads the *next* code. The decoder is therefore permanently one entry
behind, so the encoder must widen its codes one step late: `suivant > (1 << taille)`, never
`===`. Getting that wrong desynchronises the two and every reader rejects the file, with
nothing in the structure to show why. There is a round-trip test decoding the stream back to
its exact pixels, because structural assertions cannot catch this.

The palette is exact rather than dithered: the bot uses very few distinct colours (71.4 %
transparent, 26.7 % body, 1.5 % `paper`, the rest antialiasing), so index 0 is reserved for
transparency and the rest fit. Transparent frames are the ones disposed to background
(`2 << 2`), the GIF equivalent of "do not blend": without it their transparent areas keep the
previous frame and the ball drags a trail. Opaque frames stay in place, as above. Delays are in **hundredths** of a second, which caps the useful rate,
and never below 2 since 0 and 1 are handled inconsistently by readers.

Measured on the output: 147 kB, 60 frames at 320², decoded back by Chrome with a transparent
corner and 2033 pixels changing between frames.

## The SVG is copied as TEXT, the image as a blob

`writeText` is what Figma and Illustrator paste back as editable vector; as
`image/svg+xml` it would come back flattened. And the PNG blob goes into the
`ClipboardItem` as a **promise**: Safari requires `write` to originate from the user's
gesture, and any `await` slipped in before it loses that gesture.

Copying an image is offered only where the browser can write one
(`ClipboardItem.supports`); copying the SVG goes through `writeText` and works
everywhere.


## Exporting a whole cycle is a different problem

The Personnaliser bar exports the avatar; the montage bar exports the **cycle**, and almost
none of the still-export reasoning carries over.

**The frame must be the screen's `±158`, not the tight export frame.** The margin the tight
frame removes is exactly the one holding the animated states' rings, which reach 1.4 × the
ball radius: 140, past the tight frame's 125. Nothing clamps those radii at runtime: it is
the hand-tuned `RINGS`/`SWOOSH` tables in `decor.ts` that keep them under 158. A test locks
the relationship.

**No animated SVG here.** It worked at rest only because the body was static. Over a cycle
the body path changes every frame and weighs 2.5 kB, so six hundred frames would be 1.5 MB
before counting the arcs.

**`frozenAt` does not walk the montage, and `seek` is not enough either.** `apply()` dates
the engine with `clock`, which only advances in the rAF loop and therefore stays at 0 while
frozen: every state change would register at t=0 and the cross-fades at block joints would
be wrong. Hence `rendAt(t)` on `BloubBot`: it resolves the block with `blockAt` and calls
`setState` with the block's **absolute** offset, reproducing `tick()` without a clock. Proven
by measurement: across a joint the silhouette moves 17.6 → 7.0 → 2.1 → 0.36 → 0.02 over
~0.3 s, the decay of an exponential ease-out. A broken morph would show one single jump.

**Frames are never accumulated.** A thirty-second cycle is 624 frames, 255 MB of raw pixels
if kept. The MP4 path streams frame-by-frame into the encoder (awaiting each `add` is what
applies backpressure); the GIF path renders the sequence **twice**, once to count colours and
once to encode, which is free because the render is deterministic.

**The GIF palette is chosen by frequency, not first-come.** Measured: a cycle exceeds 255
colours, so a palette filled in encounter order would gorge itself on the first frames'
antialiasing and dump every ring colour into one slot. Unseen colours resolve to the nearest
kept entry, cached so each distinct colour costs one search.

**Video is always opaque**: `VideoEncoder` refuses `alpha: 'keep'` for H.264 and VP9 alike.
MP4 is composited on white when no custom background is selected. The GIF keeps its
white/transparent choice in that case. A selected color, gradient or photo is drawn behind
the avatar in both formats.

**Resolution and frame rate are per format, and mixing them up was a real bug.** The MP4 first
inherited the GIF's 320 px / 20 fps, settings justified for the GIF by file weight, which a
video simply does not share, since it compresses motion instead of storing each frame. Measured
at 93 kbps, the export had the definition of a thumbnail: that is what made it look like a GIF.
The video is now 1024 px at 30 fps.

**The quality knob is the QUANTIZER, not the bitrate, and that is genuinely counter-intuitive.**
mediabunny's named levels (`QUALITY_HIGH` and friends) do **not** set a bitrate when the browser
can encode at a fixed quantizer, which Chrome has done since 117 for all these codecs. They
resolve to `bitrateMode: 'quantizer'`, and the bitrate the library computes only picks the AVC
level in the codec string. Captured off the real encoder: the config arrived with **no `bitrate`
field at all** and a QP of 22 on every frame. Raising a bitrate would have changed nothing.

Measured edge error against the source, on one frame of the bot: QP 22 → 3.06, QP 16 → 1.75,
QP 10 → 0.58. `video.ts` therefore passes an explicit `new Quality({ quantizer, bitrate })`; the
bitrate rides along only as a **fallback** for browsers without per-frame quantizer support.

Two dead ends, so nobody re-walks them: 4:2:0 chroma subsampling is **not** the culprit on a
black bot (grey has no chrominance to subsample) though it does bleed on a *coloured* one
(42 MAE measured on a red/green edge), and the only real 4:4:4 reachable here is AV1's High
profile, software-only. And hardware acceleration does not degrade quality at equal settings;
what it does is never expose 4:4:4.

Measured on the default cycle (31.2 s): MP4 936 frames at 1024², 5.48 MB in ~4 s; GIF 624 frames
at 320², 1.5 MB in ~16 s. Real-time recording via `MediaRecorder` would have been dependency-free
but takes the full 31.2 s, which is why the encoder won.
