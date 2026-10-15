<script setup lang="ts">
import { ref } from 'vue'
import ColorPicker from '@/components/ColorPicker.vue'
import { nombre, t, type Cle } from '@/i18n'
import {
  mouthPath,
  mustachePath,
  DEFAULT_ACCESSORY_COLORS,
  type AccessoryKind,
  type AccessoryLayout,
  type AccessoryPlacement,
  type MouthStyle,
  type MustacheStyle,
  type ResolvedAccessoryBlockSettings
} from '@/ui/accessories'
import { glassesLensPath } from '@/ui/glasses'

const layout = defineModel<AccessoryLayout>('layout', { required: true })
const settings = defineModel<ResolvedAccessoryBlockSettings>('settings', { required: true })
const selectedAccessory = defineModel<AccessoryKind | null>('selectedAccessory', { required: true })
defineProps<{ mouthStyle: MouthStyle; mustacheStyle: MustacheStyle }>()
const selectedLens = ref<'left' | 'right'>('left')

const accessories = [
  { kind: 'glasses', label: 'glasses.title' },
  { kind: 'mustache', label: 'accessories.mustache' },
  { kind: 'mouth', label: 'accessories.mouth' }
] as const

type Field = keyof AccessoryPlacement
type Control = { field: Field; label: Cle; min: number; max: number; step: number }

const commonFields: Control[] = [
  { field: 'x', label: 'accessories.positionX', min: -90, max: 90, step: 1 },
  { field: 'y', label: 'accessories.positionY', min: -90, max: 90, step: 1 },
  { field: 'width', label: 'accessories.width', min: 0.45, max: 2.2, step: 0.05 },
  { field: 'height', label: 'accessories.height', min: 0.45, max: 2.2, step: 0.05 },
  { field: 'rotation', label: 'accessories.rotation', min: -180, max: 180, step: 1 }
]

function fieldsFor(kind: AccessoryKind): Control[] {
  return kind === 'glasses'
    ? [
        ...commonFields,
        {
          field: `${selectedLens.value}LensX` as Field,
          label: `accessories.${selectedLens.value}LensX` as Cle,
          min: -60,
          max: 60,
          step: 1
        },
        {
          field: `${selectedLens.value}LensY` as Field,
          label: `accessories.${selectedLens.value}LensY` as Cle,
          min: -60,
          max: 60,
          step: 1
        }
      ]
    : [
        ...commonFields,
        { field: 'curve' as const, label: 'accessories.curve', min: -1, max: 1, step: 0.05 },
        {
          field: 'roundness' as const,
          label: 'accessories.roundness',
          min: 0,
          max: 1,
          step: 0.05
        },
      ]
}

function labelFor(kind: AccessoryKind): Cle {
  if (kind === 'glasses') return 'glasses.title'
  if (kind === 'mustache') return 'accessories.mustache'
  return 'accessories.mouth'
}

function formattedValue(value: number, step: number): string {
  const decimals = String(step).split('.')[1]?.length ?? 0
  const rounded = Number(value.toFixed(decimals))
  const formatted = nombre(Object.is(rounded, -0) ? 0 : rounded, decimals)
  return formatted.replace(/([,.]\d*?)0+$/, '$1').replace(/[,.]$/, '')
}

function update(kind: AccessoryKind, control: Control, value: number) {
  const decimals = String(control.step).split('.')[1]?.length ?? 0
  const snapped = control.min + Math.round((value - control.min) / control.step) * control.step
  layout.value = {
    ...layout.value,
    [kind]: { ...layout.value[kind], [control.field]: Number(snapped.toFixed(decimals)) }
  }
}

function setColor(kind: AccessoryKind, color: string) {
  settings.value = {
    ...settings.value,
    [kind]: { ...settings.value[kind], color }
  }
}

function select(kind: AccessoryKind) {
  if (kind === 'glasses') {
    settings.value = {
      ...settings.value,
      glasses: { ...settings.value.glasses, enabled: true }
    }
  } else if (!settings.value[kind].enabled) {
    settings.value = {
      ...settings.value,
      mustache: { ...settings.value.mustache, enabled: kind === 'mustache' },
      mouth: { ...settings.value.mouth, enabled: kind === 'mouth' }
    }
  }
  selectedAccessory.value = kind
}

function remove(kind: AccessoryKind) {
  if (kind === 'mustache' || kind === 'mouth') {
    settings.value = {
      ...settings.value,
      [kind]: { ...settings.value[kind], enabled: false }
    }
  } else {
    settings.value = {
      ...settings.value,
      glasses: { ...settings.value.glasses, enabled: false }
    }
  }
  if (selectedAccessory.value === kind) selectedAccessory.value = null
}

function setShowEyes(showEyes: boolean) {
  settings.value = {
    ...settings.value,
    glasses: { ...settings.value.glasses, showEyes }
  }
}
</script>

