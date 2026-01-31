/**
 * Manhattan Plot Geometry
 *
 * Visualizes GWAS (Genome-Wide Association Study) results with genomic position
 * on the x-axis and -log10(p-value) on the y-axis. Points are colored by chromosome
 * and significant associations are highlighted.
 */

import type { Geom } from '../types'

export interface ManhattanOptions {
  // Significance thresholds
  suggestive_threshold?: number // Default: 1e-5 (suggestive significance)
  genome_wide_threshold?: number // Default: 5e-8 (genome-wide significance)

  // Column names
  chr_col?: string // Column containing chromosome (default: inferred from x)
  pos_col?: string // Column containing position (default: inferred from x)
  p_col?: string // Column containing p-value (default: inferred from y)

  // Y-axis transformation
  y_is_neglog10?: boolean // If true, y values are already -log10 transformed

  // Colors
  chr_colors?: string[] // Alternating colors for chromosomes
  highlight_color?: string // Color for significant points (default: '#e41a1c')
  suggestive_color?: string // Color for suggestive points (default: '#ff7f00')

  // Reference lines
  show_thresholds?: boolean // Show significance threshold lines (default: true)
  threshold_linetype?: string // Line type for thresholds (default: 'dashed')

  // Labeling
  n_labels?: number // Number of top SNPs to label (default: 0)
  label_col?: string // Column to use for labels

  // Point styling
  size?: number // Point size (default: 1)
  alpha?: number // Point opacity (default: 0.6)
  point_char?: string // Character for points (default: '●')

  // Chromosome handling
  chr_gap?: number // Gap between chromosomes as fraction (default: 0.02)
}

// Default alternating chromosome colors (blue/gray)
const DEFAULT_CHR_COLORS = ['#1f78b4', '#a6cee3']

export function geom_manhattan(options: ManhattanOptions = {}): Geom {
  return {
    type: 'manhattan',
    stat: 'identity',
    position: 'identity',
    params: {
      suggestive_threshold: options.suggestive_threshold ?? 1e-5,
      genome_wide_threshold: options.genome_wide_threshold ?? 5e-8,
      chr_col: options.chr_col,
      pos_col: options.pos_col,
      p_col: options.p_col,
      y_is_neglog10: options.y_is_neglog10 ?? false,
      chr_colors: options.chr_colors ?? DEFAULT_CHR_COLORS,
      highlight_color: options.highlight_color ?? '#e41a1c',
      suggestive_color: options.suggestive_color ?? '#ff7f00',
      show_thresholds: options.show_thresholds ?? true,
      threshold_linetype: options.threshold_linetype ?? 'dashed',
      n_labels: options.n_labels ?? 0,
      label_col: options.label_col,
      size: options.size ?? 1,
      alpha: options.alpha ?? 0.6,
      point_char: options.point_char ?? '●',
      chr_gap: options.chr_gap ?? 0.02,
    },
  }
}
