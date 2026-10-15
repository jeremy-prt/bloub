export const MUSTACHE_STYLES = [
  'classic',
  'chevron',
  'handlebar',
  'natural',
  'pencil',
  'walrus',
  'horseshoe',
  'imperial',
  'toothbrush'
] as const
export const MOUTH_STYLES = ['smile', 'open', 'pout', 'grin', 'frown', 'smirk', 'round', 'laugh'] as const
export const ACCESSORY_KINDS = ['glasses', 'mustache', 'mouth'] as const

export type MustacheStyle = (typeof MUSTACHE_STYLES)[number]
export type MouthStyle = (typeof MOUTH_STYLES)[number]
export type AccessoryKind = (typeof ACCESSORY_KINDS)[number]

export interface AccessoryBlockSetting {
  enabled: boolean
  color: string
  showEyes?: boolean
}

export type AccessoryBlockSettings = Partial<Record<AccessoryKind, AccessoryBlockSetting>>
export type ResolvedAccessoryBlockSettings = Record<AccessoryKind, AccessoryBlockSetting>
export type AccessoryBlockSettingsByShape = Record<string, AccessoryBlockSettings>
export type AccessoryEyesByShape = Record<string, boolean>
export const DEFAULT_ACCESSORY_COLORS: Record<AccessoryKind, string> = {
  glasses: '#202028',
  mustache: '#202028',
  mouth: '#c96c73'
}

export interface AccessoryPlacement {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  curve: number
  roundness: number
  lowerCurve: number
  leftLensX?: number
  leftLensY?: number
  rightLensX?: number
  rightLensY?: number
}

export interface AccessoryLayout {
  glasses: AccessoryPlacement
  mustache: AccessoryPlacement
  mouth: AccessoryPlacement
}

export const DEFAULT_ACCESSORY_LAYOUT: AccessoryLayout = {
  glasses: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
    curve: 0,
    roundness: 0,
    lowerCurve: 0,
    leftLensX: 0,
    leftLensY: 0,
    rightLensX: 0,
    rightLensY: 0
  },
  mustache: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 },
  mouth: { x: 0, y: 0, width: 1, height: 1, rotation: 0, curve: 0, roundness: 0, lowerCurve: 0 }
}

export type AccessoryLayouts = Record<string, AccessoryLayout>

export function normalizeAccessoryLayout(value: unknown): AccessoryLayout {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_ACCESSORY_LAYOUT)
  const candidate = value as Partial<Record<keyof AccessoryLayout, Partial<AccessoryPlacement>>>
  const placement = (key: keyof AccessoryLayout): AccessoryPlacement => {
    const item = candidate[key]
    const number = (
      field: keyof AccessoryPlacement,
      fallback: number,
      min: number,
      max: number
    ) => {
      const current = item?.[field]
      return typeof current === 'number' && Number.isFinite(current)
        ? Math.min(max, Math.max(min, current))
        : fallback
    }
    const result: AccessoryPlacement = {
      x: number('x', 0, -90, 90),
      y: number('y', 0, -90, 90),
      width: number('width', 1, 0.45, 2.2),
      height: number('height', 1, 0.45, 2.2),
      rotation: number('rotation', 0, -180, 180),
      curve: number('curve', 0, -1, 1),
      roundness: number('roundness', 0, 0, 1),
      lowerCurve: number('lowerCurve', 0, -1, 1)
    }
    if (key === 'glasses') {
      result.leftLensX = number('leftLensX', 0, -60, 60)
      result.leftLensY = number('leftLensY', 0, -60, 60)
      result.rightLensX = number('rightLensX', 0, -60, 60)
      result.rightLensY = number('rightLensY', 0, -60, 60)
    }
    return result
  }
  return {
    glasses: placement('glasses'),
    mustache: placement('mustache'),
    mouth: placement('mouth')
  }
}

export function normalizeAccessoryLayouts(value: unknown): AccessoryLayouts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, layout]) => !!layout && typeof layout === 'object' && !Array.isArray(layout))
      .map(([shape, layout]) => [shape, normalizeAccessoryLayout(layout)])
  )
}

