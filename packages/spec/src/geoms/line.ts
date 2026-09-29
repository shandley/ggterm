/**
 * geom_line - Line geometry
 */

import type { Geom } from '../types'

export interface LineOptions {
  linewidth?: number
  linetype?: 'solid' | 'dashed' | 'dotted'
  alpha?: number
  color?: string
}

/**
 * Connect data points with lines
 */
export function geom_line(options: LineOptions = {}): Geom {
  return {
    type: 'line',
    stat: 'identity',
    position: 'identity',
    params: {
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
      alpha: options.alpha ?? 1,
      color: options.color,
    },
  }
}

/**
 * Add a horizontal reference line
 */
export function geom_hline(options: {
  yintercept: number
  linetype?: 'solid' | 'dashed' | 'dotted'
  color?: string
}): Geom {
  return {
    type: 'hline',
    stat: 'identity',
    position: 'identity',
    params: {
      yintercept: options.yintercept,
      linetype: options.linetype ?? 'dashed',
      color: options.color,
    },
  }
}

/**
 * Add a vertical reference line
 */
export function geom_vline(options: {
  xintercept: number
  linetype?: 'solid' | 'dashed' | 'dotted'
  color?: string
}): Geom {
  return {
    type: 'vline',
    stat: 'identity',
    position: 'identity',
    params: {
      xintercept: options.xintercept,
      linetype: options.linetype ?? 'dashed',
      color: options.color,
    },
  }
}
