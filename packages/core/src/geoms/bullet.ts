/**
 * Bullet Geom
 *
 * Creates bullet charts - compact progress bars with target markers.
 * Stephen Few's alternative to gauges and meters.
 *
 * Required aesthetics:
 * - x: category/label
 * - y: actual value
 *
 * Optional aesthetics:
 * - target: target value (shown as marker)
 * - ranges: background ranges (poor/satisfactory/good)
 */

import type { Geom } from '../types.js'

export interface BulletOptions {
  /** Width of the bullet chart in characters (default: 40) */
  width?: number
  /** Height of each bullet in characters (default: 1) */
  height?: number
  /** Target marker character */
  target_char?: string
  /** Bar character for actual value */
  bar_char?: string
  /** Background characters for ranges (3 levels) */
  range_chars?: [string, string, string]
  /** Show value labels (default: true) */
  show_values?: boolean
  /** Color for the actual value bar */
  color?: string
  /** Color for the target marker */
  target_color?: string
  /** Orientation: 'horizontal' (default) or 'vertical' */
  orientation?: 'horizontal' | 'vertical'
}

export function geom_bullet(options: BulletOptions = {}): Geom {
  return {
    type: 'bullet',
    stat: 'identity',
    position: 'identity',
    params: {
      width: options.width ?? 40,
      height: options.height ?? 1,
      target_char: options.target_char ?? '│',
      bar_char: options.bar_char ?? '█',
      range_chars: options.range_chars ?? ['░', '▒', '▓'],
      show_values: options.show_values ?? true,
      color: options.color,
      target_color: options.target_color ?? '#e74c3c',
      orientation: options.orientation ?? 'horizontal',
    },
  }
}
