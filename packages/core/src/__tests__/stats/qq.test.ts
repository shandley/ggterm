/**
 * Tests for stat_qq - Q-Q plot statistical transformation
 */

import { describe, expect, it } from 'bun:test'
import { stat_qq, stat_qq_line, computeQQ, computeQQLine } from '../../stats/qq'

describe('computeQQ', () => {
  it('should compute Q-Q data for normal distribution', () => {
    // Sample data roughly normal
    const data = [
      { value: -2.1 },
      { value: -1.3 },
      { value: -0.4 },
      { value: 0.2 },
      { value: 0.5 },
      { value: 1.1 },
      { value: 1.8 },
    ]

    const result = computeQQ(data, 'value')

    expect(result.length).toBe(7)
    // Sample quantiles should be sorted
    expect(result[0].sample).toBe(-2.1)
    expect(result[6].sample).toBe(1.8)
    // Theoretical quantiles should span negative to positive for normal
    expect(result[0].theoretical).toBeLessThan(0)
    expect(result[6].theoretical).toBeGreaterThan(0)
  })

  it('should handle empty data', () => {
    const result = computeQQ([], 'value')
    expect(result).toEqual([])
  })

  it('should skip non-numeric values', () => {
    const data = [
      { value: 1 },
      { value: 'not a number' },
      { value: 2 },
      { value: null },
      { value: 3 },
    ]

    const result = computeQQ(data, 'value')
    expect(result.length).toBe(3)
  })

  it('should compute Q-Q for uniform distribution', () => {
    const data = [
      { value: 0.1 },
      { value: 0.3 },
      { value: 0.5 },
      { value: 0.7 },
      { value: 0.9 },
    ]

    const result = computeQQ(data, 'value', { distribution: 'uniform' })

    expect(result.length).toBe(5)
    // For uniform[0,1], theoretical quantiles should be evenly spaced
    expect(result[0].theoretical).toBeGreaterThan(0)
    expect(result[0].theoretical).toBeLessThan(0.2)
    expect(result[4].theoretical).toBeGreaterThan(0.8)
    expect(result[4].theoretical).toBeLessThan(1)
  })

  it('should compute Q-Q for exponential distribution', () => {
    const data = [
      { value: 0.1 },
      { value: 0.5 },
      { value: 1.0 },
      { value: 2.0 },
      { value: 4.0 },
    ]

    const result = computeQQ(data, 'value', { distribution: 'exp' })

    expect(result.length).toBe(5)
    // Exponential theoretical quantiles start at 0
    expect(result[0].theoretical).toBeGreaterThan(0)
  })
})

describe('computeQQ edge cases', () => {
  it('should handle single data point', () => {
    const data = [{ value: 5 }]
    const result = computeQQ(data, 'value')
    expect(result.length).toBe(1)
    expect(result[0].sample).toBe(5)
    expect(result[0].theoretical).toBe(0) // p=0.5 for normal gives 0
  })

  it('should handle all identical values', () => {
    const data = [
      { value: 3 },
      { value: 3 },
      { value: 3 },
      { value: 3 },
    ]
    const result = computeQQ(data, 'value')
    expect(result.length).toBe(4)
    // All samples should be the same
    result.forEach(r => expect(r.sample).toBe(3))
  })

  it('should filter NaN values', () => {
    const data = [
      { value: 1 },
      { value: NaN },
      { value: 2 },
      { value: Infinity },
      { value: 3 },
    ]
    const result = computeQQ(data, 'value')
    expect(result.length).toBe(3)
  })

  it('should handle two data points', () => {
    const data = [{ value: 1 }, { value: 5 }]
    const result = computeQQ(data, 'value')
    expect(result.length).toBe(2)
    expect(result[0].sample).toBe(1)
    expect(result[1].sample).toBe(5)
  })
})

describe('computeQQLine', () => {
  it('should compute line through quartiles', () => {
    // Data with known quartiles
    const data = [
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
      { value: 6 },
      { value: 7 },
      { value: 8 },
    ]

    const result = computeQQLine(data, 'value')

    expect(result).not.toBeNull()
    expect(result!.slope).toBeGreaterThan(0)
    expect(typeof result!.intercept).toBe('number')
  })

  it('should return null for insufficient data', () => {
    const result = computeQQLine([{ value: 1 }], 'value')
    expect(result).toBeNull()
  })

  it('should return null for empty data', () => {
    const result = computeQQLine([], 'value')
    expect(result).toBeNull()
  })

  it('should handle two data points (minimum)', () => {
    const data = [{ value: 1 }, { value: 5 }]
    const result = computeQQLine(data, 'value')
    expect(result).not.toBeNull()
    expect(typeof result!.slope).toBe('number')
    expect(typeof result!.intercept).toBe('number')
  })

  it('should handle identical values (zero variance)', () => {
    const data = [
      { value: 3 },
      { value: 3 },
      { value: 3 },
      { value: 3 },
    ]
    const result = computeQQLine(data, 'value')
    // When all values are identical, Q1 = Q3, so slope calculation gives 0/theorSpread
    // This should result in slope = 0
    expect(result).not.toBeNull()
    expect(result!.slope).toBe(0)
  })
})

describe('stat_qq', () => {
  it('should create stat with correct type', () => {
    const stat = stat_qq()
    expect(stat.type).toBe('qq')
  })

  it('should compute Q-Q data with x=theoretical, y=sample', () => {
    const data = [
      { value: -1 },
      { value: 0 },
      { value: 1 },
    ]

    const stat = stat_qq()
    const result = stat.compute(data, { x: 'value', y: 'value' })

    expect(result.length).toBe(3)
    // Output should have x (theoretical) and y (sample)
    expect(result[0].x).toBeDefined()
    expect(result[0].y).toBeDefined()
    expect(result[0].theoretical).toBeDefined()
    expect(result[0].sample).toBeDefined()
  })
})

describe('stat_qq_line', () => {
  it('should create stat with correct type', () => {
    const stat = stat_qq_line()
    expect(stat.type).toBe('qq_line')
  })

  it('should compute line endpoints', () => {
    const data = [
      { value: -2 },
      { value: -1 },
      { value: 0 },
      { value: 1 },
      { value: 2 },
    ]

    const stat = stat_qq_line()
    const result = stat.compute(data, { x: 'value', y: 'value' })

    // Should return one row with line endpoints
    expect(result.length).toBe(1)
    expect(result[0].x).toBeDefined()
    expect(result[0].y).toBeDefined()
    expect(result[0].xend).toBeDefined()
    expect(result[0].yend).toBeDefined()
  })
})
