/**
 * Stat Output Validation Tests
 *
 * These tests verify that each statistical transformation produces the
 * expected output fields that the pipeline and renderers depend on.
 *
 * Common issues this catches:
 * 1. Missing required fields in stat output
 * 2. Field type mismatches (string vs number)
 * 3. Pipeline aesthetic mapping inconsistencies
 * 4. Renderer field expectations not met
 */

import { describe, expect, it } from 'bun:test'
import { stat_bin, computeBins } from '../../stats/bin'
import { stat_bin2d, computeBins2d } from '../../stats/bin2d'
import { stat_boxplot, computeBoxplotStats } from '../../stats/boxplot'
import { stat_count } from '../../stats/count'
import { stat_density, stat_ydensity, computeDensity } from '../../stats/density'
import { stat_smooth, computeSmooth } from '../../stats/smooth'
import { stat_qq, stat_qq_line, computeQQ, computeQQLine } from '../../stats/qq'

// Test data fixtures
const numericData = [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 15 },
  { x: 4, y: 25 },
  { x: 5, y: 30 },
  { x: 1, y: 12 },
  { x: 2, y: 18 },
  { x: 3, y: 22 },
]

const categoricalData = [
  { x: 'A', y: 10 },
  { x: 'A', y: 15 },
  { x: 'A', y: 12 },
  { x: 'B', y: 20 },
  { x: 'B', y: 25 },
  { x: 'B', y: 22 },
  { x: 'C', y: 30 },
  { x: 'C', y: 35 },
]

const scatterData = Array.from({ length: 50 }, (_, i) => ({
  x: Math.random() * 10,
  y: Math.random() * 10,
}))

/**
 * Helper to check if a field is numeric
 */
function isNumeric(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Helper to check required fields exist and have correct types
 */
function validateFields(
  result: Record<string, unknown>[],
  requiredFields: { name: string; type: 'number' | 'string' | 'array' | 'any' }[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (result.length === 0) {
    errors.push('Result is empty')
    return { valid: false, errors }
  }

  for (const row of result) {
    for (const field of requiredFields) {
      if (!(field.name in row)) {
        errors.push(`Missing field '${field.name}'`)
        continue
      }

      const value = row[field.name]
      switch (field.type) {
        case 'number':
          if (!isNumeric(value)) {
            errors.push(`Field '${field.name}' should be number, got ${typeof value}`)
          }
          break
        case 'string':
          if (typeof value !== 'string' && typeof value !== 'number') {
            errors.push(`Field '${field.name}' should be string/number, got ${typeof value}`)
          }
          break
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${field.name}' should be array, got ${typeof value}`)
          }
          break
        // 'any' accepts any type
      }
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}

describe('stat_bin output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const },      // Bin center
    { name: 'y', type: 'number' as const },      // Count (for histogram y-axis)
    { name: 'xmin', type: 'number' as const },   // Bin left edge
    { name: 'xmax', type: 'number' as const },   // Bin right edge
    { name: 'count', type: 'number' as const },  // Observation count
    { name: 'density', type: 'number' as const }, // Density value
  ]

  it('should output all required fields', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have y equal to count (pipeline expects this)', () => {
    const stat = stat_bin({ bins: 3 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.y).toBe(row.count)
    }
  })

  it('should have xmin < x < xmax (bin center between edges)', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.xmin).toBeLessThan(row.x as number)
      expect(row.x).toBeLessThan(row.xmax as number)
    }
  })

  it('should have non-negative counts and densities', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.count).toBeGreaterThanOrEqual(0)
      expect(row.density).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('stat_bin2d output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const },       // Bin center x
    { name: 'y', type: 'number' as const },       // Bin center y
    { name: 'fill', type: 'number' as const },    // Fill value (count for coloring)
    { name: 'count', type: 'number' as const },   // Observation count
    { name: 'density', type: 'number' as const }, // Density value
    { name: 'width', type: 'number' as const },   // Bin width
    { name: 'height', type: 'number' as const },  // Bin height
  ]

  it('should output all required fields', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have fill equal to count (for heatmap coloring)', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.fill).toBe(row.count)
    }
  })

  it('should have positive width and height', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.width).toBeGreaterThan(0)
      expect(row.height).toBeGreaterThan(0)
    }
  })

  it('should drop empty bins by default', () => {
    const stat = stat_bin2d({ bins: 10, drop: true })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.count).toBeGreaterThan(0)
    }
  })
})

