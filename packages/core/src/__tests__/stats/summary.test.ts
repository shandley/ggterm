/**
 * Tests for stat_summary
 */

import { describe, expect, it } from 'bun:test'
import { stat_summary, computeSummary } from '../../stats/summary'
import { gg, geom_point, geom_pointrange, geom_errorbar, renderToString } from '../../index'

describe('computeSummary', () => {
  const data = [
    { group: 'A', value: 10 },
    { group: 'A', value: 15 },
    { group: 'A', value: 12 },
    { group: 'B', value: 20 },
    { group: 'B', value: 25 },
    { group: 'B', value: 22 },
    { group: 'C', value: 30 },
    { group: 'C', value: 35 },
    { group: 'C', value: 32 },
  ]

  it('should compute mean by default', () => {
    const result = computeSummary(data, 'group', 'value')

    expect(result.length).toBe(3)

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA).toBeDefined()
    expect(groupA!.y).toBeCloseTo((10 + 15 + 12) / 3, 5)
    expect(groupA!.n).toBe(3)

    const groupB = result.find((r) => r.x === 'B')
    expect(groupB!.y).toBeCloseTo((20 + 25 + 22) / 3, 5)

    const groupC = result.find((r) => r.x === 'C')
    expect(groupC!.y).toBeCloseTo((30 + 35 + 32) / 3, 5)
  })

  it('should compute median when specified', () => {
    const result = computeSummary(data, 'group', 'value', { fun: 'median' })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.y).toBe(12) // sorted: 10, 12, 15 -> median is 12

    const groupB = result.find((r) => r.x === 'B')
    expect(groupB!.y).toBe(22) // sorted: 20, 22, 25 -> median is 22
  })

  it('should compute min when specified', () => {
    const result = computeSummary(data, 'group', 'value', { fun: 'min' })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.y).toBe(10)

    const groupB = result.find((r) => r.x === 'B')
    expect(groupB!.y).toBe(20)
  })

  it('should compute max when specified', () => {
    const result = computeSummary(data, 'group', 'value', { fun: 'max' })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.y).toBe(15)

    const groupB = result.find((r) => r.x === 'B')
    expect(groupB!.y).toBe(25)
  })

  it('should compute sum when specified', () => {
    const result = computeSummary(data, 'group', 'value', { fun: 'sum' })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.y).toBe(10 + 15 + 12)

    const groupB = result.find((r) => r.x === 'B')
    expect(groupB!.y).toBe(20 + 25 + 22)
  })

  it('should compute ymin and ymax when specified', () => {
    const result = computeSummary(data, 'group', 'value', {
      fun: 'mean',
      funMin: 'min',
      funMax: 'max',
    })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.ymin).toBe(10)
    expect(groupA!.ymax).toBe(15)
  })

  it('should support custom function', () => {
    const customFun = (values: number[]) => values.length * 100

    const result = computeSummary(data, 'group', 'value', { fun: customFun })

    const groupA = result.find((r) => r.x === 'A')
    expect(groupA!.y).toBe(300) // 3 values * 100
  })

  it('should handle numeric x values', () => {
    const numericData = [
      { x: 1, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
      { x: 2, y: 40 },
    ]

    const result = computeSummary(numericData, 'x', 'y')

    expect(result.length).toBe(2)
    expect(result[0].x).toBe(1)
    expect(result[0].y).toBe(15) // (10+20)/2
    expect(result[1].x).toBe(2)
    expect(result[1].y).toBe(35) // (30+40)/2
  })

  it('should sort results by x', () => {
    const unsortedData = [
      { group: 'C', value: 30 },
      { group: 'A', value: 10 },
      { group: 'B', value: 20 },
    ]

    const result = computeSummary(unsortedData, 'group', 'value')

    expect(result[0].x).toBe('A')
    expect(result[1].x).toBe('B')
    expect(result[2].x).toBe('C')
  })

  it('should filter null and undefined values', () => {
    const dataWithNulls = [
      { group: 'A', value: 10 },
      { group: 'A', value: null },
      { group: 'A', value: undefined },
      { group: 'A', value: 20 },
    ]

    const result = computeSummary(dataWithNulls as any, 'group', 'value')

    expect(result.length).toBe(1)
    expect(result[0].n).toBe(2) // Only 10 and 20 counted
    expect(result[0].y).toBe(15) // (10+20)/2
  })
})

