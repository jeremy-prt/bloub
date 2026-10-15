# The arrival sequence

Played when you land on the site (`src/ui/intro.ts`, pure and tested): the ball
appears alone in the centre, **its eyes sweep horizontally once**,
then settle back into their chosen pose while it slides into place and the
interface appears around it.

## The montage plays only `idle`, and that's the expensive lesson

Four different entrances were written and compared side by side before one was
kept. Any state other than `idle` brings **its own gaze pose**, hence an eye jump
at the change. And the blink meant to hide that isn't enough: it lasts **0.2 s**
where the entry fade lasts **0.3**: the eyes reopen part-way through and it reads
as a teleport (15 px between two frames, measured). Both durations are measured off
the video and neither gets extended. A wink was tried at length here, then dropped
for exactly this.

## So the whole entrance lives in the gaze script

Not in a chain of states. It's the only mechanism in the project whose duration
**we choose** (`setLook(look, now, morph)`), and therefore the only one that allows
a slow eye movement. A state fade lasts what the video measured.

## The gaze moves horizontally

The welcome script supplies the horizontal eye angle. The body and its
accessories stay still; pitch and roll stay with the chosen gaze pose.

## `intro` and `nue` are not the same moment

`intro` says the arrival montage is playing; `nue` (derived from the player's
index) says the ball is still alone on stage. It's `nue` that drives both the
settling into place and the return to the chosen shape.

## Nothing goes to `localStorage`, deliberately

What tells "coming to the site" apart from "reloading" is something the browser
already knows: `performance.getEntriesByType('navigation')[0].type`. A persistent
marker would switch the arrival off forever after a single visit: tested,
rejected, it took a private window to see it again.

## A gaze script must be primed "dated one catch-up earlier"

`engine.setLook(script(0), clock - SCRIPT_MORPH, SCRIPT_MORPH)`. Without it the
first frame comes out at the neutral gaze and the second one on the script,
**127 px** in one step for a script that starts far from the pose. The engine
returns `lookPrev` until the catch-up is consumed.

## A script ends at `mix: 0`

Where the pose commands alone. There is then never anything to release, and a
release would show up as one last slide of the eyes just when everything should be
settled.

## What a script cannot anticipate: roll

`Look` deliberately doesn't drive it: the tilted head is the bot's signature. Each
state has its own: the wink leans at +6.7° where rest leans at -13. Those degrees
would jump at a state change whatever we did, which is the closing argument for an
arrival with no state change in it.

## Where it doesn't play

Not on `#planche`, not on an `#etat=` link (that one targets the player and already
describes its playback), and not under `prefers-reduced-motion`. `#arrivee` replays
it, and **reloads the page** to do so: replaying it warm would mean tearing down and
rebuilding the whole set.
