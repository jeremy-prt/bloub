# Per-State Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow each timeline block to have its own body color, with smooth blending during transitions and a Color section in the Animations panel.

**Architecture:** Add optional `color` field to `Block`. `BloubBot.vue` resolves the effective color from the current block (falling back to the customizer default) and blends during transitions. The engine (`src/bot/`) stays completely color-free. The Animations panel gains a Color section identical to the Customise tab's. Export passes per-block colors to the off-screen renderer.

**Tech Stack:** Vue 3.5, TypeScript strict, Tailwind 4, Vitest

## Global Constraints

- Vue 3.5 + Vite 8 + TS strict + Tailwind 4 (`@tailwindcss/vite` plugin, no `tailwind.config.js`)
- Style: 2 spaces, single quotes, **no semicolons**, comments in French
- `pnpm build` (vue-tsc --noEmit && vite build) must pass before concluding
- `pnpm test` runs vitest
- `src/bot/` has no framework and no clock — must stay color-free
- Labels use `t('...')` from `@/i18n`; ids are literal unions checked at compile time

---

### Task 1: Data Model — Add `color` to `Block`

**Files:**
- Modify: `src/bot/cycles.ts`
- Test: `src/bot/cycles.test.ts`

**Interfaces:**
- Produces: `Block.color?: string` (ColorId validated against `COLOR_BY_ID`)

- [ ] **Step 1: Add `color` to the `Block` interface**

In `src/bot/cycles.ts`, add the optional `color` field:

```ts
export interface Block {
  state: StateId
  duration: number
  /** ColorId override; absent = use customizer default. */
  color?: string
}
```

- [ ] **Step 2: Update `parseBlock` to validate `color`**

In `src/bot/cycles.ts`, update `parseBlock` to extract and validate `color`:

```ts
import { COLOR_BY_ID } from './skins'

function parseBlock(raw: unknown): Block | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { state, duration, color } = raw as { state?: unknown; duration?: unknown; color?: unknown }
  if (typeof state !== 'string' || !SEQUENCE.includes(state as StateId)) return null
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null
  const block: Block = { state: state as StateId, duration: clampDuration(state as StateId, duration) }
  if (typeof color === 'string' && COLOR_BY_ID.has(color)) {
    block.color = color
  }
  return block
}
```

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `pnpm test src/bot/cycles.test.ts`
Expected: All existing tests pass (backward-compatible change)

- [ ] **Step 4: Add tests for `color` in `parseBlock`**

In `src/bot/cycles.test.ts`, add tests inside the `relecture du stockage` describe block:

```ts
it('accepte un bloc avec une couleur valide', () => {
  const raw = '[{"id":"c1","name":"A","blocks":[{"state":"idle","duration":2,"color":"bleu"}]}]'
  const cycle = parseCycles(raw)[0]!
  expect(cycle!.blocks[0]!.color).toBe('bleu')
})

it('jette une couleur inconnue', () => {
  const raw = '[{"id":"c1","name":"A","blocks":[{"state":"idle","duration":2,"color":"inconnue"}]}]'
  const cycle = parseCycles(raw)[0]!
  expect(Object.keys(cycle!.blocks[0]!)).toEqual(['state', 'duration'])
})

it('garde le champ color dans le modele', () => {
  const raw = '[{"id":"defaut","name":"M","blocks":[{"state":"idle","duration":2,"color":"rouge","vitesse":3}]}]'
  const cycle = parseCycles(raw)[0]!
  expect(Object.keys(cycle!.blocks[0]!).sort()).toEqual(['color', 'duration', 'state'])
})
```

- [ ] **Step 5: Run tests to verify new tests pass**

Run: `pnpm test src/bot/cycles.test.ts`
Expected: All tests pass including the new color tests

- [ ] **Step 6: Commit**

```bash
git add src/bot/cycles.ts src/bot/cycles.test.ts
git commit -m "feat: add optional color field to Block"
```

---

### Task 2: i18n — Add new keys for Animations panel

**Files:**
- Modify: `src/i18n/locales/fr.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh.ts`

**Interfaces:**
- Produces: `panel.colorDefault`, `panel.colorNone` in all three locales

- [ ] **Step 1: Add keys to `fr.ts`**

In `src/i18n/locales/fr.ts`, add to the `panel` section:

```ts
panel: {
  animations: 'Animation',
  shape: 'Forme',
  expression: 'Expression',
  color: 'Couleur',
  colorDefault: 'Par défaut',
  colorNone: 'Sélectionnez un bloc pour changer sa couleur'
},
```

- [ ] **Step 2: Add keys to `en.ts`**

