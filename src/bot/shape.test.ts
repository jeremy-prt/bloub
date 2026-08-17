import { describe, expect, it } from 'vitest'
import { TAU } from './math'
import { PROFILE_SAMPLES } from './profiles'
import { radiusAtAngle, silhouette } from './shape'
import { SHAPES } from './skins'

/**
 * `radiusAtAngle`, la fonction qui recolle sur le contour reel tout ce qui est pose « sur »
 * le corps — les yeux et la pastille de notification.
 *
 * Elle n'avait aucun test, alors que le moteur l'appelle en `atan2(y, x) - pose.sil.rot` et
 * qu'`orbit` pousse `rot` jusqu'a environ -30 rad : son argument sort donc largement de
 * `[0, 2*PI)`. Toute simplification de son double modulo decollerait les yeux de la
 * silhouette pendant l'orbite, soit exactement la panne que cette fonction existe pour
 * eviter.
 */

/** Un profil franchement non circulaire : sur un cercle, tout angle donnerait 1. */
const TRIANGLE = silhouette('triangle').radii

describe('radiusAtAngle', () => {
  it('rend le rayon du profil, pas une constante', () => {
    const vus = new Set(Array.from({ length: 16 }, (_, i) => radiusAtAngle(TRIANGLE, (i / 16) * TAU)))
    expect(vus.size).toBeGreaterThan(8)
  })

  it('enroule les angles negatifs', () => {
    expect(radiusAtAngle(TRIANGLE, -0.1)).toBeCloseTo(radiusAtAngle(TRIANGLE, TAU - 0.1), 12)
    expect(radiusAtAngle(TRIANGLE, -1)).toBeCloseTo(radiusAtAngle(TRIANGLE, TAU - 1), 12)
  })

  /**
   * Le cas d'`orbit` : plusieurs tours dans le negatif. C'est ce que le double modulo de
   * `((x % 1) + 1) % 1` gere et qu'un modulo simple casse.
   */
  it('enroule sur plusieurs tours, dans les deux sens', () => {
    for (const base of [-30, -12.5, 7.3]) {
      for (const tours of [-3, -1, 1, 5]) {
        expect(
          radiusAtAngle(TRIANGLE, base),
          `base=${base} tours=${tours}`
        ).toBeCloseTo(radiusAtAngle(TRIANGLE, base + tours * TAU), 10)
      }
    }
  })

  /**
   * Continue au passage par zero, la ou l'enroulement fait sauter l'index de 63 a 0. Une
   * simplification qui renverrait une valeur de repli — 1, typiquement — se verrait ici
   * comme une marche de 0,22 sur ce profil.
   *
   * Huit decimales et pas neuf : l'ecart mesure vaut 7e-10, du bruit flottant sur des
   * indices calcules par modulo. C'est trois ordres de grandeur sous ce qu'une vraie
   * discontinuite produirait.
   */
  it('est continue au passage par zero', () => {
    expect(radiusAtAngle(TRIANGLE, -1e-9)).toBeCloseTo(radiusAtAngle(TRIANGLE, 1e-9), 8)
    // et la valeur y est bien celle du profil, pas un repli
    expect(radiusAtAngle(TRIANGLE, 0)).toBeCloseTo(TRIANGLE[0]!, 12)
  })
})

/**
 * Les formes du personnalisateur sont baties analytiquement, sans passer par le generateur
 * qui produit `profiles.ts`. Rien ne verifiait leur echantillonnage.
 *
 * C'est ce qui rend le controle necessaire : `blend` interpole par INDEX et retombe sur
 * `?? 1` quand l'index manque, donc une forme construite avec un autre nombre
 * d'echantillons morphe silencieusement vers un cercle unite au lieu d'echouer. Elle serait
 * juste au repos et fausse dans toutes ses transitions — le pire des deux mondes, parce que
 * personne ne penserait a regarder un morph.
 */
describe('profils des formes du personnalisateur', () => {
  it('ont tous le meme echantillonnage angulaire, fini et positif', () => {
    for (const forme of SHAPES) {
      expect(forme.radii, forme.id).toHaveLength(PROFILE_SAMPLES)
      for (const [i, r] of forme.radii.entries()) {
        expect(Number.isFinite(r), `${forme.id}[${i}] = ${r}`).toBe(true)
        expect(r, `${forme.id}[${i}]`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * Bornes larges, uniquement la pour attraper une forme aberrante : un rayon sous 0,3
   * ferait sortir les yeux, un rayon au-dela de 1,6 sortirait du viewBox. Ce ne sont pas des
   * mesures, c'est le domaine dans lequel le reste du dossier a du sens.
   */
  it('restent dans un domaine ou le reste du moteur tient', () => {
    for (const forme of SHAPES) {
      const min = Math.min(...forme.radii)
      const max = Math.max(...forme.radii)
      expect(min, `${forme.id} min`).toBeGreaterThan(0.3)
      expect(max, `${forme.id} max`).toBeLessThan(1.6)
    }
  })
})
