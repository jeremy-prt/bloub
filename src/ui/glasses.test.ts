import { describe, expect, it } from 'vitest'
import { glassesLensPath, GLASSES_STYLES } from './glasses'

describe('formes des montures', () => {
  it('dessine un contour distinct pour chaque style', () => {
    const contours = GLASSES_STYLES.map((style) => glassesLensPath(style, 16, 18))

    expect(new Set(contours).size).toBe(GLASSES_STYLES.length)
    expect(contours.every((path) => path.startsWith('M') && path.endsWith('Z'))).toBe(true)
    expect(contours.some((path) => path.includes('NaN'))).toBe(false)
  })

  it('oriente les coins externes des montures oeil-de-chat et wayfarer', () => {
    for (const style of ['catEye', 'wayfarer'] as const) {
      expect(glassesLensPath(style, 16, 18)).not.toBe(
        glassesLensPath(style, 16, 18, true)
      )
    }
  })

  it('donne au style rond un contour circulaire', () => {
    expect(glassesLensPath('round', 16, 16)).toBe('M-8 0 A8 8 0 1 0 8 0 A8 8 0 1 0 -8 0 Z')
  })
})
