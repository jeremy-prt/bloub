/**
 * Cadrage et nommage des images exportees. Tout est pur : aucun DOM, donc
 * testable en environnement `node` comme le reste de `src/ui/`. La rasterisation
 * vit dans `capture.ts`, elle, parce qu'elle a besoin d'un canvas.
 */

import { DEMI_VIEWBOX, RAYON } from '@/bot/repere'
import { SHAPES } from '@/bot/skins'

/**
 * Marge autour de la forme la plus large. Huit pour cent : c'est ce qui permet
 * au rognage circulaire d'une photo de profil (Discord, Slack, GitHub) de ne
 * pas mordre dans la silhouette.
 */
const MARGE = 1.08

/**
 * Rayon de la forme la plus etalee, en unites de rayon de boule. Calcule et non
 * ecrit en dur : ajouter une forme plus large deplace le cadre tout seul au lieu
 * de se faire rogner.
 */
export const RAYON_MAX = Math.max(...SHAPES.map((forme) => Math.max(...forme.radii)))

/**
 * Demi-cote du cadre d'export, en unites de viewBox.
 *
 * Il est plus SERRE que le viewBox de l'ecran (158), et c'est volontaire : la
 * marge de l'ecran loge les anneaux des etats animes, qui n'existent pas au
 * repos. La garder ferait un export rempli a 63 % de vide, et une boule
 * minuscule dans un rognage de photo de profil.
 *
 * Un seul cadre pour les huit formes, et pas un recadrage forme par forme : les
 * rayons de `skins.ts` sont normalises pour que « toutes les formes pesent
 * pareil a l'oeil », or les recadrer separement remettrait chacune a la meme
 * taille et casserait ce reglage.
 */
export const DEMI_CADRE = Math.ceil(RAYON * RAYON_MAX * MARGE)

/** viewBox du document exporte, centre sur la boule. */
export function viewBoxExport(demi = DEMI_CADRE) {
  return `${-demi} ${-demi} ${demi * 2} ${demi * 2}`
}

/**
 * Demi-cote du viewBox de l'ECRAN.
 *
 * C'est celui qu'il faut pour exporter un CYCLE, et pas le cadre serre : la marge que le
 * cadre serre supprime est justement celle qui loge les anneaux des etats animes. Ils
 * montent a 1,4 fois le rayon de la boule, soit 140 — donc au-dela des 125 du cadre serre,
 * qui les rognerait. Un test le verrouille.
 */
export const DEMI_ECRAN = DEMI_VIEWBOX

export type ActionId = 'png' | 'svg' | 'anime' | 'gif' | 'copie' | 'copieSvg'

/** Ce qu'on fait de l'image une fois produite. */
export type ModeExport = 'telecharge' | 'anime' | 'gif' | 'copieImage' | 'copieTexte'

export interface ActionExport {
  id: ActionId
  mode: ModeExport
  /** Cote de l'image en pixels. */
  taille: number
  extension: 'png' | 'svg' | 'gif'
  /**
   * Ajoute au nom du fichier. L'animation est un SVG elle aussi : sans ce suffixe
   * elle ecraserait l'export fixe dans le dossier de telechargement.
   */
  suffixe?: string
}

/**
 * Images CLES par seconde — pas une cadence de lecture.
 *
 * L'animation exportee est un SVG : c'est le navigateur qui interpole entre les
 * cles, donc le mouvement est lisse a la frequence de l'ecran quel qu'en soit le
 * nombre. C'est toute la difference avec un feuilletage bitmap, ou une animation
 * a 20 images par seconde saccade parce que le clignement ne dure que 0,18 s
 * (`BLINK_DUR`, face.ts) et n'a donc que trois ou quatre images pour se jouer.
 *
 * 30 par seconde parce que ca ne coute presque rien — une cle, c'est une matrice
 * de texte — et que ca suit fidelement la courbe du clignement, qui ferme vite et
 * rouvre plus lentement.
 */
export const ANIM_CLES_PAR_SEC = 30

/**
 * Duree capturee. Le premier clignement tombe a 1,4 s puis les suivants toutes
 * les 1,9 a 4,6 s (`BLINKS`, face.ts) : trois secondes en contiennent donc
 * toujours au moins un. Plus court, on exporterait souvent une boule qui se
 * contente de deriver.
 *
 * La boucle, elle, est sans couture malgre une derive non periodique : l'animation
 * est jouee en aller-retour (`animation-direction: alternate`), donc elle reboucle
 * exactement sur elle-meme. Voir `svgAnime`.
 */
export const ANIM_SECONDES = 3

export const ANIM_IMAGES = ANIM_CLES_PAR_SEC * ANIM_SECONDES
export const ANIM_PAS = 1 / ANIM_CLES_PAR_SEC

