/**
 * geom_treemap - Treemap visualization
 *
 * Displays hierarchical data as nested rectangles where area represents value.
 * Great for file sizes, market caps, budgets, or any hierarchical categorical data.
 *
 * @example
 * ```ts
 * // Flat treemap (no hierarchy)
 * const data = [
 *   { name: 'A', value: 100 },
 *   { name: 'B', value: 80 },
 *   { name: 'C', value: 60 },
 * ]
 *
 * gg(data)
 *   .aes({ label: 'name', value: 'value' })
 *   .geom(geom_treemap())
 *
 * // Hierarchical treemap
 * const hierarchical = [
 *   { id: 'root', parent: null, value: 0 },
 *   { id: 'A', parent: 'root', value: 100 },
 *   { id: 'B', parent: 'root', value: 80 },
 *   { id: 'A1', parent: 'A', value: 60 },
 *   { id: 'A2', parent: 'A', value: 40 },
 * ]
 *
 * gg(hierarchical)
 *   .aes({ id: 'id', parent: 'parent', value: 'value' })
 *   .geom(geom_treemap())
 * ```
 */

import type { Geom } from '../types'

export interface TreemapOptions {
  /** Tiling algorithm: 'squarify', 'binary', 'slice', 'dice' (default: 'squarify') */
  algorithm?: 'squarify' | 'binary' | 'slice' | 'dice'
  /** Show labels in rectangles (default: true) */
  show_labels?: boolean
  /** Show values in rectangles (default: false) */
  show_values?: boolean
  /** Border character (default: '│' and '─') */
  border?: boolean
  /** Padding between nested rectangles (default: 0) */
  padding?: number
  /** Minimum rectangle size to show label (default: 4) */
  min_label_size?: number
  /** Color by: 'value', 'depth', 'parent' (default: 'value') */
  color_by?: 'value' | 'depth' | 'parent'
  /** Fill character (default: '█') */
  fill_char?: string
  /** Maximum depth to show (default: unlimited) */
  max_depth?: number
  /** Aspect ratio target for squarify (default: 1.618 golden ratio) */
  aspect_ratio?: number
}

/**
 * Create a treemap visualization
 *
 * Data can be:
 * 1. Flat: rows with name/label and value
 * 2. Hierarchical: rows with id, parent, and value
 *
 * For hierarchical data:
 * - Root node should have parent = null or undefined
 * - Leaf nodes should have non-zero values
 * - Branch nodes can have value = 0 (sum of children used)
 */
export function geom_treemap(options: TreemapOptions = {}): Geom {
  return {
    type: 'treemap',
    stat: 'identity',
    position: 'identity',
    params: {
      algorithm: options.algorithm ?? 'squarify',
      show_labels: options.show_labels ?? true,
      show_values: options.show_values ?? false,
      border: options.border ?? true,
      padding: options.padding ?? 0,
      min_label_size: options.min_label_size ?? 4,
      color_by: options.color_by ?? 'value',
      fill_char: options.fill_char ?? '█',
      max_depth: options.max_depth,
      aspect_ratio: options.aspect_ratio ?? 1.618,
    },
  }
}
