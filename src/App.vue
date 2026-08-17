<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BotTile from '@/components/BotTile.vue'
import Customizer from '@/components/Customizer.vue'
import BloubBot from '@/components/BloubBot.vue'
import ExportBar from '@/components/ExportBar.vue'
import CycleDialog from '@/components/CycleDialog.vue'
import GifDialog from '@/components/GifDialog.vue'
import Settings from '@/components/Settings.vue'
import SideRail, { type ViewId } from '@/components/SideRail.vue'
import Timeline from '@/components/Timeline.vue'
import { nomDeCycle, t } from '@/i18n'
import {
  copie,
  copieTexte,
  cycleVersGif,
  cycleVersMp4,
  svgAutonome,
  telecharge,
  versGifAnime,
  versPng,
  versSvgAnime
} from '@/ui/capture'
import {
  ACTION_BY_ID,
  ANIM_IMAGES,
  ANIM_PAS,
  CYCLE_TAILLE,
  FOND_GIF_DEFAUT,
  FORMAT_CYCLE_DEFAUT,
  GIF_IMAGES,
  GIF_PAS,
  BLANC,
  Abandon,
  couleurDeFond,
  cycleImages,
  cyclePas,
  nomFichier,
  type ActionId,
  type EtatExport,
  type FondGif,
  type FormatCycle
} from '@/ui/export'
import { HUMEURS } from '@/ui/gaze'
import { INTRO, INTRO_GAZE, POSE_AT, introDue } from '@/ui/intro'
import { ecris, lis, type NomStocke } from '@/ui/stockage'
import {
  blockAt,
  blocksWith,
  defaultCycle,
  makeBlock,
  parseCycles,
  totalDuration,
  type Cycle
} from '@/bot/cycles'
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@/bot/expressions'
import { COLOR_BY_ID, DEFAULT_COLOR, DEFAULT_SHAPE, SHAPE_BY_ID } from '@/bot/skins'
import { POSES, SEQUENCE, STATES, type StateId } from '@/bot/states'

/**
 * L'URL pilote la vue : `#etat=orbit&stop` ouvre un etat precis sequence a
 * l'arret, `#planche` affiche la planche. On relit a chaque `hashchange` pour
 * que les boutons precedent/suivant du navigateur fonctionnent vraiment.
 */
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1))
  const asked = params.get('etat') as StateId | null
  // on ne fait jamais confiance a l'URL : l'etat doit exister
  const known = STATES.some((s) => s.id === asked)
  return {
    state: known ? asked! : 'idle',
    named: known,
    playing: !params.has('stop'),
    gallery: params.has('planche'),
    // `#arrivee` : rejouer l'arrivee sans avoir a revenir sur le site. Elle ne se
    // joue qu'a la VENUE, donc sans ce lien on ne peut pas la revoir de la seance.
    arrivee: params.has('arrivee')
  }
}

const initial = readHash()
const gallery = ref(initial.gallery)

/* ----------------------------------------------------------------- arrivee */

/**
 * L'arrivee sur le site. Le montage et les quatre raisons de ne pas la jouer sont
 * dans `@/ui/intro` ; ici on ne fait que lire l'etat du navigateur et brancher.
 *
 * « Venir » sur le site, c'est le navigateur qui le sait, pas nous : `navigate`
 * couvre l'URL saisie, le lien suivi et le nouvel onglet, la ou `reload` et
 * `back_forward` sont des retours sur une page qu'on avait deja. Rien ne part
 * donc au stockage — une marque persistante eteindrait l'arrivee pour toujours
 * apres une seule visite, ce qui n'est pas la demande.
 *
 * Le repli sur `navigate` sert aux navigateurs qui ne renseignent pas l'entree :
 * dans le doute on joue, plutot que de ne jamais rien montrer.
 */
/**
 * « Mouvement reduit » demande par le systeme, SUIVI et pas lu une seule fois.
 *
 * Le reglage change en cours de session — c'est meme l'usage : on l'active quand quelque
 * chose gene. Un `matches` lu au `setup` ignorait ce changement jusqu'au rechargement.
 *
 * Ce qu'il coupe est de la DECORATION : les transitions de boites et le tourbillon
 * d'entree des reglages, choisi et non releve sur la video. Ce qu'il ne coupe pas est du
 * CONTENU : la respiration, la derive du regard et les clignements sont ce que le bot EST,
 * les retirer laisserait une image morte plutot qu'un mouvement apaise.
 */
const calmeQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const calme = ref(calmeQuery.matches)
calmeQuery.addEventListener('change', (e) => (calme.value = e.matches))

// `getEntriesByType` est type sur le `PerformanceEntry` generique, qui n'a pas de
// `type` : c'est l'entree de navigation qui le porte, d'ou l'annotation.
const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
const navigation = nav?.type ?? 'navigate'

const intro = ref(
  // `#arrivee` demande explicitement a la voir : il court-circuite la regle de
  // declenchement, c'est tout son objet — y compris apres rechargement, sinon on
  // ne pourrait la regarder qu'une fois.
  initial.arrivee ||
    introDue({
      named: initial.named,
      gallery: initial.gallery,
      rechargement: navigation !== 'navigate',
      calme: calme.value
    })
)

/* ------------------------------------------------------------------ cycles */

/**
 * Le montage releve sur la video n'est qu'une amorce : au premier lancement il
 * remplit la liste, ensuite les montages de l'utilisateur font foi — y compris
 * ses modifications de celui-la.
 */
