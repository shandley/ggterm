/**
 * createPlotInteraction - Solid.js primitive for plot interactivity
 *
 * Provides selection, hover, zoom/pan, and keyboard navigation.
 */

import { createSignal, createMemo, batch } from 'solid-js'
import type { Accessor } from 'solid-js'
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

export interface PlotInteractionOptions {
  /** Selection mode */
  selectionMode?: SelectionMode
  /** Enable zoom/pan */
  enableZoom?: boolean
  /** Enable keyboard navigation */
  enableKeyboard?: boolean
  /** Initial viewport */
  initialViewport?: Viewport
  /** Callback when selection changes */
  onSelectionChange?: (indices: number[]) => void
  /** Callback when viewport changes */
  onViewportChange?: (viewport: Viewport) => void
  /** Callback when brush selection ends */
  onBrushEnd?: (rect: BrushRect, indices: number[]) => void
}

export interface PlotInteractionState {
  /** Currently hovered point index (-1 if none) */
  hoveredIndex: Accessor<number>
  /** Selected point indices */
  selectedIndices: Accessor<number[]>
  /** Current viewport (zoom/pan state) */
  viewport: Accessor<Viewport | null>
  /** Current brush rectangle (during brush selection) */
  brush: Accessor<BrushRect | null>
  /** Whether plot is focused */
  isFocused: Accessor<boolean>
  /** Current selection mode */
  selectionMode: Accessor<SelectionMode>
}

export interface PlotInteractionActions {
  /** Set hovered index */
  setHovered: (index: number) => void
  /** Clear hover state */
  clearHover: () => void
  /** Select a point (respects selection mode) */
  select: (index: number) => void
  /** Toggle selection of a point */
  toggleSelect: (index: number) => void
  /** Set selected indices directly */
  setSelected: (indices: number[]) => void
  /** Clear all selections */
  clearSelection: () => void
  /** Set viewport */
  setViewport: (viewport: Viewport) => void
  /** Reset viewport to default */
  resetViewport: () => void
  /** Zoom in/out */
  zoom: (factor: number, centerX?: number, centerY?: number) => void
  /** Pan viewport */
  pan: (dx: number, dy: number) => void
  /** Start brush selection */
  startBrush: (x: number, y: number) => void
  /** Update brush selection */
  updateBrush: (x: number, y: number) => void
  /** End brush selection */
  endBrush: (data: DataSource, xField: string, yField: string) => number[]
  /** Cancel brush selection */
  cancelBrush: () => void
  /** Set focus state */
  setFocused: (focused: boolean) => void
  /** Set selection mode */
  setSelectionMode: (mode: SelectionMode) => void
  /** Handle keyboard event */
  handleKeyDown: (event: KeyboardEvent) => void
}

export interface CreatePlotInteractionReturn extends PlotInteractionState, PlotInteractionActions {}

/**
 * Creates a reactive interaction manager for plots
 *
 * @example
 * ```tsx
 * const interaction = createPlotInteraction({
 *   selectionMode: 'multiple',
 *   enableZoom: true,
 *   onSelectionChange: (indices) => console.log('Selected:', indices)
 * })
 *
 * // Handle click on point
 * interaction.select(5)
 *
 * // Zoom in
 * interaction.zoom(1.2)
 * ```
 */