/**
 * Le GIF, lui, est un vrai feuilletage : sa cadence EST sa fluidite, et rien ne
 * l'interpole. Vingt images par seconde est son plafond utile ici — son delai se
 * compte en centiemes de seconde, donc 20 (5 centiemes) tombe juste la ou 30 ne
 * tomberait pas, et chaque image ajoutee pese.
 */
export const GIF_FPS = 20
export const GIF_IMAGES = GIF_FPS * ANIM_SECONDES
export const GIF_PAS = 1 / GIF_FPS

/**
 * Le GIF est exporte PLUS GRAND que sa taille d'affichage, exprès. Sa
 * transparence est sur un bit : le bord antialiase de la boule est tranche net et
 * ressort en marches d'escalier. Un avatar Discord s'affiche entre 40 et 128 px,
 * donc la reduction du navigateur relisse ce bord — ce que ne ferait pas un
 * fichier exporte a la taille finale.
 */
export const GIF_TAILLE = 320

/* --------------------------------------------------- export d'un cycle */

/**
 * Formats d'export d'un CYCLE. Pas de SVG anime ici, et c'est mesure : sur un
 * cycle le corps morphe a chaque image, or son chemin pese 2,5 ko — six cents
 * images en feraient 1,5 Mo, sans compter les arcs. Le SVG anime ne tient que
 * pour l'avatar au repos, ou la silhouette est immobile.
 */
export type FormatCycle = 'mp4' | 'gif'

export const FORMATS_CYCLE: FormatCycle[] = ['mp4', 'gif']
export const FORMAT_CYCLE_DEFAUT: FormatCycle = 'mp4'

/**
 * Cadence et taille, SEPAREES par format — les avoir mutualisees etait une
 * erreur : le GIF est contraint par son poids, la video ne l'est pas du tout.
 *
 * GIF : 20 images par seconde et 320 px. Son delai se compte en centiemes de
 * seconde, et chaque image ajoutee pese en clair dans le fichier.
 *
 * MP4 : 30 images par seconde et 1024 px. Une video compresse le mouvement au
 * lieu de stocker chaque image, donc monter en resolution et en cadence coute
 * peu — mesure sur un disque net, passer de 320 a 1024 et de 20 a 30 images fait
 * monter le debit de 93 a 342 kbps seulement. A 320 px et 93 kbps, l'export avait
 * la definition d'une vignette : c'est ce qui lui donnait un air de GIF.
 */
export const CYCLE_FPS = { gif: 20, mp4: 30 } as const
export const CYCLE_TAILLE = { gif: 320, mp4: 1024 } as const

export const cyclePas = (format: FormatCycle) => 1 / CYCLE_FPS[format]

/** Combien d'images pour un cycle de `duree` secondes. */
export const cycleImages = (duree: number, format: FormatCycle) =>
  Math.max(1, Math.round(duree * CYCLE_FPS[format]))

/**
 * La video est TOUJOURS opaque : `VideoEncoder` refuse `alpha: 'keep'`, en H.264
 * comme en VP9. Le GIF, lui, garde le choix du fond.
 */
export const cycleAccepteTransparence = (format: FormatCycle) => format === 'gif'

/**
 * Fond du GIF, au choix de l'utilisateur.
 *
 * C'est le seul export ou la question se pose : les autres ont 8 bits d'alpha et
 * un bord parfaitement lisse sur un fond transparent. Le GIF n'en a qu'un, donc
 * son bord transparent est dur et se voit — le fond plein est le moyen de le
 * lisser, au prix d'une couleur cuite dans l'image.
 *
 * `blanc` par defaut : c'est celui qui a l'air propre partout, la ou le
 * transparent montre ses marches d'escalier sur un fond de couleur.
 */
export type FondGif = 'blanc' | 'transparent'

export const FONDS_GIF: FondGif[] = ['blanc', 'transparent']
export const FOND_GIF_DEFAUT: FondGif = 'blanc'

/** Blanc pur, et non le `--paper` du site : « fond blanc » doit etre blanc. */
export const BLANC = '#ffffff'

/** La couleur a peindre sous la boule, ou `null` pour ne rien peindre. */
export const couleurDeFond = (fond: FondGif) => (fond === 'blanc' ? BLANC : null)

/**
 * UNE seule taille de PNG, volontairement : proposer 1024 et 2048 obligeait
 * l'utilisateur a trancher une question qui n'est pas la sienne. 1024 couvre
 * toutes les specs de photo de profil (Discord 128, X 400, GitHub 500, Slack
 * 512) en se reduisant proprement, et un aplat vectoriel a cette taille ne pese
 * que quelques ko. Qui veut plus grand prend le SVG, qui n'a pas de taille.
 *
 * Pas de GIF FIXE : 256 couleurs et une transparence sur 1 bit, donc un bord en
 * escalier la ou le PNG a 8 bits d'alpha. Le GIF n'existe ici qu'en ANIME, et
 * seulement parce que les avatars animes de Discord ou de Slack refusent le SVG.
 *
 * Le catalogue ne porte que des **ids** : les libelles sont resolus par
 * `t('export.<id>')`, et l'union litterale au-dessus fait verifier a la
 * compilation que chacun a sa traduction dans les trois langues.
 */
