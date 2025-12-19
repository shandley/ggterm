/**
 * Rolling Aggregator
 *
 * Computes rolling/sliding window aggregations efficiently.
 * Supports mean, sum, min, max, count, variance, and custom aggregations.
 */

import type { DataRecord } from '../types'

/**
 * Built-in aggregation types
 */
export type AggregationType =
  | 'mean'
  | 'sum'
  | 'min'
  | 'max'
  | 'count'
  | 'first'
  | 'last'
  | 'variance'
  | 'stddev'
  | 'median'

/**
 * Rolling aggregation options
 */
export interface RollingOptions {
  /** Window size for aggregation */
  windowSize: number
  /** Field to aggregate */
  field: string
  /** Aggregation type */
  type: AggregationType
  /** Output field name (defaults to field_type) */
  outputField?: string
  /** Minimum number of values required to compute (default: 1) */
  minPeriods?: number
  /** Center the window (default: false = trailing) */
  center?: boolean
}

/**
 * Internal state for efficient rolling calculations
 */
interface RollingState {
  values: number[]
  sum: number
  sumSquares: number // For variance
  min: number
  max: number
  head: number
  size: number
}

/**
 * Rolling Aggregator class
 */
export class RollingAggregator<T extends DataRecord = DataRecord> {
  private options: Required<RollingOptions>
  private state: RollingState

  constructor(options: RollingOptions) {
    this.options = {
      windowSize: options.windowSize,
      field: options.field,
      type: options.type,
      outputField: options.outputField ?? `${options.field}_${options.type}`,
      minPeriods: options.minPeriods ?? 1,
      center: options.center ?? false,
    }

    this.state = {
      values: new Array(options.windowSize).fill(0),
      sum: 0,
      sumSquares: 0,
      min: Infinity,
      max: -Infinity,
      head: 0,
      size: 0,
    }
  }

  /**
   * Add a value and get the current aggregation
   */
  push(value: number): number | null {
    const windowSize = this.options.windowSize

    // If window is full, remove oldest value from stats
    if (this.state.size === windowSize) {
      const oldValue = this.state.values[this.state.head]
      this.state.sum -= oldValue
      this.state.sumSquares -= oldValue * oldValue
    } else {
      this.state.size++
    }

    // Add new value
    this.state.values[this.state.head] = value
    this.state.sum += value
    this.state.sumSquares += value * value
    this.state.head = (this.state.head + 1) % windowSize

    // Update min/max (need to recalculate if window full)
    if (this.state.size === windowSize) {
      this.recalculateMinMax()
    } else {
      if (value < this.state.min) this.state.min = value
      if (value > this.state.max) this.state.max = value
    }

    // Check minimum periods
    if (this.state.size < this.options.minPeriods) {
      return null
    }

    return this.compute()
  }

  /**
   * Process a record and return it with the aggregated field added
   */
  process(record: T): T & { [key: string]: number | null } {
    const value = record[this.options.field]
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    const aggregated = isNaN(numValue) ? null : this.push(numValue)

    return {
      ...record,
      [this.options.outputField]: aggregated,
    }
  }

  /**
   * Process multiple records
   */
  processMany(records: T[]): Array<T & { [key: string]: number | null }> {
    return records.map((record) => this.process(record))
  }

  /**
   * Compute the current aggregation value
   */
  private compute(): number | null {
    const size = this.state.size
    if (size === 0) return null

    switch (this.options.type) {
      case 'mean':
        return this.state.sum / size

      case 'sum':
        return this.state.sum

      case 'min':
        return this.state.min === Infinity ? null : this.state.min

      case 'max':
        return this.state.max === -Infinity ? null : this.state.max

      case 'count':
        return size

      case 'first':
        return this.getValueAt(0)

      case 'last':
        return this.getValueAt(size - 1)

      case 'variance':
        if (size < 2) return null
        const mean = this.state.sum / size
        return this.state.sumSquares / size - mean * mean

      case 'stddev':
        if (size < 2) return null
        const variance = this.compute()
        return variance !== null ? Math.sqrt(Math.max(0, variance)) : null

      case 'median':
        return this.computeMedian()

      default:
        return null
    }
  }

