<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BotTile from '@/components/BotTile.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLOR_BY_ID, COLORS, SHAPES, isHexColor, normalizeHex } from '@/bot/skins'
import { t } from '@/i18n'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const expression = defineModel<string>('expression', { required: true })

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1

const currentHex = computed(() => {
  const c = COLOR_BY_ID.get(color.value)
  if (c) return c.hex
  if (isHexColor(color.value)) return normalizeHex(color.value)
  return '#0a0a0c'
})

const isCustomColor = computed(() => !COLORS.some((c) => c.id === color.value))
const hexDraft = ref(currentHex.value)

watch(
  () => color.value,
  (val) => {
    const c = COLOR_BY_ID.get(val)
    if (c) hexDraft.value = c.hex
    else if (isHexColor(val)) hexDraft.value = normalizeHex(val)
  }
)

/** Complete automatiquement un code hex incomplet lors de l'application ou de l'apercu. */
function completeHex(raw: string): string {
  const clean = raw.trim().replace(/^#/, '').replace(/[^0-9a-fA-F]/g, '')
  if (clean.length === 0) return currentHex.value
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toLowerCase()
  }
  if (clean.length < 6) {
    return `#${clean.padEnd(6, '0')}`.toLowerCase()
  }
  return `#${clean.slice(0, 6)}`.toLowerCase()
}

/** Couleur visualisee en temps reel dans la pastille de test sans toucher aux formes. */
const testCircleHex = computed(() => completeHex(hexDraft.value))

function onColorPicker(e: Event) {
  const val = (e.target as HTMLInputElement).value
  hexDraft.value = normalizeHex(val)
}

function selectPreset(id: string, hex: string) {
  color.value = id
  hexDraft.value = hex
}

function applyCustomColor() {
  const completed = completeHex(hexDraft.value)
  hexDraft.value = completed
  color.value = completed
}
</script>

<template>
  <div>
    <h2 class="text-sm font-semibold">{{ t('panel.shape') }}</h2>
    <div class="mt-2 grid grid-cols-4 gap-1.5">
      <BotTile
        v-for="s in SHAPES"
        :key="s.id"
        :label="t(`shapes.${s.id}`)"
        :selected="s.id === shape"
        :shape="s.id"
        :color="color"
        :expression="expression"
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
        :frozen-at="PREVIEW_AT"
        @click="expression = e.id"
      />
    </div>

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
        @click="selectPreset(c.id, c.hex)"
      >
        <!-- liseré interne : sinon la pastille creme disparait sur fond clair -->
        <span
          class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{ background: c.hex }"
        />
      </button>
    </div>

    <div class="mt-3 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <label
          class="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition"
          :class="
            isCustomColor
              ? 'border-[var(--ink)]'
              : 'border-transparent hover:border-[var(--line)]'
          "
          :title="t('panel.customColor')"
        >
          <input
            type="color"
            :value="testCircleHex"
            class="absolute -inset-2 h-12 w-12 cursor-pointer opacity-0"
            :aria-label="t('panel.customColor')"
            @input="onColorPicker"
          />
          <span
            class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
            :style="{ background: testCircleHex }"
          />
        </label>
        <div class="relative flex-1">
          <input
            type="text"
            v-model="hexDraft"
            maxlength="7"
            placeholder="#000000"
            spellcheck="false"
            class="h-8 w-full rounded-lg bg-black/5 px-2.5 font-mono text-xs uppercase text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
            :aria-label="t('panel.customColor')"
            @keydown.enter.prevent="applyCustomColor"
          />
        </div>
      </div>
      <button
        type="button"
        class="h-8 w-full cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs font-medium text-[var(--paper)] transition hover:opacity-90 active:scale-95"
        @click="applyCustomColor"
      >
        {{ t('panel.apply') }}
      </button>
    </div>
  </div>
</template>
