<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef, watch } from 'vue'
import { NOTIF_BLUE } from '@/bot/decor'
import { BotEngine, type BotFrame } from '@/bot/engine'
import { clamp, r2 } from '@/bot/math'
import { t } from '@/i18n'
import BotHands from '@/components/BotHands.vue'
import {
  sweepLook,
  type GazeScript
} from '@/ui/gaze'
import {
  DEFAULT_EXPRESSION,
  EXPRESSION_BY_ID
} from '@/bot/expressions'
import {
  colorHex,
  DEFAULT_COLOR,
  DEFAULT_SHAPE,
  SHAPE_BY_ID,
  mixHex
} from '@/bot/skins'
import {
  mustachePath,
  mouthPath,
  type AccessoryKind,
  type AccessoryBlockSettings,
  type AccessoryLayout,
  type MouthStyle,
  type MustacheStyle
} from '@/ui/accessories'
import { eyeColorHex, glassesLensPath, type GlassesStyle } from '@/ui/glasses'
import { blockAt, defaultCycle, offsetOf, type Block } from '@/bot/cycles'
import { DEMI_VIEWBOX, RAYON } from '@/bot/repere'
import { type StateId } from '@/bot/states'
import { BACKGROUND_DIRECTIONS, type ExportBackground } from '@/ui/background'

type AccessorySelection = AccessoryKind

const emit = defineEmits<{
  accessorySelect: [kind: AccessorySelection]
}>()

const props = withDefaults(
  defineProps<{
    size?: number
    /** identifiant de forme du personnalisateur */
    shape?: string
    /** identifiant de couleur du personnalisateur */
    color?: string
    /** lunettes portees par le bot */
    glasses?: boolean
    showEyesWithGlasses?: boolean
    /** couleur libre ou identifiant de palette des lunettes */
    glassesColor?: string
    /** couleur libre de l'oeil */
    eyeColor?: string
    glassesStyle?: GlassesStyle
    glassesSize?: number
    mustache?: boolean
    mustacheColor?: string
    mustacheStyle?: MustacheStyle
    mouth?: boolean
    mouthColor?: string
    mouthStyle?: MouthStyle
    /** identifiant d'expression de repos du personnalisateur */
    expression?: string
    /** couleur du fond, utilisee pour la brume de profondeur des particules */
    paper?: string
    /** couleur, degrade ou image de fond derriere le personnage */
    backdrop?: ExportBackground
    /**
     * Fige le rendu a cette date (en secondes depuis le debut de l'etat).
     * Le moteur etant une fonction pure du temps, on obtient une image
     * reproductible au pixel pres, sans boucle d'animation : utile pour une
     * planche d'etats, une vignette de personnalisateur ou un test.
     */
    frozenAt?: number
    /**
     * Montage joue par le lecteur : une suite d'etats, chacun tenu la duree de
     * son bloc. Par defaut, le cycle releve sur la video.
     */
    cycle?: Block[]
    /** Fait tourner le regard horizontalement. */
    turnEyes?: boolean
    /** Affiche deux mains independantes sur les cotes du corps. */
    hands?: boolean
    /**
     * Regard scripte de l'arrivee : evalue a chaque image avec le temps ecoule
     * depuis qu'il a ete pose.
     */
    gaze?: GazeScript | null
  }>(),
  {
    size: 320,
    shape: DEFAULT_SHAPE,
    color: DEFAULT_COLOR,
    glasses: false,
    showEyesWithGlasses: false,
    glassesColor: '#202028',
    eyeColor: '#f9f9f9',
    glassesStyle: 'sun',
    glassesSize: 1,
    mustache: false,
    mustacheColor: '#75452d',
    mustacheStyle: 'classic',
    mouth: false,
    mouthColor: '#c96c73',
    mouthStyle: 'smile',
    expression: DEFAULT_EXPRESSION,
    paper: '#f9f9f9',
    backdrop: undefined,
    frozenAt: undefined,
    cycle: () => defaultCycle().blocks,
    turnEyes: false,
    hands: false,
    gaze: null
  }
)

/**
 * Le curseur de lecture est un **index de bloc**, pas un etat : un montage peut
 * jouer deux fois le meme etat, et il faut alors savoir dans lequel des deux on
 * se trouve. `state` suit le bloc courant — c'est une sortie, l'exterieur pilote
 * la lecture par `block`.
 */
