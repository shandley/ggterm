import { describe, it, expect } from 'bun:test'
import { geom_control } from '../../geoms/control'
import { gg } from '../../grammar'

describe('geom_control', () => {
  describe('geom creation', () => {
    it('creates a control chart geom with default options', () => {
      const geom = geom_control()
      expect(geom.type).toBe('control')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params?.chart_type).toBe('i')
      expect(geom.params?.sigma).toBe(3)
      expect(geom.params?.show_center).toBe(true)
      expect(geom.params?.show_ucl).toBe(true)
      expect(geom.params?.show_lcl).toBe(true)
      expect(geom.params?.connect_points).toBe(true)
      expect(geom.params?.highlight_ooc).toBe(true)
    })

    it('accepts custom options', () => {
      const geom = geom_control({
        chart_type: 'xbar',
        sigma: 2,
        show_center: false,
        show_ucl: true,
        show_lcl: true,
        show_warning: true,
        center: 50,
        ucl: 60,
        lcl: 40,
        center_color: '#00ff00',
        limit_color: '#0000ff',
        warning_color: '#ffff00',
        connect_points: false,
        highlight_ooc: false,
        ooc_char: '★',
        point_char: '○',
      })
      expect(geom.params?.chart_type).toBe('xbar')
      expect(geom.params?.sigma).toBe(2)
      expect(geom.params?.show_center).toBe(false)
      expect(geom.params?.show_warning).toBe(true)
      expect(geom.params?.center).toBe(50)
      expect(geom.params?.ucl).toBe(60)
      expect(geom.params?.lcl).toBe(40)
      expect(geom.params?.connect_points).toBe(false)
      expect(geom.params?.highlight_ooc).toBe(false)
    })
  })

  describe('rendering', () => {
    it('renders basic I-chart (individuals chart)', () => {
      // Simulated process measurements
      const data = Array.from({ length: 25 }, (_, i) => ({
        sample: i + 1,
        measurement: 50 + (Math.random() - 0.5) * 6,
      }))

      const plot = gg(data)
        .aes({ x: 'sample', y: 'measurement' })
        .geom(geom_control())

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders control chart with out-of-control points', () => {
      const data = [
        { x: 1, y: 50 },
        { x: 2, y: 51 },
        { x: 3, y: 49 },
        { x: 4, y: 52 },
        { x: 5, y: 48 },
        { x: 6, y: 70 }, // Out of control (high)
        { x: 7, y: 50 },
        { x: 8, y: 51 },
        { x: 9, y: 30 }, // Out of control (low)
        { x: 10, y: 50 },
      ]

      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_control())

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
    })

    it('renders control chart with custom limits', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 100 + (Math.random() - 0.5) * 10,
      }))

      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_control({
          center: 100,
          ucl: 115,
          lcl: 85,
        }))

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
    })

    it('renders control chart with warning limits', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        x: i + 1,
        y: 25 + (Math.random() - 0.5) * 4,
      }))

      const plot = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_control({ show_warning: true }))

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
    })

    it('handles manufacturing quality control scenario', () => {
      // Diameter measurements of machined parts
      const data = [
        { part: 1, diameter: 10.02 },
        { part: 2, diameter: 9.98 },
        { part: 3, diameter: 10.01 },
        { part: 4, diameter: 9.99 },
        { part: 5, diameter: 10.03 },
        { part: 6, diameter: 10.00 },
        { part: 7, diameter: 9.97 },
        { part: 8, diameter: 10.02 },
        { part: 9, diameter: 10.01 },
        { part: 10, diameter: 9.98 },
      ]

      const plot = gg(data)
        .aes({ x: 'part', y: 'diameter' })
        .geom(geom_control())
        .labs({ title: 'Part Diameter Control Chart' })

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
    })
  })
})
