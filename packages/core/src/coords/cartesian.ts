/**
 * Coordinate system functions
 *
 * Coordinates control how data is mapped to the plotting area:
 * - coordCartesian: Standard x-y coordinates with optional zoom
 * - coordFlip: Swaps x and y axes
 * - coordFixed: Fixed aspect ratio between x and y
 * - coordTrans: Apply transformations to both axes
 * - coordPolar: Polar coordinates (angle + radius)
 */

import type { Coord } from '../types'

export interface CartesianOptions {
  xlim?: [number, number]
  ylim?: [number, number]
  clip?: boolean
}

export interface FixedOptions extends CartesianOptions {
  /** Aspect ratio (y/x). Default is 1 for equal scaling */
  ratio?: number
}

export interface TransOptions extends CartesianOptions {
  /** Transformation for x-axis: 'identity' | 'log10' | 'sqrt' | 'reverse' */
  x?: 'identity' | 'log10' | 'sqrt' | 'reverse'
  /** Transformation for y-axis: 'identity' | 'log10' | 'sqrt' | 'reverse' */
  y?: 'identity' | 'log10' | 'sqrt' | 'reverse'
}

/**
 * Standard Cartesian coordinates (x horizontal, y vertical)
 *
 * Unlike scale limits which filter data, coord limits zoom the view
 * while keeping all data - points outside the limits are clipped visually.
 */
export function coordCartesian(options: CartesianOptions = {}): Coord {
  return {
    type: 'cartesian',
    xlim: options.xlim,
    ylim: options.ylim,
    clip: options.clip ?? true,
    transform(x: number, y: number) {
      // Cartesian is identity transform
      return { x, y }
    },
  }
}

/**
 * Flipped coordinates (x vertical, y horizontal)
 */
export function coordFlip(): Coord {
  return {
    type: 'flip',
    transform(x: number, y: number) {
      return { x: y, y: x }
    },
  }
}

/**
 * Polar coordinates
 */
export function coordPolar(options: { theta?: 'x' | 'y' } = {}): Coord {
  const theta = options.theta ?? 'x'

  return {
    type: 'polar',
    transform(x: number, y: number) {
      // Convert to polar coordinates
      const angle = theta === 'x' ? x : y
      const radius = theta === 'x' ? y : x

      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      }
    },
  }
}

/**
 * Fixed aspect ratio coordinates
 *
 * Ensures that the visual representation of one unit on the x-axis
 * has the same length as one unit on the y-axis (or a fixed ratio).
 *
 * @example
 * ```ts
 * // Equal scaling (circles appear circular)
 * gg(data).coord(coordFixed())
 *
 * // 2:1 aspect ratio
 * gg(data).coord(coordFixed({ ratio: 2 }))
 * ```
 */
export function coordFixed(options: FixedOptions = {}): Coord {
  const ratio = options.ratio ?? 1

  return {
    type: 'fixed',
    xlim: options.xlim,
    ylim: options.ylim,
    clip: options.clip ?? true,
    // Store ratio for use in rendering pipeline
    ratio,
    transform(x: number, y: number) {
      // Fixed coord uses identity transform; aspect ratio is applied during rendering
      return { x, y }
    },
  } as Coord & { ratio: number }
}

/**
 * Equal scaling coordinates (alias for coordFixed with ratio=1)
 *
 * Ensures that one unit on x-axis has same visual length as one unit on y-axis.
 * Useful for maps, geometric shapes, or any plot where proportions matter.
 *
 * @example
 * ```ts
 * gg(data).coord(coordEqual())
 * ```
 */
export function coordEqual(options: CartesianOptions = {}): Coord {
  return coordFixed({ ...options, ratio: 1 })
}

/**
 * Get transform function for a given transformation type
 */
function getTransform(type: string): (v: number) => number {
  switch (type) {
    case 'log10':
      return (v: number) => v > 0 ? Math.log10(v) : -Infinity
    case 'sqrt':
      return (v: number) => v >= 0 ? Math.sqrt(v) : 0
    case 'reverse':
      return (v: number) => -v
    default:
      return (v: number) => v
  }
}

/**
 * Transformed coordinates
 *
 * Apply transformations to x and/or y axes. Unlike scale transforms,
 * coord transforms happen after statistical transformations and affect
 * how the data is visually represented.
 *
 * @example
 * ```ts
 * // Log-log plot
 * gg(data).coord(coordTrans({ x: 'log10', y: 'log10' }))
 *
 * // Square root y-axis
 * gg(data).coord(coordTrans({ y: 'sqrt' }))
 * ```
 */
export function coordTrans(options: TransOptions = {}): Coord {
  const xTrans = getTransform(options.x ?? 'identity')
  const yTrans = getTransform(options.y ?? 'identity')

  return {
    type: 'trans',
    xlim: options.xlim,
    ylim: options.ylim,
    clip: options.clip ?? true,
    // Store transformation types for axis rendering
    xTransType: options.x ?? 'identity',
    yTransType: options.y ?? 'identity',
    transform(x: number, y: number) {
      return {
        x: xTrans(x),
        y: yTrans(y),
      }
    },
  } as Coord & { xTransType: string; yTransType: string }
}

/**
 * Flipped coordinates with options
 *
 * Like coordFlip but with xlim/ylim support.
 * Note: limits refer to the original (pre-flip) data range.
 */
export function coordFlipWithLimits(options: CartesianOptions = {}): Coord {
  return {
    type: 'flip',
    xlim: options.xlim,
    ylim: options.ylim,
    clip: options.clip ?? true,
    transform(x: number, y: number) {
      return { x: y, y: x }
    },
  }
}
