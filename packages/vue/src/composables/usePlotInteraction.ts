/**
 * usePlotInteraction - Vue composable for plot interactivity
 *
 * Provides selection, hover, zoom/pan, and keyboard navigation.
 */

import { ref, type Ref } from 'vue'
import type { DataSource } from '@ggterm/core'

export type SelectionMode = 'none' | 'single' | 'multiple' | 'brush'

export interface Viewport {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface BrushRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface UsePlotInteractionOptions {
  /** Selection mode */
  selectionMode?: SelectionMode
  /** Enable zoom */
  enableZoom?: boolean
  /** Enable keyboard */
  enableKeyboard?: boolean
  /** Initial viewport */
  initialViewport?: Viewport
  /** Selection change callback */
  onSelectionChange?: (indices: number[]) => void
  /** Viewport change callback */
  onViewportChange?: (viewport: Viewport) => void
  /** Brush end callback */
  onBrushEnd?: (rect: BrushRect, indices: number[]) => void
}

export interface UsePlotInteractionReturn {
  /** Hovered point index */
  hoveredIndex: Ref<number>
  /** Selected indices */
  selectedIndices: Ref<number[]>
  /** Current viewport */
  viewport: Ref<Viewport | null>
  /** Current brush rect */
  brush: Ref<BrushRect | null>
  /** Is focused */
  isFocused: Ref<boolean>
  /** Selection mode */
  selectionMode: Ref<SelectionMode>

