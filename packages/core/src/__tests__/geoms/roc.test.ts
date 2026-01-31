import { describe, it, expect } from 'bun:test'
import { geom_roc } from '../../geoms/roc'
import { gg } from '../../grammar'

describe('geom_roc', () => {
  describe('geom creation', () => {
    it('creates roc geom with default options', () => {
      const geom = geom_roc()
      expect(geom.type).toBe('roc')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.show_diagonal).toBe(true)
      expect(geom.params.show_auc).toBe(true)
      expect(geom.params.show_optimal).toBe(false)
    })

    it('creates roc geom with custom options', () => {
      const geom = geom_roc({
        show_diagonal: false,
        show_auc: false,
        show_optimal: true,
        optimal_char: '★',
      })
      expect(geom.params.show_diagonal).toBe(false)
      expect(geom.params.show_auc).toBe(false)
      expect(geom.params.show_optimal).toBe(true)
      expect(geom.params.optimal_char).toBe('★')
    })
  })

  describe('rendering', () => {
    it('renders ROC curve data', () => {
      const rocData = [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.1, tpr: 0.4 },
        { fpr: 0.2, tpr: 0.6 },
        { fpr: 0.3, tpr: 0.75 },
        { fpr: 0.5, tpr: 0.85 },
        { fpr: 0.7, tpr: 0.92 },
        { fpr: 1.0, tpr: 1.0 },
      ]

      const plot = gg(rocData)
        .aes({ x: 'fpr', y: 'tpr' })
        .geom(geom_roc())
        .labs({ title: 'ROC Curve' })

      const output = plot.render({ width: 60, height: 15 })
      expect(output).toContain('ROC Curve')
      expect(output.length).toBeGreaterThan(0)
    })

    it('renders multiple ROC curves for model comparison', () => {
      const rocData = [
        // Model A - good classifier
        { fpr: 0.0, tpr: 0.0, model: 'A' },
        { fpr: 0.1, tpr: 0.5, model: 'A' },
        { fpr: 0.2, tpr: 0.7, model: 'A' },
        { fpr: 0.5, tpr: 0.9, model: 'A' },
        { fpr: 1.0, tpr: 1.0, model: 'A' },
        // Model B - moderate classifier
        { fpr: 0.0, tpr: 0.0, model: 'B' },
        { fpr: 0.2, tpr: 0.4, model: 'B' },
        { fpr: 0.4, tpr: 0.6, model: 'B' },
        { fpr: 0.6, tpr: 0.75, model: 'B' },
        { fpr: 1.0, tpr: 1.0, model: 'B' },
      ]

      const plot = gg(rocData)
        .aes({ x: 'fpr', y: 'tpr', color: 'model' })
        .geom(geom_roc())

      const output = plot.render({ width: 60, height: 15 })
      expect(output.length).toBeGreaterThan(0)
    })

    it('shows diagonal reference line', () => {
      const rocData = [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.5, tpr: 0.5 }, // On diagonal
        { fpr: 1.0, tpr: 1.0 },
      ]

      const plot = gg(rocData)
        .aes({ x: 'fpr', y: 'tpr' })
        .geom(geom_roc({ show_diagonal: true }))

      const output = plot.render({ width: 60, height: 15 })
      // Diagonal should be rendered with dots
      expect(output).toContain('·')
    })
  })

  describe('classifier evaluation scenarios', () => {
    it('renders high-performance classifier ROC', () => {
      // Near-perfect classifier
      const rocData = [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.01, tpr: 0.85 },
        { fpr: 0.05, tpr: 0.95 },
        { fpr: 0.1, tpr: 0.98 },
        { fpr: 0.2, tpr: 0.99 },
        { fpr: 1.0, tpr: 1.0 },
      ]

      const plot = gg(rocData)
        .aes({ x: 'fpr', y: 'tpr' })
        .geom(geom_roc({ show_auc: true }))
        .labs({ title: 'High-Performance Classifier' })

      const output = plot.render({ width: 60, height: 15 })
      // Should show high AUC
      expect(output).toContain('AUC')
    })

    it('renders diagnostic test ROC', () => {
      const diagnosticData = [
        { fpr: 0.0, tpr: 0.0, test: 'ELISA' },
        { fpr: 0.05, tpr: 0.70, test: 'ELISA' },
        { fpr: 0.10, tpr: 0.85, test: 'ELISA' },
        { fpr: 0.20, tpr: 0.92, test: 'ELISA' },
        { fpr: 1.0, tpr: 1.0, test: 'ELISA' },
      ]

      const plot = gg(diagnosticData)
        .aes({ x: 'fpr', y: 'tpr', color: 'test' })
        .geom(geom_roc())
        .labs({
          title: 'Diagnostic Test Performance',
          x: 'False Positive Rate',
          y: 'True Positive Rate',
        })

      const output = plot.render({ width: 70, height: 18 })
      expect(output).toContain('Diagnostic Test Performance')
    })
  })
})
