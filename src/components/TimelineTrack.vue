<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import BlockPicker from '@/components/BlockPicker.vue'
import BloubBot from '@/components/BloubBot.vue'
import {
  clampDuration,
  moveBlock,
  offsetOf,
  STEP,
  totalDuration,
  type Block
} from '@/bot/cycles'
import { POSES, type StateId } from '@/bot/states'
import { BASE_SCALE, clampZoom, ticksFor } from '@/ui/timeline'
import { secondes, secondesCourtes, t } from '@/i18n'

/**
 * La piste : une regle graduee, les cartes du montage, et les gestes qui vont
 * avec (deplacer, etirer, promener la tete de lecture, zoomer). Elle ne connait
 * ni les cycles ni le lecteur — elle recoit une suite de blocs et rend celle
 * qu'on obtient apres le geste.
 */
const props = defineProps<{
  blocks: Block[]
  /** temps ecoule dans le bloc courant, pour la tete de lecture */
  elapsed: number
  shape: string
  color: string
  expression: string
}>()

const emit = defineEmits<{
  'update:blocks': [blocks: Block[]]
  /** date visee sur la regle */
  seek: [seconds: number]
  add: [state: StateId]
}>()

/** Curseur de lecture et loupe : la barre les affiche, la piste les manipule. */
const block = defineModel<number>('block', { required: true })
const zoom = defineModel<number>('zoom', { required: true })

const scale = computed(() => BASE_SCALE * zoom.value)
const total = computed(() => totalDuration(props.blocks))
const at = computed(() => offsetOf(props.blocks, block.value) + props.elapsed)
const ticks = computed(() => ticksFor(total.value, scale.value))
const exact = computed(() => secondes(at.value))

const track = ref<HTMLElement | null>(null)
/** Debordement de la piste, pour n'afficher les degrades que s'ils servent. */
const overflow = ref({ left: false, right: false })
/**
 * Defilement de la piste. L'infobulle de temps ne peut pas vivre dedans — le
 * conteneur rogne ce qui depasse en hauteur, et elle flotte au-dessus de la
 * regle — donc elle se positionne dehors, et doit retrancher ce defilement.
 */
const scrolled = ref(0)

function width(index: number) {
  return props.blocks[index]!.duration * scale.value
}

function label(index: number) {
  return t(`states.${props.blocks[index]!.state}`)
}

/* ------------------------------------------------------- defilement, loupe */

function onScroll() {
  const el = track.value
  if (!el) return
  scrolled.value = el.scrollLeft
  overflow.value = {
    left: el.scrollLeft > 4,
    right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4
  }
}

/**
 * Point d'ancrage du prochain changement d'echelle, en coordonnees d'ecran :
 * la seconde qui s'y trouve doit y rester. Sans ca, zoomer sur une carte
 * precise la fait fuir hors de l'ecran. `null` = le centre de ce qu'on voit,
 * c'est le bon compromis quand le zoom vient du curseur de la barre.
 */
let anchorX: number | null = null

function setZoom(next: number, clientX?: number) {
  anchorX = clientX ?? null
  zoom.value = clampZoom(next)
}

watch(scale, (now, before) => {
  const el = track.value
  if (!el) return
  const x = (anchorX ?? el.getBoundingClientRect().left + el.clientWidth / 2) -
    el.getBoundingClientRect().left
  const seconde = (el.scrollLeft + x) / before
  anchorX = null
  nextTick(() => {
    el.scrollLeft = seconde * now - x
    onScroll()
  })
})

/**
 * Molette et trackpad sur la piste :
 * - pincement du trackpad (le navigateur l'annonce comme une molette + `ctrl`,
 *   c'est la convention) ou `ctrl`/`cmd` + molette → loupe ;
 * - deux doigts a l'horizontale → defilement, c'est deja `deltaX` ;
 * - molette de souris, qui n'a pas d'axe horizontal → on renvoie son `deltaY`
 *   sur le defilement de la piste, sinon elle ne servirait a rien ici.
 * `deltaMode` vaut 1 quand le systeme compte en lignes et pas en pixels (des
 * souris sous Firefox) : sans le facteur, le geste serait quinze fois trop lent.
 */
function onWheel(e: WheelEvent) {
  const el = track.value
  if (!el) return
  const unit = e.deltaMode === 1 ? 16 : 1
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    setZoom(zoom.value * Math.exp((-e.deltaY * unit) / 180), e.clientX)
    return
  }
  if (el.scrollWidth <= el.clientWidth) return
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  if (!d) return
  e.preventDefault()
  el.scrollLeft += d * unit
}

onMounted(onScroll)
watch(() => [total.value, props.blocks] as const, () => nextTick(onScroll))

