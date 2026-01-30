/**
 * Tests for geom_beeswarm (beeswarm plots)
 */

import { describe, expect, it } from 'bun:test'
import { stat_beeswarm, computeBeeswarm } from '../../stats/beeswarm'
import { gg } from '../../grammar'
import { geom_beeswarm, geom_quasirandom } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('stat_beeswarm', () => {
  const testData = [
    { group: 'A', value: 10 }, { group: 'A', value: 12 }, { group: 'A', value: 11 },
    { group: 'A', value: 15 }, { group: 'A', value: 13 },
    { group: 'B', value: 20 }, { group: 'B', value: 22 }, { group: 'B', value: 21 },
    { group: 'B', value: 25 }, { group: 'B', value: 23 },
  ]

  it('should create stat transformation', () => {
    const stat = stat_beeswarm()
    expect(stat.type).toBe('beeswarm')
    expect(typeof stat.compute).toBe('function')
  })

  it('should compute beeswarm positions grouped by x', () => {
    const stat = stat_beeswarm()
    const result = stat.compute(testData, { x: 'group', y: 'value' })

    expect(result.length).toBe(10) // Same as input
    // Should have x (with offset), y, xOriginal fields
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('y')
    expect(result[0]).toHaveProperty('xOriginal')
    expect(result[0]).toHaveProperty('xOffset')
  })

  it('should preserve group information in xOriginal', () => {
    const stat = stat_beeswarm()
    const result = stat.compute(testData, { x: 'group', y: 'value' })

    const groupA = result.filter(r => r.xOriginal === 'A')
    const groupB = result.filter(r => r.xOriginal === 'B')

    expect(groupA.length).toBe(5)
    expect(groupB.length).toBe(5)
  })

  it('should compute offsets for each point', () => {
    const stat = stat_beeswarm()
    const result = stat.compute(testData, { x: 'group', y: 'value' })

    // Every point should have an xOffset field
    for (const row of result) {
      expect(typeof row.xOffset).toBe('number')
    }
  })

  it('should handle empty data', () => {
    const stat = stat_beeswarm()
    const result = stat.compute([], { x: 'group', y: 'value' })
    expect(result).toEqual([])
  })

  it('should respect method parameter', () => {
    const swarmStat = stat_beeswarm({ method: 'swarm' })
    const centerStat = stat_beeswarm({ method: 'center' })

    const swarmResult = swarmStat.compute(testData, { x: 'group', y: 'value' })
    const centerResult = centerStat.compute(testData, { x: 'group', y: 'value' })

    // Both should produce valid results with different offset patterns
    expect(swarmResult.length).toBe(10)
    expect(centerResult.length).toBe(10)
  })

  it('should respect side parameter', () => {
    const bothSides = stat_beeswarm({ side: 0 })
    const rightOnly = stat_beeswarm({ side: 1 })
    const leftOnly = stat_beeswarm({ side: -1 })

    const bothResult = bothSides.compute(testData, { x: 'group', y: 'value' })
    const rightResult = rightOnly.compute(testData, { x: 'group', y: 'value' })
    const leftResult = leftOnly.compute(testData, { x: 'group', y: 'value' })

    // Right-only should have non-negative offsets
    const rightOffsets = rightResult.map(r => r.xOffset as number)
    expect(rightOffsets.every(o => o >= 0 || Math.abs(o) < 0.001)).toBe(true)

    // Left-only should have non-positive offsets
    const leftOffsets = leftResult.map(r => r.xOffset as number)
    expect(leftOffsets.every(o => o <= 0 || Math.abs(o) < 0.001)).toBe(true)
  })
})

describe('computeBeeswarm', () => {
  it('should compute positions for a single group', () => {
    const data = [
      { value: 10 }, { value: 12 }, { value: 11 },
      { value: 15 }, { value: 13 },
    ]

    const result = computeBeeswarm(data, 'group', 'value', 'A', 0)

    expect(result.length).toBe(5)
    expect(result[0].xOriginal).toBe('A')
    expect(result[0].y).toBe(10) // Original y value preserved
  })

  it('should return empty array for empty data', () => {
    const result = computeBeeswarm([], 'group', 'value', 'A', 0)
    expect(result).toEqual([])
  })
})

describe('geom_beeswarm', () => {
  it('should create beeswarm geom with defaults', () => {
    const geom = geom_beeswarm()
    expect(geom.type).toBe('beeswarm')
    expect(geom.stat).toBe('beeswarm')
    expect(geom.params.method).toBe('swarm')
    expect(geom.params.size).toBe(1)
    expect(geom.params.alpha).toBe(1)
  })

  it('should accept custom options', () => {
    const geom = geom_beeswarm({
      method: 'center',
      size: 2,
      alpha: 0.7,
      color: '#ff0000',
      side: 1,
    })
    expect(geom.params.method).toBe('center')
    expect(geom.params.size).toBe(2)
    expect(geom.params.alpha).toBe(0.7)
    expect(geom.params.color).toBe('#ff0000')
    expect(geom.params.side).toBe(1)
  })

  it('should have quasirandom alias', () => {
    const beeswarm = geom_beeswarm({ method: 'center' })
    const quasirandom = geom_quasirandom()
    expect(beeswarm.type).toBe(quasirandom.type)
    expect(quasirandom.params.method).toBe('center')
  })
})

describe('beeswarm rendering', () => {
  const testData = [
    { group: 'A', value: 10 }, { group: 'A', value: 12 }, { group: 'A', value: 11 },
    { group: 'A', value: 15 }, { group: 'A', value: 13 },
    { group: 'B', value: 20 }, { group: 'B', value: 22 }, { group: 'B', value: 21 },
    { group: 'B', value: 25 }, { group: 'B', value: 23 },
    { group: 'C', value: 30 }, { group: 'C', value: 32 }, { group: 'C', value: 31 },
  ]

  it('should render beeswarm plot', () => {
    const spec = gg(testData)
      .aes({ x: 'group', y: 'value' })
      .geom(geom_beeswarm())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(60)
    expect(canvas.height).toBe(20)
  })

  it('should render with title', () => {
    const spec = gg(testData)
      .aes({ x: 'group', y: 'value' })
      .geom(geom_beeswarm())
      .labs({ title: 'Beeswarm Plot' })
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render with custom method', () => {
    const spec = gg(testData)
      .aes({ x: 'group', y: 'value' })
      .geom(geom_beeswarm({ method: 'center' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render quasirandom alias', () => {
    const spec = gg(testData)
      .aes({ x: 'group', y: 'value' })
      .geom(geom_quasirandom())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })
})
