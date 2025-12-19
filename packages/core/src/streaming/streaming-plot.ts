/**
 * Streaming Plot
 *
 * High-level API for creating streaming/real-time plots.
 * Combines data buffering, windowing, aggregation, and rendering.
 */

import type { DataRecord, AestheticMapping, Geom, Scale, Theme, Labels } from '../types'
import { GGPlot, gg } from '../grammar'
import { DataBuffer } from './data-buffer'
import { DataWindow } from './data-window'
import { RollingAggregator, type RollingOptions } from './rolling-aggregator'

/**
 * Streaming plot configuration
 */
export interface StreamingPlotOptions {
  /** Maximum number of points to display */
  maxPoints?: number
  /** Time window in milliseconds (alternative to maxPoints) */
  timeWindow?: number
  /** Field to use for time-based operations */
  timeField?: string
  /** Update throttle in milliseconds */
  throttleMs?: number
  /** Auto-rescale axes on new data */
  autoScale?: boolean
  /** Rolling aggregations to compute */
  aggregations?: RollingOptions[]
  /** Initial aesthetic mapping */
  aes?: AestheticMapping
  /** Initial geometries */
  geoms?: Geom[]
  /** Initial scales */
  scales?: Scale[]
  /** Theme */
  theme?: Partial<Theme>
  /** Labels */
  labels?: Labels
}

/**
 * Current state of the streaming plot
 */
export interface StreamingPlotState {
  /** Total points received */
  totalPoints: number
  /** Points currently displayed */
  displayedPoints: number
  /** Points per second (recent) */
  pointsPerSecond: number
  /** Last update timestamp */
  lastUpdate: number
  /** Is currently rendering */
  isRendering: boolean
  /** Last render duration in ms */
  lastRenderMs: number
}

/**
 * Render output
 */
export interface RenderOutput {
  /** Rendered string */
  output: string
  /** Render duration in ms */
  renderMs: number
  /** Number of points rendered */
  pointCount: number
}

/**
 * Event types for streaming plot
 */
export type StreamingEventType = 'data' | 'render' | 'resize' | 'error'

/**
 * Streaming Plot class
 */
/**
 * Internal options with resolved defaults
 */
interface ResolvedStreamingOptions {
  maxPoints: number
  timeWindow: number
  timeField: string
  throttleMs: number
  autoScale: boolean
  aggregations: RollingOptions[]
  aes: AestheticMapping
  geoms: Geom[]
  scales: Scale[]
  theme: Partial<Theme>
  labels: Labels
}

export class StreamingPlot<T extends DataRecord = DataRecord> {
  private options: ResolvedStreamingOptions
  private buffer: DataBuffer<T>
  private window: DataWindow<T> | null = null
  private aggregators: RollingAggregator<T>[] = []
  private plot: GGPlot | null = null

  private state: StreamingPlotState = {
    totalPoints: 0,
    displayedPoints: 0,
    pointsPerSecond: 0,
    lastUpdate: 0,
    isRendering: false,
    lastRenderMs: 0,
  }

  private lastRenderTime: number = 0
  private recentPoints: number[] = [] // Timestamps for rate calculation
  private eventHandlers: Map<StreamingEventType, Array<(data: unknown) => void>> = new Map()
  private pendingRender: boolean = false
  private renderWidth: number = 80
  private renderHeight: number = 20

  constructor(options: StreamingPlotOptions = {}) {
    this.options = {
      maxPoints: options.maxPoints ?? 1000,
      timeWindow: options.timeWindow ?? 0,
      timeField: options.timeField ?? 'time',
      throttleMs: options.throttleMs ?? 50,
      autoScale: options.autoScale ?? true,
      aggregations: options.aggregations ?? [],
      aes: options.aes ?? { x: 'x', y: 'y' },
      geoms: options.geoms ?? [],
      scales: options.scales ?? [],
      theme: options.theme ?? {},
      labels: options.labels ?? {},
    }

    // Initialize buffer
    this.buffer = new DataBuffer<T>({
      maxSize: this.options.maxPoints * 2, // Buffer more than displayed
      timeField: this.options.timeField,
      maxAge: this.options.timeWindow > 0 ? this.options.timeWindow * 2 : 0,
    })

    // Initialize window if time-based
    if (this.options.timeWindow > 0) {
      this.window = new DataWindow<T>({
        type: 'time',
        size: this.options.timeWindow,
        timeField: this.options.timeField,
        maxBufferSize: this.options.maxPoints * 2,
      })
    }

    // Initialize aggregators
    for (const config of this.options.aggregations) {
      this.aggregators.push(new RollingAggregator<T>(config))
    }
  }

  /**
   * Push a single data point
   */
  push(record: T): this {
    // Apply aggregations
    let processed = record
    for (const agg of this.aggregators) {
      processed = agg.process(processed) as T
    }

    // Add to buffer
    this.buffer.push(processed)

    // Add to window if using time-based windowing
    if (this.window) {
      this.window.push(processed)
    }

    // Update state
    this.state.totalPoints++
    this.state.lastUpdate = Date.now()

    // Track rate
    this.recentPoints.push(Date.now())
    this.cleanupRateTracking()

    // Emit data event
    this.emit('data', { record: processed, state: this.state })

    // Schedule render if throttled
    this.scheduleRender()

    return this
  }

  /**
   * Push multiple data points
   */
  pushMany(records: T[]): this {
    for (const record of records) {
      this.push(record)
    }
    return this
  }

  /**
   * Get current data for rendering
   */
  getData(): T[] {
    if (this.window) {
      return this.window.getWindowData()
    }
    return this.buffer.getLast(this.options.maxPoints)
  }

