/**
 * stat_density_2d - 2D Kernel Density Estimation
 *
 * Computes a 2D density surface from scatter data using kernel density
 * estimation. Output is suitable for contour visualization.
 */

import type { AestheticMapping, DataSource, Stat } from '../types'

export interface StatDensity2dParams {
  /** Bandwidth for kernel density estimation (default: auto via Scott's rule) */
  h?: number | [number, number]
  /** Number of grid points in x direction (default: 50) */
  n?: number
  /** Number of grid points in x direction */
  nx?: number
  /** Number of grid points in y direction */
  ny?: number
  /** Adjustment factor for bandwidth (default: 1) */
  adjust?: number
}

/**
 * 2D Gaussian kernel
 */
function gaussian2d(dx: number, dy: number, hx: number, hy: number): number {
  const ux = dx / hx
  const uy = dy / hy
  return Math.exp(-0.5 * (ux * ux + uy * uy)) / (2 * Math.PI * hx * hy)
}

/**
 * Scott's rule for 2D bandwidth selection
 * h = n^(-1/6) * sigma
 */
function scottBandwidth2d(values: number[]): number {
  const n = values.length
  if (n < 2) return 1

  // Calculate standard deviation
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
  const std = Math.sqrt(variance)

  // Scott's rule: h = n^(-1/6) * sigma
  return std * Math.pow(n, -1 / 6)
}

export interface Density2dResult {
  x: number
  y: number
  z: number      // density value
  density: number
  level: number  // alias for z (for contour renderer)
  [key: string]: unknown
}

/**
 * Compute 2D kernel density estimation
 */
export function computeDensity2d(
  data: DataSource,
  xField: string,
  yField: string,
  params: StatDensity2dParams = {}
): Density2dResult[] {
  // Extract numeric x, y values
  const points: { x: number; y: number }[] = []
  const xValues: number[] = []
  const yValues: number[] = []

  for (const row of data) {
    const xVal = row[xField]
    const yVal = row[yField]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) continue

    const x = Number(xVal)
    const y = Number(yVal)

    if (isNaN(x) || isNaN(y)) continue

    points.push({ x, y })
    xValues.push(x)
    yValues.push(y)
  }

  if (points.length < 3) {
    return []
  }

  const n = params.n ?? 50
  const nx = params.nx ?? n
  const ny = params.ny ?? n
  const adjust = params.adjust ?? 1

  // Calculate bandwidths
  let hx: number, hy: number
  if (Array.isArray(params.h)) {
    hx = params.h[0] * adjust
    hy = params.h[1] * adjust
  } else if (params.h !== undefined) {
    hx = params.h * adjust
    hy = params.h * adjust
  } else {
    hx = scottBandwidth2d(xValues) * adjust
    hy = scottBandwidth2d(yValues) * adjust
  }

  // Ensure positive bandwidths
  if (hx <= 0) hx = 1
  if (hy <= 0) hy = 1

  // Calculate grid extent (with padding for kernel tails)
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)

  const xPad = 3 * hx
  const yPad = 3 * hy

  const gridXMin = xMin - xPad
  const gridXMax = xMax + xPad
  const gridYMin = yMin - yPad
  const gridYMax = yMax + yPad

  const xStep = (gridXMax - gridXMin) / (nx - 1)
  const yStep = (gridYMax - gridYMin) / (ny - 1)

  // Compute density at each grid point
  const results: Density2dResult[] = []
  const nPoints = points.length

  for (let i = 0; i < nx; i++) {
    const gx = gridXMin + i * xStep

    for (let j = 0; j < ny; j++) {
      const gy = gridYMin + j * yStep

      // Sum kernel contributions from all data points
      let density = 0
      for (const pt of points) {
        density += gaussian2d(gx - pt.x, gy - pt.y, hx, hy)
      }
      density /= nPoints

      results.push({
        x: gx,
        y: gy,
        z: density,
        density,
        level: density,
      })
    }
  }

  return results
}

/**
 * Create stat_density_2d transformation
 */
export function stat_density_2d(params: StatDensity2dParams = {}): Stat {
  return {
    type: 'density_2d',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // If there's a color/group aesthetic, compute density per group
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
          const density = computeDensity2d(groupData, aes.x, aes.y, params)
          for (const d of density) {
            result.push({
              ...d,
              [aes.color]: group,
            })
          }
        }
        return result
      }

      return computeDensity2d(data, aes.x, aes.y, params) as DataSource
    },
  }
}
