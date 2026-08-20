import { PROFILE_SAMPLES } from './profiles'
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile
} from './shape'

/**
 * Formes et couleurs proposees par le personnalisateur du bot.
 *
 * A la difference des silhouettes d'animation (`profiles.ts`), celles-ci ne sont
 * PAS relevees sur la video : elles sont construites analytiquement d'apres la
 * grille du personnalisateur d'origine. Deux sources distinctes, donc, et c'est
 * volontaire — les etats animes doivent rester fideles a la video, les formes de
 * base sont un choix d'utilisateur.
 */

/**
 * Les identifiants sont enumeres plutot que deduits du tableau : c'est ce qui
 * permet a la couche i18n de verifier A LA COMPILATION que chaque forme a bien
 * sa traduction dans les trois langues (`t(\`shapes.${id}\`)` ne compile que si
 * la cle existe). Un `as const` sur le tableau aurait le meme effet mais
 * rendrait `radii` en lecture seule, alors que le moteur le passe tel quel.
 */
export type ShapeId =
  | 'cercle'
  | 'galet'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagone'
  | 'nuage'
  | 'goutte'
  | 'losange'
  | 'fantome'

export interface BotShape {
  id: ShapeId
  radii: number[]
}

/** Ramene le rayon maximal a `max` pour que toutes les formes pesent pareil a l'oeil. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Galet : cercle deforme par deux harmoniques basses, donc irregulier mais lisse. */
const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02
)

/** Nuage : union de bosses, large en bas, deux lobes en haut. */
const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 }
  ]),
  1.02
)

/** Goutte : gros disque en bas, pointe effilee en haut. */
const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04
)

/** Capsule couchee : enveloppe de deux disques cote a cote. */
const capsule = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62), 0, 0)

/** Adoucit un profil sans modifier les autres formes du catalogue. */
function softenProfile(radii: number[], passes = 2): number[] {
  let out = [...radii]
  for (let pass = 0; pass < passes; pass++) {
    out = out.map((r, i) => {
      const prev = out[(i - 1 + out.length) % out.length] ?? r
      const next = out[(i + 1) % out.length] ?? r
      return (prev + 2 * r + next) / 4
    })
  }
  return out
}

/** Fantome Pac-Man : dome haut, flancs droits et trois pieds ondulants. */
const ghost = normalize(
  softenProfile(
    profileFromPolygon(
      [
      { x: 0, y: -1.05 },
      { x: 0.22, y: -1.01 },
      { x: 0.43, y: -0.91 },
      { x: 0.6, y: -0.74 },
      { x: 0.73, y: -0.5 },
      { x: 0.79, y: -0.22 },
      { x: 0.79, y: -0.02 },
      { x: 0.785, y: 0.2 },
      { x: 0.77, y: 0.4 },
      { x: 0.74, y: 0.54 },
      { x: 0.7, y: 0.66 },
      { x: 0.65, y: 0.76 },
      { x: 0.59, y: 0.83 },
      { x: 0.52, y: 0.88 },
      { x: 0.45, y: 0.89 },
      { x: 0.39, y: 0.86 },
      { x: 0.34, y: 0.8 },
      { x: 0.29, y: 0.71 },
      { x: 0.25, y: 0.62 },
      { x: 0.21, y: 0.59 },
      { x: 0.165, y: 0.68 },
      { x: 0.115, y: 0.78 },
      { x: 0.07, y: 0.88 },
      { x: 0.035, y: 0.93 },
      { x: 0, y: 0.95 },
      { x: -0.035, y: 0.93 },
      { x: -0.07, y: 0.88 },
      { x: -0.12, y: 0.78 },
      { x: -0.17, y: 0.68 },
      { x: -0.21, y: 0.59 },
      { x: -0.25, y: 0.62 },
      { x: -0.29, y: 0.71 },
      { x: -0.34, y: 0.8 },
      { x: -0.39, y: 0.86 },
      { x: -0.45, y: 0.89 },
      { x: -0.52, y: 0.88 },
      { x: -0.59, y: 0.83 },
      { x: -0.65, y: 0.76 },
      { x: -0.7, y: 0.66 },
      { x: -0.74, y: 0.54 },
      { x: -0.77, y: 0.4 },
      { x: -0.785, y: 0.2 },
      { x: -0.79, y: -0.02 },
      { x: -0.79, y: -0.22 },
      { x: -0.73, y: -0.5 },
      { x: -0.6, y: -0.74 },
        { x: -0.43, y: -0.91 },
        { x: -0.22, y: -1.01 }
      ].map(({ x, y }) => {
        // Une seule courbe de resserrement pour eviter un faux creux a la taille.
        const t = Math.max(0, Math.min(1, (y + 0.35) / 1.2))
        const eased = t * t * (3 - 2 * t)
        return { x: x * (1 - 0.14 * eased), y }
      }),
      0,
      0
    ),
    3
  ),
  1.04
)

export const SHAPES: BotShape[] = [
  { id: 'cercle', radii: new Array(PROFILE_SAMPLES).fill(1) },
  { id: 'galet', radii: pebble },
  // 1.15 et pas 1.02 : sur une superellipse le rayon maximal est la diagonale,
  // donc normaliser dessus donne une forme qui parait plus petite que le cercle.
  { id: 'squircle', radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  // -90deg : un sommet vers le haut de l'ecran (y est oriente vers le bas)
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg : sommets a gauche et a droite, donc aretes du haut et du bas plates
  { id: 'hexagone', radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: 'nuage', radii: cloud },
  { id: 'goutte', radii: droplet },
  { id: 'losange', radii: regularPolygonProfile(4, 1.08, 0.16, -90) },
  { id: 'fantome', radii: ghost }
]

// Map indexee par `string` et non par `ShapeId` : les appelants interrogent avec
// une valeur relue du localStorage ou d'une prop, donc non validee.
export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'cercle'

export type ColorId =
  | 'encre'
  | 'creme'
  | 'brun'
  | 'rouge'
  | 'orange'
  | 'ambre'
  | 'vert'
  | 'turquoise'
  | 'bleu'
  | 'violet'
  | 'rose'
  | 'gris'

export interface BotColor {
  id: ColorId
  hex: string
}

/** Palette du personnalisateur d'origine. */
export const COLORS: BotColor[] = [
  { id: 'encre', hex: '#0a0a0c' },
  { id: 'brun', hex: '#8b5e3c' },
  { id: 'rouge', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'ambre', hex: '#f0b429' },
  { id: 'vert', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'bleu', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'rose', hex: '#e152b0' },
  { id: 'gris', hex: '#a3a3a3' },
  { id: 'creme', hex: '#f1efe9' }
]

export const COLOR_BY_ID = new Map<string, BotColor>(COLORS.map((c) => [c.id, c]))
export const DEFAULT_COLOR = 'encre'

/** Melange deux couleurs hex. Sert a la brume de profondeur des particules. */
export function mixHex(from: string, to: string, t: number): string {
  const parse = (h: string) => {
    const v = parseInt(h.slice(1), 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  }
  const a = parse(from)
  const b = parse(to)
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t))
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}
