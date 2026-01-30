/**
 * Tests for specialized visualization geoms:
 * - geom_calendar (GitHub-style heatmap)
 * - geom_flame (flame graph / icicle chart)
 * - geom_corrmat (correlation matrix)
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_calendar } from '../../geoms/calendar'
import { geom_flame, geom_icicle } from '../../geoms/flame'
import { geom_corrmat } from '../../geoms/corrmat'

describe('geom_calendar', () => {
  it('should create a calendar geom with default parameters', () => {
    const geom = geom_calendar()
    expect(geom.type).toBe('calendar')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
    expect(geom.params.cell_char).toBe('█')
    expect(geom.params.empty_char).toBe('░')
    expect(geom.params.levels).toBe(5)
    expect(geom.params.show_months).toBe(true)
    expect(geom.params.show_days).toBe(true)
    expect(geom.params.week_start).toBe(0)
  })

  it('should accept custom options', () => {
    const geom = geom_calendar({
      cell_char: '●',
      levels: 4,
      week_start: 1,
      show_months: false,
    })
    expect(geom.params.cell_char).toBe('●')
    expect(geom.params.levels).toBe(4)
    expect(geom.params.week_start).toBe(1)
    expect(geom.params.show_months).toBe(false)
  })

  it('should render with date data', () => {
    const data = []
    const startDate = new Date('2025-01-01')
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 10),
      })
    }

    const plot = gg(data)
      .aes({ x: 'date', fill: 'value' })
      .geom(geom_calendar())

    const output = plot.render({ width: 80, height: 15 })

    expect(output).toBeDefined()
    expect(typeof output).toBe('string')
    expect(output.length).toBeGreaterThan(0)
  })

  it('should handle custom colors', () => {
    const geom = geom_calendar({
      empty_color: '#000000',
      fill_color: '#00ff00',
    })
    expect(geom.params.empty_color).toBe('#000000')
    expect(geom.params.fill_color).toBe('#00ff00')
  })
})

describe('geom_flame', () => {
  it('should create a flame geom with default parameters', () => {
    const geom = geom_flame()
    expect(geom.type).toBe('flame')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
    expect(geom.params.style).toBe('flame')
    expect(geom.params.palette).toBe('warm')
    expect(geom.params.show_labels).toBe(true)
    expect(geom.params.sort).toBe('alpha')
    expect(geom.params.bar_char).toBe('█')
  })

  it('should accept custom options', () => {
    const geom = geom_flame({
      style: 'icicle',
      palette: 'cool',
      show_labels: false,
      min_label_width: 15,
      sort: 'value',
    })
    expect(geom.params.style).toBe('icicle')
    expect(geom.params.palette).toBe('cool')
    expect(geom.params.show_labels).toBe(false)
    expect(geom.params.min_label_width).toBe(15)
    expect(geom.params.sort).toBe('value')
  })

  it('should render flame graph with stack data', () => {
    const data = [
      { name: 'main', depth: 0, value: 100, start: 0 },
      { name: 'foo', depth: 1, value: 40, start: 0 },
      { name: 'bar', depth: 1, value: 30, start: 40 },
      { name: 'baz', depth: 1, value: 30, start: 70 },
    ]

    const plot = gg(data)
      .aes({ x: 'name', y: 'depth', fill: 'value' })
      .geom(geom_flame())

    const output = plot.render({ width: 80, height: 15 })

    expect(output).toBeDefined()
    expect(typeof output).toBe('string')
    expect(output.length).toBeGreaterThan(0)
    // Should contain function names as labels
    expect(output).toContain('main')
  })

  it('should create icicle chart as flame with icicle style', () => {
    const geom = geom_icicle()
    expect(geom.type).toBe('flame')
    expect(geom.params.style).toBe('icicle')
  })

  it('should pass through options to icicle', () => {
    const geom = geom_icicle({ palette: 'hot', show_labels: false })
    expect(geom.params.style).toBe('icicle')
    expect(geom.params.palette).toBe('hot')
    expect(geom.params.show_labels).toBe(false)
  })
})

describe('geom_corrmat', () => {
  it('should create a corrmat geom with default parameters', () => {
    const geom = geom_corrmat()
    expect(geom.type).toBe('corrmat')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
    expect(geom.params.show_values).toBe(true)
    expect(geom.params.decimals).toBe(2)
    expect(geom.params.show_significance).toBe(false)
    expect(geom.params.sig_threshold).toBe(0.05)
    expect(geom.params.positive_color).toBe('#2166ac')
    expect(geom.params.negative_color).toBe('#b2182b')
    expect(geom.params.neutral_color).toBe('#f7f7f7')
    expect(geom.params.method).toBe('pearson')
  })

  it('should accept custom options', () => {
    const geom = geom_corrmat({
      show_values: false,
      decimals: 3,
      show_significance: true,
      sig_marker: '**',
      lower_triangle: true,
      method: 'spearman',
    })
    expect(geom.params.show_values).toBe(false)
    expect(geom.params.decimals).toBe(3)
    expect(geom.params.show_significance).toBe(true)
    expect(geom.params.sig_marker).toBe('**')
    expect(geom.params.lower_triangle).toBe(true)
    expect(geom.params.method).toBe('spearman')
  })

  it('should render correlation matrix with pre-computed data', () => {
    const data = [
      { var1: 'A', var2: 'A', correlation: 1.0 },
      { var1: 'A', var2: 'B', correlation: 0.8 },
      { var1: 'A', var2: 'C', correlation: -0.3 },
      { var1: 'B', var2: 'A', correlation: 0.8 },
      { var1: 'B', var2: 'B', correlation: 1.0 },
      { var1: 'B', var2: 'C', correlation: 0.4 },
      { var1: 'C', var2: 'A', correlation: -0.3 },
      { var1: 'C', var2: 'B', correlation: 0.4 },
      { var1: 'C', var2: 'C', correlation: 1.0 },
    ]

    const plot = gg(data)
      .aes({ x: 'var1', y: 'var2', fill: 'correlation' })
      .geom(geom_corrmat())

    const output = plot.render({ width: 60, height: 20 })

    expect(output).toBeDefined()
    expect(typeof output).toBe('string')
    expect(output.length).toBeGreaterThan(0)
    // Should contain correlation values
    expect(output).toContain('1.00')
    expect(output).toContain('0.80')
  })

  it('should handle triangle options', () => {
    const lowerGeom = geom_corrmat({ lower_triangle: true })
    const upperGeom = geom_corrmat({ upper_triangle: true })

    expect(lowerGeom.params.lower_triangle).toBe(true)
    expect(lowerGeom.params.upper_triangle).toBe(false)
    expect(upperGeom.params.upper_triangle).toBe(true)
    expect(upperGeom.params.lower_triangle).toBe(false)
  })

  it('should handle diagonal option', () => {
    const noDialGeom = geom_corrmat({ show_diagonal: false })
    expect(noDialGeom.params.show_diagonal).toBe(false)
  })

  it('should accept custom colors', () => {
    const geom = geom_corrmat({
      positive_color: '#0000ff',
      negative_color: '#ff0000',
      neutral_color: '#ffffff',
    })
    expect(geom.params.positive_color).toBe('#0000ff')
    expect(geom.params.negative_color).toBe('#ff0000')
    expect(geom.params.neutral_color).toBe('#ffffff')
  })
})

describe('specialized visualization integration', () => {
  it('should all three geoms be importable from main index', async () => {
    const { geom_calendar, geom_flame, geom_icicle, geom_corrmat } = await import('../../index')

    expect(typeof geom_calendar).toBe('function')
    expect(typeof geom_flame).toBe('function')
    expect(typeof geom_icicle).toBe('function')
    expect(typeof geom_corrmat).toBe('function')
  })

  it('should render all three geoms without error', () => {
    // Calendar
    const calendarData = [
      { date: '2025-01-01', value: 5 },
      { date: '2025-01-02', value: 3 },
      { date: '2025-01-03', value: 7 },
    ]
    const calendarPlot = gg(calendarData)
      .aes({ x: 'date', fill: 'value' })
      .geom(geom_calendar())
    expect(() => calendarPlot.render({ width: 60, height: 10 })).not.toThrow()

    // Flame
    const flameData = [
      { name: 'root', depth: 0, value: 100 },
      { name: 'child', depth: 1, value: 50 },
    ]
    const flamePlot = gg(flameData)
      .aes({ x: 'name', y: 'depth', fill: 'value' })
      .geom(geom_flame())
    expect(() => flamePlot.render({ width: 60, height: 10 })).not.toThrow()

    // Corrmat
    const corrData = [
      { var1: 'X', var2: 'X', correlation: 1 },
      { var1: 'X', var2: 'Y', correlation: 0.5 },
      { var1: 'Y', var2: 'X', correlation: 0.5 },
      { var1: 'Y', var2: 'Y', correlation: 1 },
    ]
    const corrPlot = gg(corrData)
      .aes({ x: 'var1', y: 'var2', fill: 'correlation' })
      .geom(geom_corrmat())
    expect(() => corrPlot.render({ width: 60, height: 15 })).not.toThrow()
  })
})
