/**
 * geom_ma - MA plot for differential expression analysis
 *
 * Visualizes log fold change (M) vs average expression (A), commonly used
 * alongside volcano plots in genomics. Shows intensity-dependent expression
 * changes and helps identify biases in differential expression data.
 *
 * M = log2(fold change) = log2(condition1) - log2(condition2)
 * A = average expression = (log2(condition1) + log2(condition2)) / 2
 *
 * @example
 * ```ts
 * // Basic MA plot
 * gg(deResults)
 *   .aes({ x: 'baseMean', y: 'log2FoldChange', label: 'gene' })
 *   .geom(geom_ma())
 *
 * // With custom thresholds and labels
 * gg(deResults)
 *   .aes({ x: 'avgExpr', y: 'log2FC', label: 'symbol' })
 *   .geom(geom_ma({
 *     fc_threshold: 1.5,
 *     p_col: 'padj',
 *     p_threshold: 0.01,
 *     n_labels: 10,
 *   }))
 * ```
 */

import type { Geom } from '../types'

export interface MAOptions {
  /** Log2 fold change threshold for coloring (default: 1, meaning 2-fold) */
  fc_threshold?: number
  /** P-value threshold for significance coloring (default: 0.05) */
  p_threshold?: number
  /** Column name containing p-values for significance (default: uses fc_threshold only) */
  p_col?: string
  /** Whether x-axis (A) is already log2 transformed (default: false, will transform) */
  x_is_log2?: boolean
  /** Color for up-regulated points (default: '#e41a1c' - red) */
  up_color?: string
  /** Color for down-regulated points (default: '#377eb8' - blue) */
  down_color?: string
  /** Color for non-significant points (default: '#999999' - gray) */
  ns_color?: string
  /** Show M=0 baseline (default: true) */
  show_baseline?: boolean
  /** Show fold change threshold lines (default: true) */
  show_thresholds?: boolean
  /** Line type for reference lines (default: 'dashed') */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Number of top significant points to label (default: 0, no labels) */
  n_labels?: number
  /** Point size (default: 1) */
  size?: number
  /** Point opacity (default: 0.6) */
  alpha?: number
  /** Point character (default: '●') */
  point_char?: string
  /** Show LOESS/lowess smoothing line (default: false) */
  show_smooth?: boolean
}

/**
 * Create an MA plot for differential expression visualization
 *
 * Data should contain:
 * - x column: average expression (A) - baseMean, avgExpr, or AveExpr
 * - y column: log2 fold change (M) - log2FoldChange, log2FC, or logFC
 * - label column (optional): gene names for labeling top hits
 * - p-value column (optional): for significance-based coloring
 *
 * Points are classified as:
 * - Up-regulated: M > fc_threshold (AND p < p_threshold if p_col specified)
 * - Down-regulated: M < -fc_threshold (AND p < p_threshold if p_col specified)
 * - Not significant: everything else
 */
export function geom_ma(options: MAOptions = {}): Geom {
  return {
    type: 'ma',
    stat: 'identity',
    position: 'identity',
    params: {
      fc_threshold: options.fc_threshold ?? 1,
      p_threshold: options.p_threshold ?? 0.05,
      p_col: options.p_col,
      x_is_log2: options.x_is_log2 ?? false,
      up_color: options.up_color ?? '#e41a1c',
      down_color: options.down_color ?? '#377eb8',
      ns_color: options.ns_color ?? '#999999',
      show_baseline: options.show_baseline ?? true,
      show_thresholds: options.show_thresholds ?? true,
      linetype: options.linetype ?? 'dashed',
      n_labels: options.n_labels ?? 0,
      size: options.size ?? 1,
      alpha: options.alpha ?? 0.6,
      point_char: options.point_char ?? '●',
      show_smooth: options.show_smooth ?? false,
    },
  }
}
