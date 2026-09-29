/**
 * geom_point - Scatter plot geometry
 */

import type { Geom } from '../types'
import type { Position } from '../positions'

export interface PointOptions {
  size?: number
  shape?: 'circle' | 'square' | 'triangle' | 'cross' | 'diamond'
  alpha?: number
  color?: string
  /** Position adjustment (default: 'identity'). Use position_jitter() for overplotted data. */
  position?: Position | 'identity' | 'jitter' | 'dodge'
}

/**
 * Render data points as scatter plot markers
 *
 * @example
 * ```ts
 * // Basic scatter plot
 * gg(data).geom(geom_point())
 *
 * // Jittered points to avoid overplotting
 * gg(data).geom(geom_point({ position: position_jitter() }))
 *
 * // Or with shorthand
 * gg(data).geom(geom_point({ position: 'jitter' }))
 * ```
 */
export function geom_point(options: PointOptions = {}): Geom {
  return {
    type: 'point',
    stat: 'identity',
    position: options.position ?? 'identity',
    params: {
      size: options.size ?? 1,
      shape: options.shape ?? 'circle',
      alpha: options.alpha ?? 1,
      color: options.color,
    },
  }
}