const restored = parseCycles(lis('cycles'))
const cycles = ref<Cycle[]>(restored.length ? restored : [defaultCycle()])

/**
 * Ou trouver un etat pour les liens `#etat=` : dans le montage courant s'il y
 * est, sinon dans un autre. Aucun montage n'est fige, donc l'etat demande peut
 * tres bien avoir ete retire partout — auquel cas le lien ne s'applique pas.
 */
function locate(id: StateId) {
  const ordre = [cycle.value, ...cycles.value.filter((c) => c.id !== activeId.value)]
  for (const c of ordre) {
    const index = c.blocks.findIndex((b) => b.state === id)
    if (index >= 0) return { id: c.id, index }
  }
  return null
}

/**
 * Forme, couleur, expression et cycle survivent au rechargement : c'est l'avatar
 * de l'utilisateur, pas un reglage de session. On valide au chargement, un id
 * inconnu retombe sur le defaut.
 */
function stored(nom: NomStocke, fallback: string, exists: (v: string) => boolean) {
  const v = lis(nom)
  return v && exists(v) ? v : fallback
}

const activeId = ref(
  stored('cycle', cycles.value[0]!.id, (v) => cycles.value.some((c) => c.id === v))
)
const block = ref(0)
const elapsed = ref(0)

const cycle = computed(() => cycles.value.find((c) => c.id === activeId.value) ?? cycles.value[0]!)

// un lien vers un etat precis ouvre le montage qui le contient
if (initial.named) {
  const found = locate(initial.state)
  if (found) {
    activeId.value = found.id
    block.value = found.index
  }
}

// L'etat est une sortie du lecteur : c'est le bloc courant qui commande. On
// l'initialise sur ce bloc pour ne pas entrer en morphant depuis un etat qui
// n'a jamais ete affiche.
//
// Sauf a l'arrivee, qui part du REPOS quel que soit le montage de l'utilisateur :
// la boule doit PARAITRE deja telle qu'elle restera, sans rien morpher. Prendre
// le premier bloc du montage ferait dependre la premiere image de ce que
// l'utilisateur y a range — un eclatement ou une comete se mettraient a morpher
// vers la boule pendant qu'elle apparait.
const state = ref<StateId>(
  intro.value ? 'idle' : (cycle.value.blocks[block.value]?.state ?? 'idle')
)

/**
 * Ecriture differee : etirer une carte remplace le cycle a chaque mouvement de
 * souris, et `localStorage` est synchrone — l'ecrire soixante fois par seconde
 * pendant un glisser bloquerait le rendu pour rien.
 */
let pending: ReturnType<typeof setTimeout>
function enregistreCycles() {
  clearTimeout(pending)
  ecris('cycles', JSON.stringify(cycles.value))
}
watch(cycles, () => {
  clearTimeout(pending)
  pending = setTimeout(enregistreCycles, 250)
})
watch(activeId, (v) => ecris('cycle', v))

/*
 * Le differe se vide a la fermeture, sinon la derniere modification est perdue quand
 * l'onglet part dans les 250 ms — etirer une carte puis fermer, et le geste n'a pas eu
 * lieu.
 *
 * `pagehide` et pas `beforeunload` : c'est le seul des deux qui se declenche aussi quand
 * la page passe en cache de navigation sur mobile, ou l'onglet n'est jamais « decharge ».
 */
window.addEventListener('pagehide', enregistreCycles)

/* -------------------------------------------------------------------- vues */

// La personnalisation est la vue d'accueil, sauf si l'URL designe un etat
// precis : dans ce cas le lien vise clairement le lecteur.
const view = ref<ViewId>(initial.named ? 'animations' : 'personnaliser')

/**
 * Apercu : la scene seule, sans barre laterale, sans panneau ni montage. On en
 * sort par Echap ou par le bouton, qui reste le seul element affiche.
 */
const preview = ref(false)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') preview.value = false
})

/**
 * L'apercu commande la lecture DANS LES DEUX SENS : on y entre en lecture, on en
 * sort en pause.
 *
 * A l'aller parce qu'on n'y va que pour regarder et qu'aucune commande n'y est
 * affichee — arriver sur une image fixe n'aurait aucun sens. Au retour parce
 * qu'on revient EDITER : laisser le montage defiler sous le curseur pendant qu'on
 * redimensionne une carte, c'est se battre contre la tete de lecture.
 *
 * Un watcher plutot que deux appels dans les gestionnaires : on quitte l'apercu
 * par le bouton ET par Echap, et l'un des deux finirait par etre oublie.
 */
watch(preview, (on) => {
  playing.value = on
})
// Meme regle qu'au changement de vue : on ne joue pas la sequence en
// personnalisation, sinon la forme est illisible. Le watcher ne se declenchant
// qu'au changement, il faut l'appliquer aussi a l'initialisation.
const playing = ref(intro.value || (initial.playing && view.value === 'animations'))

/**
 * Le dernier fragment que NOUS avons ecrit, en attente de son `hashchange`.
 *
 * Sans lui, le lecteur ne peut pas depasser un etat en DOUBLE dans le montage :
 * `location.replace` declenche un `hashchange` que l'ecouteur traite comme une
 * navigation entrante, et `locate` renvoie la PREMIERE occurrence de l'etat. Sur
 * un montage ou `idle` apparait deux fois, atteindre la seconde ramenait la tete
 * de lecture a la premiere — le montage bouclait sans jamais aboutir. Meme effet
 * a la pause, qui ecrit `&stop`.
 *
 * Consomme a la premiere lecture : une ecriture provoque au plus un evenement,
 * donc on ne doit pas ignorer durablement ce fragment — un retour arriere du
 * navigateur vers ce meme etat est une vraie navigation, et elle doit compter.
 */