In `src/i18n/locales/en.ts`, add to the `panel` section:

```ts
panel: {
  animations: 'Animation',
  shape: 'Shape',
  expression: 'Expression',
  color: 'Colour',
  colorDefault: 'Default',
  colorNone: 'Select a block to change its colour'
},
```

- [ ] **Step 3: Add keys to `zh.ts`**

In `src/i18n/locales/zh.ts`, add to the `panel` section:

```ts
panel: {
  animations: '动画',
  shape: '形状',
  expression: '表情',
  color: '颜色',
  colorDefault: '默认',
  colorNone: '选择一个区块以更改其颜色'
},
```

- [ ] **Step 4: Verify compilation**

Run: `pnpm build`
Expected: `vue-tsc` passes — all three locales have matching keys

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/fr.ts src/i18n/locales/en.ts src/i18n/locales/zh.ts
git commit -m "feat: add i18n keys for block color UI"
```

---

### Task 3: Color Resolution & Blending in `BloubBot.vue`

**Files:**
- Modify: `src/components/BloubBot.vue`

**Interfaces:**
- Consumes: `Block.color` (from Task 1)
- Produces: `ink` computed that resolves per-block color and blends during transitions

- [ ] **Step 1: Add `blockColor` computed and update `ink`**

In `src/components/BloubBot.vue`, replace the `ink` computed and add helper state:

```ts
import { COLOR_BY_ID, DEFAULT_COLOR, mixHex } from '@/bot/skins'

// ... existing code ...

const shapeRadii = computed(() => SHAPE_BY_ID.get(props.shape)?.radii ?? null)
const expression = computed(() => EXPRESSION_BY_ID.get(props.expression) ?? null)

/**
 * Couleur du bloc courant : override du bloc, ou defaut du personnalisateur.
 */
const blockColor = computed(() => {
  const b = props.cycle[block.value]
  return b?.color ?? props.color
})

/**
 * Couleur du bloc precedent, pour le fondu pendant les transitions.
 */
const prevBlockColor = ref<string | null>(null)

/**
 * Encre résolue : pendant un fondu entre deux blocs de couleurs differentes,
 * on interpole avec la meme courbe que la forme.
 */
const ink = computed(() => {
  const cur = COLOR_BY_ID.get(blockColor.value)?.hex ?? '#0a0a0c'
  if (!prevBlockColor.value) return cur
  const prev = COLOR_BY_ID.get(prevBlockColor.value)?.hex ?? '#0a0a0c'
  if (prev === cur) return cur
  // Le fondu est gere par un watcher ci-dessous, on rend la couleur cible ici
  return cur
})
```

- [ ] **Step 2: Add color blending watcher**

Add a watcher that tracks block changes and blends colors:

```ts
/**
 * Fondu de couleur entre deux blocs : meme courbe que la forme (easeOutQuint).
 * La duree du fondu est le morph du bloc cible.
 */
let colorClock = 0
let colorFrom = ''
let colorTo = ''
let colorBlendT = 1

watch(block, (now, before) => {
  if (now === before) return
  const curBlock = props.cycle[now]
  const prevBlock = before !== undefined ? props.cycle[before] : null
  const curColorId = curBlock?.color ?? props.color
  const prevColorId = prevBlock?.color ?? props.color
  const curHex = COLOR_BY_ID.get(curColorId)?.hex ?? '#0a0a0c'
  const prevHex = COLOR_BY_ID.get(prevColorId)?.hex ?? '#0a0a0c'
  if (curHex === prevHex) {
    prevBlockColor.value = null
    return
  }
  colorFrom = prevHex
  colorTo = curHex
  colorBlendT = 0
  prevBlockColor.value = curColorId
})
```

- [ ] **Step 3: Update the `ink` computed to use blending**

Refine the `ink` computed to incorporate the blend:

```ts
const ink = computed(() => {
  const target = COLOR_BY_ID.get(blockColor.value)?.hex ?? '#0a0a0c'
  if (colorBlendT >= 1 || !prevBlockColor.value) return target
  const from = COLOR_BY_ID.get(prevBlockColor.value)?.hex ?? '#0a0a0c'
  return mixHex(from, target, easings.easeOutQuint(clamp(colorBlendT)))
})
```

- [ ] **Step 4: Advance the blend in the tick function**

In the `tick` function, advance `colorBlendT`:

```ts
function tick(ms: number) {
  // ... existing code ...
  if (colorBlendT < 1) {
    const curBlock = props.cycle[block.value]
    const morph = curBlock ? (STATE_BY_ID.get(curBlock.state)?.morph ?? 0.45) : 0.45
    colorBlendT = Math.min(1, colorBlendT + dt / morph)
  }
  // ... rest of tick ...
}
```

- [ ] **Step 5: Run build to verify no type errors**

Run: `pnpm build`
Expected: `vue-tsc` passes

- [ ] **Step 6: Commit**

```bash
git add src/components/BloubBot.vue
git commit -m "feat: per-block color resolution with blend in BloubBot"
```

---

### Task 4: Timeline — Color dots on block cards

**Files:**
- Modify: `src/components/TimelineTrack.vue`

**Interfaces:**
- Consumes: `Block.color` (from Task 1)

- [ ] **Step 1: Add color dot to block cards**

In `src/components/TimelineTrack.vue`, add a color dot inside each block's `<button>`, after the duration label. The dot shows the block's color if set:

```vue
<!-- Inside the block button, after the duration span -->
<span
  v-if="b.color && width(i) > 50"
  class="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-black/10 ring-inset"
  :style="{ background: COLOR_BY_ID.get(b.color)?.hex ?? '#0a0a0c' }"
  aria-hidden="true"
