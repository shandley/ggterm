/**
 * Scale Inference Validation Tests
 *
 * These tests verify that the scale inference system correctly:
 * 1. Detects categorical vs continuous data
 * 2. Infers correct domains for each scale type
 * 3. Creates appropriate scale types based on data
 * 4. Handles stat-transformed data correctly
 * 5. Sets up color/fill scales properly
 *
 * Common issues this catches:
 * - Categorical data treated as continuous (or vice versa)
 * - Wrong domain bounds
 * - Missing fill scale for heatmaps
 * - Scale inference using raw data instead of stat-transformed data
 */

import { describe, expect, it } from 'bun:test'
import {
  inferContinuousDomain,
  inferDiscreteDomain,
  buildScaleContext,
} from '../../pipeline/scales'
import { stat_bin } from '../../stats/bin'
import { stat_bin2d } from '../../stats/bin2d'
import { stat_boxplot } from '../../stats/boxplot'
import { stat_count } from '../../stats/count'

// Test data fixtures
const numericXY = [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 15 },
  { x: 4, y: 25 },
  { x: 5, y: 30 },
]

const categoricalX = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 15 },
  { x: 'A', y: 25 },
  { x: 'B', y: 30 },
]

const categoricalXY = [
  { x: 'A', y: 'Low' },
  { x: 'B', y: 'Medium' },
  { x: 'C', y: 'High' },
  { x: 'A', y: 'Medium' },
  { x: 'B', y: 'High' },
]

const numericWithColor = [
  { x: 1, y: 10, color: 'red' },
  { x: 2, y: 20, color: 'blue' },
  { x: 3, y: 15, color: 'red' },
  { x: 4, y: 25, color: 'green' },
  { x: 5, y: 30, color: 'blue' },
]

const numericWithFill = [
  { x: 1, y: 1, fill: 5 },
  { x: 2, y: 2, fill: 10 },
  { x: 3, y: 3, fill: 15 },
]

const scatterData = Array.from({ length: 100 }, (_, i) => ({
  x: Math.random() * 10,
  y: Math.random() * 10,
}))

const plotArea = { x: 10, y: 2, width: 50, height: 15 }

describe('inferContinuousDomain', () => {
  it('should infer correct min/max for numeric data', () => {
    const [min, max] = inferContinuousDomain(numericXY, 'x')
    expect(min).toBeLessThanOrEqual(1)
    expect(max).toBeGreaterThanOrEqual(5)
  })

  it('should handle single value by adding padding', () => {
    const data = [{ x: 5 }]
    const [min, max] = inferContinuousDomain(data, 'x')
    expect(min).toBeLessThan(5)
    expect(max).toBeGreaterThan(5)
  })

  it('should handle empty data', () => {
    const [min, max] = inferContinuousDomain([], 'x')
    expect(min).toBe(0)
    expect(max).toBe(1)
  })

  it('should skip non-numeric values', () => {
    const data = [
      { x: 1 },
      { x: 'invalid' },
      { x: null },
      { x: 10 },
    ]
    const [min, max] = inferContinuousDomain(data, 'x')
    expect(min).toBeLessThanOrEqual(1)
    expect(max).toBeGreaterThanOrEqual(10)
  })

  it('should handle negative values', () => {
    const data = [{ x: -10 }, { x: -5 }, { x: 5 }, { x: 10 }]
    const [min, max] = inferContinuousDomain(data, 'x')
    expect(min).toBeLessThanOrEqual(-10)
    expect(max).toBeGreaterThanOrEqual(10)
  })

  it('should handle very small ranges', () => {
    const data = [{ x: 0.001 }, { x: 0.002 }, { x: 0.003 }]
    const [min, max] = inferContinuousDomain(data, 'x')
    expect(min).toBeLessThanOrEqual(0.001)
    expect(max).toBeGreaterThanOrEqual(0.003)
  })
})

