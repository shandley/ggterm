/**
 * Tests for annotations system
 */

import { describe, expect, it } from 'bun:test'
import {
  annotate,
  annotate_text,
  annotate_label,
  annotate_rect,
  annotate_segment,
  annotate_hline,
  annotate_vline,
} from '../../annotations'
import { gg, geom_point, geom_line, renderToString } from '../../index'

describe('annotate()', () => {
  it('should create a text annotation', () => {
    const ann = annotate('text', { x: 5, y: 10, label: 'Hello' })
    expect(ann.type).toBe('text')
    expect(ann.stat).toBe('identity')
    expect(ann.position).toBe('identity')
    expect(ann.params.annotation).toBe(true)
    expect(ann.params.x).toBe(5)
    expect(ann.params.y).toBe(10)
    expect(ann.params.label).toBe('Hello')
  })

  it('should create a rect annotation', () => {
    const ann = annotate('rect', { xmin: 0, xmax: 10, ymin: 0, ymax: 20 })
    expect(ann.type).toBe('rect')
    expect(ann.params.annotation).toBe(true)
    expect(ann.params.xmin).toBe(0)
    expect(ann.params.xmax).toBe(10)
    expect(ann.params.ymin).toBe(0)
    expect(ann.params.ymax).toBe(20)
  })

  it('should create a segment annotation', () => {
    const ann = annotate('segment', { x: 1, y: 2, xend: 10, yend: 20 })
    expect(ann.type).toBe('segment')
    expect(ann.params.annotation).toBe(true)
    expect(ann.params.x).toBe(1)
    expect(ann.params.y).toBe(2)
    expect(ann.params.xend).toBe(10)
    expect(ann.params.yend).toBe(20)
  })

  it('should create an hline annotation', () => {
    const ann = annotate('hline', { y: 50 })
    expect(ann.type).toBe('hline')
    expect(ann.params.annotation).toBe(true)
    expect(ann.params.yintercept).toBe(50)
  })

  it('should create a vline annotation', () => {
    const ann = annotate('vline', { x: 25 })
    expect(ann.type).toBe('vline')
    expect(ann.params.annotation).toBe(true)
    expect(ann.params.xintercept).toBe(25)
  })

  it('should parse color strings', () => {
    const ann = annotate('text', { x: 0, y: 0, label: 'Test', color: 'red' })
    expect(ann.params.color).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('should accept RGBA colors directly', () => {
    const color = { r: 100, g: 150, b: 200, a: 0.5 }
    const ann = annotate('text', { x: 0, y: 0, label: 'Test', color })
    expect(ann.params.color).toEqual(color)
  })
})

describe('annotate_text()', () => {
  it('should create text annotation with convenience function', () => {
    const ann = annotate_text(10, 20, 'My Label')
    expect(ann.type).toBe('text')
    expect(ann.params.x).toBe(10)
    expect(ann.params.y).toBe(20)
    expect(ann.params.label).toBe('My Label')
    expect(ann.params.annotation).toBe(true)
  })

  it('should accept styling options', () => {
    const ann = annotate_text(0, 0, 'Styled', { color: 'blue', fontface: 'bold' })
    expect(ann.params.color).toEqual({ r: 0, g: 0, b: 255, a: 1 })
    expect(ann.params.fontface).toBe('bold')
  })
})

describe('annotate_label()', () => {
  it('should create label annotation', () => {
    const ann = annotate_label(5, 15, 'Label with background')
    expect(ann.type).toBe('label')
    expect(ann.params.x).toBe(5)
    expect(ann.params.y).toBe(15)
    expect(ann.params.label).toBe('Label with background')
  })
})

describe('annotate_rect()', () => {
  it('should create rect annotation with convenience function', () => {
    const ann = annotate_rect(0, 10, 0, 20)
    expect(ann.type).toBe('rect')
    expect(ann.params.xmin).toBe(0)
    expect(ann.params.xmax).toBe(10)
    expect(ann.params.ymin).toBe(0)
    expect(ann.params.ymax).toBe(20)
    expect(ann.params.annotation).toBe(true)
  })

  it('should accept fill and alpha options', () => {
    const ann = annotate_rect(0, 10, 0, 20, { fill: 'green', alpha: 0.3 })
    expect(ann.params.fill).toEqual({ r: 0, g: 128, b: 0, a: 1 })
    expect(ann.params.alpha).toBe(0.3)
  })
})

describe('annotate_segment()', () => {
  it('should create segment annotation with convenience function', () => {
    const ann = annotate_segment(1, 2, 10, 20)
    expect(ann.type).toBe('segment')
    expect(ann.params.x).toBe(1)
    expect(ann.params.y).toBe(2)
    expect(ann.params.xend).toBe(10)
    expect(ann.params.yend).toBe(20)
    expect(ann.params.annotation).toBe(true)
  })
})

describe('annotate_hline()', () => {
  it('should create hline annotation with convenience function', () => {
    const ann = annotate_hline(50)
    expect(ann.type).toBe('hline')
    expect(ann.params.yintercept).toBe(50)
    expect(ann.params.annotation).toBe(true)
  })

  it('should accept color option', () => {
    const ann = annotate_hline(50, { color: 'red' })
    expect(ann.params.color).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })
})

describe('annotate_vline()', () => {
  it('should create vline annotation with convenience function', () => {
    const ann = annotate_vline(25)
    expect(ann.type).toBe('vline')
    expect(ann.params.xintercept).toBe(25)
    expect(ann.params.annotation).toBe(true)
  })
})

describe('GGPlot.annotate()', () => {
  it('should add annotation via fluent API', () => {
    const plot = gg([{ x: 1, y: 2 }])
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .annotate(annotate_text(5, 10, 'Test'))

    const spec = plot.spec()
    expect(spec.geoms.length).toBe(2)
    expect(spec.geoms[1].type).toBe('text')
    expect(spec.geoms[1].params.annotation).toBe(true)
  })

  it('should support chaining multiple annotations', () => {
    const plot = gg([{ x: 1, y: 2 }])
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .annotate(annotate_text(5, 10, 'First'))
      .annotate(annotate_rect(0, 5, 0, 10))
      .annotate(annotate_hline(15))

    const spec = plot.spec()
    expect(spec.geoms.length).toBe(4) // point + 3 annotations
    expect(spec.geoms[1].type).toBe('text')
    expect(spec.geoms[2].type).toBe('rect')
    expect(spec.geoms[3].type).toBe('hline')
  })
})

describe('annotation rendering integration', () => {
  const data = [
    { x: 0, y: 0 },
    { x: 10, y: 20 },
    { x: 20, y: 10 },
  ]

  it('should render plot with text annotation', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .annotate(annotate_text(10, 15, 'Peak'))
        .labs({ title: 'Test' })
        .spec(),
      { width: 40, height: 15 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
    // The text "Peak" should appear in the output
    expect(output).toContain('Peak')
  })

  it('should render plot with hline annotation', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .annotate(annotate_hline(10))
        .spec(),
      { width: 40, height: 15 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })

  it('should render plot with vline annotation', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .annotate(annotate_vline(10))
        .spec(),
      { width: 40, height: 15 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })

  it('should render plot with multiple annotations', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .annotate(annotate_text(5, 18, 'Note'))  // Position away from vline
        .annotate(annotate_hline(10))
        .annotate(annotate_vline(15))
        .spec(),
      { width: 40, height: 15 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
    expect(output).toContain('Note')
  })

  it('should render plot with segment annotation', () => {
    const output = renderToString(
      gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .annotate(annotate_segment(0, 0, 20, 20))
        .spec(),
      { width: 40, height: 15 }
    )

    expect(output).toBeDefined()
    expect(output.length).toBeGreaterThan(0)
  })
})

describe('edge positions', () => {
  it('should support Inf for x position', () => {
    const ann = annotate('text', { x: 'Inf', y: 10, label: 'Right Edge' })
    expect(ann.params.x).toBe('Inf')
  })

  it('should support -Inf for x position', () => {
    const ann = annotate('text', { x: '-Inf', y: 10, label: 'Left Edge' })
    expect(ann.params.x).toBe('-Inf')
  })

  it('should support Inf for y position', () => {
    const ann = annotate('text', { x: 10, y: 'Inf', label: 'Top Edge' })
    expect(ann.params.y).toBe('Inf')
  })

  it('should support -Inf for y position', () => {
    const ann = annotate('text', { x: 10, y: '-Inf', label: 'Bottom Edge' })
    expect(ann.params.y).toBe('-Inf')
  })
})
