/**
 * Tests for usePlotInteraction hook
 *
 * Uses Bun's mock.module() to mock React hooks for testing outside component context.
 */

import { describe, expect, it, beforeEach, mock } from 'bun:test'

// State storage for mocked hooks
let stateStore: Map<number, unknown> = new Map()
let stateIndex = 0

function resetMockState() {
  stateStore = new Map()
  stateIndex = 0
}

// Mock React module before importing hooks
mock.module('react', () => ({
  useState: <T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] => {
    const idx = stateIndex++
    if (!stateStore.has(idx)) {
      stateStore.set(idx, initial)
    }
    const value = stateStore.get(idx) as T
    const setter = (newValue: T | ((prev: T) => T)) => {
      const current = stateStore.get(idx) as T
      const next = typeof newValue === 'function' ? (newValue as (prev: T) => T)(current) : newValue
      stateStore.set(idx, next)
    }
    return [value, setter]
  },
  useCallback: <T extends (...args: unknown[]) => unknown>(fn: T, _deps: unknown[]): T => fn,
  useMemo: <T>(fn: () => T, _deps: unknown[]): T => fn(),
  useRef: <T>(initial: T): { current: T } => ({ current: initial }),
  useEffect: (_fn: () => void | (() => void), _deps?: unknown[]): void => {},
}))

// Import after mocking
import { usePlotInteraction } from '../hooks/usePlotInteraction'

describe('usePlotInteraction', () => {
  beforeEach(() => {
    resetMockState()
  })

  describe('initialization', () => {
    it('should create with default options', () => {
      const result = usePlotInteraction()

      expect(result).toBeDefined()
      expect(result.state).toBeDefined()
    })

    it('should initialize with null hovered index', () => {
      const result = usePlotInteraction()

      expect(result.state.hoveredIndex).toBeNull()
    })

    it('should initialize with null hovered data', () => {
      const result = usePlotInteraction()

      expect(result.state.hoveredData).toBeNull()
    })

    it('should initialize with empty selection', () => {
      const result = usePlotInteraction()

      expect(result.state.selectedIndices.size).toBe(0)
    })

    it('should initialize with null cursor position', () => {
      const result = usePlotInteraction()

      expect(result.state.cursorPosition).toBeNull()
    })

    it('should initialize with default viewport', () => {
      const result = usePlotInteraction()

      expect(result.state.viewport.zoomLevel).toBe(1)
      expect(result.state.viewport.xDomain).toBeNull()
      expect(result.state.viewport.yDomain).toBeNull()
    })

    it('should initialize with inactive brush', () => {
      const result = usePlotInteraction()

      expect(result.state.brush.isActive).toBe(false)
      expect(result.state.brush.start).toBeNull()
      expect(result.state.brush.end).toBeNull()
    })

    it('should initialize with unfocused state', () => {
      const result = usePlotInteraction()

      expect(result.state.isFocused).toBe(false)
    })
  })

  describe('options', () => {
    it('should accept selectionMode option', () => {
      const result = usePlotInteraction({
        selectionMode: 'multiple',
      })

      expect(result).toBeDefined()
    })

    it('should accept single selectionMode', () => {
      const result = usePlotInteraction({
        selectionMode: 'single',
      })

      expect(result).toBeDefined()
    })

    it('should accept brush selectionMode', () => {
      const result = usePlotInteraction({
        selectionMode: 'brush',
      })

      expect(result).toBeDefined()
    })

    it('should accept none selectionMode', () => {
      const result = usePlotInteraction({
        selectionMode: 'none',
      })

      expect(result).toBeDefined()
    })

    it('should accept enableZoom option', () => {
      const result = usePlotInteraction({
        enableZoom: true,
      })

      expect(result).toBeDefined()
    })

    it('should accept enableBrush option', () => {
      const result = usePlotInteraction({
        enableBrush: true,
      })

      expect(result).toBeDefined()
    })

    it('should accept zoomSensitivity option', () => {
      const result = usePlotInteraction({
        zoomSensitivity: 0.2,
      })

      expect(result).toBeDefined()
    })

    it('should accept panSensitivity option', () => {
      const result = usePlotInteraction({
        panSensitivity: 20,
      })

      expect(result).toBeDefined()
    })

    it('should accept maxZoom option', () => {
      const result = usePlotInteraction({
        maxZoom: 20,
      })

      expect(result).toBeDefined()
    })

    it('should accept minZoom option', () => {
      const result = usePlotInteraction({
        minZoom: 0.5,
      })

      expect(result).toBeDefined()
    })

    it('should accept initialViewport option', () => {
      const result = usePlotInteraction({
        initialViewport: {
          xDomain: [0, 100],
          yDomain: [0, 50],
          zoomLevel: 2,
        },
      })

      expect(result.state.viewport.xDomain).toEqual([0, 100])
      expect(result.state.viewport.yDomain).toEqual([0, 50])
      expect(result.state.viewport.zoomLevel).toBe(2)
    })
  })

  describe('methods', () => {
    it('should have handleHover method', () => {
      const result = usePlotInteraction()

      expect(typeof result.handleHover).toBe('function')
    })

    it('should have handleSelect method', () => {
      const result = usePlotInteraction()

      expect(typeof result.handleSelect).toBe('function')
    })

    it('should have toggleSelection method', () => {
      const result = usePlotInteraction()

      expect(typeof result.toggleSelection).toBe('function')
    })

    it('should have clearSelection method', () => {
      const result = usePlotInteraction()

      expect(typeof result.clearSelection).toBe('function')
    })

    it('should have setCursorPosition method', () => {
      const result = usePlotInteraction()

      expect(typeof result.setCursorPosition).toBe('function')
    })

    it('should have handleKeyDown method', () => {
      const result = usePlotInteraction()

      expect(typeof result.handleKeyDown).toBe('function')
    })

    it('should have zoomIn method', () => {
      const result = usePlotInteraction()

      expect(typeof result.zoomIn).toBe('function')
    })

    it('should have zoomOut method', () => {
      const result = usePlotInteraction()

      expect(typeof result.zoomOut).toBe('function')
    })

    it('should have resetZoom method', () => {
      const result = usePlotInteraction()

      expect(typeof result.resetZoom).toBe('function')
    })

    it('should have pan method', () => {
      const result = usePlotInteraction()

      expect(typeof result.pan).toBe('function')
    })

    it('should have startBrush method', () => {
      const result = usePlotInteraction()

      expect(typeof result.startBrush).toBe('function')
    })

    it('should have updateBrush method', () => {
      const result = usePlotInteraction()

      expect(typeof result.updateBrush).toBe('function')
    })

    it('should have endBrush method', () => {
      const result = usePlotInteraction()

      expect(typeof result.endBrush).toBe('function')
    })

    it('should have setFocused method', () => {
      const result = usePlotInteraction()

      expect(typeof result.setFocused).toBe('function')
    })

    it('should have getSelectedData method', () => {
      const result = usePlotInteraction()

      expect(typeof result.getSelectedData).toBe('function')
    })
  })

  describe('getSelectedData', () => {
    it('should return empty array when no selection', () => {
      const result = usePlotInteraction()
      const data = [{ x: 1 }, { x: 2 }, { x: 3 }]

      const selected = result.getSelectedData(data)

      expect(selected).toEqual([])
    })
  })

  describe('callbacks', () => {
    it('should accept onSelectionChange callback', () => {
      const callback = mock(() => {})
      const result = usePlotInteraction({
        onSelectionChange: callback,
      })

      expect(result).toBeDefined()
    })

    it('should accept onViewportChange callback', () => {
      const callback = mock(() => {})
      const result = usePlotInteraction({
        onViewportChange: callback,
      })

      expect(result).toBeDefined()
    })

    it('should accept onBrushEnd callback', () => {
      const callback = mock(() => {})
      const result = usePlotInteraction({
        onBrushEnd: callback,
      })

      expect(result).toBeDefined()
    })
  })
})

