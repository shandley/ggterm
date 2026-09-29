/**
 * geom_bin2d - 2D rectangular binning (2D histogram)
 *
 * Divides the plane into rectangles, counts the number of cases in
 * each rectangle, and maps the count to fill color. Useful for
 * visualizing the distribution of large datasets.
 *
 * @example
 * ```ts
 * // Basic 2D histogram
 * gg(data)
 *   .aes({ x: 'sepal_length', y: 'sepal_width' })
 *   .geom(geom_bin2d())
 *
 * // Custom bin count
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_bin2d({ bins: 20 }))
 *
 * // Different bins for x and y
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_bin2d({ binsx: 30, binsy: 20 }))
 * ```
 */

import type { Geom } from '../types'

export interface Bin2dOptions {
  /** Number of bins in both directions (default: 30) */
  bins?: number
  /** Number of bins in x direction (overrides bins) */
  binsx?: number
  /** Number of bins in y direction (overrides bins) */
  binsy?: number
  /** Alpha transparency (default: 1) */
  alpha?: number
  /** Drop bins with zero count (default: true) */
  drop?: boolean
}

/**
 * 2D binning geometry for heatmaps from raw scatter data
 *
 * Unlike geom_tile which expects pre-aggregated data, geom_bin2d
 * automatically bins continuous x/y data into a grid and colors
 * each cell by count.
 */
export function geom_bin2d(options: Bin2dOptions = {}): Geom {
  return {
    type: 'bin2d',
    stat: 'bin2d',
    params: {
      bins: options.bins ?? 30,
      binsx: options.binsx,
      binsy: options.binsy,
      alpha: options.alpha ?? 1,
      drop: options.drop ?? true,
    },
  }
}
