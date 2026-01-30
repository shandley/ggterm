/**
 * Tests for geom_density (1D kernel density estimation)
 */

import { describe, it, expect } from 'bun:test'
import { gg } from '../../grammar'
import { geom_density } from '../../geoms/density'
import { stat_density, computeDensity } from '../../stats/density'

describe('geom_density', () => {
  describe('geom definition', () => {
    it('should create density geom with default options', () => {
      const geom = geom_density()
      expect(geom.type).toBe('density')
      expect(geom.stat).toBe('density')
      expect(geom.position).toBe('identity')
      expect(geom.params.n).toBe(512)
      expect(geom.params.kernel).toBe('gaussian')
      expect(geom.params.adjust).toBe(1)
      expect(geom.params.alpha).toBe(0.3)
    })

    it('should accept custom options', () => {
      const geom = geom_density({
        n: 256,
        bw: 0.5,
        kernel: 'epanechnikov',
        adjust: 1.5,
        alpha: 0.5,
        color: '#ff0000',
        fill: '#00ff00',
      })
      expect(geom.params.n).toBe(256)
      expect(geom.params.bw).toBe(0.5)
      expect(geom.params.kernel).toBe('epanechnikov')
      expect(geom.params.adjust).toBe(1.5)
      expect(geom.params.alpha).toBe(0.5)
      expect(geom.params.color).toBe('#ff0000')
      expect(geom.params.fill).toBe('#00ff00')
    })

    it('should accept linetype option', () => {
      const geom = geom_density({ linetype: 'dashed' })
      expect(geom.params.linetype).toBe('dashed')
    })
  })

  describe('stat_density', () => {
    it('should compute density for numeric data', () => {
      const data = [
        { x: 1 }, { x: 2 }, { x: 2 }, { x: 3 },
        { x: 3 }, { x: 3 }, { x: 4 }, { x: 5 },
      ]
      const result = computeDensity(data, 'x', { n: 50 })

      expect(result.length).toBe(50)
      expect(result[0]).toHaveProperty('x')
      expect(result[0]).toHaveProperty('y')
      expect(result[0]).toHaveProperty('density')
      expect(result[0]).toHaveProperty('scaled')
    })

    it('should handle empty data', () => {
      const result = computeDensity([], 'x', { n: 50 })
      expect(result.length).toBe(0)
    })

    it('should group by color aesthetic', () => {
      const data = [
        { x: 1, group: 'A' }, { x: 2, group: 'A' }, { x: 3, group: 'A' },
        { x: 10, group: 'B' }, { x: 11, group: 'B' }, { x: 12, group: 'B' },
      ]
      const stat = stat_density({ n: 20 })
      const result = stat.compute(data, { x: 'x', color: 'group' })

      // Should have results for both groups
      const groupA = result.filter(r => r.group === 'A')
      const groupB = result.filter(r => r.group === 'B')
      expect(groupA.length).toBe(20)
      expect(groupB.length).toBe(20)
    })

    it('should respect kernel parameter', () => {
      const data = [{ x: 0 }, { x: 1 }, { x: 2 }]

      const gaussian = computeDensity(data, 'x', { n: 10, kernel: 'gaussian' })
      const rectangular = computeDensity(data, 'x', { n: 10, kernel: 'rectangular' })

      // Different kernels should produce different results
      expect(gaussian[5].density).not.toBe(rectangular[5].density)
    })

    it('should respect adjust parameter', () => {
      const data = [{ x: 0 }, { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }]

      const narrow = computeDensity(data, 'x', { n: 20, adjust: 0.5 })
      const wide = computeDensity(data, 'x', { n: 20, adjust: 2 })

      // Narrower bandwidth should have higher peak density
      const narrowMax = Math.max(...narrow.map(d => d.density as number))
      const wideMax = Math.max(...wide.map(d => d.density as number))
      expect(narrowMax).toBeGreaterThan(wideMax)
    })
  })

  describe('rendering', () => {
    it('should render density plot from data', () => {
      const data = [
        { value: 1 }, { value: 2 }, { value: 2 }, { value: 3 },
        { value: 3 }, { value: 3 }, { value: 4 }, { value: 5 },
      ]

      const plot = gg(data)
        .aes({ x: 'value' })
        .geom(geom_density())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render density plot with color grouping', () => {
      const data = [
        { value: 1, group: 'A' }, { value: 2, group: 'A' }, { value: 3, group: 'A' },
        { value: 10, group: 'B' }, { value: 11, group: 'B' }, { value: 12, group: 'B' },
      ]

      const plot = gg(data)
        .aes({ x: 'value', color: 'group' })
        .geom(geom_density())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should render density plot with custom alpha', () => {
      const data = [
        { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 },
      ]

      const plot = gg(data)
        .aes({ x: 'value' })
        .geom(geom_density({ alpha: 0.7 }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeTruthy()
    })
  })

  describe('plot spec', () => {
    it('should generate correct plot specification', () => {
      const data = [{ x: 1 }, { x: 2 }, { x: 3 }]
      const plot = gg(data)
        .aes({ x: 'x' })
        .geom(geom_density({ n: 100 }))

      const spec = plot.spec()
      expect(spec.geoms).toHaveLength(1)
      expect(spec.geoms[0].type).toBe('density')
      expect(spec.geoms[0].stat).toBe('density')
      expect(spec.geoms[0].params.n).toBe(100)
    })
  })
})
