<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { HexColorPicker } from 'react-colorful'

const props = defineProps<{
  color: string
}>()

const emit = defineEmits<{
  (e: 'update:color', hex: string): void
}>()

const pickerContainer = ref<HTMLDivElement | null>(null)
let root: Root | null = null

function updateReactPicker(currentColor: string) {
  if (!root && pickerContainer.value) {
    root = createRoot(pickerContainer.value)
  }
  if (root) {
    root.render(
      React.createElement(HexColorPicker, {
        color: currentColor,
        onChange: (newHex: string) => {
          emit('update:color', newHex)
        },
        className: 'custom-color-picker'
      })
    )
  }
}

onMounted(() => {
  updateReactPicker(props.color)
})

watch(
  () => props.color,
  (newVal) => {
    updateReactPicker(newVal)
  }
)

onBeforeUnmount(() => {
  if (root) {
    root.unmount()
    root = null
  }
})
</script>

<template>
  <div ref="pickerContainer" class="spectrum-picker-root" />
</template>

<style scoped>
.spectrum-picker-root {
  width: 100%;
}
</style>