export function normalizeAccessoryBlockSettings(value: unknown): AccessoryBlockSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const source = value as Record<string, unknown>
  const settings: AccessoryBlockSettings = {}
  for (const kind of ACCESSORY_KINDS) {
    const item = source[kind]
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const candidate = item as Record<string, unknown>
    const setting: Partial<AccessoryBlockSetting> = {}
    if (typeof candidate.enabled === 'boolean') setting.enabled = candidate.enabled
    if (kind === 'glasses' && typeof candidate.showEyes === 'boolean') {
      setting.showEyes = candidate.showEyes
    }
    if (typeof candidate.color === 'string' && /^#[0-9a-f]{6}$/i.test(candidate.color)) {
      setting.color = candidate.color
    }
    if (
      setting.enabled !== undefined ||
      setting.color !== undefined ||
      setting.showEyes !== undefined
    ) {
      settings[kind] = {
        enabled: setting.enabled ?? false,
        color: setting.color ?? DEFAULT_ACCESSORY_COLORS[kind],
        ...(setting.showEyes !== undefined ? { showEyes: setting.showEyes } : {})
      }
    }
  }
  if (settings.mustache?.enabled && settings.mouth?.enabled) {
    settings.mouth = { ...settings.mouth, enabled: false }
  }
  return settings
}

export function normalizeAccessoryEyesByShape(value: unknown): AccessoryEyesByShape {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
  )
}

export function parseAccessoryEyesByShape(value: string | null): AccessoryEyesByShape {
  if (!value) return {}
  try {
    return normalizeAccessoryEyesByShape(JSON.parse(value))
  } catch {
    return {}
  }
}

export function normalizeAccessoryBlockSettingsByShape(
  value: unknown
): AccessoryBlockSettingsByShape {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, settings]) => !!settings && typeof settings === 'object' && !Array.isArray(settings))
      .map(([shape, settings]) => [shape, normalizeAccessoryBlockSettings(settings)])
  )
}

export function parseAccessoryLayout(value: string | null): AccessoryLayout {
  if (!value) return structuredClone(DEFAULT_ACCESSORY_LAYOUT)
  try {
    return normalizeAccessoryLayout(JSON.parse(value))
  } catch {
    return structuredClone(DEFAULT_ACCESSORY_LAYOUT)
  }
}

export function parseAccessoryLayouts(value: string | null): AccessoryLayouts {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return {}
    const candidate = parsed as Record<string, unknown>
    if (ACCESSORY_KINDS.some((kind) => kind in candidate)) {
      return { '*': normalizeAccessoryLayout(parsed) }
    }
    return normalizeAccessoryLayouts(candidate)
  } catch {
    return {}
  }
}

export function isMustacheStyle(value: string): value is MustacheStyle {
  return MUSTACHE_STYLES.some((style) => style === value)
}

export function isMouthStyle(value: string): value is MouthStyle {
  return MOUTH_STYLES.some((style) => style === value)
}

