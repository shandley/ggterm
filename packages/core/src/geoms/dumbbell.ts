/**
 * Dumbbell Geom
 *
 * Creates dumbbell charts showing two points connected by a line.
 * Perfect for before/after comparisons, paired data, or showing ranges.
 *
 * Required aesthetics:
 * - x: start value (numeric)
 * - xend: end value (numeric)
 * - y: category (categorical)
 *
 * Optional aesthetics:
 * - color: point/line color
 * - size: point size
 */

import type { Geom } from '../types.js'

export interface DumbbellOptions {
  /** Size of points (default: 2) */
  size?: number
  /** Size of end points, if different from start (default: same as size) */
  sizeEnd?: number
  /** Color of start points */
  color?: string
  /** Color of end points (default: same as color) */
  colorEnd?: string
  /** Line color (default: gray) */
  lineColor?: string
  /** Line width (default: 1) */
  lineWidth?: number
  /** Opacity (0-1) */
  alpha?: number
  /** Point shape: 'circle' | 'square' | 'diamond' */
  shape?: 'circle' | 'square' | 'diamond'
}

export function geom_dumbbell(options: DumbbellOptions = {}): Geom {
  return {
    type: 'dumbbell',
    stat: 'identity',
    position: 'identity',
    params: {
      size: options.size ?? 2,
      sizeEnd: options.sizeEnd ?? options.size ?? 2,
      color: options.color,
      colorEnd: options.colorEnd ?? options.color,
      lineColor: options.lineColor ?? '#666666',
      lineWidth: options.lineWidth ?? 1,
      alpha: options.alpha ?? 1,
      shape: options.shape ?? 'circle',
    },
  }
}
