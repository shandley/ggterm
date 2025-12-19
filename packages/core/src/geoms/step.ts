/**
 * geom_step - Step/staircase line geometry
 *
 * Creates a stairstep plot where lines only move horizontally
 * or vertically, not diagonally. Useful for time series with
 * discrete changes (e.g., stock prices, state machines).
 */

import type { Geom } from '../types'

export interface StepOptions {
  /** Step direction: 'hv' (right then up/down), 'vh' (up/down then right), 'mid' (midpoint) */
  direction?: 'hv' | 'vh' | 'mid'
  /** Line width (1-3) */
  linewidth?: number
  /** Line type */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Opacity (0-1) */
  alpha?: number
  /** Fixed color (hex string) */
  color?: string
}

/**
 * Connect data points with stairstep lines
 *
 * @example
 * // Stock price changes (horizontal first, then vertical)
 * gg(stockData)
 *   .aes({ x: 'date', y: 'price' })
 *   .geom(geom_step())
 *
 * @example
 * // State changes (vertical first, then horizontal)
 * gg(stateData)
 *   .aes({ x: 'time', y: 'state' })
 *   .geom(geom_step({ direction: 'vh' }))
 *
 * @example
 * // Centered steps
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_step({ direction: 'mid' }))
 */
export function geom_step(options: StepOptions = {}): Geom {
  return {
    type: 'step',
    stat: 'identity',
    position: 'identity',
    params: {
      direction: options.direction ?? 'hv',
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
      alpha: options.alpha ?? 1,
      color: options.color,
    },
  }
}
