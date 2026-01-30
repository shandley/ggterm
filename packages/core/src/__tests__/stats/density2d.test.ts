/**
 * Tests for stat_density_2d
 */

import { describe, expect, it } from 'bun:test'
import { stat_density_2d, computeDensity2d } from '../../stats/density2d'
import { gg } from '../../grammar'
import { geom_density_2d } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('stat_density_2d', () => {
  describe('computeDensity2d', () => {
    const scatterData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]

    it('should compute 2D density grid', () => {
      const result = computeDensity2d(scatterData, 'x', 'y')

      expect(result.length).toBeGreaterThan(0)
      // Should have x, y, z fields
      expect(result[0]).toHaveProperty('x')
      expect(result[0]).toHaveProperty('y')
      expect(result[0]).toHaveProperty('z')
      expect(result[0]).toHaveProperty('density')
    })

    it('should produce positive density values', () => {
      const result = computeDensity2d(scatterData, 'x', 'y')

      for (const row of result) {
        expect(row.z).toBeGreaterThanOrEqual(0)
      }
    })

    it('should produce grid with specified dimensions', () => {
      const result = computeDensity2d(scatterData, 'x', 'y', { n: 10 })

      // Should be 10 x 10 = 100 grid points
      expect(result.length).toBe(100)
    })

    it('should accept custom bandwidth', () => {
      const resultSmall = computeDensity2d(scatterData, 'x', 'y', { h: 0.1 })
      const resultLarge = computeDensity2d(scatterData, 'x', 'y', { h: 2 })

      // Different bandwidths should produce different results
      // Smaller bandwidth = sharper peaks
      const maxSmall = Math.max(...resultSmall.map(r => r.z))
      const maxLarge = Math.max(...resultLarge.map(r => r.z))

      // Smaller bandwidth should have higher peak density
      expect(maxSmall).toBeGreaterThan(maxLarge)
    })

    it('should handle separate x and y bandwidths', () => {
      const result = computeDensity2d(scatterData, 'x', 'y', { h: [0.5, 1.0] })
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle empty data', () => {
      const result = computeDensity2d([], 'x', 'y')
      expect(result).toEqual([])
    })

    it('should handle data with missing values', () => {
      const dataWithNulls = [
        { x: 1, y: 1 },
        { x: null, y: 2 },
        { x: 3, y: null },
        { x: 2, y: 2 },
        { x: 3, y: 3 },  // Need at least 3 valid points
      ]

      const result = computeDensity2d(dataWithNulls as any, 'x', 'y')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('stat_density_2d', () => {
    it('should create stat transformation', () => {
      const stat = stat_density_2d()
      expect(stat.type).toBe('density_2d')
      expect(typeof stat.compute).toBe('function')
    })

    it('should compute density from data', () => {
      const data = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 },
      ]

      const stat = stat_density_2d({ n: 5 })
      const result = stat.compute(data, { x: 'x', y: 'y' })

      expect(result.length).toBe(25) // 5 x 5 grid
    })

    it('should handle grouped data with color aesthetic', () => {
      // Need at least 3 points per group for density estimation
      const data = [
        { x: 0, y: 0, group: 'A' },
        { x: 1, y: 1, group: 'A' },
        { x: 0.5, y: 0.5, group: 'A' },
        { x: 5, y: 5, group: 'B' },
        { x: 6, y: 6, group: 'B' },
        { x: 5.5, y: 5.5, group: 'B' },
      ]

      const stat = stat_density_2d({ n: 5 })
      const result = stat.compute(data, { x: 'x', y: 'y', color: 'group' })

      // Should have results for both groups (the group field is stored as 'group')
      const groupA = result.filter(r => r.group === 'A')
      const groupB = result.filter(r => r.group === 'B')

      expect(groupA.length).toBe(25)
      expect(groupB.length).toBe(25)
    })
  })

  describe('geom_density_2d rendering', () => {
    const scatterData = Array.from({ length: 50 }, (_, i) => ({
      x: Math.sin(i * 0.5) * 3 + 5,
      y: Math.cos(i * 0.3) * 3 + 5,
    }))

    it('should render density contours', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_density_2d())
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(60)
      expect(canvas.height).toBe(20)
    })

    it('should render with custom parameters', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_density_2d({ bins: 5, bandwidth: 1 }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should render with title', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_density_2d())
        .labs({ title: '2D Density Plot' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })
  })
})
