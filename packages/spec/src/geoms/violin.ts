/**
 * geom_violin - Violin plot geometry
 *
 * Combines a boxplot with a rotated kernel density plot on each side.
 */

import type { Geom } from '../types'

export interface ViolinOptions {
  /** Width of the violin (default: 0.8) */
  width?: number
  /** Whether to draw the quantile lines (default: true) */
  draw_quantiles?: number[] | null
  /** Scale violins: 'area' (default), 'count', or 'width' */
  scale?: 'area' | 'count' | 'width'
  /** Trim violin to data range (default: true) */
  trim?: boolean
  /** Bandwidth adjustment factor (default: 1) */
  adjust?: number
  /** Alpha transparency */
  alpha?: number
  /** Border color */
  color?: string
  /** Fill color */
  fill?: string
}

/**
 * Render violin plot
 */
export function geom_violin(options: ViolinOptions = {}): Geom {
  return {
    type: 'violin',
    stat: 'ydensity',
    params: {
      width: options.width ?? 0.8,
      draw_quantiles: options.draw_quantiles ?? [0.25, 0.5, 0.75],
      scale: options.scale ?? 'area',
      trim: options.trim ?? true,
      adjust: options.adjust ?? 1,
      alpha: options.alpha ?? 0.8,
      color: options.color,
      fill: options.fill,
    },
  }
}
