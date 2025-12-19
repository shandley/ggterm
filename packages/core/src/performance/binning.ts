/**
 * Data Binning
 *
 * Aggregate points into bins for efficient visualization of dense data.
 * Supports hexagonal and rectangular binning.
 */

import type { DataRecord, RGBA } from '../types'

/**
 * Bin options
 */
export interface BinOptions {
  /** X field in data */
  xField: string
  /** Y field in data */
  yField: string
  /** Number of bins in X direction */
  xBins?: number
  /** Number of bins in Y direction */
  yBins?: number
  /** Bin size (alternative to xBins/yBins) */
  binSize?: number
  /** X domain (auto-computed if not provided) */
  xDomain?: [number, number]
  /** Y domain (auto-computed if not provided) */
  yDomain?: [number, number]
  /** Aggregation function for values */
  aggregate?: 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max'
  /** Field to aggregate (for non-count aggregations) */
  valueField?: string
}

/**
 * Rectangular bin result
 */
export interface Bin {
  /** Bin center X */
  x: number
  /** Bin center Y */
  y: number
  /** Bin count */
  count: number
  /** Aggregated value */
  value: number
  /** Bin width */
  width: number
  /** Bin height */
  height: number
  /** Original points in this bin */
  points: DataRecord[]
}

/**
 * Hexagonal bin result
 */
export interface HexBin extends Bin {
  /** Hexagon vertices */
  vertices: Array<{ x: number; y: number }>
  /** Column index */
  col: number
  /** Row index */
  row: number
}

/**
 * Compute data domain from values
 */
function computeDomain(data: DataRecord[], field: string): [number, number] {
  let min = Infinity
  let max = -Infinity

  for (const d of data) {
    const v = d[field] as number
    if (typeof v === 'number' && !isNaN(v)) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  if (min === Infinity) return [0, 1]
  if (min === max) return [min - 0.5, max + 0.5]
  return [min, max]
}

/**
 * Aggregate values in a bin
 */
function aggregateValues(
  values: number[],
  method: 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max'
): number {
  if (values.length === 0) return 0

  switch (method) {
    case 'count':
      return values.length

    case 'sum':
      return values.reduce((a, b) => a + b, 0)

    case 'mean':
      return values.reduce((a, b) => a + b, 0) / values.length

    case 'median':
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

    case 'min':
      return Math.min(...values)

    case 'max':
      return Math.max(...values)

    default:
      return values.length
  }
}

/**
 * Rectangular binning
 */
export function rectbin<T extends DataRecord>(data: T[], options: BinOptions): Bin[] {
  const {
    xField,
    yField,
    xBins = 20,
    yBins = 20,
    aggregate = 'count',
    valueField,
  } = options

  if (data.length === 0) return []

  // Compute domains
  const xDomain = options.xDomain ?? computeDomain(data, xField)
  const yDomain = options.yDomain ?? computeDomain(data, yField)

  const xRange = xDomain[1] - xDomain[0]
  const yRange = yDomain[1] - yDomain[0]
  const binWidth = xRange / xBins
  const binHeight = yRange / yBins

  // Create bin grid
  const bins = new Map<string, { points: T[]; values: number[] }>()

  // Assign points to bins
  for (const point of data) {
    const x = point[xField] as number
    const y = point[yField] as number

    if (typeof x !== 'number' || typeof y !== 'number') continue

    const bx = Math.min(xBins - 1, Math.max(0, Math.floor((x - xDomain[0]) / binWidth)))
    const by = Math.min(yBins - 1, Math.max(0, Math.floor((y - yDomain[0]) / binHeight)))
    const key = `${bx},${by}`

    if (!bins.has(key)) {
      bins.set(key, { points: [], values: [] })
    }

    const bin = bins.get(key)!
    bin.points.push(point)

    if (valueField && typeof point[valueField] === 'number') {
      bin.values.push(point[valueField] as number)
    }
  }

  // Convert to bin array
  const result: Bin[] = []

  for (const [key, bin] of bins) {
    const [bx, by] = key.split(',').map(Number)

    const centerX = xDomain[0] + (bx + 0.5) * binWidth
    const centerY = yDomain[0] + (by + 0.5) * binHeight

    result.push({
      x: centerX,
      y: centerY,
      count: bin.points.length,
      value: aggregateValues(bin.values.length > 0 ? bin.values : [bin.points.length], aggregate),
      width: binWidth,
      height: binHeight,
      points: bin.points,
    })
  }

  return result
}

/**
 * Hexagonal binning
 * Uses offset coordinate system for hex grid
 */
export function hexbin<T extends DataRecord>(
  data: T[],
  options: BinOptions & { radius?: number }
): HexBin[] {
  const { xField, yField, aggregate = 'count', valueField, radius = 10 } = options

  if (data.length === 0) return []

  // Compute domains
  const xDomain = options.xDomain ?? computeDomain(data, xField)
  const yDomain = options.yDomain ?? computeDomain(data, yField)

  // Hex geometry
  const hexWidth = radius * 2
  const hexHeight = radius * Math.sqrt(3)

  // Create bin grid
  const bins = new Map<string, { points: T[]; values: number[]; col: number; row: number }>()

  // Assign points to hexagonal bins
  for (const point of data) {
    const x = point[xField] as number
    const y = point[yField] as number

    if (typeof x !== 'number' || typeof y !== 'number') continue

    // Convert to hex coordinates
    const col = Math.round((x - xDomain[0]) / (hexWidth * 0.75))
    const row = Math.round((y - yDomain[0]) / hexHeight - (col % 2) * 0.5)
    const key = `${col},${row}`

    if (!bins.has(key)) {
      bins.set(key, { points: [], values: [], col, row })
    }

    const bin = bins.get(key)!
    bin.points.push(point)

    if (valueField && typeof point[valueField] === 'number') {
      bin.values.push(point[valueField] as number)
    }
  }

  // Generate hex vertices
  function hexVertices(cx: number, cy: number, r: number): Array<{ x: number; y: number }> {
    const vertices: Array<{ x: number; y: number }> = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6
      vertices.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      })
    }
    return vertices
  }

  // Convert to hexbin array
  const result: HexBin[] = []

  for (const [, bin] of bins) {
    const centerX = xDomain[0] + bin.col * hexWidth * 0.75
    const centerY = yDomain[0] + (bin.row + (bin.col % 2) * 0.5) * hexHeight

    result.push({
      x: centerX,
      y: centerY,
      count: bin.points.length,
      value: aggregateValues(bin.values.length > 0 ? bin.values : [bin.points.length], aggregate),
      width: hexWidth,
      height: hexHeight,
      points: bin.points,
      vertices: hexVertices(centerX, centerY, radius),
      col: bin.col,
      row: bin.row,
    })
  }

  return result
}