let ecritParNous = ''

// L'URL est partageable, donc elle suit l'etat ET la lecture. replace et pas
// push : on ne veut pas un cran d'historique par etat.
watch([state, playing], ([id, on]) => {
  // L'URL decrit le LECTEUR. Hors de lui, l'etat affiche n'est qu'un decor de
  // vue — l'orbite par laquelle s'ouvrent les reglages — et n'a rien a faire
  // dans un lien partageable. L'y ecrire declenchait en plus un `hashchange`
  // qui replacait la tete de lecture sur les index du montage de l'utilisateur,
  // alors que la vue joue le sien : le lecteur restait coince sur l'orbite.
  if (view.value !== 'animations') return
  ecritParNous = `#etat=${id}${on ? '' : '&stop'}`
  location.replace(ecritParNous)
})

window.addEventListener('hashchange', () => {
  // notre propre ecriture n'est pas une navigation : cf. `ecritParNous`
  if (location.hash === ecritParNous) {
    ecritParNous = ''
    return
  }
  const next = readHash()
  /*
   * L'arrivee met en scene l'OUVERTURE de la page : la rejouer a chaud
   * demanderait de remonter tout le decor — panneaux refermes, lecteur rembobine,
   * apparition CSS re-armee. On recharge, ce qui la rejoue exactement comme un
   * visiteur la verrait. Un changement de hash seul ne recharge pas, d'ou ce cas
   * explicite : sans lui, taper `#arrivee` ne faisait rien du tout.
   */
  if (next.arrivee && !initial.arrivee) {
    location.reload()
    return
  }
  gallery.value = next.gallery
  if (next.gallery) return
  // Seul un lien qui NOMME un etat deplace la lecture. Sans ce garde, revenir
  // de la planche (`#planche` puis `#`) ramenerait au debut du montage.
  if (!next.named) return
  const found = locate(next.state)
  if (!found) return
  // un lien qui NOMME un etat vise le lecteur : on y va, meme depuis une autre vue
  view.value = 'animations'
  activeId.value = found.id
  block.value = found.index
})

/**
 * Hors du lecteur on ne regarde pas la sequence : on retombe sur l'etat de repos
 * et on suspend l'enchainement. L'horloge, elle, continue de tourner — le regard
 * derive et les yeux clignent toujours, ce qui garde le bot vivant sans empecher
 * de juger la forme, et c'est aussi ce qui laisse le regard suivre le curseur
 * dans les reglages.
 */
/*
 * Le lecteur s'ouvre A L'ARRET : arriver sur l'onglet, ce n'est pas demander a
 * voir le montage jouer — c'est le bouton de lecture qui le demande. Ensuite
 * `resume` fait son travail, et retrouver l'onglet rend la lecture telle qu'on
 * l'avait laissee.
 *
 * Seule exception, un lien qui NOMME un etat (`#etat=`) : celui-la vise le
 * lecteur et decrit deja sa lecture, `&stop` etant justement la facon de
 * l'ouvrir en pause. D'ou `initial.named` et pas `initial.playing` seul.
 *
 * L'apercu, lui, lance toujours (`enterPreview`) : on n'y va que pour regarder,
 * et il n'y a aucune commande a l'ecran pour lancer quoi que ce soit.
 */
let resume = initial.named && initial.playing
let resumeBlock = block.value

/**
 * Hors du lecteur, le montage joue est un unique bloc au repos : le cycle de
 * l'utilisateur peut tres bien ne contenir aucun etat au repos, et c'est le seul
 * ou la forme choisie se voit (`baseBody`).
 */
const REST = [makeBlock('idle')]

/**
 * Entree dans les reglages : le tourbillon, puis le repos.
 *
 * `swirl` porte le visage de repos, donc le suivi du curseur s'applique des la
 * premiere image et les yeux tournent d'un tour complet pour venir se poser a
 * gauche (voir `src/ui/gaze.ts`). Le bloc de repos qui suit reprend exactement la
 * meme pose : la reprise ne se voit pas.
 */
const ENTREE = [makeBlock('swirl'), makeBlock('idle')]
/**
 * Sous « mouvement reduit », l'entree va droit au repos : le tourbillon est une transition
 * d'interface, choisie et non relevee, donc de la decoration au sens de ce reglage.
 */
const ENTREE_CALME = [makeBlock('idle')]

const played = computed(() => {
  if (intro.value) return INTRO
  if (view.value === 'animations') return cycle.value.blocks
  if (view.value !== 'reglages') return REST
  return calme.value ? ENTREE_CALME : ENTREE
})

watch(view, (now, before) => {
  // Changer de vue interrompt l'arrivee : elle n'a de sens que sur la page
  // d'accueil, ou elle depose la boule a sa place. Seul un lien `#etat=` suivi
  // pendant ces deux secondes peut y arriver, mais alors c'est lui qui commande.
  intro.value = false
  // On ne memorise la position qu'en QUITTANT le lecteur : passer de la
  // personnalisation aux reglages ne doit pas ecraser la position gardee par le
  // zero qu'on vient d'y poser.
  if (before === 'animations') {
    resume = playing.value
    resumeBlock = block.value
  }
  if (now === 'animations') {
    playing.value = resume
    block.value = resumeBlock
    return
  }
  block.value = 0
  // seuls les reglages jouent quelque chose hors du lecteur : leur orbite d'entree
  playing.value = now === 'reglages'
})

