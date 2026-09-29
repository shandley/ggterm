/**
 * UpSet Plot Geom
 *
 * Modern set intersection visualization, superior to Venn diagrams for >3 sets.
 * Shows:
 * - Matrix of set memberships (dots connected by lines)
 * - Bar chart of intersection sizes
 * - Optional set size bars
 *
 * Data format options:
 * 1. Binary matrix: columns are sets, rows are elements (1 = member, 0 = not)
 * 2. List format: 'sets' column with comma-separated set names
 *
 * @example
 * // Binary matrix format
 * const data = [
 *   { A: 1, B: 1, C: 0 },
 *   { A: 1, B: 0, C: 0 },
 *   { A: 0, B: 1, C: 1 },
 * ]
 * gg(data).geom(geom_upset({ sets: ['A', 'B', 'C'] }))
 *
 * @example
 * // List format
 * const data = [
 *   { element: 'gene1', sets: 'A,B' },
 *   { element: 'gene2', sets: 'A' },
 *   { element: 'gene3', sets: 'B,C' },
 * ]
 * gg(data).aes({ x: 'sets' }).geom(geom_upset())
 */

import type { Geom } from '../types'

export interface UpsetOptions {
  /** Set names for binary matrix format */
  sets?: string[]
  /** Minimum intersection size to display */
  min_size?: number
  /** Maximum number of intersections to show */
  max_intersections?: number
  /** Sort intersections by: 'size' (default), 'degree', 'sets' */
  sort_by?: 'size' | 'degree' | 'sets'
  /** Sort order */
  sort_order?: 'desc' | 'asc'
  /** Show set size bars on the left */
  show_set_sizes?: boolean
  /** Character for filled dots in matrix */
  dot_char?: string
  /** Character for empty positions in matrix */
  empty_char?: string
  /** Character for connecting lines in matrix */
  line_char?: string
  /** Bar character for intersection sizes */
  bar_char?: string
  /** Color for dots and bars */
  color?: string
  /** Show intersection degree (number of sets) */
  show_degree?: boolean
}

/**
 * Create an UpSet plot geom for visualizing set intersections
 */
export function geom_upset(options: UpsetOptions = {}): Geom {
  return {
    type: 'upset',
    stat: 'identity',
    position: 'identity',
    params: {
      sets: options.sets,
      min_size: options.min_size ?? 1,
      max_intersections: options.max_intersections ?? 20,
      sort_by: options.sort_by ?? 'size',
      sort_order: options.sort_order ?? 'desc',
      show_set_sizes: options.show_set_sizes ?? true,
      dot_char: options.dot_char ?? '●',
      empty_char: options.empty_char ?? '○',
      line_char: options.line_char ?? '│',
      bar_char: options.bar_char ?? '█',
      color: options.color,
      show_degree: options.show_degree ?? false,
    },
  }
}
