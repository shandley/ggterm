/**
 * geom_beeswarm - Beeswarm plot geometry
 *
 * Creates jittered point plots where points are arranged to avoid overlap,
 * showing both individual data points and distribution shape.
 */

import type { Geom } from '../types'

export interface BeeswarmOptions {
  /** Method for arranging points: 'swarm' | 'center' | 'square' (default: 'swarm') */
  method?: 'swarm' | 'center' | 'square'
  /** Point size multiplier (default: 1) */
  size?: number
  /** Point size for collision detection (default: 1) */
  cex?: number
  /** Alpha transparency (default: 1) */
  alpha?: number
  /** Point color */
  color?: string
  /** Point shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' */
  shape?: string
  /** Side to place points: 0 (both), -1 (left), 1 (right) (default: 0) */
  side?: -1 | 0 | 1
  /** Priority for placing points: 'ascending' | 'descending' | 'density' | 'random' */
  priority?: 'ascending' | 'descending' | 'density' | 'random'
  /** Dodge width for categorical spacing (default: 0.8) */
  dodge?: number
}

/**
 * Create beeswarm point geometry
 *
 * Beeswarm plots arrange points to avoid overlap while showing their
 * exact values, combining the benefits of jitter and violin plots.
 *
 * @example
 * ```typescript
 * import { gg, geom_beeswarm } from '@ggterm/core'
 *
 * // Basic beeswarm plot
 * gg(data)
 *   .aes({ x: 'group', y: 'value' })
 *   .geom(geom_beeswarm())
 *
 * // Customized with color and method
 * gg(data)
 *   .aes({ x: 'treatment', y: 'response', color: 'treatment' })
 *   .geom(geom_beeswarm({ method: 'swarm', size: 2, alpha: 0.8 }))
 *
 * // One-sided swarm
 * gg(data)
 *   .aes({ x: 'category', y: 'measurement' })
 *   .geom(geom_beeswarm({ side: 1 }))  // Points only to the right
 * ```
 */
export function geom_beeswarm(options: BeeswarmOptions = {}): Geom {
  return {
    type: 'beeswarm',
    stat: 'beeswarm',
    position: 'identity',
    params: {
      method: options.method ?? 'swarm',
      size: options.size ?? 1,
      cex: options.cex ?? 1,
      alpha: options.alpha ?? 1,
      color: options.color,
      shape: options.shape ?? 'circle',
      side: options.side ?? 0,
      priority: options.priority ?? 'ascending',
      dodge: options.dodge ?? 0.8,
    },
  }
}

/**
 * Alias for beeswarm with quasirandom-like arrangement
 * Uses 'center' method for a more uniform look
 */
export function geom_quasirandom(options: Omit<BeeswarmOptions, 'method'> = {}): Geom {
  return geom_beeswarm({ ...options, method: 'center' })
}