/>
```

- [ ] **Step 2: Import `COLOR_BY_ID`**

Add the import at the top of `TimelineTrack.vue`:

```ts
import { COLOR_BY_ID } from '@/bot/skins'
```

- [ ] **Step 3: Add `relative` positioning to block buttons**

The block buttons need `relative` positioning for the dot. Check if they already have it — the existing `group relative` classes on the `<li>` should suffice since the dot is inside the `<button>` which is a child.

- [ ] **Step 4: Run build to verify**

Run: `pnpm build`
Expected: Passes

- [ ] **Step 5: Commit**

```bash
git add src/components/TimelineTrack.vue
git commit -m "feat: color dots on timeline block cards"
```

---

### Task 5: Animations Panel — Color section

**Files:**
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `Block.color`, `COLOR_BY_ID`, `COLORS` (from `skins.ts`)
- Produces: Ability to set/clear color on the selected block

- [ ] **Step 1: Add computed for selected block's color**

In `App.vue`, add a computed that reads/writes the selected block's color:

```ts
import { COLORS, COLOR_BY_ID } from '@/bot/skins'

// Couleur du bloc selectionne dans la piste
const selectedBlockColor = computed({
  get() {
    const b = cycle.value.blocks[block.value]
    return b?.color ?? null
  },
  set(colorId: string | null) {
    const blocks = cycle.value.blocks.map((b, i) =>
      i === block.value ? { ...b, color: colorId ?? undefined } : b
    )
    cycles.value = cycles.value.map((c) =>
      c.id === cycle.value.id ? { ...c, blocks } : c
    )
  }
})
```

- [ ] **Step 2: Add Color section to Animations panel in template**

In the `App.vue` template, inside the right-side panel (`<template v-if="view === 'animations'">`), add below the animation palette:

```vue
<!-- After the animation palette grid -->
<h2 class="mt-5 text-sm font-semibold">{{ t('panel.color') }}</h2>
<div class="mt-2 grid grid-cols-6 gap-1.5">
  <button
    v-for="c in COLORS"
    :key="c.id"
    type="button"
    class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
    :class="
      selectedBlockColor === c.id
        ? 'border-[var(--ink)]'
        : 'border-transparent hover:border-[var(--line)]'
    "
    :aria-label="t(`colors.${c.id}`)"
    :aria-pressed="selectedBlockColor === c.id"
    @click="selectedBlockColor = c.id"
  >
    <span
      class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
      :style="{ background: c.hex }"
    />
  </button>
</div>
<button
  type="button"
  class="mt-2 cursor-pointer text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]"
  @click="selectedBlockColor = null"
>
  {{ t('panel.colorDefault') }}
</button>
```

- [ ] **Step 3: Add disabled state when no block is selected**

When no block is focused during playback, disable the color section:

```vue
<div :class="avancementCycle !== null && 'opacity-50 pointer-events-none'">
  <!-- color section here -->
</div>
```

Actually, the block is always defined (the timeline has at least one block), so the color section is always actionable. The "no block selected" state from the spec doesn't apply here since the timeline always has a cursor. Remove this complexity.

- [ ] **Step 4: Run build to verify**

Run: `pnpm build`
Expected: Passes

- [ ] **Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: Color section in Animations panel"
```

---

### Task 6: Export — Pass per-block colors to off-screen renderer

**Files:**
- Modify: `src/ui/capture.ts`
- Modify: `src/App.vue` (export function)

**Interfaces:**
- Consumes: `Block.color` (from Task 1)
- Produces: `ReglagesBot.blockColors` map passed to `ouvreCycle`

