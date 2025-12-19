/**
 * Data Window
 *
 * Manages time-windowed or count-windowed data for streaming plots.
 * Provides sliding window views over streaming data.
 */

import type { DataRecord } from '../types'
import { DataBuffer } from './data-buffer'

/**
 * Window configuration options
 */
export interface WindowOptions {
  /** Window type: time-based or count-based */
  type: 'time' | 'count'
  /** Window size (milliseconds for time, count for count) */
  size: number
  /** Slide interval (how often to advance the window) */
  slide?: number
  /** Field to use for time values */
  timeField?: string
  /** Maximum buffer size (for memory management) */
  maxBufferSize?: number
  /** Whether to emit partial windows at start */
  emitPartial?: boolean
}

/**
 * Statistics for the current window
 */
export interface WindowStats {
  /** Number of records in window */
  count: number
  /** Start time/index of window */
  start: number
  /** End time/index of window */
  end: number
  /** Duration (for time windows) */
  duration: number
  /** Records per second (for time windows) */
  rate: number
}

/**
 * Window event types
 */
export type WindowEventType = 'data' | 'slide' | 'full' | 'empty'

/**
 * Window event handler
 */
export type WindowEventHandler<T extends DataRecord> = (
  event: WindowEventType,
  data: T[],
  stats: WindowStats
) => void

/**
 * Data Window for streaming data management
 */
export class DataWindow<T extends DataRecord = DataRecord> {
  private buffer: DataBuffer<T>
  private options: Required<WindowOptions>
  private windowStart: number = 0
  private lastSlide: number = 0
  private eventHandlers: Map<WindowEventType, WindowEventHandler<T>[]> = new Map()
  private recordCount: number = 0

  constructor(options: WindowOptions) {
    this.options = {
      type: options.type,
      size: options.size,
      slide: options.slide ?? options.size,
      timeField: options.timeField ?? 'time',
      maxBufferSize: options.maxBufferSize ?? 10000,
      emitPartial: options.emitPartial ?? true,
    }

    this.buffer = new DataBuffer<T>({
      maxSize: this.options.maxBufferSize,
      timeField: this.options.timeField,
      overwrite: true,
    })

    if (this.options.type === 'time') {
      this.windowStart = Date.now()
      this.lastSlide = Date.now()
    }
  }

  /**
   * Push a single record
   */
  push(record: T): void {
    this.buffer.push(record)
    this.recordCount++

    // Check for window slide
    this.checkSlide()

    // Emit data event
    this.emit('data', this.getWindowData(), this.getStats())
  }

  /**
   * Push multiple records
   */
  pushMany(records: T[]): void {
    for (const record of records) {
      this.buffer.push(record)
      this.recordCount++
    }

    this.checkSlide()
    this.emit('data', this.getWindowData(), this.getStats())
  }

  /**
   * Get data in the current window
   */
  getWindowData(): T[] {
    if (this.options.type === 'time') {
      return this.getTimeWindowData()
    }
    return this.getCountWindowData()
  }

  /**
   * Get data for a time-based window
   */
  private getTimeWindowData(): T[] {
    const now = Date.now()
    const windowEnd = now
    const windowStart = now - this.options.size

    return this.buffer.getTimeRange(windowStart, windowEnd)
  }

  /**
   * Get data for a count-based window
   */
  private getCountWindowData(): T[] {
    return this.buffer.getLast(this.options.size)
  }

  /**
   * Check if window should slide
   */
  private checkSlide(): void {
    if (this.options.type === 'time') {
      const now = Date.now()
      if (now - this.lastSlide >= this.options.slide) {
        this.lastSlide = now
        this.windowStart = now - this.options.size
        this.emit('slide', this.getWindowData(), this.getStats())
      }
    } else {
      // Count-based sliding
      if (this.recordCount - this.windowStart >= this.options.slide) {
        this.windowStart = this.recordCount
        this.emit('slide', this.getWindowData(), this.getStats())
      }
    }
  }

  /**
   * Get current window statistics
   */
  getStats(): WindowStats {
    const data = this.getWindowData()
    const count = data.length

    if (this.options.type === 'time') {
      const now = Date.now()
      const duration = Math.min(this.options.size, now - this.windowStart)
      const rate = duration > 0 ? (count / duration) * 1000 : 0

      return {
        count,
        start: now - this.options.size,
        end: now,
        duration,
        rate,
      }
    }

    // Count-based stats
    return {
      count,
      start: Math.max(0, this.recordCount - this.options.size),
      end: this.recordCount,
      duration: count,
      rate: 0,
    }
  }

  /**
   * Get all buffered data (not just window)
   */
  getAllData(): T[] {
    return this.buffer.toArray()
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.buffer.clear()
    this.recordCount = 0
    if (this.options.type === 'time') {
      this.windowStart = Date.now()
      this.lastSlide = Date.now()
    } else {
      this.windowStart = 0
    }
    this.emit('empty', [], this.getStats())
  }

  /**
   * Register event handler
   */
  on(event: WindowEventType, handler: WindowEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  /**
   * Remove event handler
   */
  off(event: WindowEventType, handler: WindowEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: WindowEventType, data: T[], stats: WindowStats): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(event, data, stats)
      }
    }
  }

  /**
   * Get buffer size
   */
  get bufferSize(): number {
    return this.buffer.size
  }

  /**
   * Get window size configuration
   */
  get windowSize(): number {
    return this.options.size
  }

  /**
   * Check if window is full
   */
  get isFull(): boolean {
    if (this.options.type === 'time') {
      const now = Date.now()
      const duration = now - this.windowStart
      return duration >= this.options.size
    }
    return this.buffer.size >= this.options.size
  }

  /**
   * Get field statistics for the current window
   */
  getFieldStats(field: string): { min: number; max: number; mean: number; sum: number } | null {
    const data = this.getWindowData()
    if (data.length === 0) return null

    let min = Infinity
    let max = -Infinity
    let sum = 0

    for (const record of data) {
      const value = record[field]
      if (typeof value === 'number') {
        if (value < min) min = value
        if (value > max) max = value
        sum += value
      }
    }

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      mean: sum / data.length,
      sum,
    }
  }
}

/**
 * Create a data window with the given options
 */
export function createDataWindow<T extends DataRecord = DataRecord>(
  options: WindowOptions
): DataWindow<T> {
  return new DataWindow<T>(options)
}
