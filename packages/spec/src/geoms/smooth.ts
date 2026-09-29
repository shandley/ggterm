/**
 * geom_smooth - Smoothed conditional means
 *
 * Adds a smoothed line with optional confidence interval band.
 * Uses linear regression (lm) or LOESS smoothing.
 */

import type { Geom } from '../types'

export interface SmoothOptions {
  /** Smoothing method: 'lm' for linear, 'loess' or 'lowess' for local regression */
  method?: 'lm' | 'loess' | 'lowess'
  /** For loess: proportion of data to use in each local regression (0-1) */
  span?: number
  /** Number of points to evaluate the smooth at */
  n?: number
  /** Show confidence interval band? */
  se?: boolean
  /** Confidence level (default 0.95) */
  level?: number
  /** Line color */
  color?: string
  /** Confidence band fill color (defaults to line color with alpha) */
  fill?: string
  /** Alpha for confidence band (0-1) */
  alpha?: number
  /** Line width/style */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Add a smoothed conditional mean line with confidence interval
 *
 * @example
 * ```ts
 * // Linear regression with confidence band
 * gg(data).geom(geom_smooth())
 *
 * // LOESS smoothing
 * gg(data).geom(geom_smooth({ method: 'loess' }))
 *
 * // Linear regression without confidence band
 * gg(data).geom(geom_smooth({ se: false }))
 *
 * // Custom styling
 * gg(data).geom(geom_smooth({
 *   method: 'lm',
 *   color: '#3366cc',
 *   alpha: 0.2
 * }))
 * ```
 */
export function geom_smooth(options: SmoothOptions = {}): Geom {
  return {
    type: 'smooth',
    stat: 'smooth',
    position: 'identity',
    params: {
      method: options.method ?? 'lm',
      span: options.span ?? 0.75,
      n: options.n ?? 80,
      se: options.se ?? true,
      level: options.level ?? 0.95,
      color: options.color,
      fill: options.fill,
      alpha: options.alpha ?? 0.3,
      linetype: options.linetype ?? 'solid',
    },
  }
}
