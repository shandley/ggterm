/**
 * Tests for position adjustments
 */

import { describe, expect, it } from 'bun:test'
import {
  position_identity,
  position_dodge,
  position_stack,
  position_fill,
  position_jitter,
  applyPositionAdjustment,
  isStackPosition,
  isDodgePosition,
  getPositionType,
} from '../../positions'

describe('position_identity', () => {
  it('should create identity position', () => {
    const pos = position_identity()
    expect(pos.type).toBe('identity')
  })

  it('should not modify data', () => {
    const data = [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
    ]
    const aes = { x: 'x', y: 'y' }
    const result = applyPositionAdjustment(data, aes, position_identity())

    expect(result).toHaveLength(2)
    expect(result[0].x).toBe(0) // 'A' becomes 0 because it's not a number
    expect(result[0].y).toBe(10)
    expect(result[1].y).toBe(20)
  })
})

describe('position_dodge', () => {
  it('should create dodge position with defaults', () => {
    const pos = position_dodge()
    expect(pos.type).toBe('dodge')
    expect(pos.width).toBe(0.9)
  })

  it('should accept custom width', () => {
    const pos = position_dodge({ width: 0.7 })
    expect(pos.width).toBe(0.7)
  })

  it('should offset groups side by side', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 15, group: 'B' },
      { x: 2, y: 20, group: 'A' },
      { x: 2, y: 25, group: 'B' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_dodge())

    expect(result).toHaveLength(4)

    // Points at x=1 should have different adjusted x values
    const x1Points = result.filter(p => p.xOriginal === 1)
    expect(x1Points[0].x).not.toBe(x1Points[1].x)

    // Y values should be unchanged
    expect(result[0].y).toBe(10)
    expect(result[1].y).toBe(15)
  })

  it('should preserve original values in xOriginal/yOriginal', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 15, group: 'B' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_dodge())

    for (const point of result) {
      expect(point.xOriginal).toBe(1)
    }
  })
})

describe('position_stack', () => {
  it('should create stack position', () => {
    const pos = position_stack()
    expect(pos.type).toBe('stack')
  })

  it('should stack values on top of each other', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 20, group: 'B' },
      { x: 1, y: 15, group: 'C' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_stack())

    expect(result).toHaveLength(3)

    // First bar: 0 to 10
    expect(result[0].ymin).toBe(0)
    expect(result[0].ymax).toBe(10)

    // Second bar: 10 to 30
    expect(result[1].ymin).toBe(10)
    expect(result[1].ymax).toBe(30)

    // Third bar: 30 to 45
    expect(result[2].ymin).toBe(30)
    expect(result[2].ymax).toBe(45)
  })

  it('should stack different x values independently', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 20, group: 'B' },
      { x: 2, y: 5, group: 'A' },
      { x: 2, y: 15, group: 'B' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_stack())

    // x=1 group
    const x1 = result.filter(p => p.xOriginal === 1)
    expect(x1[0].ymin).toBe(0)
    expect(x1[0].ymax).toBe(10)
    expect(x1[1].ymin).toBe(10)
    expect(x1[1].ymax).toBe(30)

    // x=2 group
    const x2 = result.filter(p => p.xOriginal === 2)
    expect(x2[0].ymin).toBe(0)
    expect(x2[0].ymax).toBe(5)
    expect(x2[1].ymin).toBe(5)
    expect(x2[1].ymax).toBe(20)
  })
})

describe('position_fill', () => {
  it('should create fill position', () => {
    const pos = position_fill()
    expect(pos.type).toBe('fill')
  })

  it('should normalize to 100%', () => {
    const data = [
      { x: 1, y: 25, group: 'A' },
      { x: 1, y: 75, group: 'B' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_fill())

    expect(result).toHaveLength(2)

    // First bar: 0 to 0.25 (25%)
    expect(result[0].ymin).toBe(0)
    expect(result[0].ymax).toBeCloseTo(0.25)

    // Second bar: 0.25 to 1.0 (75%)
    expect(result[1].ymin).toBeCloseTo(0.25)
    expect(result[1].ymax).toBeCloseTo(1.0)
  })

  it('should handle equal values', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 10, group: 'B' },
      { x: 1, y: 10, group: 'C' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }
    const result = applyPositionAdjustment(data, aes, position_fill())

    // Each should be ~33.3%
    expect(result[0].ymax).toBeCloseTo(1/3)
    expect(result[1].ymax).toBeCloseTo(2/3)
    expect(result[2].ymax).toBeCloseTo(1.0)
  })
})

