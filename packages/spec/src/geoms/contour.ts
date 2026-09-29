/**
 * geom_contour - Contour line geometry
 *
 * Renders contour lines from a 2D density or grid.
 */

import type { Geom } from '../types'

export interface ContourOptions {
  /** Number of contour levels (default: 10) */
  bins?: number
  /** Specific contour break values */
  breaks?: number[]
  /** Bandwidth for 2D density estimation */
  bandwidth?: number | [number, number]
  /** Alpha transparency */
  alpha?: number
  /** Line color */
  color?: string
  /** Linetype */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Render contour lines
 */
export function geom_contour(options: ContourOptions = {}): Geom {
  return {
    type: 'contour',
    stat: 'contour',
    position: 'identity',
    params: {
      bins: options.bins ?? 10,
      breaks: options.breaks,
      bandwidth: options.bandwidth,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Filled contour polygons
 */
export function geom_contour_filled(options: ContourOptions = {}): Geom {
  return {
    type: 'contour_filled',
    stat: 'contour',
    position: 'identity',
    params: {
      ...options,
      filled: true,
    },
  }
}

/**
 * 2D density contours
 */
export function geom_density_2d(options: ContourOptions = {}): Geom {
  return {
    type: 'contour',
    stat: 'density_2d',
    position: 'identity',
    params: {
      bins: options.bins ?? 10,
      breaks: options.breaks,
      bandwidth: options.bandwidth,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}
