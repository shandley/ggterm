import { describe, it, expect } from 'bun:test'
import { geom_heatmap, HeatmapOptions } from '../../geoms/heatmap'
import { gg } from '../../grammar'

describe('geom_heatmap', () => {
  describe('geom creation', () => {
    it('should create a heatmap geom with default options', () => {
      const geom = geom_heatmap()
      expect(geom.type).toBe('heatmap')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.value_col).toBe('value')
      expect(geom.params.cluster_rows).toBe(false)
      expect(geom.params.cluster_cols).toBe(false)
      expect(geom.params.show_row_labels).toBe(true)
      expect(geom.params.show_col_labels).toBe(true)
      expect(geom.params.scale).toBe('none')
    })

    it('should accept custom color options', () => {
      const geom = geom_heatmap({
        low_color: '#0000ff',
        mid_color: '#ffffff',
        high_color: '#ff0000',
        na_color: '#cccccc',
      })
      expect(geom.params.low_color).toBe('#0000ff')
      expect(geom.params.mid_color).toBe('#ffffff')
      expect(geom.params.high_color).toBe('#ff0000')
      expect(geom.params.na_color).toBe('#cccccc')
    })

    it('should accept clustering options', () => {
      const geom = geom_heatmap({
        cluster_rows: true,
        cluster_cols: true,
        clustering_method: 'average',
        clustering_distance: 'correlation',
      })
      expect(geom.params.cluster_rows).toBe(true)
      expect(geom.params.cluster_cols).toBe(true)
      expect(geom.params.clustering_method).toBe('average')
      expect(geom.params.clustering_distance).toBe('correlation')
    })

    it('should accept dendrogram options', () => {
      const geom = geom_heatmap({
        show_row_dendrogram: false,
        show_col_dendrogram: true,
        dendrogram_ratio: 0.2,
      })
      expect(geom.params.show_row_dendrogram).toBe(false)
      expect(geom.params.show_col_dendrogram).toBe(true)
      expect(geom.params.dendrogram_ratio).toBe(0.2)
    })

    it('should accept label options', () => {
      const geom = geom_heatmap({
        show_row_labels: false,
        show_col_labels: false,
        show_values: true,
        value_format: '.1f',
      })
      expect(geom.params.show_row_labels).toBe(false)
      expect(geom.params.show_col_labels).toBe(false)
      expect(geom.params.show_values).toBe(true)
      expect(geom.params.value_format).toBe('.1f')
    })

    it('should accept scaling options', () => {
      const geom = geom_heatmap({ scale: 'row' })
      expect(geom.params.scale).toBe('row')
    })
  })

  describe('rendering', () => {
    // Generate gene expression matrix data
    const generateExpressionData = (nGenes: number, nSamples: number) => {
      const data = []
      for (let g = 0; g < nGenes; g++) {
        for (let s = 0; s < nSamples; s++) {
          data.push({
            gene: `Gene${g + 1}`,
            sample: `Sample${s + 1}`,
            expression: Math.random() * 10 - 5, // Range -5 to 5
          })
        }
      }
      return data
    }

    it('should render a basic heatmap', () => {
      const data = generateExpressionData(5, 4)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap())

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with row clustering', () => {
      const data = generateExpressionData(6, 4)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({ cluster_rows: true }))

      const output = plot.render({ width: 60, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render with column clustering', () => {
      const data = generateExpressionData(4, 6)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({ cluster_cols: true }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render with both row and column clustering', () => {
      const data = generateExpressionData(5, 5)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({
          cluster_rows: true,
          cluster_cols: true,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render with row scaling', () => {
      const data = generateExpressionData(4, 4)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({ scale: 'row' }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render with column scaling', () => {
      const data = generateExpressionData(4, 4)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({ scale: 'column' }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render without labels', () => {
      const data = generateExpressionData(4, 4)
      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap({
          show_row_labels: false,
          show_col_labels: false,
        }))

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle empty data gracefully', () => {
      const plot = gg([])
        .aes({ x: 'sample', y: 'gene', fill: 'value' })
        .geom(geom_heatmap())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle missing values', () => {
      const data = [
        { gene: 'A', sample: 'S1', expression: 1 },
        { gene: 'A', sample: 'S2', expression: 2 },
        { gene: 'B', sample: 'S1', expression: 3 },
        // Missing B, S2
      ]

      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })
  })

  describe('integration with GGPlot', () => {
    it('should work with labs()', () => {
      const data = [
        { gene: 'TP53', sample: 'Control', expression: 0 },
        { gene: 'TP53', sample: 'Treatment', expression: 2 },
        { gene: 'BRCA1', sample: 'Control', expression: 1 },
        { gene: 'BRCA1', sample: 'Treatment', expression: -1 },
      ]

      const plot = gg(data)
        .aes({ x: 'sample', y: 'gene', fill: 'expression' })
        .geom(geom_heatmap())
        .labs({
          title: 'Gene Expression Heatmap',
          x: 'Sample',
          y: 'Gene',
        })

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toContain('Gene Expression Heatmap')
    })
  })
})

describe('Heatmap real-world scenarios', () => {
  it('should handle RNA-seq expression matrix', () => {
    const genes = ['IL6', 'TNF', 'IFNG', 'CXCL8', 'IL1B']
    const samples = ['Control1', 'Control2', 'Treat1', 'Treat2']
    const data = []

    for (const gene of genes) {
      for (const sample of samples) {
        // Simulate differential expression
        const isControl = sample.startsWith('Control')
        const baseExpr = Math.random() * 2
        const diff = isControl ? 0 : (Math.random() - 0.5) * 4
        data.push({
          gene,
          sample,
          expression: baseExpr + diff,
        })
      }
    }

    const plot = gg(data)
      .aes({ x: 'sample', y: 'gene', fill: 'expression' })
      .geom(geom_heatmap({
        cluster_rows: true,
        cluster_cols: true,
        scale: 'row',
      }))
      .labs({ title: 'RNA-seq Expression' })

    const output = plot.render({ width: 70, height: 25 })
    expect(output).toBeTruthy()
    expect(output).toContain('RNA-seq')
  })
})
