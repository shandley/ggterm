/**
 * Tests for stat_bin - histogram binning
 */

import { describe, expect, it } from 'bun:test'
import { computeBins, stat_bin } from '../../stats/bin'

describe('computeBins', () => {
  it('should compute bins for simple data', () => {
    const data = [
      { x: 1 },
      { x: 2 },
      { x: 3 },
      { x: 4 },
      { x: 5 },
    ]
    const { bins, binWidth } = computeBins(data, 'x', { bins: 5 })

    expect(bins.length).toBeGreaterThan(0)
    expect(binWidth).toBe(0.8) // (5-1) / 5
  })

  it('should return empty bins for empty data', () => {
    const { bins } = computeBins([], 'x')
    expect(bins).toHaveLength(0)
  })

  it('should handle single value', () => {
    const data = [{ x: 5 }]
    const { bins } = computeBins(data, 'x', { bins: 1 })

    // Should have at least one bin with count 1
    expect(bins.length).toBeGreaterThanOrEqual(1)
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0)
    expect(totalCount).toBe(1)
  })

  it('should use default 30 bins', () => {
    // Create data spread over a range
    const data = Array.from({ length: 100 }, (_, i) => ({ x: i }))
    const { bins, binWidth } = computeBins(data, 'x')

    expect(binWidth).toBeCloseTo(99 / 30) // (max - min) / bins
  })

  it('should use custom bin count', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ x: i }))
    const { binWidth } = computeBins(data, 'x', { bins: 10 })

    expect(binWidth).toBeCloseTo(99 / 10)
  })

  it('should use custom bin width', () => {
    const data = [{ x: 0 }, { x: 10 }, { x: 20 }, { x: 30 }]
    const { binWidth } = computeBins(data, 'x', { binwidth: 5 })

    expect(binWidth).toBe(5)
  })

  it('should compute correct bin counts', () => {
    const data = [
      { x: 1 }, { x: 1 }, { x: 1 },  // 3 in first bin
      { x: 5 }, { x: 5 },             // 2 in second bin
      { x: 9 },                        // 1 in third bin
    ]
    const { bins } = computeBins(data, 'x', { bins: 3 })

    const counts = bins.map(b => b.count)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(6)
  })

  it('should compute bin centers correctly', () => {
    const data = [{ x: 0 }, { x: 10 }]
    const { bins } = computeBins(data, 'x', { bins: 2 })

    // Each bin should have x at center
    for (const bin of bins) {
      expect(bin.x).toBeCloseTo((bin.xmin + bin.xmax) / 2)
    }
  })

  it('should compute density correctly', () => {
    const data = [
      { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 },
    ]
    const { bins, binWidth } = computeBins(data, 'x', { bins: 4 })

    // Density should be count / (total * binWidth)
    for (const bin of bins) {
      const expectedDensity = bin.count / (4 * binWidth)
      expect(bin.density).toBeCloseTo(expectedDensity)
    }
  })

  it('should respect boundary parameter', () => {
    const data = [{ x: 0 }, { x: 5 }, { x: 10 }]
    const { bins } = computeBins(data, 'x', { bins: 2, boundary: 0 })

    // First bin should start at 0 (the boundary)
    expect(bins[0].xmin).toBe(0)
  })

  it('should respect center parameter', () => {
    const data = [{ x: 0 }, { x: 5 }, { x: 10 }]
    const { bins, binWidth } = computeBins(data, 'x', { bins: 2, center: 5 })

    // One bin should be centered at 5
    const hasCenteredBin = bins.some(b =>
      Math.abs(b.x - 5) < binWidth / 2
    )
    expect(hasCenteredBin).toBe(true)
  })

  it('should skip non-numeric values', () => {
    const data = [
      { x: 1 },
      { x: 'invalid' },
      { x: null },
      { x: undefined },
      { x: NaN },
      { x: 5 },
    ]
    const { bins } = computeBins(data, 'x', { bins: 2 })

    const totalCount = bins.reduce((sum, b) => sum + b.count, 0)
    expect(totalCount).toBe(2) // Only 1 and 5 are valid
  })
})

describe('stat_bin', () => {
  it('should create a bin stat', () => {
    const stat = stat_bin()
    expect(stat.type).toBe('bin')
  })

  it('should compute binned data', () => {
    const stat = stat_bin({ bins: 5 })
    const data = [
      { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 },
    ]
    const aes = { x: 'x', y: 'y' }

    const result = stat.compute(data, aes)

    expect(result.length).toBeGreaterThan(0)
    // Each result should have x, y (count), xmin, xmax
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('y')
    expect(result[0]).toHaveProperty('xmin')
    expect(result[0]).toHaveProperty('xmax')
    expect(result[0]).toHaveProperty('count')
    expect(result[0]).toHaveProperty('density')
  })

  it('should set y as count by default', () => {
    const stat = stat_bin({ bins: 3 })
    const data = [{ x: 1 }, { x: 1 }, { x: 5 }]
    const aes = { x: 'x', y: 'y' }

    const result = stat.compute(data, aes)

    // Find the bin with the most data
    const maxBin = result.reduce((max, bin) =>
      bin.count > max.count ? bin : max
    )
    expect(maxBin.y).toBe(maxBin.count)
  })

  it('should accept custom bin count', () => {
    const stat = stat_bin({ bins: 10 })
    const data = Array.from({ length: 100 }, (_, i) => ({ x: i }))
    const aes = { x: 'x', y: 'y' }

    const result = stat.compute(data, aes)

    // Should have approximately 10 bins (might be slightly more due to edge cases)
    expect(result.length).toBeGreaterThanOrEqual(10)
    expect(result.length).toBeLessThanOrEqual(12)
  })

  it('should accept custom bin width', () => {
    const stat = stat_bin({ binwidth: 10 })
    const data = [{ x: 0 }, { x: 50 }, { x: 100 }]
    const aes = { x: 'x', y: 'y' }

    const result = stat.compute(data, aes)

    // With binwidth of 10 over range 0-100, should have ~10 bins
    expect(result.length).toBeGreaterThanOrEqual(10)
  })
})
