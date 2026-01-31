import { describe, it, expect } from 'bun:test'
import { geom_qq } from '../../geoms/qq'
import { gg } from '../../grammar'

describe('geom_qq', () => {
  describe('geom creation', () => {
    it('creates a Q-Q plot geom with default options', () => {
      const geom = geom_qq()
      expect(geom.type).toBe('qq')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params?.distribution).toBe('normal')
      expect(geom.params?.show_line).toBe(true)
      expect(geom.params?.standardize).toBe(true)
    })

    it('accepts custom options', () => {
      const geom = geom_qq({
        distribution: 'uniform',
        show_line: false,
        show_ci: true,
        conf_level: 0.99,
        line_color: '#00ff00',
        point_char: '○',
        standardize: false,
      })
      expect(geom.params?.distribution).toBe('uniform')
      expect(geom.params?.show_line).toBe(false)
      expect(geom.params?.show_ci).toBe(true)
      expect(geom.params?.conf_level).toBe(0.99)
      expect(geom.params?.line_color).toBe('#00ff00')
      expect(geom.params?.point_char).toBe('○')
      expect(geom.params?.standardize).toBe(false)
    })
  })

  describe('rendering', () => {
    it('renders Q-Q plot for normally distributed data', () => {
      // Generate approximately normal data
      const data = Array.from({ length: 50 }, (_, i) => ({
        value: -2 + (i / 50) * 4 + (Math.random() - 0.5) * 0.5,
      }))

      const plot = gg(data)
        .aes({ x: 'value' })
        .geom(geom_qq())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders Q-Q plot without reference line', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        x: i * 0.1,
      }))

      const plot = gg(data)
        .aes({ x: 'x' })
        .geom(geom_qq({ show_line: false }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('handles small datasets', () => {
      const data = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }]

      const plot = gg(data)
        .aes({ x: 'x' })
        .geom(geom_qq())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('handles exponential distribution comparison', () => {
      // Generate exponential-like data
      const data = Array.from({ length: 40 }, (_, i) => ({
        value: Math.exp(i / 20),
      }))

      const plot = gg(data)
        .aes({ x: 'value' })
        .geom(geom_qq({ distribution: 'exponential' }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })
  })
})
