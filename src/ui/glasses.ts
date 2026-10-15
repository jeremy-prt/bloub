export const GLASSES_STYLES = [
  'round',
  'square',
  'aviator',
  'catEye',
  'wayfarer',
  'sun'
] as const

export type GlassesStyle = (typeof GLASSES_STYLES)[number]

export function isGlassesStyle(value: string): value is GlassesStyle {
  return GLASSES_STYLES.some((style) => style === value)
}

export const EYE_COLORS = [
  { id: 'light', hex: '#f9f9f9' },
  { id: 'brown', hex: '#75452d' },
  { id: 'hazel', hex: '#a87938' },
  { id: 'green', hex: '#4a8058' },
  { id: 'blue', hex: '#4d83b8' },
  { id: 'gray', hex: '#7c8795' },
  { id: 'violet', hex: '#8466a8' },
  { id: 'dark', hex: '#29252d' }
] as const

export type EyeColorId = (typeof EYE_COLORS)[number]['id']

export function eyeColorHex(value: string): string {
  return (
    EYE_COLORS.find((color) => color.id === value)?.hex ??
    (/^#[0-9a-f]{6}$/i.test(value) ? value : '#f9f9f9')
  )
}

export function glassesLensPath(
  style: GlassesStyle,
  width: number,
  height: number,
  mirrored = false
): string {
  const x = (ratio: number) => Number((ratio * width).toFixed(2))
  const y = (ratio: number) => Number((ratio * height).toFixed(2))
  const side = mirrored ? -1 : 1

  if (style === 'round') {
    return `M${x(-0.5)} 0 A${x(0.5)} ${y(0.5)} 0 1 0 ${x(0.5)} 0 A${x(0.5)} ${y(0.5)} 0 1 0 ${x(-0.5)} 0 Z`
  }

  if (style === 'square') {
    const rx = x(0.13)
    const ry = y(0.16)
    return `M${x(-0.5) + rx} ${y(-0.5)} H${x(0.5) - rx} Q${x(0.5)} ${y(-0.5)} ${x(0.5)} ${y(-0.5) + ry} V${y(0.5) - ry} Q${x(0.5)} ${y(0.5)} ${x(0.5) - rx} ${y(0.5)} H${x(-0.5) + rx} Q${x(-0.5)} ${y(0.5)} ${x(-0.5)} ${y(0.5) - ry} V${y(-0.5) + ry} Q${x(-0.5)} ${y(-0.5)} ${x(-0.5) + rx} ${y(-0.5)} Z`
  }

  if (style === 'aviator') {
    return `M${x(-0.5)} ${y(-0.34)} Q0 ${y(-0.56)} ${x(0.5)} ${y(-0.34)} L${x(0.39)} ${y(0.18)} Q${x(0.31)} ${y(0.5)} 0 ${y(0.52)} Q${x(-0.31)} ${y(0.5)} ${x(-0.39)} ${y(0.18)} Z`
  }

  if (style === 'catEye') {
    return `M${x(-side * 0.28)} ${y(-0.48)} L${x(side * 0.28)} ${y(-0.48)} Q${x(side * 0.43)} ${y(-0.48)} ${x(side * 0.5)} ${y(-0.68)} L${x(side * 0.43)} ${y(0.16)} Q${x(side * 0.38)} ${y(0.49)} 0 ${y(0.48)} Q${x(-side * 0.4)} ${y(0.46)} ${x(-side * 0.47)} ${y(0.12)} Q${x(-side * 0.5)} ${y(-0.16)} ${x(-side * 0.28)} ${y(-0.48)} Z`
  }

  if (style === 'wayfarer') {
    return `M${x(-side * 0.48)} ${y(-0.48)} L${x(side * 0.3)} ${y(-0.48)} Q${x(side * 0.5)} ${y(-0.48)} ${x(side * 0.5)} ${y(-0.25)} L${x(side * 0.42)} ${y(0.2)} Q${x(side * 0.36)} ${y(0.49)} 0 ${y(0.48)} Q${x(-side * 0.42)} ${y(0.45)} ${x(-side * 0.48)} ${y(0.12)} Z`
  }

  return `M${x(-0.5)} ${y(-0.22)} Q${x(-0.5)} ${y(-0.5)} ${x(-0.24)} ${y(-0.5)} H${x(0.24)} Q${x(0.5)} ${y(-0.5)} ${x(0.5)} ${y(-0.22)} L${x(0.43)} ${y(0.2)} Q${x(0.37)} ${y(0.48)} 0 ${y(0.49)} Q${x(-0.37)} ${y(0.48)} ${x(-0.43)} ${y(0.2)} Z`
}
