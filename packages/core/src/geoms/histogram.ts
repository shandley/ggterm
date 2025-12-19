/**
 * geom_histogram - Histogram geometry
 */

import type { Geom } from '../types'

export interface HistogramOptions {
  /** Number of bins (default: 30) */
  bins?: number
  /** Bin width (overrides bins if specified) */
  binwidth?: number
  /** Center of one bin */
  center?: number
  /** Boundary between bins */
  boundary?: number
  /** Alpha transparency */
  alpha?: number
  /** Border color */
  color?: string
  /** Fill color */
  fill?: string
}

/**
 * Render histogram (binned bar chart)
 */
export function geom_histogram(options: HistogramOptions = {}): Geom {
  return {
    type: 'histogram',
    stat: 'bin',
    params: {
      bins: options.bins ?? 30,
      binwidth: options.binwidth,
      center: options.center,
      boundary: options.boundary,
      alpha: options.alpha ?? 1,
      color: options.color,
      fill: options.fill,
    },
  }
}
