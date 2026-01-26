/**
 * geom_qq - Q-Q plot geometry
 *
 * Creates Q-Q (quantile-quantile) plots to assess whether data
 * follows a particular distribution (typically normal).
 *
 * @example
 * ```ts
 * // Basic Q-Q plot to check normality
 * gg(data)
 *   .aes({ x: 'values' })
 *   .geom(geom_qq())
 *   .geom(geom_qq_line())
 *
 * // With custom distribution
 * gg(data)
 *   .aes({ x: 'values' })
 *   .geom(geom_qq({ distribution: 'uniform' }))
 * ```
 */

import type { Geom } from '../types'

export interface QQOptions {
  /** Distribution to compare against (default: 'norm') */
  distribution?: 'norm' | 'uniform' | 'exp'
  /** Distribution parameters */
  dparams?: { mean?: number; sd?: number; rate?: number }
  /** Point size */
  size?: number
  /** Point shape */
  shape?: string
  /** Point color */
  color?: string
  /** Alpha transparency */
  alpha?: number
}

export interface QQLineOptions {
  /** Distribution to compare against (default: 'norm') */
  distribution?: 'norm' | 'uniform' | 'exp'
  /** Distribution parameters */
  dparams?: { mean?: number; sd?: number; rate?: number }
  /** Line color */
  color?: string
  /** Line type */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Alpha transparency */
  alpha?: number
}

/**
 * Q-Q plot points
 *
 * Plots sample quantiles against theoretical quantiles.
 * If the points fall approximately on the diagonal reference line,
 * the data follows the reference distribution.
 *
 * The x aesthetic should be the variable to test.
 * Output uses x = theoretical quantile, y = sample quantile.
 */
export function geom_qq(options: QQOptions = {}): Geom {
  return {
    type: 'point',
    stat: 'qq',
    params: {
      distribution: options.distribution ?? 'norm',
      dparams: options.dparams,
      size: options.size ?? 1,
      shape: options.shape ?? '●',
      color: options.color,
      alpha: options.alpha ?? 1,
    },
  }
}

/**
 * Q-Q plot reference line
 *
 * Draws a line through the first and third quartiles of the
 * theoretical vs sample distribution. Points should fall on
 * this line if the data follows the reference distribution.
 */
export function geom_qq_line(options: QQLineOptions = {}): Geom {
  return {
    type: 'segment',
    stat: 'qq_line',
    params: {
      distribution: options.distribution ?? 'norm',
      dparams: options.dparams,
      color: options.color ?? 'gray',
      linetype: options.linetype ?? 'dashed',
      alpha: options.alpha ?? 1,
    },
  }
}
