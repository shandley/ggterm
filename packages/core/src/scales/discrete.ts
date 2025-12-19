/**
 * Discrete (categorical) scales
 *
 * Supports ordering categories through:
 * - limits: Explicit order of categories
 * - order: Automatic ordering strategy
 * - reverse: Reverse the order
 */

import type { Scale } from '../types'

/**
 * Ordering strategy for discrete scales
 */
export type DiscreteOrder =
  | 'alphabetical'  // Sort alphabetically (default)
  | 'data'          // Order by first appearance in data
  | 'frequency'     // Order by frequency (most common first)
  | 'reverse'       // Reverse alphabetical

export interface DiscreteScaleOptions {
  /** Explicit order of categories (overrides order option) */
  limits?: string[]
  /** Custom labels for each category (must match limits length) */
  labels?: string[]
  /** Whether to drop unused levels (default: true) */
  drop?: boolean
  /** Ordering strategy when limits not provided */
  order?: DiscreteOrder
  /** Reverse the order (applied after order/limits) */
  reverse?: boolean
  /** Exclude specific categories */
  exclude?: string[]
}

/**
 * Create a discrete position scale
 */
function createDiscreteScale(
  aesthetic: string,
  options: DiscreteScaleOptions = {}
): Scale & {
  orderOptions?: DiscreteScaleOptions
  labels?: string[]
} {
  const valueToPosition = new Map<string, number>()

  // Store limits after applying reverse if needed
  let effectiveLimits = options.limits
  if (effectiveLimits && options.reverse) {
    effectiveLimits = [...effectiveLimits].reverse()
  }

  // Apply exclusions if provided
  if (effectiveLimits && options.exclude) {
    const excludeSet = new Set(options.exclude)
    effectiveLimits = effectiveLimits.filter(v => !excludeSet.has(v))
  }

  return {
    type: 'discrete',
    aesthetic,
    domain: effectiveLimits,
    labels: options.labels,
    // Store order options for use in pipeline
    orderOptions: options,
    map(value: unknown): number {
      const key = String(value)

      // Check exclusions
      if (options.exclude?.includes(key)) {
        return -1
      }

      if (effectiveLimits) {
        const idx = effectiveLimits.indexOf(key)
        return idx >= 0 ? idx : -1
      }

      if (!valueToPosition.has(key)) {
        valueToPosition.set(key, valueToPosition.size)
      }

      return valueToPosition.get(key)!
    },
    invert(position: number): string {
      if (effectiveLimits) {
        return effectiveLimits[Math.round(position)] ?? ''
      }

      for (const [key, pos] of valueToPosition) {
        if (pos === Math.round(position)) return key
      }
      return ''
    },
  }
}

/**
 * Discrete x-axis scale
 */
export function scale_x_discrete(options: DiscreteScaleOptions = {}): Scale {
  return createDiscreteScale('x', options)
}

/**
 * Discrete y-axis scale
 */
export function scale_y_discrete(options: DiscreteScaleOptions = {}): Scale {
  return createDiscreteScale('y', options)
}
