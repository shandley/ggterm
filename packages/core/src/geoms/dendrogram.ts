/**
 * Dendrogram Geom
 *
 * Hierarchical tree visualization for clustering results, phylogenetics, etc.
 * Supports both pre-computed dendrograms and automatic hierarchical clustering.
 *
 * Data format options:
 * 1. Linkage matrix: Standard hierarchical clustering output
 *    [{ merge1: idx1, merge2: idx2, height: h, size: n }, ...]
 * 2. Newick format: Phylogenetic tree string in 'newick' column
 * 3. Parent-child: { id, parent, height? } format
 *
 * @example
 * // Linkage matrix format
 * const linkage = [
 *   { merge1: 0, merge2: 1, height: 0.5, size: 2 },
 *   { merge1: 2, merge2: 3, height: 1.0, size: 2 },
 *   { merge1: 4, merge2: 5, height: 2.0, size: 4 },
 * ]
 * gg(linkage).geom(geom_dendrogram({ labels: ['A', 'B', 'C', 'D'] }))
 *
 * @example
 * // Parent-child format
 * const tree = [
 *   { id: 'root', parent: null, height: 3 },
 *   { id: 'A', parent: 'node1', height: 0 },
 *   { id: 'B', parent: 'node1', height: 0 },
 *   { id: 'node1', parent: 'root', height: 1 },
 * ]
 * gg(tree).aes({ x: 'id', y: 'height' }).geom(geom_dendrogram())
 */

import type { Geom } from '../types'

export interface DendrogramOptions {
  /** Orientation: 'vertical' (root at top) or 'horizontal' (root at left) */
  orientation?: 'vertical' | 'horizontal'
  /** Leaf labels (for linkage matrix format) */
  labels?: string[]
  /** Show leaf labels */
  show_labels?: boolean
  /** Hang leaves at same level (vs proportional to height) */
  hang?: boolean
  /** Cut height for coloring clusters */
  cut_height?: number
  /** Number of clusters to highlight (alternative to cut_height) */
  k?: number
  /** Branch line character */
  branch_char?: string
  /** Horizontal connector character */
  h_connector?: string
  /** Vertical connector character */
  v_connector?: string
  /** Corner characters */
  corner_tl?: string
  corner_tr?: string
  corner_bl?: string
  corner_br?: string
  /** Leaf character */
  leaf_char?: string
  /** Colors for different clusters */
  cluster_colors?: string[]
  /** Line style: 'square' (default) or 'diagonal' */
  line_style?: 'square' | 'diagonal'
  /** Column containing parent references */
  parent_col?: string
  /** Column containing node heights */
  height_col?: string
  /** Column containing node IDs */
  id_col?: string
}

/**
 * Create a dendrogram geom for hierarchical tree visualization
 */
export function geom_dendrogram(options: DendrogramOptions = {}): Geom {
  return {
    type: 'dendrogram',
    stat: 'identity',
    position: 'identity',
    params: {
      orientation: options.orientation ?? 'vertical',
      labels: options.labels,
      show_labels: options.show_labels ?? true,
      hang: options.hang ?? false,
      cut_height: options.cut_height,
      k: options.k,
      branch_char: options.branch_char ?? '│',
      h_connector: options.h_connector ?? '─',
      v_connector: options.v_connector ?? '│',
      corner_tl: options.corner_tl ?? '┌',
      corner_tr: options.corner_tr ?? '┐',
      corner_bl: options.corner_bl ?? '└',
      corner_br: options.corner_br ?? '┘',
      leaf_char: options.leaf_char ?? '○',
      cluster_colors: options.cluster_colors,
      line_style: options.line_style ?? 'square',
      parent_col: options.parent_col ?? 'parent',
      height_col: options.height_col ?? 'height',
      id_col: options.id_col ?? 'id',
    },
  }
}
