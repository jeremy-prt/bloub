<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    color: string
    radius?: number
    time?: number
  }>(),
  { radius: 100, time: 0 }
)

const offset = computed(() => (props.radius / 100) * 122)
const y = computed(() => (props.radius / 100) * 20)
const bob = computed(() => (props.radius / 100) * Math.sin((props.time / 2.4) * Math.PI * 2) * 3)
const length = computed(() => (props.radius / 100) * 39)
const thickness = computed(() => (props.radius / 100) * 13)
</script>

<template>
  <g aria-hidden="true" data-detached-hands>
    <rect
      data-detached-hand="left"
      :x="-offset - length / 2"
      :y="y + bob - thickness / 2"
      :width="length"
      :height="thickness"
      :rx="(radius / 100) * 6"
      :fill="color"
    />
    <rect
      data-detached-hand="right"
      :x="offset - length / 2"
      :y="-y - bob - thickness / 2"
      :width="length"
      :height="thickness"
      :rx="(radius / 100) * 6"
      :fill="color"
    />
  </g>
</template>
