<script setup lang="ts">
import BotTile from '@/components/BotTile.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS, SHAPES } from '@/bot/skins'
import { nombre, t } from '@/i18n'
import { ref } from 'vue'
import type { GlassesStyle } from '@/ui/glasses'
import { EYE_COLORS, eyeColorHex, glassesLensPath, GLASSES_STYLES } from '@/ui/glasses'
import {
  MOUTH_STYLES,
  mouthPath,
  MUSTACHE_STYLES,
  mustachePath,
  type AccessoryLayout,
  type MouthStyle,
  type MustacheStyle
} from '@/ui/accessories'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const turnEyes = defineModel<boolean>('turnEyes', { required: true })
const hands = defineModel<boolean>('hands', { required: true })
const expression = defineModel<string>('expression', { required: true })
const glasses = defineModel<boolean>('glasses', { required: true })
const showEyesWithGlasses = defineModel<boolean>('showEyesWithGlasses', { required: true })
const glassesColor = defineModel<string>('glassesColor', { required: true })
const eyeColor = defineModel<string>('eyeColor', { required: true })
const glassesStyle = defineModel<GlassesStyle>('glassesStyle', { required: true })
const glassesSize = defineModel<number>('glassesSize', { required: true })
const mustache = defineModel<boolean>('mustache', { required: true })
const mustacheColor = defineModel<string>('mustacheColor', { required: true })
const mustacheStyle = defineModel<MustacheStyle>('mustacheStyle', { required: true })
const mouth = defineModel<boolean>('mouth', { required: true })
const mouthColor = defineModel<string>('mouthColor', { required: true })
const mouthStyle = defineModel<MouthStyle>('mouthStyle', { required: true })
const accessoryLayout = defineModel<AccessoryLayout>('accessoryLayout', { required: true })
const selectedAccessory = defineModel<'glasses' | 'mustache' | 'mouth' | null>(
  'selectedAccessory',
  { required: true }
)
const faceEditor = ref<'mustache' | 'mouth'>('mustache')
const selectedLens = ref<'left' | 'right'>('left')

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1

function setAccessorySize(kind: 'glasses' | 'mustache' | 'mouth', dimension: 'width' | 'height', value: number) {
  accessoryLayout.value = {
    ...accessoryLayout.value,
    [kind]: {
      ...accessoryLayout.value[kind],
      [dimension]: value
    }
  }
}

function setLensOffset(side: 'left' | 'right', axis: 'X' | 'Y', value: number) {
  const field = `${side}Lens${axis}` as const
  accessoryLayout.value = {
    ...accessoryLayout.value,
    glasses: { ...accessoryLayout.value.glasses, [field]: value }
  }
}

function setAccessoryRotation(kind: 'glasses' | 'mustache' | 'mouth', value: number) {
  accessoryLayout.value = {
    ...accessoryLayout.value,
    [kind]: { ...accessoryLayout.value[kind], rotation: value }
  }
}

function setAccessoryContour(
  kind: 'mustache' | 'mouth',
  field: 'curve' | 'roundness' | 'lowerCurve',
  value: number
) {
  accessoryLayout.value = {
    ...accessoryLayout.value,
    [kind]: { ...accessoryLayout.value[kind], [field]: value }
  }
}

function selectAccessory(kind: 'glasses' | 'mustache' | 'mouth') {
  if (kind === 'mustache' || kind === 'mouth') faceEditor.value = kind
  if (kind === 'glasses') glasses.value = true
  else {
    mustache.value = kind === 'mustache'
    mouth.value = kind === 'mouth'
  }
  selectedAccessory.value = kind
}

function removeAccessory(kind: 'glasses' | 'mustache' | 'mouth') {
  if (kind === 'glasses') glasses.value = false
  else if (kind === 'mustache') mustache.value = false
  else mouth.value = false
  if (selectedAccessory.value === kind) selectedAccessory.value = null
}

