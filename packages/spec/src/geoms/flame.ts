/**
 * geom_flame - Flame graph for performance profiling
 *
 * Displays hierarchical stack data as horizontal bars where width represents
 * time/samples. Used for visualizing CPU profiles, call stacks, etc.
 *
 * @example
 * ```ts
 * // Basic flame graph
 * gg(stackData)
 *   .aes({ x: 'name', y: 'depth', fill: 'value' })
 *   .geom(geom_flame())
 *
 * // With custom colors (icicle style - inverted)
 * gg(stackData)
 *   .aes({ x: 'name', y: 'depth', fill: 'self_time' })
 *   .geom(geom_flame({ style: 'icicle', palette: 'cool' }))
 * ```
 */

import type { Geom } from '../types'

export interface FlameOptions {
  /** Style: 'flame' (bottom-up) or 'icicle' (top-down) (default: 'flame') */
  style?: 'flame' | 'icicle'
  /** Color palette: 'warm' (reds/oranges), 'cool' (blues), 'hot' (red-yellow) */
  palette?: 'warm' | 'cool' | 'hot'
  /** Show value labels in bars (default: true for wide bars) */
  show_labels?: boolean
  /** Minimum width to show label (default: 10) */
  min_label_width?: number
  /** Sort frames within level: 'alpha', 'value', 'none' (default: 'alpha') */
  sort?: 'alpha' | 'value' | 'none'
  /** Character for filled bars (default: '█') */
  bar_char?: string
}

/**
 * Create a flame graph visualization
 *
 * Data should have:
 * - name/label: Frame/function name
 * - value/width: Time or sample count (determines width)
 * - depth/level: Stack depth (0 = root)
 * - start: Optional start position (for pre-computed layouts)
 * - parent: Optional parent name for hierarchy building
 */
export function geom_flame(options: FlameOptions = {}): Geom {
  return {
    type: 'flame',
    stat: 'identity',
    position: 'identity',
    params: {
      style: options.style ?? 'flame',
      palette: options.palette ?? 'warm',
      show_labels: options.show_labels ?? true,
      min_label_width: options.min_label_width ?? 10,
      sort: options.sort ?? 'alpha',
      bar_char: options.bar_char ?? '█',
    },
  }
}

/**
 * Alias for icicle chart (top-down flame graph)
 */
export function geom_icicle(options: FlameOptions = {}): Geom {
  return geom_flame({ ...options, style: 'icicle' })
}
