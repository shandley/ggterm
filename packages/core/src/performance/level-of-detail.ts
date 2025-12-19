/**
 * Level of Detail (LOD)
 *
 * Progressive rendering based on data density and viewport.
 * Automatically adjusts detail level for performance.
 */

import type { DataRecord } from '../types'
import { systematicSample, lttbSample } from './sampling'

/**
 * LOD level definition
 */
export interface LODLevel {
  /** Name of this level */
  name: string
  /** Maximum points at this level */
  maxPoints: number
  /** Minimum data size to trigger this level */
  threshold: number
  /** Sampling method for this level */
  samplingMethod?: 'systematic' | 'lttb' | 'binned'
  /** Optional binning resolution */
  binResolution?: number
}

/**
 * LOD configuration options
 */
export interface LODOptions {
  /** LOD levels (sorted by threshold ascending) */
  levels: LODLevel[]
  /** X field for LTTB sampling */
  xField?: string
  /** Y field for LTTB sampling */
  yField?: string
  /** Enable automatic level selection */
  autoSelect?: boolean
  /** Target render time in ms (for auto-adjustment) */
  targetRenderMs?: number
}

/**
 * Default LOD levels for common use cases
 */
export const DEFAULT_LOD_LEVELS: LODLevel[] = [
  { name: 'full', maxPoints: 500, threshold: 0 },
  { name: 'medium', maxPoints: 1000, threshold: 1000, samplingMethod: 'lttb' },
  { name: 'low', maxPoints: 500, threshold: 5000, samplingMethod: 'lttb' },
  { name: 'veryLow', maxPoints: 200, threshold: 20000, samplingMethod: 'systematic' },
  { name: 'minimal', maxPoints: 100, threshold: 100000, samplingMethod: 'binned', binResolution: 50 },
]

/**
 * Bin data for extreme LOD reduction
 */
function binData<T extends DataRecord>(
  data: T[],
  resolution: number,
  xField: string,
  yField: string
): T[] {
  if (data.length === 0) return []

  // Find data bounds
  let xMin = Infinity,
    xMax = -Infinity
  let yMin = Infinity,
    yMax = -Infinity

  for (const d of data) {
    const x = d[xField] as number
    const y = d[yField] as number
    if (x < xMin) xMin = x
    if (x > xMax) xMax = x
    if (y < yMin) yMin = y
    if (y > yMax) yMax = y
  }

  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1
  const xStep = xRange / resolution
  const yStep = yRange / resolution

  // Create bins
  const bins = new Map<string, { sum: T; count: number }>()

  for (const d of data) {
    const x = d[xField] as number
    const y = d[yField] as number
    const bx = Math.floor((x - xMin) / xStep)
    const by = Math.floor((y - yMin) / yStep)
    const key = `${bx},${by}`

    if (!bins.has(key)) {
      bins.set(key, { sum: { ...d }, count: 1 })
    } else {
      const bin = bins.get(key)!
      bin.count++
      // Average numeric fields
      for (const field of Object.keys(d)) {
        const val = d[field]
        if (typeof val === 'number') {
          ;(bin.sum as Record<string, unknown>)[field] =
            ((bin.sum[field] as number) || 0) + val
        }
      }
    }
  }

  // Convert bins to points (using averages)
  const result: T[] = []
  for (const bin of bins.values()) {
    const point = { ...bin.sum }
    for (const field of Object.keys(point)) {
      const val = point[field]
      if (typeof val === 'number') {
        ;(point as Record<string, unknown>)[field] = val / bin.count
      }
    }
    result.push(point as T)
  }

  return result
}

/**
 * Level of Detail manager
 */
export class LevelOfDetail<T extends DataRecord = DataRecord> {
  private options: Required<LODOptions>
  private currentLevel: LODLevel
  private lastRenderMs: number = 0
  private adaptiveMaxPoints: number

