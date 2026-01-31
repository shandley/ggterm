import { describe, it, expect } from 'bun:test'
import { geom_ecdf } from '../../geoms/ecdf'
import { gg } from '../../grammar'

describe('geom_ecdf', () => {
  describe('geom creation', () => {
    it('creates an ECDF geom with default options', () => {
      const geom = geom_ecdf()
      expect(geom.type).toBe('ecdf')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params?.pad).toBe(true)
      expect(geom.params?.step_type).toBe('post')
      expect(geom.params?.complement).toBe(false)
    })

    it('accepts custom options', () => {
      const geom = geom_ecdf({
        pad: false,
        show_ci: true,
        conf_level: 0.99,
        step_type: 'pre',
        show_points: true,
        complement: true,
      })
      expect(geom.params?.pad).toBe(false)
      expect(geom.params?.show_ci).toBe(true)
      expect(geom.params?.conf_level).toBe(0.99)
      expect(geom.params?.step_type).toBe('pre')
      expect(geom.params?.show_points).toBe(true)
      expect(geom.params?.complement).toBe(true)
    })
  })

  describe('rendering', () => {
    it('renders basic ECDF', () => {
      const data = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
        { value: 7 },
        { value: 8 },
        { value: 9 },
        { value: 10 },
      ]

      const plot = gg(data)
        .aes({ x: 'value' })
        .geom(geom_ecdf())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders ECDF with groups', () => {
      const data = [
        { value: 1, group: 'A' },
        { value: 2, group: 'A' },
        { value: 3, group: 'A' },
        { value: 4, group: 'A' },
        { value: 2, group: 'B' },
        { value: 4, group: 'B' },
        { value: 6, group: 'B' },
        { value: 8, group: 'B' },
      ]

      const plot = gg(data)
        .aes({ x: 'value', color: 'group' })
        .geom(geom_ecdf())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('renders survival-style complement ECDF', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        time: i + 1,
      }))

      const plot = gg(data)
        .aes({ x: 'time' })
        .geom(geom_ecdf({ complement: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('handles unsorted data', () => {
      const data = [
        { x: 5 },
        { x: 2 },
        { x: 8 },
        { x: 1 },
        { x: 9 },
        { x: 3 },
      ]

      const plot = gg(data)
        .aes({ x: 'x' })
        .geom(geom_ecdf())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })
  })
})
