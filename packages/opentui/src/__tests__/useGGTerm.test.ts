/**
 * Tests for useGGTerm hook
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

// Mock @ggterm/core before importing hooks
mock.module('@ggterm/core', () => ({
  gg: (data: unknown[]) => ({
    aes: () => ({ geom: () => ({ coord: () => ({ facet: () => ({ theme: () => ({ labs: () => ({ spec: () => ({}) }) }) }) }) }) }),
    spec: () => ({}),
  }),
  renderToString: () => '',
  // Type exports
  AestheticMapping: {},
  Coord: {},
  DataSource: {},
  Facet: {},
  Geom: {},
  Labels: {},
  Scale: {},
  Theme: {},
}))

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
import { useGGTerm } from '../hooks/useGGTerm'

// Mock geom factories for testing (we just need something that returns a valid geom structure)
const mockGeom = (type: string) => ({
  type,
  stat: 'identity' as const,
  params: {},
})
const geom_point = () => mockGeom('point')
const geom_line = () => mockGeom('line')

describe('useGGTerm', () => {
  beforeEach(() => {
    resetMockState()
  })

  describe('initialization', () => {
    it('should create with required aes option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result).toBeDefined()
      expect(result.rendered).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.isRendering).toBeDefined()
      expect(result.lastRenderTime).toBeDefined()
      expect(result.renderCount).toBeDefined()
    })

    it('should have setData method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.setData).toBe('function')
    })

    it('should have pushData method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.pushData).toBe('function')
    })

    it('should have clearData method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.clearData).toBe('function')
    })

    it('should have setOptions method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.setOptions).toBe('function')
    })

    it('should have refresh method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.refresh).toBe('function')
    })

    it('should have getOptions method', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(typeof result.getOptions).toBe('function')
    })

    it('should initialize with empty data by default', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result.data).toEqual([])
    })

    it('should initialize with initial data when provided', () => {
      const initialData = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        initialData,
      })

      expect(result.data).toEqual(initialData)
    })

    it('should start with isRendering as false', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result.isRendering).toBe(false)
    })

    it('should start with renderCount as 0', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result.renderCount).toBe(0)
    })

    it('should start with lastRenderTime as null', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result.lastRenderTime).toBeNull()
    })

    it('should start with empty rendered string', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
      })

      expect(result.rendered).toBe('')
    })
  })

  describe('options', () => {
    it('should accept geoms option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      expect(result).toBeDefined()
    })

    it('should accept multiple geoms', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point(), geom_line()],
      })

      expect(result).toBeDefined()
    })

    it('should accept width option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        width: 100,
      })

      const options = result.getOptions()
      expect(options.width).toBe(100)
    })

    it('should accept height option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        height: 30,
      })

      const options = result.getOptions()
      expect(options.height).toBe(30)
    })

    it('should accept labs option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        labs: { title: 'Test Plot', x: 'X Axis', y: 'Y Axis' },
      })

      const options = result.getOptions()
      expect(options.labs?.title).toBe('Test Plot')
    })

    it('should accept autoRender option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        autoRender: false,
      })

      const options = result.getOptions()
      expect(options.autoRender).toBe(false)
    })

    it('should accept debounceMs option', () => {
      const result = useGGTerm({
        aes: { x: 'x', y: 'y' },
        debounceMs: 100,
      })

      const options = result.getOptions()
      expect(options.debounceMs).toBe(100)
    })
  })

  describe('getOptions', () => {
    it('should return current options', () => {
      const result = useGGTerm({
        aes: { x: 'time', y: 'value' },
        width: 80,
        height: 25,
      })

      const options = result.getOptions()
      expect(options.aes.x).toBe('time')
      expect(options.aes.y).toBe('value')
      expect(options.width).toBe(80)
      expect(options.height).toBe(25)
    })
  })
})

describe('useGGTerm interface', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should return all required properties', () => {
    const result = useGGTerm({
      aes: { x: 'x', y: 'y' },
    })

    // Check all properties exist
    expect('rendered' in result).toBe(true)
    expect('data' in result).toBe(true)
    expect('isRendering' in result).toBe(true)
    expect('lastRenderTime' in result).toBe(true)
    expect('renderCount' in result).toBe(true)
    expect('setData' in result).toBe(true)
    expect('pushData' in result).toBe(true)
    expect('clearData' in result).toBe(true)
    expect('setOptions' in result).toBe(true)
    expect('refresh' in result).toBe(true)
    expect('getOptions' in result).toBe(true)
  })

  it('should have correct property types', () => {
    const result = useGGTerm({
      aes: { x: 'x', y: 'y' },
    })

    expect(typeof result.rendered).toBe('string')
    expect(Array.isArray(result.data)).toBe(true)
    expect(typeof result.isRendering).toBe('boolean')
    expect(typeof result.renderCount).toBe('number')
  })
})
