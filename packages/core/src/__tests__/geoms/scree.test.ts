import { describe, it, expect } from 'bun:test'
import { geom_scree } from '../../geoms/scree'
import { gg } from '../../grammar'

describe('geom_scree', () => {
  describe('geom creation', () => {
    it('creates a scree plot geom with default options', () => {
      const geom = geom_scree()
      expect(geom.type).toBe('scree')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params?.show_cumulative).toBe(false)
      expect(geom.params?.show_kaiser).toBe(false)
      expect(geom.params?.connect_points).toBe(true)
      expect(geom.params?.show_bars).toBe(false)
      expect(geom.params?.y_format).toBe('percentage')
    })

    it('accepts custom options', () => {
      const geom = geom_scree({
        show_cumulative: true,
        show_kaiser: true,
        show_elbow: true,
        show_broken_stick: true,
        connect_points: false,
        show_bars: true,
        point_char: '○',
        color: '#ff0000',
        cumulative_color: '#00ff00',
        kaiser_color: '#0000ff',
        y_format: 'eigenvalue',
        threshold: 0.8,
        threshold_color: '#ffff00',
      })
      expect(geom.params?.show_cumulative).toBe(true)
      expect(geom.params?.show_kaiser).toBe(true)
      expect(geom.params?.show_elbow).toBe(true)
      expect(geom.params?.show_broken_stick).toBe(true)
      expect(geom.params?.connect_points).toBe(false)
      expect(geom.params?.show_bars).toBe(true)
      expect(geom.params?.y_format).toBe('eigenvalue')
      expect(geom.params?.threshold).toBe(0.8)
    })
  })

  describe('rendering', () => {
    it('renders basic scree plot from PCA', () => {
      // Typical PCA variance explained
      const data = [
        { component: 1, variance: 45.2 },
        { component: 2, variance: 23.1 },
        { component: 3, variance: 12.5 },
        { component: 4, variance: 8.3 },
        { component: 5, variance: 5.2 },
        { component: 6, variance: 3.1 },
        { component: 7, variance: 1.8 },
        { component: 8, variance: 0.8 },
      ]

      const plot = gg(data)
        .aes({ x: 'component', y: 'variance' })
        .geom(geom_scree())

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders scree plot with cumulative variance', () => {
      const data = [
        { component: 1, variance: 40 },
        { component: 2, variance: 25 },
        { component: 3, variance: 15 },
        { component: 4, variance: 10 },
        { component: 5, variance: 6 },
        { component: 6, variance: 4 },
      ]

      const plot = gg(data)
        .aes({ x: 'component', y: 'variance' })
        .geom(geom_scree({ show_cumulative: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('renders scree plot with Kaiser criterion', () => {
      // Eigenvalues instead of percentages
      const data = [
        { component: 1, eigenvalue: 3.2 },
        { component: 2, eigenvalue: 1.8 },
        { component: 3, eigenvalue: 1.1 },
        { component: 4, eigenvalue: 0.8 },
        { component: 5, eigenvalue: 0.5 },
        { component: 6, eigenvalue: 0.3 },
      ]

      const plot = gg(data)
        .aes({ x: 'component', y: 'eigenvalue' })
        .geom(geom_scree({ show_kaiser: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('renders scree plot with bars', () => {
      const data = [
        { pc: 1, var: 35 },
        { pc: 2, var: 20 },
        { pc: 3, var: 15 },
        { pc: 4, var: 12 },
        { pc: 5, var: 8 },
      ]

      const plot = gg(data)
        .aes({ x: 'pc', y: 'var' })
        .geom(geom_scree({ show_bars: true }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('renders scree plot with threshold line', () => {
      const data = [
        { component: 1, variance: 50 },
        { component: 2, variance: 25 },
        { component: 3, variance: 12 },
        { component: 4, variance: 8 },
        { component: 5, variance: 5 },
      ]

      const plot = gg(data)
        .aes({ x: 'component', y: 'variance' })
        .geom(geom_scree({
          show_cumulative: true,
          threshold: 0.8,
        }))

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toBeDefined()
    })

    it('handles genomics/transcriptomics PCA scenario', () => {
      // Typical RNA-seq PCA with many components
      const data = [
        { PC: 1, variance_pct: 28.5 },
        { PC: 2, variance_pct: 15.2 },
        { PC: 3, variance_pct: 9.8 },
        { PC: 4, variance_pct: 6.3 },
        { PC: 5, variance_pct: 4.7 },
        { PC: 6, variance_pct: 3.5 },
        { PC: 7, variance_pct: 2.8 },
        { PC: 8, variance_pct: 2.1 },
        { PC: 9, variance_pct: 1.8 },
        { PC: 10, variance_pct: 1.5 },
      ]

      const plot = gg(data)
        .aes({ x: 'PC', y: 'variance_pct' })
        .geom(geom_scree({ show_cumulative: true }))
        .labs({ title: 'PCA Scree Plot' })

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toBeDefined()
    })
  })
})
