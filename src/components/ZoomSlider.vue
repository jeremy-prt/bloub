<script setup lang="ts">
import { computed } from 'vue'
import { pourcentage, t } from '@/i18n'

/**
 * Reglage de la loupe de la piste. Un `<input type="range">` natif plutot qu'un
 * curseur maison : il apporte le clavier (fleches, Origine/Fin), le pas, et
 * l'annonce aux lecteurs d'ecran. Seule l'apparence est reprise.
 *
 * La valeur n'est pas ecrite directement : le parent la recoit et decide du
 * point d'ancrage du zoom, pour que la piste ne parte pas ailleurs.
 */
const props = defineProps<{ zoom: number; min: number; max: number }>()
const emit = defineEmits<{ 'update:zoom': [value: number] }>()

const percent = computed(() => pourcentage(props.zoom))

function onInput(e: Event) {
  emit('update:zoom', Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <!-- les deux pastilles disent le sens : petit a gauche, grand a droite -->
    <span class="h-1 w-1 shrink-0 rounded-full bg-[var(--muted)]" aria-hidden="true" />
    <input
      type="range"
      class="h-1 w-28 cursor-pointer accent-[var(--ink)] max-sm:w-20"
      :min="props.min"
      :max="props.max"
      step="0.01"
      :value="props.zoom"
      :aria-label="t('timeline.zoom')"
      :aria-valuetext="percent"
      @input="onInput"
    />
    <span class="h-2 w-2 shrink-0 rounded-full bg-[var(--muted)]" aria-hidden="true" />
    <!-- largeur fixe pour que la barre ne bouge pas quand le nombre change de
         chiffres, mais aligne a GAUCHE : cale a droite, le pourcentage
         s'eloignait du curseur des qu'il perdait un chiffre -->
    <span class="w-11 text-left text-xs tabular-nums text-[var(--muted)]">{{ percent }}</span>
  </div>
</template>
