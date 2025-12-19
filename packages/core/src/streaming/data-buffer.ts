/**
 * Data Buffer
 *
 * Efficient circular buffer for streaming data storage.
 * Provides O(1) push/pop operations and automatic capacity management.
 */

import type { DataRecord } from '../types'

/**
 * Buffer configuration options
 */
export interface BufferOptions {
  /** Maximum number of records to store */
  maxSize: number
  /** Whether to overwrite oldest data when full (default: true) */
  overwrite?: boolean
  /** Field to use for time-based operations */
  timeField?: string
  /** Maximum age in milliseconds (removes old data automatically) */
  maxAge?: number
}

/**
 * Circular buffer for efficient streaming data storage
 */
export class DataBuffer<T extends DataRecord = DataRecord> {
  private buffer: T[]
  private head: number = 0
  private tail: number = 0
  private _size: number = 0
  private options: Required<BufferOptions>
  private lastCleanup: number = 0
  private cleanupInterval: number = 1000 // Check for old data every second

  constructor(options: BufferOptions) {
    this.options = {
      maxSize: options.maxSize,
      overwrite: options.overwrite ?? true,
      timeField: options.timeField ?? 'time',
      maxAge: options.maxAge ?? 0,
    }
    this.buffer = new Array(options.maxSize)
  }

  /**
   * Push a single record to the buffer
   */
  push(record: T): boolean {
    // Check for age-based cleanup
    if (this.options.maxAge > 0) {
      this.cleanupOldData()
    }

    if (this._size === this.options.maxSize) {
      if (!this.options.overwrite) {
        return false // Buffer full, can't add
      }
      // Overwrite oldest
      this.head = (this.head + 1) % this.options.maxSize
    } else {
      this._size++
    }

    this.buffer[this.tail] = record
    this.tail = (this.tail + 1) % this.options.maxSize
    return true
  }

  /**
   * Push multiple records to the buffer
   */
  pushMany(records: T[]): number {
    let added = 0
    for (const record of records) {
      if (this.push(record)) {
        added++
      }
    }
    return added
  }

  /**
   * Remove and return the oldest record
   */
  shift(): T | undefined {
    if (this._size === 0) {
      return undefined
    }

    const record = this.buffer[this.head]
    this.head = (this.head + 1) % this.options.maxSize
    this._size--
    return record
  }

  /**
   * Get record at index (0 = oldest)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined
    }
    const actualIndex = (this.head + index) % this.options.maxSize
    return this.buffer[actualIndex]
  }

  /**
   * Get the most recent record
   */
  latest(): T | undefined {
    if (this._size === 0) {
      return undefined
    }
    const index = (this.tail - 1 + this.options.maxSize) % this.options.maxSize
    return this.buffer[index]
  }

  /**
   * Get the oldest record
   */
  oldest(): T | undefined {
    if (this._size === 0) {
      return undefined
    }
    return this.buffer[this.head]
  }

  /**
   * Get all records as array (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.options.maxSize
      result.push(this.buffer[index])
    }
    return result
  }

  /**
   * Get records within a time range
   */
  getTimeRange(startTime: number, endTime: number): T[] {
    const timeField = this.options.timeField
    const result: T[] = []

    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.options.maxSize
      const record = this.buffer[index]
      const time = record[timeField] as number

      if (time >= startTime && time <= endTime) {
        result.push(record)
      }
    }

    return result
  }

  /**
   * Get the last N records
   */
  getLast(n: number): T[] {
    const count = Math.min(n, this._size)
    const result: T[] = []

    for (let i = this._size - count; i < this._size; i++) {
      const index = (this.head + i) % this.options.maxSize
      result.push(this.buffer[index])
    }

    return result
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.head = 0
    this.tail = 0
    this._size = 0
  }

  /**
   * Current number of records
   */
  get size(): number {
    return this._size
  }

  /**
   * Maximum capacity
   */
  get capacity(): number {
    return this.options.maxSize
  }

  /**
   * Whether buffer is full
   */
  get isFull(): boolean {
    return this._size === this.options.maxSize
  }

  /**
   * Whether buffer is empty
   */
  get isEmpty(): boolean {
    return this._size === 0
  }

  /**
   * Get time range of data in buffer
   */
  getTimeExtent(): { min: number; max: number } | null {
    if (this._size === 0) {
      return null
    }

    const timeField = this.options.timeField
    let min = Infinity
    let max = -Infinity

    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.options.maxSize
      const time = this.buffer[index][timeField] as number
      if (time < min) min = time
      if (time > max) max = time
    }

    return { min, max }
  }

  /**
   * Remove data older than maxAge
   */
  private cleanupOldData(): void {
    const now = Date.now()
    if (now - this.lastCleanup < this.cleanupInterval) {
      return
    }
    this.lastCleanup = now

    const cutoff = now - this.options.maxAge
    const timeField = this.options.timeField

    while (this._size > 0) {
      const oldest = this.buffer[this.head]
      const time = oldest[timeField] as number

      if (time >= cutoff) {
        break // All remaining data is fresh
      }

      // Remove old record
      this.head = (this.head + 1) % this.options.maxSize
      this._size--
    }
  }

  /**
   * Iterate over all records
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.options.maxSize
      yield this.buffer[index]
    }
  }

  /**
   * Map over all records
   */
  map<U>(fn: (record: T, index: number) => U): U[] {
    const result: U[] = []
    let i = 0
    for (const record of this) {
      result.push(fn(record, i++))
    }
    return result
  }

  /**
   * Filter records
   */
  filter(fn: (record: T) => boolean): T[] {
    const result: T[] = []
    for (const record of this) {
      if (fn(record)) {
        result.push(record)
      }
    }
    return result
  }

  /**
   * Reduce records
   */
  reduce<U>(fn: (acc: U, record: T) => U, initial: U): U {
    let acc = initial
    for (const record of this) {
      acc = fn(acc, record)
    }
    return acc
  }
}

/**
 * Create a data buffer with the given options
 */
export function createDataBuffer<T extends DataRecord = DataRecord>(
  options: BufferOptions
): DataBuffer<T> {
  return new DataBuffer<T>(options)
}