// La carte courante reste visible quand la piste deborde de la fenetre.
watch(block, () => {
  const el = track.value
  if (!el) return
  const x = offsetOf(props.blocks, block.value) * scale.value
  if (x < el.scrollLeft || x + width(block.value) > el.scrollLeft + el.clientWidth) {
    el.scrollTo({ left: Math.max(0, x - 24), behavior: 'smooth' })
  }
})

/* --------------------------------------------------------------- montage */

function removeBlock(index: number) {
  // la derniere carte ne part pas : un montage vide n'aurait rien a jouer
  if (props.blocks.length < 2) return
  emit(
    'update:blocks',
    props.blocks.filter((_, i) => i !== index)
  )
  // le curseur suit : une carte retiree avant lui le decale d'un cran, et il ne
  // doit jamais pointer au-dela de la piste
  if (index < block.value) block.value -= 1
  else if (block.value >= props.blocks.length - 1) block.value = props.blocks.length - 2
}

function setDuration(index: number, wanted: number) {
  const b = props.blocks[index]
  if (!b) return
  const duration = clampDuration(b.state, wanted)
  if (duration === b.duration) return
  emit(
    'update:blocks',
    props.blocks.map((old, i) => (i === index ? { ...old, duration } : old))
  )
}

/* ------------------------------------------------------ glisser / etirer */

/**
 * Glisser-deposer : pendant le geste, le montage n'est PAS modifie. La carte
 * saisie suit le pointeur et les autres s'ecartent de sa largeur — c'est ce qui
 * donne la sensation de deplacer un objet. Le montage n'est recompose qu'au
 * lacher : reordonner en direct ferait sauter la carte d'un emplacement a
 * l'autre sous le doigt.
 */
type Drag = { from: number; to: number; startX: number; dx: number; moved: boolean }
type Resize = { index: number; startX: number; startDuration: number }

const drag = ref<Drag | null>(null)
const resize = ref<Resize | null>(null)
const scrubbing = ref(false)

/** Decalage a appliquer a une carte pendant qu'on en deplace une autre. */
function shiftOf(i: number) {
  const d = drag.value
  if (!d?.moved) return 0
  if (i === d.from) return d.dx
  const w = width(d.from)
  if (d.to > d.from && i > d.from && i <= d.to) return -w
  if (d.to < d.from && i >= d.to && i < d.from) return w
  return 0
}

/** Vrai pour la carte qu'on est en train de deplacer : elle se souleve. */
function lifted(i: number) {
  return Boolean(drag.value?.moved) && i === drag.value?.from
}

/** Index de la carte sous une position, en secondes depuis le debut de la piste. */
function indexAt(t: number) {
  let acc = 0
  for (let i = 0; i < props.blocks.length; i++) {
    acc += props.blocks[i]!.duration
    if (t < acc) return i
  }
  return props.blocks.length - 1
}

function pointerSeconds(e: PointerEvent) {
  const box = track.value?.getBoundingClientRect()
  if (!box) return 0
  return (e.clientX - box.left + (track.value?.scrollLeft ?? 0)) / scale.value
}

function onBlockDown(index: number, e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag.value = { from: index, to: index, startX: e.clientX, dx: 0, moved: false }
}

function onBlockMove(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  // quelques pixels de tolerance : un clic tremble toujours un peu
  if (!d.moved && Math.abs(e.clientX - d.startX) <= 4) return
  d.moved = true
  d.dx = e.clientX - d.startX
  d.to = Math.max(0, indexAt(pointerSeconds(e)))
}

function onBlockUp(index: number) {
  const d = drag.value
  drag.value = null
  if (!d) return
  // un clic sans deplacement, c'est un saut de la tete de lecture
  if (!d.moved) {
    block.value = index
    return
  }
  if (d.to === d.from) return
  // le curseur suit la carte qu'on deplace, sinon la lecture sauterait ailleurs
  const suivi = block.value === d.from ? d.to : block.value
  emit('update:blocks', moveBlock(props.blocks, d.from, d.to))
  block.value = suivi
}

function onResizeDown(index: number, e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  resize.value = { index, startX: e.clientX, startDuration: props.blocks[index]!.duration }
}

function onResizeMove(e: PointerEvent) {
  const r = resize.value
  if (!r) return
  setDuration(r.index, r.startDuration + (e.clientX - r.startX) / scale.value)
}

/** Le clavier etire aussi : la poignee est un bouton, pas seulement une zone. */
function onResizeKey(index: number, delta: number) {
  setDuration(index, props.blocks[index]!.duration + delta)
}

/* -------------------------------------------------------------- au clavier */