<template>
  <section class="pt-2 pb-4">
    <h2 class="sr-only">{{ t('accessories.blockTitle') }}</h2>
    <div class="flex h-10 items-center gap-1" role="group" :aria-label="t('accessories.blockTitle')">
      <div v-for="item in accessories" :key="item.kind" class="relative flex-1">
        <button
        type="button"
        class="flex h-9 w-full items-center justify-center rounded-lg border transition"
        :class="[
          selectedAccessory === item.kind
            ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]'
            : 'border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]'
        ]"
        :aria-label="t(item.label)"
        :title="t(item.label)"
        :aria-pressed="selectedAccessory === item.kind"
        :aria-expanded="selectedAccessory === item.kind"
        @click="select(item.kind)"
      >
        <svg v-if="item.kind === 'glasses'" width="23" height="20" viewBox="0 0 48 28" fill="none" aria-hidden="true">
          <path :d="glassesLensPath('round', 16, 17, true)" transform="translate(11 14)" stroke="currentColor" stroke-width="2" />
          <path :d="glassesLensPath('round', 16, 17, false)" transform="translate(37 14)" stroke="currentColor" stroke-width="2" />
          <path d="M19 12q5-3 10 0M2 10l2-2m40 2 2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <svg v-else-if="item.kind === 'mustache'" width="26" height="18" viewBox="0 0 100 40" aria-hidden="true">
          <path :d="mustachePath(mustacheStyle, layout.mustache.curve, layout.mustache.roundness)" fill="currentColor" />
        </svg>
        <svg v-else width="22" height="18" viewBox="0 0 100 40" aria-hidden="true">
          <path :d="mouthPath(mouthStyle, layout.mouth.curve, layout.mouth.roundness)" fill="currentColor" />
        </svg>
        </button>
        <button
          v-if="settings[item.kind].enabled"
          type="button"
          class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[var(--ink)] text-white shadow-sm"
          :aria-label="t('accessories.disableItem', { item: t(item.label) })"
          :title="t('accessories.disableItem', { item: t(item.label) })"
          @click="remove(item.kind)"
        >
          <svg class="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="m3 3 6 6m0-6L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="selectedAccessory && settings[selectedAccessory].enabled" class="mt-2 space-y-2">
      <template v-if="selectedAccessory && settings[selectedAccessory].enabled">
        <div class="flex items-center gap-2 text-xs text-[var(--muted)]">
          <ColorPicker
            :model-value="settings[selectedAccessory].color || DEFAULT_ACCESSORY_COLORS[selectedAccessory]"
            :label="t('accessories.itemColor', { item: t(labelFor(selectedAccessory)) })"
            @update:model-value="setColor(selectedAccessory, $event)"
          />
          <span>{{ t('accessories.color') }}</span>
        </div>
        <template v-if="selectedAccessory === 'glasses'">
          <label class="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              class="accent-[var(--ink)]"
              type="checkbox"
              :checked="settings.glasses.showEyes ?? false"
              @change="setShowEyes(($event.target as HTMLInputElement).checked)"
            />
            <span>{{ t('glasses.showEyesWithGlasses') }}</span>
          </label>
        </template>
        <div v-if="selectedAccessory === 'glasses'" class="flex gap-1" role="group" :aria-label="t('accessories.selectLens')">
          <button
            v-for="side in ['left', 'right'] as const"
            :key="side"
            type="button"
            class="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-[10px] transition"
            :class="selectedLens === side ? 'border-[var(--ink)] bg-[var(--ink)]/[0.06] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)]'"
            :aria-label="t(`accessories.${side}Lens`)"
            :aria-pressed="selectedLens === side"
            @click="selectedLens = side"
          >
            <svg width="15" height="12" viewBox="0 0 20 14" fill="none" aria-hidden="true">
              <path d="M2 7c0-2 1-4 3-4h4v8H5c-2 0-3-2-3-4Z" :fill="selectedLens === side ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" />
              <path d="M11 3h4c2 0 3 2 3 4s-1 4-3 4h-4V3Z" :fill="selectedLens === side ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" />
              <path d="M9 5h2" stroke="currentColor" stroke-width="1.2" />
            </svg>
            {{ t(`accessories.${side}Lens`) }}
          </button>
        </div>
        <label v-for="control in fieldsFor(selectedAccessory)" :key="control.field" class="block">
          <span class="flex justify-between text-[10px] text-[var(--muted)]">
            <span>{{ t(control.label) }}</span>
            <span class="min-w-10 rounded bg-black/[0.04] px-1.5 text-right tabular-nums text-[var(--ink)]">{{ formattedValue(layout[selectedAccessory][control.field] ?? 0, control.step) }}</span>
          </span>
          <input
            class="block w-full accent-[var(--ink)]"
            type="range"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :value="layout[selectedAccessory][control.field] ?? 0"
            :aria-label="t(control.label)"
            @input="update(selectedAccessory, control, Number(($event.target as HTMLInputElement).value))"
          />
        </label>
      </template>
    </div>
  </section>
</template>
