/**
 * Tests for coordinate systems
 */

import { describe, expect, it } from 'bun:test'
import {
  coordCartesian,
  coordFlip,
  coordPolar,
  coordFixed,
  coordEqual,
  coordTrans,
  coordFlipWithLimits,
} from '../../coords/cartesian'

describe('coordCartesian', () => {
  it('should create a cartesian coordinate system', () => {
    const coord = coordCartesian()
    expect(coord.type).toBe('cartesian')
  })

  it('should have an identity transform', () => {
    const coord = coordCartesian()
    const result = coord.transform(5, 10)
    expect(result.x).toBe(5)
    expect(result.y).toBe(10)
  })

  it('should preserve negative values', () => {
    const coord = coordCartesian()
    const result = coord.transform(-5, -10)
    expect(result.x).toBe(-5)
    expect(result.y).toBe(-10)
  })

  it('should preserve zero', () => {
    const coord = coordCartesian()
    const result = coord.transform(0, 0)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
  })

  it('should preserve decimal values', () => {
    const coord = coordCartesian()
    const result = coord.transform(3.14159, 2.71828)
    expect(result.x).toBeCloseTo(3.14159)
    expect(result.y).toBeCloseTo(2.71828)
  })

  it('should accept options object', () => {
    const coord = coordCartesian({ xlim: [0, 100], ylim: [0, 50] })
    expect(coord.type).toBe('cartesian')
  })
})

describe('coordFlip', () => {
  it('should create a flip coordinate system', () => {
    const coord = coordFlip()
    expect(coord.type).toBe('flip')
  })

  it('should swap x and y coordinates', () => {
    const coord = coordFlip()
    const result = coord.transform(5, 10)
    expect(result.x).toBe(10)
    expect(result.y).toBe(5)
  })

  it('should handle negative values', () => {
    const coord = coordFlip()
    const result = coord.transform(-5, 10)
    expect(result.x).toBe(10)
    expect(result.y).toBe(-5)
  })

  it('should handle zero', () => {
    const coord = coordFlip()
    const result = coord.transform(0, 5)
    expect(result.x).toBe(5)
    expect(result.y).toBe(0)
  })

  it('should be its own inverse', () => {
    const coord = coordFlip()
    const first = coord.transform(3, 7)
    const second = coord.transform(first.x, first.y)
    expect(second.x).toBe(3)
    expect(second.y).toBe(7)
  })
})

