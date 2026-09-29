/**
 * Heatmap Geometry with Optional Clustering
 *
 * Visualizes matrix data as a colored grid with optional hierarchical clustering
 * dendrograms. Commonly used for gene expression matrices, correlation matrices,
 * and other 2D data.
 */

import type { Geom } from '../types'

export interface HeatmapOptions {
  // Data format
  x_col?: string // Column for x categories (rows)
  y_col?: string // Column for y categories (columns)
  value_col?: string // Column for values (default: 'value')

  // Color scale
  low_color?: string // Color for low values (default: '#313695' - blue)
  mid_color?: string // Color for mid values (default: '#ffffbf' - yellow)
  high_color?: string // Color for high values (default: '#a50026' - red)
  na_color?: string // Color for NA/missing values (default: '#808080')
  midpoint?: number // Value for midpoint color (default: auto)

  // Clustering
  cluster_rows?: boolean // Cluster rows (default: false)
  cluster_cols?: boolean // Cluster columns (default: false)
  clustering_method?: 'complete' | 'single' | 'average' // Linkage method (default: 'complete')
  clustering_distance?: 'euclidean' | 'correlation' | 'manhattan' // Distance metric (default: 'euclidean')

  // Dendrograms
  show_row_dendrogram?: boolean // Show row dendrogram (default: true if clustering)
  show_col_dendrogram?: boolean // Show column dendrogram (default: true if clustering)
  dendrogram_ratio?: number // Size ratio for dendrograms (default: 0.15)

  // Labels
  show_row_labels?: boolean // Show row labels (default: true)
  show_col_labels?: boolean // Show column labels (default: true)
  show_values?: boolean // Show values in cells (default: false)
  value_format?: string // Format string for values (default: '.2f')

  // Cell styling
  cell_char?: string // Character for cells (default: '█')
  border?: boolean // Show cell borders (default: false)

  // Scaling
  scale?: 'none' | 'row' | 'column' // Scale data (default: 'none')
}

export function geom_heatmap(options: HeatmapOptions = {}): Geom {
  return {
    type: 'heatmap',
    stat: 'identity',
    position: 'identity',
    params: {
      x_col: options.x_col,
      y_col: options.y_col,
      value_col: options.value_col ?? 'value',
      low_color: options.low_color ?? '#313695',
      mid_color: options.mid_color ?? '#ffffbf',
      high_color: options.high_color ?? '#a50026',
      na_color: options.na_color ?? '#808080',
      midpoint: options.midpoint,
      cluster_rows: options.cluster_rows ?? false,
      cluster_cols: options.cluster_cols ?? false,
      clustering_method: options.clustering_method ?? 'complete',
      clustering_distance: options.clustering_distance ?? 'euclidean',
      show_row_dendrogram: options.show_row_dendrogram ?? true,
      show_col_dendrogram: options.show_col_dendrogram ?? true,
      dendrogram_ratio: options.dendrogram_ratio ?? 0.15,
      show_row_labels: options.show_row_labels ?? true,
      show_col_labels: options.show_col_labels ?? true,
      show_values: options.show_values ?? false,
      value_format: options.value_format ?? '.2f',
      cell_char: options.cell_char ?? '█',
      border: options.border ?? false,
      scale: options.scale ?? 'none',
    },
  }
}
