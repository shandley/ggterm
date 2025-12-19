/**
 * Continuous scales
 */

import type { Scale, ScaleTransform } from '../types'

export interface ContinuousScaleOptions {
  limits?: [number, number]
  breaks?: number[]
  labels?: string[]
  trans?: 'identity' | 'log10' | 'sqrt' | 'reverse'
  expand?: [number, number]
}

/**
 * Create a continuous position scale
 */
function createContinuousScale(
  aesthetic: string,
  options: ContinuousScaleOptions = {}
): Scale {
  const trans = options.trans ?? 'identity'

  const transformFn = (value: number): number => {
    switch (trans) {
      case 'log10':
        return Math.log10(value)
      case 'sqrt':
        return Math.sqrt(value)
      case 'reverse':
        return -value
      default:
        return value
    }
  }

  return {
    type: 'continuous',
    aesthetic,
    domain: options.limits,
    breaks: options.breaks,
    labels: options.labels,
    trans: trans as ScaleTransform,
    map(value: unknown): number {
      const num = Number(value)
      if (isNaN(num)) return 0
      return transformFn(num)
    },
    invert(position: number): number {
      switch (trans) {
        case 'log10':
          return Math.pow(10, position)
        case 'sqrt':
          return position * position
        case 'reverse':
          return -position
        default:
          return position
      }
    },
  }
}

/**
 * Continuous x-axis scale
 */
export function scale_x_continuous(
  options: ContinuousScaleOptions = {}
): Scale {
  return createContinuousScale('x', options)
}

/**
 * Continuous y-axis scale
 */
export function scale_y_continuous(
  options: ContinuousScaleOptions = {}
): Scale {
  return createContinuousScale('y', options)
}

/**
 * Log10 x-axis scale
 */
export function scale_x_log10(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('x', { ...options, trans: 'log10' })
}

/**
 * Log10 y-axis scale
 */
export function scale_y_log10(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('y', { ...options, trans: 'log10' })
}

/**
 * Square root x-axis scale
 */
export function scale_x_sqrt(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('x', { ...options, trans: 'sqrt' })
}

/**
 * Square root y-axis scale
 */
export function scale_y_sqrt(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('y', { ...options, trans: 'sqrt' })
}

/**
 * Reversed x-axis scale
 */
export function scale_x_reverse(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('x', { ...options, trans: 'reverse' })
}

/**
 * Reversed y-axis scale
 */
export function scale_y_reverse(
  options: Omit<ContinuousScaleOptions, 'trans'> = {}
): Scale {
  return createContinuousScale('y', { ...options, trans: 'reverse' })
}