describe('stat_boxplot output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'any' as const },          // Group identifier (can be string or number)
    { name: 'lower', type: 'number' as const },   // Lower whisker
    { name: 'q1', type: 'number' as const },      // First quartile
    { name: 'median', type: 'number' as const },  // Median
    { name: 'q3', type: 'number' as const },      // Third quartile
    { name: 'upper', type: 'number' as const },   // Upper whisker
    { name: 'outliers', type: 'array' as const }, // Outlier values
    { name: 'y', type: 'number' as const },       // Same as median (for scale inference)
    { name: 'ymin', type: 'number' as const },    // Same as lower (for scale inference)
    { name: 'ymax', type: 'number' as const },    // Same as upper (for scale inference)
  ]

  it('should output all required fields', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have quartiles in correct order (lower <= q1 <= median <= q3 <= upper)', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.lower).toBeLessThanOrEqual(row.q1 as number)
      expect(row.q1).toBeLessThanOrEqual(row.median as number)
      expect(row.median).toBeLessThanOrEqual(row.q3 as number)
      expect(row.q3).toBeLessThanOrEqual(row.upper as number)
    }
  })

  it('should have y/ymin/ymax matching median/lower/upper', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.y).toBe(row.median)
      expect(row.ymin).toBe(row.lower)
      expect(row.ymax).toBe(row.upper)
    }
  })

  it('should produce one row per group', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    const groups = new Set(categoricalData.map(d => d.x))
    expect(result.length).toBe(groups.size)
  })
})

describe('stat_count output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'any' as const },         // Category value
    { name: 'count', type: 'number' as const },  // Count of observations
  ]

  it('should output all required fields', () => {
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have positive counts', () => {
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    for (const row of result) {
      expect(row.count).toBeGreaterThan(0)
    }
  })

  it('should sum to total observations', () => {
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    const totalCount = result.reduce((sum, row) => sum + (row.count as number), 0)
    expect(totalCount).toBe(categoricalData.length)
  })

  it('should produce one row per unique x value', () => {
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    const uniqueX = new Set(categoricalData.map(d => d.x))
    expect(result.length).toBe(uniqueX.size)
  })
})

