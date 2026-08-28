<script setup lang="ts">
import { computed } from 'vue'
import BotTile from '@/components/BotTile.vue'
import ColorSpectrumPicker from '@/components/ColorSpectrumPicker.vue'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS, SHAPES, resolveHexColor } from '@/bot/skins'
import { t } from '@/i18n'

const shape = defineModel<string>('shape', { required: true })
const color = defineModel<string>('color', { required: true })
const expression = defineModel<string>('expression', { required: true })

const currentColorHex = computed({
  get: () => resolveHexColor(color.value),
  set: (val: string) => {
    color.value = val
  }
})

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1
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

    <div class="mt-5 flex items-center justify-between">
      <h2 class="text-sm font-semibold">{{ t('panel.color') }}</h2>
      <span class="font-mono text-xs text-[var(--muted)] uppercase">{{ currentColorHex }}</span>
    </div>

    <!-- Quick select presets -->
    <div class="mt-2.5 flex items-center justify-between gap-1">
      <button
        v-for="c in COLORS"
        :key="c.id"
        type="button"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition hover:scale-110"
        :class="
          currentColorHex.toLowerCase() === c.hex.toLowerCase()
            ? 'border-[var(--ink)] scale-110'
            : 'border-transparent hover:border-[var(--line)]'
        "
        :aria-label="t(`colors.${c.id}`)"
        :aria-pressed="currentColorHex.toLowerCase() === c.hex.toLowerCase()"
        @click="color = c.hex"
      >
        <span
          class="block h-[80%] w-[80%] rounded-full ring-1 ring-black/10 ring-inset"
          :style="{ background: c.hex }"
        />
      </button>
    </div>

    <!-- Full spectrum color picker -->
    <div class="mt-3">
      <ColorSpectrumPicker v-model:color="currentColorHex" />
    </div>
  </div>
</template>