export const ACTIONS: ActionExport[] = [
  { id: 'png', mode: 'telecharge', taille: 1024, extension: 'png' },
  { id: 'svg', mode: 'telecharge', taille: DEMI_CADRE * 2, extension: 'svg' },
  { id: 'anime', mode: 'anime', taille: DEMI_CADRE * 2, extension: 'svg', suffixe: 'anime' },
  { id: 'gif', mode: 'gif', taille: GIF_TAILLE, extension: 'gif' },
  { id: 'copie', mode: 'copieImage', taille: 1024, extension: 'png' },
  { id: 'copieSvg', mode: 'copieTexte', taille: DEMI_CADRE * 2, extension: 'svg' }
]

export const ACTION_BY_ID = new Map<string, ActionExport>(ACTIONS.map((a) => [a.id, a]))

/** Ce que fait le bouton principal ; les autres sont dans le menu. */
export const ACTION_DEFAUT: ActionId = 'png'

/**
 * Etat de la barre d'export. Un telechargement ne se voit pas forcement — selon
 * le navigateur il tombe dans un dossier sans rien afficher — d'ou cette
 * confirmation : sans elle, l'utilisateur reclique en croyant que rien n'a pris.
 */
export type EtatExport = 'pret' | 'occupe' | 'exporte' | 'copie' | 'erreur'

/**
 * Retire les commentaires XML. Le SVG du bot en porte de longs, qui expliquent
 * le masque a qui lit le composant — ils n'ont rien a faire dans un fichier
 * livre a l'utilisateur.
 */
export function sansCommentaires(markup: string) {
  return markup.replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * `bloub-goutte-neutre-encre.png`.
 *
 * Construit sur les **ids** et non sur les libelles traduits : le nom du fichier
 * ne doit pas changer avec la langue de l'interface.
 *
 * Les ids sont filtres alors qu'ils viennent d'unions litterales, parce que
 * `App.vue` les relit du `localStorage` sans les valider : une valeur trafiquee
 * n'a pas a pouvoir composer le nom du fichier telecharge.
 */
export function nomFichier(
  forme: string,
  expression: string,
  couleur: string,
  extension: string,
  suffixe = ''
) {
  const propre = (v: string) =>
    v
      .toLowerCase()
      // Les accents passent en lettre nue plutot que d'etre effaces : un nom de
      // montage comme « Cycle par défaut » doit rester lisible dans le dossier de
      // telechargement, pas devenir « cyclepardfaut ».
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
  const morceaux = [propre(forme), propre(expression), propre(couleur), propre(suffixe)].filter(
    Boolean
  )
  return `bloub${morceaux.map((m) => `-${m}`).join('')}.${extension}`
}

/**
 * Le navigateur sait-il encoder une video ici ?
 *
 * Ce garde vit ICI et pas dans `video.ts`, et ce n'est pas un rangement : le
 * moindre import statique de `video.ts` ramene mediabunny dans le chunk d'entree.
 * `video.ts` ne charge la lib qu'a l'interieur de `versMp4`, mais Rollup ne peut
 * plus sortir un module a la fois importe statiquement et dynamiquement — il le
 * signale par `INEFFECTIVE_DYNAMIC_IMPORT` — et les 43 ko gzip repartent au
 * premier chargement. C'est arrive une fois, pour cette fonction de deux lignes.
 */
export function videoPossible() {
  return typeof VideoEncoder !== 'undefined'
}

/* ------------------------------------------------------------- abandon d'export */

/**
 * Erreur d'un export abandonne par l'utilisateur.
 *
 * Une classe et non un booleen de retour : l'abandon doit remonter toute la pile
 * d'encodage, dont les `finally` liberent au passage l'encodeur video et le lecteur hors
 * ecran. L'appelant la reconnait pour ne PAS afficher d'erreur — on ne signale pas a
 * quelqu'un qu'il a obtenu ce qu'il demandait.
 *
 * Elle vit ICI et pas dans `video.ts` pour la meme raison que `videoPossible` juste au
 * dessus : `capture.ts` en a besoin en import statique, et un import statique de
 * `video.ts` ramene mediabunny dans le chunk d'entree.
 */
export class Abandon extends Error {
  constructor() {
    super('export abandonne')
    this.name = 'Abandon'
  }
}

/** Jette si l'utilisateur a demande l'abandon. */
export function arrete(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw new Abandon()
}