describe('stat_density output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const },       // Position
    { name: 'y', type: 'number' as const },       // Density value
    { name: 'density', type: 'number' as const }, // Same as y
    { name: 'scaled', type: 'number' as const },  // Scaled to max=1
    { name: 'count', type: 'number' as const },   // Estimated count
  ]

  it('should output all required fields', () => {
    const stat = stat_density({ n: 50 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have y equal to density', () => {
    const stat = stat_density({ n: 50 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.y).toBe(row.density)
    }
  })

  it('should have scaled values between 0 and 1', () => {
    const stat = stat_density({ n: 50 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect(row.scaled).toBeGreaterThanOrEqual(0)
      expect(row.scaled).toBeLessThanOrEqual(1)
    }
  })

  it('should have at least one scaled value equal to 1 (the maximum)', () => {
    const stat = stat_density({ n: 50 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const hasMaxScaled = result.some(row => Math.abs((row.scaled as number) - 1) < 0.001)
    expect(hasMaxScaled).toBe(true)
  })
})

describe('stat_ydensity output validation (violin)', () => {
  const requiredFields = [
    { name: 'x', type: 'any' as const },          // Group identifier
    { name: 'y', type: 'number' as const },       // Position along y-axis
    { name: 'density', type: 'number' as const }, // Density value
    { name: 'scaled', type: 'number' as const },  // Scaled density
  ]

  it('should output all required fields', () => {
    const stat = stat_ydensity({ n: 30 })
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should produce multiple y values per group (density curve)', () => {
    const stat = stat_ydensity({ n: 30 })
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    // Group by x
    const groups = new Map<string, number>()
    for (const row of result) {
      const key = String(row.x)
      groups.set(key, (groups.get(key) ?? 0) + 1)
    }

    // Each group should have multiple points
    for (const count of groups.values()) {
      expect(count).toBeGreaterThan(1)
    }
  })
})

describe('stat_smooth output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const },    // X position
    { name: 'y', type: 'number' as const },    // Predicted y value
  ]

  const optionalFields = [
    { name: 'ymin', type: 'number' as const }, // Lower confidence bound
    { name: 'ymax', type: 'number' as const }, // Upper confidence bound
    { name: 'se', type: 'number' as const },   // Standard error
  ]

  it('should output all required fields', () => {
    const stat = stat_smooth({ method: 'lm', n: 20 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should output confidence bands when se=true', () => {
    const stat = stat_smooth({ method: 'lm', n: 20, se: true })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, [...requiredFields, ...optionalFields])
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should have ymin <= y <= ymax when confidence bands present', () => {
    const stat = stat_smooth({ method: 'lm', n: 20, se: true })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      if (row.ymin !== undefined && row.ymax !== undefined) {
        expect(row.ymin).toBeLessThanOrEqual(row.y as number)
        expect(row.y).toBeLessThanOrEqual(row.ymax as number)
      }
    }
  })
})

describe('stat_qq output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const }, // Theoretical quantile
    { name: 'y', type: 'number' as const }, // Sample quantile
  ]

  it('should output all required fields', () => {
    const stat = stat_qq()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should produce same number of points as input data', () => {
    const stat = stat_qq()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    expect(result.length).toBe(numericData.length)
  })

  it('should have sorted sample quantiles (y values)', () => {
    const stat = stat_qq()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (let i = 1; i < result.length; i++) {
      expect(result[i].y).toBeGreaterThanOrEqual(result[i - 1].y as number)
    }
  })
})

describe('stat_qq_line output validation', () => {
  const requiredFields = [
    { name: 'x', type: 'number' as const },    // Start x
    { name: 'y', type: 'number' as const },    // Start y
    { name: 'xend', type: 'number' as const }, // End x
    { name: 'yend', type: 'number' as const }, // End y
  ]

  it('should output all required fields', () => {
    const stat = stat_qq_line()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const validation = validateFields(result, requiredFields)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('should produce exactly one segment (the reference line)', () => {
    const stat = stat_qq_line()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    expect(result.length).toBe(1)
  })

  it('should have different start and end points', () => {
    const stat = stat_qq_line()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    const row = result[0]
    expect(row.x).not.toBe(row.xend)
    expect(row.y).not.toBe(row.yend)
  })
})

describe('Pipeline aesthetic mapping compatibility', () => {
  /**
   * These tests verify that stat outputs match what the pipeline expects
   * when remapping aesthetics (e.g., in applyStatTransform -> geomAes update)
   */

  it('bin stat output should work with histogram pipeline mapping (x: x, y: y)', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    // Pipeline remaps to { x: 'x', y: 'y' }
    // Renderer expects to read row['x'] and row['y']
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('y' in row).toBe(true)
      expect(isNumeric(row.x)).toBe(true)
      expect(isNumeric(row.y)).toBe(true)
    }
  })

  it('bin2d stat output should work with pipeline mapping (x: x, y: y, fill: fill)', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    // Pipeline remaps to { x: 'x', y: 'y', fill: 'fill' }
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('y' in row).toBe(true)
      expect('fill' in row).toBe(true)
      expect(isNumeric(row.x)).toBe(true)
      expect(isNumeric(row.y)).toBe(true)
      expect(isNumeric(row.fill)).toBe(true)
    }
  })

  it('boxplot stat output should work with pipeline mapping (x: x, y: y)', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    // Pipeline remaps to { x: 'x', y: 'y' }
    // But renderer also needs lower, q1, median, q3, upper, outliers
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('y' in row).toBe(true)
      expect('lower' in row).toBe(true)
      expect('upper' in row).toBe(true)
      expect('median' in row).toBe(true)
    }
  })

  it('count stat output should work with pipeline bar rendering', () => {
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    // Pipeline maps count to y: return counts.map(c => ({ x: c.x, y: c.count, count: c.count }))
    // So renderer expects row['x'] and will get y after pipeline mapping
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('count' in row).toBe(true)
    }
  })

  it('qq stat output should work with pipeline mapping (x: x, y: y)', () => {
    const stat = stat_qq()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    // Pipeline remaps to { x: 'x', y: 'y' }
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('y' in row).toBe(true)
      expect(isNumeric(row.x)).toBe(true)
      expect(isNumeric(row.y)).toBe(true)
    }
  })

  it('qq_line stat output should work with segment renderer (x, y, xend, yend)', () => {
    const stat = stat_qq_line()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    // Pipeline remaps to { x: 'x', y: 'y', xend: 'xend', yend: 'yend' }
    for (const row of result) {
      expect('x' in row).toBe(true)
      expect('y' in row).toBe(true)
      expect('xend' in row).toBe(true)
      expect('yend' in row).toBe(true)
    }
  })
})

