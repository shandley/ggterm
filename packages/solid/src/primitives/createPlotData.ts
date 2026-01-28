/**
 * createPlotData - Solid.js primitive for reactive plot data management
 *
 * Provides data manipulation with windowing, limiting, and filtering.
 */

import { createSignal, createMemo, batch } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { DataSource } from '@ggterm/core'

export interface PlotDataOptions {
  /** Maximum number of points to keep */
  maxPoints?: number
  /** Time window in milliseconds (for time-series data) */
  timeWindowMs?: number
  /** Field name for timestamp (default: 'time') */
  timeField?: string
  /** Initial data */
  initialData?: DataSource
}

export interface PlotDataState {
  /** Current data array */
  data: Accessor<DataSource>
  /** Number of data points */
  count: Accessor<number>
  /** Whether data has changed since last mark */
  isDirty: Accessor<boolean>
  /** Filtered/windowed data */
  windowedData: Accessor<DataSource>
}

export interface PlotDataActions {
  /** Set all data */
  setData: (data: DataSource) => void
  /** Push single or multiple records */
  push: (record: DataSource[number] | DataSource) => void
  /** Update record at index */
  updateAt: (index: number, record: Partial<DataSource[number]>) => void
  /** Remove records matching predicate */
  removeWhere: (predicate: (record: DataSource[number]) => boolean) => void
  /** Clear all data */
  clear: () => void
  /** Mark data as clean (reset dirty flag) */
  markClean: () => void
  /** Apply time window filter */
  applyTimeWindow: () => void
  /** Apply max points limit */
  applyMaxPoints: () => void
}

export interface CreatePlotDataReturn extends PlotDataState, PlotDataActions {}

/**
 * Creates a reactive data store for plot data
 *
 * @example
 * ```tsx
 * const plotData = createPlotData({
 *   maxPoints: 100,
 *   timeWindowMs: 60000,  // 1 minute
 *   timeField: 'timestamp'
 * })
 *
 * // Add data
 * plotData.push({ timestamp: Date.now(), value: 42 })
 *
 * // Use windowed data in plot
 * const plot = createGGTerm({
 *   data: plotData.windowedData(),
 *   aes: { x: 'timestamp', y: 'value' }
 * })
 * ```
 */
export function createPlotData(options: PlotDataOptions = {}): CreatePlotDataReturn {
  const {
    maxPoints,
    timeWindowMs,
    timeField = 'time',
    initialData = [],
  } = options

  // Core state
  const [data, setDataSignal] = createSignal<DataSource>(initialData)
  const [isDirty, setIsDirty] = createSignal(false)

  // Derived state
  const count = createMemo(() => data().length)

  // Windowed/filtered data
  const windowedData = createMemo(() => {
    let result = data()

    // Apply time window
    if (timeWindowMs && timeWindowMs > 0) {
      const cutoff = Date.now() - timeWindowMs
      result = result.filter((record: DataSource[number]) => {
        const timestamp = record[timeField]
        if (typeof timestamp === 'number') {
          return timestamp >= cutoff
        }
        if (timestamp instanceof Date) {
          return timestamp.getTime() >= cutoff
        }
        return true
      })
    }

    // Apply max points (keep most recent)
    if (maxPoints && maxPoints > 0 && result.length > maxPoints) {
      result = result.slice(-maxPoints)
    }

    return result
  })

  // Actions
  const setData = (newData: DataSource) => {
    batch(() => {
      setDataSignal(newData)
      setIsDirty(true)
    })
  }

  const push = (record: DataSource[number] | DataSource) => {
    batch(() => {
      setDataSignal((prev) => {
        const newRecords = Array.isArray(record) ? record : [record]
        let result = [...prev, ...newRecords]

        // Apply limits immediately on push for performance
        if (maxPoints && result.length > maxPoints * 1.5) {
          result = result.slice(-maxPoints)
        }

        return result
      })
      setIsDirty(true)
    })
  }

  const updateAt = (index: number, updates: Partial<DataSource[number]>) => {
    batch(() => {
      setDataSignal((prev) => {
        if (index < 0 || index >= prev.length) return prev
        const newData = [...prev]
        newData[index] = { ...newData[index], ...updates }
        return newData
      })
      setIsDirty(true)
    })
  }

  const removeWhere = (predicate: (record: DataSource[number]) => boolean) => {
    batch(() => {
      setDataSignal((prev) => prev.filter((record: DataSource[number]) => !predicate(record)))
      setIsDirty(true)
    })
  }

  const clear = () => {
    batch(() => {
      setDataSignal([])
      setIsDirty(true)
    })
  }

  const markClean = () => {
    setIsDirty(false)
  }

  const applyTimeWindow = () => {
    if (!timeWindowMs) return

    const cutoff = Date.now() - timeWindowMs
    setDataSignal((prev) =>
      prev.filter((record: DataSource[number]) => {
        const timestamp = record[timeField]
        if (typeof timestamp === 'number') {
          return timestamp >= cutoff
        }
        if (timestamp instanceof Date) {
          return timestamp.getTime() >= cutoff
        }
        return true
      })
    )
  }

  const applyMaxPoints = () => {
    if (!maxPoints) return

    setDataSignal((prev) => {
      if (prev.length <= maxPoints) return prev
      return prev.slice(-maxPoints)
    })
  }

  return {
    // State
    data,
    count,
    isDirty,
    windowedData,

    // Actions
    setData,
    push,
    updateAt,
    removeWhere,
    clear,
    markClean,
    applyTimeWindow,
    applyMaxPoints,
  }
}
