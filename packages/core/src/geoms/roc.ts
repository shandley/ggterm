/**
 * ROC Curve Geom
 *
 * Creates Receiver Operating Characteristic curves for classifier evaluation.
 * Plots sensitivity (true positive rate) vs 1-specificity (false positive rate).
 *
 * Expected data format:
 * - fpr: False positive rate (1 - specificity), or x values
 * - tpr: True positive rate (sensitivity), or y values
 * - threshold (optional): Classification thresholds
 * - model (optional): Model identifier for comparing multiple classifiers
 *
 * @example
 * ```typescript
 * gg(rocData)
 *   .aes({ x: 'fpr', y: 'tpr', color: 'model' })
 *   .geom(geom_roc({ show_auc: true, show_diagonal: true }))
 * ```
 */

import type { Geom } from '../types'

export interface RocOptions {
  /** Show diagonal reference line (random classifier) (default: true) */
  show_diagonal?: boolean
  /** Color for diagonal line (default: '#888888') */
  diagonal_color?: string
  /** Line style for diagonal (default: 'dashed') */
  diagonal_type?: 'solid' | 'dashed' | 'dotted'
  /** Show AUC value in legend/annotation (default: true) */
  show_auc?: boolean
  /** Show optimal threshold point (Youden's J) (default: false) */
  show_optimal?: boolean
  /** Character for optimal point (default: '●') */
  optimal_char?: string
  /** Show confidence band (default: false) */
  show_ci?: boolean
  /** Confidence level (default: 0.95) */
  conf_level?: number
  /** Fill area under curve (default: false) */
  fill_auc?: boolean
  /** Fill opacity (default: 0.3) */
  fill_alpha?: number
}

export function geom_roc(options: RocOptions = {}): Geom {
  return {
    type: 'roc',
    stat: 'identity',
    position: 'identity',
    params: {
      show_diagonal: options.show_diagonal ?? true,
      diagonal_color: options.diagonal_color ?? '#888888',
      diagonal_type: options.diagonal_type ?? 'dashed',
      show_auc: options.show_auc ?? true,
      show_optimal: options.show_optimal ?? false,
      optimal_char: options.optimal_char ?? '●',
      show_ci: options.show_ci ?? false,
      conf_level: options.conf_level ?? 0.95,
      fill_auc: options.fill_auc ?? false,
      fill_alpha: options.fill_alpha ?? 0.3,
    },
  }
}