function accessoryEnabled(kind: 'glasses' | 'mustache' | 'mouth') {
  return kind === 'glasses' ? glasses.value : kind === 'mustache' ? mustache.value : mouth.value
}

</script>

<template>
  <div>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        class="flex h-9 min-w-0 items-center gap-1.5 rounded-xl border px-2 transition"
        :class="turnEyes ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'"
        :aria-label="t('panel.rotateEyes')"
        :aria-pressed="turnEyes"
        @click="turnEyes = !turnEyes"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 8a8 8 0 0 0-14.8-2L3 9m0 0V5m0 4h4m-3 7a8 8 0 0 0 14.8 2L21 15m0 0v4m0-4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7" />
        </svg>
        <span class="min-w-0 flex-1 truncate text-left text-[11px] leading-none">{{ t('panel.rotateEyes') }}</span>
        <span
          class="flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors"
          :class="turnEyes ? 'bg-[var(--ink)]' : 'bg-black/15'"
          aria-hidden="true"
        >
          <span class="h-3 w-3 rounded-full bg-white shadow-sm transition-transform" :class="turnEyes && 'translate-x-3'" />
        </span>
      </button>

      <button
        type="button"
        class="flex h-9 min-w-0 items-center gap-1.5 rounded-xl border px-2 transition"
        :class="hands ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'"
        :aria-label="t('panel.addHands')"
        :aria-pressed="hands"
        @click="hands = !hands"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 13V8a1.5 1.5 0 0 1 3 0v3-5a1.5 1.5 0 0 1 3 0v5-4a1.5 1.5 0 0 1 3 0v5-2a1.5 1.5 0 0 1 3 0v5c0 4-2.5 6-6 6h-2c-2 0-3.2-.9-4.5-2.5L4 15.8a1.7 1.7 0 0 1 2.5-2.3L9 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="min-w-0 flex-1 truncate text-left text-[11px] leading-none">{{ t('panel.addHands') }}</span>
        <span
          class="flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors"
          :class="hands ? 'bg-[var(--ink)]' : 'bg-black/15'"
          aria-hidden="true"
        >
          <span class="h-3 w-3 rounded-full bg-white shadow-sm transition-transform" :class="hands && 'translate-x-3'" />
        </span>
      </button>
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.shape') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="s in SHAPES"
        :key="s.id"
        :label="t(`shapes.${s.id}`)"
        :selected="s.id === shape"
        :shape="s.id"
        :color="color"
        :expression="expression"
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
        :frozen-at="PREVIEW_AT"
        @click="shape = s.id"
      />
    </div>

    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.expression') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="e in EXPRESSIONS"
        :key="e.id"
        :label="t(`expressions.${e.id}`)"
        :selected="e.id === expression"
        :shape="shape"
        :color="color"
        :expression="e.id"
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
        :frozen-at="PREVIEW_AT"
        @click="expression = e.id"
      />
    </div>

    <div class="mt-5 flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white/60 p-1" role="group" :aria-label="t('accessories.blockTitle')">
      <div
        v-for="item in [
          { id: 'glasses', label: 'glasses.title' },
          { id: 'mustache', label: 'accessories.mustache' },
          { id: 'mouth', label: 'accessories.mouth' }
        ] as const"
        :key="item.id"
        class="relative min-w-0 flex-1"
      >
      <button
        type="button"
        class="flex h-9 w-full items-center justify-center rounded-lg border transition"
        :class="selectedAccessory === item.id ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]'"
        :aria-label="t(item.label)"
        :title="t(item.label)"
        :aria-pressed="selectedAccessory === item.id"
        @click="selectAccessory(item.id)"
      >
        <svg v-if="item.id === 'glasses'" width="22" height="18" viewBox="0 0 48 28" fill="none" aria-hidden="true">
          <path :d="glassesLensPath('round', 16, 17, true)" transform="translate(11 14)" stroke="currentColor" stroke-width="2" />
          <path :d="glassesLensPath('round', 16, 17)" transform="translate(37 14)" stroke="currentColor" stroke-width="2" />
          <path d="M19 12q5-3 10 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <svg v-else-if="item.id === 'mustache'" width="23" height="17" viewBox="0 0 100 40" aria-hidden="true">
          <path :d="mustachePath(mustacheStyle, accessoryLayout.mustache.curve, accessoryLayout.mustache.roundness)" fill="currentColor" />
        </svg>
        <svg v-else-if="item.id === 'mouth'" width="21" height="17" viewBox="0 0 100 40" aria-hidden="true">
          <path :d="mouthPath(mouthStyle, accessoryLayout.mouth.curve, accessoryLayout.mouth.roundness)" fill="currentColor" />
        </svg>
      </button>
      <button
        v-if="accessoryEnabled(item.id)"
        type="button"
        class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[var(--ink)] text-white shadow-sm"
        :aria-label="t(item.id === 'glasses' ? 'glasses.remove' : item.id === 'mustache' ? 'accessories.removeMustache' : 'accessories.removeMouth')"
        :title="t(item.id === 'glasses' ? 'glasses.remove' : item.id === 'mustache' ? 'accessories.removeMustache' : 'accessories.removeMouth')"
        @click="removeAccessory(item.id)"
      >
        <svg class="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="m3 3 6 6m0-6L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      </div>
    </div>

    <section v-if="selectedAccessory === 'glasses'" class="mt-3 rounded-2xl border border-[var(--line)] bg-white/60 p-3">
      <div v-if="glasses && selectedAccessory === 'glasses'">
      <label class="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
        <input
          v-model="showEyesWithGlasses"
          class="accent-[var(--ink)]"
          type="checkbox"
        />
        <span>{{ t('glasses.showEyesWithGlasses') }}</span>
      </label>
      <div class="mt-2 grid grid-cols-3 gap-1.5" role="group" :aria-label="t('glasses.style')">
        <button
          v-for="style in GLASSES_STYLES"
          :key="style"
          type="button"
          class="flex h-10 items-center justify-center rounded-lg border transition"
          :class="glassesStyle === style ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]'"
          :aria-label="t(`glasses.styles.${style}`)"
          :title="t(`glasses.styles.${style}`)"
          :aria-pressed="glassesStyle === style"
          @click="glassesStyle = style"
        >
          <svg
            width="46"
            height="28"
            viewBox="0 0 48 28"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <g
              v-for="(cx, index) in [11, 37]"
              :key="cx"
              :transform="`translate(${cx} 14)`"
            >
              <path
                :d="glassesLensPath(style, 16, 17, index === 0)"
                :fill="style === 'sun' ? 'currentColor' : 'none'"
                :fill-opacity="style === 'sun' ? 0.16 : 0"
              />
              <path
                :d="`M${index === 0 ? -7.5 : 7.5} -3.4 Q${index === 0 ? -10 : 10} -4.8 ${index === 0 ? -13 : 13} -2`"
                stroke-width="1.45"
              />
              <path
                :d="`M-4.5 -5.1 Q0 -7.2 4.5 -5.1`"
                stroke-width="0.9"
                stroke-opacity="0.62"
              />
            </g>
            <path d="M19 11.4q5-3 10 0M3 10.5 1 8.5m44 2 2-2" />
          </svg>
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between gap-2">
        <ColorPicker
          v-model="eyeColor"
          variant="circle"
          :label="t('glasses.customEyeColor')"
        />
        <div class="flex min-w-0 items-center gap-1" role="group" :aria-label="t('glasses.eyeColor')">
          <button
            v-for="shade in EYE_COLORS"
            :key="shade.id"
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition"
            :class="eyeColor === shade.id || eyeColor === shade.hex ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'"
            :aria-label="t(`glasses.eyeColors.${shade.id}`)"
            :title="t(`glasses.eyeColors.${shade.id}`)"
            :aria-pressed="eyeColor === shade.id || eyeColor === shade.hex"
            @click="eyeColor = shade.hex"
          >
            <span
              class="h-4 w-4 rounded-full ring-1 ring-black/10 ring-inset"
              :style="{ background: shade.hex }"
            />
          </button>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <ColorPicker v-model="glassesColor" :label="t('glasses.color')" />
        <svg class="shrink-0 text-[var(--muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" stroke="currentColor" stroke-width="1.6" />
          <circle cx="12" cy="12" r="2.5" :fill="eyeColorHex(eyeColor)" stroke="currentColor" stroke-width="1.2" />
        </svg>
        <input
          v-model.number="glassesSize"
          class="min-w-0 flex-1 accent-[var(--ink)]"
          type="range"
          min="0.65"
          max="1.45"
          step="0.05"
          :aria-label="t('glasses.size')"
          :title="`${t('glasses.size')}: ${nombre(glassesSize, 2)}×`"
        />
      </div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <label class="flex min-w-0 items-center gap-1.5">
          <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.width') }}</span>
          <input
            class="min-w-0 flex-1 accent-[var(--ink)]"
            type="range"
            min="0.45"
            max="2.2"
            step="0.05"
            :value="accessoryLayout.glasses.width"
            :aria-label="t('accessories.glassesWidth')"
            @input="setAccessorySize('glasses', 'width', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <label class="flex min-w-0 items-center gap-1.5">
          <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.height') }}</span>
          <input
            class="min-w-0 flex-1 accent-[var(--ink)]"
            type="range"
            min="0.45"
            max="2.2"
            step="0.05"
            :value="accessoryLayout.glasses.height"
            :aria-label="t('accessories.glassesHeight')"
            @input="setAccessorySize('glasses', 'height', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
      </div>
      <label class="mt-2 flex items-center gap-2">
        <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.rotation') }}</span>
        <input
          class="min-w-0 flex-1 accent-[var(--ink)]"
          type="range"
          min="-180"
          max="180"
          step="1"
          :value="accessoryLayout.glasses.rotation"
          :aria-label="t('accessories.glassesRotation')"
          @input="setAccessoryRotation('glasses', Number(($event.target as HTMLInputElement).value))"
        />
        <span class="w-8 text-right text-[10px] text-[var(--muted)]">{{ accessoryLayout.glasses.rotation }}°</span>
      </label>
      <div class="mt-3">
        <div class="mb-2 flex gap-1" role="group" :aria-label="t('accessories.selectLens')">
          <button
            v-for="side in ['left', 'right'] as const"
            :key="side"
            type="button"
            class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[10px] transition"
            :class="selectedLens === side ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)]'"
            :aria-label="t(`accessories.${side}Lens`)"
            :aria-pressed="selectedLens === side"
            @click="selectedLens = side"
          >
            <svg width="16" height="12" viewBox="0 0 20 14" fill="none" aria-hidden="true">
              <path d="M2 7c0-2 1-4 3-4h4v8H5c-2 0-3-2-3-4Z" :fill="selectedLens === side ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" />
              <path d="M11 3h4c2 0 3 2 3 4s-1 4-3 4h-4V3Z" :fill="selectedLens === side ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" />
              <path d="M9 5h2" stroke="currentColor" stroke-width="1.2" />
            </svg>
            {{ t(`accessories.${side}Lens`) }}
          </button>
        </div>
        <label class="block space-y-1">
          <span class="block text-[10px] font-medium text-[var(--muted)]">{{ t(`accessories.${selectedLens}LensX`) }}</span>
          <input
            class="block w-full accent-[var(--ink)]"
            type="range"
            min="-60"
            max="60"
            step="1"
            :value="accessoryLayout.glasses[`${selectedLens}LensX`] ?? 0"
            :aria-label="t(`accessories.${selectedLens}LensX`)"
            @input="setLensOffset(selectedLens, 'X', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <label class="mt-2 block space-y-1">
          <span class="block text-[10px] font-medium text-[var(--muted)]">{{ t(`accessories.${selectedLens}LensY`) }}</span>
          <input
            class="block w-full accent-[var(--ink)]"
            type="range"
            min="-60"
            max="60"
            step="1"
            :value="accessoryLayout.glasses[`${selectedLens}LensY`] ?? 0"
            :aria-label="t(`accessories.${selectedLens}LensY`)"
            @input="setLensOffset(selectedLens, 'Y', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
      </div>
      </div>
    </section>
    <section v-if="selectedAccessory === 'mustache' || selectedAccessory === 'mouth'" class="mt-3 rounded-2xl border border-[var(--line)] bg-white/60 p-3">
      <div v-if="selectedAccessory === faceEditor && (faceEditor === 'mustache' ? mustache : mouth)" class="mt-2 flex items-center gap-2">
        <span class="min-w-0 flex-1 text-xs text-[var(--muted)]">{{ t('accessories.drag') }}</span>
      </div>
      <div v-if="selectedAccessory === 'mustache' && faceEditor === 'mustache' && mustache" class="mt-3 border-t border-[var(--line)] pt-3 space-y-2">
        <div class="flex items-center gap-2">
          <ColorPicker v-model="mustacheColor" :label="t('accessories.mustacheColor')" />
          <div class="grid min-w-0 flex-1 grid-cols-3 gap-1" role="group" :aria-label="t('accessories.mustacheStyle')">
          <button
            v-for="style in MUSTACHE_STYLES"
            :key="style"
            type="button"
            class="flex h-9 items-center justify-center rounded-lg border transition"
            :class="mustacheStyle === style ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06]' : 'border-transparent hover:border-[var(--line)]'"
            :aria-label="t(`accessories.mustacheStyles.${style}`)"
            :aria-pressed="mustacheStyle === style"
            @click="mustacheStyle = style"
          >
            <svg width="32" height="22" viewBox="0 0 100 40" aria-hidden="true">
              <path
                :d="mustachePath(style, accessoryLayout.mustache.curve, accessoryLayout.mustache.roundness)"
                :fill="mustacheColor"
              />
            </svg>
          </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex min-w-0 items-center gap-1.5">
            <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.width') }}</span>
            <input
              class="min-w-0 flex-1 accent-[var(--ink)]"
              type="range"
              min="0.45"
              max="2.2"
              step="0.05"
              :value="accessoryLayout.mustache.width"
              :aria-label="t('accessories.mustacheWidth')"
              @input="setAccessorySize('mustache', 'width', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="flex min-w-0 items-center gap-1.5">
            <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.height') }}</span>
            <input
              class="min-w-0 flex-1 accent-[var(--ink)]"
              type="range"
              min="0.45"
              max="2.2"
              step="0.05"
              :value="accessoryLayout.mustache.height"
              :aria-label="t('accessories.mustacheHeight')"
              @input="setAccessorySize('mustache', 'height', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>
        <label class="flex items-center gap-2">
          <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.rotation') }}</span>
          <input
            class="min-w-0 flex-1 accent-[var(--ink)]"
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="accessoryLayout.mustache.rotation"
            :aria-label="t('accessories.mustacheRotation')"
            @input="setAccessoryRotation('mustache', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="w-8 text-right text-[10px] text-[var(--muted)]">{{ accessoryLayout.mustache.rotation }}°</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="min-w-0">
            <span class="text-[10px] text-[var(--muted)]">{{ t('accessories.curve') }}</span>
            <input
              class="block w-full accent-[var(--ink)]"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              :value="accessoryLayout.mustache.curve"
              :aria-label="t('accessories.mustacheCurve')"
              @input="setAccessoryContour('mustache', 'curve', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="min-w-0">
            <span class="text-[10px] text-[var(--muted)]">{{ t('accessories.roundness') }}</span>
            <input
              class="block w-full accent-[var(--ink)]"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="accessoryLayout.mustache.roundness"
              :aria-label="t('accessories.mustacheRoundness')"
              @input="setAccessoryContour('mustache', 'roundness', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>
      </div>
      <div v-if="selectedAccessory === 'mouth' && faceEditor === 'mouth' && mouth" class="mt-3 border-t border-[var(--line)] pt-3 space-y-2">
        <div class="flex items-center gap-2">
          <ColorPicker v-model="mouthColor" :label="t('accessories.mouthColor')" />
          <div class="grid min-w-0 flex-1 grid-cols-3 gap-1" role="group" :aria-label="t('accessories.mouthStyle')">
            <button
              v-for="style in MOUTH_STYLES"
              :key="style"
              type="button"
              class="flex h-9 items-center justify-center rounded-lg border transition"
              :class="mouthStyle === style ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06]' : 'border-transparent hover:border-[var(--line)]'"
              :aria-label="t(`accessories.mouthStyles.${style}`)"
              :aria-pressed="mouthStyle === style"
              @click="mouthStyle = style"
            >
              <svg width="30" height="22" viewBox="0 0 100 40" aria-hidden="true">
                <path :d="mouthPath(style, accessoryLayout.mouth.curve, accessoryLayout.mouth.roundness)" :fill="mouthColor" />
              </svg>
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex min-w-0 items-center gap-1.5">
            <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.width') }}</span>
            <input
              class="min-w-0 flex-1 accent-[var(--ink)]"
              type="range"
              min="0.45"
              max="2.2"
              step="0.05"
              :value="accessoryLayout.mouth.width"
              :aria-label="t('accessories.mouthWidth')"
              @input="setAccessorySize('mouth', 'width', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="flex min-w-0 items-center gap-1.5">
            <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.height') }}</span>
            <input
              class="min-w-0 flex-1 accent-[var(--ink)]"
              type="range"
              min="0.45"
              max="2.2"
              step="0.05"
              :value="accessoryLayout.mouth.height"
              :aria-label="t('accessories.mouthHeight')"
              @input="setAccessorySize('mouth', 'height', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>
        <label class="flex items-center gap-2">
          <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ t('accessories.rotation') }}</span>
          <input
            class="min-w-0 flex-1 accent-[var(--ink)]"
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="accessoryLayout.mouth.rotation"
            :aria-label="t('accessories.mouthRotation')"
            @input="setAccessoryRotation('mouth', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="w-8 text-right text-[10px] text-[var(--muted)]">{{ accessoryLayout.mouth.rotation }}°</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="min-w-0">
            <span class="text-[10px] text-[var(--muted)]">{{ t('accessories.curve') }}</span>
            <input
              class="block w-full accent-[var(--ink)]"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              :value="accessoryLayout.mouth.curve"
              :aria-label="t('accessories.mouthCurve')"
              @input="setAccessoryContour('mouth', 'curve', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label class="min-w-0">
            <span class="text-[10px] text-[var(--muted)]">{{ t('accessories.roundness') }}</span>
            <input
              class="block w-full accent-[var(--ink)]"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="accessoryLayout.mouth.roundness"
              :aria-label="t('accessories.mouthRoundness')"
              @input="setAccessoryContour('mouth', 'roundness', Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </div>
      </div>
    </section>
    <h2 class="mt-5 text-sm font-semibold">{{ t('panel.color') }}</h2>
    <div class="mt-2 grid grid-cols-6 gap-1.5">
      <button
        v-for="c in COLORS"
        :key="c.id"
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition"
        :class="
          c.id === color ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t(`colors.${c.id}`)"
        :aria-pressed="c.id === color"
        @click="color = c.id"
      >
        <!-- liseré interne : sinon la pastille creme disparait sur fond clair -->
        <span
          class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{ background: c.hex }"
        />
      </button>

      <ColorPicker
        v-model="color"
        variant="tile"
        :class="COLORS.some((c) => c.id === color) ? 'border-[var(--line)] hover:border-[var(--ink)]' : 'border-[var(--ink)] ring-2 ring-[var(--ink)]/20'"
        :label="t('panel.color')"
      />
    </div>
  </div>
</template>