describe('stat_summary presets', () => {
  const data = [
    { group: 'A', value: 10 },
    { group: 'A', value: 12 },
    { group: 'A', value: 14 },
    { group: 'A', value: 16 },
    { group: 'A', value: 18 },
  ]

  it('should compute mean_se preset', () => {
    const result = computeSummary(data, 'group', 'value', { funData: 'mean_se' })

    const groupA = result[0]
    const mean = 14 // (10+12+14+16+18)/5
    expect(groupA.y).toBeCloseTo(mean, 5)
    expect(groupA.ymin).toBeDefined()
    expect(groupA.ymax).toBeDefined()
    // SE should create symmetric bounds around mean
    expect(groupA.y - groupA.ymin!).toBeCloseTo(groupA.ymax! - groupA.y, 5)
  })

  it('should compute mean_sd preset', () => {
    const result = computeSummary(data, 'group', 'value', { funData: 'mean_sd' })

    const groupA = result[0]
    expect(groupA.y).toBeCloseTo(14, 5)
    // SD bounds should be wider than SE bounds
    expect(groupA.ymax! - groupA.ymin!).toBeGreaterThan(0)
  })

  it('should compute mean_cl_normal preset (95% CI)', () => {
    const result = computeSummary(data, 'group', 'value', { funData: 'mean_cl_normal' })

    const groupA = result[0]
    expect(groupA.y).toBeCloseTo(14, 5)
    // 95% CI uses 1.96 * SE, should be wider than 1 * SE
    expect(groupA.ymax! - groupA.y).toBeGreaterThan(0)
  })

  it('should compute median_range preset', () => {
    const result = computeSummary(data, 'group', 'value', { funData: 'median_range' })

    const groupA = result[0]
    expect(groupA.y).toBe(14) // median
    expect(groupA.ymin).toBe(10) // min
    expect(groupA.ymax).toBe(18) // max
  })
})

describe('stat_summary()', () => {
  it('should create a stat object', () => {
    const stat = stat_summary()
    expect(stat.type).toBe('summary')
    expect(typeof stat.compute).toBe('function')
  })

  it('should compute summary with aesthetic mapping', () => {
    const data = [
      { category: 'A', amount: 10 },
      { category: 'A', amount: 20 },
      { category: 'B', amount: 30 },
      { category: 'B', amount: 40 },
    ]

    const stat = stat_summary()
    const result = stat.compute(data, { x: 'category', y: 'amount' })

    expect(result.length).toBe(2)
    expect(result[0].y).toBe(15)
    expect(result[1].y).toBe(35)
  })

  it('should handle color grouping', () => {
    const data = [
      { x: 'A', y: 10, color: 'red' },
      { x: 'A', y: 20, color: 'red' },
      { x: 'A', y: 100, color: 'blue' },
      { x: 'A', y: 200, color: 'blue' },
    ]

    const stat = stat_summary()
    const result = stat.compute(data, { x: 'x', y: 'y', color: 'color' })

    expect(result.length).toBe(2)

    const red = result.find((r) => r.color === 'red')
    expect(red).toBeDefined()
    expect(red!.y).toBe(15) // (10+20)/2

    const blue = result.find((r) => r.color === 'blue')
    expect(blue).toBeDefined()
    expect(blue!.y).toBe(150) // (100+200)/2
  })

  it('should pass params to compute function', () => {
    const data = [
      { x: 'A', y: 10 },
      { x: 'A', y: 20 },
      { x: 'A', y: 30 },
    ]

    const stat = stat_summary({ fun: 'median' })
    const result = stat.compute(data, { x: 'x', y: 'y' })

    expect(result[0].y).toBe(20) // median of 10, 20, 30
  })
})

describe('stat_summary integration', () => {
  const data = [
    { group: 'Control', value: 10 },
    { group: 'Control', value: 12 },
    { group: 'Control', value: 11 },
    { group: 'Treatment', value: 20 },
    { group: 'Treatment', value: 22 },
    { group: 'Treatment', value: 21 },
  ]

  it('should work with geom_point', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'group', y: 'value' })
        .geom(geom_point({ stat: 'summary' }))
        .labs({ title: 'Mean Values' })
        .spec(),
      { width: 40, height: 12 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })

  it('should work with geom_pointrange using mean_se', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'group', y: 'value' })
        .geom(geom_pointrange({ stat: 'summary', funData: 'mean_se' }))
        .labs({ title: 'Mean ± SE' })
        .spec(),
      { width: 40, height: 12 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })

  it('should work with geom_errorbar using mean_sd', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'group', y: 'value' })
        .geom(geom_errorbar({ stat: 'summary', funData: 'mean_sd' }))
        .labs({ title: 'Mean ± SD' })
        .spec(),
      { width: 40, height: 12 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })

  it('should work with color grouping in integration', () => {
    const colorData = [
      { x: 'A', y: 10, condition: 'Control' },
      { x: 'A', y: 12, condition: 'Control' },
      { x: 'A', y: 20, condition: 'Treatment' },
      { x: 'A', y: 22, condition: 'Treatment' },
      { x: 'B', y: 15, condition: 'Control' },
      { x: 'B', y: 17, condition: 'Control' },
      { x: 'B', y: 25, condition: 'Treatment' },
      { x: 'B', y: 27, condition: 'Treatment' },
    ]

    const output = renderToString(
      gg(colorData)
        .aes({ x: 'x', y: 'y', color: 'condition' })
        .geom(geom_point({ stat: 'summary' }))
        .labs({ title: 'Grouped Summary' })
        .spec(),
      { width: 40, height: 12 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })
})