  /**
   * Get value at position in window (0 = oldest)
   */
  private getValueAt(index: number): number | null {
    if (index < 0 || index >= this.state.size) return null
    const actualIndex =
      (this.state.head - this.state.size + index + this.options.windowSize) %
      this.options.windowSize
    return this.state.values[actualIndex]
  }

  /**
   * Compute median (requires sorting, O(n log n))
   */
  private computeMedian(): number | null {
    if (this.state.size === 0) return null

    const sorted = this.getWindowValues().sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    }
    return sorted[mid]
  }

  /**
   * Get all values in the current window
   */
  private getWindowValues(): number[] {
    const values: number[] = []
    for (let i = 0; i < this.state.size; i++) {
      const idx =
        (this.state.head - this.state.size + i + this.options.windowSize) %
        this.options.windowSize
      values.push(this.state.values[idx])
    }
    return values
  }

  /**
   * Recalculate min/max from scratch (needed when oldest value leaves window)
   */
  private recalculateMinMax(): void {
    this.state.min = Infinity
    this.state.max = -Infinity

    for (let i = 0; i < this.state.size; i++) {
      const value = this.getValueAt(i)
      if (value !== null) {
        if (value < this.state.min) this.state.min = value
        if (value > this.state.max) this.state.max = value
      }
    }
  }

  /**
   * Reset the aggregator state
   */
  reset(): void {
    this.state = {
      values: new Array(this.options.windowSize).fill(0),
      sum: 0,
      sumSquares: 0,
      min: Infinity,
      max: -Infinity,
      head: 0,
      size: 0,
    }
  }

  /**
   * Get current window size (number of values)
   */
  get currentSize(): number {
    return this.state.size
  }

  /**
   * Get configured window size
   */
  get windowSize(): number {
    return this.options.windowSize
  }

  /**
   * Get the output field name
   */
  get outputField(): string {
    return this.options.outputField
  }
}

/**
 * Create a rolling aggregator
 */
export function createRollingAggregator<T extends DataRecord = DataRecord>(
  options: RollingOptions
): RollingAggregator<T> {
  return new RollingAggregator<T>(options)
}

/**
 * Create multiple rolling aggregators and combine their output
 */
export function createMultiAggregator<T extends DataRecord = DataRecord>(
  configs: RollingOptions[]
): {
  process: (record: T) => T & { [key: string]: number | null }
  processMany: (records: T[]) => Array<T & { [key: string]: number | null }>
  reset: () => void
} {
  const aggregators = configs.map((config) => new RollingAggregator<T>(config))

  return {
    process(record: T): T & { [key: string]: number | null } {
      const result: Record<string, unknown> = { ...record }

      for (const agg of aggregators) {
        const value = record[agg['options'].field]
        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
        const aggregated = isNaN(numValue) ? null : agg.push(numValue)
        result[agg.outputField] = aggregated
      }

      return result as T & { [key: string]: number | null }
    },

    processMany(records: T[]): Array<T & { [key: string]: number | null }> {
      return records.map((record) => this.process(record))
    },

    reset(): void {
      for (const agg of aggregators) {
        agg.reset()
      }
    },
  }
}

/**
 * Exponential Moving Average (EMA) calculator
 */
export class ExponentialMovingAverage {
  private alpha: number
  private value: number | null = null

  constructor(span: number) {
    // Alpha = 2 / (span + 1) for standard EMA
    this.alpha = 2 / (span + 1)
  }

  push(value: number): number {
    if (this.value === null) {
      this.value = value
    } else {
      this.value = this.alpha * value + (1 - this.alpha) * this.value
    }
    return this.value
  }

  get current(): number | null {
    return this.value
  }

  reset(): void {
    this.value = null
  }
}
