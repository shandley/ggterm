/**
 * Alpha (transparency) scales
 *
 * Maps data values to transparency levels (0-1).
 */

import type { Scale } from '@ggterm/spec/types'

export interface AlphaScaleOptions {
  /** Alpha range [min, max] from 0 to 1 */
  range?: [number, number]
  /** Domain [min, max] */
  domain?: [number, number]
  /** Guide title */
  name?: string
}

/**
 * Continuous alpha scale
 */
export function scale_alpha_continuous(options: AlphaScaleOptions = {}): Scale {
  const range = options.range ?? [0.1, 1]

  return {
    type: 'continuous',
    aesthetic: 'alpha',
    domain: options.domain,
    range: range,
    map(value: unknown): number {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return range[1]

      const domain = this.domain as [number, number] ?? [0, 1]
      let t = (numValue - domain[0]) / (domain[1] - domain[0] || 1)
      t = Math.max(0, Math.min(1, t))

      return range[0] + t * (range[1] - range[0])
    },
  }
}

/**
 * Alias for scale_alpha_continuous
 */
export function scale_alpha(options: AlphaScaleOptions = {}): Scale {
  return scale_alpha_continuous(options)
}

/**
 * Identity alpha scale (use data values directly)
 */
export function scale_alpha_identity(): Scale {
  return {
    type: 'identity',
    aesthetic: 'alpha',
    map(value: unknown): number {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return 1
      return Math.max(0, Math.min(1, numValue))
    },
  }
}

/**
 * Discrete alpha scale
 */
export interface DiscreteAlphaOptions {
  /** Alpha values for each level */
  values?: number[]
  /** Guide title */
  name?: string
}

export function scale_alpha_discrete(options: DiscreteAlphaOptions = {}): Scale {
  const values = options.values ?? [0.25, 0.5, 0.75, 1]

  return {
    type: 'discrete',
    aesthetic: 'alpha',
    domain: undefined,
    range: undefined, // Alpha values stored in internal values array
    map(value: unknown): number {
      const strValue = String(value)
      const domain = this.domain as string[] ?? []

      let index = domain.indexOf(strValue)
      if (index === -1) {
        // Add to domain dynamically
        (this.domain as string[]).push(strValue)
        index = domain.length
      }

      return values[index % values.length]
    },
  }
}

/**
 * Manual alpha scale (explicit mapping)
 */
export interface ManualAlphaOptions {
  /** Mapping from data values to alpha values */
  values: Record<string, number>
  /** Guide title */
  name?: string
}

export function scale_alpha_manual(options: ManualAlphaOptions): Scale {
  const values = options.values

  return {
    type: 'discrete',
    aesthetic: 'alpha',
    domain: Object.keys(values),
    range: undefined, // Alpha values stored in values map
    map(value: unknown): number {
      const strValue = String(value)
      return values[strValue] ?? 1
    },
  }
}

/**
 * Binned alpha scale
 */
export interface BinnedAlphaOptions extends AlphaScaleOptions {
  /** Number of bins */
  n_breaks?: number
  /** Explicit break points */
  breaks?: number[]
}

export function scale_alpha_binned(options: BinnedAlphaOptions = {}): Scale {
  const range = options.range ?? [0.1, 1]
  const nBreaks = options.n_breaks ?? 5
  const breaks = options.breaks

  return {
    type: 'continuous',
    aesthetic: 'alpha',
    domain: options.domain,
    range: range,
    map(value: unknown): number {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return range[1]

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

      // Map bin index to alpha
      const t = binIndex / (binBreaks.length - 2)
      return range[0] + t * (range[1] - range[0])
    },
  }
}
