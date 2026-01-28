/**
 * usePlotData - Vue composable for reactive plot data management
 *
 * Provides data manipulation with windowing, limiting, and filtering.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { DataSource } from '@ggterm/core'

export interface UsePlotDataOptions {
  /** Maximum number of points */
  maxPoints?: number
  /** Time window in milliseconds */
  timeWindowMs?: number
  /** Time field name */
  timeField?: string
  /** Initial data */
  initialData?: DataSource
}

export interface UsePlotDataReturn {
  /** All data */
  data: Ref<DataSource>
  /** Windowed/filtered data */
  windowed: ComputedRef<DataSource>
  /** Point count */
  count: ComputedRef<number>
  /** Is dirty flag */
  isDirty: Ref<boolean>

  /** Set all data */
  set: (data: DataSource) => void
  /** Push record(s) */
  push: (record: DataSource[number] | DataSource) => void
  /** Update record at index */
  updateAt: (index: number, updates: Partial<DataSource[number]>) => void
  /** Remove matching records */
  removeWhere: (predicate: (record: DataSource[number]) => boolean) => void
  /** Clear all data */
  clear: () => void
  /** Mark as clean */
  markClean: () => void
  /** Apply time window filter */
  applyTimeWindow: () => void
  /** Apply max points limit */
  applyMaxPoints: () => void
}

/**
 * Vue composable for reactive data management with windowing
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePlotData } from '@ggterm/vue'
 *
 * const { data, windowed, push, count } = usePlotData({
 *   maxPoints: 100,
 *   timeWindowMs: 60000
 * })
 *
 * // Stream data
 * setInterval(() => {
 *   push({ time: Date.now(), value: Math.random() })
 * }, 100)
 * </script>
 *
 * <template>
 *   <p>Points: {{ count }}</p>
 * </template>
 * ```
 */
export function usePlotData(options: UsePlotDataOptions = {}): UsePlotDataReturn {
  const {
    maxPoints,
    timeWindowMs,
    timeField = 'time',
    initialData = [],
  } = options

  // Core state
  const data = ref<DataSource>(initialData)
  const isDirty = ref(false)

  // Derived state
  const count = computed(() => data.value.length)

  // Windowed data
  const windowed = computed(() => {
    let result = data.value

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

    // Apply max points
    if (maxPoints && maxPoints > 0 && result.length > maxPoints) {
      result = result.slice(-maxPoints)
    }

    return result
  })

  // Actions
  const set = (newData: DataSource) => {
    data.value = newData
    isDirty.value = true
  }

  const push = (record: DataSource[number] | DataSource) => {
    const newRecords = Array.isArray(record) ? record : [record]
    let result = [...data.value, ...newRecords]

    // Apply limits on push for performance
    if (maxPoints && result.length > maxPoints * 1.5) {
      result = result.slice(-maxPoints)
    }

    data.value = result
    isDirty.value = true
  }

  const updateAt = (index: number, updates: Partial<DataSource[number]>) => {
    if (index < 0 || index >= data.value.length) return

    const newData = [...data.value]
    newData[index] = { ...newData[index], ...updates }
    data.value = newData
    isDirty.value = true
  }

  const removeWhere = (predicate: (record: DataSource[number]) => boolean) => {
    data.value = data.value.filter((record: DataSource[number]) => !predicate(record))
    isDirty.value = true
  }

  const clear = () => {
    data.value = []
    isDirty.value = true
  }

  const markClean = () => {
    isDirty.value = false
  }

  const applyTimeWindow = () => {
    if (!timeWindowMs) return

    const cutoff = Date.now() - timeWindowMs
    data.value = data.value.filter((record: DataSource[number]) => {
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

  const applyMaxPoints = () => {
    if (!maxPoints || data.value.length <= maxPoints) return
    data.value = data.value.slice(-maxPoints)
  }

  return {
    data,
    windowed,
    count,
    isDirty,

    set,
    push,
    updateAt,
    removeWhere,
    clear,
    markClean,
    applyTimeWindow,
    applyMaxPoints,
  }
}
