<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '@/i18n'
import { copiePossible } from '@/ui/capture'
import { ACTIONS, ACTION_DEFAUT, type ActionId, type EtatExport } from '@/ui/export'

/**
 * Barre d'export de l'avatar : un bouton pour le format courant, et une flèche
 * accolee pour les autres. Purement presentationnel, comme `Customizer.vue` —
 * c'est `App.vue` qui possede le SVG a capturer, donc qui fait le travail.
 *
 * Le menu s'ouvre vers le HAUT : la barre est en bas de la colonne de l'avatar,
 * un menu vers le bas sortirait de la fenetre sur un ecran court.
 */
const props = defineProps<{ etat: EtatExport }>()
const emit = defineEmits<{ exporter: [ActionId] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

/**
 * La copie d'IMAGE n'est pas proposee la ou le navigateur ne sait pas en ecrire.
 * La copie du SVG, elle, passe par `writeText` et marche partout.
 */
const actions = ACTIONS.filter((a) => a.mode !== 'copieImage' || copiePossible())

const occupe = computed(() => props.etat === 'occupe')

/** Le bouton principal rend compte de ce qui vient de se passer. */
const libelle = computed(() => {
  if (props.etat === 'exporte') return t('export.done')
  if (props.etat === 'copie') return t('export.copied')
  if (props.etat === 'erreur') return t('export.failed')
  return t('export.action')
})

const confirme = computed(() => props.etat === 'exporte' || props.etat === 'copie')

function lance(id: ActionId) {
  open.value = false
  emit('exporter', id)
}

function onOutside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) open.value = false
}

watch(open, (on) => {
  if (on) window.addEventListener('pointerdown', onOutside)
  else window.removeEventListener('pointerdown', onOutside)
})

onBeforeUnmount(() => window.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="relative" @keydown.esc="open = false">
    <div
      class="flex overflow-hidden rounded-xl bg-[var(--ink)] text-[var(--paper)] shadow-sm transition"
      :class="occupe && 'opacity-60'"
    >
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 py-2.5 pr-3 pl-3.5 text-sm font-medium transition hover:bg-white/10 disabled:cursor-default"
        :disabled="occupe"
        @click="lance(ACTION_DEFAUT)"
      >
        <!-- solar:check-circle-linear -->
        <svg
          v-if="confirme"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5L10.5 14.5L15.5 9.5" />
          </g>
        </svg>
        <!-- solar:download-minimalistic-linear -->
        <svg v-else width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path
              d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
            />
            <path d="M12 3V16M8 11.625L12 16L16 11.625" />
          </g>
        </svg>
        {{ libelle }}
      </button>

      <!-- pleine hauteur : le conteneur est en `flex`, donc l'etirement suffit,
           sans marge verticale qui la ferait paraitre flottante -->
      <div class="w-px self-stretch bg-current opacity-25"></div>

      <button
        type="button"
        class="flex cursor-pointer items-center px-2.5 transition hover:bg-white/10 disabled:cursor-default"
        :disabled="occupe"
        :aria-label="t('export.more')"
        aria-haspopup="true"
        :aria-expanded="open"
        @click="open = !open"
      >
        <!-- solar:alt-arrow-down-linear -->
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="transition-transform"
          :class="open && 'rotate-180'"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 9L12 15L5 9"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="open"
      class="absolute right-0 bottom-full z-10 mb-2 w-60 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1 shadow-lg"
    >
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-black/5"
        :class="action.id === 'copie' && 'mt-1 border-t border-[var(--line)] pt-2.5'"
        @click="lance(action.id)"
      >
        <!-- solar:copy-linear -->
        <svg
          v-if="action.mode === 'copieImage' || action.mode === 'copieTexte'"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="shrink-0 text-[var(--muted)]"
        >
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
            />
            <path
              d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
            />
          </g>
        </svg>
        <!-- solar:download-minimalistic-linear — les deux telechargements
             portent la meme icone : ce qui les distingue est le format, dit par
             le libelle, pas la nature de l'action -->
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="shrink-0 text-[var(--muted)]"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path
              d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
            />
            <path d="M12 3V16M8 11.625L12 16L16 11.625" />
          </g>
        </svg>
        {{ t(`export.${action.id}`) }}
      </button>
    </div>
  </div>
</template>
