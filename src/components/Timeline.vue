<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CycleMenu from '@/components/CycleMenu.vue'
import NameDialog from '@/components/NameDialog.vue'
import TimelineTrack from '@/components/TimelineTrack.vue'
import ZoomSlider from '@/components/ZoomSlider.vue'
import {
  blocksWith,
  makeBlock,
  nextCycleId,
  offsetOf,
  totalDuration,
  uniqueName,
  type Block,
  type Cycle
} from '@/bot/cycles'
import type { StateId } from '@/bot/states'
import { MAX_ZOOM, MIN_ZOOM, mmss } from '@/ui/timeline'
import { nomDeCycle, pluriel, t } from '@/i18n'

/**
 * Barre de montage : elle tient les cycles (choix, creation, renommage,
 * suppression) et la lecture. La piste elle-meme est dans `TimelineTrack` —
 * ici on ne sait rien des gestes, la-bas on ne sait rien des cycles.
 */
const props = defineProps<{
  /** temps ecoule dans le bloc courant, pour le compteur */
  elapsed: number
  shape: string
  color: string
  expression: string
}>()

/**
 * `seek` : deplacement de la tete de lecture, seul le lecteur sait recaler le
 * moteur. `preview` : la page entiere se met en scene, c'est elle qui decide.
 */
const emit = defineEmits<{ seek: [seconds: number]; preview: []; exporter: [] }>()

const cycles = defineModel<Cycle[]>('cycles', { required: true })
const activeId = defineModel<string>('activeId', { required: true })
const block = defineModel<number>('block', { required: true })
const playing = defineModel<boolean>('playing', { required: true })

const zoom = ref(1)

const cycle = computed(() => cycles.value.find((c) => c.id === activeId.value) ?? cycles.value[0]!)
const blocks = computed(() => cycle.value.blocks)
const total = computed(() => totalDuration(blocks.value))
const at = computed(() => offsetOf(blocks.value, block.value) + props.elapsed)

/**
 * Nommage d'un cycle : meme boite pour la creation et le renommage, le second
 * cas portant l'id vise. La creation n'a lieu qu'a la validation — annuler ne
 * doit pas laisser un cycle vide derriere.
 */
const naming = ref<{ mode: 'create' | 'rename'; id?: string } | null>(null)
const nameDraft = ref('')
const nameOpen = ref(false)

/** Montage en attente de confirmation de suppression. */
const removing = ref<Cycle | null>(null)
const confirmOpen = ref(false)
const removingDetail = computed(() =>
  pluriel('dialog.removeDetail', removing.value?.blocks.length ?? 0)
)

/** Remplace le cycle courant : les cycles sont des valeurs, jamais mutees. */
function edit(next: Partial<Cycle>) {
  cycles.value = cycles.value.map((c) => (c.id === cycle.value.id ? { ...c, ...next } : c))
}

function select(id: string) {
  activeId.value = id
  block.value = 0
}

function askCreate() {
  naming.value = { mode: 'create' }
  nameDraft.value = uniqueName(t('cycles.newName'), cycles.value)
  nameOpen.value = true
}

function askRename(id: string) {
  naming.value = { mode: 'rename', id }
  const vise = cycles.value.find((c) => c.id === id)
  // le montage d'amorce n'a pas de nom propre : on part de celui qui s'affiche,
  // sinon renommer commencerait sur un champ vide
  nameDraft.value = vise ? nomDeCycle(vise) : ''
  nameOpen.value = true
}

function onNamed(name: string) {
  const demande = naming.value
  naming.value = null
  if (!demande) return
  if (demande.mode === 'create') {
    // jamais de cycle vide : le lecteur aurait un montage sans rien a jouer
    const neuf: Cycle = {
      id: nextCycleId(cycles.value),
      name: uniqueName(name, cycles.value),
      blocks: [makeBlock('idle')]
    }
    cycles.value = [...cycles.value, neuf]
    select(neuf.id)
    return
  }
  const autres = cycles.value.filter((c) => c.id !== demande.id)
  const unique = uniqueName(name, autres)
  cycles.value = cycles.value.map((c) => (c.id === demande.id ? { ...c, name: unique } : c))
}

/** Suppression d'un montage : jamais sans confirmation, c'est irreversible. */
function askRemove(id: string) {
  removing.value = cycles.value.find((c) => c.id === id) ?? null
  confirmOpen.value = true
}

function onRemove() {
  const cible = removing.value
  removing.value = null
  if (!cible) return
  const reste = cycles.value.filter((c) => c.id !== cible.id)
  cycles.value = reste
  if (cible.id === activeId.value) select(reste[0]!.id)
}
</script>