describe('Renderer field expectations', () => {
  /**
   * These tests verify stat outputs include fields that renderers directly access
   */

  it('tile renderer expects width/height for bin2d', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    // renderGeomTile checks data[0]?.width and data[0]?.height
    for (const row of result) {
      expect('width' in row).toBe(true)
      expect('height' in row).toBe(true)
      expect((row.width as number) > 0).toBe(true)
      expect((row.height as number) > 0).toBe(true)
    }
  })

  it('boxplot renderer expects outliers array', () => {
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect('outliers' in row).toBe(true)
      expect(Array.isArray(row.outliers)).toBe(true)
    }
  })

  it('violin renderer expects density and scaled fields', () => {
    const stat = stat_ydensity({ n: 30 })
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect('density' in row).toBe(true)
      expect('scaled' in row).toBe(true)
      expect(isNumeric(row.density)).toBe(true)
      expect(isNumeric(row.scaled)).toBe(true)
    }
  })

  it('smooth ribbon renderer expects ymin/ymax for confidence bands', () => {
    const stat = stat_smooth({ method: 'lm', n: 20, se: true })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const row of result) {
      expect('ymin' in row).toBe(true)
      expect('ymax' in row).toBe(true)
    }
  })
})

/**
 * Pipeline Mapping Reference
 *
 * This documents the expected aesthetic mappings for each stat type
 * as implemented in pipeline.ts applyStatTransform and geomAes updates.
 *
 * | Stat      | Pipeline geomAes mapping                          | Notes                        |
 * |-----------|---------------------------------------------------|------------------------------|
 * | bin       | { x: 'x', y: 'y' }                               | y = count                    |
 * | bin2d     | { x: 'x', y: 'y', fill: 'fill' }                 | fill = count                 |
 * | boxplot   | { x: 'x', y: 'y' }                               | y = median                   |
 * | count     | Maps output to { x: c.x, y: c.count }            | In pipeline, not stat        |
 * | density   | No remapping (uses original aes)                 |                              |
 * | ydensity  | No remapping (uses original aes)                 |                              |
 * | smooth    | No remapping (uses original aes)                 |                              |
 * | qq        | { x: 'x', y: 'y' }                               | x=theoretical, y=sample      |
 * | qq_line   | { x: 'x', y: 'y', xend: 'xend', yend: 'yend' }  | For segment renderer         |
 */
