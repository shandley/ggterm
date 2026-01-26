/**
 * stat_bin - Bin continuous data for histograms
 */

import type { AestheticMapping, DataSource, Stat } from '../types'

export interface StatBinParams {
  /** Number of bins (default: 30) */
  bins?: number
  /** Bin width (overrides bins if specified) */
  binwidth?: number
  /** Center of one bin */
  center?: number
  /** Boundary between bins */
  boundary?: number
}

/**
 * Compute bins for histogram data
 */
export function computeBins(
  data: DataSource,
  field: string,
  params: StatBinParams = {}
): { bins: BinResult[]; binWidth: number } {
  // Extract numeric values
  const values: number[] = []
  for (const row of data) {
    const val = row[field]
    if (typeof val === 'number' && !isNaN(val)) {
      values.push(val)
    }
  }

  if (values.length === 0) {
    return { bins: [], binWidth: 1 }
  }

  // Calculate range
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  // Determine bin width
  let binWidth: number
  let numBins: number

  if (params.binwidth) {
    binWidth = params.binwidth
    numBins = Math.ceil(range / binWidth)
  } else {
    numBins = params.bins ?? 30
    binWidth = range / numBins
  }

  // Ensure at least 1 bin
  if (numBins < 1) numBins = 1
  if (binWidth <= 0) binWidth = 1

  // Determine bin start
  let binStart: number
  if (params.boundary !== undefined) {
    binStart = params.boundary
    while (binStart > min) binStart -= binWidth
    while (binStart + binWidth <= min) binStart += binWidth
  } else if (params.center !== undefined) {
    binStart = params.center - binWidth / 2
    while (binStart > min) binStart -= binWidth
    while (binStart + binWidth <= min) binStart += binWidth
  } else {
    binStart = min
  }

  // Create bins
  const binCounts = new Map<number, number>()

  for (const val of values) {
    const binIndex = Math.floor((val - binStart) / binWidth)
    binCounts.set(binIndex, (binCounts.get(binIndex) ?? 0) + 1)
  }

  // Convert to result format
  const bins: BinResult[] = []
  const maxBinIndex = Math.ceil((max - binStart) / binWidth)

  for (let i = 0; i <= maxBinIndex; i++) {
    const count = binCounts.get(i) ?? 0
    const xmin = binStart + i * binWidth
    const xmax = xmin + binWidth
    const x = (xmin + xmax) / 2  // Center of bin

    bins.push({
      x,
      xmin,
      xmax,
      count,
      density: count / (values.length * binWidth),
    })
  }

  return { bins, binWidth }
}

export interface BinResult {
  x: number      // Center of bin
  xmin: number   // Left edge
  xmax: number   // Right edge
  count: number  // Number of observations
  density: number // Density (count / total / binwidth)
}

/**
 * Create stat_bin transformation
 */
export function stat_bin(params: StatBinParams = {}): Stat {
  return {
    type: 'bin',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // Check if there's a grouping aesthetic (color, fill, or group)
      const groupField = aes.color || aes.fill || aes.group

      if (groupField) {
        // Group data by the grouping variable
        const groups = new Map<string, DataSource>()
        for (const row of data) {
          const groupVal = String(row[groupField] ?? 'default')
          if (!groups.has(groupVal)) {
            groups.set(groupVal, [])
          }
          groups.get(groupVal)!.push(row)
        }

        // Compute bins for each group
        const results: DataSource = []
        for (const [groupVal, groupData] of groups) {
          const { bins } = computeBins(groupData, aes.x, params)
          for (const bin of bins) {
            results.push({
              x: bin.x,
              xmin: bin.xmin,
              xmax: bin.xmax,
              y: bin.count,
              count: bin.count,
              density: bin.density,
              [groupField]: groupVal,  // Preserve the group value
            })
          }
        }
        return results
      }

      // No grouping - bin all data together
      const { bins } = computeBins(data, aes.x, params)

      // Return binned data with y as count
      return bins.map(bin => ({
        x: bin.x,
        xmin: bin.xmin,
        xmax: bin.xmax,
        y: bin.count,
        count: bin.count,
        density: bin.density,
      }))
    },
  }
}
