/**
 * stat_bin2d - 2D binning for heatmaps
 *
 * Bins continuous x and y data into a 2D grid, counting observations
 * in each cell. Useful for visualizing dense scatter data as a heatmap.
 */

import type { AestheticMapping, DataSource, Stat } from '@ggterm/spec/types'
import { rectbin } from '../performance/binning'

export interface StatBin2dParams {
  /** Number of bins in x direction (default: 30) */
  bins?: number
  /** Number of bins in x direction */
  binsx?: number
  /** Number of bins in y direction */
  binsy?: number
  /** Drop bins with zero count (default: true) */
  drop?: boolean
}

export interface Bin2dResult {
  x: number       // Center of bin (x)
  y: number       // Center of bin (y)
  count: number   // Number of observations
  density: number // Density (count / total)
  width: number   // Bin width
  height: number  // Bin height
}

/**
 * Compute 2D bins for heatmap data
 */
export function computeBins2d(
  data: DataSource,
  xField: string,
  yField: string,
  params: StatBin2dParams = {}
): Bin2dResult[] {
  const {
    bins = 30,
    binsx,
    binsy,
    drop = true,
  } = params

  const xBins = binsx ?? bins
  const yBins = binsy ?? bins

  // Use rectbin from performance/binning
  const binned = rectbin(data, {
    xField,
    yField,
    xBins,
    yBins,
    aggregate: 'count',
  })

  const total = data.length

  // Convert to result format
  const results: Bin2dResult[] = binned.map(bin => ({
    x: bin.x,
    y: bin.y,
    count: bin.count,
    density: total > 0 ? bin.count / total : 0,
    width: bin.width,
    height: bin.height,
  }))

  // Optionally drop empty bins
  if (drop) {
    return results.filter(r => r.count > 0)
  }

  return results
}

/**
 * Create stat_bin2d transformation
 */
export function stat_bin2d(params: StatBin2dParams = {}): Stat {
  return {
    type: 'bin2d',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      const bins = computeBins2d(data, aes.x, aes.y, params)

      // Return binned data with fill as count for heatmap coloring
      return bins.map(bin => ({
        x: bin.x,
        y: bin.y,
        count: bin.count,
        density: bin.density,
        fill: bin.count,  // Use count for fill aesthetic
        width: bin.width,
        height: bin.height,
      }))
    },
  }
}