<template>
  <!--
    Barre de montage : fixee en bas, sans fond ni cadre — elle doit se lire
    comme une partie de la page, au meme titre que le panneau de droite, dont
    elle s'arrete avant la colonne (largeur du panneau + gouttiere + marge).
    La scene lui reserve sa hauteur (`--timeline`) dans cette vue, et la bande de
    l'avatar la reserve partout ailleurs — sinon l'avatar centre sauterait d'un
    onglet a l'autre.

    `lg:left-[4.5rem]` repond a `lg:right-[24.5rem]` : la bande couvre EXACTEMENT
    la colonne de l'avatar, donc le bouton de lecture tombe pile sous la boule.
    Sans lui la bande partait du bord de la fenetre et son centre etait 20 px a
    cote.

    4,5rem = la marge de la scene (2rem) + la gouttiere de la grille (2,5rem) : la
    colonne de gauche a une largeur NULLE en dehors des reglages, mais la grille
    garde son `column-gap`, donc la colonne de l'avatar commence a 72 px et non a
    32. C'est la symetrie de 24,5rem = panneau (20) + gouttiere (2,5) + marge (2).

    Le FOND n'apparait que sous 64rem, et ce n'est pas un choix d'habillage.
    Au-dessus, la page ne defile pas (`#app { overflow: clip }`) et la scene
    reserve exactement cette bande : rien ne passe jamais derriere, donc une barre
    transparente se lit comme une partie de la page. En dessous la page defile
    pour de vrai, et la palette d'animations remontait mot pour mot au travers de
    la piste — le curseur de zoom et les etiquettes des vignettes se superposaient.
    Le filet du haut dit ou la page s'arrete de defiler.
  -->
  <div
    class="fixed inset-x-0 bottom-0 z-30 h-[var(--timeline)] px-6 pt-3 pb-5 max-lg:border-t max-lg:border-[var(--line)] max-lg:bg-[var(--paper)] max-lg:px-5 lg:right-[24.5rem] lg:left-[4.5rem]"
  >
    <!-- lecture : flottante au-dessus de la piste, au centre, le temps ecoule a
         gauche et la duree totale a droite.

         Les deux compteurs disparaissent sous 64rem : ils depassent du haut de la
         barre, donc du fond qui la rend lisible, et ils tombaient sur la palette
         qui defile derriere. Le bouton, lui, reste — un disque plein se lit
         par-dessus n'importe quoi, et il est la commande principale de la vue. La
         meme paire de valeurs est de toute facon affichee dans la barre d'outils,
         en bas a droite. -->
    <div class="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
      <span class="text-sm font-medium tabular-nums max-lg:hidden">{{ mmss(at) }}</span>
      <button
        type="button"
        class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-sm transition hover:scale-105 active:scale-95"
        :aria-label="playing ? t('timeline.pause') : t('timeline.play')"
        @click="playing = !playing"
      >
        <!--
          Lecture / pause : Solar plein (`solar:play-bold`, `solar:pause-bold`),
          la meme bibliotheque que la barre laterale. Traces recopies tels quels
          depuis Iconify, comme la-bas — ne pas les redessiner. Meme taille pour
          les deux : leurs boites font toutes deux 20 unites de haut sur 24, donc
          les deux glyphes ont la meme hauteur optique. Le triangle est decentre
          vers la droite dans sa boite (milieu a x = 13,45) et c'est voulu : le
          centre de masse d'un triangle est a gauche de son cadre, le « recentrer »
          le ferait paraitre trop a gauche.
        -->
        <svg v-if="!playing" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"
          />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <g fill="currentColor">
            <path d="M2 6C2 4.11438 2 3.17157 2.58579 2.58579C3.17157 2 4.11438 2 6 2C7.88562 2 8.82843 2 9.41421 2.58579C10 3.17157 10 4.11438 10 6V18C10 19.8856 10 20.8284 9.41421 21.4142C8.82843 22 7.88562 22 6 22C4.11438 22 3.17157 22 2.58579 21.4142C2 20.8284 2 19.8856 2 18V6Z" />
            <path d="M14 6C14 4.11438 14 3.17157 14.5858 2.58579C15.1716 2 16.1144 2 18 2C19.8856 2 20.8284 2 21.4142 2.58579C22 3.17157 22 4.11438 22 6V18C22 19.8856 22 20.8284 21.4142 21.4142C20.8284 22 19.8856 22 18 22C16.1144 22 15.1716 22 14.5858 21.4142C14 20.8284 14 19.8856 14 18V6Z" />
          </g>
        </svg>
      </button>
      <span class="text-sm tabular-nums text-[var(--muted)] max-lg:hidden">{{ mmss(total) }}</span>
    </div>

    <!-- rien ne se selectionne dans une barre d'outils : ca ne sert a personne
         et ca surligne tout des qu'on glisse une carte ou la tete de lecture -->
    <div class="flex h-full flex-col gap-2 select-none">
      <!--
        Le nom du montage a gauche, ce qu'on en fait a droite : l'export est une
        action sur le CYCLE, comme le renommer ou le supprimer, pas un reglage
        d'affichage. En bas il voisinait la loupe et l'apercu, qui eux ne changent
        que la facon de regarder — et il s'y lisait comme une icone de plus.
      -->
      <div class="flex items-center justify-between gap-1">
        <CycleMenu
          v-model:active-id="activeId"
          :cycles="cycles"
          :current="cycle"
          @create="askCreate"
          @rename="askRename"
          @remove="askRemove"
        />

        <button
          type="button"
          class="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[var(--ink)] pr-3.5 pl-3 text-sm font-medium text-[var(--paper)] shadow-sm transition hover:opacity-90 active:scale-95 max-sm:w-8 max-sm:justify-center max-sm:px-0"
          @click="emit('exporter')"
        >
          <!-- solar:download-minimalistic-linear, la meme que la barre d'export -->
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
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
          <!-- `sr-only` et pas `hidden` : sous 40rem le bouton se reduit a son
               icone, mais le libelle reste son NOM accessible — un bouton dont
               tout le contenu est masque n'est plus annonce du tout, et il
               n'aurait alors ni `aria-label` ni texte. -->
          <span class="max-sm:sr-only">{{ t('timeline.export') }}</span>
        </button>
      </div>

      <TimelineTrack
        v-model:block="block"
        v-model:zoom="zoom"
        :blocks="blocks"
        :elapsed="elapsed"
        :shape="shape"
        :color="color"
        :expression="expression"
        @update:blocks="(b: Block[]) => edit({ blocks: b })"
        @add="(s: StateId) => edit({ blocks: blocksWith(blocks, s) })"
        @seek="emit('seek', $event)"
      />

      <!-- barre d'outils, dans le coin : loupe, compteur, aperçu -->
      <div class="flex shrink-0 items-center justify-end gap-4 max-sm:gap-2">
        <ZoomSlider v-model:zoom="zoom" :min="MIN_ZOOM" :max="MAX_ZOOM" />

        <p class="text-xs tabular-nums text-[var(--muted)]">
          <span class="text-[var(--ink)]">{{ mmss(at) }}</span> / {{ mmss(total) }}
        </p>

        <!-- infobulle au survol ET au focus clavier, comme la barre laterale -->
        <span class="group relative flex">
          <button
            type="button"
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]"
            :aria-label="t('timeline.preview')"
            @click="emit('preview')"
          >
            <!--
              Apercu : l'oeil plein de Solar (`solar:eye-bold`), meme
              bibliotheque que la barre laterale. La paupiere est evidee autour
              de la pupille (`fill-rule="evenodd"`) : le rond plein qui la
              remplit est le second trace, ne pas fusionner les deux.
            -->
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="currentColor">
                <path d="M9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M2 12C2 13.6394 2.42496 14.1915 3.27489 15.2957C4.97196 17.5004 7.81811 20 12 20C16.1819 20 19.028 17.5004 20.7251 15.2957C21.575 14.1915 22 13.6394 22 12C22 10.3606 21.575 9.80853 20.7251 8.70433C19.028 6.49956 16.1819 4 12 4C7.81811 4 4.97196 6.49956 3.27489 8.70433C2.42496 9.80853 2 10.3606 2 12ZM12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z"
                />
              </g>
            </svg>
          </button>
          <span
            class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs whitespace-nowrap text-[var(--paper)] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            role="tooltip"
          >
            {{ t('timeline.preview') }}
          </span>
        </span>

      </div>
    </div>

    <NameDialog
      v-model:open="nameOpen"
      v-model:value="nameDraft"
      :title="naming?.mode === 'rename' ? t('dialog.nameRenameTitle') : t('dialog.nameCreateTitle')"
      :label="t('dialog.nameField')"
      :submit-label="naming?.mode === 'rename' ? t('dialog.nameRename') : t('dialog.nameCreate')"
      @submit="onNamed"
    />

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="t('dialog.removeTitle', { name: removing ? nomDeCycle(removing) : '' })"
      :detail="removingDetail"
      :confirm-label="t('dialog.removeConfirm')"
      @confirm="onRemove"
    />
  </div>
</template>