const block = defineModel<number>('block', { default: 0 })
const state = defineModel<StateId>('state', { default: 'idle' })
const playing = defineModel<boolean>('playing', { default: false })
/** Temps ecoule dans le bloc courant, pour la tete de lecture de la timeline. */
const elapsed = defineModel<number>('elapsed', { default: 0 })
const accessoryLayoutModel = defineModel<AccessoryLayout>('accessoryLayout', {
  default: () => ({
    glasses: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
    mustache: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
    mouth: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
  })
})
const renderBlockIndex = ref(block.value)
const accessoryLayout = computed(
  () =>
    props.cycle[renderBlockIndex.value]?.accessoryLayouts?.[props.shape] ??
    accessoryLayoutModel.value
)
const blockAccessorySettings = computed<AccessoryBlockSettings>(
  () =>
    props.cycle[renderBlockIndex.value]?.accessorySettings?.[props.shape] ?? {}
)
const glassesEnabled = computed(
  () => blockAccessorySettings.value.glasses?.enabled ?? props.glasses
)
const showEyesWithGlasses = computed(
  () => blockAccessorySettings.value.glasses?.showEyes ?? props.showEyesWithGlasses
)
const mustacheEnabled = computed(
  () => blockAccessorySettings.value.mustache?.enabled ?? props.mustache
)
const mouthEnabled = computed(
  () => !mustacheEnabled.value && (blockAccessorySettings.value.mouth?.enabled ?? props.mouth)
)

// Le repere vient de `src/bot/` : c'est lui qui definit ce que le moteur rend, le
// composant n'en est qu'un client. Les noms courts restent, ils sont partout dans le
// gabarit.
const R = RAYON
const VB = DEMI_VIEWBOX

