import { describe, it, expect } from 'bun:test'
import { geom_ma, MAOptions } from '../../geoms/ma'
import { gg } from '../../grammar'

describe('geom_ma', () => {
  describe('geom creation', () => {
    it('should create an MA geom with default options', () => {
      const geom = geom_ma()
      expect(geom.type).toBe('ma')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.fc_threshold).toBe(1)
      expect(geom.params.p_threshold).toBe(0.05)
      expect(geom.params.x_is_log2).toBe(false)
      expect(geom.params.show_baseline).toBe(true)
      expect(geom.params.show_thresholds).toBe(true)
      expect(geom.params.n_labels).toBe(0)
    })

    it('should accept custom fc_threshold', () => {
      const geom = geom_ma({ fc_threshold: 1.5 })
      expect(geom.params.fc_threshold).toBe(1.5)
    })

    it('should accept custom p_threshold and p_col', () => {
      const geom = geom_ma({ p_threshold: 0.01, p_col: 'padj' })
      expect(geom.params.p_threshold).toBe(0.01)
      expect(geom.params.p_col).toBe('padj')
    })

    it('should accept x_is_log2 option', () => {
      const geom = geom_ma({ x_is_log2: true })
      expect(geom.params.x_is_log2).toBe(true)
    })

    it('should accept custom colors', () => {
      const geom = geom_ma({
        up_color: '#ff0000',
        down_color: '#0000ff',
        ns_color: '#cccccc',
      })
      expect(geom.params.up_color).toBe('#ff0000')
      expect(geom.params.down_color).toBe('#0000ff')
      expect(geom.params.ns_color).toBe('#cccccc')
    })

    it('should accept reference line options', () => {
      const geom = geom_ma({
        show_baseline: false,
        show_thresholds: false,
        linetype: 'dotted',
      })
      expect(geom.params.show_baseline).toBe(false)
      expect(geom.params.show_thresholds).toBe(false)
      expect(geom.params.linetype).toBe('dotted')
    })

    it('should accept labeling options', () => {
      const geom = geom_ma({ n_labels: 10 })
      expect(geom.params.n_labels).toBe(10)
    })

    it('should accept point styling options', () => {
      const geom = geom_ma({
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
        const baseMean = Math.pow(10, Math.random() * 4 + 1) // 10 to 100000
        const log2FC = (Math.random() - 0.5) * 6 // Range -3 to 3
        const pvalue = Math.random() * Math.random() // Skewed towards 0
        data.push({
          gene: `GENE${i}`,
          baseMean,
          log2FoldChange: log2FC,
          pvalue: Math.max(pvalue, 1e-10),
          padj: Math.max(pvalue * 1.5, 1e-10),
        })
      }
      return data
    }

    it('should render a basic MA plot', () => {
      const data = generateDEData(100)
      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FoldChange' })
        .geom(geom_ma())

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with labels', () => {
      const data = generateDEData(50)
      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FoldChange', label: 'gene' })
        .geom(geom_ma({ n_labels: 5 }))

      const output = plot.render({ width: 80, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render with custom thresholds', () => {
      const data = generateDEData(100)
      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FoldChange' })
        .geom(geom_ma({
          fc_threshold: 2,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render with p-value column for significance', () => {
      const data = generateDEData(50)
      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FoldChange' })
        .geom(geom_ma({
          p_col: 'padj',
          p_threshold: 0.05,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render without reference lines', () => {
      const data = generateDEData(50)
      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FoldChange' })
        .geom(geom_ma({
          show_baseline: false,
          show_thresholds: false,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle pre-transformed log2 A values', () => {
      const data = generateDEData(50).map(d => ({
        ...d,
        log2BaseMean: Math.log2(d.baseMean),
      }))

      const plot = gg(data)
        .aes({ x: 'log2BaseMean', y: 'log2FoldChange' })
        .geom(geom_ma({ x_is_log2: true }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle empty data gracefully', () => {
      const plot = gg([])
        .aes({ x: 'baseMean', y: 'log2FC' })
        .geom(geom_ma())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with all non-significant points', () => {
      const data = [
        { gene: 'A', baseMean: 100, log2FC: 0.2 },
        { gene: 'B', baseMean: 200, log2FC: -0.3 },
        { gene: 'C', baseMean: 150, log2FC: 0.1 },
      ]

      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FC' })
        .geom(geom_ma())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with highly significant points', () => {
      const data = [
        { gene: 'TP53', baseMean: 5000, log2FC: 3.5, padj: 1e-50 },
        { gene: 'BRCA1', baseMean: 3000, log2FC: -2.8, padj: 1e-40 },
        { gene: 'MYC', baseMean: 8000, log2FC: 2.1, padj: 1e-30 },
      ]

      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FC', label: 'gene' })
        .geom(geom_ma({ n_labels: 3, p_col: 'padj' }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })
  })

  describe('integration with GGPlot', () => {
    it('should work with labs()', () => {
      const data = [
        { gene: 'A', baseMean: 100, log2FC: 2 },
        { gene: 'B', baseMean: 200, log2FC: -1.5 },
      ]

      const plot = gg(data)
        .aes({ x: 'baseMean', y: 'log2FC' })
        .geom(geom_ma())
        .labs({
          title: 'MA Plot',
          x: 'Average Expression',
          y: 'Log2 Fold Change',
        })

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toContain('MA Plot')
    })
  })

  describe('classification logic', () => {
    it('should correctly classify based on fold change only', () => {
      // Without p_col, classification is based only on fc_threshold
      const geom = geom_ma({ fc_threshold: 1 })
      expect(geom.params.fc_threshold).toBe(1)
      expect(geom.params.p_col).toBeUndefined()
    })

    it('should use p-value for classification when p_col specified', () => {
      const geom = geom_ma({
        fc_threshold: 1,
        p_col: 'padj',
        p_threshold: 0.05,
      })
      expect(geom.params.p_col).toBe('padj')
      expect(geom.params.p_threshold).toBe(0.05)
    })
  })
})

describe('MA plot real-world scenarios', () => {
  it('should handle DESeq2-style output', () => {
    // Simulate DESeq2 results
    const data = [
      { gene: 'IL6', baseMean: 5000, log2FoldChange: 4.2, lfcSE: 0.3, pvalue: 1e-100, padj: 1e-98 },
      { gene: 'TNF', baseMean: 3000, log2FoldChange: 3.1, lfcSE: 0.25, pvalue: 1e-80, padj: 1e-78 },
      { gene: 'GAPDH', baseMean: 50000, log2FoldChange: 0.1, lfcSE: 0.05, pvalue: 0.8, padj: 0.9 },
      { gene: 'ACTB', baseMean: 60000, log2FoldChange: -0.05, lfcSE: 0.04, pvalue: 0.9, padj: 0.95 },
      { gene: 'STAT3', baseMean: 2000, log2FoldChange: -2.1, lfcSE: 0.2, pvalue: 1e-40, padj: 1e-38 },
    ]

    const plot = gg(data)
      .aes({ x: 'baseMean', y: 'log2FoldChange', label: 'gene' })
      .geom(geom_ma({
        fc_threshold: 1,
        p_col: 'padj',
        p_threshold: 0.05,
        n_labels: 5,
      }))
      .labs({
        title: 'DESeq2 Results - MA Plot',
        x: 'Mean of Normalized Counts',
        y: 'Log2 Fold Change',
      })

    const output = plot.render({ width: 80, height: 25 })
    expect(output).toBeTruthy()
    expect(output).toContain('DESeq2 Results')
  })

  it('should handle edgeR-style output', () => {
    // Simulate edgeR results
    const data = [
      { gene: 'CXCL8', logCPM: 8.5, logFC: 5.5, PValue: 1e-120, FDR: 1e-118 },
      { gene: 'MYC', logCPM: 7.2, logFC: 2.5, PValue: 1e-60, FDR: 1e-58 },
      { gene: 'HPRT1', logCPM: 5.0, logFC: 0.1, PValue: 0.7, FDR: 0.85 },
    ]

    const plot = gg(data)
      .aes({ x: 'logCPM', y: 'logFC', label: 'gene' })
      .geom(geom_ma({
        x_is_log2: true,  // logCPM is already log-transformed
        p_col: 'FDR',
        n_labels: 2,
      }))

    const output = plot.render({ width: 60, height: 20 })
    expect(output).toBeTruthy()
  })
})
