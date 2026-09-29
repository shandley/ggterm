/**
 * stat_summary - Summarize y values at each unique x
 */

import type { AestheticMapping, DataSource, Stat } from '@ggterm/spec/types'

export type SummaryFun = (values: number[]) => number

export interface StatSummaryParams {
  /** Function to compute y value (default: mean) */
  fun?: 'mean' | 'median' | 'min' | 'max' | 'sum' | SummaryFun
  /** Function to compute ymin (default: min) */
  funMin?: 'mean' | 'median' | 'min' | 'max' | 'sum' | 'se_lower' | 'sd_lower' | SummaryFun
  /** Function to compute ymax (default: max) */
  funMax?: 'mean' | 'median' | 'min' | 'max' | 'sum' | 'se_upper' | 'sd_upper' | SummaryFun
  /** Preset: 'mean_se', 'mean_sd', 'mean_cl_normal', 'median_range' */
  funData?: 'mean_se' | 'mean_sd' | 'mean_cl_normal' | 'median_range'
}

/**
 * Built-in summary functions
 */
const summaryFunctions: Record<string, SummaryFun> = {
  mean: (values) => values.reduce((a, b) => a + b, 0) / values.length,

  median: (values) => {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  },

  min: (values) => Math.min(...values),

  max: (values) => Math.max(...values),

  sum: (values) => values.reduce((a, b) => a + b, 0),
}

/**
 * Standard deviation
 */
function sd(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
  return Math.sqrt(variance)
}

/**
 * Standard error of the mean
 */
function se(values: number[]): number {
  return sd(values) / Math.sqrt(values.length)
}

/**
 * Get summary function by name or use custom function
 */
function getSummaryFun(
  fun: 'mean' | 'median' | 'min' | 'max' | 'sum' | 'se_lower' | 'se_upper' | 'sd_lower' | 'sd_upper' | SummaryFun | undefined,
  defaultFun: string = 'mean'
): SummaryFun {
  if (typeof fun === 'function') return fun

  const funName = fun ?? defaultFun

  // Special functions for error bars
  if (funName === 'se_lower') {
    return (values) => summaryFunctions.mean(values) - se(values)
  }
  if (funName === 'se_upper') {
    return (values) => summaryFunctions.mean(values) + se(values)
  }
  if (funName === 'sd_lower') {
    return (values) => summaryFunctions.mean(values) - sd(values)
  }
  if (funName === 'sd_upper') {
    return (values) => summaryFunctions.mean(values) + sd(values)
  }

  return summaryFunctions[funName] ?? summaryFunctions.mean
}

export interface SummaryResult {
  x: string | number
  y: number
  ymin?: number
  ymax?: number
  n: number  // Count of observations
  [key: string]: unknown  // Index signature for DataRecord compatibility
}

/**
 * Compute summary statistics for each group
 */
export function computeSummary(
  data: DataSource,
  xField: string,
  yField: string,
  params: StatSummaryParams = {}
): DataSource {
  // Group data by x value
  const groups = new Map<string | number, number[]>()

  for (const row of data) {
    const x = row[xField]
    const y = row[yField]

    if (x !== null && x !== undefined && typeof y === 'number' && !isNaN(y)) {
      const key = typeof x === 'number' ? x : String(x)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(y)
    }
  }

  // Determine summary functions based on preset or individual params
  let funY: SummaryFun
  let funMin: SummaryFun | undefined
  let funMax: SummaryFun | undefined

  if (params.funData) {
    switch (params.funData) {
      case 'mean_se':
        funY = summaryFunctions.mean
        funMin = (values) => summaryFunctions.mean(values) - se(values)
        funMax = (values) => summaryFunctions.mean(values) + se(values)
        break
      case 'mean_sd':
        funY = summaryFunctions.mean
        funMin = (values) => summaryFunctions.mean(values) - sd(values)
        funMax = (values) => summaryFunctions.mean(values) + sd(values)
        break
      case 'mean_cl_normal':
        // 95% confidence interval assuming normal distribution
        funY = summaryFunctions.mean
        funMin = (values) => summaryFunctions.mean(values) - 1.96 * se(values)
        funMax = (values) => summaryFunctions.mean(values) + 1.96 * se(values)
        break
      case 'median_range':
        funY = summaryFunctions.median
        funMin = summaryFunctions.min
        funMax = summaryFunctions.max
        break
    }
  } else {
    funY = getSummaryFun(params.fun, 'mean')
    if (params.funMin) funMin = getSummaryFun(params.funMin, 'min')
    if (params.funMax) funMax = getSummaryFun(params.funMax, 'max')
  }

  // Compute summaries
  const results: SummaryResult[] = []

  for (const [x, values] of groups) {
    if (values.length === 0) continue

    const result: SummaryResult = {
      x,
      y: funY(values),
      n: values.length,
    }

    if (funMin) result.ymin = funMin(values)
    if (funMax) result.ymax = funMax(values)

    results.push(result)
  }

  // Sort by x value
  results.sort((a, b) => {
    if (typeof a.x === 'number' && typeof b.x === 'number') {
      return a.x - b.x
    }
    return String(a.x).localeCompare(String(b.x))
  })

  return results as DataSource
}

/**
 * Create stat_summary transformation
 */
export function stat_summary(params: StatSummaryParams = {}): Stat {
  return {
    type: 'summary',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // If there's a color/group aesthetic, compute summary per color group
      if (aes.color) {
        const colorGroups = new Map<string, DataSource>()

        for (const row of data) {
          const colorGroup = String(row[aes.color] ?? 'default')
          if (!colorGroups.has(colorGroup)) {
            colorGroups.set(colorGroup, [])
          }
          colorGroups.get(colorGroup)!.push(row)
        }

        const result: DataSource = []
        for (const [colorGroup, groupData] of colorGroups) {
          const summary = computeSummary(groupData, aes.x, aes.y, params)
          for (const s of summary) {
            result.push({
              x: s.x,
              y: s.y,
              ymin: s.ymin,
              ymax: s.ymax,
              n: s.n,
              [aes.color]: colorGroup,
            })
          }
        }
        return result
      }

      return computeSummary(data, aes.x, aes.y, params)
    },
  }
}
