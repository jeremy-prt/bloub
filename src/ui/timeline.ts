/**
 * Reglages et mises en forme de la piste de montage. Tout est pur : la piste
 * n'a besoin d'aucun DOM pour savoir ou tomber, ce qui rend ses graduations
 * testables — c'est la meme discipline que `src/bot/`, appliquee a l'affichage.
 */

/**
 * Largeur d'une carte, en pixels par seconde : la duree se lit donc directement
 * dans la piste. Le zoom multiplie cette echelle — il ne change jamais le
 * montage, seulement la loupe qu'on pose dessus.
 */
export const BASE_SCALE = 44

/**
 * Bornes de la loupe : au plus petit, le montage releve sur la video tient
 * entier dans la piste ; au plus grand, une carte reste manipulable sans
 * devenir un mur.
 */
export const MIN_ZOOM = 0.45
export const MAX_ZOOM = 2.4

/** Ecart minimal entre deux reperes chiffres de la regle, en pixels. */
const TICK_SPACING = 52

/** Pas possibles de la regle, du plus fin au plus large. */
const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60]

export function clampZoom(v: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))
}

/** `0:04` — les dixiemes changeraient trop vite pour etre lisibles. */
export function mmss(t: number) {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/*
 * Les durees en secondes ne sont PAS mises en forme ici : le separateur decimal
 * change avec la langue (virgule en francais, point en anglais) et l'unite se
 * traduit. Elles passent donc par `secondes` / `secondesCourtes` de `@/i18n`,
 * qui a la langue courante — ce module, lui, reste pur.
 *
 * `mmss` reste : le format mm:ss n'a ni unite ni separateur decimal.
 */

/**
 * Reperes de la regle pour une duree et une echelle donnees. Le pas chiffre est
 * le premier de `STEPS` qui laisse `TICK_SPACING` entre deux nombres : c'est ce
 * qui fait qu'en dezoomant on passe de 1 s a 5 s puis a 10 s au lieu d'empiler
 * des chiffres illisibles. Les reperes intermediaires n'apparaissent que s'ils
 * ne se collent pas les uns aux autres.
 */
export function ticksFor(total: number, scale: number): Array<{ t: number; major: boolean }> {
  const major = STEPS.find((s) => s * scale >= TICK_SPACING) ?? STEPS[STEPS.length - 1]!
  const step = (major / 5) * scale >= 7 ? major / 5 : major
  const out: Array<{ t: number; major: boolean }> = []
  for (let i = 0; i * step <= total + 1e-6 && out.length < MAX_TICKS; i++) {
    const t = i * step
    out.push({ t, major: Math.abs(t / major - Math.round(t / major)) < 1e-6 })
  }
  return out
}

/**
 * Plafond du nombre de graduations. Garde-fou et non reglage.
 *
 * `parseCycles` borne deja la taille d'un montage relu, mais cette fonction ne doit pas
 * dependre de ce garde-la pour rester bornee : elle rend un objet par graduation et le
 * composant un `<span>` par objet, donc une duree aberrante — un montage bricole a la
 * main, un zoom extreme — se paie en centaines de milliers de noeuds et l'onglet fige.
 *
 * Deux mille couvre trente minutes de montage au zoom le plus fin, soit bien plus que ce
 * que `MAX_BLOCS` autorise a relire. La regle est de toute facon plus large que l'ecran :
 * la piste defile, elle n'affiche jamais tout.
 */
const MAX_TICKS = 2000
