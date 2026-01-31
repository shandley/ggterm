/**
 * Tests for geom_qq and geom_freqpoly
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_qq } from '../../geoms/qq'
import { geom_freqpoly, geom_histogram } from '../../geoms/histogram'
import { renderToCanvas } from '../../pipeline'

describe('geom_qq', () => {
  it('should create Q-Q plot geom', () => {
    const geom = geom_qq()
    expect(geom.type).toBe('qq')
    expect(geom.stat).toBe('identity')
  })

  it('should accept distribution option', () => {
    const geom = geom_qq({ distribution: 'uniform' })
    expect(geom.params?.distribution).toBe('uniform')
  })

  it('should accept show_line option', () => {
    const geom = geom_qq({ show_line: false })
    expect(geom.params?.show_line).toBe(false)
  })

  it('should render Q-Q plot', () => {
    // Generate some roughly normal data
    const data = Array.from({ length: 50 }, (_, i) => ({
      value: (i - 25) / 10 + Math.sin(i) * 0.3,
    }))

    const spec = gg(data)
      .aes({ x: 'value' })
      .geom(geom_qq())
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render Q-Q plot with reference line', () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      value: (i - 15) / 5,
    }))

    const spec = gg(data)
      .aes({ x: 'value' })
      .geom(geom_qq({ show_line: true }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })
})

describe('geom_freqpoly', () => {
  it('should create frequency polygon geom', () => {
    const geom = geom_freqpoly()
    expect(geom.type).toBe('freqpoly')
    expect(geom.stat).toBe('bin')
  })

  it('should accept bins option', () => {
    const geom = geom_freqpoly({ bins: 15 })
    expect(geom.params.bins).toBe(15)
  })

  it('should render frequency polygon', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      value: Math.sin(i / 10) * 10 + 20,
    }))

    const spec = gg(data)
      .aes({ x: 'value', y: 'value' })
      .geom(geom_freqpoly({ bins: 20 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should support multiple distributions with color', () => {
    const data = [
      ...Array.from({ length: 50 }, () => ({ value: Math.random() * 10, group: 'A' })),
      ...Array.from({ length: 50 }, () => ({ value: Math.random() * 10 + 5, group: 'B' })),
    ]

    const spec = gg(data)
      .aes({ x: 'value', y: 'value', color: 'group' })
      .geom(geom_freqpoly({ bins: 15 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 20 })
    expect(canvas).toBeDefined()
  })
})

describe('freqpoly edge cases', () => {
  it('should handle empty data', () => {
    const spec = gg([])
      .aes({ x: 'value', y: 'value' })
      .geom(geom_freqpoly())
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 15 })
    expect(canvas).toBeDefined()
  })

  it('should handle single data point', () => {
    const data = [{ value: 5 }]

    const spec = gg(data)
      .aes({ x: 'value', y: 'value' })
      .geom(geom_freqpoly({ bins: 10 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 15 })
    expect(canvas).toBeDefined()
  })

  it('should handle all identical values', () => {
    const data = Array.from({ length: 20 }, () => ({ value: 5 }))

    const spec = gg(data)
      .aes({ x: 'value', y: 'value' })
      .geom(geom_freqpoly({ bins: 10 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 15 })
    expect(canvas).toBeDefined()
  })
})

describe('freqpoly vs histogram comparison', () => {
  it('both should work on same data', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      value: i % 20,
    }))

    // Histogram
    const histSpec = gg(data)
      .aes({ x: 'value', y: 'value' })
      .geom(geom_histogram({ bins: 10 }))
      .spec()

    const histCanvas = renderToCanvas(histSpec, { width: 40, height: 15 })
    expect(histCanvas).toBeDefined()

    // Freqpoly
    const freqSpec = gg(data)
      .aes({ x: 'value', y: 'value' })
      .geom(geom_freqpoly({ bins: 10 }))
      .spec()

    const freqCanvas = renderToCanvas(freqSpec, { width: 40, height: 15 })
    expect(freqCanvas).toBeDefined()
  })
})