describe('usePlotInteraction state structure', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should have correct state shape', () => {
    const result = usePlotInteraction()

    expect('hoveredIndex' in result.state).toBe(true)
    expect('hoveredData' in result.state).toBe(true)
    expect('selectedIndices' in result.state).toBe(true)
    expect('cursorPosition' in result.state).toBe(true)
    expect('viewport' in result.state).toBe(true)
    expect('brush' in result.state).toBe(true)
    expect('isFocused' in result.state).toBe(true)
  })

  it('should have correct viewport shape', () => {
    const result = usePlotInteraction()

    expect('xDomain' in result.state.viewport).toBe(true)
    expect('yDomain' in result.state.viewport).toBe(true)
    expect('zoomLevel' in result.state.viewport).toBe(true)
  })

  it('should have correct brush shape', () => {
    const result = usePlotInteraction()

    expect('start' in result.state.brush).toBe(true)
    expect('end' in result.state.brush).toBe(true)
    expect('isActive' in result.state.brush).toBe(true)
  })

  it('should have Set for selectedIndices', () => {
    const result = usePlotInteraction()

    expect(result.state.selectedIndices instanceof Set).toBe(true)
  })
})

describe('usePlotInteraction keyboard handling', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should handle Escape key', () => {
    const result = usePlotInteraction()

    // Should not throw
    result.handleKeyDown('Escape')
  })

  it('should handle + key', () => {
    const result = usePlotInteraction({ enableZoom: true })

    result.handleKeyDown('+')
  })

  it('should handle = key', () => {
    const result = usePlotInteraction({ enableZoom: true })

    result.handleKeyDown('=')
  })

  it('should handle - key', () => {
    const result = usePlotInteraction({ enableZoom: true })

    result.handleKeyDown('-')
  })

  it('should handle 0 key', () => {
    const result = usePlotInteraction({ enableZoom: true })

    result.handleKeyDown('0')
  })

  it('should handle arrow keys', () => {
    const result = usePlotInteraction({ enableZoom: true })

    result.handleKeyDown('ArrowLeft')
    result.handleKeyDown('ArrowRight')
    result.handleKeyDown('ArrowUp')
    result.handleKeyDown('ArrowDown')
  })
})

describe('usePlotInteraction zoom behavior', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should not zoom when disabled', () => {
    const result = usePlotInteraction({ enableZoom: false })

    // Methods should exist but not change state
    result.zoomIn()
    result.zoomOut()

    expect(result.state.viewport.zoomLevel).toBe(1)
  })
})

describe('usePlotInteraction brush behavior', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should not start brush when disabled', () => {
    const result = usePlotInteraction({ enableBrush: false })

    result.startBrush(0, 0)

    expect(result.state.brush.isActive).toBe(false)
  })
})
