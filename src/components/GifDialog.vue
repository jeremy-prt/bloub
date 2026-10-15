<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { t } from '@/i18n'
import ExportBackground from '@/components/ExportBackground.vue'
import { FONDS_GIF, type FondGif } from '@/ui/export'
import type { ExportBackground as ExportBackgroundSettings } from '@/ui/background'
import { useModalDialog } from '@/ui/useModalDialog'

/**
 * Choix du fond avant de telecharger le GIF.
 *
 * Ce format est le seul a poser la question : sa transparence n'a qu'un bit, donc
 * son bord transparent est dur et se voit. Le fond plein le lisse, en echange
 * d'une couleur cuite dans l'image — aucun des deux ne gagne dans tous les cas,
 * d'ou le choix laisse a l'utilisateur.
 *
 * De vrais `<input type="radio">` et non des boutons : le navigateur donne le
 * groupe, la navigation aux fleches et l'annonce « 1 sur 2 » au lecteur d'ecran.
 * Le comportement modal vient de `useModalDialog`, l'animation de `styles.css`.
 */
const open = defineModel<boolean>('open', { required: true })
const fond = defineModel<FondGif>('fond', { required: true })
const backdrop = defineModel<ExportBackgroundSettings>('backdrop', { required: true })
const emit = defineEmits<{ confirm: [] }>()

const boite = useTemplateRef<HTMLDialogElement>('boite')
useModalDialog(open, boite)

function confirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <dialog
    ref="boite"
    class="dialogue m-auto max-h-[90dvh] w-80 overflow-y-auto rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl"
    :aria-label="t('export.gifTitle')"
    @close="open = false"
    @cancel.prevent="open = false"
  >
    <form class="flex flex-col gap-4" @submit.prevent="confirm">
      <div class="flex flex-col gap-1">
        <h2 class="text-sm font-semibold">{{ t('export.gifTitle') }}</h2>
        <p class="text-xs text-[var(--muted)]">{{ t('export.gifDetail') }}</p>
      </div>

      <ExportBackground v-model="backdrop" />

      <fieldset v-if="backdrop.mode === 'none'" class="flex flex-col gap-1">
        <legend class="sr-only">{{ t('export.gifBackground') }}</legend>
        <label
          v-for="(choix, i) in FONDS_GIF"
          :key="choix"
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-black/5"
        >
          <input
            v-model="fond"
            type="radio"
            name="fond"
            :value="choix"
            :autofocus="i === 0"
            class="accent-[var(--ink)]"
          />
          <span class="flex flex-col">
            {{ t(`export.fond_${choix}`) }}
            <span class="text-xs text-[var(--muted)]">{{ t(`export.fond_${choix}_aide`) }}</span>
          </span>
        </label>
      </fieldset>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
          @click="open = false"
        >
          {{ t('dialog.cancel') }}
        </button>
        <button
          type="submit"
          class="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)] transition hover:opacity-90 active:scale-95"
        >
          {{ t('export.gifConfirm') }}
        </button>
      </div>
    </form>
  </dialog>
</template>