/**
 * Une entree ne se joue qu'une fois : des que le lecteur atteint son bloc de
 * repos, on coupe l'enchainement. Sans ca le montage bouclerait et la vue
 * rejouerait son entree indefiniment.
 *
 * Pour l'arrivee sur le site, le dernier bloc rend simplement la main : la mise
 * en place, elle, a eu lieu bien avant (voir `nue` ci-dessous). Le montage joue
 * redevient du meme coup celui de la vue — le lecteur se recale alors sur son
 * unique bloc de repos, ce qui est sans effet visible puisqu'on y est deja et que
 * `setState` ignore un etat inchange : le fondu du clin d'oeil vers le repos,
 * lui, continue.
 */
watch(block, (i) => {
  if (intro.value) {
    if (i >= INTRO.length - 1) {
      intro.value = false
      playing.value = false
    }
    return
  }
  if (view.value === 'reglages' && i > 0) playing.value = false
})

/**
 * La boule est-elle encore seule en scene ?
 *
 * Ce n'est pas un second drapeau a tenir a jour : c'est la POSITION DU LECTEUR
 * qui le dit. Tant qu'il est sur le premier bloc, la boule parait ; des qu'il
 * entre dans le clin d'oeil, l'interface est la. Autrement dit c'est le
 * clignement d'entree de ce bloc qui declenche la mise en place, et il la MASQUE
 * — les yeux sont fermes pendant que la page bouge et que le regard rejoint la
 * pose du clin d'oeil. Deplacer la mise en place a la fin du montage, c'est
 * ramener les trois mouvements en meme temps et a decouvert.
 *
 * Le montage, lui, continue apres ce pivot : `intro` reste vrai jusqu'au dernier
 * bloc, sinon `played` changerait sous le lecteur et couperait le clin d'oeil a
 * l'image ou il commence.
 */
const nue = computed(() => intro.value && block.value < POSE_AT)

/**
 * Quel panneau est ouvert. Une seule colonne a une largeur a la fois, et tant que
 * la boule est seule aucune des deux : c'est en rendant sa largeur au panneau de
 * droite qu'on la fait glisser a sa place.
 */
const gauche = computed(() => !nue.value && view.value === 'reglages')
const droite = computed(() => !nue.value && view.value !== 'reglages')

/* ------------------------------------------------------------------- skins */

const shape = ref(stored('forme', DEFAULT_SHAPE, (v) => SHAPE_BY_ID.has(v)))
const color = ref(stored('couleur', DEFAULT_COLOR, (v) => COLOR_BY_ID.has(v)))
const expression = ref(
  stored('expression', DEFAULT_EXPRESSION, (v) => EXPRESSION_BY_ID.has(v))
)

watch(shape, (v) => ecris('forme', v))
watch(color, (v) => ecris('couleur', v))
watch(expression, (v) => ecris('expression', v))

/**
 * Nom du produit, en capitales pour le grand mot du pied de page. PAS traduit —
 * c'est une marque. Les capitales sont un logotype propre a ce pied de page : en
 * prose le nom s'ecrit « bloub », tout en minuscules, et c'est cette forme que
 * portent `app.name` et `app.title` dans les trois locales. La constante est donc
 * ecrite ici plutot que tiree de `t('app.name')`, qui n'a pas la meme casse.
 */
const NOM = 'BLOUB'

/* ----------------------------------------------------------------- humeurs */

/**
 * Dans les reglages, le bot change d'humeur de temps a autre pendant que ses yeux
 * suivent le curseur. C'est un vernis de page, PAS un reglage : l'expression
 * choisie par l'utilisateur n'est ni remplacee ni ecrite dans le stockage, on se
 * contente d'en jouer une autre le temps de la visite.
 *
 * Le choix des humeurs n'est pas affaire de gout : voir `HUMEURS` dans
 * `src/ui/gaze.ts`, qui explique le critere.
 */

/**
 * La boule redevient RONDE le temps d'un tour, quelle que soit la forme choisie —
 * dans les reglages comme a l'arrivee sur le site. Le choix de l'utilisateur
 * n'est pas touche, seulement ce qu'on affiche : il revient intact ensuite, et il
 * MORPHE en revenant, ce qui fait de la reprise de sa forme un temps de la mise
 * en scene plutot qu'un raccord.
 *
 * Deux raisons, et la seconde est mesuree :
 *
 * - une goutte ou un hexagone en sortie de morph ne se lisent pas comme une boule
 *   qui tourne, alors que la video montre une sphere ;
 * - surtout, les yeux sont recolles au contour REEL (`radiusAtAngle`) pour ne pas
 *   deborder de la silhouette. Sur un cercle ce rayon est constant et le tour est
 *   lisse ; sur une goutte, les yeux montent et descendent en suivant le profil —
 *   jusqu'a 25 px d'ecart vertical avec la trajectoire du cercle. Ca se voit
 *   comme un sautillement, et ce n'est pas corrigeable ailleurs : `radiusAtAngle`
 *   fait exactement ce pour quoi il est la.
 */
const forme = computed(() =>
  view.value === 'reglages' || nue.value ? DEFAULT_SHAPE : shape.value
)

/** Duree d'une humeur. Assez longue pour qu'on la remarque sans qu'elle agite. */
const HUMEUR_MS = 4200

const humeur = ref<string | null>(null)
let humeurTimer: ReturnType<typeof setInterval> | undefined

