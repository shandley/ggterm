/**
 * Braille Geom
 *
 * Creates high-resolution plots using Unicode Braille patterns.
 * Each character cell contains a 2x4 grid of dots, allowing
 * 8x the resolution of regular character plots.
 *
 * Braille patterns: U+2800 to U+28FF (256 patterns)
 * Each pattern is a 2-column x 4-row grid:
 *   ⠁⠂  (1,4)
 *   ⠄⠈  (2,5)
 *   ⠐⠠  (3,6)
 *   ⡀⢀  (7,8)
 *
 * Required aesthetics:
 * - x: x-axis variable
 * - y: y-axis variable
 *
 * Optional aesthetics:
 * - color: point color
 * - group: for multiple series
 */

import type { Geom } from '../types.js'

export interface BrailleOptions {
  /** Type of braille plot: 'point' (default), 'line' */
  type?: 'point' | 'line'
  /** Color for the dots/lines */
  color?: string
  /** Fill the area under the line (for line type) */
  fill?: boolean
  /** Opacity (0-1) */
  alpha?: number
  /** Dot size - how many braille dots per data point (1-4) */
  dot_size?: number
}

// Braille dot positions (bit values)
// ⠁=1  ⠂=2   (row 0)
// ⠄=4  ⠈=8   (row 1)
// ⠐=16 ⠠=32  (row 2)
// ⡀=64 ⢀=128 (row 3)
export const BRAILLE_BASE = 0x2800

// Dot position mapping: [col][row] -> bit value
export const BRAILLE_DOTS: number[][] = [
  [0x01, 0x02, 0x04, 0x40], // Left column (col 0): rows 0-3
  [0x08, 0x10, 0x20, 0x80], // Right column (col 1): rows 0-3
]

export function geom_braille(options: BrailleOptions = {}): Geom {
  return {
    type: 'braille',
    stat: 'identity',
    position: 'identity',
    params: {
      brailleType: options.type ?? 'point',
      color: options.color,
      fill: options.fill ?? false,
      alpha: options.alpha ?? 1,
      dot_size: options.dot_size ?? 1,
    },
  }
}