/**
 * Reordonner et pointer AU CLAVIER.
 *
 * Le glisser-deposer n'avait aucun equivalent : on pouvait ajouter, supprimer et etirer un
 * bloc — la poignee gere deja les fleches — mais jamais le REORDONNER, et le pointage
 * precis n'existait qu'au pointeur, sur la regle. C'etait le seul geste de l'editeur
 * inaccessible.
 *
 * `Alt` + fleches deplace la carte, les fleches nues promenent la tete de lecture de `STEP`.
 * Alt et pas les fleches nues pour le deplacement : une carte est un bouton dans une liste,
 * et les fleches y servent d'abord a se deplacer.
 *
 * Le focus SUIT la carte deplacee, sinon on se retrouve a en pousser une autre au coup
 * suivant. Il faut attendre le rendu : la liste est recomposee, donc le bouton d'arrivee
 * n'existe pas encore.
 *
 * La carte porte `aria-keyshortcuts` : un raccourci que rien n'annonce n'est pas une
 * affordance. C'est l'attribut fait pour ca, et il evite d'allonger l'etiquette, qui est
 * relue a chaque carte de la piste.
 */
async function onCardKey(index: number, e: KeyboardEvent) {
  const sens = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
  if (!sens) return
  e.preventDefault()

  if (!e.altKey) {
    // pointage : la tete de lecture avance d'un pas, dans tout le montage
    emit('seek', Math.max(0, Math.min(total.value - 0.001, at.value + sens * STEP)))
    return
  }

  const cible = index + sens
  if (cible < 0 || cible >= props.blocks.length) return
  emit('update:blocks', moveBlock(props.blocks, index, cible))
  block.value = cible
  await nextTick()
  const liste = track.value?.querySelectorAll<HTMLButtonElement>('[data-carte]')
  liste?.[cible]?.focus()
}

/* ----------------------------------------------------------------- scrub */

function scrubTo(e: PointerEvent) {
  emit('seek', Math.max(0, Math.min(total.value - 0.001, pointerSeconds(e))))
}

function onRulerDown(e: PointerEvent) {
  // sans ca, promener la tete de lecture surligne les graduations au passage :
  // le navigateur demarre une selection de texte sur le `mousedown` induit
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  scrubbing.value = true
  scrubTo(e)
}

function onRulerMove(e: PointerEvent) {
  if (scrubbing.value) scrubTo(e)
}
</script>

