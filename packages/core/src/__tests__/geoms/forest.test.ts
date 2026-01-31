import { describe, it, expect } from 'bun:test'
import { geom_forest } from '../../geoms/forest'
import { gg } from '../../grammar'

describe('geom_forest', () => {
  describe('geom creation', () => {
    it('creates forest geom with default options', () => {
      const geom = geom_forest()
      expect(geom.type).toBe('forest')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.null_line).toBe(1)
      expect(geom.params.log_scale).toBe(false)
      expect(geom.params.point_char).toBe('■')
    })

    it('creates forest geom with custom options', () => {
      const geom = geom_forest({
        null_line: 0,
        log_scale: true,
        show_summary: true,
        point_char: '●',
      })
      expect(geom.params.null_line).toBe(0)
      expect(geom.params.log_scale).toBe(true)
      expect(geom.params.show_summary).toBe(true)
      expect(geom.params.point_char).toBe('●')
    })
  })

  describe('rendering', () => {
    it('renders meta-analysis data', () => {
      const metaData = [
        { study: 'Smith 2020', estimate: 1.25, ci_lower: 0.95, ci_upper: 1.65 },
        { study: 'Jones 2021', estimate: 1.45, ci_lower: 1.10, ci_upper: 1.90 },
        { study: 'Brown 2019', estimate: 0.85, ci_lower: 0.60, ci_upper: 1.20 },
      ]

      const plot = gg(metaData)
        .aes({ x: 'estimate', y: 'study', xmin: 'ci_lower', xmax: 'ci_upper' })
        .geom(geom_forest())
        .labs({ title: 'Forest Plot' })

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toContain('Forest Plot')
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders with log scale for odds ratios', () => {
      const metaData = [
        { study: 'Trial A', or: 2.5, ci_lower: 1.5, ci_upper: 4.0 },
        { study: 'Trial B', or: 0.8, ci_lower: 0.4, ci_upper: 1.2 },
        { study: 'Trial C', or: 1.5, ci_lower: 1.0, ci_upper: 2.2 },
      ]

      const plot = gg(metaData)
        .aes({ x: 'or', y: 'study', xmin: 'ci_lower', xmax: 'ci_upper' })
        .geom(geom_forest({ log_scale: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders null line at specified value', () => {
      const metaData = [
        { study: 'Study 1', mean_diff: 0.5, ci_lower: -0.2, ci_upper: 1.2 },
        { study: 'Study 2', mean_diff: -0.3, ci_lower: -0.8, ci_upper: 0.2 },
      ]

      const plot = gg(metaData)
        .aes({ x: 'mean_diff', y: 'study', xmin: 'ci_lower', xmax: 'ci_upper' })
        .geom(geom_forest({ null_line: 0 })) // 0 for mean differences

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('meta-analysis scenarios', () => {
    it('renders multi-study odds ratio meta-analysis', () => {
      const metaData = [
        { study: 'Chen 2018', estimate: 1.82, ci_lower: 1.21, ci_upper: 2.74, weight: 12 },
        { study: 'Park 2019', estimate: 1.45, ci_lower: 1.05, ci_upper: 2.00, weight: 18 },
        { study: 'Lee 2020', estimate: 0.92, ci_lower: 0.65, ci_upper: 1.30, weight: 15 },
        { study: 'Kim 2021', estimate: 1.28, ci_lower: 0.98, ci_upper: 1.68, weight: 22 },
        { study: 'Wang 2022', estimate: 1.55, ci_lower: 1.12, ci_upper: 2.15, weight: 20 },
        { study: 'Pooled', estimate: 1.35, ci_lower: 1.15, ci_upper: 1.58, weight: 100 },
      ]

      const plot = gg(metaData)
        .aes({ x: 'estimate', y: 'study', xmin: 'ci_lower', xmax: 'ci_upper', size: 'weight' })
        .geom(geom_forest({ null_line: 1 }))
        .labs({ title: 'Meta-Analysis: Treatment Effect', x: 'Odds Ratio' })

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toContain('Meta-Analysis')
    })
  })
})
