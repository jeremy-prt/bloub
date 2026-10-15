import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/bot/engine'
import { SHAPE_BY_ID } from '@/bot/skins'
import { FULL_TURN, gazeSweep, SWEEP_PERIOD, sweepLook, TOUR_TIME, tourLook } from './gaze'

const circle = SHAPE_BY_ID.get('cercle')!.radii

describe('barrido 3D de los ojos', () => {
  it('completa una vuelta horizontal periódica', () => {
    expect(gazeSweep(0)).toBe(0)
    expect(gazeSweep(SWEEP_PERIOD / 4)).toBe(FULL_TURN / 4)
    expect(gazeSweep(SWEEP_PERIOD / 2)).toBe(FULL_TURN / 2)
    expect(gazeSweep((3 * SWEEP_PERIOD) / 4)).toBe((3 * FULL_TURN) / 4)
    expect(gazeSweep(SWEEP_PERIOD)).toBe(0)
  })

  it('mueve solo los ojos y deja igual el cuerpo', () => {
    const normal = new BotEngine(100, 'idle', circle)
    const turning = new BotEngine(100, 'idle', circle)
    turning.setLook(sweepLook(SWEEP_PERIOD / 10), 1 - 1 / 60, 1 / 60)

    const normalFrame = normal.sample(1)
    const turningFrame = turning.sample(1)
    expect(turningFrame.bodyPath).toBe(normalFrame.bodyPath)
    expect(turningFrame.eyes.length).toBeGreaterThan(0)
    expect(turningFrame.eyes.map((eye) => eye.matrix)).not.toEqual(
      normalFrame.eyes.map((eye) => eye.matrix)
    )
  })

  it('oculta los ojos al pasar por detrás y los revela por el otro lado', () => {
    const rear = new BotEngine(100, 'idle', circle)
    rear.setLook(sweepLook(SWEEP_PERIOD / 2), 1 - 1 / 60, 1 / 60)
    expect(rear.sample(1).eyes).toHaveLength(0)

    const otherSide = new BotEngine(100, 'idle', circle)
    otherSide.setLook(sweepLook((3 * SWEEP_PERIOD) / 4), 1 - 1 / 60, 1 / 60)
    expect(otherSide.sample(1).eyes.length).toBeGreaterThan(0)
  })
})

describe('barrido de bienvenida', () => {
  it('termina despues de una vuelta completa sin inclinar la cabeza', () => {
    expect(tourLook(TOUR_TIME).yawOffset).toBe(FULL_TURN)
    expect(tourLook(TOUR_TIME + 5).yawOffset).toBe(FULL_TURN)
    expect(tourLook(TOUR_TIME / 4).pitch).toBe(0)
  })
})