- [ ] **Step 1: Update `ReglagesBot` interface**

In `src/ui/capture.ts`, add `blockColors` to `ReglagesBot`:

```ts
export interface ReglagesBot {
  shape: string
  color: string
  expression: string
  /** Block index → ColorId override, for cycle export with per-block colors. */
  blockColors?: Record<number, string>
}
```

- [ ] **Step 2: Pass `blockColors` through `ouvreCycle`**

In `src/ui/capture.ts`, update `ouvreCycle` to pass `blockColors` to the off-screen `BloubBot`:

```ts
export async function ouvreCycle(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  paper?: string
): Promise<LecteurHorsEcran> {
  // ... existing setup ...

  // Build the cycle with per-block color overrides applied
  const blocsAvecCouleur = blocs.map((b, i) => ({
    ...b,
    color: reglages.blockColors?.[i] ?? b.color
  }))

  const bot = ref<{ rendAt: (t: number) => void } | null>(null)
  const app = createApp({
    render: () =>
      h(BloubBot, {
        ...reglages,
        size: taille,
        cycle: blocsAvecCouleur,
        state: blocs[0]?.state ?? 'idle',
        frozenAt: 0,
        ref: bot,
        ...(paper ? { paper } : {})
      })
  })
  // ... rest unchanged ...
}
```

- [ ] **Step 3: Update `App.vue` export to build `blockColors`**

In `App.vue`, update `exporteCycle` to build the `blockColors` map:

```ts
async function exporteCycle() {
  // ... existing code ...
  const blocs = cycle.value.blocks
  // Build blockColors map from blocks that have overrides
  const blockColors: Record<number, string> = {}
  blocs.forEach((b, i) => {
    if (b.color) blockColors[i] = b.color
  })
  const reglages = {
    shape: shape.value,
    color: color.value,
    expression: expression.value,
    blockColors: Object.keys(blockColors).length ? blockColors : undefined
  }
  // ... rest of export uses reglages ...
}
```

- [ ] **Step 4: Run build to verify**

Run: `pnpm build`
Expected: Passes

- [ ] **Step 5: Run tests**

Run: `pnpm test src/ui/capture.test.ts`
Expected: Existing tests pass (no regression)

- [ ] **Step 6: Commit**

```bash
git add src/ui/capture.ts src/App.vue
git commit -m "feat: pass per-block colors through cycle export"
```

---

### Task 7: File naming for multi-color exports

**Files:**
- Modify: `src/ui/export.ts`

**Interfaces:**
- Consumes: `ReglagesBot.blockColors`

- [ ] **Step 1: Update `nomFichier` to handle multi-color**

In `src/ui/export.ts`, the `nomFichier` function already takes a `couleur` parameter. Update the caller in `App.vue` to pass `"multi"` when block colors are present:

In `App.vue`, update the filename generation in `exporteCycle`:

```ts
const hasMultipleColors = Object.keys(blockColors).length > 0
const couleurNom = hasMultipleColors ? 'multi' : color.value
telecharge(fichier, nomFichier(nomDeCycle(cycle.value), '', '', mp4 ? 'mp4' : 'gif').replace(/bloub-[^-]+-/, `bloub-${couleurNom}-`))
```

Actually, simpler: just update the `nomFichier` call to include the color:

```ts
const couleurNom = hasMultipleColors ? 'multi' : color.value
const baseName = nomFichier(nomDeCycle(cycle.value), '', '', '')
// Replace the color component
```

Wait, `nomFichier` takes `(forme, expression, couleur, extension, suffixe)`. For cycle export, the first two are empty. Let me just pass the color:

```ts
const couleurNom = hasMultipleColors ? 'multi' : color.value
telecharge(fichier, nomFichier(nomDeCycle(cycle.value), '', couleurNom, mp4 ? 'mp4' : 'gif'))
```

But `nomFichier` currently doesn't handle empty strings well for the first two params. Let me check... Actually it does — the `filter(Boolean)` removes empty strings. So `nomFichier('cycle-par-defaut', '', 'multi', 'mp4')` would produce `bloub-cycle-par-defaut-multi.mp4`. That works.

- [ ] **Step 2: Run build to verify**

Run: `pnpm build`
Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat: multi-color filename for cycle exports"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: `vue-tsc` and `vite build` both pass

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev`
- Open the app, go to Animations tab
- Add a few blocks to the timeline
- Select a block, pick a color in the Color section
- Verify the block shows a color dot
- Play the cycle, verify colors blend during transitions
- Export as MP4, verify the export has the correct colors

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "feat: per-state colors complete"
```