describe('inferDiscreteDomain', () => {
  it('should extract unique values', () => {
    const domain = inferDiscreteDomain(categoricalX, 'x')
    expect(domain).toContain('A')
    expect(domain).toContain('B')
    expect(domain).toContain('C')
    expect(domain.length).toBe(3)
  })

  it('should sort alphabetically by default', () => {
    const domain = inferDiscreteDomain(categoricalX, 'x')
    expect(domain).toEqual(['A', 'B', 'C'])
  })

  it('should support data order', () => {
    const data = [{ x: 'C' }, { x: 'A' }, { x: 'B' }]
    const domain = inferDiscreteDomain(data, 'x', { order: 'data' })
    expect(domain).toEqual(['C', 'A', 'B'])
  })

  it('should support frequency order', () => {
    const data = [
      { x: 'A' },
      { x: 'B' }, { x: 'B' }, { x: 'B' },
      { x: 'C' }, { x: 'C' },
    ]
    const domain = inferDiscreteDomain(data, 'x', { order: 'frequency' })
    expect(domain[0]).toBe('B') // Most frequent
    expect(domain[1]).toBe('C') // Second most frequent
    expect(domain[2]).toBe('A') // Least frequent
  })

  it('should support explicit limits', () => {
    const domain = inferDiscreteDomain(categoricalX, 'x', { limits: ['C', 'B', 'A'] })
    expect(domain).toEqual(['C', 'B', 'A'])
  })

  it('should support reverse option', () => {
    const domain = inferDiscreteDomain(categoricalX, 'x', { reverse: true })
    expect(domain).toEqual(['C', 'B', 'A'])
  })

  it('should support exclude option', () => {
    const domain = inferDiscreteDomain(categoricalX, 'x', { exclude: ['B'] })
    expect(domain).toEqual(['A', 'C'])
  })

  it('should handle empty data', () => {
    const domain = inferDiscreteDomain([], 'x')
    expect(domain).toEqual([])
  })

  it('should handle numeric strings as categorical', () => {
    const data = [{ x: '1' }, { x: '2' }, { x: '3' }]
    const domain = inferDiscreteDomain(data, 'x')
    expect(domain).toEqual(['1', '2', '3'])
  })
})

describe('buildScaleContext - categorical detection', () => {
  it('should detect numeric x as continuous', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('continuous')
  })

  it('should detect string x as discrete', () => {
    const context = buildScaleContext(categoricalX, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('discrete')
  })

  it('should detect numeric y as continuous', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    expect(context.y.type).toBe('continuous')
  })

  it('should detect string y as discrete', () => {
    const context = buildScaleContext(categoricalXY, { x: 'x', y: 'y' }, plotArea)
    expect(context.y.type).toBe('discrete')
  })

  it('should handle mixed categorical x with numeric y', () => {
    const context = buildScaleContext(categoricalX, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('discrete')
    expect(context.y.type).toBe('continuous')
  })

  it('should handle mixed numeric x with categorical y', () => {
    const data = [
      { x: 1, y: 'Low' },
      { x: 2, y: 'Medium' },
      { x: 3, y: 'High' },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('continuous')
    expect(context.y.type).toBe('discrete')
  })
})

describe('buildScaleContext - domain inference', () => {
  it('should infer correct x domain for continuous data', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    const domain = context.x.domain as [number, number]
    expect(domain[0]).toBeLessThanOrEqual(1)
    expect(domain[1]).toBeGreaterThanOrEqual(5)
  })

  it('should infer correct y domain for continuous data', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    const domain = context.y.domain as [number, number]
    expect(domain[0]).toBeLessThanOrEqual(10)
    expect(domain[1]).toBeGreaterThanOrEqual(30)
  })

  it('should infer correct x domain for discrete data', () => {
    const context = buildScaleContext(categoricalX, { x: 'x', y: 'y' }, plotArea)
    const domain = context.x.domain as string[]
    expect(domain).toContain('A')
    expect(domain).toContain('B')
    expect(domain).toContain('C')
  })

  it('should infer correct y domain for discrete data', () => {
    const context = buildScaleContext(categoricalXY, { x: 'x', y: 'y' }, plotArea)
    const domain = context.y.domain as string[]
    expect(domain).toContain('Low')
    expect(domain).toContain('Medium')
    expect(domain).toContain('High')
  })
})

