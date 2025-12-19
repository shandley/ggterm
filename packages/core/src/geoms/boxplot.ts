/**
 * geom_boxplot - Boxplot geometry
 */

import type { Geom } from '../types'

export interface BoxplotOptions {
  /** Width of the box (default: 0.75) */
  width?: number
  /** Coefficient for whisker length (default: 1.5 * IQR) */
  coef?: number
  /** Show outliers (default: true) */
  outliers?: boolean
  /** Show notch (default: false) */
  notch?: boolean
  /** Alpha transparency */
  alpha?: number
  /** Border color */
  color?: string
  /** Fill color */
  fill?: string
}

/**
 * Render boxplot (box and whisker plot)
 */
export function geom_boxplot(options: BoxplotOptions = {}): Geom {
  return {
    type: 'boxplot',
    stat: 'boxplot',
    params: {
      width: options.width ?? 0.75,
      coef: options.coef ?? 1.5,
      outliers: options.outliers ?? true,
      notch: options.notch ?? false,
      alpha: options.alpha ?? 1,
      color: options.color,
      fill: options.fill,
    },
  }
}
