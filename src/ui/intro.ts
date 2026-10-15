import { clampDuration, makeBlock, type Block } from '@/bot/cycles'
import { TOUR_TIME, tourLook } from './gaze'

/**
 * L'arrivee sur le site : la boule parait seule au centre de la page, le regard
 * balaie de gauche a droite puis revient a sa pose, avant que la boule glisse a
 * sa place pendant que l'interface apparait autour d'elle.
 *
 * Pur, comme `gaze.ts` et `timeline.ts` : le montage et la regle de declenchement
 * se decident ici et se testent sans DOM ni composant. `App.vue` ne fait que les
 * brancher, la mise en scene elle-meme etant du CSS (`.scene--seule`,
 * `.avatar--intro` dans `styles.css`).
 */

/**
 * Le montage. Deux blocs de REPOS et rien d'autre : toute l'entree tient dans le
 * script de regard, pas dans un enchainement d'etats.
 *
 * C'est le resultat d'une comparaison — quatre entrees ont ete essayees cote a
 * cote — et la lecon vaut d'etre gardee : **tout etat autre que le repos apporte
 * sa propre pose de regard, donc un saut des yeux au changement**. Le clignement
 * cense le masquer ne dure que 0,2 s quand le fondu d'entree en dure 0,3 : les
 * yeux se rouvrent en cours de route et ca se lit comme une teleportation, 15 px
 * entre deux images. Un clin d'oeil a bien ete tente ici, longuement ; il a ete
 * ecarte pour cette raison.
 *
 * Les deux blocs portent donc le meme etat, ce qui a trois consequences voulues :
 * aucun morph de silhouette (c'est la forme choisie qu'on voit du debut a la
 * fin), aucun saut de regard, et `idle` etant le seul etat `baseFace`, la boule
 * parait deja avec l'expression reglee par l'utilisateur.
 *
 * Le premier bloc dure un peu plus que le tour, pour qu'il ait le temps de se
 * terminer avant que la boule ne parte rejoindre sa place.
 */
export const INTRO: Block[] = [
  { state: 'idle', duration: clampDuration('idle', TOUR_TIME + 0.3) },
  makeBlock('idle')
]

/**
 * Indice du bloc a partir duquel la boule rejoint sa place et l'interface
 * apparait. Zero = elle est encore seule en scene.
 */
export const POSE_AT = 1

/** Le regard balaie horizontalement pendant l'arrivee, sans incliner la boule. */
export const INTRO_GAZE = tourLook

/** Ce que l'application sait de l'arrivee au moment de decider. */
export interface Arrivee {
  /** l'URL nomme un etat (`#etat=`) */
  named: boolean
  /** l'URL demande la planche (`#planche`) */
  gallery: boolean
  /** on revient sur une page deja ouverte : rechargement, ou precedent/suivant */
  rechargement: boolean
  /** l'utilisateur a demande moins d'animation */
  calme: boolean
}

/**
 * L'arrivee se joue-t-elle ? Quatre refus, tous pour une raison differente :
 *
 * - `named` : un lien `#etat=` vise le LECTEUR et decrit deja sa lecture. Lui
 *   imposer une mise en scene d'accueil, c'est ne pas ouvrir ce qu'il demande.
 * - `gallery` : la planche est un outil de verification visuelle, elle doit
 *   rester le chemin sur qui ne depend de rien.
 * - `rechargement` : c'est la demande meme — une introduction, pas une animation
 *   de chargement. On la joue donc a chaque VENUE sur le site (URL saisie, lien
 *   suivi, nouvel onglet) mais jamais quand on retombe sur une page qu'on avait
 *   deja : rechargement, precedent, suivant. Rien n'est ecrit dans le stockage —
 *   la distinction est celle du navigateur, pas une memoire a nous, et c'est ce
 *   qui evite qu'une seule visite eteigne l'arrivee pour toujours.
 * - `calme` : `prefers-reduced-motion` demande explicitement de ne pas jouer une
 *   animation decorative.
 *
 * `#arrivee` court-circuite le tout : c'est le lien qui sert a la revoir.
 */
export function introDue({ named, gallery, rechargement, calme }: Arrivee): boolean {
  return !named && !gallery && !rechargement && !calme
}