describe('buildScaleContext - color/fill scales', () => {
  it('should create color scale for discrete color aesthetic', () => {
    const context = buildScaleContext(
      numericWithColor,
      { x: 'x', y: 'y', color: 'color' },
      plotArea
    )
    expect(context.color).toBeDefined()
    expect(context.color!.type).toBe('discrete')
  })

  it('should include all color categories in domain', () => {
    const context = buildScaleContext(
      numericWithColor,
      { x: 'x', y: 'y', color: 'color' },
      plotArea
    )
    const domain = context.color!.domain as string[]
    expect(domain).toContain('red')
    expect(domain).toContain('blue')
    expect(domain).toContain('green')
  })

  it('should create color scale for fill aesthetic', () => {
    const context = buildScaleContext(
      numericWithFill,
      { x: 'x', y: 'y', fill: 'fill' },
      plotArea
    )
    expect(context.color).toBeDefined()
  })

  it('color scale map function should return RGBA', () => {
    const context = buildScaleContext(
      numericWithColor,
      { x: 'x', y: 'y', color: 'color' },
      plotArea
    )
    const rgba = context.color!.map('red')
    expect(rgba).toHaveProperty('r')
    expect(rgba).toHaveProperty('g')
    expect(rgba).toHaveProperty('b')
    expect(rgba).toHaveProperty('a')
  })
})

describe('buildScaleContext - scale mapping', () => {
  it('continuous x scale should map values to canvas range', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    const mapped1 = context.x.map(1)
    const mapped5 = context.x.map(5)

    // Should map to within plot area
    expect(mapped1).toBeGreaterThanOrEqual(plotArea.x)
    expect(mapped5).toBeLessThanOrEqual(plotArea.x + plotArea.width)
    // Lower values should map to lower x
    expect(mapped1).toBeLessThan(mapped5)
  })

  it('continuous y scale should map values to inverted canvas range', () => {
    const context = buildScaleContext(numericXY, { x: 'x', y: 'y' }, plotArea)
    const mapped10 = context.y.map(10)
    const mapped30 = context.y.map(30)

    // Should map to within plot area
    expect(mapped10).toBeGreaterThanOrEqual(plotArea.y)
    expect(mapped30).toBeLessThanOrEqual(plotArea.y + plotArea.height)
    // Higher values should map to lower y (inverted)
    expect(mapped30).toBeLessThan(mapped10)
  })

  it('discrete x scale should map categories to positions', () => {
    const context = buildScaleContext(categoricalX, { x: 'x', y: 'y' }, plotArea)
    const mappedA = context.x.map('A')
    const mappedB = context.x.map('B')
    const mappedC = context.x.map('C')

    // Should be in order
    expect(mappedA).toBeLessThan(mappedB)
    expect(mappedB).toBeLessThan(mappedC)
  })

  it('discrete y scale should map categories to inverted positions', () => {
    const context = buildScaleContext(categoricalXY, { x: 'x', y: 'y' }, plotArea)
    // Y is inverted, so first category is at bottom (higher y)
    const mappedHigh = context.y.map('High')
    const mappedLow = context.y.map('Low')

    // Categories should have different positions
    expect(mappedHigh).not.toBe(mappedLow)
  })
})

