/**
 * Sparkline Geom
 *
 * Creates sparklines - word-sized inline graphics showing trends.
 * Uses Unicode block characters for compact visualization.
 *
 * Required aesthetics:
 * - x: sequence/time variable (or index)
 * - y: values to plot
 *
 * Optional aesthetics:
 * - group: for multiple sparklines
 */

import type { Geom } from '../types.js'

export interface SparklineOptions {
  /** Type of sparkline: 'line' (default), 'bar', 'dot' */
  type?: 'line' | 'bar' | 'dot'
  /** Width in characters (default: 20) */
  width?: number
  /** Height in characters - for 'line' type (default: 1) */
  height?: number
  /** Show min/max markers */
  show_minmax?: boolean
  /** Color for the sparkline */
  color?: string
  /** Color for minimum point */
  min_color?: string
  /** Color for maximum point */
  max_color?: string
  /** Normalize values to 0-1 range (default: true) */
  normalize?: boolean
}

// Unicode block characters for sparkline bars (8 levels)
export const SPARK_BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

// Braille-based line characters for smoother lines
export const SPARK_DOTS = ['⠀', '⢀', '⢠', '⢰', '⢸', '⣸', '⣾', '⣿']

export function geom_sparkline(options: SparklineOptions = {}): Geom {
  return {
    type: 'sparkline',
    stat: 'identity',
    position: 'identity',
    params: {
      sparkType: options.type ?? 'bar',
      width: options.width ?? 20,
      height: options.height ?? 1,
      show_minmax: options.show_minmax ?? false,
      color: options.color,
      min_color: options.min_color ?? '#e74c3c',
      max_color: options.max_color ?? '#2ecc71',
      normalize: options.normalize ?? true,
    },
  }
}
