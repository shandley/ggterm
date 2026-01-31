/**
 * geom_volcano - Volcano plot for differential expression analysis
 *
 * Visualizes statistical significance vs magnitude of change, commonly used
 * in genomics for differential expression results. Points are colored by
 * significance status: up-regulated, down-regulated, or not significant.
 *
 * @example
 * ```ts
 * // Basic volcano plot
 * gg(deResults)
 *   .aes({ x: 'log2FoldChange', y: 'pvalue', label: 'gene' })
 *   .geom(geom_volcano())
 *
 * // With custom thresholds and labels
 * gg(deResults)
 *   .aes({ x: 'log2FC', y: 'padj', label: 'symbol' })
 *   .geom(geom_volcano({
 *     fc_threshold: 1.5,
 *     p_threshold: 0.01,
 *     n_labels: 10,
 *     show_thresholds: true
 *   }))
 * ```
 */

import type { Geom } from '../types'

export interface VolcanoOptions {
  /** Log2 fold change threshold for significance (default: 1, meaning 2-fold) */
  fc_threshold?: number
  /** P-value threshold for significance (default: 0.05) */
  p_threshold?: number
  /** Whether y-axis is already -log10 transformed (default: false, will transform) */
  y_is_neglog10?: boolean
  /** Color for up-regulated points (default: '#e41a1c' - red) */
  up_color?: string
  /** Color for down-regulated points (default: '#377eb8' - blue) */
  down_color?: string
  /** Color for non-significant points (default: '#999999' - gray) */
  ns_color?: string
  /** Show threshold lines (default: true) */
  show_thresholds?: boolean
  /** Line type for thresholds (default: 'dashed') */
  threshold_linetype?: 'solid' | 'dashed' | 'dotted'
  /** Number of top significant points to label (default: 0, no labels) */
  n_labels?: number
  /** Point size (default: 1) */
  size?: number
  /** Point opacity (default: 0.6) */
  alpha?: number
  /** Point character (default: '●') */
  point_char?: string
  /** Show legend for significance groups (default: true) */
  show_legend?: boolean
  /** Custom significance classification function */
  classify?: (log2fc: number, pval: number) => 'up' | 'down' | 'ns'
}

/**
 * Create a volcano plot for differential expression visualization
 *
 * Data should contain:
 * - x column: log2 fold change values
 * - y column: p-values (will be -log10 transformed) or -log10(p) if y_is_neglog10=true
 * - label column (optional): gene names or identifiers for labeling top hits
 *
 * Points are automatically classified as:
 * - Up-regulated: log2FC > fc_threshold AND p < p_threshold
 * - Down-regulated: log2FC < -fc_threshold AND p < p_threshold
 * - Not significant: everything else
 */
export function geom_volcano(options: VolcanoOptions = {}): Geom {
  return {
    type: 'volcano',
    stat: 'identity',
    position: 'identity',
    params: {
      fc_threshold: options.fc_threshold ?? 1,
      p_threshold: options.p_threshold ?? 0.05,
      y_is_neglog10: options.y_is_neglog10 ?? false,
      up_color: options.up_color ?? '#e41a1c',
      down_color: options.down_color ?? '#377eb8',
      ns_color: options.ns_color ?? '#999999',
      show_thresholds: options.show_thresholds ?? true,
      threshold_linetype: options.threshold_linetype ?? 'dashed',
      n_labels: options.n_labels ?? 0,
      size: options.size ?? 1,
      alpha: options.alpha ?? 0.6,
      point_char: options.point_char ?? '●',
      show_legend: options.show_legend ?? true,
      classify: options.classify,
    },
  }
}