<template>
  <div class="relative flex-1">
    <div
      ref="track"
      class="h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
      @scroll="onScroll"
      @wheel="onWheel"
    >
      <!-- la piste garde de la place pour la carte « + » a sa suite -->
      <div class="relative flex h-full flex-col" :style="{ width: `${total * scale + 76}px` }">
        <!--
          Regle graduee : elle sert aussi de zone de deplacement. On attrape
          n'importe ou dessus pour promener la tete de lecture, comme sur un
          montage video — c'est la seule facon d'atteindre un point PRECIS
          d'une carte, le clic sur une carte ne fait que sauter a son debut.
        -->
        <div
          class="relative h-7 shrink-0 cursor-ew-resize pt-1 select-none"
          @pointerdown="onRulerDown"
          @pointermove="onRulerMove"
          @pointerup="scrubbing = false"
          @pointercancel="scrubbing = false"
        >
          <span
            v-for="tick in ticks"
            :key="tick.t"
            class="absolute bottom-1.5 flex items-end gap-1"
            :style="{ transform: `translateX(${tick.t * scale}px)` }"
          >
            <span class="block w-px bg-[var(--line)]" :class="tick.major ? 'h-3' : 'h-1.5'" />
            <span v-if="tick.major" class="-mb-0.5 text-xs leading-none text-[var(--muted)]">
              {{ secondesCourtes(tick.t, Number.isInteger(tick.t) ? 0 : 1) }}
            </span>
          </span>
        </div>

        <ul class="flex flex-1 items-stretch">
          <!--
            La largeur du <li> vaut exactement la duree de la carte : la
            gouttiere est un padding interne, sinon les cartes decaleraient la
            piste et la tete de lecture ne tomberait plus en face.
          -->
          <li
            v-for="(b, i) in blocks"
            :key="`${i}-${b.state}`"
            class="group relative shrink-0 pr-1"
            :class="lifted(i) ? 'z-20' : 'transition-transform duration-150 ease-out'"
            :style="{
              width: `${b.duration * scale}px`,
              transform: shiftOf(i) ? `translateX(${shiftOf(i)}px)` : undefined
            }"
          >
            <button
              type="button"
              class="flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-lg px-1.5 py-1 text-left transition select-none active:cursor-grabbing"
              :class="[
                i === block
                  ? 'bg-white ring-2 ring-[var(--ink)] ring-inset'
                  : 'bg-black/[0.045] hover:bg-black/[0.08]',
                lifted(i) ? 'scale-[1.02] opacity-75 shadow-lg' : ''
              ]"
              :aria-label="t('timeline.blockAria', { state: label(i), duration: secondes(b.duration) })"
              :aria-current="i === block ? 'true' : undefined"
              @pointerdown="onBlockDown(i, $event)"
              @pointermove="onBlockMove"
              @pointerup="onBlockUp(i)"
              @pointercancel="drag = null"
              data-carte
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight"
              @keydown.enter.prevent="block = i"
              @keydown.space.prevent="block = i"
              @keydown.left="onCardKey(i, $event)"
              @keydown.right="onCardKey(i, $event)"
            >
              <!-- la miniature EST l'identite de la carte, comme la vignette
                   d'une page : le nom n'apprendrait rien de plus, il ne reste
                   que dans l'etiquette du bouton, pour le lecteur d'ecran -->
              <span class="flex min-w-0 flex-1 items-center justify-center">
                <BloubBot
                  v-if="width(i) > 44"
                  class="shrink-0"
                  :state="b.state"
                  :size="Math.min(56, Math.max(30, width(i) * 0.5))"
                  :shape="shape"
                  :color="color"
                  :expression="expression"
                  :paper="i === block ? '#ffffff' : '#f2f2f2'"
                  :frozen-at="POSES[b.state]"
                />
              </span>
              <span
                v-if="width(i) > 50"
                class="tronque text-center text-xs leading-none font-semibold tabular-nums"
                :class="i === block ? 'text-[var(--ink)]' : 'text-[var(--muted)]'"
              >
                {{ secondes(b.duration) }}
              </span>
            </button>

            <!-- poignee de duree : bouton a part entiere, donc utilisable au clavier -->
            <button
              type="button"
              class="absolute inset-y-2 right-0.5 w-1 cursor-ew-resize rounded-full bg-[var(--muted)] opacity-0 transition group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100"
              :aria-label="
                t('timeline.blockDurationAria', {
                  state: label(i),
                  duration: secondes(b.duration)
                })
              "
              @pointerdown="onResizeDown(i, $event)"
              @pointermove="onResizeMove"
              @pointerup="resize = null"
              @pointercancel="resize = null"
              @keydown.left.prevent="onResizeKey(i, -STEP)"
              @keydown.right.prevent="onResizeKey(i, STEP)"
            />
            <button
              v-if="blocks.length > 1"
              type="button"
              class="absolute top-1 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/10 text-[var(--ink)] opacity-0 transition group-hover:opacity-100 hover:bg-black/20 focus-visible:opacity-100"
              :aria-label="t('timeline.blockRemoveAria', { state: label(i) })"
              @click="removeBlock(i)"
            >
              <!-- croix dessinee : le glyphe « × » de la police ne tombe pas au
                   centre optique de la pastille -->
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                <path
                  d="M2.6 2.6 7.4 7.4M7.4 2.6 2.6 7.4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </li>

          <li class="w-[72px] shrink-0 pl-1">
            <BlockPicker
              :shape="shape"
              :color="color"
              :expression="expression"
              @pick="emit('add', $event)"
            />
          </li>
        </ul>

        <!--
          Tete de lecture : seule sa transformation change d'une image a l'autre,
          et elle vit dans la piste, donc elle defile avec elle. Sa poignee est
          dans la regle, la ou on l'attrape.
        -->
        <div
          class="pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-full bg-[var(--ink)]"
          :style="{ transform: `translateX(${at * scale}px)` }"
        >
          <span
            class="absolute -top-0.5 -left-[5px] h-3 w-3 rounded-full border-2 border-[var(--paper)] bg-[var(--ink)]"
          />
        </div>
      </div>
    </div>

    <!--
      Temps exact pendant le deplacement : au dixieme, la ou le compteur de la
      barre arrondit a la seconde. Il flotte au-dessus de la regle, donc hors du
      conteneur qui defile — d'ou le `scrolled` retranche.
    -->
    <div
      v-if="scrubbing"
      class="pointer-events-none absolute top-0 left-0 z-10"
      :style="{ transform: `translate(${at * scale - scrolled}px, -70%)` }"
    >
      <span
        class="block -translate-x-1/2 rounded-md bg-[var(--ink)] px-2 py-1 text-xs tabular-nums text-[var(--paper)] shadow-sm"
      >
        {{ exact }}
      </span>
    </div>

    <!-- degrades de debordement : la piste continue par la -->
    <div
      v-if="overflow.left"
      class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--paper)] to-transparent"
    />
    <div
      v-if="overflow.right"
      class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--paper)] to-transparent"
    />
  </div>
</template>
