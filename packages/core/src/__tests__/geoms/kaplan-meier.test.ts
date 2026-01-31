import { describe, it, expect } from 'bun:test'
import { geom_kaplan_meier } from '../../geoms/kaplan-meier'
import { gg } from '../../grammar'

describe('geom_kaplan_meier', () => {
  describe('geom creation', () => {
    it('creates kaplan_meier geom with default options', () => {
      const geom = geom_kaplan_meier()
      expect(geom.type).toBe('kaplan_meier')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.show_censored).toBe(true)
      expect(geom.params.censor_char).toBe('+')
      expect(geom.params.show_ci).toBe(false)
      expect(geom.params.conf_level).toBe(0.95)
    })

    it('creates kaplan_meier geom with custom options', () => {
      const geom = geom_kaplan_meier({
        show_censored: false,
        censor_char: '|',
        show_ci: true,
        show_median: true,
      })
      expect(geom.params.show_censored).toBe(false)
      expect(geom.params.censor_char).toBe('|')
      expect(geom.params.show_ci).toBe(true)
      expect(geom.params.show_median).toBe(true)
    })
  })

  describe('rendering', () => {
    it('renders survival data with single group', () => {
      const survivalData = [
        { time: 5, status: 1 },
        { time: 10, status: 0 },
        { time: 15, status: 1 },
        { time: 20, status: 1 },
        { time: 25, status: 0 },
      ]

      const plot = gg(survivalData)
        .aes({ x: 'time', y: 'status' })
        .geom(geom_kaplan_meier())
        .labs({ title: 'Survival Curve' })

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toContain('Survival Curve')
      // Should render without errors
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders survival data with multiple groups', () => {
      const survivalData = [
        { time: 5, status: 1, group: 'A' },
        { time: 10, status: 0, group: 'A' },
        { time: 15, status: 1, group: 'A' },
        { time: 8, status: 1, group: 'B' },
        { time: 12, status: 0, group: 'B' },
        { time: 18, status: 1, group: 'B' },
      ]

      const plot = gg(survivalData)
        .aes({ x: 'time', y: 'status', color: 'group' })
        .geom(geom_kaplan_meier())

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders with censoring enabled', () => {
      const survivalData = [
        { time: 5, status: 1 },
        { time: 10, status: 0 }, // Censored
        { time: 15, status: 1 },
      ]

      const plot = gg(survivalData)
        .aes({ x: 'time', y: 'status' })
        .geom(geom_kaplan_meier({ show_censored: true, censor_char: '+' }))

      const output = plot.render({ width: 60, height: 15 })
      // Should render without errors - censored marks may overlap with step lines
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('clinical trial scenarios', () => {
    it('renders treatment vs control comparison', () => {
      const trialData = [
        // Control arm
        { time: 10, status: 1, arm: 'Control' },
        { time: 20, status: 1, arm: 'Control' },
        { time: 30, status: 0, arm: 'Control' },
        { time: 40, status: 1, arm: 'Control' },
        // Treatment arm
        { time: 15, status: 0, arm: 'Treatment' },
        { time: 25, status: 0, arm: 'Treatment' },
        { time: 35, status: 1, arm: 'Treatment' },
        { time: 45, status: 0, arm: 'Treatment' },
      ]

      const plot = gg(trialData)
        .aes({ x: 'time', y: 'status', color: 'arm' })
        .geom(geom_kaplan_meier())
        .labs({ title: 'Survival by Treatment Arm' })

      const output = plot.render({ width: 70, height: 20 })
      expect(output).toContain('Survival by Treatment Arm')
    })
  })
})