export function mustachePath(style: MustacheStyle, curve = 0, roundness = 0): string {
  const lift = curve * 5
  const drop = curve * 3
  const fullness = roundness * 4
  if (style === 'walrus') {
    return `M50 ${15 - lift * 0.3} C39 ${9 - lift * 0.2} 28 ${9 - lift * 0.2} 20 ${13 - lift * 0.2} C12 ${17 - lift * 0.1} 14 ${25 + fullness * 0.4 + drop * 0.2} 22 ${29 + fullness * 0.5 + drop * 0.3} C30 ${34 + fullness + drop * 0.4} 42 ${31 + fullness * 0.5 + drop * 0.3} 50 ${24 + fullness * 0.2 + drop * 0.2} C58 ${31 + fullness * 0.5 + drop * 0.3} 70 ${34 + fullness + drop * 0.4} 78 ${29 + fullness * 0.5 + drop * 0.3} C86 ${25 + fullness * 0.4 + drop * 0.2} 88 ${17 - lift * 0.1} 80 ${13 - lift * 0.2} C72 ${9 - lift * 0.2} 61 ${9 - lift * 0.2} 50 ${15 - lift * 0.3} Z`
  }
  if (style === 'horseshoe') {
    return `M18 ${10 - lift * 0.2} C29 ${8 - lift * 0.2} 41 ${12 - lift * 0.2} 50 ${18 - lift * 0.1} C59 ${12 - lift * 0.2} 71 ${8 - lift * 0.2} 82 ${10 - lift * 0.2} C90 ${12 - lift * 0.1} 88 ${20 + fullness * 0.2} 81 ${21 + fullness * 0.2} C76 ${22 + fullness * 0.2} 72 ${18 - lift * 0.1} 68 ${18 - lift * 0.1} C70 ${26 + drop * 0.3} 67 ${34 + fullness * 0.4 + drop * 0.3} 60 ${35 + fullness * 0.4 + drop * 0.3} C54 ${36 + fullness * 0.4 + drop * 0.3} 53 ${28 + drop * 0.2} 50 ${22 + drop * 0.2} C47 ${28 + drop * 0.2} 46 ${36 + fullness * 0.4 + drop * 0.3} 40 ${35 + fullness * 0.4 + drop * 0.3} C33 ${34 + fullness * 0.4 + drop * 0.3} 30 ${26 + drop * 0.3} 32 ${18 - lift * 0.1} C28 ${18 - lift * 0.1} 24 ${22 + fullness * 0.2} 19 ${21 + fullness * 0.2} C12 ${20 + fullness * 0.2} 10 ${12 - lift * 0.1} 18 ${10 - lift * 0.2} Z`
  }
  if (style === 'imperial') {
    return `M50 ${18 - lift * 0.3} C41 ${11 - lift * 0.3} 31 ${9 - lift * 0.2} 23 ${13 - lift * 0.2} C15 ${17 - lift * 0.2} 19 ${25 + fullness * 0.4 + drop * 0.3} 28 ${25 + fullness * 0.5 + drop * 0.3} C37 ${26 + fullness * 0.4 + drop * 0.3} 44 ${22 + drop * 0.2} 50 ${20 + drop * 0.2} C56 ${22 + drop * 0.2} 63 ${26 + fullness * 0.4 + drop * 0.3} 72 ${25 + fullness * 0.5 + drop * 0.3} C81 ${25 + fullness * 0.4 + drop * 0.3} 85 ${17 - lift * 0.2} 77 ${13 - lift * 0.2} C69 ${9 - lift * 0.2} 59 ${11 - lift * 0.3} 50 ${18 - lift * 0.3} Z M24 ${14 - lift} C18 ${8 - lift * 0.8} 12 ${6 - lift} 9 ${10 - lift} C7 ${14 - lift * 0.5} 13 ${19 + fullness * 0.3} 20 ${19 + fullness * 0.3} Z M76 ${14 - lift} C82 ${8 - lift * 0.8} 88 ${6 - lift} 91 ${10 - lift} C93 ${14 - lift * 0.5} 87 ${19 + fullness * 0.3} 80 ${19 + fullness * 0.3} Z`
  }
  if (style === 'toothbrush') {
    return `M22 ${14 - lift * 0.2} C30 ${11 - lift * 0.2} 41 ${12 - lift * 0.2} 50 ${16 - lift * 0.2} C59 ${12 - lift * 0.2} 70 ${11 - lift * 0.2} 78 ${14 - lift * 0.2} C82 ${16 - lift * 0.2} 82 ${20 + fullness * 0.3 + drop * 0.2} 78 ${22 + fullness * 0.4 + drop * 0.3} C69 ${25 + fullness * 0.6 + drop * 0.3} 60 ${23 + fullness * 0.4 + drop * 0.3} 50 ${21 + fullness * 0.3 + drop * 0.2} C40 ${23 + fullness * 0.4 + drop * 0.3} 31 ${25 + fullness * 0.6 + drop * 0.3} 22 ${22 + fullness * 0.4 + drop * 0.3} C18 ${20 + fullness * 0.3 + drop * 0.2} 18 ${16 - lift * 0.2} 22 ${14 - lift * 0.2} Z`
  }
  if (style === 'chevron') {
    return `M50 ${13 - lift * 0.3} C42 ${13 - lift * 0.4} 34 ${8 - lift * 0.3} 25 ${10 - lift * 0.2} C18 ${12 - lift * 0.2} 16 ${18 - lift * 0.3} 21 ${22 - lift * 0.4} C26 ${26 + fullness + drop * 0.4} 36 ${25 + fullness * 0.5 + drop * 0.3} 44 ${20 + fullness * 0.3 + drop * 0.2} L50 ${35 + fullness * 0.2 + drop} L56 ${20 + fullness * 0.3 + drop * 0.2} C64 ${25 + fullness * 0.5 + drop * 0.3} 74 ${26 + fullness + drop * 0.4} 79 ${22 - lift * 0.4} C84 ${18 - lift * 0.3} 82 ${12 - lift * 0.2} 75 ${10 - lift * 0.2} C66 ${8 - lift * 0.3} 58 ${13 - lift * 0.4} 50 ${13 - lift * 0.3} Z`
  }
  if (style === 'handlebar') {
    return `M50 ${18 - lift * 0.3} C40 ${11 - lift * 0.3} 31 ${9 - lift * 0.2} 23 ${12 - lift * 0.2} C15 ${15 - lift * 0.2} 18 ${24 + fullness * 0.5 + drop * 0.3} 25 ${25 + fullness + drop * 0.5} C34 ${27 + fullness + drop * 0.4} 43 ${22 + fullness * 0.5 + drop * 0.3} 50 ${20 + fullness * 0.3 + drop * 0.2} C57 ${22 + fullness * 0.5 + drop * 0.3} 66 ${27 + fullness + drop * 0.4} 75 ${25 + fullness + drop * 0.5} C82 ${24 + fullness * 0.5 + drop * 0.3} 85 ${15 - lift * 0.2} 77 ${12 - lift * 0.2} C69 ${9 - lift * 0.2} 60 ${11 - lift * 0.3} 50 ${18 - lift * 0.3} Z M24 ${12 - lift} C17 ${6 - lift * 0.8} 10 ${5 - lift} 8 ${9 - lift} C6 ${13 - lift * 0.5} 12 ${18 + fullness * 0.4 + drop * 0.3} 20 ${19 + fullness * 0.4 + drop * 0.3} Z M76 ${12 - lift} C83 ${6 - lift * 0.8} 90 ${5 - lift} 92 ${9 - lift} C94 ${13 - lift * 0.5} 88 ${18 + fullness * 0.4 + drop * 0.3} 80 ${19 + fullness * 0.4 + drop * 0.3} Z`
  }
  if (style === 'natural') {
    return `M50 ${16 - lift * 0.25} C41 ${11 - lift * 0.2} 33 ${11 - lift * 0.2} 26 ${14 - lift * 0.2} C19 ${17 - lift * 0.2} 18 ${22 + fullness * 0.35 + drop * 0.2} 25 ${24 + fullness * 0.6 + drop * 0.35} C33 ${27 + fullness + drop * 0.4} 42 ${23 + fullness * 0.5 + drop * 0.25} 50 ${20 + fullness * 0.3 + drop * 0.15} C58 ${23 + fullness * 0.5 + drop * 0.25} 67 ${27 + fullness + drop * 0.4} 75 ${24 + fullness * 0.6 + drop * 0.35} C82 ${22 + fullness * 0.35 + drop * 0.2} 81 ${17 - lift * 0.2} 74 ${14 - lift * 0.2} C67 ${11 - lift * 0.2} 59 ${11 - lift * 0.2} 50 ${16 - lift * 0.25} Z`
  }
  if (style === 'pencil') {
    return `M19 ${18 - lift * 0.2} C29 ${14 - lift * 0.2} 40 ${14 - lift * 0.2} 50 ${17 - lift * 0.2} C60 ${14 - lift * 0.2} 71 ${14 - lift * 0.2} 81 ${18 - lift * 0.2} L80 ${22 + fullness * 0.4 + drop * 0.2} C69 ${20 + fullness * 0.4 + drop * 0.2} 60 ${20 + fullness * 0.4 + drop * 0.2} 50 ${22 + fullness * 0.5 + drop * 0.25} C40 ${20 + fullness * 0.4 + drop * 0.2} 31 ${20 + fullness * 0.4 + drop * 0.2} 20 ${22 + fullness * 0.4 + drop * 0.2} Z`
  }
  return `M50 ${16 - lift * 0.3} C43 ${10 - lift * 0.3} 36 ${7 - lift * 0.2} 27 ${9 - lift * 0.2} C16 ${11 - lift * 0.2} 14 ${19 - lift * 0.3} 22 ${25 - lift * 0.4} C30 ${31 + fullness + drop * 0.4} 41 ${27 + fullness * 0.5 + drop * 0.3} 50 ${20 + fullness * 0.3 + drop * 0.2} C59 ${27 + fullness * 0.5 + drop * 0.3} 70 ${31 + fullness + drop * 0.4} 78 ${25 - lift * 0.4} C86 ${19 - lift * 0.3} 84 ${11 - lift * 0.2} 73 ${9 - lift * 0.2} C64 ${7 - lift * 0.2} 57 ${10 - lift * 0.3} 50 ${16 - lift * 0.3} Z`
}