const shapeRadii = computed(() => SHAPE_BY_ID.get(props.shape)?.radii ?? null)
const referenceFaceEyes = computed(
  () =>
    new BotEngine(
      R,
      'idle',
      shapeRadii.value,
      EXPRESSION_BY_ID.get(props.expression) ?? null
    ).sample(1).eyes
)
const ink = computed(() => colorHex(props.color))
const glassesInk = computed(() =>
  colorHex(blockAccessorySettings.value.glasses?.color ?? props.glassesColor)
)
const glassesHighlight = computed(() => mixHex(glassesInk.value, '#ffffff', 0.56))
const glassesTint = computed(() => mixHex(glassesInk.value, '#000000', 0.72))
const eyeInk = computed(() => eyeColorHex(props.eyeColor))
const mustacheInk = computed(() =>
  colorHex(blockAccessorySettings.value.mustache?.color ?? props.mustacheColor)
)
const mouthInk = computed(() =>
  colorHex(blockAccessorySettings.value.mouth?.color ?? props.mouthColor)
)
const glassesScale = computed(() => clamp(props.glassesSize, 0.65, 1.45))
const lunettes = computed(() =>
  frame.value.eyes.map((eye) => {
    let width = Math.max(eye.width * 1.7, eye.height * 0.76) * glassesScale.value
    let height = Math.max(eye.height * 1.08, eye.width * 1.25) * glassesScale.value

    if (props.glassesStyle === 'round') {
      width = height = Math.max(width, height)
    } else if (props.glassesStyle === 'aviator') {
      width = Math.max(width, height * 0.92)
      height *= 1.16
    } else if (props.glassesStyle === 'catEye') {
      width *= 1.12
      height *= 0.96
    } else if (props.glassesStyle === 'wayfarer') {
      width *= 1.08
      height *= 1.04
    } else if (props.glassesStyle === 'sun') {
      width = Math.max(width * 1.12, height * 1.08)
      height *= 1.12
    }
    const milieu = (Math.min(...frame.value.eyes.map((item) => item.x)) +
      Math.max(...frame.value.eyes.map((item) => item.x))) / 2
    const outside = eye.x < milieu ? -1 : 1
    const side = outside < 0 ? 'left' : 'right'
    const offsetX = accessoryLayout.value.glasses[`${side}LensX`] ?? 0
    const offsetY = accessoryLayout.value.glasses[`${side}LensY`] ?? 0
    const matrix = eye.frameMatrix.match(/^matrix\(([^)]+)\)$/)
    const values = matrix?.[1]?.split(',').map(Number)
    const frameMatrix =
      values?.length === 6
        ? `matrix(${values[0]},${values[1]},${values[2]},${values[3]},${r2(values[4]! + offsetX)},${r2(values[5]! + offsetY)})`
        : eye.frameMatrix
    return { ...eye, x: eye.x + offsetX, y: eye.y + offsetY, frameMatrix, width, height, outside }
  })
)
const faceAccessories = computed(() => {
  if (frame.value.eyes.length !== 2) return null
  const [left, right] = [...frame.value.eyes].sort((a, b) => a.x - b.x)
  const centerX = (left!.x + right!.x) / 2
  const centerY = (left!.y + right!.y) / 2
  const [referenceLeft, referenceRight] = [...referenceFaceEyes.value].sort((a, b) => a.x - b.x)
  const eyeWidth = (referenceLeft!.width + referenceRight!.width) / 2
  const eyeHeight = (referenceLeft!.height + referenceRight!.height) / 2
  const eyeGap = referenceRight!.x - referenceLeft!.x
  const mustacheWidth = Math.max(eyeGap + eyeWidth * 1.8, eyeWidth * 3.6)
  const rotation = (eye: BotFrame['eyes'][number]) => {
    const match = /^matrix\(([^,]+),([^,]+)/.exec(eye.frameMatrix)
    return match ? Math.atan2(Number(match[2]), Number(match[1])) : 0
  }
  const angles = [rotation(left!), rotation(right!)]
  const angle = Math.atan2(
    Math.sin(angles[0]!) + Math.sin(angles[1]!),
    Math.cos(angles[0]!) + Math.cos(angles[1]!)
  )
  const glasses = accessoryLayout.value.glasses
  const glassesAngle = (glasses.rotation * Math.PI) / 180
  const glassesCos = Math.cos(glassesAngle)
  const glassesSin = Math.sin(glassesAngle)
  const glassesA = glassesCos * glasses.width
  const glassesB = glassesSin * glasses.width
  const glassesC = -glassesSin * glasses.height
  const glassesD = glassesCos * glasses.height
  const glassesCenterX = (left!.x + right!.x) / 2
  const glassesCenterY = (left!.y + right!.y) / 2
  const mustache = accessoryLayout.value.mustache
  const mouth = accessoryLayout.value.mouth
  const faceMatrix = (placement: typeof mustache, x: number, y: number, sx: number, sy: number) => {
    const placementAngle = angle + (placement.rotation * Math.PI) / 180
    const cos = Math.cos(placementAngle)
    const sin = Math.sin(placementAngle)
    const a = cos * sx
    const b = sin * sx
    const c = -sin * sy
    const d = cos * sy
    const faceCos = Math.cos(angle)
    const faceSin = Math.sin(angle)
    const offsetX = faceCos * placement.x - faceSin * placement.y
    const offsetY = faceSin * placement.x + faceCos * placement.y
    return `matrix(${r2(a)},${r2(b)},${r2(c)},${r2(d)},${r2(x + offsetX)},${r2(y + offsetY)})`
  }

  return {
    glassesTransform: `matrix(${r2(glassesA)},${r2(glassesB)},${r2(glassesC)},${r2(glassesD)},${r2(glassesCenterX + glasses.x - glassesA * glassesCenterX - glassesC * glassesCenterY)},${r2(glassesCenterY + glasses.y - glassesB * glassesCenterX - glassesD * glassesCenterY)})`,
    mustacheTransform: faceMatrix(
      mustache,
      centerX,
      centerY + eyeHeight * 1.05,
      (mustacheWidth / 100) * mustache.width,
      (Math.max(eyeHeight * 0.9, 12) / 40) * mustache.height
    ),
    mouthTransform: faceMatrix(
      mouth,
      centerX,
      centerY + eyeHeight * 1.05,
      (Math.max(eyeGap * 0.62, eyeWidth * 1.5) / 100) * mouth.width,
      (Math.max(eyeHeight * 0.42, 8) / 40) * mouth.height
    )
  }
})

type LensSide = 'left' | 'right'
type AccessoryDrag = {
  kind: AccessorySelection
  lensSide?: LensSide
  pointerId: number
  x: number
  y: number
}
let accessoryDrag: AccessoryDrag | null = null
const svg = ref<SVGSVGElement | null>(null)

function svgPoint(event: PointerEvent) {
  const element = svg.value
  const matrix = element?.getScreenCTM()
  if (!element || !matrix) return null
  const point = element.createSVGPoint()
  point.x = event.clientX
  point.y = event.clientY
  return point.matrixTransform(matrix.inverse())
}

function accessoryPoint(event: PointerEvent) {
  return svgPoint(event)
}

function startAccessoryDrag(kind: AccessorySelection, event: PointerEvent, lensSide?: LensSide) {
  if (props.frozenAt !== undefined || event.button !== 0) return
  const element = svg.value
  const point = accessoryPoint(event)
  if (!element || !point) return
  event.preventDefault()
  event.stopPropagation()
  emit('accessorySelect', kind)
  accessoryDrag = { kind, lensSide, pointerId: event.pointerId, x: point.x, y: point.y }
  element.setPointerCapture(event.pointerId)
}

function moveAccessory(event: PointerEvent) {
  if (!accessoryDrag || accessoryDrag.pointerId !== event.pointerId) return
  const point = accessoryPoint(event)
  if (!point) return
  const current = accessoryLayout.value[accessoryDrag.kind]
  const deltaX = point.x - accessoryDrag.x
  const deltaY = point.y - accessoryDrag.y
  const placement = accessoryDrag.lensSide
    ? {
        ...current,
        [`${accessoryDrag.lensSide}LensX`]:
          accessoryDrag.lensSide === 'left'
            ? clamp((current.leftLensX ?? 0) + deltaX, -60, 60)
            : clamp((current.rightLensX ?? 0) + deltaX, -60, 60),
        [`${accessoryDrag.lensSide}LensY`]:
          accessoryDrag.lensSide === 'left'
            ? clamp((current.leftLensY ?? 0) + deltaY, -60, 60)
            : clamp((current.rightLensY ?? 0) + deltaY, -60, 60)
      }
    : {
        ...current,
        x: clamp(current.x + deltaX, -90, 90),
        y: clamp(current.y + deltaY, -90, 90)
      }
  accessoryLayoutModel.value = {
    ...accessoryLayout.value,
    [accessoryDrag.kind]: placement
  }
  accessoryDrag.x = point.x
  accessoryDrag.y = point.y
}

function endAccessoryDrag(event: PointerEvent) {
  if (accessoryDrag?.pointerId === event.pointerId) accessoryDrag = null
}
const pont = computed(() => {
  if (lunettes.value.length !== 2) return null
  const [gauche, droite] = [...lunettes.value].sort((a, b) => a.x - b.x)
  const x1 = gauche!.x + gauche!.width * 0.47
  const x2 = droite!.x - droite!.width * 0.47
  const milieu = (x1 + x2) / 2
  const y = (gauche!.y + droite!.y) / 2 - glassesScale.value * 3
  return `M${r2(x1)} ${r2(gauche!.y)} Q${r2(milieu)} ${r2(y)} ${r2(x2)} ${r2(droite!.y)}`
})
const expression = computed(() => EXPRESSION_BY_ID.get(props.expression) ?? null)

const engine = new BotEngine(R, state.value, shapeRadii.value, expression.value)
const frame = shallowRef<BotFrame>(engine.sample(props.frozenAt ?? 0))
const handTime = ref(props.frozenAt ?? 0)
const uid = Math.random().toString(36).slice(2, 8)
const backgroundGradientId = `${uid}-background-gradient`
const backgroundClipId = `${uid}-background-clip`
const backgroundGradientDirection = computed(() =>
  BACKGROUND_DIRECTIONS[props.backdrop?.direction ?? 'diagonal']
)
const maskId = `bot-mask-${uid}`
const glassesClipId = `bot-glasses-${uid}`

let raf = 0
let nextAt = Infinity
let last = 0
let clock = 0
/** Date d'horloge a laquelle le bloc courant a commence. */
let blockStart = 0

/**
 * Pose le bloc `i` : etat, moteur, et date de fin. Appele aussi bien par la
 * boucle que par le watcher, d'ou l'absence d'effet de bord sur `block` — c'est
 * l'appelant qui decide s'il deplace le curseur.
 */
function apply(i: number, from = 0) {
  const b = props.cycle[i]
  if (!b) {
    nextAt = Infinity
    return
  }
  renderBlockIndex.value = i
  blockStart = clock - from
  elapsed.value = from
  state.value = b.state
  engine.setState(b.state, clock)
  nextAt = playing.value ? blockStart + b.duration : Infinity
}

/** Deplace le curseur et recale le moteur dans la foulee, sans passer par le watcher. */
function goToBlock(i: number) {
  block.value = i
  apply(i)
}

/**
 * Deplacement de la tete de lecture depuis la timeline : on tombe au milieu d'un
 * bloc, pas a son debut. L'offset transite par une variable plutot que par un
 * appel direct a `apply` : changer `block` declenchera le watcher, qui doit
 * poser la meme date que nous — sinon il remettrait le bloc a zero juste apres.
 */
let pendingOffset = 0

function seek(index: number, offset = 0) {
  if (block.value === index) {
    apply(index, offset)
    return
  }
  pendingOffset = offset
  block.value = index
}

/**
 * Rend le MONTAGE a la date absolue `t`, sans horloge. C'est ce qui permet de
 * capturer un cycle entier hors ecran, image par image et plus vite que le temps
 * reel.
 *
 * Pourquoi une methode a part, et pas `frozenAt` : `frozenAt` fige le temps DANS
 * l'etat courant, il ne parcourt pas les blocs. Et passer par `seek` ne suffirait
 * pas — `apply` cale le moteur sur `clock`, qui n'avance que dans la boucle et
 * reste donc a zero en mode fige. Tous les changements d'etat s'enregistreraient
 * a l'instant 0, et les fondus aux jointures de blocs seraient faux.
 *
 * D'ou le `setState` a l'offset ABSOLU du bloc : le moteur date ainsi la
 * transition la ou elle a vraiment lieu dans le cycle, et `sample(t)` retombe sur
 * la meme image que la lecture temps reel aurait produite.
 */
let dernierBloc = -1

function rendAt(t: number) {
  const blocs = props.cycle
  if (!blocs.length) return
  const { index } = blockAt(blocs, t)
  renderBlockIndex.value = index
  if (index !== dernierBloc) {
    const b = blocs[index]!
    state.value = b.state
    /*
     * Un RETOUR EN ARRIERE repart sans historique, la ou une avancee normale garde l'etat
     * quitte pour le fondre. Sans cette distinction, rejouer l'image 0 apres une passe
     * complete datait le premier etat a l'instant 0 avec le DERNIER en etat precedent, et
     * rendait donc la pose de celui-la : l'export GIF, qui fait deux passes, s'ouvrait sur
     * une boule sans yeux. Le lecteur est ainsi idempotent, et une passe peut etre rejouee
     * autant de fois qu'on veut.
     */
    if (index < dernierBloc) engine.reset(b.state, offsetOf(blocs, index))
    else engine.setState(b.state, offsetOf(blocs, index))
    dernierBloc = index
  }
  if (props.turnEyes) engine.setLook(sweepLook(t), t - SCRIPT_MORPH, SCRIPT_MORPH)
  handTime.value = t
  frame.value = engine.sample(t)
  triggerRef(frame)
}

defineExpose({ seek, rendAt })

/* ------------------------------------------------- regard d'arrivee */

/** Date d'horloge a laquelle le script de regard a ete pose. */
let gazeSince = 0
/** true = un script tourne, donc il y a de quoi relacher. */
let scripted = false

/**
 * Rattrapage court : le script EST l'animation, et laisser le moteur en lisser
 * une seconde par-dessus
 * retarderait son depart d'un quart de seconde — un script qui commence par
 * regarder au loin verrait ses yeux partir de la pose, y revenir, puis repartir.
 *
 * Non nul quand meme : a zero, `lookAtTime` divise zero par zero a l'image ou la
 * cible est posee, et un `NaN` s'installe dans le moteur pour de bon.
 */
const SCRIPT_MORPH = 1 / 60

/**
 * Le script decide de tout, y compris de sa duree : on ne fait que lui donner le
 * temps ecoule.
 */
function scriptedGaze(run: GazeScript) {
  engine.setLook(run(clock - gazeSince), clock, SCRIPT_MORPH)
}

/**
 * Depart et relachement du script. `immediate` parce que la page s'ouvre DEJA en
 * arrivee — c'est meme son seul usage — et le relachement parce qu'un script
 * coupe avant sa fin (bloc raccourci, changement de vue) laisserait sinon les
 * yeux figes la ou il s'est arrete : le moteur GARDE la derniere cible.
 */
watch(
  () => props.gaze,
  (run) => {
    if (run) {
      gazeSince = clock
      scripted = true
      /*
       * Valeur de depart posee DATEE D'UN RATTRAPAGE PLUS TOT, pour qu'elle soit
       * deja pleinement appliquee a la premiere image.
       *
       * Sans ca, le moteur rend la premiere image avec le regard neutre et la
       * seconde avec celui du script : les yeux sautent d'un coup entre les deux.
       * Discret pour un script qui commence au repos, spectaculaire pour un qui
       * commence en regardant au loin — 127 px d'un coup sur une boule de 100 de
       * rayon, ce qui est exactement le defaut que ces scripts corrigent.
       */
      engine.setLook(run(0), clock - SCRIPT_MORPH, SCRIPT_MORPH)
      return
    }
    if (!scripted) return
    engine.setLook(null, clock)
    scripted = false
  },
  { immediate: true }
)

function tick(ms: number) {
  raf = requestAnimationFrame(tick)
  // Horloge de scene a delta borne : un onglet masque puis reaffiche reprend
  // sans sauter en avant (rAF est suspendu pendant ce temps-la).
  const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0
  last = ms
  clock += dt

  // Le stop ne gele pas l'horloge : arrete, le bot continue de respirer et de
  // cligner. Seuls l'enchainement du montage et la tete de lecture sont
  // suspendus.
  if (playing.value) {
    if (clock >= nextAt && props.cycle.length) {
      goToBlock((block.value + 1) % props.cycle.length)
    } else {
      elapsed.value = clock - blockStart
    }
  }

  if (props.gaze) scriptedGaze(props.gaze)
  else if (props.turnEyes) engine.setLook(sweepLook(clock), clock - SCRIPT_MORPH, SCRIPT_MORPH)

  handTime.value = clock
  frame.value = engine.sample(clock)
  triggerRef(frame)
}

/** Redessine sans la boucle : sert aux vignettes figees quand la forme change. */
function redrawFrozen() {
  if (props.frozenAt === undefined) return
  handTime.value = props.frozenAt
  engine.setLook(
    props.turnEyes ? sweepLook(props.frozenAt) : null,
    props.frozenAt - SCRIPT_MORPH,
    SCRIPT_MORPH
  )
  frame.value = engine.sample(props.frozenAt)
  triggerRef(frame)
}

// Curseur deplace de l'exterieur : clic sur un bloc de la timeline. Quand c'est
// `goToBlock` qui l'a bouge, `apply` est deja passe et repasse ici sans effet
// (setState sort si l'etat n'a pas change, la date de fin est la meme).
watch(block, (i) => {
  apply(i, pendingOffset)
  pendingOffset = 0
})

// Changement d'etat venu d'une prop : c'est le cas des vignettes figees, qui
// n'ont pas de curseur. En lecture, `apply` a deja fait le travail.
//
// Le garde n'est pas une optimisation, il corrompait une image a CHAQUE jointure
// de bloc a l'export : `rendAt` pose l'etat sur le moteur a son offset ABSOLU
// puis echantillonne a la bonne date, mais le watcher — dont la file est videe
// par le `nextTick` de l'export — repassait ensuite un `redrawFrozen()` non
// inerte (le lecteur hors ecran est monte avec `frozenAt: 0`). Or `sample(0)`
// juste apres un changement date a l'offset donne un ratio de melange nul, donc
// la pose de l'etat PRECEDENT : le point d'exclamation revenait au depart de sa
// course pendant une image, treize fois dans le montage par defaut.
watch(state, (id) => {
  // `rendAt` ou `apply` l'a deja applique, et a la bonne date
  if (engine.state === id) return
  engine.setState(id, clock)
  redrawFrozen()
})

// Reprise la ou la tete de lecture s'est arretee, pas au debut du bloc.
watch(playing, (on) => {
  if (on) apply(block.value, elapsed.value)
  else nextAt = Infinity
})

// Le montage a change sous nos pieds : bloc supprime, duree tiree, autre cycle
// choisi. On garde le curseur dans les bornes et on recale la date de fin sur
// la nouvelle duree — si le bloc a ete raccourci sous la position courante, la
// boucle passe au suivant des la frame suivante, ce qui est le comportement
// voulu.
watch(
  () => props.cycle,
  (blocks) => {
    if (!blocks.length) {
      nextAt = Infinity
      return
    }
    const i = Math.min(block.value, blocks.length - 1)
    if (i !== block.value) {
      goToBlock(i)
      return
    }
    nextAt = playing.value ? blockStart + blocks[i]!.duration : Infinity
  }
)

watch(shapeRadii, (radii) => {
  // on passe l'horloge : le moteur morphe vers la nouvelle forme au lieu de
  // l'appliquer d'un coup
  engine.setShape(radii, clock)
  redrawFrozen()
})

watch(expression, (expr) => {
  engine.setExpression(expr, clock)
  redrawFrozen()
})

/**
 * Deplacer `frozenAt` redessine. La prop ne servait qu'a poser une vignette une
 * fois pour toutes, donc personne ne la bougeait ; l'export anime, lui, avance
 * image par image sur une instance hors ecran. Sans ce watcher elle reste sur sa
 * premiere image et l'animation exportee ne bouge pas.
 */
watch(() => props.frozenAt, redrawFrozen)
watch(
  () => props.turnEyes,
  (active) => {
    if (props.frozenAt !== undefined) {
      redrawFrozen()
      return
    }
    engine.setLook(active ? sweepLook(clock) : null, clock, SCRIPT_MORPH)
  }
)

onMounted(() => {
  if (props.frozenAt !== undefined) return
  // le curseur peut arriver deja pose (URL, cycle relu du stockage)
  apply(block.value, elapsed.value)
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
})

/**
 * Un point est un simple disque, sauf quand l'etat fournit une forme (la
 * goutte du "!" penche) : le path est alors en unites de rayon de boule et
 * centre sur l'origine, donc on le pose avec translate/rotate/scale.
 *
 * La couleur suit celle du corps par defaut ; `depth` sert aux particules, qui
 * se fondent dans le fond a mesure qu'elles s'eloignent.
 */
function dotAttrs(dot: BotFrame['dots'][number]) {
  const fill =
    dot.color ?? (dot.depth === undefined ? ink.value : mixHex(props.paper, ink.value, dot.depth))
  const common = { fill, opacity: dot.opacity }
  return dot.d
    ? {
        ...common,
        d: dot.d,
        transform: `translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})`
      }
    : { ...common, cx: dot.x, cy: dot.y, r: dot.r }
}
</script>

<template>
  <svg
    ref="svg"
    :width="props.size"
    :height="props.size"
    :viewBox="`${-VB} ${-VB} ${VB * 2} ${VB * 2}`"
    role="img"
    :aria-label="t('app.botAria')"
    @pointermove="moveAccessory"
    @pointerup="endAccessoryDrag"
    @pointercancel="endAccessoryDrag"
  >
    <image
      v-if="props.backdrop?.mode === 'image' && props.backdrop.image"
      :href="props.backdrop.image"
      :x="-VB"
      :y="-VB"
      :width="VB * 2"
      :height="VB * 2"
      preserveAspectRatio="xMidYMid slice"
      :clip-path="`url(#${backgroundClipId})`"
    />
    <rect
      v-else-if="props.backdrop?.mode === 'color'"
      :x="-VB"
      :y="-VB"
      :width="VB * 2"
      :height="VB * 2"
      :fill="props.backdrop.color"
      :clip-path="`url(#${backgroundClipId})`"
    />
    <rect
      v-else-if="props.backdrop?.mode === 'gradient'"
      :x="-VB"
      :y="-VB"
      :width="VB * 2"
      :height="VB * 2"
      :fill="`url(#${backgroundGradientId})`"
      :clip-path="`url(#${backgroundClipId})`"
    />
    <defs>
      <clipPath :id="backgroundClipId" clipPathUnits="userSpaceOnUse">
        <rect
          data-background-frame
          :x="-VB"
          :y="-VB"
          :width="VB * 2"
          :height="VB * 2"
          rx="10"
        />
      </clipPath>
      <linearGradient
        :id="backgroundGradientId"
        gradientUnits="userSpaceOnUse"
        :x1="backgroundGradientDirection.x1"
        :y1="backgroundGradientDirection.y1"
        :x2="backgroundGradientDirection.x2"
        :y2="backgroundGradientDirection.y2"
      >
        <stop offset="0" :stop-color="props.backdrop?.color ?? '#f4f1eb'" />
        <stop offset="1" :stop-color="props.backdrop?.secondColor ?? '#c9d9f2'" />
      </linearGradient>
      <!--
        Les yeux sont de vrais trous perces dans le corps (comme sur x.ai), pas
        des formes blanches posees dessus : ils restent donc automatiquement
        rognes par la silhouette quand ils glissent vers le bord.
      -->
      <mask
        :id="maskId"
        maskUnits="userSpaceOnUse"
        :x="-VB"
        :y="-VB"
        :width="VB * 2"
        :height="VB * 2"
      >
        <path :d="frame.bodyPath" fill="#fff" />
        <path
          v-if="!glassesEnabled"
          v-for="(eye, i) in frame.eyes"
          :key="i"
          :d="eye.d"
          :transform="eye.matrix"
          :opacity="eye.alpha"
          fill="#000"
        />
        <circle
          v-if="frame.notch"
          :cx="frame.notch.x"
          :cy="frame.notch.y"
          :r="frame.notch.r"
          fill="#000"
        />
      </mask>
      <clipPath :id="glassesClipId">
        <path :d="frame.bodyPath" />
      </clipPath>

      <linearGradient
        v-for="arc in frame.arcs"
        :id="`${uid}-${arc.id}`"
        :key="arc.id"
        gradientUnits="userSpaceOnUse"
        :x1="arc.grad.x1"
        :y1="arc.grad.y1"
        :x2="arc.grad.x2"
        :y2="arc.grad.y2"
      >
        <stop
          v-for="(c, i) in arc.grad.stops"
          :key="i"
          :offset="i / (arc.grad.stops.length - 1)"
          :stop-color="c"
        />
      </linearGradient>
    </defs>

    <!-- moitie arriere des orbites : dessinee avant le corps, donc occultee -->
    <g fill="none" stroke-linecap="round">
      <path
        v-for="arc in frame.arcs"
        :key="`b${arc.id}`"
        :d="arc.back"
        :stroke="`url(#${uid}-${arc.id})`"
        :stroke-width="arc.width"
        :opacity="arc.opacity"
      />
    </g>

    <!-- particules de l'eclatement : elles passent derriere le noyau -->
    <g v-if="frame.dotsBehind">
      <component
        :is="dot.d ? 'path' : 'circle'"
        v-for="(dot, i) in frame.dots"
        :key="`pb${i}`"
        v-bind="dotAttrs(dot)"
      />
    </g>

    <g :opacity="frame.bodyAlpha">
      <!--
        Fond opaque a la forme exacte du corps, sous le corps lui-meme.

        Les yeux sont des TROUS perces dans le corps, pas des formes blanches
        posees dessus : c'est ce qui les fait rogner tout seuls au bord de la
        silhouette, et ca ne change pas. Mais un trou laisse voir ce qui est
        dessine derriere — or la moitie arriere des anneaux et les particules de
        l'eclatement le sont justement, pour etre occultees par le corps. Sans ce
        fond, un anneau qui passe derriere la boule reapparait DANS les yeux.

        Rempli avec `paper` et non en blanc pur : c'est exactement ce que les yeux
        laissaient voir jusqu'ici, le fond de la page. Les mettre en blanc les
        rendrait plus clairs que le fond, ce qui se verrait sur une grande boule.
      -->
      <path :d="frame.bodyPath" :fill="props.paper" />
      <g :mask="`url(#${maskId})`">
        <rect :x="-VB" :y="-VB" :width="VB * 2" :height="VB * 2" :fill="ink" />
      </g>
    </g>

    <BotHands
      v-if="props.hands"
      :color="ink"
      :radius="R"
      :time="handTime"
    />

    <g v-if="!glassesEnabled || showEyesWithGlasses" :clip-path="`url(#${glassesClipId})`" :opacity="frame.bodyAlpha">
      <path
        v-for="(eye, i) in frame.eyes"
        :key="i"
        data-eye-color
        :d="eye.d"
        :transform="eye.matrix"
        :opacity="eye.alpha"
        :fill="eyeInk"
      />
    </g>

    <g
      v-if="mustacheEnabled && faceAccessories"
      data-accessory-part
      data-accessory-kind="mustache"
      :clip-path="`url(#${glassesClipId})`"
      :transform="faceAccessories.mustacheTransform"
      :opacity="frame.bodyAlpha"
      class="cursor-grab touch-none active:cursor-grabbing"
      @pointerdown="startAccessoryDrag('mustache', $event)"
    >
      <path
        :d="mustachePath(props.mustacheStyle, accessoryLayout.mustache.curve, accessoryLayout.mustache.roundness)"
        :fill="mustacheInk"
        data-accessory-color="mustache"
      />
    </g>
    <g
      v-if="mouthEnabled && faceAccessories"
      data-accessory-part
      data-accessory-kind="mouth"
      :clip-path="`url(#${glassesClipId})`"
      :transform="faceAccessories.mouthTransform"
      :opacity="frame.bodyAlpha"
      class="cursor-grab touch-none active:cursor-grabbing"
      @pointerdown="startAccessoryDrag('mouth', $event)"
    >
      <path
        :d="mouthPath(props.mouthStyle, accessoryLayout.mouth.curve, accessoryLayout.mouth.roundness)"
        :fill="mouthInk"
        data-accessory-color="mouth"
      />
    </g>
    <g
      v-if="glassesEnabled && lunettes.length"
      data-accessory-kind="glasses"
      :transform="faceAccessories?.glassesTransform"
      :clip-path="`url(#${glassesClipId})`"
      fill="none"
      :stroke="glassesInk"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="cursor-grab touch-none active:cursor-grabbing"
      @pointerdown="startAccessoryDrag('glasses', $event)"
    >
      <path v-if="pont" :d="pont" :stroke-width="3.5 * glassesScale" />
      <path
        v-if="pont"
        :d="pont"
        :stroke="glassesHighlight"
        :stroke-width="1.1 * glassesScale"
        stroke-opacity="0.6"
      />
      <g
        v-for="(eye, i) in lunettes"
        :key="i"
        data-glass-lens
        :transform="eye.frameMatrix"
        :opacity="eye.alpha"
        class="cursor-grab touch-none active:cursor-grabbing"
        @pointerdown="startAccessoryDrag('glasses', $event, eye.outside < 0 ? 'left' : 'right')"
      >
        <path
          :d="`M${eye.outside * eye.width * 0.47} ${-eye.height * 0.12} Q${eye.outside * eye.width * 0.7} ${-eye.height * 0.22} ${eye.outside * eye.width * 0.88} ${eye.height * 0.03}`"
          :stroke-width="3.2 * glassesScale"
        />
        <path
          v-if="props.glassesStyle === 'sun'"
          data-sunglasses-lens
          :d="glassesLensPath(props.glassesStyle, eye.width, eye.height, eye.outside < 0)"
          :fill="glassesTint"
          :fill-opacity="showEyesWithGlasses ? 0.42 : 0.96"
          stroke="none"
        />
        <path
          v-else
          :d="glassesLensPath(props.glassesStyle, eye.width, eye.height, eye.outside < 0)"
          :fill="glassesInk"
          fill-opacity="0.045"
          stroke="none"
        />
        <path
          data-glass-frame
          :d="glassesLensPath(props.glassesStyle, eye.width, eye.height, eye.outside < 0)"
          :stroke-width="(props.glassesStyle === 'sun' ? 4 : 3.5) * glassesScale"
        />
        <path
          :d="`M${-eye.width * 0.3} ${-eye.height * 0.3} Q0 ${-eye.height * 0.48} ${eye.width * 0.29} ${-eye.height * 0.3}`"
          :stroke="glassesHighlight"
          :stroke-width="1.15 * glassesScale"
          stroke-opacity="0.78"
        />
      </g>
    </g>
    <g v-if="!frame.dotsBehind">
      <component
        :is="dot.d ? 'path' : 'circle'"
        v-for="(dot, i) in frame.dots"
        :key="`pf${i}`"
        v-bind="dotAttrs(dot)"
      />
    </g>

    <circle
      v-if="frame.notif"
      :cx="frame.notif.x"
      :cy="frame.notif.y"
      :r="frame.notif.r"
      :fill="NOTIF_BLUE"
    />

    <!-- moitie avant des orbites -->
    <g fill="none" stroke-linecap="round">
      <path
        v-for="arc in frame.arcs"
        :key="`f${arc.id}`"
        :d="arc.front"
        :stroke="`url(#${uid}-${arc.id})`"
        :stroke-width="arc.width"
        :opacity="arc.opacity"
      />
    </g>
  </svg>
</template>