  /** Set hovered index */
  setHovered: (index: number) => void
  /** Clear hover */
  clearHover: () => void
  /** Select point */
  select: (index: number) => void
  /** Toggle selection */
  toggleSelect: (index: number) => void
  /** Set selection */
  setSelected: (indices: number[]) => void
  /** Clear selection */
  clearSelection: () => void
  /** Set viewport */
  setViewport: (viewport: Viewport) => void
  /** Reset viewport */
  resetViewport: () => void
  /** Zoom */
  zoom: (factor: number, centerX?: number, centerY?: number) => void
  /** Pan */
  pan: (dx: number, dy: number) => void
  /** Start brush */
  startBrush: (x: number, y: number) => void
  /** Update brush */
  updateBrush: (x: number, y: number) => void
  /** End brush */
  endBrush: (data: DataSource, xField: string, yField: string) => number[]
  /** Cancel brush */
  cancelBrush: () => void
  /** Handle key down */
  handleKeyDown: (event: KeyboardEvent) => void
}

/**
 * Vue composable for reactive plot interaction
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePlotInteraction } from '@ggterm/vue'
 *
 * const {
 *   hoveredIndex,
 *   selectedIndices,
 *   select,
 *   toggleSelect,
 *   clearSelection
 * } = usePlotInteraction({
 *   selectionMode: 'multiple',
 *   onSelectionChange: (indices) => console.log('Selected:', indices)
 * })
 * </script>
 * ```
 */
export function usePlotInteraction(
  options: UsePlotInteractionOptions = {}
): UsePlotInteractionReturn {
  const {
    selectionMode: initialMode = 'single',
    enableZoom = true,
    enableKeyboard = true,
    initialViewport,
    onSelectionChange,
    onViewportChange,
    onBrushEnd,
  } = options

  // State
  const hoveredIndex = ref(-1)
  const selectedIndices = ref<number[]>([])
  const viewport = ref<Viewport | null>(initialViewport ?? null)
  const brush = ref<BrushRect | null>(null)
  const isFocused = ref(false)
  const selectionMode = ref<SelectionMode>(initialMode)

  // Brush state
  let brushStart: { x: number; y: number } | null = null

  // Actions
  const setHovered = (index: number) => {
    hoveredIndex.value = index
  }

  const clearHover = () => {
    hoveredIndex.value = -1
  }

  const select = (index: number) => {
    if (selectionMode.value === 'none') return

    if (selectionMode.value === 'single') {
      selectedIndices.value = [index]
    } else if (selectionMode.value === 'multiple') {
      if (!selectedIndices.value.includes(index)) {
        selectedIndices.value = [...selectedIndices.value, index]
      }
    }

    onSelectionChange?.(selectedIndices.value)
  }

  const toggleSelect = (index: number) => {
    if (selectionMode.value === 'none') return

    if (selectedIndices.value.includes(index)) {
      selectedIndices.value = selectedIndices.value.filter((i) => i !== index)
    } else if (selectionMode.value === 'single') {
      selectedIndices.value = [index]
    } else {
      selectedIndices.value = [...selectedIndices.value, index]
    }

    onSelectionChange?.(selectedIndices.value)
  }

  const setSelected = (indices: number[]) => {
    selectedIndices.value = indices
    onSelectionChange?.(indices)
  }

  const clearSelection = () => {
    selectedIndices.value = []
    onSelectionChange?.([])
  }

  const setViewport = (newViewport: Viewport) => {
    viewport.value = newViewport
    onViewportChange?.(newViewport)
  }

  const resetViewport = () => {
    viewport.value = initialViewport ?? null
    if (initialViewport) {
      onViewportChange?.(initialViewport)
    }
  }

  const zoom = (factor: number, centerX?: number, centerY?: number) => {
    if (!enableZoom || !viewport.value) return

    const vp = viewport.value
    const cx = centerX ?? (vp.xMin + vp.xMax) / 2
    const cy = centerY ?? (vp.yMin + vp.yMax) / 2

    const xRange = vp.xMax - vp.xMin
    const yRange = vp.yMax - vp.yMin

    const newXRange = xRange / factor
    const newYRange = yRange / factor

    const newViewport: Viewport = {
      xMin: cx - newXRange / 2,
      xMax: cx + newXRange / 2,
      yMin: cy - newYRange / 2,
      yMax: cy + newYRange / 2,
    }

    viewport.value = newViewport
    onViewportChange?.(newViewport)
  }

  const pan = (dx: number, dy: number) => {
    if (!enableZoom || !viewport.value) return

    const newViewport: Viewport = {
      xMin: viewport.value.xMin + dx,
      xMax: viewport.value.xMax + dx,
      yMin: viewport.value.yMin + dy,
      yMax: viewport.value.yMax + dy,
    }

    viewport.value = newViewport
    onViewportChange?.(newViewport)
  }

  const startBrush = (x: number, y: number) => {
    if (selectionMode.value !== 'brush') return
    brushStart = { x, y }
    brush.value = { x1: x, y1: y, x2: x, y2: y }
  }

  const updateBrush = (x: number, y: number) => {
    if (!brushStart) return
    brush.value = {
      x1: brushStart.x,
      y1: brushStart.y,
      x2: x,
      y2: y,
    }
  }

  const endBrush = (data: DataSource, xField: string, yField: string): number[] => {
    const currentBrush = brush.value
    if (!currentBrush || !brushStart) {
      cancelBrush()
      return []
    }

    const rect: BrushRect = {
      x1: Math.min(currentBrush.x1, currentBrush.x2),
      y1: Math.min(currentBrush.y1, currentBrush.y2),
      x2: Math.max(currentBrush.x1, currentBrush.x2),
      y2: Math.max(currentBrush.y1, currentBrush.y2),
    }

    const indices: number[] = []
    data.forEach((record: DataSource[number], index: number) => {
      const x = Number(record[xField])
      const y = Number(record[yField])
      if (!isNaN(x) && !isNaN(y)) {
        if (x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2) {
          indices.push(index)
        }
      }
    })

    selectedIndices.value = indices
    onSelectionChange?.(indices)
    onBrushEnd?.(rect, indices)

    brushStart = null
    brush.value = null

    return indices
  }

  const cancelBrush = () => {
    brushStart = null
    brush.value = null
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enableKeyboard || !isFocused.value || !viewport.value) return

    const vp = viewport.value
    const xStep = (vp.xMax - vp.xMin) * 0.1
    const yStep = (vp.yMax - vp.yMin) * 0.1

    switch (event.key) {
      case 'ArrowLeft':
        pan(-xStep, 0)
        event.preventDefault()
        break
      case 'ArrowRight':
        pan(xStep, 0)
        event.preventDefault()
        break
      case 'ArrowUp':
        pan(0, yStep)
        event.preventDefault()
        break
      case 'ArrowDown':
        pan(0, -yStep)
        event.preventDefault()
        break
      case '+':
      case '=':
        zoom(1.2)
        event.preventDefault()
        break
      case '-':
        zoom(0.8)
        event.preventDefault()
        break
      case '0':
        resetViewport()
        event.preventDefault()
        break
      case 'Escape':
        clearSelection()
        cancelBrush()
        event.preventDefault()
        break
    }
  }

  return {
    hoveredIndex,
    selectedIndices,
    viewport,
    brush,
    isFocused,
    selectionMode,

    setHovered,
    clearHover,
    select,
    toggleSelect,
    setSelected,
    clearSelection,
    setViewport,
    resetViewport,
    zoom,
    pan,
    startBrush,
    updateBrush,
    endBrush,
    cancelBrush,
    handleKeyDown,
  }
}
