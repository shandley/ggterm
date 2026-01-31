/**
 * PCA Biplot Geometry
 *
 * Visualizes PCA (Principal Component Analysis) results showing both samples
 * (scores) and variables (loadings) in the same plot. Useful for understanding
 * relationships between samples and which variables drive the separation.
 */

import type { Geom } from '../types'

export interface BiplotOptions {
  // Data columns
  pc1_col?: string // Column for PC1 scores (default: 'PC1')
  pc2_col?: string // Column for PC2 scores (default: 'PC2')

  // Loadings data (optional - for drawing variable arrows)
  loadings?: Array<{
    variable: string
    pc1: number
    pc2: number
  }>

  // Variance explained (for axis labels)
  var_explained?: [number, number] // Variance explained by PC1, PC2 (e.g., [0.45, 0.23])

  // Scores (sample points)
  show_scores?: boolean // Show sample points (default: true)
  score_color?: string // Color for score points (default: uses color aesthetic)
  score_size?: number // Size of score points (default: 1)
  score_alpha?: number // Opacity of score points (default: 0.8)
  score_char?: string // Character for scores (default: '●')
  show_score_labels?: boolean // Show labels for scores (default: false)

  // Loadings (variable arrows)
  show_loadings?: boolean // Show loading arrows (default: true if loadings provided)
  loading_color?: string // Color for loading arrows (default: '#e41a1c')
  loading_scale?: number // Scale factor for loading arrows (default: auto)
  arrow_char?: string // Character for arrow heads (default: '→')
  show_loading_labels?: boolean // Show variable names at arrow tips (default: true)

  // Reference
  show_origin?: boolean // Show origin crosshairs (default: true)
  origin_color?: string // Color for origin lines (default: '#999999')

  // Circle
  show_circle?: boolean // Show unit circle (default: false)
  circle_color?: string // Color for circle (default: '#cccccc')
}

export function geom_biplot(options: BiplotOptions = {}): Geom {
  return {
    type: 'biplot',
    stat: 'identity',
    position: 'identity',
    params: {
      pc1_col: options.pc1_col ?? 'PC1',
      pc2_col: options.pc2_col ?? 'PC2',
      loadings: options.loadings,
      var_explained: options.var_explained,
      show_scores: options.show_scores ?? true,
      score_color: options.score_color,
      score_size: options.score_size ?? 1,
      score_alpha: options.score_alpha ?? 0.8,
      score_char: options.score_char ?? '●',
      show_score_labels: options.show_score_labels ?? false,
      show_loadings: options.show_loadings ?? true,
      loading_color: options.loading_color ?? '#e41a1c',
      loading_scale: options.loading_scale,
      arrow_char: options.arrow_char ?? '→',
      show_loading_labels: options.show_loading_labels ?? true,
      show_origin: options.show_origin ?? true,
      origin_color: options.origin_color ?? '#999999',
      show_circle: options.show_circle ?? false,
      circle_color: options.circle_color ?? '#cccccc',
    },
  }
}