  constructor(options: LODOptions) {
    const levels = options.levels.length > 0 ? options.levels : DEFAULT_LOD_LEVELS

    this.options = {
      levels: levels.sort((a, b) => a.threshold - b.threshold),
      xField: options.xField ?? 'x',
      yField: options.yField ?? 'y',
      autoSelect: options.autoSelect ?? true,
      targetRenderMs: options.targetRenderMs ?? 16, // 60fps target
    }

    this.currentLevel = this.options.levels[0]
    this.adaptiveMaxPoints = this.currentLevel.maxPoints
  }

  /**
   * Select appropriate LOD level for data size
   */
  selectLevel(dataSize: number): LODLevel {
    // Find highest threshold that data exceeds
    let selected = this.options.levels[0]

    for (const level of this.options.levels) {
      if (dataSize >= level.threshold) {
        selected = level
      }
    }

    this.currentLevel = selected
    return selected
  }

  /**
   * Process data with automatic LOD selection
   */
  process(data: T[]): T[] {
    if (!this.options.autoSelect) {
      return this.applyLevel(data, this.currentLevel)
    }

    const level = this.selectLevel(data.length)
    return this.applyLevel(data, level)
  }

  /**
   * Apply a specific LOD level to data
   */
  applyLevel(data: T[], level: LODLevel): T[] {
    if (data.length <= level.maxPoints) {
      return data
    }

    const method = level.samplingMethod || 'systematic'

    switch (method) {
      case 'lttb':
        return lttbSample(data, level.maxPoints, this.options.xField, this.options.yField)

      case 'binned':
        return binData(
          data,
          level.binResolution || 50,
          this.options.xField,
          this.options.yField
        )

      case 'systematic':
      default:
        return systematicSample(data, level.maxPoints)
    }
  }

  /**
   * Update render timing for adaptive LOD
   */
  updateRenderTime(renderMs: number): void {
    this.lastRenderMs = renderMs

    // Adjust adaptive max points based on render time
    if (renderMs > this.options.targetRenderMs * 1.5) {
      // Too slow - reduce points
      this.adaptiveMaxPoints = Math.max(50, Math.floor(this.adaptiveMaxPoints * 0.8))
    } else if (renderMs < this.options.targetRenderMs * 0.5) {
      // Fast enough - can increase points
      this.adaptiveMaxPoints = Math.min(
        this.currentLevel.maxPoints * 2,
        Math.floor(this.adaptiveMaxPoints * 1.2)
      )
    }
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel(): LODLevel {
    return this.currentLevel
  }

  /**
   * Get all LOD levels
   */
  getLevels(): LODLevel[] {
    return [...this.options.levels]
  }

  /**
   * Force a specific LOD level by name
   */
  setLevel(name: string): boolean {
    const level = this.options.levels.find((l) => l.name === name)
    if (level) {
      this.currentLevel = level
      this.adaptiveMaxPoints = level.maxPoints
      return true
    }
    return false
  }

  /**
   * Get LOD statistics
   */
  getStats(): {
    currentLevel: string
    maxPoints: number
    adaptiveMaxPoints: number
    lastRenderMs: number
    targetRenderMs: number
  } {
    return {
      currentLevel: this.currentLevel.name,
      maxPoints: this.currentLevel.maxPoints,
      adaptiveMaxPoints: this.adaptiveMaxPoints,
      lastRenderMs: this.lastRenderMs,
      targetRenderMs: this.options.targetRenderMs,
    }
  }

  /**
   * Process with adaptive point limit
   */
  processAdaptive(data: T[]): T[] {
    if (data.length <= this.adaptiveMaxPoints) {
      return data
    }

    return lttbSample(data, this.adaptiveMaxPoints, this.options.xField, this.options.yField)
  }
}

/**
 * Create a Level of Detail manager
 */
export function createLOD<T extends DataRecord = DataRecord>(
  options: Partial<LODOptions> = {}
): LevelOfDetail<T> {
  return new LevelOfDetail<T>({
    levels: options.levels ?? DEFAULT_LOD_LEVELS,
    xField: options.xField,
    yField: options.yField,
    autoSelect: options.autoSelect,
    targetRenderMs: options.targetRenderMs,
  })
}