export function mouthPath(style: MouthStyle = 'smile', curve = 0, roundness = 0): string {
  const smile = curve * 10
  const opening = 2 + roundness * 8
  const corner = 30 + roundness * 4
  if (style === 'grin') {
    return `M${50 - corner} ${18 - smile * 0.15} C${34 - roundness * 2} ${12 - roundness * 2} ${28 - roundness * 2} ${18 + roundness} ${30 - roundness} ${25 + roundness} C${33 - roundness} ${38 + smile + roundness * 3} ${67 + roundness} ${38 + smile + roundness * 3} ${70 + roundness} ${25 + roundness} C${72 + roundness * 2} ${18 + roundness} ${66 + roundness * 2} ${12 - roundness * 2} ${50 + corner} ${18 - smile * 0.15} Z`
  }
  if (style === 'frown') {
    return `M${50 - corner} ${22 + smile * 0.15} C${38 - roundness} ${22 + smile * 0.4} 39 ${34 + smile} 50 ${34 + smile + opening} C61 ${34 + smile} ${62 + roundness} ${22 + smile * 0.4} ${50 + corner} ${22 + smile * 0.15} C${65 + roundness} ${28 + smile * 0.3} 61 ${38 + smile + opening} 50 ${38 + smile + opening} C39 ${38 + smile + opening} ${35 - roundness} ${28 + smile * 0.3} ${50 - corner} ${22 + smile * 0.15} Z`
  }
  if (style === 'smirk') {
    return `M${50 - corner} ${20 - smile * 0.2} C${39 - roundness} ${20 - smile * 0.3} 38 ${25 + smile * 0.2} 48 ${26 + smile * 0.4} C61 ${29 + smile + opening} 70 ${22 - smile * 0.5} ${50 + corner} ${17 - smile * 0.2} C69 ${26 + smile * 0.2} 61 ${35 + smile + opening} 49 ${33 + smile + opening} C38 ${32 + smile + opening} 34 ${25 + smile * 0.1} ${50 - corner} ${20 - smile * 0.2} Z`
  }
  if (style === 'round') {
    return `M50 ${11 - roundness * 2} C${72 + roundness * 4} ${11 - roundness * 2} ${78 + roundness * 4} ${29 + smile * 0.3} 50 ${31 + smile * 0.3} C${22 - roundness * 4} ${29 + smile * 0.3} ${28 - roundness * 4} ${11 - roundness * 2} 50 ${11 - roundness * 2} Z`
  }
  if (style === 'laugh') {
    return `M${50 - corner} ${18 - smile * 0.2} C${39 - roundness} ${11 - roundness} ${32 - roundness} ${18 + roundness} ${34 - roundness} ${25 + roundness} C${38 - roundness} ${39 + smile + opening} ${62 + roundness} ${39 + smile + opening} ${66 + roundness} ${25 + roundness} C${68 + roundness} ${18 + roundness} ${61 + roundness} ${11 - roundness} ${50 + corner} ${18 - smile * 0.2} Z`
  }
  if (style === 'open') {
    return `M${50 - corner} ${18 - smile * 0.2} C${40 - corner * 0.2} ${13 - smile * 0.3} ${34 - corner * 0.2} ${18 - smile * 0.2} ${35 - corner * 0.2} ${24 + roundness * 2} C${36 - corner * 0.2} ${34 + smile + opening} ${64 + corner * 0.2} ${34 + smile + opening} ${65 + corner * 0.2} ${24 + roundness * 2} C${66 + corner * 0.2} ${18 - smile * 0.2} ${60 + corner * 0.2} ${13 - smile * 0.3} ${50 + corner} ${18 - smile * 0.2} Z`
  }
  if (style === 'pout') {
    return `M${50 - corner} ${19 - smile * 0.2} C${42 - corner * 0.3} ${13 - roundness * 2 - smile * 0.2} 38 ${14 - smile * 0.15} 50 ${20 - roundness * 2 - smile * 0.2} C62 ${14 - smile * 0.15} ${58 + corner * 0.3} ${13 - roundness * 2 - smile * 0.2} ${50 + corner} ${19 - smile * 0.2} C${64 + corner * 0.2} ${25 + smile * 0.3} 61 ${34 + roundness * 5 + smile} 50 ${32 + roundness * 5 + smile} C39 ${34 + roundness * 5 + smile} ${36 - corner * 0.2} ${25 + smile * 0.3} ${50 - corner} ${19 - smile * 0.2} Z`
  }
  return `M${50 - corner} ${17 - smile * 0.25} Q50 ${17 + smile - opening} ${50 + corner} ${17 - smile * 0.25} Q50 ${33 + smile + opening} ${50 - corner} ${17 - smile * 0.25} Z`
}

