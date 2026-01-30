/**
 * geom_corrmat - Correlation matrix heatmap
 *
 * Displays pairwise correlations between numeric variables as a heatmap.
 * Color intensity represents correlation strength, with diverging colors
 * for positive (blue) vs negative (red) correlations.
 *
 * @example
 * ```ts
 * // From raw data - computes correlations automatically
 * gg(data)
 *   .aes({ x: 'var1', y: 'var2', fill: 'correlation' })
 *   .geom(geom_corrmat())
 *
 * // From pre-computed correlation matrix
 * gg(corrMatrix)
 *   .aes({ x: 'var1', y: 'var2', fill: 'r' })
 *   .geom(geom_corrmat({ show_values: true, show_significance: true }))
 * ```
 */

import type { Geom } from '../types'

export interface CorrmatOptions {
  /** Show correlation values in cells (default: true) */
  show_values?: boolean
  /** Number of decimal places for values (default: 2) */
  decimals?: number
  /** Show significance markers (default: false) */
  show_significance?: boolean
  /** Significance threshold for markers (default: 0.05) */
  sig_threshold?: number
  /** Significance marker character (default: '*') */
  sig_marker?: string
  /** Color for positive correlations (default: '#2166ac' - blue) */
  positive_color?: string
  /** Color for negative correlations (default: '#b2182b' - red) */
  negative_color?: string
  /** Color for zero/neutral (default: '#f7f7f7' - white) */
  neutral_color?: string
  /** Show only lower triangle (default: false) */
  lower_triangle?: boolean
  /** Show only upper triangle (default: false) */
  upper_triangle?: boolean
  /** Show diagonal (default: true) */
  show_diagonal?: boolean
  /** Method for computing correlation: 'pearson' | 'spearman' (default: 'pearson') */
  method?: 'pearson' | 'spearman'
}

/**
 * Create a correlation matrix heatmap
 *
 * Data can be:
 * 1. Pre-computed: rows with var1, var2, correlation (and optionally p_value)
 * 2. Raw data: will compute pairwise correlations for numeric columns
 *
 * Uses a diverging color scale from negative (red) through zero (white)
 * to positive (blue) correlations.
 */
export function geom_corrmat(options: CorrmatOptions = {}): Geom {
  return {
    type: 'corrmat',
    stat: 'identity',
    position: 'identity',
    params: {
      show_values: options.show_values ?? true,
      decimals: options.decimals ?? 2,
      show_significance: options.show_significance ?? false,
      sig_threshold: options.sig_threshold ?? 0.05,
      sig_marker: options.sig_marker ?? '*',
      positive_color: options.positive_color ?? '#2166ac',
      negative_color: options.negative_color ?? '#b2182b',
      neutral_color: options.neutral_color ?? '#f7f7f7',
      lower_triangle: options.lower_triangle ?? false,
      upper_triangle: options.upper_triangle ?? false,
      show_diagonal: options.show_diagonal ?? true,
      method: options.method ?? 'pearson',
    },
  }
}
