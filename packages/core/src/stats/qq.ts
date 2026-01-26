/**
 * stat_qq - Compute quantiles for Q-Q plots
 *
 * Q-Q (quantile-quantile) plots compare sample quantiles against
 * theoretical quantiles from a reference distribution (usually normal).
 * Points falling on a diagonal line indicate the data follows the
 * reference distribution.
 */

import type { AestheticMapping, DataSource, Stat } from '../types'

export interface StatQQParams {
  /** Distribution to compare against (default: 'norm') */
  distribution?: 'norm' | 'uniform' | 'exp'
  /** Distribution parameters (mean, sd for normal) */
  dparams?: { mean?: number; sd?: number; rate?: number }
}

export interface QQResult {
  /** Sample quantile (actual data value) */
  sample: number
  /** Theoretical quantile from reference distribution */
  theoretical: number
}

/**
 * Inverse normal CDF (probit function) using Abramowitz and Stegun approximation
 * This converts a probability p (0,1) to a z-score
 */
function qnorm(p: number, mean = 0, sd = 1): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p === 0.5) return mean

  // Rational approximation for the lower half
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.383577518672690e2,
    -3.066479806614716e1,
    2.506628277459239e0,
  ]
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838e0,
    -2.549732539343734e0,
    4.374664141464968e0,
    2.938163982698783e0,
  ]
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996e0,
    3.754408661907416e0,
  ]

  const pLow = 0.02425
  const pHigh = 1 - pLow

  let q: number
  let r: number

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    r =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  } else if (p <= pHigh) {
    q = p - 0.5
    r = q * q
    r =
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p))
    r =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }

  return mean + sd * r
}

/**
 * Inverse uniform CDF
 */
function qunif(p: number, min = 0, max = 1): number {
  return min + p * (max - min)
}

/**
 * Inverse exponential CDF
 */
function qexp(p: number, rate = 1): number {
  if (p <= 0) return 0
  if (p >= 1) return Infinity
  return -Math.log(1 - p) / rate
}

/**
 * Compute Q-Q plot data
 */
export function computeQQ(
  data: DataSource,
  field: string,
  params: StatQQParams = {}
): QQResult[] {
  const distribution = params.distribution ?? 'norm'
  const dparams = params.dparams ?? {}

  // Extract numeric values
  const values: number[] = []
  for (const row of data) {
    const val = row[field]
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      values.push(val)
    }
  }

  if (values.length === 0) {
    return []
  }

  // Sort sample values
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  // Compute theoretical quantiles using plotting positions
  // Using (i - 0.5) / n (Hazen plotting position)
  const results: QQResult[] = []

  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n

    let theoretical: number
    switch (distribution) {
      case 'uniform':
        theoretical = qunif(p)
        break
      case 'exp':
        theoretical = qexp(p, dparams.rate ?? 1)
        break
      case 'norm':
      default:
        theoretical = qnorm(p, dparams.mean ?? 0, dparams.sd ?? 1)
    }

    results.push({
      sample: sorted[i],
      theoretical,
    })
  }

  return results
}

/**
 * Compute Q-Q line parameters (slope and intercept)
 * The line passes through the first and third quartiles
 */
export function computeQQLine(
  data: DataSource,
  field: string,
  params: StatQQParams = {}
): { slope: number; intercept: number } | null {
  const distribution = params.distribution ?? 'norm'
  const dparams = params.dparams ?? {}

  // Extract and sort values
  const values: number[] = []
  for (const row of data) {
    const val = row[field]
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      values.push(val)
    }
  }

  if (values.length < 2) {
    return null
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  // Calculate sample quartiles
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const sampleQ1 = sorted[q1Index]
  const sampleQ3 = sorted[q3Index]

  // Calculate theoretical quartiles
  let theorQ1: number
  let theorQ3: number

  switch (distribution) {
    case 'uniform':
      theorQ1 = qunif(0.25)
      theorQ3 = qunif(0.75)
      break
    case 'exp':
      theorQ1 = qexp(0.25, dparams.rate ?? 1)
      theorQ3 = qexp(0.75, dparams.rate ?? 1)
      break
    case 'norm':
    default:
      theorQ1 = qnorm(0.25, dparams.mean ?? 0, dparams.sd ?? 1)
      theorQ3 = qnorm(0.75, dparams.mean ?? 0, dparams.sd ?? 1)
  }

  // Calculate slope and intercept
  const slope = (sampleQ3 - sampleQ1) / (theorQ3 - theorQ1)
  const intercept = sampleQ1 - slope * theorQ1

  return { slope, intercept }
}

/**
 * Create stat_qq transformation
 */
export function stat_qq(params: StatQQParams = {}): Stat {
  return {
    type: 'qq',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      const results = computeQQ(data, aes.x, params)

      // Return data with x = theoretical, y = sample (ggplot2 convention)
      return results.map(r => ({
        x: r.theoretical,
        y: r.sample,
        theoretical: r.theoretical,
        sample: r.sample,
      }))
    },
  }
}

/**
 * Create stat_qq_line transformation
 * Returns two points defining the Q-Q reference line
 */
export function stat_qq_line(params: StatQQParams = {}): Stat {
  return {
    type: 'qq_line',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      const lineParams = computeQQLine(data, aes.x, params)
      if (!lineParams) {
        return []
      }

      const { slope, intercept } = lineParams

      // Get the range of theoretical values to draw the line
      const qqData = computeQQ(data, aes.x, params)
      if (qqData.length === 0) {
        return []
      }

      const theorMin = Math.min(...qqData.map(d => d.theoretical))
      const theorMax = Math.max(...qqData.map(d => d.theoretical))

      // Return two endpoints of the line
      return [
        {
          x: theorMin,
          y: slope * theorMin + intercept,
          xend: theorMax,
          yend: slope * theorMax + intercept,
        },
      ]
    },
  }
}
