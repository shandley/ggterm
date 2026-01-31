import { describe, it, expect } from 'bun:test'
import { geom_funnel } from '../../geoms/funnel'
import { gg } from '../../grammar'

describe('geom_funnel', () => {
  describe('geom creation', () => {
    it('creates a funnel plot geom with default options', () => {
      const geom = geom_funnel()
      expect(geom.type).toBe('funnel')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params?.show_contours).toBe(true)
      expect(geom.params?.show_summary_line).toBe(true)
      expect(geom.params?.y_is_se).toBe(true)
      expect(geom.params?.invert_y).toBe(true)
    })

    it('accepts custom options', () => {
      const geom = geom_funnel({
        show_contours: false,
        contour_levels: [0.90, 0.95, 0.99],
        show_significance: true,
        summary_effect: 0.5,
        show_summary_line: false,
        y_is_se: false,
        invert_y: false,
        point_char: '○',
        contour_color: '#ff0000',
      })
      expect(geom.params?.show_contours).toBe(false)
      expect(geom.params?.contour_levels).toEqual([0.90, 0.95, 0.99])
      expect(geom.params?.show_significance).toBe(true)
      expect(geom.params?.summary_effect).toBe(0.5)
      expect(geom.params?.show_summary_line).toBe(false)
      expect(geom.params?.y_is_se).toBe(false)
      expect(geom.params?.invert_y).toBe(false)
    })
  })

  describe('rendering', () => {
    it('renders basic funnel plot for meta-analysis', () => {
      // Simulated meta-analysis data
      const data = [
        { effect: 0.2, se: 0.15 },
        { effect: 0.35, se: 0.12 },
        { effect: 0.15, se: 0.18 },
        { effect: 0.28, se: 0.10 },
        { effect: 0.42, se: 0.08 },
        { effect: 0.18, se: 0.20 },
        { effect: 0.32, se: 0.14 },
        { effect: 0.25, se: 0.11 },
      ]

      const plot = gg(data)
        .aes({ x: 'effect', y: 'se' })
        .geom(geom_funnel())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders funnel plot with custom summary effect', () => {
      const data = [
        { effect: 0.5, se: 0.1 },
        { effect: 0.6, se: 0.15 },
        { effect: 0.4, se: 0.2 },
        { effect: 0.55, se: 0.12 },
      ]

      const plot = gg(data)
        .aes({ x: 'effect', y: 'se' })
        .geom(geom_funnel({ summary_effect: 0.5 }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('renders funnel plot without contours', () => {
      const data = [
        { effect: 1.2, se: 0.3 },
        { effect: 0.8, se: 0.25 },
        { effect: 1.1, se: 0.2 },
        { effect: 0.9, se: 0.15 },
      ]

      const plot = gg(data)
        .aes({ x: 'effect', y: 'se' })
        .geom(geom_funnel({ show_contours: false }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('handles publication bias detection scenario', () => {
      // Asymmetric funnel indicating possible bias
      const data = [
        { effect: 0.6, se: 0.05 },
        { effect: 0.5, se: 0.08 },
        { effect: 0.55, se: 0.10 },
        { effect: 0.45, se: 0.12 },
        { effect: 0.4, se: 0.15 },
        // Missing small studies with negative effects
      ]

      const plot = gg(data)
        .aes({ x: 'effect', y: 'se' })
        .geom(geom_funnel())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })
  })
})
