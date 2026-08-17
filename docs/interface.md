# Interface

## The icons come from a library, not from a pencil

The paths in `SideRail.vue` and `Timeline.vue` are copied verbatim from Iconify
packages (Solar, plus Remix for the palette). No dependency is installed, so
`package.json` doesn't mention it, and the "everything is measured" rule does
**not** apply here.

To add or change one, take the `<symbol>` body from `@iconify-json/<package>`.
Don't redraw by hand (tried, rejected) and don't "re-centre" their coordinates.

## Truncating is `tronque`, not `truncate`

The in-house utility (`styles.css`) cuts at the word and butts the ellipsis against
the text; `truncate` cuts mid-word and leaves a space before the dots when the cut
falls between two words.

## The Tailwind reset breaks top-layer elements

It sets `margin: 0` everywhere, and it's the auto margin that centres a `<dialog>`
as a modal: without `m-auto` the box sticks to the top left. Same family of trap for
a `popover`, whose default styles set `inset: 0`: any positioning must reset the
sides it doesn't use to `auto`, otherwise `top: 0` wins.

Third one, and it is not about the reset: **don't nest a modal `<dialog>` under an
ancestor that can carry `inert`.** Being promoted to the top layer does not exempt it:
`inert` applies to the whole subtree, so the box renders and cannot be used. `GifDialog`
is opened by the export bar but sits *outside* it for exactly this reason, since the bar
goes `inert` while it is hidden.

## The scene is a three-column grid, and that's what moves the avatar

`[left panel] [avatar] [right panel]`: only one panel column has a width at a time,
and it's the **interpolation of the tracks** that slides the avatar. Written in
`styles.css` rather than in utilities because both states need to be literal values
for the transition to have something to interpolate. Don't try `order` or
`flex-direction`, they don't animate.

**Unmounting a panel does not remove its track**: the grid keeps its 20rem and the
avatar stays centred 180 px too far left. Hence `.scene--seule`, which cancels both
columns. The arrival and the preview both use it, so don't restrict it to one of
them.

**A zero-width column still contributes its `column-gap`.** Outside the settings the
left track is `0`, but the gutter after it is not, so the avatar column starts at
**4.5rem** (2rem of scene margin + 2.5rem of gutter), not at 2rem. That is why
anything pinned to the window and meant to line up with the avatar (the montage bar,
the export bar) uses `left: 4.5rem` as the counterpart of `right: 24.5rem`
(20 + 2.5 + 2). Aiming at the scene's padding instead leaves it 20 px off centre,
which is exactly enough to see under the ball.

## The side rail floats and reserves nothing

It is `fixed` and vertically centred on the window. The scene deliberately keeps **no**
padding for it: reserving a column's worth of space pushed the avatar right, and the
rail is supposed to sit over the page, not beside it. The only content that reaches far
enough left to pass under it is the settings panel, so that panel carries its own
`lg:pl-14`. Don't move the clearance back onto the scene.

## The avatar's `transition` is outside the width query, its positions are inside

Bringing them together looks tidier and breaks two things: the arrival's fade-in
applies at every size, and, more importantly, a `transition` redeclared in the
block below **evicts opacity**. A property absent from the list stops transitioning
altogether, so the ball would appear all at once.

## Horizontal clipping is on `#app`, not on `body`

The body's `overflow` is **propagated to the viewport** when the root is `visible`,
so putting it there clips nothing. And `clip` rather than `hidden`, on the x axis
only: `hidden` would make it a scroll container, which would force `overflow-y` to
follow and cut off the bottom of the customiser in a short window.

## On a large screen the page doesn't scroll, the panels do

`#app` clips both axes past 64rem and the panels take `overflow-y: auto`. The trap
that cost an iteration: an **automatic** grid track takes its content's height and
ignores the container's ceiling, so the panel got clipped without having anything to
scroll. Hence `grid-template-rows: minmax(0, 1fr)` on the scene. that's what makes
the height definite and arms `overflow-y`.

## Room for the timeline is reserved in the Animations view only

Reserved in every view (a `padding-bottom` on the scene), it took 236 px off the
right-hand panel in favour of emptiness that nothing filled: the customiser scrolled
under a third of a blank screen.

What that reservation *also* held (the avatar and the settings panel, which must
not re-centre when you switch tabs) is carried by those two columns themselves, in
the form of the same band height (`100dvh - 3rem - var(--timeline)`). That's why the
settings panel is `self-start` plus internal centring rather than `self-center`:
centring on the column would drop it a hundred pixels the moment the column ran to
the bottom.

## The big footer word is `absolute`, not `fixed`

`#app` is exactly the window's height, so the bottom is the same, but a fixed
element is *out* of the document and doesn't follow the rubber-band when you try to
scroll a page that doesn't scroll. As `absolute` it goes along with the gesture.

Its size is computed on the space actually available
(`calc((100vw - 7rem) / 3.05)`, 3.05 being the measured width of the word in ems):
in `vw` alone its last character ended up off screen.

## The URL describes the player, not the views

`#etat=` is only written from the Animations view. Writing it elsewhere fired a
`hashchange` that put the playhead back on the indices of the user's montage, while
the settings view plays its own: the player stayed stuck on its entry state.

Inside the view, the same `hashchange` had a second, worse effect. `locate()` looks
the state up with a `findIndex`, so it returns its **first** occurrence. A montage
with the same state twice — one click in the right-hand palette is enough — could
therefore never get past the second one: reaching it wrote `#etat=idle`, the
resulting `hashchange` read as an incoming navigation, and the playhead jumped back
to the first `idle`. Pausing on the second occurrence did the same, through `&stop`.

Hence `ecritParNous` in `App.vue`: the fragment we just wrote is remembered and its
`hashchange` is ignored. It is **consumed** on that first read rather than kept —
one write fires at most one event, and a browser Back to that same state later is a
real navigation that must still move the playhead.

## Every editing gesture has a keyboard route

Drag-and-drop had no equivalent, so a block could be added, removed and resized — the
resize handle already took arrow keys — but never **reordered**, and precise seeking existed
only on the ruler, pointer-only. It was the one gesture in the editor that was unreachable.

`Alt` + left/right moves the focused card; bare arrows move the playhead by `STEP`. `Alt`
rather than bare arrows for the move, because a card is a button inside a list and arrows
there are expected to navigate. **The focus follows the card being moved** — otherwise the
next press pushes a different one — which means waiting a tick, since the list is rebuilt
and the destination button does not exist yet.
