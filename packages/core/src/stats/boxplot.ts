/**
 * stat_boxplot - Compute summary statistics for boxplots
 */

import type { AestheticMapping, DataSource, Stat } from '../types'

export interface StatBoxplotParams {
  /** Coefficient for whisker length (default: 1.5 * IQR) */
  coef?: number
}

export interface BoxplotResult {
  x: string | number    // Group identifier
  lower: number         // Lower whisker
  q1: number            // First quartile (25%)
  median: number        // Median (50%)
  q3: number            // Third quartile (75%)
  upper: number         // Upper whisker
  outliers: number[]    // Outlier values
  notchlower?: number   // Lower notch (for notched boxplots)
  notchupper?: number   // Upper notch (for notched boxplots)
}

/**
 * Calculate quantile using linear interpolation
 */
function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]

  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (upper >= sorted.length) return sorted[sorted.length - 1]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Compute boxplot statistics for a group of values
 */
export function computeBoxplotStats(
  values: number[],
  coef: number = 1.5
): Omit<BoxplotResult, 'x'> {
  if (values.length === 0) {
    return {
      lower: 0,
      q1: 0,
      median: 0,
      q3: 0,
      upper: 0,
      outliers: [],
    }
  }

  // Sort values
  const sorted = [...values].sort((a, b) => a - b)

  // Calculate quartiles
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1

  // Calculate whisker boundaries
  const lowerFence = q1 - coef * iqr
  const upperFence = q3 + coef * iqr

  // Find actual whisker values (furthest non-outlier points)
  const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence)
  const lower = nonOutliers.length > 0 ? Math.min(...nonOutliers) : q1
  const upper = nonOutliers.length > 0 ? Math.max(...nonOutliers) : q3

  // Find outliers
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence)

  return {
    lower,
    q1,
    median,
    q3,
    upper,
    outliers,
  }
}

/**
 * Create stat_boxplot transformation
 */
export function stat_boxplot(params: StatBoxplotParams = {}): Stat {
  const coef = params.coef ?? 1.5

  return {
    type: 'boxplot',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // Group data by x aesthetic (categorical grouping)
      const groups = new Map<string | number, number[]>()

      for (const row of data) {
        const xVal = row[aes.x]
        const yVal = row[aes.y]

        if (yVal === null || yVal === undefined) continue
        const numY = Number(yVal)
        if (isNaN(numY)) continue

        const key = String(xVal ?? 'default')
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(numY)
      }

      // Compute stats for each group
      const results: DataSource = []
      for (const [x, values] of groups) {
        const stats = computeBoxplotStats(values, coef)
        results.push({
          x,
          ...stats,
          // Also store as y values for scale inference
          ymin: stats.lower,
          y: stats.median,
          ymax: stats.upper,
        })
      }

      return results
    },
  }
}
