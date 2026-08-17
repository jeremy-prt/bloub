<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { Cycle } from '@/bot/cycles'
import { nomDeCycle, t } from '@/i18n'

/**
 * Choix du montage. Un `<select>` natif ne peut pas porter la ligne "Nouveau"
 * ni la suppression d'une entree, d'ou ce menu — et il s'ouvre vers le haut,
 * la barre etant en bas de l'ecran.
 */
defineProps<{ cycles: Cycle[]; current: Cycle }>()
const activeId = defineModel<string>('activeId', { required: true })
const emit = defineEmits<{ create: []; remove: [id: string]; rename: [id: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(id: string) {
  activeId.value = id
  open.value = false
}

function create() {
  open.value = false
  emit('create')
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
  <!--
    `text-left` sur le declencheur : les navigateurs centrent le texte des
    boutons. Ca ne se voyait pas avec l'ancienne troncature, qui remplissait
    toute la boite ; la troncature au mot laisse une ligne plus courte, et le
    nom se retrouvait au milieu.
  -->
  <div ref="root" class="relative" @keydown.esc="open = false">
    <button
      type="button"
      class="flex max-w-56 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm font-medium transition hover:bg-black/5"
      aria-haspopup="true"
      :aria-expanded="open"
      :title="nomDeCycle(current)"
      @click="open = !open"
    >
      <span class="tronque">{{ nomDeCycle(current) }}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        aria-hidden="true"
        class="shrink-0 text-[var(--muted)]"
      >
        <path
          d="M2 3.5 5 6.5l3-3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5"
    >
      <div
        v-for="c in cycles"
        :key="c.id"
        class="group/row flex items-center gap-1"
      >
        <!-- `min-w-0` sur le bouton : sans lui, un nom long pousse la ligne au
             lieu d'etre coupe, et deborde du menu avec ses deux actions -->
        <button
          type="button"
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5"
          :title="nomDeCycle(c)"
          @click="choose(c.id)"
        >
          <span class="w-3 shrink-0 text-[var(--ink)]">{{ c.id === activeId ? '✓' : '' }}</span>
          <span class="tronque">{{ nomDeCycle(c) }}</span>
        </button>
        <!-- renommer et supprimer vivent ici : la barre n'a pas a porter deux
             boutons de plus pour une action qu'on fait une fois -->
        <button
          type="button"
          class="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 hover:text-[var(--ink)] focus-visible:opacity-100"
          :aria-label="t('cycles.menuRenameAria', { name: nomDeCycle(c) })"
          @click="((open = false), emit('rename', c.id))"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M8.2 1.8 10.2 3.8 4.4 9.6 1.8 10.2 2.4 7.6z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.1"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <!-- le dernier montage ne se supprime pas : il n'y aurait plus rien a jouer -->
        <button
          v-if="cycles.length > 1"
          type="button"
          class="mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 hover:text-[var(--danger)] focus-visible:opacity-100"
          :aria-label="t('cycles.menuRemoveAria', { name: nomDeCycle(c) })"
          @click="((open = false), emit('remove', c.id))"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2.8 3.9h8.4M5.5 3.9V2.7h3v1.2M4.1 3.9l.5 7.4h4.8l.5-7.4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="my-1 h-px bg-[var(--line)]" />

      <button
        type="button"
        class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5"
        @click="create"
      >
        <span class="w-3 shrink-0 text-[var(--muted)]">+</span>
        {{ t('cycles.menuNew') }}
      </button>
    </div>
  </div>
</template>
