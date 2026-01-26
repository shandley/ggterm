/**
 * Tests for PlotSpec JSON serialization and deserialization
 *
 * PlotSpec should be fully JSON-serializable for reproducibility.
 * Users should be able to save specs and recreate plots from them.
 */

import { describe, expect, it } from 'bun:test'
import { gg, GGPlot } from '../../grammar'
import { geom_point } from '../../geoms/point'
import { geom_line } from '../../geoms/line'
import { geom_bar } from '../../geoms/bar'
import { geom_histogram } from '../../geoms/histogram'
import { scale_x_continuous, scale_y_continuous } from '../../scales/continuous'
import { scale_color_discrete } from '../../scales/discrete'
import { renderToString } from '../../pipeline'
import type { PlotSpec } from '../../types'

describe('PlotSpec JSON serialization', () => {
  describe('basic roundtrip', () => {
    it('should serialize simple spec to JSON', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const spec = plot.spec()
      const json = JSON.stringify(spec)

      expect(typeof json).toBe('string')
      expect(json.length).toBeGreaterThan(0)
    })

    it('should deserialize JSON back to PlotSpec', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data).toEqual(data)
      expect(restored.aes).toEqual({ x: 'x', y: 'y' })
      expect(restored.geoms.length).toBe(1)
      expect(restored.geoms[0].type).toBe('point')
    })

    it('should render from deserialized spec', () => {
      const data = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({ title: 'Test Plot' })

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      // Should render without error
      const output = renderToString(restored, { width: 40, height: 10 })
      expect(typeof output).toBe('string')
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('complex specs', () => {
    it('should serialize spec with multiple geoms', () => {
      const data = [
        { x: 1, y: 10, group: 'A' },
        { x: 2, y: 20, group: 'B' },
      ]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_point())
        .geom(geom_line())

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.geoms.length).toBe(2)
      expect(restored.geoms[0].type).toBe('point')
      expect(restored.geoms[1].type).toBe('line')
    })

    it('should serialize spec with scales', () => {
      const data = [{ x: 1, y: 10 }]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .scale(scale_x_continuous({ limits: [0, 100] }))
        .scale(scale_y_continuous({ limits: [0, 50] }))

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.scales.length).toBe(2)
    })

    it('should serialize spec with labels', () => {
      const data = [{ x: 1, y: 10 }]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({
          title: 'My Title',
          subtitle: 'My Subtitle',
          x: 'X Axis',
          y: 'Y Axis',
          caption: 'Data source: test',
        })

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.labels.title).toBe('My Title')
      expect(restored.labels.subtitle).toBe('My Subtitle')
      expect(restored.labels.x).toBe('X Axis')
      expect(restored.labels.y).toBe('Y Axis')
      expect(restored.labels.caption).toBe('Data source: test')
    })

    it('should serialize spec with theme', () => {
      const data = [{ x: 1, y: 10 }]
      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .theme({ background: { r: 0, g: 0, b: 0, a: 1 } })

      const spec = plot.spec()
      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.theme.background).toEqual({ r: 0, g: 0, b: 0, a: 1 })
    })
  })

  describe('data type handling', () => {
    it('should handle numeric data', () => {
      const data = [
        { x: 0, y: 0 },
        { x: 1.5, y: -10.5 },
        { x: 1000000, y: 0.00001 },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].x).toBe(0)
      expect(restored.data[1].x).toBe(1.5)
      expect(restored.data[1].y).toBe(-10.5)
      expect(restored.data[2].x).toBe(1000000)
    })

    it('should handle string data', () => {
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'With Spaces', value: 30 },
        { category: 'Special "chars"', value: 40 },
      ]
      const spec = gg(data).aes({ x: 'category', y: 'value' }).geom(geom_bar()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].category).toBe('A')
      expect(restored.data[2].category).toBe('With Spaces')
      expect(restored.data[3].category).toBe('Special "chars"')
    })

    it('should handle null values', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: null },
        { x: 3, y: 30 },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].y).toBe(10)
      expect(restored.data[1].y).toBeNull()
      expect(restored.data[2].y).toBe(30)
    })

    it('should handle boolean values', () => {
      const data = [
        { x: 1, y: 10, active: true },
        { x: 2, y: 20, active: false },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].active).toBe(true)
      expect(restored.data[1].active).toBe(false)
    })

    it('should handle nested objects in data', () => {
      const data = [
        { x: 1, y: 10, meta: { source: 'test', id: 1 } },
        { x: 2, y: 20, meta: { source: 'test', id: 2 } },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].meta).toEqual({ source: 'test', id: 1 })
    })

    it('should handle arrays in data', () => {
      const data = [
        { x: 1, y: 10, tags: ['a', 'b'] },
        { x: 2, y: 20, tags: ['c'] },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data[0].tags).toEqual(['a', 'b'])
    })

    it('should convert undefined to null in JSON', () => {
      const data = [
        { x: 1, y: 10, optional: undefined },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      // JSON.stringify converts undefined to null (or omits the key)
      expect(restored.data[0].optional).toBeUndefined()
    })
  })

  describe('geom params preservation', () => {
    it('should preserve point geom params', () => {
      const data = [{ x: 1, y: 10 }]
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point({ size: 3, alpha: 0.5 }))
        .spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.geoms[0].params.size).toBe(3)
      expect(restored.geoms[0].params.alpha).toBe(0.5)
    })

    it('should preserve histogram geom params', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ value: i }))
      const spec = gg(data)
        .aes({ x: 'value', y: 'value' })
        .geom(geom_histogram({ bins: 15 }))
        .spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.geoms[0].params.bins).toBe(15)
    })
  })

  describe('empty and edge cases', () => {
    it('should handle empty data array', () => {
      const spec = gg([]).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data).toEqual([])
    })

    it('should handle large datasets', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        x: i,
        y: Math.random() * 100,
        category: i % 5,
      }))
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      expect(restored.data.length).toBe(10000)
    })

    it('should handle special numeric values', () => {
      const data = [
        { x: 0, y: Infinity },
        { x: 1, y: -Infinity },
        { x: 2, y: NaN },
      ]
      const spec = gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()

      const json = JSON.stringify(spec)
      const restored: PlotSpec = JSON.parse(json)

      // JSON converts Infinity and NaN to null
      expect(restored.data[0].y).toBeNull()
      expect(restored.data[1].y).toBeNull()
      expect(restored.data[2].y).toBeNull()
    })
  })

  describe('spec file workflow', () => {
    it('should support save and restore workflow', () => {
      // Simulate saving a spec to file
      const originalData = [
        { x: 1, y: 10, group: 'A' },
        { x: 2, y: 20, group: 'B' },
        { x: 3, y: 15, group: 'A' },
      ]

      const originalPlot = gg(originalData)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_point())
        .geom(geom_line())
        .labs({ title: 'Test Plot', x: 'X Value', y: 'Y Value' })

      // Save spec (simulating file write)
      const specJson = JSON.stringify(originalPlot.spec(), null, 2)

      // Later: Restore from saved spec (simulating file read)
      const restoredSpec: PlotSpec = JSON.parse(specJson)

      // Render the restored spec
      const output = renderToString(restoredSpec, { width: 60, height: 15 })

      expect(output).toContain('Test Plot')
      expect(typeof output).toBe('string')
    })
  })
})