export function createPlotInteraction(
  options: PlotInteractionOptions = {}
): CreatePlotInteractionReturn {
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
  const [hoveredIndex, setHoveredIndex] = createSignal(-1)
  const [selectedIndices, setSelectedIndicesSignal] = createSignal<number[]>([])
  const [viewport, setViewportSignal] = createSignal<Viewport | null>(initialViewport ?? null)
  const [brush, setBrush] = createSignal<BrushRect | null>(null)
  const [isFocused, setIsFocused] = createSignal(false)
  const [selectionMode, setSelectionModeSignal] = createSignal<SelectionMode>(initialMode)

  // Internal state for brush start
  let brushStart: { x: number; y: number } | null = null

  // Actions
  const setHovered = (index: number) => {
    setHoveredIndex(index)
  }

  const clearHover = () => {
    setHoveredIndex(-1)
  }

  const select = (index: number) => {
    const mode = selectionMode()
    if (mode === 'none') return

    batch(() => {
      if (mode === 'single') {
        setSelectedIndicesSignal([index])
      } else if (mode === 'multiple') {
        setSelectedIndicesSignal((prev) => {
          if (prev.includes(index)) return prev
          return [...prev, index]
        })
      }
    })

    onSelectionChange?.(selectedIndices())
  }

  const toggleSelect = (index: number) => {
    const mode = selectionMode()
    if (mode === 'none') return

    batch(() => {
      setSelectedIndicesSignal((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index)
        }
        if (mode === 'single') {
          return [index]
        }
        return [...prev, index]
      })
    })

    onSelectionChange?.(selectedIndices())
  }

  const setSelected = (indices: number[]) => {
    setSelectedIndicesSignal(indices)
    onSelectionChange?.(indices)
  }

  const clearSelection = () => {
    setSelectedIndicesSignal([])
    onSelectionChange?.([])
  }

  const setViewport = (newViewport: Viewport) => {
    setViewportSignal(newViewport)
    onViewportChange?.(newViewport)
  }

  const resetViewport = () => {
    setViewportSignal(initialViewport ?? null)
    if (initialViewport) {
      onViewportChange?.(initialViewport)
    }
  }

  const zoom = (factor: number, centerX?: number, centerY?: number) => {
    if (!enableZoom) return

    setViewportSignal((prev) => {
      if (!prev) return prev

      const cx = centerX ?? (prev.xMin + prev.xMax) / 2
      const cy = centerY ?? (prev.yMin + prev.yMax) / 2

      const xRange = prev.xMax - prev.xMin
      const yRange = prev.yMax - prev.yMin

      const newXRange = xRange / factor
      const newYRange = yRange / factor

      const newViewport: Viewport = {
        xMin: cx - newXRange / 2,
        xMax: cx + newXRange / 2,
        yMin: cy - newYRange / 2,
        yMax: cy + newYRange / 2,
      }

      onViewportChange?.(newViewport)
      return newViewport
    })
  }

  const pan = (dx: number, dy: number) => {
    if (!enableZoom) return

    setViewportSignal((prev) => {
      if (!prev) return prev

      const newViewport: Viewport = {
        xMin: prev.xMin + dx,
        xMax: prev.xMax + dx,
        yMin: prev.yMin + dy,
        yMax: prev.yMax + dy,
      }

      onViewportChange?.(newViewport)
      return newViewport
    })
  }

  const startBrush = (x: number, y: number) => {
    if (selectionMode() !== 'brush') return
    brushStart = { x, y }
    setBrush({ x1: x, y1: y, x2: x, y2: y })
  }

  const updateBrush = (x: number, y: number) => {
    if (!brushStart) return
    setBrush({
      x1: brushStart.x,
      y1: brushStart.y,
      x2: x,
      y2: y,
    })
  }

  const endBrush = (data: DataSource, xField: string, yField: string): number[] => {
    const currentBrush = brush()
    if (!currentBrush || !brushStart) {
      cancelBrush()
      return []
    }

    // Normalize brush rect
    const rect: BrushRect = {
      x1: Math.min(currentBrush.x1, currentBrush.x2),
      y1: Math.min(currentBrush.y1, currentBrush.y2),
      x2: Math.max(currentBrush.x1, currentBrush.x2),
      y2: Math.max(currentBrush.y1, currentBrush.y2),
    }

    // Find points within brush
    const indices: number[] = []
    data.forEach((record, index) => {
      const x = Number(record[xField])
      const y = Number(record[yField])
      if (!isNaN(x) && !isNaN(y)) {
        if (x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2) {
          indices.push(index)
        }
      }
    })

    // Update selection
    setSelectedIndicesSignal(indices)
    onSelectionChange?.(indices)
    onBrushEnd?.(rect, indices)

    // Clear brush
    brushStart = null
    setBrush(null)

    return indices
  }

  const cancelBrush = () => {
    brushStart = null
    setBrush(null)
  }

  const setFocused = (focused: boolean) => {
    setIsFocused(focused)
  }

  const setSelectionMode = (mode: SelectionMode) => {
    setSelectionModeSignal(mode)
    if (mode === 'none') {
      clearSelection()
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enableKeyboard || !isFocused()) return

    const vp = viewport()
    if (!vp) return

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
    // State
    hoveredIndex,
    selectedIndices,
    viewport,
    brush,
    isFocused,
    selectionMode,

    // Actions
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
    setFocused,
    setSelectionMode,
    handleKeyDown,
  }
}
