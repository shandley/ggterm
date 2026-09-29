/**
 * Tests for secondary y-axis (y2) support
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_line, geom_point } from '@ggterm/spec/geoms'
import { renderToCanvas, calculateLayout, buildScaleContext } from '../../pipeline'
import {
  scale_y2_continuous,
  scale_y2_log10,
  scale_y2_sqrt,
  scale_y2_reverse,
} from '../../scales'

describe('Secondary Y-Axis (y2)', () => {
  // Sample data with two y variables at different scales
  const dualAxisData = [
    { x: 1, temperature: 20, humidity: 65 },
    { x: 2, temperature: 22, humidity: 60 },
    { x: 3, temperature: 25, humidity: 55 },
    { x: 4, temperature: 23, humidity: 58 },
    { x: 5, temperature: 21, humidity: 62 },
  ]

  describe('scale_y2_continuous', () => {
    it('should create a y2 scale with correct aesthetic', () => {
      const scale = scale_y2_continuous()
      expect(scale.aesthetic).toBe('y2')
      expect(scale.type).toBe('continuous')
    })

    it('should accept limits option', () => {
      const scale = scale_y2_continuous({ limits: [0, 100] })
      expect(scale.domain).toEqual([0, 100])
    })

    it('should accept breaks option', () => {
      const scale = scale_y2_continuous({ breaks: [0, 25, 50, 75, 100] })
      expect(scale.breaks).toEqual([0, 25, 50, 75, 100])
    })

    it('should accept labels option', () => {
      const scale = scale_y2_continuous({ labels: ['low', 'medium', 'high'] })
      expect(scale.labels).toEqual(['low', 'medium', 'high'])
    })
  })

  describe('scale_y2_log10', () => {
    it('should create a y2 log10 scale', () => {
      const scale = scale_y2_log10()
      expect(scale.aesthetic).toBe('y2')
      expect(scale.trans).toBe('log10')
    })

    it('should apply log10 transform', () => {
      const scale = scale_y2_log10()
      expect(scale.map(100)).toBeCloseTo(2)
      expect(scale.map(1000)).toBeCloseTo(3)
    })
  })

  describe('scale_y2_sqrt', () => {
    it('should create a y2 sqrt scale', () => {
      const scale = scale_y2_sqrt()
      expect(scale.aesthetic).toBe('y2')
      expect(scale.trans).toBe('sqrt')
    })

    it('should apply sqrt transform', () => {
      const scale = scale_y2_sqrt()
      expect(scale.map(4)).toBeCloseTo(2)
      expect(scale.map(9)).toBeCloseTo(3)
    })
  })

  describe('scale_y2_reverse', () => {
    it('should create a y2 reverse scale', () => {
      const scale = scale_y2_reverse()
      expect(scale.aesthetic).toBe('y2')
      expect(scale.trans).toBe('reverse')
    })

    it('should apply reverse transform', () => {
      const scale = scale_y2_reverse()
      expect(scale.map(10)).toBe(-10)
      expect(scale.map(-5)).toBe(5)
    })
  })

  describe('calculateLayout with y2', () => {
    it('should add right margin when y2 is present', () => {
      const specWithY2 = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_point())
        .spec()

      const layout = calculateLayout(specWithY2, { width: 80, height: 24 })

      // Should have right margin for y2 axis
      expect(layout.margins.right).toBeGreaterThan(1)
    })

    it('should add extra right margin when y2 label is present', () => {
      const specWithY2Label = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_point())
        .labs({ y2: 'Humidity (%)' })
        .spec()

      const specWithY2NoLabel = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_point())
        .spec()

      const layoutWithLabel = calculateLayout(specWithY2Label, { width: 80, height: 24 })
      const layoutNoLabel = calculateLayout(specWithY2NoLabel, { width: 80, height: 24 })

      expect(layoutWithLabel.margins.right).toBeGreaterThan(layoutNoLabel.margins.right)
    })

    it('should prioritize legend over y2 axis for right margin', () => {
      const specWithLegend = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', color: 'x' })
        .geom(geom_point())
        .spec()

      const specWithY2 = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_point())
        .spec()

      const layoutLegend = calculateLayout(specWithLegend, { width: 80, height: 24 })
      const layoutY2 = calculateLayout(specWithY2, { width: 80, height: 24 })

      // Legend should take priority (larger margin)
      expect(layoutLegend.margins.right).toBeGreaterThanOrEqual(layoutY2.margins.right)
    })
  })

  describe('buildScaleContext with y2', () => {
    it('should create y2 scale when aes.y2 is present', () => {
      const plotArea = { x: 10, y: 2, width: 60, height: 18 }
      const aes = { x: 'x', y: 'temperature', y2: 'humidity' }

      const scales = buildScaleContext(dualAxisData, aes, plotArea, [])

      expect(scales.y2).toBeDefined()
      expect(scales.y2!.type).toBe('continuous')
    })

    it('should use y2 field for domain calculation', () => {
      const plotArea = { x: 10, y: 2, width: 60, height: 18 }
      const aes = { x: 'x', y: 'temperature', y2: 'humidity' }

      const scales = buildScaleContext(dualAxisData, aes, plotArea, [])

      // y2 domain should be based on humidity (55-65)
      const y2Domain = scales.y2!.domain as [number, number]
      expect(y2Domain[0]).toBeLessThanOrEqual(55)
      expect(y2Domain[1]).toBeGreaterThanOrEqual(65)
    })

    it('should respect custom y2 scale options', () => {
      const plotArea = { x: 10, y: 2, width: 60, height: 18 }
      const aes = { x: 'x', y: 'temperature', y2: 'humidity' }
      const userScales = [scale_y2_continuous({ limits: [0, 100] })]

      const scales = buildScaleContext(dualAxisData, aes, plotArea, userScales)

      const y2Domain = scales.y2!.domain as [number, number]
      expect(y2Domain).toEqual([0, 100])
    })

    it('should apply transforms to y2 scale', () => {
      const plotArea = { x: 10, y: 2, width: 60, height: 18 }
      const aes = { x: 'x', y: 'temperature', y2: 'humidity' }
      const userScales = [scale_y2_sqrt()]

      const scales = buildScaleContext(dualAxisData, aes, plotArea, userScales)

      // Scale should have sqrt transform applied
      expect(scales.y2).toBeDefined()
    })
  })

  describe('rendering with y2', () => {
    it('should render plot with dual y-axes', () => {
      const spec = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_line())
        .labs({ y: 'Temperature (°C)', y2: 'Humidity (%)' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 80, height: 24 })

      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(80)
      expect(canvas.height).toBe(24)
    })

    it('should render right axis ticks', () => {
      const spec = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .geom(geom_point())
        .spec()

      const canvas = renderToCanvas(spec, { width: 80, height: 24 })
      const output = canvas.toString()

      // The output should contain axis elements
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with different scales for y and y2', () => {
      // Data with very different magnitudes
      const multiScaleData = [
        { x: 1, small: 0.1, large: 1000 },
        { x: 2, small: 0.2, large: 2000 },
        { x: 3, small: 0.3, large: 3000 },
        { x: 4, small: 0.4, large: 4000 },
        { x: 5, small: 0.5, large: 5000 },
      ]

      const spec = gg(multiScaleData)
        .aes({ x: 'x', y: 'small', y2: 'large' })
        .geom(geom_line())
        .spec()

      const canvas = renderToCanvas(spec, { width: 80, height: 24 })
      expect(canvas).toBeDefined()
    })
  })

  describe('integration with plot builder', () => {
    it('should support y2 in aes()', () => {
      const plot = gg(dualAxisData).aes({ x: 'x', y: 'temperature', y2: 'humidity' })

      expect(plot.spec().aes.y2).toBe('humidity')
    })

    it('should support y2 in labs()', () => {
      const plot = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .labs({ y2: 'Humidity' })

      expect(plot.spec().labels.y2).toBe('Humidity')
    })

    it('should support y2 scale in scale()', () => {
      const plot = gg(dualAxisData)
        .aes({ x: 'x', y: 'temperature', y2: 'humidity' })
        .scale(scale_y2_continuous({ limits: [0, 100] }))

      const scales = plot.spec().scales
      const y2Scale = scales.find(s => s.aesthetic === 'y2')
      expect(y2Scale).toBeDefined()
      expect(y2Scale!.domain).toEqual([0, 100])
    })
  })
})
