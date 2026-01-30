/**
 * Tests for geom_ridgeline (joy plots)
 */

import { describe, expect, it } from 'bun:test'
import { stat_xdensity } from '../../stats/density'
import { gg } from '../../grammar'
import { geom_ridgeline, geom_joy } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('stat_xdensity', () => {
  const monthlyData = [
    { month: 'Jan', temp: 30 }, { month: 'Jan', temp: 32 }, { month: 'Jan', temp: 35 },
    { month: 'Feb', temp: 38 }, { month: 'Feb', temp: 40 }, { month: 'Feb', temp: 42 },
    { month: 'Mar', temp: 50 }, { month: 'Mar', temp: 52 }, { month: 'Mar', temp: 55 },
  ]

  it('should create stat transformation', () => {
    const stat = stat_xdensity()
    expect(stat.type).toBe('xdensity')
    expect(typeof stat.compute).toBe('function')
  })

  it('should compute density grouped by y', () => {
    const stat = stat_xdensity({ n: 10 })
    const result = stat.compute(monthlyData, { x: 'temp', y: 'month' })

    expect(result.length).toBeGreaterThan(0)
    // Should have x, y, density fields
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('y')
    expect(result[0]).toHaveProperty('density')
    expect(result[0]).toHaveProperty('scaled')
  })

  it('should preserve group information', () => {
    const stat = stat_xdensity({ n: 10 })
    const result = stat.compute(monthlyData, { x: 'temp', y: 'month' })

    const groups = new Set(result.map(r => r.y))
    expect(groups.has('Jan')).toBe(true)
    expect(groups.has('Feb')).toBe(true)
    expect(groups.has('Mar')).toBe(true)
  })

  it('should handle empty data', () => {
    const stat = stat_xdensity()
    const result = stat.compute([], { x: 'temp', y: 'month' })
    expect(result).toEqual([])
  })
})

describe('geom_ridgeline', () => {
  it('should create ridgeline geom with defaults', () => {
    const geom = geom_ridgeline()
    expect(geom.type).toBe('ridgeline')
    expect(geom.stat).toBe('xdensity')
    expect(geom.params.scale).toBe(0.9)
    expect(geom.params.alpha).toBe(0.8)
  })

  it('should accept custom options', () => {
    const geom = geom_ridgeline({
      scale: 1.5,
      alpha: 0.6,
      fill: '#ff0000',
      color: '#000000',
    })
    expect(geom.params.scale).toBe(1.5)
    expect(geom.params.alpha).toBe(0.6)
    expect(geom.params.fill).toBe('#ff0000')
    expect(geom.params.color).toBe('#000000')
  })

  it('should have joy alias', () => {
    const ridgeline = geom_ridgeline()
    const joy = geom_joy()
    expect(ridgeline.type).toBe(joy.type)
    expect(ridgeline.stat).toBe(joy.stat)
  })
})

describe('ridgeline rendering', () => {
  const monthlyData = [
    { month: 'Jan', temp: 30 }, { month: 'Jan', temp: 32 }, { month: 'Jan', temp: 35 },
    { month: 'Jan', temp: 31 }, { month: 'Jan', temp: 33 },
    { month: 'Feb', temp: 38 }, { month: 'Feb', temp: 40 }, { month: 'Feb', temp: 42 },
    { month: 'Feb', temp: 39 }, { month: 'Feb', temp: 41 },
    { month: 'Mar', temp: 50 }, { month: 'Mar', temp: 52 }, { month: 'Mar', temp: 55 },
    { month: 'Mar', temp: 51 }, { month: 'Mar', temp: 53 },
  ]

  it('should render ridgeline plot', () => {
    const spec = gg(monthlyData)
      .aes({ x: 'temp', y: 'month' })
      .geom(geom_ridgeline())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(60)
    expect(canvas.height).toBe(20)
  })

  it('should render with title', () => {
    const spec = gg(monthlyData)
      .aes({ x: 'temp', y: 'month' })
      .geom(geom_ridgeline())
      .labs({ title: 'Monthly Temperature Distribution' })
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render with custom scale', () => {
    const spec = gg(monthlyData)
      .aes({ x: 'temp', y: 'month' })
      .geom(geom_ridgeline({ scale: 1.5 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })
})
