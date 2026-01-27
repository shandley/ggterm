/**
 * stat_count - Count occurrences of each x value
 */

import type { DataSource, AestheticMapping } from '../types'

export interface StatCountParams {
  // No parameters needed for basic count
}

export interface CountResult {
  x: string | number
  count: number
}

/**
 * Count occurrences of each unique x value
 */
export function stat_count(_params: StatCountParams = {}) {
  return {
    compute(data: DataSource, aes: AestheticMapping): CountResult[] {
      const xField = aes.x
      if (!xField) {
        return []
      }

      // Count occurrences of each unique x value
      const counts = new Map<string | number, number>()

      for (const row of data) {
        const xValue = row[xField] as string | number
        if (xValue !== undefined && xValue !== null) {
          counts.set(xValue, (counts.get(xValue) ?? 0) + 1)
        }
      }

      // Convert to array of {x, count}
      const results: CountResult[] = []
      for (const [x, count] of counts) {
        results.push({ x, count })
      }

      // Sort by x value for consistent ordering
      results.sort((a, b) => {
        if (typeof a.x === 'string' && typeof b.x === 'string') {
          return a.x.localeCompare(b.x)
        }
        return Number(a.x) - Number(b.x)
      })

      return results
    }
  }
}

/**
 * Compute counts directly (utility function)
 */
export function computeCount(data: DataSource, xField: string): CountResult[] {
  return stat_count().compute(data, { x: xField, y: 'count' })
}
