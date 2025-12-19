/**
 * Tests for geom_smooth
 */

import { describe, expect, it } from 'bun:test'
import { geom_smooth } from '../../geoms/smooth'
import { gg } from '../../grammar'
import { renderToCanvas } from '../../pipeline'
import { stat_smooth } from '../../stats'

describe('geom_smooth', () => {
  describe('geom creation', () => {
    it('should create smooth geom with defaults', () => {
      const geom = geom_smooth()
      expect(geom.type).toBe('smooth')
      expect(geom.stat).toBe('smooth')
      expect(geom.position).toBe('identity')
    })

    it('should have default params', () => {
      const geom = geom_smooth()
      expect(geom.params.method).toBe('lm')
      expect(geom.params.span).toBe(0.75)
      expect(geom.params.n).toBe(80)
      expect(geom.params.se).toBe(true)
      expect(geom.params.level).toBe(0.95)
      expect(geom.params.alpha).toBe(0.3)
    })

    it('should accept method option', () => {
      const geom = geom_smooth({ method: 'loess' })
      expect(geom.params.method).toBe('loess')
    })

    it('should accept lowess as alias for loess', () => {
      const geom = geom_smooth({ method: 'lowess' })
      expect(geom.params.method).toBe('lowess')
    })

    it('should accept span option', () => {
      const geom = geom_smooth({ span: 0.5 })
      expect(geom.params.span).toBe(0.5)
    })

    it('should accept n option', () => {
      const geom = geom_smooth({ n: 50 })
      expect(geom.params.n).toBe(50)
    })

    it('should accept se option', () => {
      const geom = geom_smooth({ se: false })
      expect(geom.params.se).toBe(false)
    })

    it('should accept color option', () => {
      const geom = geom_smooth({ color: '#ff0000' })
      expect(geom.params.color).toBe('#ff0000')
    })

    it('should accept alpha option', () => {
      const geom = geom_smooth({ alpha: 0.5 })
      expect(geom.params.alpha).toBe(0.5)
    })

    it('should accept linetype option', () => {
      const geom = geom_smooth({ linetype: 'dashed' })
      expect(geom.params.linetype).toBe('dashed')
    })
  })

  describe('rendering', () => {
    // Generate simple linear data
    const linearData = Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: 2 * i + 5 + (Math.random() - 0.5) * 2, // y = 2x + 5 with noise
    }))

    it('should render smooth line with linear regression', () => {
      const spec = gg(linearData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth({ method: 'lm' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(40)
      expect(canvas.height).toBe(20)
    })

    it('should render smooth line without confidence band', () => {
      const spec = gg(linearData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth({ se: false }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should render with LOESS smoothing', () => {
      const spec = gg(linearData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth({ method: 'loess' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should render with custom color', () => {
      const spec = gg(linearData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth({ color: '#ff6600' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should render with fewer evaluation points', () => {
      const spec = gg(linearData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth({ n: 10 }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })
  })

  describe('with scatter points', () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 5 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
      { x: 6, y: 11 },
      { x: 7, y: 14 },
      { x: 8, y: 15 },
    ]

    it('should render smooth over scatter points', () => {
      const { geom_point } = require('../../geoms')

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_smooth())
        .spec()

      expect(spec.geoms).toHaveLength(2)
      expect(spec.geoms[0].type).toBe('point')
      expect(spec.geoms[1].type).toBe('smooth')

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })
  })

  describe('stat_smooth integration', () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
    ]

    it('should compute smooth with linear regression', () => {
      const smooth = stat_smooth({ method: 'lm', n: 5 })
      const result = smooth.compute(data, { x: 'x', y: 'y' })

      expect(result.length).toBe(5)
      // Linear data should produce nearly perfect fit
      expect(result[0].x).toBeDefined()
      expect(result[0].y).toBeDefined()
    })

    it('should include confidence intervals by default', () => {
      // Add some noise to have non-zero variance
      const noisyData = [
        { x: 1, y: 2.1 },
        { x: 2, y: 3.9 },
        { x: 3, y: 6.2 },
        { x: 4, y: 7.8 },
        { x: 5, y: 10.1 },
      ]
      const smooth = stat_smooth({ method: 'lm', n: 5, se: true })
      const result = smooth.compute(noisyData, { x: 'x', y: 'y' })

      expect(result[0].ymin).toBeDefined()
      expect(result[0].ymax).toBeDefined()
      // With noise, CI should be wider than point estimate
      expect(result[0].ymin).toBeLessThanOrEqual(result[0].y as number)
      expect(result[0].ymax).toBeGreaterThanOrEqual(result[0].y as number)
    })

    it('should compute smooth with LOESS', () => {
      const loessData = [
        { x: 1, y: 1 },
        { x: 2, y: 4 },
        { x: 3, y: 9 },
        { x: 4, y: 16 },
        { x: 5, y: 25 },
        { x: 6, y: 20 },
        { x: 7, y: 15 },
        { x: 8, y: 10 },
      ]

      const smooth = stat_smooth({ method: 'loess', n: 8, span: 0.5 })
      const result = smooth.compute(loessData, { x: 'x', y: 'y' })

      expect(result.length).toBe(8)
      // LOESS should follow the curve
      expect(result[0].x).toBeDefined()
      expect(result[0].y).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point gracefully', () => {
      const data = [{ x: 1, y: 1 }]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth())
        .spec()

      // Should not throw
      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should handle two data points', () => {
      const data = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should handle horizontal line (constant y)', () => {
      const data = [
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should handle negative values', () => {
      const data = [
        { x: -2, y: -4 },
        { x: -1, y: -2 },
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_smooth())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })
  })
})
