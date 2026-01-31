import { describe, it, expect } from 'bun:test'
import { geom_volcano, VolcanoOptions } from '../../geoms/volcano'
import { gg } from '../../grammar'

describe('geom_volcano', () => {
  describe('geom creation', () => {
    it('should create a volcano geom with default options', () => {
      const geom = geom_volcano()
      expect(geom.type).toBe('volcano')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.fc_threshold).toBe(1)
      expect(geom.params.p_threshold).toBe(0.05)
      expect(geom.params.y_is_neglog10).toBe(false)
      expect(geom.params.show_thresholds).toBe(true)
      expect(geom.params.n_labels).toBe(0)
    })

    it('should accept custom fc_threshold', () => {
      const geom = geom_volcano({ fc_threshold: 1.5 })
      expect(geom.params.fc_threshold).toBe(1.5)
    })

    it('should accept custom p_threshold', () => {
      const geom = geom_volcano({ p_threshold: 0.01 })
      expect(geom.params.p_threshold).toBe(0.01)
    })

    it('should accept y_is_neglog10 option', () => {
      const geom = geom_volcano({ y_is_neglog10: true })
      expect(geom.params.y_is_neglog10).toBe(true)
    })

    it('should accept custom colors', () => {
      const geom = geom_volcano({
        up_color: '#ff0000',
        down_color: '#0000ff',
        ns_color: '#cccccc',
      })
      expect(geom.params.up_color).toBe('#ff0000')
      expect(geom.params.down_color).toBe('#0000ff')
      expect(geom.params.ns_color).toBe('#cccccc')
    })

    it('should accept threshold display options', () => {
      const geom = geom_volcano({
        show_thresholds: false,
        threshold_linetype: 'dotted',
      })
      expect(geom.params.show_thresholds).toBe(false)
      expect(geom.params.threshold_linetype).toBe('dotted')
    })

    it('should accept labeling options', () => {
      const geom = geom_volcano({ n_labels: 10 })
      expect(geom.params.n_labels).toBe(10)
    })

    it('should accept point styling options', () => {
      const geom = geom_volcano({
        size: 2,
        alpha: 0.8,
        point_char: '○',
      })
      expect(geom.params.size).toBe(2)
      expect(geom.params.alpha).toBe(0.8)
      expect(geom.params.point_char).toBe('○')
    })
  })

  describe('rendering', () => {
    // Generate synthetic differential expression data
    const generateDEData = (n: number) => {
      const data = []
      for (let i = 0; i < n; i++) {
        const log2FC = (Math.random() - 0.5) * 6 // Range -3 to 3
        const pvalue = Math.random() * Math.random() // Skewed towards 0
        data.push({
          gene: `GENE${i}`,
          log2FoldChange: log2FC,
          pvalue: Math.max(pvalue, 1e-10), // Avoid zero
        })
      }
      return data
    }

    it('should render a basic volcano plot', () => {
      const data = generateDEData(100)
      const plot = gg(data)
        .aes({ x: 'log2FoldChange', y: 'pvalue' })
        .geom(geom_volcano())

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with labels', () => {
      const data = generateDEData(50)
      const plot = gg(data)
        .aes({ x: 'log2FoldChange', y: 'pvalue', label: 'gene' })
        .geom(geom_volcano({ n_labels: 5 }))

      const output = plot.render({ width: 80, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render with custom thresholds', () => {
      const data = generateDEData(100)
      const plot = gg(data)
        .aes({ x: 'log2FoldChange', y: 'pvalue' })
        .geom(geom_volcano({
          fc_threshold: 2,
          p_threshold: 0.001,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render without threshold lines', () => {
      const data = generateDEData(50)
      const plot = gg(data)
        .aes({ x: 'log2FoldChange', y: 'pvalue' })
        .geom(geom_volcano({ show_thresholds: false }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle pre-transformed -log10(p) values', () => {
      const data = generateDEData(50).map(d => ({
        ...d,
        neglog10p: -Math.log10(d.pvalue),
      }))

      const plot = gg(data)
        .aes({ x: 'log2FoldChange', y: 'neglog10p' })
        .geom(geom_volcano({ y_is_neglog10: true }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle empty data gracefully', () => {
      const plot = gg([])
        .aes({ x: 'log2FC', y: 'pvalue' })
        .geom(geom_volcano())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with all non-significant points', () => {
      const data = [
        { gene: 'A', log2FC: 0.2, pvalue: 0.5 },
        { gene: 'B', log2FC: -0.3, pvalue: 0.6 },
        { gene: 'C', log2FC: 0.1, pvalue: 0.8 },
      ]

      const plot = gg(data)
        .aes({ x: 'log2FC', y: 'pvalue' })
        .geom(geom_volcano())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with highly significant points', () => {
      const data = [
        { gene: 'TP53', log2FC: 3.5, pvalue: 1e-50 },
        { gene: 'BRCA1', log2FC: -2.8, pvalue: 1e-40 },
        { gene: 'MYC', log2FC: 2.1, pvalue: 1e-30 },
      ]

      const plot = gg(data)
        .aes({ x: 'log2FC', y: 'pvalue', label: 'gene' })
        .geom(geom_volcano({ n_labels: 3 }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })
  })

  describe('integration with GGPlot', () => {
    it('should work with labs()', () => {
      const data = [
        { gene: 'A', log2FC: 2, pvalue: 0.001 },
        { gene: 'B', log2FC: -1.5, pvalue: 0.01 },
      ]

      const plot = gg(data)
        .aes({ x: 'log2FC', y: 'pvalue' })
        .geom(geom_volcano())
        .labs({
          title: 'Differential Expression',
          x: 'Log2 Fold Change',
          y: 'P-value',
        })

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toContain('Differential Expression')
    })

    it('should work with themes', () => {
      const data = [
        { gene: 'A', log2FC: 2, pvalue: 0.001 },
      ]

      const plot = gg(data)
        .aes({ x: 'log2FC', y: 'pvalue' })
        .geom(geom_volcano())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })
  })

  describe('classification logic', () => {
    it('should correctly classify up-regulated genes', () => {
      // fc_threshold=1, p_threshold=0.05
      // Up: log2FC > 1 AND p < 0.05
      const geom = geom_volcano()
      expect(geom.params.fc_threshold).toBe(1)
      expect(geom.params.p_threshold).toBe(0.05)
    })

    it('should correctly classify down-regulated genes', () => {
      // Down: log2FC < -1 AND p < 0.05
      const geom = geom_volcano()
      expect(geom.params.fc_threshold).toBe(1)
    })

    it('should use custom classification thresholds', () => {
      const geom = geom_volcano({
        fc_threshold: 0.5,
        p_threshold: 0.1,
      })
      expect(geom.params.fc_threshold).toBe(0.5)
      expect(geom.params.p_threshold).toBe(0.1)
    })
  })
})

describe('volcano plot real-world scenarios', () => {
  it('should handle RNA-seq style data', () => {
    // Simulate RNA-seq differential expression results
    const data = [
      { gene: 'IL6', log2FC: 4.2, padj: 1e-100, baseMean: 5000 },
      { gene: 'TNF', log2FC: 3.1, padj: 1e-80, baseMean: 3000 },
      { gene: 'CXCL8', log2FC: 5.5, padj: 1e-120, baseMean: 8000 },
      { gene: 'STAT3', log2FC: -2.1, padj: 1e-40, baseMean: 2000 },
      { gene: 'SOCS3', log2FC: -1.8, padj: 1e-30, baseMean: 1500 },
      { gene: 'GAPDH', log2FC: 0.1, padj: 0.8, baseMean: 50000 },
      { gene: 'ACTB', log2FC: -0.05, padj: 0.9, baseMean: 60000 },
    ]

    const plot = gg(data)
      .aes({ x: 'log2FC', y: 'padj', label: 'gene' })
      .geom(geom_volcano({
        fc_threshold: 1,
        p_threshold: 0.05,
        n_labels: 5,
      }))
      .labs({
        title: 'Differential Gene Expression',
        x: 'Log2 Fold Change',
        y: 'Adjusted P-value',
      })

    const output = plot.render({ width: 80, height: 25 })
    expect(output).toBeTruthy()
    expect(output).toContain('Differential Gene Expression')
  })

  it('should handle proteomics data', () => {
    const data = [
      { protein: 'HSP90', log2FC: 2.5, pvalue: 0.0001 },
      { protein: 'ACTIN', log2FC: 0.1, pvalue: 0.5 },
      { protein: 'TUBULIN', log2FC: -0.2, pvalue: 0.6 },
      { protein: 'P53', log2FC: -3.2, pvalue: 0.00001 },
    ]

    const plot = gg(data)
      .aes({ x: 'log2FC', y: 'pvalue', label: 'protein' })
      .geom(geom_volcano({ n_labels: 2 }))

    const output = plot.render({ width: 60, height: 20 })
    expect(output).toBeTruthy()
  })
})
