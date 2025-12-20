/**
 * Tests for usePlotData hook
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
import { usePlotData } from '../hooks/usePlotData'

interface TestData {
  x: number
  y: number
  time?: number
  category?: string
}

describe('usePlotData', () => {
  beforeEach(() => {
    resetMockState()
  })

  describe('initialization', () => {
    it('should create with empty initial data', () => {
      const result = usePlotData<TestData>()

      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
    })

    it('should create with provided initial data', () => {
      const initialData: TestData[] = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]
      const result = usePlotData<TestData>(initialData)

      expect(result.data).toEqual(initialData)
      expect(result.count).toBe(2)
    })

    it('should start with isDirty as false', () => {
      const result = usePlotData<TestData>()

      expect(result.isDirty).toBe(false)
    })
  })

  describe('setData', () => {
    it('should have setData method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.setData).toBe('function')
    })
  })

  describe('pushData', () => {
    it('should have pushData method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.pushData).toBe('function')
    })
  })

  describe('updateAt', () => {
    it('should have updateAt method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.updateAt).toBe('function')
    })
  })

  describe('removeWhere', () => {
    it('should have removeWhere method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.removeWhere).toBe('function')
    })
  })

  describe('clearData', () => {
    it('should have clearData method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.clearData).toBe('function')
    })
  })

  describe('markClean', () => {
    it('should have markClean method', () => {
      const result = usePlotData<TestData>()

      expect(typeof result.markClean).toBe('function')
    })
  })

  describe('filter', () => {
    it('should filter data without mutating', () => {
      const initialData: TestData[] = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ]
      const result = usePlotData<TestData>(initialData)

      const filtered = result.filter((item) => item.x > 1)

      expect(filtered).toEqual([
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ])
      // Original data unchanged
      expect(result.data).toEqual(initialData)
    })

    it('should return empty array when no matches', () => {
      const initialData: TestData[] = [{ x: 1, y: 10 }]
      const result = usePlotData<TestData>(initialData)

      const filtered = result.filter((item) => item.x > 100)

      expect(filtered).toEqual([])
    })
  })

  describe('map', () => {
    it('should transform data without mutating', () => {
      const initialData: TestData[] = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]
      const result = usePlotData<TestData>(initialData)

      const mapped = result.map((item) => ({
        x: item.x * 2,
        y: item.y * 2,
      }))

      expect(mapped).toEqual([
        { x: 2, y: 20 },
        { x: 4, y: 40 },
      ])
      // Original data unchanged
      expect(result.data).toEqual(initialData)
    })

    it('should allow changing structure', () => {
      const initialData: TestData[] = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]
      const result = usePlotData<TestData>(initialData)

      const mapped = result.map((item) => ({
        sum: item.x + item.y,
        product: item.x * item.y,
      }))

      expect(mapped).toEqual([
        { sum: 11, product: 10 },
        { sum: 22, product: 40 },
      ])
    })
  })

  describe('getStats', () => {
    it('should compute statistics for numeric field', () => {
      const initialData: TestData[] = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
        { x: 4, y: 40 },
      ]
      const result = usePlotData<TestData>(initialData)

      const stats = result.getStats('y')

      expect(stats).not.toBeNull()
      expect(stats!.min).toBe(10)
      expect(stats!.max).toBe(40)
      expect(stats!.mean).toBe(25)
      expect(stats!.count).toBe(4)
    })

    it('should return null for empty data', () => {
      const result = usePlotData<TestData>([])

      const stats = result.getStats('x')

      expect(stats).toBeNull()
    })

    it('should skip non-numeric values', () => {
      const data = [
        { x: 1, y: 10, category: 'A' },
        { x: 2, y: 20, category: 'B' },
      ] as TestData[]
      const result = usePlotData<TestData>(data)

      // Getting stats on x field (numeric)
      const stats = result.getStats('x')

      expect(stats).not.toBeNull()
      expect(stats!.count).toBe(2)
    })

    it('should handle NaN values', () => {
      const data: TestData[] = [
        { x: 1, y: 10 },
        { x: NaN, y: 20 },
        { x: 3, y: 30 },
      ]
      const result = usePlotData<TestData>(data)

      const stats = result.getStats('x')

      expect(stats).not.toBeNull()
      expect(stats!.count).toBe(2) // NaN excluded
    })
  })

  describe('windowing options', () => {
    it('should accept maxPoints option', () => {
      const result = usePlotData<TestData>([], { maxPoints: 100 })

      expect(result).toBeDefined()
    })

    it('should accept maxAge option', () => {
      const result = usePlotData<TestData>([], {
        maxAge: 5000,
        timeField: 'time',
      })

      expect(result).toBeDefined()
    })

    it('should accept timeField option', () => {
      const result = usePlotData<TestData>([], {
        timeField: 'time',
      })

      expect(result).toBeDefined()
    })
  })
})

describe('usePlotData interface', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should return all required properties', () => {
    const result = usePlotData<TestData>()

    expect('data' in result).toBe(true)
    expect('count' in result).toBe(true)
    expect('isDirty' in result).toBe(true)
    expect('setData' in result).toBe(true)
    expect('pushData' in result).toBe(true)
    expect('updateAt' in result).toBe(true)
    expect('removeWhere' in result).toBe(true)
    expect('clearData' in result).toBe(true)
    expect('markClean' in result).toBe(true)
    expect('filter' in result).toBe(true)
    expect('map' in result).toBe(true)
    expect('getStats' in result).toBe(true)
  })

  it('should have correct property types', () => {
    const result = usePlotData<TestData>()

    expect(Array.isArray(result.data)).toBe(true)
    expect(typeof result.count).toBe('number')
    expect(typeof result.isDirty).toBe('boolean')
    expect(typeof result.setData).toBe('function')
    expect(typeof result.pushData).toBe('function')
    expect(typeof result.updateAt).toBe('function')
    expect(typeof result.removeWhere).toBe('function')
    expect(typeof result.clearData).toBe('function')
    expect(typeof result.markClean).toBe('function')
    expect(typeof result.filter).toBe('function')
    expect(typeof result.map).toBe('function')
    expect(typeof result.getStats).toBe('function')
  })
})

describe('usePlotData computed count', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('should reflect data length', () => {
    const data: TestData[] = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]
    const result = usePlotData<TestData>(data)

    expect(result.count).toBe(3)
  })

  it('should be 0 for empty data', () => {
    const result = usePlotData<TestData>([])

    expect(result.count).toBe(0)
  })
})
