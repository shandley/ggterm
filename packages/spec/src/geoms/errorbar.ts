/**
 * geom_errorbar - Error bar geometry
 *
 * Renders vertical or horizontal error bars.
 */

import type { Geom } from '../types'

export interface ErrorbarOptions {
  /** Width of the error bar caps (default: 0.5) */
  width?: number
  /** Alpha transparency */
  alpha?: number
  /** Line color */
  color?: string
  /** Linetype */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Render vertical error bars (ymin to ymax)
 */
export function geom_errorbar(options: ErrorbarOptions = {}): Geom {
  return {
    type: 'errorbar',
    stat: 'identity',
    position: 'identity',
    params: {
      width: options.width ?? 0.5,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Render horizontal error bars (xmin to xmax)
 */
export function geom_errorbarh(options: ErrorbarOptions = {}): Geom {
  return {
    type: 'errorbarh',
    stat: 'identity',
    position: 'identity',
    params: {
      width: options.width ?? 0.5,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Render crossbar (horizontal bar with vertical line)
 */
export function geom_crossbar(options: ErrorbarOptions & { fatten?: number } = {}): Geom {
  return {
    type: 'crossbar',
    stat: 'identity',
    position: 'identity',
    params: {
      width: options.width ?? 0.5,
      fatten: options.fatten ?? 2.5,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Render linerange (vertical line from ymin to ymax)
 */
export function geom_linerange(options: Omit<ErrorbarOptions, 'width'> = {}): Geom {
  return {
    type: 'linerange',
    stat: 'identity',
    position: 'identity',
    params: {
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}

/**
 * Render pointrange (point with vertical line from ymin to ymax)
 */
export function geom_pointrange(options: ErrorbarOptions & { fatten?: number } = {}): Geom {
  return {
    type: 'pointrange',
    stat: 'identity',
    position: 'identity',
    params: {
      fatten: options.fatten ?? 4,
      alpha: options.alpha ?? 1,
      color: options.color,
      linetype: options.linetype ?? 'solid',
    },
  }
}