  /**
   * Render the plot to a string
   */
  render(options?: { width?: number; height?: number }): RenderOutput {
    const startTime = performance.now()
    this.state.isRendering = true

    const width = options?.width ?? this.renderWidth
    const height = options?.height ?? this.renderHeight

    try {
      const data = this.getData()
      this.state.displayedPoints = data.length

      // Build plot
      this.plot = gg(data).aes(this.options.aes)

      // Add geoms
      for (const geom of this.options.geoms) {
        this.plot = this.plot.geom(geom)
      }

      // Add scales
      for (const scale of this.options.scales) {
        this.plot = this.plot.scale(scale)
      }

      // Add labels
      if (Object.keys(this.options.labels).length > 0) {
        this.plot = this.plot.labs(this.options.labels)
      }

      const output = this.plot.render({ width, height })

      const renderMs = performance.now() - startTime
      this.state.lastRenderMs = renderMs
      this.state.isRendering = false

      const result: RenderOutput = {
        output,
        renderMs,
        pointCount: data.length,
      }

      this.emit('render', result)
      return result
    } catch (error) {
      this.state.isRendering = false
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Schedule a throttled render
   */
  private scheduleRender(): void {
    if (this.pendingRender) return

    const now = Date.now()
    const elapsed = now - this.lastRenderTime

    if (elapsed >= this.options.throttleMs) {
      this.lastRenderTime = now
      // Don't auto-render, let consumer call render()
    } else {
      this.pendingRender = true
      setTimeout(() => {
        this.pendingRender = false
        this.lastRenderTime = Date.now()
      }, this.options.throttleMs - elapsed)
    }
  }

  /**
   * Clean up old timestamps from rate tracking
   */
  private cleanupRateTracking(): void {
    const cutoff = Date.now() - 1000 // Keep last second
    while (this.recentPoints.length > 0 && this.recentPoints[0] < cutoff) {
      this.recentPoints.shift()
    }
    this.state.pointsPerSecond = this.recentPoints.length
  }

  /**
   * Get current state
   */
  getState(): StreamingPlotState {
    this.cleanupRateTracking()
    return { ...this.state }
  }

  /**
   * Set render dimensions
   */
  setSize(width: number, height: number): this {
    this.renderWidth = width
    this.renderHeight = height
    this.emit('resize', { width, height })
    return this
  }

  /**
   * Update aesthetic mapping
   */
  setAes(aes: AestheticMapping): this {
    this.options.aes = { ...this.options.aes, ...aes }
    return this
  }

  /**
   * Add a geometry
   */
  addGeom(geom: Geom): this {
    this.options.geoms.push(geom)
    return this
  }

  /**
   * Set geometries (replaces existing)
   */
  setGeoms(geoms: Geom[]): this {
    this.options.geoms = geoms
    return this
  }

  /**
   * Add a scale
   */
  addScale(scale: Scale): this {
    this.options.scales.push(scale)
    return this
  }

  /**
   * Set labels
   */
  setLabels(labels: Labels): this {
    this.options.labels = { ...this.options.labels, ...labels }
    return this
  }

  /**
   * Add a rolling aggregation
   */
  addAggregation(options: RollingOptions): this {
    this.aggregators.push(new RollingAggregator<T>(options))
    return this
  }

  /**
   * Clear all data
   */
  clear(): this {
    this.buffer.clear()
    if (this.window) {
      this.window.clear()
    }
    for (const agg of this.aggregators) {
      agg.reset()
    }
    this.state.totalPoints = 0
    this.state.displayedPoints = 0
    this.recentPoints = []
    return this
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): {
    size: number
    capacity: number
    utilization: number
  } {
    return {
      size: this.buffer.size,
      capacity: this.buffer.capacity,
      utilization: this.buffer.size / this.buffer.capacity,
    }
  }

  /**
   * Register event handler
   */
  on(event: StreamingEventType, handler: (data: unknown) => void): this {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
    return this
  }

  /**
   * Remove event handler
   */
  off(event: StreamingEventType, handler: (data: unknown) => void): this {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
    return this
  }

  /**
   * Emit event
   */
  private emit(event: StreamingEventType, data: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (e) {
          console.error(`Error in ${event} handler:`, e)
        }
      }
    }
  }

  /**
   * Get time extent of current data
   */
  getTimeExtent(): { min: number; max: number } | null {
    return this.buffer.getTimeExtent()
  }

  /**
   * Get value extent for a field
   */
  getFieldExtent(field: string): { min: number; max: number } | null {
    const data = this.getData()
    if (data.length === 0) return null

    let min = Infinity
    let max = -Infinity

    for (const record of data) {
      const value = record[field]
      if (typeof value === 'number') {
        if (value < min) min = value
        if (value > max) max = value
      }
    }

    return min === Infinity ? null : { min, max }
  }
}

/**
 * Create a streaming plot with the given options
 */
export function createStreamingPlot<T extends DataRecord = DataRecord>(
  options?: StreamingPlotOptions
): StreamingPlot<T> {
  return new StreamingPlot<T>(options)
}

/**
 * Create a time-series streaming plot
 */
export function createTimeSeriesPlot<T extends DataRecord = DataRecord>(options: {
  timeField?: string
  valueField?: string
  timeWindow?: number
  maxPoints?: number
  title?: string
}): StreamingPlot<T> {
  const timeField = options.timeField ?? 'time'
  const valueField = options.valueField ?? 'value'

  return new StreamingPlot<T>({
    timeField,
    timeWindow: options.timeWindow,
    maxPoints: options.maxPoints ?? 500,
    aes: { x: timeField, y: valueField },
    labels: { title: options.title ?? 'Time Series' },
  })
}
