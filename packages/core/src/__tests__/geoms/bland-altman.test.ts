import { describe, it, expect } from 'bun:test'
import { geom_bland_altman } from '../../geoms/bland-altman'
import { gg } from '../../grammar'

describe('geom_bland_altman', () => {
  describe('geom creation', () => {
    it('creates bland_altman geom with default options', () => {
      const geom = geom_bland_altman()
      expect(geom.type).toBe('bland_altman')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.show_limits).toBe(true)
      expect(geom.params.show_bias).toBe(true)
      expect(geom.params.limit_multiplier).toBe(1.96)
    })

    it('creates bland_altman geom with custom options', () => {
      const geom = geom_bland_altman({
        show_limits: false,
        show_bias: true,
        limit_multiplier: 2.0,
        percent_diff: true,
      })
      expect(geom.params.show_limits).toBe(false)
      expect(geom.params.show_bias).toBe(true)
      expect(geom.params.limit_multiplier).toBe(2.0)
      expect(geom.params.percent_diff).toBe(true)
    })
  })

  describe('rendering', () => {
    it('renders method comparison data', () => {
      const comparisonData = [
        { method1: 10.2, method2: 10.5 },
        { method1: 15.3, method2: 15.1 },
        { method1: 20.8, method2: 21.2 },
        { method1: 25.5, method2: 25.0 },
        { method1: 30.1, method2: 30.8 },
      ]

      const plot = gg(comparisonData)
        .aes({ x: 'method1', y: 'method2' })
        .geom(geom_bland_altman())
        .labs({ title: 'Bland-Altman Plot' })

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toContain('Bland-Altman')
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders with bias line', () => {
      const comparisonData = [
        { method1: 10, method2: 12 }, // Systematic bias
        { method1: 20, method2: 22 },
        { method1: 30, method2: 32 },
        { method1: 40, method2: 42 },
        { method1: 50, method2: 52 },
      ]

      const plot = gg(comparisonData)
        .aes({ x: 'method1', y: 'method2' })
        .geom(geom_bland_altman({ show_bias: true }))

      const output = plot.render({ width: 60, height: 15 })
      // Should contain horizontal line characters
      expect(output).toContain('─')
    })

    it('renders with limits of agreement', () => {
      const comparisonData = [
        { method1: 10, method2: 10.5 },
        { method1: 20, method2: 19.5 },
        { method1: 30, method2: 31.0 },
        { method1: 40, method2: 39.0 },
        { method1: 50, method2: 50.5 },
      ]

      const plot = gg(comparisonData)
        .aes({ x: 'method1', y: 'method2' })
        .geom(geom_bland_altman({ show_limits: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('method comparison scenarios', () => {
    it('renders blood pressure measurement comparison', () => {
      const bpData = [
        { manual: 120, auto: 118 },
        { manual: 135, auto: 138 },
        { manual: 142, auto: 140 },
        { manual: 128, auto: 130 },
        { manual: 155, auto: 152 },
        { manual: 118, auto: 121 },
        { manual: 145, auto: 143 },
        { manual: 132, auto: 135 },
      ]

      const plot = gg(bpData)
        .aes({ x: 'manual', y: 'auto' })
        .geom(geom_bland_altman())
        .labs({
          title: 'BP Measurement: Manual vs Automated',
          x: 'Mean BP (mmHg)',
          y: 'Difference (mmHg)',
        })

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toContain('BP Measurement')
    })

    it('renders laboratory assay comparison', () => {
      const assayData = [
        { old_method: 5.2, new_method: 5.1 },
        { old_method: 8.7, new_method: 8.9 },
        { old_method: 12.3, new_method: 12.1 },
        { old_method: 3.8, new_method: 4.0 },
        { old_method: 15.5, new_method: 15.2 },
        { old_method: 9.1, new_method: 9.3 },
        { old_method: 6.4, new_method: 6.2 },
        { old_method: 11.8, new_method: 12.0 },
        { old_method: 4.5, new_method: 4.3 },
        { old_method: 7.9, new_method: 8.1 },
      ]

      const plot = gg(assayData)
        .aes({ x: 'old_method', y: 'new_method' })
        .geom(geom_bland_altman({ limit_multiplier: 1.96 }))
        .labs({ title: 'Assay Method Comparison' })

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toContain('Assay Method')
    })

    it('renders precomputed mean/diff data', () => {
      const precomputed = [
        { mean: 10, diff: 0.3 },
        { mean: 15, diff: -0.2 },
        { mean: 20, diff: 0.5 },
        { mean: 25, diff: -0.1 },
        { mean: 30, diff: 0.4 },
      ]

      const plot = gg(precomputed)
        .aes({ x: 'mean', y: 'diff' })
        .geom(geom_bland_altman({ precomputed: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })
  })
})
