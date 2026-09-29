/**
 * Waffle Geom
 *
 * Creates waffle charts - grid-based part-of-whole visualizations.
 * A more readable alternative to pie charts, perfect for terminal display.
 *
 * Required aesthetics:
 * - fill: category variable
 * - values: numeric values or counts (from data)
 *
 * Optional aesthetics:
 * - label: category labels
 */

import type { Geom } from '../types.js'

export interface WaffleOptions {
  /** Number of rows in the waffle grid (default: 10) */
  rows?: number
  /** Number of columns in the waffle grid (default: 10) */
  cols?: number
  /** Total units to represent (default: 100 for percentages) */
  n_total?: number
  /** Character for filled cells */
  fill_char?: string
  /** Character for empty cells */
  empty_char?: string
  /** Opacity (0-1) */
  alpha?: number
  /** Show legend (default: true) */
  show_legend?: boolean
  /** Flip direction - fill by row instead of column */
  flip?: boolean
  /** Gap between cells (0 or 1) */
  gap?: number
}

export function geom_waffle(options: WaffleOptions = {}): Geom {
  return {
    type: 'waffle',
    stat: 'identity',
    position: 'identity',
    params: {
      rows: options.rows ?? 10,
      cols: options.cols ?? 10,
      n_total: options.n_total ?? 100,
      fill_char: options.fill_char ?? '█',
      empty_char: options.empty_char ?? '░',
      alpha: options.alpha ?? 1,
      show_legend: options.show_legend ?? true,
      flip: options.flip ?? false,
      gap: options.gap ?? 0,
    },
  }
}
