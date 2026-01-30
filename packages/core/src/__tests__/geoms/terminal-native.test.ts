/**
 * Tests for terminal-native geoms: waffle, sparkline, bullet, braille
 */

import { describe, test, expect } from 'bun:test'
import {
  gg,
  geom_waffle,
  geom_sparkline,
  geom_bullet,
  geom_braille,
  SPARK_BARS,
  SPARK_DOTS,
  BRAILLE_BASE,
  BRAILLE_DOTS,
} from '../../index'

describe('geom_waffle', () => {
  const marketShareData = [
    { company: 'Apple', share: 45 },
    { company: 'Samsung', share: 30 },
    { company: 'Other', share: 25 },
  ]

  test('creates waffle geom with correct type', () => {
    const geom = geom_waffle()
    expect(geom.type).toBe('waffle')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_waffle()
    expect(geom.params.rows).toBe(10)
    expect(geom.params.cols).toBe(10)
    expect(geom.params.n_total).toBe(100)
    expect(geom.params.fill_char).toBe('█')
    expect(geom.params.empty_char).toBe('░')
    expect(geom.params.show_legend).toBe(true)
  })

  test('accepts custom parameters', () => {
    const geom = geom_waffle({
      rows: 5,
      cols: 20,
      fill_char: '◼',
      empty_char: '◻',
      show_legend: false,
      flip: true,
      gap: 1,
    })
    expect(geom.params.rows).toBe(5)
    expect(geom.params.cols).toBe(20)
    expect(geom.params.fill_char).toBe('◼')
    expect(geom.params.empty_char).toBe('◻')
    expect(geom.params.show_legend).toBe(false)
    expect(geom.params.flip).toBe(true)
    expect(geom.params.gap).toBe(1)
  })

  test('renders without error', () => {
    const plot = gg(marketShareData)
      .aes({ fill: 'company', y: 'share' })
      .geom(geom_waffle())

    const result = plot.render({ width: 50, height: 15 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('integrates with gg() fluent API', () => {
    const plot = gg(marketShareData)
      .aes({ fill: 'company', y: 'share' })
      .geom(geom_waffle())
      .labs({ title: 'Market Share' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('waffle')
  })
})

describe('geom_sparkline', () => {
  const trendData = [
    { month: 1, value: 10 },
    { month: 2, value: 15 },
    { month: 3, value: 12 },
    { month: 4, value: 20 },
    { month: 5, value: 18 },
    { month: 6, value: 25 },
  ]

  test('creates sparkline geom with correct type', () => {
    const geom = geom_sparkline()
    expect(geom.type).toBe('sparkline')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_sparkline()
    expect(geom.params.sparkType).toBe('bar')
    expect(geom.params.width).toBe(20)
    expect(geom.params.height).toBe(1)
    expect(geom.params.show_minmax).toBe(false)
    expect(geom.params.normalize).toBe(true)
  })

  test('accepts custom parameters', () => {
    const geom = geom_sparkline({
      type: 'line',
      width: 30,
      height: 2,
      show_minmax: true,
      color: '#ff0000',
      min_color: '#00ff00',
      max_color: '#0000ff',
    })
    expect(geom.params.sparkType).toBe('line')
    expect(geom.params.width).toBe(30)
    expect(geom.params.show_minmax).toBe(true)
    expect(geom.params.color).toBe('#ff0000')
  })

  test('renders without error', () => {
    const plot = gg(trendData)
      .aes({ x: 'month', y: 'value' })
      .geom(geom_sparkline())

    const result = plot.render({ width: 50, height: 5 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  test('exports spark character arrays', () => {
    expect(SPARK_BARS).toHaveLength(8)
    expect(SPARK_BARS[0]).toBe('▁')
    expect(SPARK_BARS[7]).toBe('█')

    expect(SPARK_DOTS).toHaveLength(8)
    expect(SPARK_DOTS[0]).toBe('⠀')
  })

  test('integrates with gg() fluent API', () => {
    const plot = gg(trendData)
      .aes({ x: 'month', y: 'value' })
      .geom(geom_sparkline())
      .labs({ title: 'Trend' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('sparkline')
  })
})

describe('geom_bullet', () => {
  const kpiData = [
    { metric: 'Revenue', value: 85, target: 90, max: 100 },
    { metric: 'Profit', value: 70, target: 80, max: 100 },
    { metric: 'Growth', value: 95, target: 75, max: 100 },
  ]

  test('creates bullet geom with correct type', () => {
    const geom = geom_bullet()
    expect(geom.type).toBe('bullet')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_bullet()
    expect(geom.params.width).toBe(40)
    expect(geom.params.height).toBe(1)
    expect(geom.params.target_char).toBe('│')
    expect(geom.params.bar_char).toBe('█')
    expect(geom.params.range_chars).toEqual(['░', '▒', '▓'])
    expect(geom.params.show_values).toBe(true)
    expect(geom.params.orientation).toBe('horizontal')
  })

  test('accepts custom parameters', () => {
    const geom = geom_bullet({
      width: 50,
      target_char: '|',
      bar_char: '▰',
      show_values: false,
      target_color: '#ff0000',
    })
    expect(geom.params.width).toBe(50)
    expect(geom.params.target_char).toBe('|')
    expect(geom.params.bar_char).toBe('▰')
    expect(geom.params.show_values).toBe(false)
  })

  test('renders without error', () => {
    const plot = gg(kpiData)
      .aes({ x: 'metric', y: 'value' })
      .geom(geom_bullet())

    const result = plot.render({ width: 60, height: 10 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  test('integrates with gg() fluent API', () => {
    const plot = gg(kpiData)
      .aes({ x: 'metric', y: 'value' })
      .geom(geom_bullet())
      .labs({ title: 'KPI Dashboard' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('bullet')
  })
})

describe('geom_braille', () => {
  const scatterData = Array.from({ length: 50 }, (_, i) => ({
    x: Math.sin(i * 0.2) * 10 + 10,
    y: Math.cos(i * 0.2) * 10 + 10,
  }))

  test('creates braille geom with correct type', () => {
    const geom = geom_braille()
    expect(geom.type).toBe('braille')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_braille()
    expect(geom.params.brailleType).toBe('point')
    expect(geom.params.fill).toBe(false)
    expect(geom.params.alpha).toBe(1)
    expect(geom.params.dot_size).toBe(1)
  })

  test('accepts custom parameters', () => {
    const geom = geom_braille({
      type: 'line',
      color: '#00ff00',
      fill: true,
      alpha: 0.8,
      dot_size: 2,
    })
    expect(geom.params.brailleType).toBe('line')
    expect(geom.params.color).toBe('#00ff00')
    expect(geom.params.fill).toBe(true)
    expect(geom.params.alpha).toBe(0.8)
    expect(geom.params.dot_size).toBe(2)
  })

  test('renders without error', () => {
    const plot = gg(scatterData)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_braille())

    const result = plot.render({ width: 50, height: 15 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  test('renders line type without error', () => {
    const lineData = Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.5) * 5 + 5,
    }))

    const plot = gg(lineData)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_braille({ type: 'line' }))

    const result = plot.render({ width: 50, height: 10 })
    expect(result).toBeTruthy()
  })

  test('exports braille constants', () => {
    expect(BRAILLE_BASE).toBe(0x2800)
    expect(BRAILLE_DOTS).toHaveLength(2) // 2 columns
    expect(BRAILLE_DOTS[0]).toHaveLength(4) // 4 rows each
    expect(BRAILLE_DOTS[1]).toHaveLength(4)
  })

  test('integrates with gg() fluent API', () => {
    const plot = gg(scatterData)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_braille())
      .labs({ title: 'Braille Scatter' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('braille')
  })
})

describe('terminal-native geoms comparison', () => {
  test('all four geoms have unique types', () => {
    const types = new Set([
      geom_waffle().type,
      geom_sparkline().type,
      geom_bullet().type,
      geom_braille().type,
    ])
    expect(types.size).toBe(4)
  })

  test('all use identity stat and position', () => {
    const geoms = [geom_waffle(), geom_sparkline(), geom_bullet(), geom_braille()]

    for (const geom of geoms) {
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
    }
  })
})
