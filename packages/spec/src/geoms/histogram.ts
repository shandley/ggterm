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

export interface FreqpolyOptions {
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
  /** Line color */
  color?: string
  /** Line type */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Frequency polygon - line version of histogram
 *
 * Draws a line connecting the midpoints of histogram bins.
 * Useful for comparing multiple distributions on the same plot
 * since lines don't overlap like bars do.
 *
 * @example
 * ```ts
 * // Basic frequency polygon
 * gg(data)
 *   .aes({ x: 'value' })
 *   .geom(geom_freqpoly())
 *
 * // Compare multiple distributions
 * gg(data)
 *   .aes({ x: 'value', color: 'group' })
 *   .geom(geom_freqpoly({ bins: 20 }))
 * ```
 */
export function geom_freqpoly(options: FreqpolyOptions = {}): Geom {
  return {
    type: 'freqpoly',
    stat: 'bin',
    params: {
      bins: options.bins ?? 30,
      binwidth: options.binwidth,
      center: options.center,
      boundary: options.boundary,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}
