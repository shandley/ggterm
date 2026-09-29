/**
 * Annotation Layer
 *
 * Provides arbitrary annotations for plots including text, shapes, and references.
 */

import type { Geom, RGBA } from './types'

/**
 * Base annotation options
 */
export interface AnnotationOptions {
  /** X position (data coordinates or 'Inf' for edge) */
  x?: number | 'Inf' | '-Inf'
  /** Y position (data coordinates or 'Inf' for edge) */
  y?: number | 'Inf' | '-Inf'
  /** X end position (for segments/rects) */
  xend?: number | 'Inf' | '-Inf'
  /** Y end position (for segments/rects) */
  yend?: number | 'Inf' | '-Inf'
  /** X minimum (for rects) */
  xmin?: number | 'Inf' | '-Inf'
  /** X maximum (for rects) */
  xmax?: number | 'Inf' | '-Inf'
  /** Y minimum (for rects) */
  ymin?: number | 'Inf' | '-Inf'
  /** Y maximum (for rects) */
  ymax?: number | 'Inf' | '-Inf'
  /** Label text */
  label?: string
  /** Color */
  color?: string | RGBA
  /** Fill color */
  fill?: string | RGBA
  /** Alpha transparency */
  alpha?: number
  /** Size */
  size?: number
  /** Linetype */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Font style */
  fontface?: 'plain' | 'bold' | 'italic'
  /** Horizontal justification */
  hjust?: 'left' | 'center' | 'right' | number
  /** Vertical justification */
  vjust?: 'top' | 'center' | 'bottom' | number
  /** Angle (degrees) */
  angle?: number
}

/**
 * Create an annotation layer
 *
 * @param geomType - Type of geometry: 'text', 'label', 'segment', 'rect', 'point', 'line', 'hline', 'vline', 'curve', 'abline'
 * @param options - Annotation options
 */
export function annotate(
  geomType: string,
  options: AnnotationOptions = {}
): Geom {
  // Convert string colors to RGBA if needed
  const parseColor = (c?: string | RGBA): RGBA | undefined => {
    if (!c) return undefined
    if (typeof c === 'object') return c
    // Simple color name mapping
    const colors: Record<string, RGBA> = {
      red: { r: 255, g: 0, b: 0, a: 1 },
      blue: { r: 0, g: 0, b: 255, a: 1 },
      green: { r: 0, g: 128, b: 0, a: 1 },
      black: { r: 0, g: 0, b: 0, a: 1 },
      white: { r: 255, g: 255, b: 255, a: 1 },
      gray: { r: 128, g: 128, b: 128, a: 1 },
      grey: { r: 128, g: 128, b: 128, a: 1 },
      yellow: { r: 255, g: 255, b: 0, a: 1 },
      orange: { r: 255, g: 165, b: 0, a: 1 },
      purple: { r: 128, g: 0, b: 128, a: 1 },
      cyan: { r: 0, g: 255, b: 255, a: 1 },
      magenta: { r: 255, g: 0, b: 255, a: 1 },
    }
    return colors[c.toLowerCase()] ?? { r: 128, g: 128, b: 128, a: 1 }
  }

  const color = parseColor(options.color)
  const fill = parseColor(options.fill)

  // Build params based on geom type
  const params: Record<string, unknown> = {
    alpha: options.alpha ?? 1,
    color,
    fill,
    annotation: true, // Mark as annotation layer
  }

  switch (geomType) {
    case 'text':
    case 'label':
      return {
        type: geomType,
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          x: options.x,
          y: options.y,
          label: options.label,
          size: options.size ?? 3,
          hjust: options.hjust ?? 'center',
          vjust: options.vjust ?? 'center',
          fontface: options.fontface ?? 'plain',
          angle: options.angle ?? 0,
        },
      }

    case 'segment':
    case 'curve':
      return {
        type: geomType,
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          x: options.x,
          y: options.y,
          xend: options.xend,
          yend: options.yend,
          linetype: options.linetype ?? 'solid',
          arrow: false,
        },
      }

    case 'rect':
      return {
        type: 'rect',
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          xmin: options.xmin ?? options.x,
          xmax: options.xmax ?? options.xend,
          ymin: options.ymin ?? options.y,
          ymax: options.ymax ?? options.yend,
          linetype: options.linetype ?? 'solid',
        },
      }

    case 'point':
      return {
        type: 'point',
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          x: options.x,
          y: options.y,
          size: options.size ?? 3,
        },
      }

    case 'hline':
      return {
        type: 'hline',
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          yintercept: options.y,
          linetype: options.linetype ?? 'solid',
        },
      }

    case 'vline':
      return {
        type: 'vline',
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          xintercept: options.x,
          linetype: options.linetype ?? 'solid',
        },
      }

    case 'abline':
      return {
        type: 'abline',
        stat: 'identity',
        position: 'identity',
        params: {
          ...params,
          slope: options.y, // Use y as slope when geom is abline
          intercept: options.x, // Use x as intercept when geom is abline
          linetype: options.linetype ?? 'solid',
        },
      }

    default:
      // Default to point
      return {
        type: geomType,
        stat: 'identity',
        position: 'identity',
        params,
      }
  }
}

/**
 * Create a text annotation
 */
export function annotate_text(
  x: number,
  y: number,
  label: string,
  options: Omit<AnnotationOptions, 'x' | 'y' | 'label'> = {}
): Geom {
  return annotate('text', { ...options, x, y, label })
}

/**
 * Create a label annotation (text with background)
 */
export function annotate_label(
  x: number,
  y: number,
  label: string,
  options: Omit<AnnotationOptions, 'x' | 'y' | 'label'> = {}
): Geom {
  return annotate('label', { ...options, x, y, label })
}

/**
 * Create a rectangle annotation
 */
export function annotate_rect(
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
  options: Omit<AnnotationOptions, 'xmin' | 'xmax' | 'ymin' | 'ymax'> = {}
): Geom {
  return annotate('rect', { ...options, xmin, xmax, ymin, ymax })
}

/**
 * Create a segment annotation
 */
export function annotate_segment(
  x: number,
  y: number,
  xend: number,
  yend: number,
  options: Omit<AnnotationOptions, 'x' | 'y' | 'xend' | 'yend'> = {}
): Geom {
  return annotate('segment', { ...options, x, y, xend, yend })
}

/**
 * Create a horizontal line annotation
 */
export function annotate_hline(
  yintercept: number,
  options: Omit<AnnotationOptions, 'y'> = {}
): Geom {
  return annotate('hline', { ...options, y: yintercept })
}

/**
 * Create a vertical line annotation
 */
export function annotate_vline(
  xintercept: number,
  options: Omit<AnnotationOptions, 'x'> = {}
): Geom {
  return annotate('vline', { ...options, x: xintercept })
}
