/**
 * Cles de `localStorage`, en un seul endroit.
 *
 * Le prefixe porte le nom du produit : c'est une constante partagee et pas une
 * chaine recopiee a chaque appel, sinon le prochain renommage en oubliera une et
 * l'utilisateur perdra ses reglages sans que rien ne le signale.
 *
 * Aucune migration depuis l'ancien prefixe : le renommage a ete fait avant toute
 * mise en ligne, il n'y a pas d'installation a rattraper.
 */
const PREFIXE = 'bloub:'

/** Tout ce que l'application persiste. */
const NOMS = ['cycles', 'cycle', 'forme', 'couleur', 'expression', 'langue'] as const

export type NomStocke = (typeof NOMS)[number]

/** `cle('cycles')` -> `'bloub:cycles'`. */
export function cle(nom: NomStocke): string {
  return `${PREFIXE}${nom}`
}

/**
 * Lecture GARDEE du stockage.
 *
 * Toucher `localStorage` peut jeter, et pas seulement echouer : quand l'acces est refuse
 * — Chrome regle sur « bloquer tous les cookies », iframe tierce, politique d'entreprise —
 * la simple lecture de la propriete leve un `SecurityError`. Or tout ce que l'application
 * relit l'est a l'evaluation des modules, donc l'exception remontait le `setup` de
 * `App.vue` et la page restait BLANCHE : pas de bot du tout, pour un reglage de navigateur
 * qui n'a rien a voir avec le fait de regarder une animation.
 *
 * On perd la persistance, jamais l'application. C'est le seul arbitrage possible ici : il
 * n'y a rien a sauver de force, uniquement un avatar a retrouver si on peut.
 */
export function lis(nom: NomStocke): string | null {
  try {
    return localStorage.getItem(cle(nom))
  } catch {
    return null
  }
}

/**
 * Ecriture GARDEE du stockage.
 *
 * Meme raison qu'en lecture, plus le quota : un `setItem` peut lever
 * `QuotaExceededError`. Celle du cycle partait d'un `setTimeout`, donc en rejet non
 * traite — la persistance s'arretait sans que rien ne le dise.
 */
export function ecris(nom: NomStocke, valeur: string) {
  try {
    localStorage.setItem(cle(nom), valeur)
  } catch {
    // stockage refuse ou plein : on continue sans persister
  }
}
