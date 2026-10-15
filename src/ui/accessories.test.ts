import { describe, expect, it } from 'vitest'
import {
  isMouthStyle,
  isMustacheStyle,
  MOUTH_STYLES,
  MUSTACHE_STYLES,
  mouthOpeningPath,
  mouthPath,
  mustachePath,
  parseAccessoryLayout,
  parseAccessoryEyesByShape,
  parseAccessoryLayouts,
  normalizeAccessoryBlockSettingsByShape,
  DEFAULT_ACCESSORY_LAYOUT,
  DEFAULT_ACCESSORY_COLORS
} from './accessories'

describe('accessoires du visage', () => {
  it('fournit neuf silhouettes distinctes de moustache', () => {
    const paths = MUSTACHE_STYLES.map((style) => mustachePath(style))
    expect(new Set(paths).size).toBe(MUSTACHE_STYLES.length)
    expect(paths.every((path) => path.includes('Z'))).toBe(true)
  })

  it('fournit huit formes de bouche distinctes avec une ouverture assortie', () => {
    const paths = MOUTH_STYLES.map((style) => mouthPath(style))
    expect(new Set(paths).size).toBe(MOUTH_STYLES.length)
    expect(paths.every((path) => path.includes('Z'))).toBe(true)
    const openings = MOUTH_STYLES.map((style) => mouthOpeningPath(style))
    expect(new Set(openings).size).toBe(MOUTH_STYLES.length)
    expect(openings.every((path) => path.includes('Z'))).toBe(true)
  })

  it('valide les styles restaures du stockage', () => {
    expect(isMustacheStyle('handlebar')).toBe(true)
    expect(isMustacheStyle('invalid')).toBe(false)
    expect(isMouthStyle('pout')).toBe(true)
    expect(isMouthStyle('invalid')).toBe(false)
  })

  it('valide et borne les placements restaures', () => {
    const parsed = parseAccessoryLayout(
      JSON.stringify({
        glasses: {
          x: 120,
          y: -120,
          width: 3,
          height: 0.1,
          rotation: 190,
          curve: 4,
          leftLensX: 80,
          rightLensY: -80
        },
        mustache: {
          x: 12,
          y: -8,
          width: 1.3,
          height: 0.7,
          rotation: -25,
          curve: -2,
          roundness: 1.4
        }
      })
    )
    expect(parsed.glasses).toEqual({
      x: 90,
      y: -90,
      width: 2.2,
      height: 0.45,
      rotation: 180,
      curve: 1,
      roundness: 0,
      lowerCurve: 0,
      leftLensX: 60,
      leftLensY: 0,
      rightLensX: 0,
      rightLensY: -60
    })
    expect(parsed.mustache).toEqual({
      x: 12,
      y: -8,
      width: 1.3,
      height: 0.7,
      rotation: -25,
      curve: -1,
      roundness: 1,
      lowerCurve: 0
    })
  })

  it('restaure les placements historiques et separe ceux de chaque forme', () => {
    const legacy = parseAccessoryLayouts(
      JSON.stringify({ glasses: { x: 12, y: -4 }, mustache: {} })
    )
    expect(legacy['*']?.glasses).toEqual({
      ...DEFAULT_ACCESSORY_LAYOUT.glasses,
      x: 12,
      y: -4
    })

    const perShape = parseAccessoryLayouts(
      JSON.stringify({
        cercle: {
          glasses: { x: 8, rotation: 15 },
          mustache: { x: 4, y: -3, curve: 0.6, roundness: 0.75 },
          mouth: { x: -5, y: 7, rotation: -12 }
        },
        nuage: { glasses: { x: -6, rotation: -20 } }
      })
    )
    expect(perShape.cercle?.glasses).toEqual({
      ...DEFAULT_ACCESSORY_LAYOUT.glasses,
      x: 8,
      rotation: 15
    })
    expect(perShape.cercle?.mustache).toEqual({
      ...DEFAULT_ACCESSORY_LAYOUT.mustache,
      x: 4,
      y: -3,
      curve: 0.6,
      roundness: 0.75
    })
    expect(perShape.cercle?.mouth).toEqual({
      ...DEFAULT_ACCESSORY_LAYOUT.mouth,
      x: -5,
      y: 7,
      rotation: -12
    })
    expect(perShape.nuage?.glasses).toEqual({
      ...DEFAULT_ACCESSORY_LAYOUT.glasses,
      x: -6,
      rotation: -20
    })
  })

  it('valide les activations et couleurs propres a chaque forme', () => {
    expect(
      normalizeAccessoryBlockSettingsByShape({
        cercle: {
          glasses: { enabled: true, color: '#345678' },
          mouth: { enabled: true },
          mustache: { enabled: true, color: '#202028' }
        },
        nuage: { mustache: { enabled: true, color: '#ABCDEF' } }
      })
    ).toEqual({
      cercle: {
        glasses: { enabled: true, color: '#345678' },
        mouth: { enabled: false, color: DEFAULT_ACCESSORY_COLORS.mouth },
        mustache: { enabled: true, color: DEFAULT_ACCESSORY_COLORS.mustache }
      },
      nuage: { mustache: { enabled: true, color: '#ABCDEF' } }
    })
  })

  it('conserve la visibilite des yeux par forme et dans les reglages de bloc', () => {
    expect(parseAccessoryEyesByShape('{"cercle":true,"triangle":false,"nuage":"oui"}')).toEqual({
      cercle: true,
      triangle: false
    })
    expect(
      normalizeAccessoryBlockSettingsByShape({
        cercle: { glasses: { showEyes: true } }
      })
    ).toEqual({
      cercle: {
        glasses: {
          enabled: false,
          color: DEFAULT_ACCESSORY_COLORS.glasses,
          showEyes: true
        }
      }
    })
  })

  it('module la courbure et la rondeur des formes', () => {
    expect(mustachePath('classic', 0.8, 0.7)).not.toBe(mustachePath('classic'))
    expect(mustachePath('classic', 1, 0)).toContain('C30 32.2 41 27.9 50 20.6')
    expect(mustachePath('handlebar', -0.6, 1)).not.toBe(mustachePath('handlebar'))
    expect(mouthPath('smile', 0.8, 0.7)).not.toBe(mouthPath())
    expect(mouthPath('open')).not.toBe(mouthPath('smile'))
  })

})
