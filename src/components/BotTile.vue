<script setup lang="ts">
import BloubBot from '@/components/BloubBot.vue'
import { DEFAULT_EXPRESSION } from '@/bot/expressions'
import { DEFAULT_COLOR, DEFAULT_SHAPE } from '@/bot/skins'
import type { StateId } from '@/bot/states'
import type { GlassesStyle } from '@/ui/glasses'
import type { AccessoryLayout, MouthStyle, MustacheStyle } from '@/ui/accessories'
import type { ExportBackground } from '@/ui/background'

/**
 * Vignette cliquable de la barre de droite : un bot fige, son nom dessous, une
 * bordure quand elle est retenue. Sert aux formes, aux expressions et aux
 * animations — les trois grilles doivent rester identiques a l'oeil, d'ou le
 * composant partage plutot que la meme chaine de classes recopiee.
 *
 * `frozenAt` est obligatoire : une vignette animee ferait tourner autant de
 * boucles rAF qu'il y a de cases.
 */
withDefaults(
  defineProps<{
    label: string
    selected: boolean
    frozenAt: number
    state?: StateId
    shape?: string
    color?: string
    backdrop?: ExportBackground
    expression?: string
    hands?: boolean
    glasses?: boolean
    showEyesWithGlasses?: boolean
    glassesColor?: string
    eyeColor?: string
    glassesStyle?: GlassesStyle
    glassesSize?: number
    mustache?: boolean
    mustacheColor?: string
    mustacheStyle?: MustacheStyle
    mouth?: boolean
    mouthColor?: string
    mouthStyle?: MouthStyle
    accessoryLayout?: AccessoryLayout
    size?: number
  }>(),
  {
    state: 'idle',
    shape: DEFAULT_SHAPE,
    color: DEFAULT_COLOR,
    expression: DEFAULT_EXPRESSION,
    hands: false,
    glasses: false,
    showEyesWithGlasses: false,
    glassesColor: '#202028',
    eyeColor: '#f9f9f9',
    glassesStyle: 'sun',
    glassesSize: 1,
    mustache: false,
    mustacheColor: '#75452d',
    mustacheStyle: 'classic',
    mouth: false,
    mouthColor: '#c96c73',
    mouthStyle: 'smile',
    accessoryLayout: () => ({
      glasses: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
      mustache: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
      mouth: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
    }),
    size: 60
  }
)
</script>

<template>
  <button
    type="button"
    class="flex cursor-pointer flex-col items-center rounded-xl border-2 p-1 transition"
    :class="selected ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'"
    :aria-label="label"
    :aria-pressed="selected"
  >
    <BloubBot
      :state="state"
      :size="size"
      :shape="shape"
      :color="color"
      :backdrop="backdrop"
      :expression="expression"
      :hands="hands"
      :glasses="glasses"
      :show-eyes-with-glasses="showEyesWithGlasses"
      :glasses-color="glassesColor"
      :eye-color="eyeColor"
      :glasses-style="glassesStyle"
      :glasses-size="glassesSize"
      :mustache="mustache"
      :mustache-color="mustacheColor"
      :mustache-style="mustacheStyle"
      :mouth="mouth"
      :mouth-color="mouthColor"
      :mouth-style="mouthStyle"
      :accessory-layout="accessoryLayout"
      :frozen-at="frozenAt"
    />
    <!-- 12 px : en dessous, une legende n'est plus lisible pour tout le monde -->
    <span class="text-center text-xs leading-tight text-[var(--muted)]">{{ label }}</span>
  </button>
</template>
