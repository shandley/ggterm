/**
 * geom_text - Text label geometry
 */

import type { Geom } from '../types'

export interface TextOptions {
  nudge_x?: number
  nudge_y?: number
  hjust?: 'left' | 'center' | 'right'
  vjust?: 'top' | 'middle' | 'bottom'
  color?: string
  size?: number
}

/**
 * Add text labels to the plot
 */
export function geom_text(options: TextOptions = {}): Geom {
  return {
    type: 'text',
    stat: 'identity',
    position: 'identity',
    params: {
      nudge_x: options.nudge_x ?? 0,
      nudge_y: options.nudge_y ?? 0,
      hjust: options.hjust ?? 'center',
      vjust: options.vjust ?? 'middle',
      color: options.color,
      size: options.size ?? 1,
    },
  }
}

/**
 * Add text labels with background (for better readability)
 */
export function geom_label(options: TextOptions & { fill?: string } = {}): Geom {
  return {
    type: 'label',
    stat: 'identity',
    position: 'identity',
    params: {
      nudge_x: options.nudge_x ?? 0,
      nudge_y: options.nudge_y ?? 0,
      hjust: options.hjust ?? 'center',
      vjust: options.vjust ?? 'middle',
      color: options.color,
      fill: options.fill,
      size: options.size ?? 1,
    },
  }
}
