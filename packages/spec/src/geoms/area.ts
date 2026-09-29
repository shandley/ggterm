/**
 * geom_area - Area geometry
 */

import type { Geom } from '../types'

export interface AreaOptions {
  alpha?: number
  color?: string
  fill?: string
}

/**
 * Render filled area under a line
 */
export function geom_area(options: AreaOptions = {}): Geom {
  return {
    type: 'area',
    stat: 'identity',
    position: 'stack',
    params: {
      alpha: options.alpha ?? 0.5,
      color: options.color,
      fill: options.fill,
    },
  }
}

/**
 * Render a ribbon (band between ymin and ymax)
 */
export function geom_ribbon(options: AreaOptions = {}): Geom {
  return {
    type: 'ribbon',
    stat: 'identity',
    position: 'identity',
    params: {
      alpha: options.alpha ?? 0.3,
      color: options.color,
      fill: options.fill,
    },
  }
}