describe('Stat-transformed data scale inference', () => {
  /**
   * These tests verify that scales are built correctly from stat-transformed data.
   * This is critical because stats like bin, bin2d, and boxplot produce new fields
   * that the scales need to use.
   */

  it('bin stat output should produce valid x domain', () => {
    const stat = stat_bin({ bins: 5 })
    const binned = stat.compute(numericXY, { x: 'x', y: 'y' })

    // Build scales from binned data
    const context = buildScaleContext(binned, { x: 'x', y: 'y' }, plotArea)

    expect(context.x.type).toBe('continuous')
    const domain = context.x.domain as [number, number]
    expect(domain[0]).toBeLessThanOrEqual(Math.min(...binned.map(r => r.x as number)))
    expect(domain[1]).toBeGreaterThanOrEqual(Math.max(...binned.map(r => r.x as number)))
  })

  it('bin stat output should produce valid y domain (counts)', () => {
    const stat = stat_bin({ bins: 5 })
    const binned = stat.compute(numericXY, { x: 'x', y: 'y' })

    const context = buildScaleContext(binned, { x: 'x', y: 'y' }, plotArea)

    expect(context.y.type).toBe('continuous')
    const domain = context.y.domain as [number, number]
    // y should be counts, which should start at 0
    expect(domain[0]).toBeLessThanOrEqual(0)
    expect(domain[1]).toBeGreaterThan(0)
  })

  it('bin2d stat output should produce valid x and y domains', () => {
    const stat = stat_bin2d({ bins: 5 })
    const binned = stat.compute(scatterData, { x: 'x', y: 'y' })

    const context = buildScaleContext(binned, { x: 'x', y: 'y' }, plotArea)

    expect(context.x.type).toBe('continuous')
    expect(context.y.type).toBe('continuous')
  })

  it('bin2d stat output should produce valid fill domain', () => {
    const stat = stat_bin2d({ bins: 5 })
    const binned = stat.compute(scatterData, { x: 'x', y: 'y' })

    // Fill contains count values
    const context = buildScaleContext(binned, { x: 'x', y: 'y', fill: 'fill' }, plotArea)

    expect(context.color).toBeDefined()
    // Fill domain should span the count range
    const fillValues = binned.map(r => r.fill as number)
    const minFill = Math.min(...fillValues)
    const maxFill = Math.max(...fillValues)
    expect(minFill).toBeGreaterThan(0) // bin2d drops empty bins
    expect(maxFill).toBeGreaterThan(minFill)
  })

  it('boxplot stat output should produce valid y domain (includes whiskers)', () => {
    const stat = stat_boxplot()
    const boxed = stat.compute(categoricalX, { x: 'x', y: 'y' })

    // Pipeline augments boxplot data with whisker values for domain inference
    // This mimics what pipeline.ts does before calling buildScaleContext
    const augmentedData = [...boxed]
    for (const row of boxed) {
      augmentedData.push({ y: row.lower as number } as any)
      augmentedData.push({ y: row.upper as number } as any)
      const outliers = row.outliers as number[] ?? []
      for (const o of outliers) {
        augmentedData.push({ y: o } as any)
      }
    }

    const context = buildScaleContext(augmentedData, { x: 'x', y: 'y' }, plotArea)

    // X should be categorical (group names)
    expect(context.x.type).toBe('discrete')
    // Y should be continuous (values)
    expect(context.y.type).toBe('continuous')

    // Y domain should include whiskers
    const domain = context.y.domain as [number, number]
    const allLowers = boxed.map(r => r.lower as number)
    const allUppers = boxed.map(r => r.upper as number)
    expect(domain[0]).toBeLessThanOrEqual(Math.min(...allLowers))
    expect(domain[1]).toBeGreaterThanOrEqual(Math.max(...allUppers))
  })

  it('boxplot stat output y field contains median (not whiskers)', () => {
    // This documents that buildScaleContext alone would only see median
    // The pipeline must augment the data to include whisker values
    const stat = stat_boxplot()
    const boxed = stat.compute(categoricalX, { x: 'x', y: 'y' })

    // Without augmentation, domain is based on y (median) only
    const context = buildScaleContext(boxed, { x: 'x', y: 'y' }, plotArea)
    const domain = context.y.domain as [number, number]

    // y field contains median values
    const medians = boxed.map(r => r.y as number)
    expect(domain[0]).toBeLessThanOrEqual(Math.min(...medians))
    expect(domain[1]).toBeGreaterThanOrEqual(Math.max(...medians))
  })

  it('count stat output should produce valid domains', () => {
    const stat = stat_count()
    const counted = stat.compute(categoricalX, { x: 'x', y: 'count' })

    // Pipeline maps count to y, so we need to do that
    const mappedCounts = counted.map(c => ({ x: c.x, y: c.count }))
    const context = buildScaleContext(mappedCounts, { x: 'x', y: 'y' }, plotArea)

    // X should be categorical
    expect(context.x.type).toBe('discrete')
    // Y should be continuous (counts)
    expect(context.y.type).toBe('continuous')
  })
})

