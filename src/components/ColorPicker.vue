<script setup lang="ts">
const color = defineModel<string>({ required: true })
defineProps<{
  label: string
  variant?: 'control' | 'circle' | 'tile'
}>()
</script>

<template>
  <label
    class="group relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center border border-[var(--line)] bg-white transition hover:border-[var(--muted)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ink)] has-[:focus-visible]:ring-offset-2"
    :class="[
      variant === 'circle' ? 'rounded-full' : variant === 'tile' ? 'aspect-square h-auto w-full rounded-full border-2 border-dashed' : 'rounded-lg'
    ]"
    :title="label"
  >
    <svg
      class="h-4 w-4 text-[var(--ink)] transition group-hover:scale-110"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20h1.2a2.8 2.8 0 0 0 2.1-4.65 1.2 1.2 0 0 1 .9-2H18a4 4 0 0 0 4-4c0-5.15-4.48-9.35-10-9.35ZM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
      />
    </svg>
    <span
      class="absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded-full border border-black/20 shadow-sm"
      :style="{ backgroundColor: color }"
    />
    <input
      v-model="color"
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      type="color"
      :aria-label="label"
    />
  </label>
</template>
