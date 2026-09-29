/**
 * Size scales
 *
 * Maps data values to point sizes.
 */

import type { Scale } from '@ggterm/spec/types'

export interface SizeScaleOptions {
  /** Size range [min, max] in character widths */
  range?: [number, number]
  /** Domain [min, max] */
  domain?: [number, number]
  /** Transformation: 'identity', 'sqrt' (area proportional), 'radius' */
  trans?: 'identity' | 'sqrt' | 'radius'
  /** Guide title */
  name?: string
}

/**
 * Continuous size scale
 */
export function scale_size_continuous(options: SizeScaleOptions = {}): Scale {
  const range = options.range ?? [1, 6]
  const trans = options.trans ?? 'sqrt' // Area proportional by default

  return {
    type: 'continuous',
    aesthetic: 'size',
    domain: options.domain,
    range: range,
    map(value: unknown): number {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return range[0]

      const domain = this.domain as [number, number] ?? [0, 1]
      let t = (numValue - domain[0]) / (domain[1] - domain[0] || 1)
      t = Math.max(0, Math.min(1, t))

      // Apply transformation
      if (trans === 'sqrt') {
        t = Math.sqrt(t)
      }

      return range[0] + t * (range[1] - range[0])
    },
  }
}

/**
 * Area-proportional size scale (default for bubble plots)
 */
export function scale_size_area(options: SizeScaleOptions = {}): Scale {
  return scale_size_continuous({ ...options, trans: 'sqrt' })
}

/**
 * Radius-proportional size scale
 */
export function scale_size_radius(options: SizeScaleOptions = {}): Scale {
  return scale_size_continuous({ ...options, trans: 'radius' })
}

/**
 * Identity size scale (use data values directly)
 */
export function scale_size_identity(): Scale {
  return {
    type: 'identity',
    aesthetic: 'size',
    map(value: unknown): number {
      return typeof value === 'number' ? value : parseFloat(String(value)) || 1
    },
  }
}

/**
 * Binned size scale
 */
export interface BinnedSizeOptions extends SizeScaleOptions {
  /** Number of bins */
  n_breaks?: number
  /** Explicit break points */
  breaks?: number[]
}

export function scale_size_binned(options: BinnedSizeOptions = {}): Scale {
  const range = options.range ?? [1, 6]
  const nBreaks = options.n_breaks ?? 5
  const breaks = options.breaks

  return {
    type: 'continuous',
    aesthetic: 'size',
    domain: options.domain,
    range: range,
    map(value: unknown): number {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return range[0]

      const domain = this.domain as [number, number] ?? [0, 1]
      const binBreaks = breaks ?? Array.from(
        { length: nBreaks + 1 },
        (_, i) => domain[0] + (domain[1] - domain[0]) * i / nBreaks
      )

      // Find which bin the value falls into
      let binIndex = 0
      for (let i = 0; i < binBreaks.length - 1; i++) {
        if (numValue >= binBreaks[i] && numValue < binBreaks[i + 1]) {
          binIndex = i
          break
        }
        if (numValue >= binBreaks[i]) {
          binIndex = i
        }
      }

      // Map bin index to size
      const t = binIndex / (binBreaks.length - 2)
      return range[0] + t * (range[1] - range[0])
    },
  }
}
