/**
 * Data Sampling
 *
 * Efficient sampling strategies for large datasets.
 * Reduces data size while preserving statistical properties.
 */

import type { DataRecord } from '../types'

/**
 * Sampling method types
 */
export type SamplingMethod = 'systematic' | 'random' | 'reservoir' | 'stratified' | 'lttb'

/**
 * Sampling options
 */
export interface SamplingOptions {
  /** Sampling method */
  method: SamplingMethod
  /** Target number of samples */
  targetSize: number
  /** Field for stratified sampling */
  stratifyField?: string
  /** X field for LTTB (Largest Triangle Three Buckets) */
  xField?: string
  /** Y field for LTTB */
  yField?: string
  /** Random seed for reproducibility */
  seed?: number
}

/**
 * Seeded random number generator
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}

/**
 * Systematic sampling - every nth item
 * Preserves order and distribution across the dataset
 */
export function systematicSample<T>(data: T[], targetSize: number): T[] {
  if (data.length <= targetSize) return [...data]

  const step = data.length / targetSize
  const result: T[] = []

  for (let i = 0; i < targetSize; i++) {
    const index = Math.min(Math.floor(i * step), data.length - 1)
    result.push(data[index])
  }

  return result
}

/**
 * Random sampling - uniformly random selection
 * May miss local patterns but gives unbiased representation
 */
export function randomSample<T>(data: T[], targetSize: number, seed?: number): T[] {
  if (data.length <= targetSize) return [...data]

  const rng = new SeededRandom(seed ?? Date.now())
  const indices = new Set<number>()

  while (indices.size < targetSize) {
    indices.add(rng.nextInt(data.length))
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((i) => data[i])
}

/**
 * Reservoir sampling - streaming random sample
 * Useful when you don't know the total size upfront
 */
export function reservoirSample<T>(data: T[], targetSize: number, seed?: number): T[] {
  if (data.length <= targetSize) return [...data]

  const rng = new SeededRandom(seed ?? Date.now())
  const reservoir: T[] = data.slice(0, targetSize)

  for (let i = targetSize; i < data.length; i++) {
    const j = rng.nextInt(i + 1)
    if (j < targetSize) {
      reservoir[j] = data[i]
    }
  }

  return reservoir
}

/**
 * Stratified sampling - proportional sampling from groups
 * Ensures representation of all categories
 */
export function stratifiedSample<T extends DataRecord>(
  data: T[],
  targetSize: number,
  stratifyField: string,
  seed?: number
): T[] {
  if (data.length <= targetSize) return [...data]

  // Group by stratum
  const groups = new Map<string | number, T[]>()
  for (const item of data) {
    const key = item[stratifyField] as string | number
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  }

  // Calculate samples per group proportionally
  const result: T[] = []
  const rng = new SeededRandom(seed ?? Date.now())

  for (const [, group] of groups) {
    const groupShare = (group.length / data.length) * targetSize
    const groupSamples = Math.max(1, Math.round(groupShare))

    // Random sample from this group
    const sampled = randomSample(group, groupSamples, rng.nextInt(1000000))
    result.push(...sampled)
  }

  return result
}

/**
 * LTTB (Largest Triangle Three Buckets) sampling
 * Best for time series - preserves visual shape
 * Based on Sveinn Steinarsson's algorithm
 */
export function lttbSample<T extends DataRecord>(
  data: T[],
  targetSize: number,
  xField: string,
  yField: string
): T[] {
  if (data.length <= targetSize) return [...data]
  if (targetSize < 3) {
    return [data[0], data[data.length - 1]]
  }

  const result: T[] = []

  // Always include first point
  result.push(data[0])

  // Bucket size
  const bucketSize = (data.length - 2) / (targetSize - 2)

  let a = 0 // Point before current bucket

  for (let i = 0; i < targetSize - 2; i++) {
    // Calculate average point for next bucket
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length)

    let avgX = 0
    let avgY = 0
    let avgCount = 0

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j][xField] as number
      avgY += data[j][yField] as number
      avgCount++
    }
    avgX /= avgCount
    avgY /= avgCount

    // Get current bucket range
    const rangeStart = Math.floor(i * bucketSize) + 1
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1

    // Point a
    const pointAX = data[a][xField] as number
    const pointAY = data[a][yField] as number

    // Find point with largest triangle area
    let maxArea = -1
    let maxIdx = rangeStart

    for (let j = rangeStart; j < rangeEnd; j++) {
      const pointX = data[j][xField] as number
      const pointY = data[j][yField] as number

      // Triangle area (using cross product)
      const area = Math.abs(
        (pointAX - avgX) * (pointY - pointAY) - (pointAX - pointX) * (avgY - pointAY)
      )

      if (area > maxArea) {
        maxArea = area
        maxIdx = j
      }
    }

    result.push(data[maxIdx])
    a = maxIdx
  }

  // Always include last point
  result.push(data[data.length - 1])

  return result
}

/**
 * Data Sampler class - configurable sampling
 */
export class DataSampler<T extends DataRecord = DataRecord> {
  private options: SamplingOptions

  constructor(options: SamplingOptions) {
    this.options = options
  }

  /**
   * Sample the data
   */
  sample(data: T[]): T[] {
    const { method, targetSize, stratifyField, xField, yField, seed } = this.options

    switch (method) {
      case 'systematic':
        return systematicSample(data, targetSize)

      case 'random':
        return randomSample(data, targetSize, seed)

      case 'reservoir':
        return reservoirSample(data, targetSize, seed)

      case 'stratified':
        if (!stratifyField) {
          throw new Error('stratifyField required for stratified sampling')
        }
        return stratifiedSample(data, targetSize, stratifyField, seed)

      case 'lttb':
        if (!xField || !yField) {
          throw new Error('xField and yField required for LTTB sampling')
        }
        return lttbSample(data, targetSize, xField, yField)

      default:
        return systematicSample(data, targetSize)
    }
  }

  /**
   * Check if sampling is needed
   */
  needsSampling(dataSize: number): boolean {
    return dataSize > this.options.targetSize
  }

  /**
   * Get sampling ratio
   */
  getSamplingRatio(dataSize: number): number {
    if (dataSize <= this.options.targetSize) return 1
    return this.options.targetSize / dataSize
  }
}

/**
 * Create a data sampler
 */
export function createSampler<T extends DataRecord = DataRecord>(
  options: SamplingOptions
): DataSampler<T> {
  return new DataSampler<T>(options)
}

/**
 * Automatically choose best sampling method based on data characteristics
 */
export function autoSample<T extends DataRecord>(
  data: T[],
  targetSize: number,
  options: {
    xField?: string
    yField?: string
    stratifyField?: string
  } = {}
): T[] {
  if (data.length <= targetSize) return [...data]

  // If time series data with x/y fields, use LTTB
  if (options.xField && options.yField) {
    return lttbSample(data, targetSize, options.xField, options.yField)
  }

  // If categorical field for stratification, use stratified
  if (options.stratifyField) {
    return stratifiedSample(data, targetSize, options.stratifyField)
  }

  // Default to systematic for general data
  return systematicSample(data, targetSize)
}
