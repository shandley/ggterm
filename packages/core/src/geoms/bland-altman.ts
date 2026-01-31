/**
 * Bland-Altman Plot Geom
 *
 * Creates Bland-Altman plots (difference plots) for method comparison.
 * Used to assess agreement between two measurement methods.
 *
 * Plots the difference between methods against their mean.
 * Shows mean difference (bias) and limits of agreement (±1.96 SD).
 *
 * Expected data format:
 * - method1: Measurements from first method
 * - method2: Measurements from second method
 * OR pre-computed:
 * - mean: Mean of two methods ((method1 + method2) / 2)
 * - diff: Difference between methods (method1 - method2)
 *
 * @example
 * ```typescript
 * gg(comparisonData)
 *   .aes({ x: 'method1', y: 'method2' })
 *   .geom(geom_bland_altman({ show_limits: true, show_bias: true }))
 * ```
 */

import type { Geom } from '../types'

export interface BlandAltmanOptions {
  /** Show limits of agreement lines (default: true) */
  show_limits?: boolean
  /** Show mean bias line (default: true) */
  show_bias?: boolean
  /** Multiplier for limits of agreement (default: 1.96 for 95% limits) */
  limit_multiplier?: number
  /** Color for bias line (default: '#0000ff') */
  bias_color?: string
  /** Color for limit lines (default: '#ff0000') */
  limit_color?: string
  /** Line style for reference lines (default: 'dashed') */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Show confidence intervals for limits (default: false) */
  show_ci?: boolean
  /** Confidence level (default: 0.95) */
  conf_level?: number
  /** Point character (default: '●') */
  point_char?: string
  /** Show percentage difference instead of absolute (default: false) */
  percent_diff?: boolean
  /** Data is pre-computed mean/diff format (default: false) */
  precomputed?: boolean
}

export function geom_bland_altman(options: BlandAltmanOptions = {}): Geom {
  return {
    type: 'bland_altman',
    stat: 'identity',
    position: 'identity',
    params: {
      show_limits: options.show_limits ?? true,
      show_bias: options.show_bias ?? true,
      limit_multiplier: options.limit_multiplier ?? 1.96,
      bias_color: options.bias_color ?? '#0000ff',
      limit_color: options.limit_color ?? '#ff0000',
      linetype: options.linetype ?? 'dashed',
      show_ci: options.show_ci ?? false,
      conf_level: options.conf_level ?? 0.95,
      point_char: options.point_char ?? '●',
      percent_diff: options.percent_diff ?? false,
      precomputed: options.precomputed ?? false,
    },
  }
}