watch(view, (v) => {
  clearInterval(humeurTimer)
  if (v !== 'reglages') {
    // retour a l'expression de l'utilisateur, en morphant comme le reste
    humeur.value = null
    return
  }
  // on part de SON expression et on derive ensuite : le changement se remarque
  let i = 0
  humeurTimer = setInterval(() => {
    humeur.value = HUMEURS[i % HUMEURS.length]!
    i++
  }, HUMEUR_MS)
})

const order = computed(() => SEQUENCE.map((id) => STATES.find((s) => s.id === id)!))

/** Ajoute une animation a la fin du montage courant. */
function addBlock(id: StateId) {
  cycles.value = cycles.value.map((c) =>
    c.id === cycle.value.id ? { ...c, blocks: blocksWith(c.blocks, id) } : c
  )
}

/**
 * Deplacement de la tete de lecture depuis la regle. Le lecteur est le seul a
 * pouvoir recaler le moteur (il tient l'horloge), d'ou l'appel direct.
 */
const bot = ref<InstanceType<typeof BloubBot> | null>(null)

function onSeek(t: number) {
  const { index, elapsed: offset } = blockAt(cycle.value.blocks, t)
  bot.value?.seek(index, offset)
}

/* ------------------------------------------------------------------ export */

/**
 * Retard avant que la barre d'export se revele apres l'arrivee sur le site : le
 * temps que l'avatar rejoigne sa place.
 *
 * C'est le SEUL moment ou elle s'anime. Un changement de vue ne la fait pas
 * paraitre : elle est posee sur la fenetre comme la barre de montage (cf.
 * `.barre-export` dans styles.css), donc elle nait deja a sa place — et un
 * element qui ne se deplace pas n'a pas a s'annoncer.
 */
const RETARD_ARRIVEE = 400

/**
 * Barre masquee le temps que la scene se cale. A l'initialisation elle est
 * VISIBLE : au rechargement, ou en arrivant directement ici, rien ne doit bouger
 * — c'est la meme regle que pour les panneaux.
 */
const barreCachee = ref(false)
let minuteurBarre: ReturnType<typeof setTimeout> | undefined

/* Fin de l'arrivee : la boule n'est plus seule en scene. */
watch(nue, (encore, avant) => {
  if (!avant || encore) return
  barreCachee.value = true
  clearTimeout(minuteurBarre)
  minuteurBarre = setTimeout(() => (barreCachee.value = false), RETARD_ARRIVEE)
})

/* --------------------------------------------------- export du montage */

const dialogueCycle = ref(false)
const formatCycle = ref<FormatCycle>(FORMAT_CYCLE_DEFAUT)
const fondCycle = ref<FondGif>(FOND_GIF_DEFAUT)
/** `null` tant qu'on n'encode pas ; sinon la fraction faite, pour la barre. */
const avancementCycle = ref<number | null>(null)
/**
 * Le dernier export de montage a-t-il echoue ?
 *
 * Un etat a lui, et non `etatExport` : celui-la pilote `ExportBar`, qui n'est rendue que
 * dans la vue Personnaliser, alors que cette boite vit dans les Animations. L'echec
 * partait donc dans un composant absent de l'ecran — la barre de progression disparaissait,
 * la boite restait ouverte, et rien ne disait pourquoi.
 */
const erreurCycle = ref(false)
/** De quoi abandonner l'encodage en cours. */
let abandonCycle: AbortController | null = null

/**
 * Exporte le MONTAGE, pas l'avatar : c'est le cycle courant qui est rejoue hors
 * ecran, du debut a la fin. Un cycle dure des dizaines de secondes, donc la boite
 * reste ouverte et affiche sa progression au lieu de laisser la page figee.
 */
async function exporteCycle() {
  if (avancementCycle.value !== null) return
  erreurCycle.value = false
  const controle = new AbortController()
  abandonCycle = controle
  const blocs = cycle.value.blocks
  const format = formatCycle.value
  const images = cycleImages(totalDuration(blocs), format)
  const pas = cyclePas(format)
  const taille = CYCLE_TAILLE[format]
  const reglages = { shape: shape.value, color: color.value, expression: expression.value }
  const suit = (fait: number, total: number) => (avancementCycle.value = fait / total)

  avancementCycle.value = 0
  try {
    const mp4 = format === 'mp4'
    // La video n'a pas d'alpha : elle impose le blanc. Le GIF, lui, garde le choix.
    const fichier = mp4
      ? await cycleVersMp4(reglages, blocs, taille, images, pas, BLANC, suit, controle.signal)
      : await cycleVersGif(
          reglages,
          blocs,
          taille,
          images,
          pas,
          couleurDeFond(fondCycle.value),
          suit,
          controle.signal
        )
    telecharge(fichier, nomFichier(nomDeCycle(cycle.value), '', '', mp4 ? 'mp4' : 'gif'))
    dialogueCycle.value = false
  } catch (e) {
    // Un abandon n'est pas un echec : on ne signale pas a quelqu'un qu'il a obtenu ce
    // qu'il demandait.
    if (!(e instanceof Abandon)) erreurCycle.value = true
  } finally {
    avancementCycle.value = null
    abandonCycle = null
  }
}

/** Abandon demande depuis la boite : Echap, ou son bouton. */
function annuleCycle() {
  abandonCycle?.abort()
}

