/**
 * Tests for geom_upset
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_upset } from '../../geoms/upset'
import { renderToCanvas } from '../../pipeline'

describe('geom_upset', () => {
  it('should create upset geom', () => {
    const geom = geom_upset()
    expect(geom.type).toBe('upset')
    expect(geom.stat).toBe('identity')
  })

  it('should accept sets option', () => {
    const geom = geom_upset({ sets: ['A', 'B', 'C'] })
    expect(geom.params?.sets).toEqual(['A', 'B', 'C'])
  })

  it('should accept min_size option', () => {
    const geom = geom_upset({ min_size: 5 })
    expect(geom.params?.min_size).toBe(5)
  })

  it('should accept sort_by option', () => {
    const geom = geom_upset({ sort_by: 'degree' })
    expect(geom.params?.sort_by).toBe('degree')
  })

  it('should accept show_set_sizes option', () => {
    const geom = geom_upset({ show_set_sizes: false })
    expect(geom.params?.show_set_sizes).toBe(false)
  })

  it('should render upset plot with binary matrix data', () => {
    const data = [
      { A: 1, B: 1, C: 0 },
      { A: 1, B: 0, C: 0 },
      { A: 0, B: 1, C: 1 },
      { A: 1, B: 1, C: 1 },
      { A: 0, B: 0, C: 1 },
      { A: 1, B: 0, C: 1 },
    ]

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B', 'C'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should render upset plot with list format data', () => {
    const data = [
      { element: 'gene1', sets: 'A,B' },
      { element: 'gene2', sets: 'A' },
      { element: 'gene3', sets: 'B,C' },
      { element: 'gene4', sets: 'A,B,C' },
      { element: 'gene5', sets: 'C' },
      { element: 'gene6', sets: 'A,C' },
    ]

    const spec = gg(data)
      .aes({ x: 'sets' })
      .geom(geom_upset())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should filter by min_size', () => {
    const data = [
      { A: 1, B: 1, C: 0 },
      { A: 1, B: 1, C: 0 },
      { A: 1, B: 1, C: 0 },
      { A: 0, B: 0, C: 1 },
    ]

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B', 'C'], min_size: 2 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should limit max intersections', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({
      A: i % 2,
      B: (i + 1) % 2,
      C: i % 3 === 0 ? 1 : 0,
      D: i % 4 === 0 ? 1 : 0,
    }))

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B', 'C', 'D'], max_intersections: 5 }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should sort by degree', () => {
    const data = [
      { A: 1, B: 1, C: 1 },
      { A: 1, B: 0, C: 0 },
      { A: 0, B: 1, C: 0 },
      { A: 1, B: 1, C: 0 },
    ]

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B', 'C'], sort_by: 'degree', sort_order: 'asc' }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 25 })
    expect(canvas).toBeDefined()
  })
})

describe('upset edge cases', () => {
  it('should handle empty data', () => {
    const spec = gg([])
      .geom(geom_upset({ sets: ['A', 'B'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle single set', () => {
    const data = [
      { A: 1 },
      { A: 1 },
      { A: 0 },
    ]

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle no intersections', () => {
    const data = [
      { A: 1, B: 0 },
      { A: 0, B: 1 },
    ]

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle all elements in all sets', () => {
    const data = Array.from({ length: 10 }, () => ({
      A: 1,
      B: 1,
      C: 1,
    }))

    const spec = gg(data)
      .geom(geom_upset({ sets: ['A', 'B', 'C'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })
})
