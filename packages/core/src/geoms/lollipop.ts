/**
 * Lollipop Geom
 *
 * Creates lollipop charts - a line from baseline to a point with a dot at the end.
 * A cleaner alternative to bar charts, especially for sparse data.
 *
 * Required aesthetics:
 * - x: category (categorical) or value (numeric)
 * - y: value (numeric) or category (categorical)
 *
 * Optional aesthetics:
 * - color: point/line color
 * - size: point size
 */

import type { Geom } from '../types.js'

export interface LollipopOptions {
  /** Size of the point (default: 2) */
  size?: number
  /** Color of the point */
  color?: string
  /** Line color (default: same as point color or gray) */
  lineColor?: string
  /** Line width (default: 1) */
  lineWidth?: number
  /** Opacity (0-1) */
  alpha?: number
  /** Point shape: 'circle' | 'square' | 'diamond' */
  shape?: 'circle' | 'square' | 'diamond'
  /** Direction: 'vertical' (default) or 'horizontal' */
  direction?: 'vertical' | 'horizontal'
  /** Baseline value (default: 0) */
  baseline?: number
}

export function geom_lollipop(options: LollipopOptions = {}): Geom {
  return {
    type: 'lollipop',
    stat: 'identity',
    position: 'identity',
    params: {
      size: options.size ?? 2,
      color: options.color,
      lineColor: options.lineColor,
      lineWidth: options.lineWidth ?? 1,
      alpha: options.alpha ?? 1,
      shape: options.shape ?? 'circle',
      direction: options.direction ?? 'vertical',
      baseline: options.baseline ?? 0,
    },
  }
}
