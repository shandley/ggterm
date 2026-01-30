/**
 * Tests for geom_sankey and geom_treemap
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_sankey } from '../../geoms/sankey'
import { geom_treemap } from '../../geoms/treemap'

describe('geom_sankey', () => {
  it('should create a sankey geom with default parameters', () => {
    const geom = geom_sankey()
    expect(geom.type).toBe('sankey')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
    expect(geom.params.node_width).toBe(3)
    expect(geom.params.node_padding).toBe(2)
    expect(geom.params.node_char).toBe('█')
    expect(geom.params.show_labels).toBe(true)
    expect(geom.params.show_values).toBe(false)
    expect(geom.params.align).toBe('justify')
  })

  it('should accept custom options', () => {
    const geom = geom_sankey({
      node_width: 5,
      node_padding: 3,
      show_labels: false,
      show_values: true,
      color_by: 'source',
    })
    expect(geom.params.node_width).toBe(5)
    expect(geom.params.node_padding).toBe(3)
    expect(geom.params.show_labels).toBe(false)
    expect(geom.params.show_values).toBe(true)
    expect(geom.params.color_by).toBe('source')
  })

  it('should render flow diagram with source/target/value data', () => {
    const flows = [
      { source: 'A', target: 'X', value: 10 },
      { source: 'A', target: 'Y', value: 5 },
      { source: 'B', target: 'X', value: 8 },
      { source: 'B', target: 'Y', value: 12 },
    ]

    const plot = gg(flows)
      .aes({ x: 'source', y: 'target', fill: 'value' })
      .geom(geom_sankey())

    const output = plot.render({ width: 60, height: 15 })

    expect(output).toBeDefined()
    expect(typeof output).toBe('string')
    expect(output.length).toBeGreaterThan(0)
  })

  it('should handle single flow', () => {
    const flows = [{ source: 'In', target: 'Out', value: 100 }]

    const plot = gg(flows)
      .aes({ x: 'source', y: 'target', fill: 'value' })
      .geom(geom_sankey())

    expect(() => plot.render({ width: 60, height: 10 })).not.toThrow()
  })

  it('should handle multiple columns', () => {
    const flows = [
      { source: 'A', target: 'B', value: 50 },
      { source: 'B', target: 'C', value: 30 },
      { source: 'B', target: 'D', value: 20 },
    ]

    const plot = gg(flows)
      .aes({ x: 'source', y: 'target', fill: 'value' })
      .geom(geom_sankey())

    const output = plot.render({ width: 70, height: 15 })
    expect(output).toBeDefined()
  })
})

describe('geom_treemap', () => {
  it('should create a treemap geom with default parameters', () => {
    const geom = geom_treemap()
    expect(geom.type).toBe('treemap')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
    expect(geom.params.algorithm).toBe('squarify')
    expect(geom.params.show_labels).toBe(true)
    expect(geom.params.show_values).toBe(false)
    expect(geom.params.border).toBe(true)
    expect(geom.params.min_label_size).toBe(4)
    expect(geom.params.color_by).toBe('value')
    expect(geom.params.fill_char).toBe('█')
  })

  it('should accept custom options', () => {
    const geom = geom_treemap({
      algorithm: 'binary',
      show_labels: false,
      show_values: true,
      border: false,
      padding: 1,
      max_depth: 2,
    })
    expect(geom.params.algorithm).toBe('binary')
    expect(geom.params.show_labels).toBe(false)
    expect(geom.params.show_values).toBe(true)
    expect(geom.params.border).toBe(false)
    expect(geom.params.padding).toBe(1)
    expect(geom.params.max_depth).toBe(2)
  })

  it('should render flat treemap', () => {
    const data = [
      { name: 'A', value: 100 },
      { name: 'B', value: 80 },
      { name: 'C', value: 60 },
      { name: 'D', value: 40 },
    ]

    const plot = gg(data)
      .aes({ x: 'name', fill: 'value' })
      .geom(geom_treemap())

    const output = plot.render({ width: 60, height: 15 })

    expect(output).toBeDefined()
    expect(typeof output).toBe('string')
    expect(output.length).toBeGreaterThan(0)
    // Should contain labels
    expect(output).toContain('A')
  })

  it('should render hierarchical treemap', () => {
    const data = [
      { id: 'root', parent: null, name: 'Total', value: 0 },
      { id: 'group1', parent: 'root', name: 'Group 1', value: 0 },
      { id: 'group2', parent: 'root', name: 'Group 2', value: 0 },
      { id: 'item1', parent: 'group1', name: 'Item 1', value: 50 },
      { id: 'item2', parent: 'group1', name: 'Item 2', value: 30 },
      { id: 'item3', parent: 'group2', name: 'Item 3', value: 40 },
    ]

    const plot = gg(data)
      .aes({ x: 'name', fill: 'value', group: 'parent' })
      .geom(geom_treemap())

    expect(() => plot.render({ width: 60, height: 15 })).not.toThrow()
  })

  it('should handle single item', () => {
    const data = [{ name: 'Only', value: 100 }]

    const plot = gg(data)
      .aes({ x: 'name', fill: 'value' })
      .geom(geom_treemap())

    const output = plot.render({ width: 40, height: 10 })
    expect(output).toBeDefined()
    expect(output).toContain('Only')
  })

  it('should handle zero values', () => {
    const data = [
      { name: 'A', value: 100 },
      { name: 'B', value: 0 },
      { name: 'C', value: 50 },
    ]

    const plot = gg(data)
      .aes({ x: 'name', fill: 'value' })
      .geom(geom_treemap())

    // Should not throw with zero values
    expect(() => plot.render({ width: 50, height: 12 })).not.toThrow()
  })

  it('should handle different aspect ratios', () => {
    const geom = geom_treemap({ aspect_ratio: 1.0 })
    expect(geom.params.aspect_ratio).toBe(1.0)
  })
})

describe('sankey and treemap integration', () => {
  it('should both geoms be importable from main index', async () => {
    const { geom_sankey, geom_treemap } = await import('../../index')

    expect(typeof geom_sankey).toBe('function')
    expect(typeof geom_treemap).toBe('function')
  })

  it('should render both geoms without error', () => {
    // Sankey
    const sankeyData = [
      { source: 'X', target: 'Y', value: 10 },
      { source: 'X', target: 'Z', value: 5 },
    ]
    const sankeyPlot = gg(sankeyData)
      .aes({ x: 'source', y: 'target', fill: 'value' })
      .geom(geom_sankey())
    expect(() => sankeyPlot.render({ width: 50, height: 10 })).not.toThrow()

    // Treemap
    const treemapData = [
      { name: 'Big', value: 100 },
      { name: 'Small', value: 20 },
    ]
    const treemapPlot = gg(treemapData)
      .aes({ x: 'name', fill: 'value' })
      .geom(geom_treemap())
    expect(() => treemapPlot.render({ width: 50, height: 10 })).not.toThrow()
  })
})
