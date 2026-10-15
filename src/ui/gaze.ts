import type { Look } from '@/bot/engine'
import type { ExpressionId } from '@/bot/expressions'
import { clamp } from '@/bot/math'

/** Duree choisie pour un tour horizontal complet, en secondes. */
export const SWEEP_PERIOD = 4.2
export const FULL_TURN = 360

/** Expressions choisies pour varier les reglages sans incliner la tete. */
export const HUMEURS: readonly ExpressionId[] = [
  'surpris',
  'heureux',
  'hilare',
  'excite',
  'fier',
  'blase'
]

/* ------------------------------------------------ regards de l'arrivee */

/**
 * Un regard SCRIPTE : evalue a chaque image avec le temps ecoule depuis le debut
 * de l'arrivee, en secondes. Le script porte donc sa propre horloge et peut
 * enchainer plusieurs mouvements — le composant ne fait que l'evaluer et n'a
 * aucune duree a connaitre.
 *
 * REGLE, et c'est elle qui rend un script sans entretien : il doit FINIR a
 * `mix: 0`, ou la pose de l'etat commande seule. Il n'y a alors jamais rien a
 * relacher, et ce relachement — qui se verrait sous la forme d'un dernier
 * glissement des yeux, juste quand tout devrait etre pose — n'existe pas.
 *
 * Le type reste general alors qu'il n'y a qu'un script aujourd'hui : quatre ont
 * ete ecrits et compares cote a cote avant d'en garder un, et c'est cette forme
 * qui a permis de les essayer sans toucher au moteur.
 */
export type GazeScript = (t: number) => Look

/** Duree du balayage d'accueil, qui commence et finit sur la pose choisie. */
export const TOUR_TIME = 1.5

export const tourLook = (t: number): Look => ({
  yaw: 0,
  pitch: 0,
  mix: 0,
  yawOffset: FULL_TURN * clamp(t / TOUR_TIME),
  wander: 1
})

/** Tour horizontal continu, active uniquement sur demande. */
export function gazeSweep(t: number): number {
  return FULL_TURN * ((t % SWEEP_PERIOD) / SWEEP_PERIOD)
}

/** Tour horizontal des yeux, sans toucher au corps ni au reste du visage. */
export function sweepLook(t: number): Look {
  return { yaw: 0, pitch: 0, mix: 0, yawOffset: gazeSweep(t), wander: 1 }
}