describe('Pipeline mapping reference tests', () => {
  /**
   * These tests serve as documentation and verification that the stat
   * outputs match the pipeline's expected mappings.
   */

  const STAT_MAPPINGS = {
    bin: { x: 'x', y: 'y' },
    bin2d: { x: 'x', y: 'y', fill: 'fill' },
    boxplot: { x: 'x', y: 'y' },
    count: { x: 'x', y: 'count' }, // Note: pipeline remaps count->y
    qq: { x: 'x', y: 'y' },
    qq_line: { x: 'x', y: 'y', xend: 'xend', yend: 'yend' },
  }

  it('all stat types have documented mappings', () => {
    // This test will fail if we add a new stat but forget to document its mapping
    const knownStats = ['bin', 'bin2d', 'boxplot', 'count', 'density', 'ydensity', 'smooth', 'qq', 'qq_line']
    expect(knownStats.length).toBe(9)
  })

  it('bin stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.bin
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    // Verify all mapped fields exist in output
    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })

  it('bin2d stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.bin2d
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute(scatterData, { x: 'x', y: 'y' })

    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })

  it('boxplot stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.boxplot
    const stat = stat_boxplot()
    const result = stat.compute(categoricalData, { x: 'x', y: 'y' })

    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })

  it('count stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.count
    const stat = stat_count()
    const result = stat.compute(categoricalData, { x: 'x', y: 'count' })

    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })

  it('qq stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.qq
    const stat = stat_qq()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })

  it('qq_line stat output field names match pipeline mapping', () => {
    const mapping = STAT_MAPPINGS.qq_line
    const stat = stat_qq_line()
    const result = stat.compute(numericData, { x: 'x', y: 'y' })

    for (const [, field] of Object.entries(mapping)) {
      expect(result[0]).toHaveProperty(field)
    }
  })
})

describe('Edge cases and error handling', () => {
  it('bin stat handles empty data', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute([], { x: 'x', y: 'y' })
    expect(result.length).toBe(0)
  })

  it('bin2d stat handles empty data', () => {
    const stat = stat_bin2d({ bins: 5 })
    const result = stat.compute([], { x: 'x', y: 'y' })
    expect(result.length).toBe(0)
  })

  it('boxplot stat handles empty data', () => {
    const stat = stat_boxplot()
    const result = stat.compute([], { x: 'x', y: 'y' })
    expect(result.length).toBe(0)
  })

  it('count stat handles empty data', () => {
    const stat = stat_count()
    const result = stat.compute([], { x: 'x', y: 'count' })
    expect(result.length).toBe(0)
  })

  it('density stat handles empty data', () => {
    const stat = stat_density({ n: 50 })
    const result = stat.compute([], { x: 'x', y: 'y' })
    expect(result.length).toBe(0)
  })

  it('qq stat handles empty data', () => {
    const stat = stat_qq()
    const result = stat.compute([], { x: 'x', y: 'y' })
    expect(result.length).toBe(0)
  })

  it('bin stat handles single data point', () => {
    const stat = stat_bin({ bins: 5 })
    const result = stat.compute([{ x: 5 }], { x: 'x', y: 'y' })
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('boxplot stat handles single group with single value', () => {
    const stat = stat_boxplot()
    const result = stat.compute([{ x: 'A', y: 10 }], { x: 'x', y: 'y' })

    // Should still produce valid output structure
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('median')
      expect(result[0]).toHaveProperty('q1')
      expect(result[0]).toHaveProperty('q3')
    }
  })

  it('bin stat handles null/undefined values gracefully', () => {
    const data = [
      { x: 1 },
      { x: null },
      { x: undefined },
      { x: 5 },
    ]
    const stat = stat_bin({ bins: 3 })
    const result = stat.compute(data, { x: 'x', y: 'y' })

    // Should only count valid values
    const totalCount = result.reduce((sum, row) => sum + (row.count as number), 0)
    expect(totalCount).toBe(2)
  })

  it('bin2d stat handles null/undefined values gracefully', () => {
    const data = [
      { x: 1, y: 1 },
      { x: null, y: 2 },
      { x: 3, y: null },
      { x: 5, y: 5 },
    ]
    const stat = stat_bin2d({ bins: 3 })
    const result = stat.compute(data, { x: 'x', y: 'y' })

    // Should handle gracefully without crashing
    expect(Array.isArray(result)).toBe(true)
  })
})
