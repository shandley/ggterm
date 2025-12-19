/**
 * Tests for grammar.ts - GGPlot class and gg() function
 */

import { describe, expect, it } from 'bun:test'
import { gg, GGPlot } from '../grammar'
import { geom_point } from '../geoms/point'
import { geom_line } from '../geoms/line'
import { scale_x_continuous, scale_y_continuous } from '../scales/continuous'
import { coordCartesian } from '../coords/cartesian'

describe('gg()', () => {
  it('should create a new GGPlot instance', () => {
    const plot = gg([])
    expect(plot).toBeInstanceOf(GGPlot)
  })

  it('should create a plot with empty data by default', () => {
    const plot = gg()
    expect(plot.data).toEqual([])
  })

  it('should create a plot with provided data', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ]
    const plot = gg(data)
    expect(plot.data).toEqual(data)
  })
})

describe('GGPlot', () => {
  describe('aes()', () => {
    it('should set aesthetic mappings', () => {
      const plot = gg([]).aes({ x: 'x', y: 'y' })
      const spec = plot.spec()
      expect(spec.aes.x).toBe('x')
      expect(spec.aes.y).toBe('y')
    })

    it('should merge aesthetic mappings', () => {
      const plot = gg([])
        .aes({ x: 'a' })
        .aes({ y: 'b' })
      const spec = plot.spec()
      expect(spec.aes.x).toBe('a')
      expect(spec.aes.y).toBe('b')
    })

    it('should override aesthetic mappings', () => {
      const plot = gg([])
        .aes({ x: 'a', y: 'b' })
        .aes({ x: 'c' })
      const spec = plot.spec()
      expect(spec.aes.x).toBe('c')
      expect(spec.aes.y).toBe('b')
    })

    it('should support color aesthetic', () => {
      const plot = gg([]).aes({ x: 'x', y: 'y', color: 'group' })
      const spec = plot.spec()
      expect(spec.aes.color).toBe('group')
    })

    it('should support size aesthetic', () => {
      const plot = gg([]).aes({ x: 'x', y: 'y', size: 'value' })
      const spec = plot.spec()
      expect(spec.aes.size).toBe('value')
    })
  })

  describe('geom()', () => {
    it('should add a geometry layer', () => {
      const plot = gg([]).geom(geom_point())
      expect(plot.geoms).toHaveLength(1)
      expect(plot.geoms[0].type).toBe('point')
    })

    it('should add multiple geometry layers', () => {
      const plot = gg([])
        .geom(geom_point())
        .geom(geom_line())
      expect(plot.geoms).toHaveLength(2)
      expect(plot.geoms[0].type).toBe('point')
      expect(plot.geoms[1].type).toBe('line')
    })
  })

  describe('scale()', () => {
    it('should add a scale', () => {
      const plot = gg([]).scale(scale_x_continuous())
      const spec = plot.spec()
      expect(spec.scales).toHaveLength(1)
      expect(spec.scales[0].aesthetic).toBe('x')
    })

    it('should replace existing scale for same aesthetic', () => {
      const scale1 = scale_x_continuous({ limits: [0, 100] })
      const scale2 = scale_x_continuous({ limits: [0, 50] })

      const plot = gg([])
        .scale(scale1)
        .scale(scale2)

      const spec = plot.spec()
      expect(spec.scales).toHaveLength(1)
      expect(spec.scales[0].domain).toEqual([0, 50])
    })

    it('should allow multiple scales for different aesthetics', () => {
      const plot = gg([])
        .scale(scale_x_continuous())
        .scale(scale_y_continuous())

      const spec = plot.spec()
      expect(spec.scales).toHaveLength(2)
    })
  })

  describe('coord()', () => {
    it('should set coordinate system', () => {
      const coord = coordCartesian()
      const plot = gg([]).coord(coord)
      const spec = plot.spec()
      expect(spec.coord).toBe(coord)
    })
  })

  describe('theme()', () => {
    it('should merge theme settings', () => {
      const plot = gg([]).theme({ background: { r: 0, g: 0, b: 0, a: 1 } })
      const spec = plot.spec()
      expect(spec.theme.background).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    })
  })

  describe('labs()', () => {
    it('should set plot labels', () => {
      const plot = gg([]).labs({ title: 'My Plot', x: 'X Axis', y: 'Y Axis' })
      const spec = plot.spec()
      expect(spec.labels.title).toBe('My Plot')
      expect(spec.labels.x).toBe('X Axis')
      expect(spec.labels.y).toBe('Y Axis')
    })

    it('should merge labels', () => {
      const plot = gg([])
        .labs({ title: 'First' })
        .labs({ x: 'X Label' })
      const spec = plot.spec()
      expect(spec.labels.title).toBe('First')
      expect(spec.labels.x).toBe('X Label')
    })
  })

  describe('push()', () => {
    it('should add a single record to data', () => {
      const plot = gg([{ x: 1, y: 10 }])
      plot.push({ x: 2, y: 20 })
      expect(plot.data).toHaveLength(2)
      expect(plot.data[1]).toEqual({ x: 2, y: 20 })
    })

    it('should add multiple records to data', () => {
      const plot = gg([{ x: 1, y: 10 }])
      plot.push([{ x: 2, y: 20 }, { x: 3, y: 30 }])
      expect(plot.data).toHaveLength(3)
    })

    it('should return this for chaining', () => {
      const plot = gg([])
      const result = plot.push({ x: 1, y: 10 })
      expect(result).toBe(plot)
    })
  })

  describe('spec()', () => {
    it('should return complete plot specification', () => {
      const data = [{ x: 1, y: 10 }]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({ title: 'Test' })

      const spec = plot.spec()

      expect(spec.data).toBe(data)
      expect(spec.aes).toEqual({ x: 'x', y: 'y' })
      expect(spec.geoms).toHaveLength(1)
      expect(spec.labels.title).toBe('Test')
      expect(spec.theme).toBeDefined()
      expect(spec.coord).toBeDefined()
    })
  })

  describe('fluent API chaining', () => {
    it('should allow full chain of methods', () => {
      const plot = gg([{ x: 1, y: 10, group: 'A' }])
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_point())
        .geom(geom_line())
        .scale(scale_x_continuous())
        .scale(scale_y_continuous())
        .labs({ title: 'Test Plot', x: 'X', y: 'Y' })
        .theme({ background: { r: 0, g: 0, b: 0, a: 1 } })

      const spec = plot.spec()

      expect(spec.data).toHaveLength(1)
      expect(spec.aes.color).toBe('group')
      expect(spec.geoms).toHaveLength(2)
      expect(spec.scales).toHaveLength(2)
      expect(spec.labels.title).toBe('Test Plot')
    })
  })

  describe('render()', () => {
    it('should render empty plot without error', () => {
      const plot = gg([])
        .aes({ x: 'x', y: 'y' })

      const output = plot.render({ width: 40, height: 10 })
      expect(typeof output).toBe('string')
    })

    it('should render plot with data', () => {
      const data = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const output = plot.render({ width: 40, height: 10 })
      expect(typeof output).toBe('string')
      expect(output.length).toBeGreaterThan(0)
    })
  })
})
