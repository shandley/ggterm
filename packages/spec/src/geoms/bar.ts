/**
 * geom_bar - Bar geometry
 */

import type { Geom } from '../types'
import type { Position } from '../positions'

export interface BarOptions {
  stat?: 'count' | 'identity'
  width?: number
  /** Position adjustment: 'stack' | 'dodge' | 'fill' or use position_*() functions */
  position?: Position | 'stack' | 'dodge' | 'fill' | 'identity'
  alpha?: number
  color?: string
  fill?: string
}

/**
 * Render vertical bars
 *
 * @example
 * ```ts
 * // Stacked bar chart (default)
 * gg(data).geom(geom_bar())
 *
 * // Grouped bar chart
 * gg(data).geom(geom_bar({ position: 'dodge' }))
 *
 * // Or with position function for more control
 * gg(data).geom(geom_bar({ position: position_dodge({ width: 0.7 }) }))
 *
 * // 100% stacked bar chart
 * gg(data).geom(geom_bar({ position: 'fill' }))
 * ```
 */
export function geom_bar(options: BarOptions = {}): Geom {
  return {
    type: 'bar',
    stat: options.stat ?? 'count',
    position: options.position ?? 'stack',
    params: {
      width: options.width ?? 0.9,
      alpha: options.alpha ?? 1,
      color: options.color,
      fill: options.fill,
    },
  }
}

/**
 * Render columns (alias for geom_bar with stat='identity')
 */
export function geom_col(options: Omit<BarOptions, 'stat'> = {}): Geom {
  return geom_bar({ ...options, stat: 'identity' })
}
