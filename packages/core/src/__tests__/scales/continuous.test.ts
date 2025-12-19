/**
 * Tests for continuous scales
 */

import { describe, expect, it } from 'bun:test'
import {
  scale_x_continuous,
  scale_y_continuous,
  scale_x_log10,
  scale_y_log10,
  scale_x_sqrt,
  scale_y_sqrt,
  scale_x_reverse,
  scale_y_reverse,
} from '../../scales/continuous'

describe('scale_x_continuous', () => {
  it('should create a continuous x scale', () => {
    const scale = scale_x_continuous()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should map values with identity transform by default', () => {
    const scale = scale_x_continuous()
    expect(scale.map(10)).toBe(10)
    expect(scale.map(0)).toBe(0)
    expect(scale.map(-5)).toBe(-5)
    expect(scale.map(100.5)).toBe(100.5)
  })

  it('should handle string numbers', () => {
    const scale = scale_x_continuous()
    expect(scale.map('10')).toBe(10)
    expect(scale.map('3.14')).toBeCloseTo(3.14)
  })

  it('should return 0 for NaN values', () => {
    const scale = scale_x_continuous()
    expect(scale.map('not a number')).toBe(0)
    expect(scale.map(NaN)).toBe(0)
    expect(scale.map(undefined)).toBe(0)
  })

  it('should store domain/limits', () => {
    const scale = scale_x_continuous({ limits: [0, 100] })
    expect(scale.domain).toEqual([0, 100])
  })

  it('should invert identity transform', () => {
    const scale = scale_x_continuous()
    expect(scale.invert!(10)).toBe(10)
    expect(scale.invert!(0)).toBe(0)
  })
})

describe('scale_y_continuous', () => {
  it('should create a continuous y scale', () => {
    const scale = scale_y_continuous()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('y')
  })

  it('should map values with identity transform by default', () => {
    const scale = scale_y_continuous()
    expect(scale.map(25)).toBe(25)
  })
})

describe('scale_x_log10', () => {
  it('should create a log10 x scale', () => {
    const scale = scale_x_log10()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should map values with log10 transform', () => {
    const scale = scale_x_log10()
    expect(scale.map(10)).toBeCloseTo(1)
    expect(scale.map(100)).toBeCloseTo(2)
    expect(scale.map(1000)).toBeCloseTo(3)
    expect(scale.map(1)).toBeCloseTo(0)
  })

  it('should invert log10 transform', () => {
    const scale = scale_x_log10()
    expect(scale.invert!(1)).toBeCloseTo(10)
    expect(scale.invert!(2)).toBeCloseTo(100)
    expect(scale.invert!(0)).toBeCloseTo(1)
  })
})

describe('scale_y_log10', () => {
  it('should create a log10 y scale', () => {
    const scale = scale_y_log10()
    expect(scale.aesthetic).toBe('y')
    expect(scale.map(100)).toBeCloseTo(2)
  })
})

describe('scale_x_sqrt', () => {
  it('should create a sqrt x scale', () => {
    const scale = scale_x_sqrt()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should map values with sqrt transform', () => {
    const scale = scale_x_sqrt()
    expect(scale.map(4)).toBeCloseTo(2)
    expect(scale.map(9)).toBeCloseTo(3)
    expect(scale.map(16)).toBeCloseTo(4)
    expect(scale.map(0)).toBeCloseTo(0)
  })

  it('should invert sqrt transform', () => {
    const scale = scale_x_sqrt()
    expect(scale.invert!(2)).toBeCloseTo(4)
    expect(scale.invert!(3)).toBeCloseTo(9)
    expect(scale.invert!(0)).toBeCloseTo(0)
  })
})

describe('scale_y_sqrt', () => {
  it('should create a sqrt y scale', () => {
    const scale = scale_y_sqrt()
    expect(scale.aesthetic).toBe('y')
    expect(scale.map(25)).toBeCloseTo(5)
  })
})

describe('scale_x_reverse', () => {
  it('should create a reversed x scale', () => {
    const scale = scale_x_reverse()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should map values with reverse transform', () => {
    const scale = scale_x_reverse()
    expect(scale.map(10)).toBe(-10)
    expect(scale.map(-5)).toBe(5)
    expect(scale.map(0)).toBe(-0) // -0 is expected from negating 0
  })

  it('should invert reverse transform', () => {
    const scale = scale_x_reverse()
    expect(scale.invert!(-10)).toBe(10)
    expect(scale.invert!(5)).toBe(-5)
  })
})

describe('scale_y_reverse', () => {
  it('should create a reversed y scale', () => {
    const scale = scale_y_reverse()
    expect(scale.aesthetic).toBe('y')
    expect(scale.map(10)).toBe(-10)
  })
})

describe('scale options', () => {
  it('should accept limits option', () => {
    const scale = scale_x_continuous({ limits: [0, 100] })
    expect(scale.domain).toEqual([0, 100])
  })

  it('should accept limits with log10 scale', () => {
    const scale = scale_x_log10({ limits: [1, 1000] })
    expect(scale.domain).toEqual([1, 1000])
  })

  it('should accept limits with sqrt scale', () => {
    const scale = scale_x_sqrt({ limits: [0, 100] })
    expect(scale.domain).toEqual([0, 100])
  })
})
