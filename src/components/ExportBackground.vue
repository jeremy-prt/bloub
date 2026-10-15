<script setup lang="ts">
import { computed, ref } from 'vue'
import ColorPicker from '@/components/ColorPicker.vue'
import { t } from '@/i18n'
import type { BackgroundDirection, BackgroundMode, ExportBackground as ExportBackgroundSettings } from '@/ui/background'

const background = defineModel<ExportBackgroundSettings>({ required: true })
const error = ref('')
const input = ref<HTMLInputElement | null>(null)
const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const MAX_FILE_SIZE = 10 * 1024 * 1024
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const directionLabels: Record<BackgroundDirection, string> = {
  horizontal: t('export.directionHorizontal'),
  vertical: t('export.directionVertical'),
  diagonal: t('export.directionDiagonal'),
  diagonalReverse: t('export.directionDiagonalReverse')
}
const mode = computed({
  get: () => background.value.mode,
  set: (mode: BackgroundMode) => {
    background.value = { ...background.value, mode }
  }
})
const color = computed({
  get: () => background.value.color,
  set: (color: string) => {
    background.value = { ...background.value, color }
  }
})
const secondColor = computed({
  get: () => background.value.secondColor,
  set: (secondColor: string) => {
    background.value = { ...background.value, secondColor }
  }
})
const direction = computed({
  get: () => background.value.direction,
  set: (direction: BackgroundDirection) => {
    background.value = { ...background.value, direction }
  }
})
function update(changes: Partial<ExportBackgroundSettings>) {
  background.value = { ...background.value, ...changes }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('background image could not be read'))
    reader.onerror = () => reject(reader.error ?? new Error('background image could not be read'))
    reader.readAsDataURL(file)
  })
}

async function load() {
  const fileInput = input.value
  const file = fileInput?.files?.[0]
  if (!fileInput || !file) return
  error.value = ''
  if (!TYPES.has(file.type)) {
    error.value = t('export.backgroundTypeError')
    fileInput.value = ''
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    error.value = t('export.backgroundSizeError')
    fileInput.value = ''
    return
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    update({ image: await readAsDataUrl(file), mode: 'image' })
  } catch {
    error.value = t('export.backgroundLoadError')
  } finally {
    URL.revokeObjectURL(url)
    fileInput.value = ''
  }
}

function remove() {
  update({ image: null, mode: 'none' })
  error.value = ''
}
</script>

<template>
  <section class="mt-5">
    <h2 class="text-sm font-semibold">{{ t('export.background') }}</h2>
    <p class="mt-1 text-[10px] text-[var(--muted)]">{{ t('export.backgroundHelp') }}</p>
    <div
      class="mt-2 flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white/60 p-1"
      role="group"
      :aria-label="t('export.backgroundMode')"
    >
      <button
        v-for="choice in ['none', 'color', 'gradient', 'image'] as const"
        :key="choice"
        type="button"
        class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ink)]"
        :class="mode === choice && 'bg-[var(--ink)] text-[var(--paper)] ring-2 ring-[var(--ink)] ring-offset-1 hover:bg-[var(--ink)] hover:text-[var(--paper)]'"
        :aria-label="t(`export.background${choice === 'none' ? 'None' : choice === 'color' ? 'Color' : choice === 'gradient' ? 'Gradient' : 'Photo'}`)"
        :aria-pressed="mode === choice"
        :title="t(`export.background${choice === 'none' ? 'None' : choice === 'color' ? 'Color' : choice === 'gradient' ? 'Gradient' : 'Photo'}`)"
        :disabled="props.disabled"
        @click="mode = choice"
      >
        <span
          v-if="choice === 'color' || choice === 'gradient'"
          class="h-4 w-4 rounded-full border-2 border-[var(--ink)] shadow-[0_0_0_1px_var(--paper)]"
          :style="choice === 'color'
            ? { backgroundColor: color }
            : { backgroundImage: `linear-gradient(135deg, ${color}, ${secondColor})` }"
          aria-hidden="true"
        />
        <svg v-else-if="choice === 'none'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4h16v16H4zM4 16l4-4 4 4 4-4 4 4M7 8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="m5 19 14-14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 16 8.5 10l4 4 3-3L21 17M7 6h.01M3 4h18v16H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
    <div v-if="mode === 'color' || mode === 'gradient'" class="mt-2 flex flex-col gap-2">
      <div class="flex items-center gap-2" role="group" :aria-label="t('export.backgroundColor')">
        <ColorPicker v-model="color" :label="t('export.backgroundColor')" />
        <ColorPicker
          v-if="mode === 'gradient'"
          v-model="secondColor"
          :label="t('export.backgroundSecondColor')"
        />
        <div
          v-if="mode === 'gradient'"
          class="ml-auto flex items-center gap-0.5 rounded-xl border border-[var(--line)] bg-white/60 p-0.5"
          role="group"
          :aria-label="t('export.backgroundDirection')"
        >
          <button
            v-for="choice in ['horizontal', 'vertical', 'diagonal', 'diagonalReverse'] as const"
            :key="choice"
            type="button"
            class="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            :class="direction === choice && 'bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'"
            :aria-label="directionLabels[choice]"
            :aria-pressed="direction === choice"
            :title="directionLabels[choice]"
            :disabled="props.disabled"
            @click="direction = choice"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                v-if="choice === 'horizontal'"
                d="M4 12h16m-4-4 4 4-4 4M8 8l-4 4 4 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-else-if="choice === 'vertical'"
                d="M12 4v16m-4-4 4 4 4-4M8 8l4-4 4 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-else
                :d="choice === 'diagonal' ? 'M5 19 19 5m-6 0h6v6' : 'M5 5l14 14m0-6v6h-6'"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div v-if="mode === 'image'" class="mt-2 flex items-center gap-2">
      <button
        type="button"
        class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--line)] px-2.5 text-xs text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
        :disabled="props.disabled"
        @click="input?.click()"
      >
        <span class="truncate">
          {{ t(background.image ? 'export.changeBackground' : 'export.uploadBackground') }}
        </span>
        <svg v-if="!background.image" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 15 7.5 10l3 3 2.5-2.5L17 15M5 5h.01M2 3h16v14H2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="background.image"
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
        :aria-label="t('export.removeBackground')"
        :title="t('export.removeBackground')"
        :disabled="props.disabled"
        @click="remove"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>
    <input
      ref="input"
      class="sr-only"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      :aria-label="t('export.uploadBackground')"
      :disabled="props.disabled"
      @change="load"
    />
    <p v-if="error" class="mt-1 text-xs text-[var(--danger)]" role="alert">{{ error }}</p>
  </section>
</template>
