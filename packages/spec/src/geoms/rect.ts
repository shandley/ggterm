/**
 * geom_rect - Rectangle geometry
 *
 * Renders rectangles defined by xmin, xmax, ymin, ymax.
 */

import type { Geom } from '../types'

export interface RectOptions {
  /** Alpha transparency */
  alpha?: number
  /** Border color */
  color?: string
  /** Fill color */
  fill?: string
  /** Border linetype */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Render rectangles
 */
export function geom_rect(options: RectOptions = {}): Geom {
  return {
    type: 'rect',
    stat: 'identity',
    position: 'identity',
    params: {
      alpha: options.alpha ?? 0.5,
      color: options.color,
      fill: options.fill,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Render arbitrary lines (y = slope * x + intercept)
 */
export interface AblineOptions {
  /** Slope of the line */
  slope?: number
  /** Y-intercept of the line */
  intercept?: number
  /** Alpha transparency */
  alpha?: number
  /** Line color */
  color?: string
  /** Linetype */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

export function geom_abline(options: AblineOptions = {}): Geom {
  return {
    type: 'abline',
    stat: 'identity',
    position: 'identity',
    params: {
      slope: options.slope ?? 1,
      intercept: options.intercept ?? 0,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}