describe('position_jitter', () => {
  it('should create jitter position with defaults', () => {
    const pos = position_jitter()
    expect(pos.type).toBe('jitter')
    expect(pos.width).toBe(0.4)
    expect(pos.height).toBe(0.4)
  })

  it('should accept custom width and height', () => {
    const pos = position_jitter({ width: 0.2, height: 0.1 })
    expect(pos.width).toBe(0.2)
    expect(pos.height).toBe(0.1)
  })

  it('should add random offset to points', () => {
    const data = [
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ]
    const aes = { x: 'x', y: 'y' }
    const result = applyPositionAdjustment(data, aes, position_jitter())

    // Points should be different from original
    let hasJitter = false
    for (const point of result) {
      if (point.x !== point.xOriginal || point.y !== point.yOriginal) {
        hasJitter = true
      }
    }
    expect(hasJitter).toBe(true)
  })

  it('should preserve original values', () => {
    const data = [
      { x: 5, y: 10 },
    ]
    const aes = { x: 'x', y: 'y' }
    const result = applyPositionAdjustment(data, aes, position_jitter())

    expect(result[0].xOriginal).toBe(5)
    expect(result[0].yOriginal).toBe(10)
  })

  it('should produce reproducible results with seed', () => {
    const data = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]
    const aes = { x: 'x', y: 'y' }

    const result1 = applyPositionAdjustment(data, aes, position_jitter({ seed: 42 }))
    const result2 = applyPositionAdjustment(data, aes, position_jitter({ seed: 42 }))

    expect(result1[0].x).toBe(result2[0].x)
    expect(result1[0].y).toBe(result2[0].y)
  })
})

describe('position utility functions', () => {
  describe('isStackPosition', () => {
    it('should return true for stack', () => {
      expect(isStackPosition('stack')).toBe(true)
      expect(isStackPosition(position_stack())).toBe(true)
    })

    it('should return true for fill', () => {
      expect(isStackPosition('fill')).toBe(true)
      expect(isStackPosition(position_fill())).toBe(true)
    })

    it('should return false for other positions', () => {
      expect(isStackPosition('identity')).toBe(false)
      expect(isStackPosition('dodge')).toBe(false)
      expect(isStackPosition(position_dodge())).toBe(false)
    })
  })

  describe('isDodgePosition', () => {
    it('should return true for dodge', () => {
      expect(isDodgePosition('dodge')).toBe(true)
      expect(isDodgePosition(position_dodge())).toBe(true)
    })

    it('should return false for other positions', () => {
      expect(isDodgePosition('identity')).toBe(false)
      expect(isDodgePosition('stack')).toBe(false)
    })
  })

  describe('getPositionType', () => {
    it('should extract type from Position object', () => {
      expect(getPositionType(position_dodge())).toBe('dodge')
      expect(getPositionType(position_stack())).toBe('stack')
      expect(getPositionType(position_jitter())).toBe('jitter')
    })

    it('should return string as-is', () => {
      expect(getPositionType('identity')).toBe('identity')
      expect(getPositionType('dodge')).toBe('dodge')
    })

    it('should return identity for undefined', () => {
      expect(getPositionType(undefined)).toBe('identity')
    })
  })
})

describe('applyPositionAdjustment with string positions', () => {
  it('should accept string position types', () => {
    const data = [
      { x: 1, y: 10, group: 'A' },
      { x: 1, y: 20, group: 'B' },
    ]
    const aes = { x: 'x', y: 'y', fill: 'group' }

    // String 'stack'
    const stackResult = applyPositionAdjustment(data, aes, 'stack')
    expect(stackResult[0].ymin).toBe(0)
    expect(stackResult[1].ymin).toBe(10)

    // String 'dodge'
    const dodgeResult = applyPositionAdjustment(data, aes, 'dodge')
    expect(dodgeResult[0].x).not.toBe(dodgeResult[1].x)
  })
})

// Integration tests with geoms
import { gg } from '../../grammar'
import { geom_bar, geom_col, geom_point } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('position integration with geoms', () => {
  it('should render stacked bar chart', () => {
    const data = [
      { category: 'A', value: 10, group: 'X' },
      { category: 'A', value: 20, group: 'Y' },
      { category: 'B', value: 15, group: 'X' },
      { category: 'B', value: 25, group: 'Y' },
    ]

    const spec = gg(data)
      .aes({ x: 'category', y: 'value', fill: 'group' })
      .geom(geom_col({ position: 'stack' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render dodged bar chart', () => {
    const data = [
      { category: 'A', value: 10, group: 'X' },
      { category: 'A', value: 20, group: 'Y' },
      { category: 'B', value: 15, group: 'X' },
      { category: 'B', value: 25, group: 'Y' },
    ]

    const spec = gg(data)
      .aes({ x: 'category', y: 'value', fill: 'group' })
      .geom(geom_col({ position: 'dodge' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render filled bar chart', () => {
    const data = [
      { category: 'A', value: 10, group: 'X' },
      { category: 'A', value: 20, group: 'Y' },
      { category: 'B', value: 15, group: 'X' },
      { category: 'B', value: 25, group: 'Y' },
    ]

    const spec = gg(data)
      .aes({ x: 'category', y: 'value', fill: 'group' })
      .geom(geom_col({ position: 'fill' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render jittered points', () => {
    const data = [
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 2 },
    ]

    const spec = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point({ position: 'jitter' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should accept Position objects in geom options', () => {
    const data = [
      { category: 'A', value: 10, group: 'X' },
      { category: 'A', value: 20, group: 'Y' },
    ]

    const spec = gg(data)
      .aes({ x: 'category', y: 'value', fill: 'group' })
      .geom(geom_col({ position: position_dodge({ width: 0.7 }) }))
      .spec()

    expect(spec.geoms[0].position).toEqual({ type: 'dodge', width: 0.7, preserve: 'total' })
  })
})
