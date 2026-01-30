/**
 * geom_ridgeline - Ridgeline plot geometry (joy plots)
 *
 * Creates stacked density plots for comparing distributions across groups.
 * Each group gets a ridge that can overlap with neighbors for a compact view.
 */

import type { Geom } from '../types'

export interface RidgelineOptions {
  /** Height scale for ridges (default: 0.9, higher = more overlap) */
  scale?: number
  /** Alpha transparency (default: 0.8) */
  alpha?: number
  /** Fill color */
  fill?: string
  /** Border/outline color */
  color?: string
  /** Bandwidth adjustment factor for density (default: 1) */
  adjust?: number
  /** Number of points for density estimation (default: 128) */
  n?: number
  /** Whether to show ridge outlines (default: true) */
  outline?: boolean
}

/**
 * Render ridgeline plot (joy plot)
 *
 * Ridgeline plots show the distribution of a numeric variable (x)
 * for several groups (y). Each group is displayed as a density curve,
 * stacked vertically with optional overlap.
 *
 * @example
 * ```typescript
 * import { gg, geom_ridgeline } from '@ggterm/core'
 *
 * // Basic ridgeline plot
 * gg(data)
 *   .aes({ x: 'value', y: 'month' })
 *   .geom(geom_ridgeline())
 *
 * // With custom scale (more overlap)
 * gg(data)
 *   .aes({ x: 'temperature', y: 'city', fill: 'city' })
 *   .geom(geom_ridgeline({ scale: 1.5, alpha: 0.7 }))
 * ```
 */
export function geom_ridgeline(options: RidgelineOptions = {}): Geom {
  return {
    type: 'ridgeline',
    stat: 'xdensity',
    position: 'identity',
    params: {
      scale: options.scale ?? 0.9,
      alpha: options.alpha ?? 0.8,
      fill: options.fill,
      color: options.color,
      adjust: options.adjust ?? 1,
      n: options.n ?? 128,
      outline: options.outline ?? true,
    },
  }
}

/**
 * Alias for geom_ridgeline
 * Named after the Joy Division album cover that popularized this visualization
 */
export const geom_joy = geom_ridgeline
