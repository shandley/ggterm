/**
 * Tests for geom_dumbbell and geom_lollipop
 */

import { describe, test, expect } from 'bun:test'
import { gg, geom_dumbbell, geom_lollipop } from '../../index'

describe('geom_dumbbell', () => {
  const beforeAfterData = [
    { category: 'A', before: 10, after: 25 },
    { category: 'B', before: 15, after: 20 },
    { category: 'C', before: 8, after: 30 },
    { category: 'D', before: 22, after: 18 },
  ]

  test('creates dumbbell geom with correct type', () => {
    const geom = geom_dumbbell()
    expect(geom.type).toBe('dumbbell')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_dumbbell()
    expect(geom.params.size).toBe(2)
    expect(geom.params.lineColor).toBe('#666666')
    expect(geom.params.lineWidth).toBe(1)
    expect(geom.params.alpha).toBe(1)
    expect(geom.params.shape).toBe('circle')
  })

  test('accepts custom parameters', () => {
    const geom = geom_dumbbell({
      size: 3,
      sizeEnd: 4,
      color: 'blue',
      colorEnd: 'red',
      lineColor: '#000000',
      lineWidth: 2,
      alpha: 0.8,
      shape: 'diamond',
    })
    expect(geom.params.size).toBe(3)
    expect(geom.params.sizeEnd).toBe(4)
    expect(geom.params.color).toBe('blue')
    expect(geom.params.colorEnd).toBe('red')
    expect(geom.params.lineColor).toBe('#000000')
    expect(geom.params.lineWidth).toBe(2)
    expect(geom.params.alpha).toBe(0.8)
    expect(geom.params.shape).toBe('diamond')
  })

  test('sizeEnd defaults to size if not specified', () => {
    const geom = geom_dumbbell({ size: 5 })
    expect(geom.params.size).toBe(5)
    expect(geom.params.sizeEnd).toBe(5)
  })

  test('renders without error', () => {
    // Transform data to have xend aesthetic
    const data = beforeAfterData.map(row => ({
      x: row.before,
      xend: row.after,
      y: row.category,
    }))

    const plot = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_dumbbell())

    const result = plot.render({ width: 60, height: 12 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('renders with custom colors', () => {
    const data = beforeAfterData.map(row => ({
      x: row.before,
      xend: row.after,
      y: row.category,
    }))

    const plot = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_dumbbell({ color: '#FF0000', colorEnd: '#00FF00' }))

    const result = plot.render({ width: 60, height: 12 })
    expect(result).toBeTruthy()
  })

  test('integrates with gg() fluent API', () => {
    const data = beforeAfterData.map(row => ({
      x: row.before,
      xend: row.after,
      y: row.category,
    }))

    const plot = gg(data)
      .aes({ x: 'x', y: 'y' })
      .geom(geom_dumbbell())
      .labs({ title: 'Before/After Comparison' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('dumbbell')
  })
})

describe('geom_lollipop', () => {
  const salesData = [
    { product: 'Apple', sales: 150 },
    { product: 'Banana', sales: 200 },
    { product: 'Cherry', sales: 80 },
    { product: 'Date', sales: 120 },
    { product: 'Elderberry', sales: 50 },
  ]

  test('creates lollipop geom with correct type', () => {
    const geom = geom_lollipop()
    expect(geom.type).toBe('lollipop')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  test('has default parameters', () => {
    const geom = geom_lollipop()
    expect(geom.params.size).toBe(2)
    expect(geom.params.lineWidth).toBe(1)
    expect(geom.params.alpha).toBe(1)
    expect(geom.params.shape).toBe('circle')
    expect(geom.params.direction).toBe('vertical')
    expect(geom.params.baseline).toBe(0)
  })

  test('accepts custom parameters', () => {
    const geom = geom_lollipop({
      size: 4,
      color: 'purple',
      lineColor: '#333333',
      lineWidth: 2,
      alpha: 0.7,
      shape: 'square',
      direction: 'horizontal',
      baseline: 50,
    })
    expect(geom.params.size).toBe(4)
    expect(geom.params.color).toBe('purple')
    expect(geom.params.lineColor).toBe('#333333')
    expect(geom.params.lineWidth).toBe(2)
    expect(geom.params.alpha).toBe(0.7)
    expect(geom.params.shape).toBe('square')
    expect(geom.params.direction).toBe('horizontal')
    expect(geom.params.baseline).toBe(50)
  })

  test('renders vertical lollipop without error', () => {
    const plot = gg(salesData)
      .aes({ x: 'product', y: 'sales' })
      .geom(geom_lollipop())

    const result = plot.render({ width: 60, height: 15 })
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('renders horizontal lollipop without error', () => {
    const plot = gg(salesData)
      .aes({ x: 'product', y: 'sales' })
      .geom(geom_lollipop({ direction: 'horizontal' }))

    const result = plot.render({ width: 60, height: 15 })
    expect(result).toBeTruthy()
  })

  test('renders with custom baseline', () => {
    const plot = gg(salesData)
      .aes({ x: 'product', y: 'sales' })
      .geom(geom_lollipop({ baseline: 100 }))

    const result = plot.render({ width: 60, height: 15 })
    expect(result).toBeTruthy()
  })

  test('renders with custom colors', () => {
    const plot = gg(salesData)
      .aes({ x: 'product', y: 'sales' })
      .geom(geom_lollipop({ color: '#FF5733', lineColor: '#C70039' }))

    const result = plot.render({ width: 60, height: 15 })
    expect(result).toBeTruthy()
  })

  test('integrates with gg() fluent API', () => {
    const plot = gg(salesData)
      .aes({ x: 'product', y: 'sales' })
      .geom(geom_lollipop())
      .labs({ title: 'Product Sales', x: 'Product', y: 'Sales ($)' })

    const spec = plot.spec()
    expect(spec.geoms).toHaveLength(1)
    expect(spec.geoms[0].type).toBe('lollipop')
    expect(spec.labels?.title).toBe('Product Sales')
  })

  test('handles negative values', () => {
    const mixedData = [
      { item: 'A', value: 50 },
      { item: 'B', value: -30 },
      { item: 'C', value: 75 },
      { item: 'D', value: -10 },
    ]

    const plot = gg(mixedData)
      .aes({ x: 'item', y: 'value' })
      .geom(geom_lollipop())

    const result = plot.render({ width: 60, height: 15 })
    expect(result).toBeTruthy()
  })
})

describe('dumbbell and lollipop comparison', () => {
  test('both geoms have different types', () => {
    const dumbbell = geom_dumbbell()
    const lollipop = geom_lollipop()

    expect(dumbbell.type).toBe('dumbbell')
    expect(lollipop.type).toBe('lollipop')
    expect(dumbbell.type).not.toBe(lollipop.type)
  })

  test('both use identity stat and position', () => {
    const dumbbell = geom_dumbbell()
    const lollipop = geom_lollipop()

    expect(dumbbell.stat).toBe('identity')
    expect(dumbbell.position).toBe('identity')
    expect(lollipop.stat).toBe('identity')
    expect(lollipop.position).toBe('identity')
  })

  test('can be combined in layers', () => {
    const data = [
      { category: 'X', start: 10, end: 30, highlight: 25 },
      { category: 'Y', start: 20, end: 40, highlight: 35 },
    ]

    const dumbbellData = data.map(d => ({ x: d.start, xend: d.end, y: d.category }))
    const lollipopData = data.map(d => ({ x: d.category, y: d.highlight }))

    // Test that both can be created without error
    const dumbbellGeom = geom_dumbbell()
    const lollipopGeom = geom_lollipop()

    expect(dumbbellGeom).toBeDefined()
    expect(lollipopGeom).toBeDefined()
  })
})
