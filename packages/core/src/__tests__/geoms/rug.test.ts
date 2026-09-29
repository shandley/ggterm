/**
 * Tests for geom_rug
 */

import { describe, expect, it } from 'bun:test'
import { geom_rug } from '@ggterm/spec/geoms/rug'
import { gg } from '../../grammar'
import { geom_point } from '@ggterm/spec/geoms'
import { renderToCanvas } from '../../pipeline'

describe('geom_rug', () => {
  describe('geom creation', () => {
    it('should create rug geom with defaults', () => {
      const geom = geom_rug()
      expect(geom.type).toBe('rug')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
    })

    it('should have default sides of bl (bottom and left)', () => {
      const geom = geom_rug()
      expect(geom.params.sides).toBe('bl')
    })

    it('should have default length of 1', () => {
      const geom = geom_rug()
      expect(geom.params.length).toBe(1)
    })

    it('should have default alpha of 1', () => {
      const geom = geom_rug()
      expect(geom.params.alpha).toBe(1)
    })

    it('should have default outside of true', () => {
      const geom = geom_rug()
      expect(geom.params.outside).toBe(true)
    })

    it('should accept sides option', () => {
      const geom = geom_rug({ sides: 'bltr' })
      expect(geom.params.sides).toBe('bltr')
    })

    it('should accept length option', () => {
      const geom = geom_rug({ length: 2 })
      expect(geom.params.length).toBe(2)
    })

    it('should accept alpha option', () => {
      const geom = geom_rug({ alpha: 0.5 })
      expect(geom.params.alpha).toBe(0.5)
    })

    it('should accept color option', () => {
      const geom = geom_rug({ color: '#ff0000' })
      expect(geom.params.color).toBe('#ff0000')
    })

    it('should accept outside option', () => {
      const geom = geom_rug({ outside: false })
      expect(geom.params.outside).toBe(false)
    })
  })

  describe('rendering', () => {
    const scatterData = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 15 },
      { x: 4, y: 25 },
      { x: 5, y: 18 },
    ]

    it('should render rug with default sides (bottom and left)', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(40)
      expect(canvas.height).toBe(15)
    })

    it('should render rug on all four sides', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'bltr' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug only on bottom', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'b' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug only on left', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'l' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug only on top', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 't' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug only on right', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'r' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug with custom length', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ length: 2 }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug with custom color', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ color: '#ff6600' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug inside plot area', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ outside: false }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('with scatter plot', () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 4, y: 5 },
      { x: 5, y: 4 },
    ]

    it('should render rug under scatter points', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_rug())
        .spec()

      expect(spec.geoms).toHaveLength(2)
      expect(spec.geoms[0].type).toBe('point')
      expect(spec.geoms[1].type).toBe('rug')

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render rug with colored points', () => {
      const coloredData = [
        { x: 1, y: 2, group: 'A' },
        { x: 2, y: 4, group: 'A' },
        { x: 3, y: 3, group: 'B' },
        { x: 4, y: 5, group: 'B' },
      ]

      const spec = gg(coloredData)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_point())
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const spec = gg([])
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle single data point', () => {
      const data = [{ x: 5, y: 10 }]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle many overlapping points', () => {
      // Many points at similar x/y values
      const denseData = Array.from({ length: 50 }, (_, i) => ({
        x: 1 + Math.random() * 0.1,
        y: 10 + Math.random() * 0.1,
      }))

      const spec = gg(denseData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ alpha: 0.5 }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle negative values', () => {
      const data = [
        { x: -5, y: -10 },
        { x: 0, y: 0 },
        { x: 5, y: 10 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle null/undefined values', () => {
      const data = [
        { x: 1, y: 10 },
        { x: null, y: 20 },
        { x: 3, y: null },
        { x: 4, y: 40 },
      ]

      const spec = gg(data as any)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('use cases', () => {
    it('should visualize marginal distribution of bivariate data', () => {
      // Random normal-ish data
      const bivariateData = Array.from({ length: 30 }, (_, i) => ({
        x: 5 + Math.sin(i * 0.5) * 3,
        y: 10 + Math.cos(i * 0.3) * 5,
      }))

      const spec = gg(bivariateData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_rug({ sides: 'bl', alpha: 0.7 }))
        .labs({ title: 'Scatter with Marginal Rugs' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should show data density along x-axis', () => {
      // Clustered x values
      const clusteredData = [
        ...Array.from({ length: 10 }, () => ({ x: 1 + Math.random() * 0.5, y: Math.random() * 10 })),
        ...Array.from({ length: 5 }, () => ({ x: 5 + Math.random() * 0.3, y: Math.random() * 10 })),
        ...Array.from({ length: 15 }, () => ({ x: 8 + Math.random() * 0.8, y: Math.random() * 10 })),
      ]

      const spec = gg(clusteredData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_rug({ sides: 'b' }))
        .labs({ title: 'Clustered X Distribution' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should complement histogram with individual points', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        x: i,
        y: Math.random() * 10,
      }))

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'b', length: 1 }))
        .labs({ title: 'Data Points on X-Axis' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('side combinations', () => {
    const data = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]

    it('should handle tr (top and right)', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'tr' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle bt (bottom and top)', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'bt' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle lr (left and right)', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_rug({ sides: 'lr' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })
})