/*
 * L'echec appartient a la TENTATIVE, pas a la boite : la rouvrir doit la rendre neuve.
 * Sans ce nettoyage, un echec ancien s'affichait encore a l'ouverture suivante et le
 * bouton proposait de « reessayer » quelque chose qu'on n'avait pas encore demande.
 */
watch(dialogueCycle, (ouverte) => {
  if (ouverte) erreurCycle.value = false
})

/** Duree d'affichage de la confirmation d'export. */
const CONFIRMATION_MS = 1800

const etatExport = ref<EtatExport>('pret')
let confirmation: ReturnType<typeof setTimeout> | undefined

/**
 * Fond du GIF, et boite qui le demande. Le GIF est le SEUL format a poser la
 * question : lui seul a une transparence sur un bit, donc un bord dur a arbitrer.
 */
const fondGif = ref<FondGif>(FOND_GIF_DEFAUT)
const dialogueGif = ref(false)

/**
 * Exporte l'avatar tel qu'il est AFFICHE : `ExportBar` ne fait que demander un
 * format, le SVG a capturer est ici, comme le montage et les skins.
 *
 * Ce que l'utilisateur voit est bien ce qu'il obtient, au cadrage pres — c'est
 * le noeud vivant qui est serialise, pas un second rendu monte a cote.
 */
async function exporte(id: ActionId, confirme = false) {
  // Garde SYNCHRONE, en plus du `disabled` du bouton : celui-ci n'existe qu'apres
  // un rendu, donc deux clics dans la meme image telechargeaient deux fois.
  if (etatExport.value === 'occupe') return

  // Le GIF demande son fond avant de partir, et c'est la boite qui rappelle avec
  // `confirme`. Se fier a l'etat de la boite ne marcherait pas : elle se referme
  // AVANT d'emettre, donc on la verrait fermee et on la rouvrirait sans fin.
  if (!confirme && ACTION_BY_ID.get(id)?.mode === 'gif') {
    dialogueGif.value = true
    return
  }
  const action = ACTION_BY_ID.get(id)
  const svg = bot.value?.$el as SVGSVGElement | null | undefined
  if (!action || !svg) return

  clearTimeout(confirmation)
  etatExport.value = 'occupe'
  const nom = () =>
    nomFichier(shape.value, expression.value, color.value, action.extension, action.suffixe)
  try {
    if (action.mode === 'anime') {
      // L'animation ne part PAS du SVG affiche : elle est rejouee depuis le debut
      // sur une instance hors ecran. Cf. `sequenceDuBot`.
      const reglages = { shape: shape.value, color: color.value, expression: expression.value }
      telecharge(await versSvgAnime(reglages, action.taille, ANIM_IMAGES, ANIM_PAS), nom())
      etatExport.value = 'exporte'
    } else if (action.mode === 'gif') {
      const reglages = { shape: shape.value, color: color.value, expression: expression.value }
      const fond = couleurDeFond(fondGif.value)
      telecharge(await versGifAnime(reglages, action.taille, GIF_IMAGES, GIF_PAS, fond), nom())
      etatExport.value = 'exporte'
    } else {
      const markup = svgAutonome(svg, action.taille)
      if (action.mode === 'copieImage') {
        // Le blob part en PROMESSE et non attendu ici : cf. `copie` dans capture.ts.
        await copie(versPng(markup, action.taille))
        etatExport.value = 'copie'
      } else if (action.mode === 'copieTexte') {
        await copieTexte(markup)
        etatExport.value = 'copie'
      } else {
        const fichier =
          action.extension === 'svg'
            ? new Blob([markup], { type: 'image/svg+xml' })
            : await versPng(markup, action.taille)
        telecharge(fichier, nom())
        etatExport.value = 'exporte'
      }
    }
  } catch {
    // Un refus du presse-papiers ou un encodage impossible ne doit pas laisser
    // la barre bloquee sur « occupe ».
    etatExport.value = 'erreur'
  }
  confirmation = setTimeout(() => (etatExport.value = 'pret'), CONFIRMATION_MS)
}

/**
 * Rejoue l'entree a CHAQUE arrivee dans les reglages.
 *
 * Sans ce recalage, le lecteur reprend la date de debut de bloc et le `elapsed`
 * herites de la vue precedente : le bloc du tourbillon nait alors deja expire, et
 * l'entree est consommee en une seule image — on ne voit que la fin du fondu, ce
 * qui se lit comme un raté et non comme une mise en scene. Le cas se produit des
 * que le curseur etait deja sur le bloc 0, ou le simple `block.value = 0` ne
 * change rien et ne declenche donc aucun watcher.
 *
 * `flush: 'post'` : le composant doit avoir recu le nouveau montage avant qu'on
 * lui demande de s'y recaler.
 */
watch(
  view,
  (v) => {
    if (v === 'reglages') bot.value?.seek(0, 0)
  },
  { flush: 'post' }
)

</script>