/**
 * Binner class for reusable binning configuration
 */
export class Binner<T extends DataRecord = DataRecord> {
  private options: BinOptions
  private type: 'rect' | 'hex'
  private hexRadius: number

  constructor(options: BinOptions & { type?: 'rect' | 'hex'; hexRadius?: number }) {
    this.options = options
    this.type = options.type ?? 'rect'
    this.hexRadius = options.hexRadius ?? 10
  }

  /**
   * Bin the data
   */
  bin(data: T[]): Bin[] | HexBin[] {
    if (this.type === 'hex') {
      return hexbin(data, { ...this.options, radius: this.hexRadius })
    }
    return rectbin(data, this.options)
  }

  /**
   * Get bin data ready for plotting
   */
  toPlotData(
    data: T[]
  ): Array<{
    x: number
    y: number
    count: number
    value: number
    size: number
  }> {
    const bins = this.bin(data)

    // Normalize sizes
    const maxCount = Math.max(...bins.map((b) => b.count))
    const minSize = 1
    const maxSize = 5

    return bins.map((bin) => ({
      x: bin.x,
      y: bin.y,
      count: bin.count,
      value: bin.value,
      size: minSize + (bin.count / maxCount) * (maxSize - minSize),
    }))
  }

  /**
   * Generate a density color scale
   */
  getDensityColors(bins: Bin[], colorScale: (t: number) => RGBA): Map<Bin, RGBA> {
    const maxCount = Math.max(...bins.map((b) => b.count))
    const colors = new Map<Bin, RGBA>()

    for (const bin of bins) {
      const t = bin.count / maxCount
      colors.set(bin, colorScale(t))
    }

    return colors
  }
}

/**
 * Create a binner
 */
export function createBinner<T extends DataRecord = DataRecord>(
  options: BinOptions & { type?: 'rect' | 'hex'; hexRadius?: number }
): Binner<T> {
  return new Binner<T>(options)
}