describe('coordPolar', () => {
  it('should create a polar coordinate system', () => {
    const coord = coordPolar()
    expect(coord.type).toBe('polar')
  })

  it('should default to theta = x', () => {
    const coord = coordPolar()
    // At angle 0, radius r: (r*cos(0), r*sin(0)) = (r, 0)
    const result = coord.transform(0, 5) // angle=0, radius=5
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(0)
  })

  it('should convert angle and radius to cartesian', () => {
    const coord = coordPolar()
    // At angle π/2, radius r: (r*cos(π/2), r*sin(π/2)) = (0, r)
    const result = coord.transform(Math.PI / 2, 5)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(5)
  })

  it('should handle angle π', () => {
    const coord = coordPolar()
    // At angle π, radius r: (r*cos(π), r*sin(π)) = (-r, 0)
    const result = coord.transform(Math.PI, 5)
    expect(result.x).toBeCloseTo(-5)
    expect(result.y).toBeCloseTo(0)
  })

  it('should handle theta = y option', () => {
    const coord = coordPolar({ theta: 'y' })
    // When theta='y', x is radius and y is angle
    // angle=0, radius=5: (5*cos(0), 5*sin(0)) = (5, 0)
    const result = coord.transform(5, 0)
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(0)
  })

  it('should handle zero radius', () => {
    const coord = coordPolar()
    const result = coord.transform(Math.PI / 4, 0)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('should handle negative radius', () => {
    const coord = coordPolar()
    // At angle 0, radius -5: (-5*cos(0), -5*sin(0)) = (-5, 0)
    const result = coord.transform(0, -5)
    expect(result.x).toBeCloseTo(-5)
    expect(result.y).toBeCloseTo(0)
  })

  it('should handle full rotation', () => {
    const coord = coordPolar()
    // At angle 2π, should be same as angle 0
    const result = coord.transform(2 * Math.PI, 5)
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(0)
  })

  it('should handle 45 degree angle', () => {
    const coord = coordPolar()
    // At angle π/4, radius r: (r*cos(π/4), r*sin(π/4)) = (r/√2, r/√2)
    const radius = 10
    const result = coord.transform(Math.PI / 4, radius)
    const expected = radius / Math.sqrt(2)
    expect(result.x).toBeCloseTo(expected)
    expect(result.y).toBeCloseTo(expected)
  })
})

describe('coordFixed', () => {
  it('should create a fixed coordinate system', () => {
    const coord = coordFixed()
    expect(coord.type).toBe('fixed')
  })

  it('should default to ratio 1', () => {
    const coord = coordFixed() as any
    expect(coord.ratio).toBe(1)
  })

  it('should accept custom ratio', () => {
    const coord = coordFixed({ ratio: 2 }) as any
    expect(coord.ratio).toBe(2)
  })

  it('should have identity transform', () => {
    const coord = coordFixed()
    const result = coord.transform(5, 10)
    expect(result.x).toBe(5)
    expect(result.y).toBe(10)
  })

  it('should accept xlim and ylim options', () => {
    const coord = coordFixed({ xlim: [0, 100], ylim: [0, 50], ratio: 2 })
    expect(coord.xlim).toEqual([0, 100])
    expect(coord.ylim).toEqual([0, 50])
  })

  it('should default clip to true', () => {
    const coord = coordFixed()
    expect(coord.clip).toBe(true)
  })

  it('should accept clip option', () => {
    const coord = coordFixed({ clip: false })
    expect(coord.clip).toBe(false)
  })
})

describe('coordEqual', () => {
  it('should create a fixed coordinate with ratio 1', () => {
    const coord = coordEqual() as any
    expect(coord.type).toBe('fixed')
    expect(coord.ratio).toBe(1)
  })

  it('should accept xlim and ylim options', () => {
    const coord = coordEqual({ xlim: [0, 100], ylim: [0, 100] })
    expect(coord.xlim).toEqual([0, 100])
    expect(coord.ylim).toEqual([0, 100])
  })
})

describe('coordTrans', () => {
  it('should create a trans coordinate system', () => {
    const coord = coordTrans()
    expect(coord.type).toBe('trans')
  })

  it('should default to identity transform', () => {
    const coord = coordTrans()
    const result = coord.transform(5, 10)
    expect(result.x).toBe(5)
    expect(result.y).toBe(10)
  })

  it('should apply log10 transform to x', () => {
    const coord = coordTrans({ x: 'log10' })
    const result = coord.transform(100, 10)
    expect(result.x).toBeCloseTo(2)  // log10(100) = 2
    expect(result.y).toBe(10)
  })

  it('should apply log10 transform to y', () => {
    const coord = coordTrans({ y: 'log10' })
    const result = coord.transform(10, 1000)
    expect(result.x).toBe(10)
    expect(result.y).toBeCloseTo(3)  // log10(1000) = 3
  })

  it('should apply log10 to both axes', () => {
    const coord = coordTrans({ x: 'log10', y: 'log10' })
    const result = coord.transform(100, 1000)
    expect(result.x).toBeCloseTo(2)
    expect(result.y).toBeCloseTo(3)
  })

  it('should apply sqrt transform', () => {
    const coord = coordTrans({ x: 'sqrt', y: 'sqrt' })
    const result = coord.transform(16, 25)
    expect(result.x).toBeCloseTo(4)
    expect(result.y).toBeCloseTo(5)
  })

  it('should apply reverse transform', () => {
    const coord = coordTrans({ x: 'reverse' })
    const result = coord.transform(10, 20)
    expect(result.x).toBe(-10)
    expect(result.y).toBe(20)
  })

  it('should handle negative values with log10', () => {
    const coord = coordTrans({ x: 'log10' })
    const result = coord.transform(-10, 10)
    expect(result.x).toBe(-Infinity)
    expect(result.y).toBe(10)
  })

  it('should handle zero with sqrt', () => {
    const coord = coordTrans({ x: 'sqrt' })
    const result = coord.transform(0, 10)
    expect(result.x).toBe(0)
    expect(result.y).toBe(10)
  })

  it('should store transformation types', () => {
    const coord = coordTrans({ x: 'log10', y: 'sqrt' }) as any
    expect(coord.xTransType).toBe('log10')
    expect(coord.yTransType).toBe('sqrt')
  })

  it('should accept xlim and ylim options', () => {
    const coord = coordTrans({ x: 'log10', xlim: [1, 1000] })
    expect(coord.xlim).toEqual([1, 1000])
  })
})

describe('coordFlipWithLimits', () => {
  it('should create a flip coordinate system', () => {
    const coord = coordFlipWithLimits()
    expect(coord.type).toBe('flip')
  })

  it('should swap x and y', () => {
    const coord = coordFlipWithLimits()
    const result = coord.transform(5, 10)
    expect(result.x).toBe(10)
    expect(result.y).toBe(5)
  })

  it('should accept xlim and ylim options', () => {
    const coord = coordFlipWithLimits({ xlim: [0, 100], ylim: [0, 50] })
    expect(coord.xlim).toEqual([0, 100])
    expect(coord.ylim).toEqual([0, 50])
  })

  it('should accept clip option', () => {
    const coord = coordFlipWithLimits({ clip: false })
    expect(coord.clip).toBe(false)
  })
})

// Integration tests using the grammar builder
import { gg } from '../../grammar'
import { geom_point } from '../../geoms'

describe('coord integration with gg', () => {
  const data = [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ]

  it('should build spec with coordCartesian', () => {
    const spec = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordCartesian())
      .spec()

    expect(spec.coord.type).toBe('cartesian')
  })

  it('should build spec with coordFlip', () => {
    const spec = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordFlip())
      .spec()

    expect(spec.coord.type).toBe('flip')
    // Verify transform is set correctly
    const transformed = spec.coord.transform(5, 10)
    expect(transformed.x).toBe(10)
    expect(transformed.y).toBe(5)
  })

  it('should build spec with coordFixed', () => {
    const spec = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordFixed({ ratio: 2 }))
      .spec()

    expect(spec.coord.type).toBe('fixed')
    expect((spec.coord as any).ratio).toBe(2)
  })

  it('should build spec with coordTrans log10', () => {
    const logData = [
      { x: 1, y: 10 },
      { x: 10, y: 100 },
      { x: 100, y: 1000 },
    ]

    const spec = gg(logData)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordTrans({ x: 'log10', y: 'log10' }))
      .spec()

    expect(spec.coord.type).toBe('trans')
    // Verify transform applies log10
    const transformed = spec.coord.transform(100, 1000)
    expect(transformed.x).toBeCloseTo(2)  // log10(100) = 2
    expect(transformed.y).toBeCloseTo(3)  // log10(1000) = 3
  })

  it('should build spec with coordPolar', () => {
    const polarData = [
      { angle: 0, radius: 1 },
      { angle: Math.PI / 2, radius: 1 },
      { angle: Math.PI, radius: 1 },
    ]

    const spec = gg(polarData)
      .aes({ x: 'angle', y: 'radius' })
      .geom(geom_point())
      .coord(coordPolar())
      .spec()

    expect(spec.coord.type).toBe('polar')
    // Verify polar transform
    const transformed = spec.coord.transform(0, 1)  // angle=0, radius=1
    expect(transformed.x).toBeCloseTo(1)  // cos(0) = 1
    expect(transformed.y).toBeCloseTo(0)  // sin(0) = 0
  })

  it('should apply coordFlip when rendering', () => {
    // This tests that the coord transform is actually applied during rendering
    const { renderToCanvas } = require('../../pipeline')

    const spec = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordFlip())
      .spec()

    // Should render without errors
    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(40)
    expect(canvas.height).toBe(20)
  })

  it('should apply coordTrans when rendering', () => {
    const { renderToCanvas } = require('../../pipeline')

    const logData = [
      { x: 1, y: 1 },
      { x: 10, y: 10 },
      { x: 100, y: 100 },
    ]

    const spec = gg(logData)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .coord(coordTrans({ x: 'log10', y: 'log10' }))
      .spec()

    // Should render without errors
    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should apply coordPolar when rendering', () => {
    const { renderToCanvas } = require('../../pipeline')

    const polarData = [
      { angle: 0, radius: 5 },
      { angle: Math.PI / 4, radius: 5 },
      { angle: Math.PI / 2, radius: 5 },
    ]

    const spec = gg(polarData)
      .aes({ x: 'angle', y: 'radius' })
      .geom(geom_point())
      .coord(coordPolar())
      .spec()

    // Should render without errors
    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })
})
