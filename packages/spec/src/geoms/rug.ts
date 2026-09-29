/**
 * geom_rug - Marginal rug plots
 *
 * Draws tick marks along the axes showing the marginal distribution
 * of data points. Commonly used alongside scatter plots to visualize
 * data density along each axis.
 */

import type { Geom } from '../types'

export interface RugOptions {
  /** Which sides to draw rugs on */
  sides?: string // combination of 'b', 't', 'l', 'r' (bottom, top, left, right)
  /** Length of rug ticks (in character cells) */
  length?: number
  /** Opacity (0-1) */
  alpha?: number
  /** Fixed color (hex string) */
  color?: string
  /** Whether to draw outside the plot area (default: true) */
  outside?: boolean
}

/**
 * Draw marginal rug marks along axes
 *
 * Rug plots show tick marks at each data point position along one
 * or both axes. This helps visualize the marginal distribution of
 * data, especially useful for identifying clustering or gaps.
 *
 * @param options.sides - Which sides to draw rugs: 'b' (bottom), 't' (top),
 *   'l' (left), 'r' (right). Can combine, e.g., 'bl' for bottom and left.
 *   Default is 'bl'.
 * @param options.length - Length of rug ticks in character cells. Default is 1.
 * @param options.alpha - Opacity from 0 to 1. Default is 1.
 * @param options.color - Fixed color for all rug marks.
 * @param options.outside - Whether to draw outside plot area. Default is true.
 *
 * @example
 * // Add rugs to a scatter plot (bottom and left)
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_point())
 *   .geom(geom_rug())
 *
 * @example
 * // Rugs on all four sides
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_point())
 *   .geom(geom_rug({ sides: 'bltr' }))
 *
 * @example
 * // Only x-axis rugs (bottom)
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_point())
 *   .geom(geom_rug({ sides: 'b' }))
 *
 * @example
 * // Colored rugs with transparency
 * gg(data)
 *   .aes({ x: 'x', y: 'y', color: 'group' })
 *   .geom(geom_point())
 *   .geom(geom_rug({ alpha: 0.5 }))
 */
export function geom_rug(options: RugOptions = {}): Geom {
  return {
    type: 'rug',
    stat: 'identity',
    position: 'identity',
    params: {
      sides: options.sides ?? 'bl',
      length: options.length ?? 1,
      alpha: options.alpha ?? 1,
      color: options.color,
      outside: options.outside ?? true,
    },
  }
}
