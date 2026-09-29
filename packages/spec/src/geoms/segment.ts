/**
 * geom_segment - Line segments from (x, y) to (xend, yend)
 */

import type { Geom } from '../types'

export interface SegmentOptions {
  /** Line width (default: 1) */
  linewidth?: number
  /** Line type (default: 'solid') */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Opacity (default: 1) */
  alpha?: number
  /** Fixed color for all segments */
  color?: string
  /** Add arrow to end (default: false) */
  arrow?: boolean
  /** Arrow type (default: 'closed') */
  arrowType?: 'open' | 'closed'
}

/**
 * Draw line segments between pairs of points
 *
 * Required aesthetics: x, y, xend, yend
 * Optional aesthetics: color, alpha
 */
export function geom_segment(options: SegmentOptions = {}): Geom {
  return {
    type: 'segment',
    stat: 'identity',
    position: 'identity',
    params: {
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
      alpha: options.alpha ?? 1,
      color: options.color,
      arrow: options.arrow ?? false,
      arrowType: options.arrowType ?? 'closed',
    },
  }
}

/**
 * Draw curves between points (alias for segment with potential future curve support)
 */
export function geom_curve(options: SegmentOptions & {
  /** Curvature amount (-1 to 1, default: 0.5) */
  curvature?: number
} = {}): Geom {
  return {
    type: 'segment',  // For now, same as segment - curve rendering TBD
    stat: 'identity',
    position: 'identity',
    params: {
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
      alpha: options.alpha ?? 1,
      color: options.color,
      arrow: options.arrow ?? false,
      arrowType: options.arrowType ?? 'closed',
      curvature: options.curvature ?? 0.5,
    },
  }
}