<template>
  <div v-if="gallery" class="p-5">
    <a class="text-xs text-[var(--muted)] underline underline-offset-2" href="#">
      {{ t('gallery.back') }}
    </a>
    <div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
      <figure v-for="s in order" :key="s.id" class="flex flex-col items-center">
        <BloubBot
          :state="s.id"
          :size="210"
          :shape="shape"
          :color="color"
          :expression="expression"
          :frozen-at="POSES[s.id]"
        />
        <figcaption class="text-xs text-[var(--muted)]">{{ t(`states.${s.id}`) }}</figcaption>
      </figure>
    </div>
  </div>

  <template v-else>
    <!-- titre de structure : la page n'affiche volontairement aucun titre, mais
         un document sans h1 n'est pas navigable au lecteur d'ecran -->
    <h1 class="sr-only">{{ t('app.name') }}</h1>
    <!-- Pendant l'arrivee la barre reste MONTEE — elle est `fixed`, la demonter
         ne libere aucune place — mais effacee et surtout inerte : sans ca elle
         resterait dans l'ordre de tabulation en etant invisible. `|| undefined`
         parce qu'un `inert="false"` serait vrai pour le navigateur. -->
    <SideRail v-if="!preview" v-model="view" class="rail" :inert="nue || undefined" />

    <!-- Sortie d'apercu : le seul element qui reste a l'ecran avec l'avatar. -->
    <button
      v-else
      type="button"
      class="fixed top-5 right-5 z-30 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs text-[var(--muted)] shadow-sm backdrop-blur transition hover:text-[var(--ink)]"
      @click="preview = false"
    >
      {{ t('preview.exit') }}
      <kbd class="rounded bg-black/5 px-1 py-0.5 text-[10px]">{{ t('preview.key') }}</kbd>
    </button>

    <!-- La place de la barre de montage n'est reservee QUE la ou elle existe.
         Reservee dans toutes les vues, elle amputait le panneau de droite de sa
         hauteur (236 px) au profit d'un vide que rien ne venait remplir : la
         grille du personnalisateur se retrouvait a defiler sous un tiers d'ecran
         blanc. Ce que la reserve tenait par ailleurs — l'avatar et le panneau
         des reglages, qui ne doivent pas se recentrer d'un onglet a l'autre —
         est desormais porte par ces deux colonnes elles-memes, sous la forme de
         la meme hauteur de bande (`100dvh - 3rem - var(--timeline)`). -->
    <!-- `max-lg:px-5` : 2rem de marge laterale sur une fenetre de 375 px, c'est un
         sixieme de la largeur pour rien. Le padding BAS n'est pas touche ici : la
         vue Animations le remplace par la reserve de la barre de montage, et une
         variante `max-lg:pb-*` reprendrait la main dessus. -->
    <div
      class="scene min-h-full items-stretch justify-center p-8 max-lg:flex max-lg:flex-col max-lg:gap-10 max-lg:px-5"
      :class="[
        !preview && view === 'animations' && 'pb-[calc(var(--timeline)_+_1rem)]',
        // Sous 64rem le rail passe en bande HAUTE (cf. `SideRail`), et il flotte
        // comme il flottait a gauche : la scene doit lui reserver sa hauteur,
        // sinon le premier element de la pile lui passe dessous. Sauf en apercu,
        // le seul cas ou le rail est DEMONTE — y reserver sa place descendait
        // l'avatar de 80 px pour rien.
        !preview && 'max-lg:pt-20',
        nue || preview ? 'scene--seule' : view === 'reglages' && 'scene--gauche'
      ]"
    >
      <!--
        Panneau des reglages, colonne de GAUCHE : c'est l'ouverture de cette
        colonne qui pousse l'avatar vers la droite. Il reste monte quand la vue
        change, sinon il n'y aurait rien a faire glisser — c'est la largeur de sa
        colonne qui l'escamote, pas un `v-if`.
      -->
      <!-- Centre verticalement, contrairement au panneau de droite : celui-la est
           une longue grille de vignettes qui part du haut, celui-ci tient en
           quelques lignes et se lirait comme oublie en haut d'un grand vide. Puis
           remonte d'un cran : centre au pixel, il tombe plus bas que le regard,
           qui se porte au tiers superieur.

           Il se centre sur la BANDE DE L'AVATAR (la meme hauteur que `main`), et
           non sur la colonne : cette vue n'a pas de barre de montage, donc la
           colonne va jusqu'en bas de la fenetre et un centrage dessus ferait
           descendre le panneau d'une centaine de pixels selon l'onglet. -->
      <!-- `lg:pl-14` : le rail flotte au-dessus de la scene, qui ne lui reserve
           plus de place — sinon il decalerait l'avatar vers la droite. Ce panneau
           est le seul contenu qui arrive assez a gauche pour passer dessous, donc
           c'est LUI qui s'ecarte, et pas la scene entiere. -->
      <aside
        v-if="!preview"
        class="panneau scene__gauche w-full lg:flex lg:h-[calc(100dvh_-_3rem_-_var(--timeline))] lg:w-80 lg:shrink-0 lg:flex-col lg:justify-center lg:self-start lg:-translate-y-12 lg:pl-14"
        :class="gauche ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'"
      >
        <Settings />
      </aside>

      <!-- scene. Sa hauteur ne doit pas dependre du panneau de droite : etiree
           (items-stretch), elle suivait le panneau de personnalisation, plus
           haut que la grille d'animations, et l'avatar centre changeait de
           place d'un onglet a l'autre. -->
      <main
        class="scene__avatar relative flex flex-1 items-center justify-center max-lg:order-1 max-lg:flex-col max-lg:gap-4 lg:self-start"
        :class="
          preview
            ? 'lg:min-h-[calc(100dvh_-_4rem)]'
            : 'lg:min-h-[calc(100dvh_-_3rem_-_var(--timeline))]'
        "
      >
        <!-- l'avatar se met a la hauteur disponible : sur une fenetre basse, la
             barre de montage lui prend assez de place pour qu'un carre de 460
             deborde et fasse defiler la page -->
        <div
          class="avatar flex aspect-square w-full items-center justify-center"
          :class="[
            preview
              ? 'max-w-[min(560px,calc(100dvh_-_6rem))]'
              : 'max-w-[min(460px,calc(100dvh_-_var(--timeline)_-_7rem))]',
            nue && 'avatar--intro',
            view === 'reglages' && !preview && 'avatar--geant'
          ]"
        >
          <BloubBot
            ref="bot"
            class="h-auto max-w-full"
            v-model:state="state"
            v-model:block="block"
            v-model:elapsed="elapsed"
            v-model:playing="playing"
            :cycle="played"
            :size="preview ? 560 : 440"
            :shape="forme"
            :color="color"
            :expression="humeur ?? expression"
            :follow="view === 'reglages'"
            :gaze="intro ? INTRO_GAZE : null"
          />
        </div>

        <!--
          La barre d'export ne decale PAS l'avatar : elle est hors du flux, et
          `--timeline` est deja soustrait de la hauteur de cette colonne dans les
          DEUX vues (sinon l'avatar centre changerait de place en passant a la
          personnalisation), donc la bande sous la boule est deja libre ici. Rien
          de neuf a reserver, aucune variable a ajouter.

          En `fixed` comme la barre de montage, mais calee sur la COLONNE de
          l'avatar (`left`/`right`) et non sur la fenetre entiere : son contenu se
          centre sous la boule, pas au milieu de l'ecran.

          Le calage fin est dans `styles.css` (`.barre-export`), qui a besoin du
          `min()` de la boite de l'avatar. En dessous de 64rem la regle ne
          s'applique pas : la scene s'empile, rien n'est reserve, et la barre
          repasse dans le flux — sinon elle recouvrirait le personnalisateur.
        -->
        <!--
          Montee pendant l'arrivee mais MASQUEE (`nue`), et pas retiree : c'est
          l'etat de depart de sa transition, et sans lui a l'ecran il n'y aurait
          rien a interpoler quand elle se revele. Meme montage que `.panneau`.

          `inert` avec le masque : un element a `opacity: 0` reste cliquable et
          atteignable au clavier.
        -->
        <div
          v-if="view === 'personnaliser' && !preview"
          class="barre-export"
          :class="(nue || barreCachee) && 'barre-export--cachee'"
          :inert="nue || barreCachee"
        >
          <ExportBar :etat="etatExport" @exporter="exporte" />
        </div>

        <!--
          Les deux boites sont HORS de la barre d'export, alors que c'est elle qui
          ouvre la seconde : la barre porte `inert` quand elle est masquee, et
          `inert` s'applique a toute la descendance — y compris a un element passe
          dans la couche superieure, que rien ne doit pouvoir neutraliser.

          Export du MONTAGE, depuis la barre de montage : format et progression.
        -->
        <CycleDialog
          v-if="view === 'animations' && !preview"
          v-model:open="dialogueCycle"
          v-model:format="formatCycle"
          v-model:fond="fondCycle"
          :avancement="avancementCycle"
          :erreur="erreurCycle"
          @confirm="exporteCycle"
          @annuler="annuleCycle"
        />

        <!-- Export de l'AVATAR : le GIF est le seul format a demander son fond,
             voir `exporte`. -->
        <GifDialog
          v-if="view === 'personnaliser' && !preview"
          v-model:open="dialogueGif"
          v-model:fond="fondGif"
          @confirm="exporte('gif', true)"
        />
      </main>

      <!-- largeur fixe, identique dans les deux vues : sinon la scene se decale
           au changement d'onglet. w-80 est la contrainte du personnalisateur
           (grille de 4 vignettes), le panneau d'animations s'y adapte. -->
      <aside
        v-if="!preview"
        class="panneau scene__droite w-full lg:w-80 lg:shrink-0"
        :class="droite ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'"
      >
        <!-- palette : une vignette s'ajoute a la fin du montage -->
        <template v-if="view === 'animations'">
          <h2 class="text-sm font-semibold">{{ t('panel.animations') }}</h2>
          <div class="mt-2 grid grid-cols-4 gap-1.5">
            <BotTile
              v-for="s in order"
              :key="s.id"
              :label="t(`states.${s.id}`)"
              :selected="s.id === state"
              :state="s.id"
              :shape="shape"
              :color="color"
              :expression="expression"
              :frozen-at="POSES[s.id]"
              @click="addBlock(s.id)"
            />
          </div>
        </template>

        <!-- personnalisation -->
        <template v-else>
          <Customizer
            v-model:shape="shape"
            v-model:color="color"
            v-model:expression="expression"
          />
        </template>
      </aside>
    </div>

    <!--
      Le nom du projet, en grand, fixe en bas de l'ecran et aligne a gauche sur le
      panneau. Au niveau de la PAGE et non dans le panneau : celui-ci porte un
      `transform`, ce qui en ferait le repere d'un enfant `fixed` — le mot ne
      serait plus cale sur la fenetre. `aria-hidden` : purement graphique, le nom
      est deja dans le titre du document et le `h1`.
    -->
    <p v-if="view === 'reglages' && !preview" class="wordmark" aria-hidden="true">
      {{ NOM }}
    </p>

    <Timeline
      v-if="view === 'animations' && !preview"
      v-model:cycles="cycles"
      v-model:active-id="activeId"
      v-model:block="block"
      v-model:playing="playing"
      :elapsed="elapsed"
      :shape="shape"
      :color="color"
      :expression="expression"
      @seek="onSeek"
      @preview="preview = true"
        @exporter="dialogueCycle = true"
    />
  </template>
</template>