export function mouthOpeningPath(style: MouthStyle = 'smile', curve = 0, roundness = 0): string {
  const smile = curve * 6
  const opening = roundness * 4
  const corner = 22 + roundness * 2
  if (style === 'grin') {
    return `M${50 - corner} ${22 - smile * 0.1} Q50 ${21 + smile * 0.2} ${50 + corner} ${22 - smile * 0.1} Q50 ${34 + smile + opening} ${50 - corner} ${22 - smile * 0.1} Z`
  }
  if (style === 'laugh') {
    return `M${50 - corner * 1.15} ${21 - smile * 0.15} C${38 - roundness} ${17 - roundness} ${34 - roundness} ${20 + roundness} ${36 - roundness} ${25 + roundness} Q50 ${39 + smile + opening} ${64 + roundness} ${25 + roundness} C${66 + roundness} ${20 + roundness} ${62 + roundness} ${17 - roundness} ${50 + corner * 1.15} ${21 - smile * 0.15} Z`
  }
  if (style === 'frown') {
    return `M${50 - corner} ${27 + smile * 0.1} Q50 ${31 + smile + opening} ${50 + corner} ${27 + smile * 0.1} Q50 ${24 + smile * 0.3} ${50 - corner} ${27 + smile * 0.1} Z`
  }
  if (style === 'smirk') {
    return `M${50 - corner * 0.8} ${24 - smile * 0.1} Q${58 + roundness} ${31 + smile + opening} ${50 + corner * 0.8} ${21 - smile * 0.2} Q${67 - roundness} ${30 + smile} ${50 - corner * 0.8} ${24 - smile * 0.1} Z`
  }
  if (style === 'round') {
    return `M50 ${16 - roundness} C${64 + roundness * 2} ${16 - roundness} ${64 + roundness * 2} ${27 + smile * 0.2} 50 ${27 + smile * 0.2} C${36 - roundness * 2} ${27 + smile * 0.2} ${36 - roundness * 2} ${16 - roundness} 50 ${16 - roundness} Z`
  }
  if (style === 'open') {
    return `M${50 - corner} ${21 - smile * 0.2} C${42 - corner * 0.2} ${18 - smile * 0.2} ${40 - corner * 0.2} ${22 + roundness} 41 ${26 + opening} C43 ${31 + smile + opening} 57 ${31 + smile + opening} 59 ${26 + opening} C${60 + corner * 0.2} ${22 + roundness} ${58 + corner * 0.2} ${18 - smile * 0.2} ${50 + corner} ${21 - smile * 0.2} Z`
  }
  if (style === 'pout') {
    return `M${50 - corner * 0.7} ${23 - smile * 0.15} Q50 ${21 + roundness * 2 + smile * 0.2} ${50 + corner * 0.7} ${23 - smile * 0.15} Q50 ${29 + roundness * 3 + smile * 0.5} ${50 - corner * 0.7} ${23 - smile * 0.15} Z`
  }
  return `M${50 - corner} ${20 - smile * 0.2} Q50 ${20 + smile - opening} ${50 + corner} ${20 - smile * 0.2} Q50 ${27 + smile + opening} ${50 - corner} ${20 - smile * 0.2} Z`
}
