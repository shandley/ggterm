/**
 * Shape scales
 *
 * Maps data values to point shapes.
 */

import type { Scale } from '@ggterm/spec/types'

/**
 * Default shape palette
 */
export const DEFAULT_SHAPES = [
  'circle',      // ●
  'square',      // ■
  'triangle',    // ▲
  'diamond',     // ◆
  'cross',       // ✕
  'plus',        // +
  'star',        // ★
  'open_circle', // ○
  'open_square', // □
  'open_triangle', // △
  'open_diamond',  // ◇
  'dot',         // •
]

/**
 * Shape characters for rendering
 */
export const SHAPE_CHARS: Record<string, string> = {
  circle: '●',
  filled_circle: '●',
  open_circle: '○',
  square: '■',
  filled_square: '■',
  open_square: '□',
  triangle: '▲',
  filled_triangle: '▲',
  open_triangle: '△',
  triangle_down: '▼',
  diamond: '◆',
  filled_diamond: '◆',
  open_diamond: '◇',
  cross: '✕',
  plus: '+',
  star: '★',
  open_star: '☆',
  dot: '•',
  bullet: '•',
  asterisk: '*',
  hash: '#',
  at: '@',
}

export interface ShapeScaleOptions {
  /** Available shapes to cycle through */
  values?: string[]
  /** Guide title */
  name?: string
}

/**
 * Discrete shape scale (auto-assigns shapes)
 */
export function scale_shape_discrete(options: ShapeScaleOptions = {}): Scale {
  const shapes = options.values ?? DEFAULT_SHAPES

  return {
    type: 'discrete',
    aesthetic: 'shape',
    domain: undefined,
    range: shapes,
    map(value: unknown): string {
      const strValue = String(value)
      const domain = this.domain as string[] ?? []

      let index = domain.indexOf(strValue)
      if (index === -1) {
        // Add to domain dynamically
        (this.domain as string[]).push(strValue)
        index = domain.length
      }

      return shapes[index % shapes.length]
    },
  }
}

export interface ManualShapeOptions {
  /** Mapping from data values to shapes */
  values: Record<string, string>
  /** Guide title */
  name?: string
}

/**
 * Manual shape scale (explicit mapping)
 */
export function scale_shape_manual(options: ManualShapeOptions): Scale {
  const values = options.values

  return {
    type: 'discrete',
    aesthetic: 'shape',
    domain: Object.keys(values),
    range: Object.values(values),
    map(value: unknown): string {
      const strValue = String(value)
      return values[strValue] ?? 'circle'
    },
  }
}

/**
 * Identity shape scale (use data values directly as shape names)
 */
export function scale_shape_identity(): Scale {
  return {
    type: 'identity',
    aesthetic: 'shape',
    map(value: unknown): string {
      const strValue = String(value)
      return SHAPE_CHARS[strValue] ?? strValue.charAt(0)
    },
  }
}

/**
 * Ordinal shape scale (integer values to shapes)
 */
export function scale_shape_ordinal(options: ShapeScaleOptions = {}): Scale {
  const shapes = options.values ?? DEFAULT_SHAPES

  return {
    type: 'discrete',
    aesthetic: 'shape',
    domain: undefined,
    range: shapes,
    map(value: unknown): string {
      const numValue = typeof value === 'number' ? value : parseInt(String(value), 10)
      if (isNaN(numValue)) return shapes[0]

      const index = Math.abs(numValue) % shapes.length
      return shapes[index]
    },
  }
}
