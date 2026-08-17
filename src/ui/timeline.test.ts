import { describe, expect, it } from 'vitest'
import { BASE_SCALE, clampZoom, MAX_ZOOM, MIN_ZOOM, mmss, ticksFor } from './timeline'
import * as timeline from './timeline'

describe('mise en forme', () => {
  it('ecrit le temps en minutes et secondes', () => {
    expect(mmss(0)).toBe('0:00')
    expect(mmss(4.9)).toBe('0:04')
    expect(mmss(65)).toBe('1:05')
    // une date negative n'existe pas dans un montage
    expect(mmss(-3)).toBe('0:00')
  })

  /*
   * Ce test etait VIDE : il ne verifiait rien et comptait quand meme dans le total. Il
   * restait de l'epoque ou la mise en forme localisee vivait ici. On lui fait donc dire ce
   * qu'il pretendait — que ce module reste PUR, sans langue.
   *
   * Le separateur decimal change avec la langue et l'unite se traduit, donc les durees en
   * secondes passent par `secondes` / `secondesCourtes` de `@/i18n`. `mmss` reste ici : le
   * format mm:ss n'a ni unite ni separateur decimal.
   */
  it('ne met en forme aucune duree localisee : ca appartient a i18n', () => {
    expect(Object.keys(timeline).filter((n) => /^secondes/.test(n))).toEqual([])
    expect(mmss(65)).toBe('1:05')
  })

})

describe('graduation de la regle', () => {
  it('espace les nombres d au moins 52 px', () => {
    for (const zoom of [MIN_ZOOM, 1, MAX_ZOOM]) {
      const scale = BASE_SCALE * zoom
      const majeurs = ticksFor(60, scale).filter((t) => t.major)
      const ecart = (majeurs[1]!.t - majeurs[0]!.t) * scale
      expect(ecart).toBeGreaterThanOrEqual(52)
    }
  })

  it('elargit le pas quand on dezoome', () => {
    const pas = (scale: number) => {
      const majeurs = ticksFor(60, scale).filter((t) => t.major)
      return majeurs[1]!.t - majeurs[0]!.t
    }
    expect(pas(BASE_SCALE * MIN_ZOOM)).toBeGreaterThan(pas(BASE_SCALE * MAX_ZOOM))
  })

  it('commence a zero et ne depasse pas la duree', () => {
    const reperes = ticksFor(10, BASE_SCALE)
    expect(reperes[0]).toEqual({ t: 0, major: true })
    expect(reperes[reperes.length - 1]!.t).toBeLessThanOrEqual(10)
  })

  it('ne pose des reperes intermediaires que s ils sont lisibles', () => {
    // quelle que soit l echelle, deux reperes voisins gardent 7 px entre eux
    for (const scale of [0.5, 8, 20, BASE_SCALE, 106]) {
      const reperes = ticksFor(60, scale)
      const ecart = (reperes[1]!.t - reperes[0]!.t) * scale
      expect(ecart).toBeGreaterThanOrEqual(7)
    }
    // a l echelle normale, il y en a
    expect(ticksFor(10, BASE_SCALE).some((t) => !t.major)).toBe(true)
    // tres dezoome, il n y en a plus
    expect(ticksFor(600, 0.5).every((t) => t.major)).toBe(true)
  })

  it('ne rend pas la piste vide sur un montage minuscule', () => {
    expect(ticksFor(0.6, BASE_SCALE).length).toBeGreaterThan(0)
  })

  /*
   * Garde-fou independant de celui de `parseCycles` : cette fonction rend un objet par
   * graduation et le composant un `<span>` par objet, donc une duree aberrante se paie en
   * centaines de milliers de noeuds. Elle ne doit pas dependre d'un garde situe ailleurs.
   */
  it('ne rend jamais un nombre aberrant de graduations', () => {
    for (const total of [1e5, 1e7, 1.5e6]) {
      const ticks = ticksFor(total, BASE_SCALE)
      expect(ticks.length, `total=${total}`).toBeLessThanOrEqual(2000)
      // et elles restent croissantes et bien formees
      expect(ticks[0]!.t).toBe(0)
      expect(ticks.every((x, i) => i === 0 || x.t > ticks[i - 1]!.t)).toBe(true)
    }
  })
})

describe('bornes de la loupe', () => {
  it('ramene le zoom dans ses bornes', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(99)).toBe(MAX_ZOOM)
    expect(clampZoom(1)).toBe(1)
  })
})
