# Per-State Colors for Timeline Blocks

## Summary

Allow each block in the timeline to have its own body color, overriding the
customizer's default. Colors blend smoothly during state transitions. The
 Animations panel gains a Color section to set the selected block's color.

## Motivation

Currently the bot has a single body color chosen in the Customise tab. All
animations in a cycle share that color. Users want visual variety: a red orbit,
a blue burst, a green idle — each block independently coloured.

## Design

### 1. Data Model

**`Block` in `src/bot/cycles.ts`** gains an optional `color` field:

```ts
export interface Block {
  state: StateId
  duration: number
  /** ColorId override; absent = use customizer default. */
  color?: string
}
```

- `color` is a `ColorId` string validated against `COLOR_BY_ID`
- `makeBlock` does NOT set a color — new blocks inherit the default
- `parseBlock` validates `color` if present; invalid values are silently dropped
- Existing cycles without the field parse identically to today (backward-compatible)

### 2. Color Resolution & Blending

**In `BloubBot.vue`:**

The `ink` computed becomes time-aware during playback:

```ts
const blockColor = computed(() => {
  const b = props.cycle[block.value]
  return b?.color ?? props.color  // block override or customizer default
})
```

During a state transition (when `elapsed < currentBlock.morph`), `ink`
interpolates between the outgoing block's color and the incoming block's color
using `easeOutQuint` — the same curve as shape blending.

**Key invariant:** `src/bot/` remains completely color-free. The engine is a
pure function of time with no color state. All color resolution happens in
`BloubBot.vue`.

### 3. Animations Panel UI

**Right-side panel when Animations tab is active** (`App.vue`):

Currently shows only the animation palette (grid of state tiles). Add a
**Color section** below it, identical in layout to the Customise tab's Color
section:

```
[Animation palette - existing]

[Color section - new]
  Section header: "Colour" (t('panel.color'))
  12-color grid (same as Customise tab)
  "Default" button to remove override
```

**Interaction:**

1. Select a block in the timeline (click or keyboard)
2. The Color section reflects that block's current color
   - If the block has a color override → show that color selected
   - If no override → show the customizer's default color selected
3. Click a color → sets that block's color override
4. Click "Default" → removes the override (block reverts to customizer color)

**No block selected:** When no block is focused (e.g., during playback without
user interaction), the Color section is disabled (greyed out) with a hint text
like "Select a block to change its colour". This avoids confusion about which
block a colour change would apply to.

**Block visual feedback:**

- Blocks with a color override show a small 8px color dot at the bottom-right
  of their card — purely visual, not interactive
- Blocks without an override show no dot
- The dot is hidden on very small cards (width < 50px)

**Adding blocks:**

When clicking an animation tile to add a block to the timeline, the new block
inherits whatever color is currently shown in the Color section. This means you
can set a color first, then add multiple blocks of that colour.

### 4. Export Path

**Cycle export (MP4/GIF):**

`ReglagesBot` in `src/ui/capture.ts` gains:

```ts
export interface ReglagesBot {
  shape: string
  color: string
  expression: string
  blockColors?: Map<number, string>  // block index → ColorId
}
```

`ouvreCycle` passes `blockColors` to the off-screen `BloubBot`, which uses the
same resolution logic: current block's color from the map, falling back to the
default.

**Still exports (PNG, SVG, animated SVG):**

No change. These export the current avatar state using the customizer color.

**File naming:**

`nomFichier` continues to include the color. For cycle exports with per-block
colors, the filename uses "multi" as the color component.

### 5. Storage & Backward Compatibility

**localStorage:** Existing cycles without `color` fields parse identically.
New/edited blocks optionally carry `"color": "bleu"`. No migration needed.

**Tests:**

- `cycles.test.ts`: `parseBlock` with and without `color`, invalid `color` values
- `capture.test.ts`: Cycle export with per-block colors renders correctly
- `skins.test.ts`: No changes (color is not in the engine)

## New i18n Keys

Two new keys in each locale (`en.ts`, `fr.ts`, `zh.ts`):

- `panel.colorDefault`: "Default" / "Par défaut" / "默认" — button to remove color override
- `panel.colorNone`: "Select a block to change its colour" / "Sélectionnez un bloc" / "选择一个区块" — hint when no block is selected

## Files Changed

| File | Change |
|------|--------|
| `src/bot/cycles.ts` | `Block` gains `color?`, `parseBlock` validates it |
| `src/components/BloubBot.vue` | `blockColor` computed, `ink` blends during transitions |
| `src/components/TimelineTrack.vue` | Color dot on block cards (visual only) |
| `src/components/Customizer.vue` | Extract color grid into shared component (or duplicate) |
| `src/App.vue` | Color section in Animations panel, pass `blockColors` to export |
| `src/ui/capture.ts` | `ReglagesBot` gains `blockColors`, `ouvreCycle` passes it |
| `src/i18n/locales/*.ts` | Labels for "Default" option and "no block selected" hint |

## What Does NOT Change

- `src/bot/engine.ts` — no color awareness
- `src/bot/skins.ts` — same 12 colors, same palette
- `src/bot/decor.ts` — arcs/rings use their own color wheel
- `src/bot/states.ts` — states declare geometry, not color
