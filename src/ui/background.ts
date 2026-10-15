export type BackgroundMode = 'none' | 'color' | 'gradient' | 'image'
export type BackgroundDirection = 'horizontal' | 'vertical' | 'diagonal' | 'diagonalReverse'

export interface ExportBackground {
  mode: BackgroundMode
  image: string | null
  color: string
  secondColor: string
  direction: BackgroundDirection
}

export const DEFAULT_EXPORT_BACKGROUND: ExportBackground = {
  mode: 'none',
  image: null,
  color: '#f4f1eb',
  secondColor: '#c9d9f2',
  direction: 'diagonal'
}

export const BACKGROUND_DIRECTIONS: Record<
  BackgroundDirection,
  { x1: string; y1: string; x2: string; y2: string }
> = {
  horizontal: { x1: '-158', y1: '0', x2: '158', y2: '0' },
  vertical: { x1: '0', y1: '-158', x2: '0', y2: '158' },
  diagonal: { x1: '-158', y1: '-158', x2: '158', y2: '158' },
  diagonalReverse: { x1: '-158', y1: '158', x2: '158', y2: '-158' }
}
