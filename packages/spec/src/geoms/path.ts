/**
 * geom_path - Path geometry
 *
 * Connects data points in the order they appear in the data,
 * unlike geom_line which sorts by x. Useful for trajectories,
 * drawing shapes, and ordered sequences.
 */

import type { Geom } from '../types'

export interface PathOptions {
  /** Line width (1-3) */
  linewidth?: number
  /** Line type */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Opacity (0-1) */
  alpha?: number
  /** Fixed color (hex string) */
  color?: string
  /** Line end style */
  lineend?: 'butt' | 'round' | 'square'
  /** Line join style */
  linejoin?: 'round' | 'mitre' | 'bevel'
}

/**
 * Connect data points in data order (not sorted by x)
 *
 * Unlike geom_line which sorts points by x before connecting them,
 * geom_path connects points in the order they appear in the data.
 * This is essential for:
 * - Trajectories and movement paths
 * - Drawing shapes and polygons
 * - Time series where x is not monotonic
 * - Spiral and circular patterns
 *
 * @example
 * // Draw a trajectory
 * gg(trajectoryData)
 *   .aes({ x: 'longitude', y: 'latitude' })
 *   .geom(geom_path())
 *
 * @example
 * // Draw a spiral
 * const spiral = Array.from({ length: 100 }, (_, i) => {
 *   const t = i * 0.1
 *   return { x: t * Math.cos(t), y: t * Math.sin(t) }
 * })
 * gg(spiral).aes({ x: 'x', y: 'y' }).geom(geom_path())
 *
 * @example
 * // Draw a shape (triangle)
 * const triangle = [
 *   { x: 0, y: 0 },
 *   { x: 1, y: 2 },
 *   { x: 2, y: 0 },
 *   { x: 0, y: 0 }, // close the shape
 * ]
 * gg(triangle).aes({ x: 'x', y: 'y' }).geom(geom_path())
 */
export function geom_path(options: PathOptions = {}): Geom {
  return {
    type: 'path',
    stat: 'identity',
    position: 'identity',
    params: {
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
      alpha: options.alpha ?? 1,
      color: options.color,
      lineend: options.lineend ?? 'butt',
      linejoin: options.linejoin ?? 'round',
    },
  }
}