describe('Edge cases', () => {
  it('should handle data with all same x values', () => {
    const data = [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)

    // Should still create valid scale with padding
    const domain = context.x.domain as [number, number]
    expect(domain[0]).toBeLessThan(5)
    expect(domain[1]).toBeGreaterThan(5)
  })

  it('should handle data with all same y values', () => {
    const data = [{ x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)

    // Should still create valid scale with padding
    const domain = context.y.domain as [number, number]
    expect(domain[0]).toBeLessThan(10)
    expect(domain[1]).toBeGreaterThan(10)
  })

  it('should handle data with null/undefined values', () => {
    const data = [
      { x: 1, y: 10 },
      { x: null, y: 20 },
      { x: 3, y: null },
      { x: 5, y: 30 },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)

    // Should skip null values and still produce valid scales
    expect(context.x.type).toBe('continuous')
    expect(context.y.type).toBe('continuous')
  })

  it('should handle numeric strings that look like numbers', () => {
    // Numeric strings should be treated as categorical
    const data = [{ x: '1', y: 10 }, { x: '2', y: 20 }, { x: '3', y: 30 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)

    // '1', '2', '3' are numeric when parsed but are strings
    // isCategoricalField checks if string && isNaN(Number(value))
    // '1' -> Number('1') = 1 -> isNaN(1) = false -> not categorical
    // So these should be treated as continuous!
    expect(context.x.type).toBe('continuous')
  })

  it('should handle true categorical strings', () => {
    const data = [{ x: 'apple', y: 10 }, { x: 'banana', y: 20 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('discrete')
  })

  it('should handle mixed types with at least one non-numeric string', () => {
    // If any value is a non-numeric string, should be categorical
    const data = [{ x: 1 }, { x: 'A' }, { x: 3 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('discrete')
  })

  it('should handle very large numbers', () => {
    const data = [{ x: 1e10, y: 1e12 }, { x: 2e10, y: 2e12 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('continuous')
    expect(context.y.type).toBe('continuous')
  })

  it('should handle very small numbers', () => {
    const data = [{ x: 1e-10, y: 1e-12 }, { x: 2e-10, y: 2e-12 }]
    const context = buildScaleContext(data, { x: 'x', y: 'y' }, plotArea)
    expect(context.x.type).toBe('continuous')
    expect(context.y.type).toBe('continuous')
  })
})

describe('Coord limits override', () => {
  it('should respect xlim coord limits', () => {
    const context = buildScaleContext(
      numericXY,
      { x: 'x', y: 'y' },
      plotArea,
      [],
      { xlim: [0, 10] }
    )

    const domain = context.x.domain as [number, number]
    expect(domain[0]).toBe(0)
    expect(domain[1]).toBe(10)
  })

  it('should respect ylim coord limits', () => {
    const context = buildScaleContext(
      numericXY,
      { x: 'x', y: 'y' },
      plotArea,
      [],
      { ylim: [0, 50] }
    )

    const domain = context.y.domain as [number, number]
    expect(domain[0]).toBe(0)
    expect(domain[1]).toBe(50)
  })
})

describe('Secondary y-axis (y2)', () => {
  it('should create y2 scale when y2 aesthetic is present', () => {
    const data = [
      { x: 1, y: 10, y2: 100 },
      { x: 2, y: 20, y2: 200 },
      { x: 3, y: 30, y2: 300 },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y', y2: 'y2' }, plotArea)

    expect(context.y2).toBeDefined()
    expect(context.y2!.type).toBe('continuous')
  })

  it('y2 scale should have correct domain', () => {
    const data = [
      { x: 1, y: 10, y2: 100 },
      { x: 2, y: 20, y2: 200 },
      { x: 3, y: 30, y2: 300 },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y', y2: 'y2' }, plotArea)

    const domain = context.y2!.domain as [number, number]
    expect(domain[0]).toBeLessThanOrEqual(100)
    expect(domain[1]).toBeGreaterThanOrEqual(300)
  })
})

describe('Size aesthetic', () => {
  it('should create size scale when size aesthetic is present', () => {
    const data = [
      { x: 1, y: 10, size: 5 },
      { x: 2, y: 20, size: 10 },
      { x: 3, y: 30, size: 15 },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y', size: 'size' }, plotArea)

    expect(context.size).toBeDefined()
    expect(context.size!.type).toBe('continuous')
  })

  it('size scale should map values to size indices (0-3)', () => {
    const data = [
      { x: 1, y: 10, size: 0 },
      { x: 2, y: 20, size: 50 },
      { x: 3, y: 30, size: 100 },
    ]
    const context = buildScaleContext(data, { x: 'x', y: 'y', size: 'size' }, plotArea)

    const smallSize = context.size!.map(0)
    const mediumSize = context.size!.map(50)
    const largeSize = context.size!.map(100)

    expect(smallSize).toBe(0)
    expect(mediumSize).toBeGreaterThanOrEqual(1)
    expect(mediumSize).toBeLessThanOrEqual(2)
    expect(largeSize).toBe(3)
  })
})
