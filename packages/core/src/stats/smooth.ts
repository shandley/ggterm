/**
 * stat_smooth - Smoothing and regression lines
 */

import type { AestheticMapping, DataSource, Stat } from '@ggterm/spec/types'

export interface StatSmoothParams {
  /** Method: 'lm' (linear), 'loess', 'lowess' (default: 'lm') */
  method?: 'lm' | 'loess' | 'lowess'
  /** Span for loess smoothing (default: 0.75) */
  span?: number
  /** Number of points to evaluate (default: 80) */
  n?: number
  /** Include standard error bands (default: true) */
  se?: boolean
  /** Confidence level for SE bands (default: 0.95) */
  level?: number
}

export interface SmoothResult {
  x: number
  y: number        // Predicted value
  ymin?: number    // Lower confidence bound
  ymax?: number    // Upper confidence bound
  se?: number      // Standard error
  [key: string]: unknown  // Index signature for DataRecord compatibility
}

/**
 * Simple linear regression using least squares
 */
function linearRegression(
  xs: number[],
  ys: number[]
): { slope: number; intercept: number; rSquared: number; se: number } {
  const n = xs.length
  if (n < 2) {
    return { slope: 0, intercept: ys[0] ?? 0, rSquared: 0, se: 0 }
  }

  // Calculate means
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  // Calculate slope and intercept
  let ssXY = 0
  let ssXX = 0
  let ssYY = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    ssXY += dx * dy
    ssXX += dx * dx
    ssYY += dy * dy
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0
  const intercept = meanY - slope * meanX

  // Calculate R-squared
  const rSquared = ssYY > 0 ? (ssXY * ssXY) / (ssXX * ssYY) : 0

  // Calculate residual standard error
  let ssResidual = 0
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept
    ssResidual += (ys[i] - predicted) ** 2
  }
  const se = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0

  return { slope, intercept, rSquared, se }
}

/**
 * LOESS/LOWESS smoothing
 * Local polynomial regression using weighted least squares
 */
function loessSmooth(
  xs: number[],
  ys: number[],
  evalPoints: number[],
  span: number
): number[] {
  const n = xs.length
  const k = Math.max(2, Math.floor(span * n))  // Number of neighbors

  return evalPoints.map(x0 => {
    // Calculate distances to all points
    const distances = xs.map((xi, i) => ({
      index: i,
      dist: Math.abs(xi - x0),
    }))

    // Sort by distance and take k nearest
    distances.sort((a, b) => a.dist - b.dist)
    const neighbors = distances.slice(0, k)

    // Calculate max distance for tricube weighting
    const maxDist = neighbors[neighbors.length - 1].dist || 1

    // Weighted least squares for local linear fit
    let sumW = 0
    let sumWX = 0
    let sumWY = 0
    let sumWXX = 0
    let sumWXY = 0

    for (const { index, dist } of neighbors) {
      // Tricube weight function
      const u = dist / maxDist
      const w = u < 1 ? Math.pow(1 - Math.pow(u, 3), 3) : 0

      const xi = xs[index]
      const yi = ys[index]

      sumW += w
      sumWX += w * xi
      sumWY += w * yi
      sumWXX += w * xi * xi
      sumWXY += w * xi * yi
    }

    // Solve weighted normal equations
    const denom = sumW * sumWXX - sumWX * sumWX
    if (Math.abs(denom) < 1e-10) {
      return sumW > 0 ? sumWY / sumW : 0
    }

    const slope = (sumW * sumWXY - sumWX * sumWY) / denom
    const intercept = (sumWXX * sumWY - sumWX * sumWXY) / denom

    return slope * x0 + intercept
  })
}

/**
 * Compute smoothed values
 */
export function computeSmooth(
  data: DataSource,
  xField: string,
  yField: string,
  params: StatSmoothParams = {}
): DataSource {
  // Extract paired numeric values
  const points: { x: number; y: number }[] = []
  for (const row of data) {
    const x = row[xField]
    const y = row[yField]
    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
      points.push({ x, y })
    }
  }

  if (points.length < 2) {
    return []
  }

  // Sort by x
  points.sort((a, b) => a.x - b.x)
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)

  const nPoints = params.n ?? 80
  const method = params.method ?? 'lm'
  const se = params.se ?? true
  // params.level reserved for future confidence level calculation

  // Generate evaluation points
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const step = (maxX - minX) / (nPoints - 1)
  const evalPoints = Array.from({ length: nPoints }, (_, i) => minX + i * step)

  const results: SmoothResult[] = []

  if (method === 'lm') {
    // Linear regression
    const reg = linearRegression(xs, ys)

    // t-value for confidence interval (approximate for large n)
    const tValue = 1.96  // ~95% CI for normal distribution
    const n = xs.length
    const meanX = xs.reduce((a, b) => a + b, 0) / n
    const ssXX = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)

    for (const x of evalPoints) {
      const y = reg.slope * x + reg.intercept

      // Standard error of prediction at x
      const sePred = reg.se * Math.sqrt(1 / n + (x - meanX) ** 2 / ssXX)
      const margin = tValue * sePred

      const result: SmoothResult = { x, y }
      if (se) {
        result.se = sePred
        result.ymin = y - margin
        result.ymax = y + margin
      }
      results.push(result)
    }
  } else {
    // LOESS/LOWESS smoothing
    const span = params.span ?? 0.75
    const smoothed = loessSmooth(xs, ys, evalPoints, span)

    for (let i = 0; i < evalPoints.length; i++) {
      results.push({
        x: evalPoints[i],
        y: smoothed[i],
        // Note: SE calculation for loess is complex, omitting for simplicity
      })
    }
  }

  return results as DataSource
}

/**
 * Create stat_smooth transformation
 */
export function stat_smooth(params: StatSmoothParams = {}): Stat {
  return {
    type: 'smooth',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // If there's a color/group aesthetic, compute smooth per group
      if (aes.color) {
        const groups = new Map<string, DataSource>()

        for (const row of data) {
          const group = String(row[aes.color] ?? 'default')
          if (!groups.has(group)) {
            groups.set(group, [])
          }
          groups.get(group)!.push(row)
        }

        const result: DataSource = []
        for (const [group, groupData] of groups) {
          const smooth = computeSmooth(groupData, aes.x, aes.y, params)
          for (const s of smooth) {
            result.push({
              ...s,
              [aes.color]: group,
            })
          }
        }
        return result
      }

      return computeSmooth(data, aes.x, aes.y, params)
    },
  }
}
