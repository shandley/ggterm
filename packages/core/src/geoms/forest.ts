/**
 * Forest Plot Geom
 *
 * Creates forest plots for meta-analysis visualization.
 * Shows effect sizes with confidence intervals across multiple studies.
 *
 * Expected data format:
 * - study: Study identifier/name
 * - estimate: Point estimate (e.g., odds ratio, hazard ratio, mean difference)
 * - ci_lower: Lower confidence interval bound
 * - ci_upper: Upper confidence interval bound
 * - weight (optional): Study weight for point size
 *
 * @example
 * ```typescript
 * gg(metaData)
 *   .aes({ y: 'study', x: 'estimate', xmin: 'ci_lower', xmax: 'ci_upper', size: 'weight' })
 *   .geom(geom_forest({ null_line: 1, log_scale: true }))
 * ```
 */

import type { Geom } from '../types'

export interface ForestOptions {
  /** Value for null effect line (default: 1 for ratios, 0 for differences) */
  null_line?: number
  /** Use log scale for x-axis (default: false, set true for ratios) */
  log_scale?: boolean
  /** Show diamond for summary/pooled estimate (default: false) */
  show_summary?: boolean
  /** Row index for summary diamond (default: last row) */
  summary_row?: number
  /** Color for null line (default: '#888888') */
  null_line_color?: string
  /** Line style for null line (default: 'dashed') */
  null_line_type?: 'solid' | 'dashed' | 'dotted'
  /** Point character (default: '■') */
  point_char?: string
  /** Show study weights as percentages (default: false) */
  show_weights?: boolean
  /** Minimum point size (default: 1) */
  min_size?: number
  /** Maximum point size (default: 3) */
  max_size?: number
}

export function geom_forest(options: ForestOptions = {}): Geom {
  return {
    type: 'forest',
    stat: 'identity',
    position: 'identity',
    params: {
      null_line: options.null_line ?? 1,
      log_scale: options.log_scale ?? false,
      show_summary: options.show_summary ?? false,
      summary_row: options.summary_row,
      null_line_color: options.null_line_color ?? '#888888',
      null_line_type: options.null_line_type ?? 'dashed',
      point_char: options.point_char ?? '■',
      show_weights: options.show_weights ?? false,
      min_size: options.min_size ?? 1,
      max_size: options.max_size ?? 3,
    },
  }
}
