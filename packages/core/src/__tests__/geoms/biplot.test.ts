import { describe, it, expect } from 'bun:test'
import { geom_biplot, BiplotOptions } from '../../geoms/biplot'
import { gg } from '../../grammar'

describe('geom_biplot', () => {
  describe('geom creation', () => {
    it('should create a biplot geom with default options', () => {
      const geom = geom_biplot()
      expect(geom.type).toBe('biplot')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.pc1_col).toBe('PC1')
      expect(geom.params.pc2_col).toBe('PC2')
      expect(geom.params.show_scores).toBe(true)
      expect(geom.params.show_loadings).toBe(true)
      expect(geom.params.show_origin).toBe(true)
    })

    it('should accept custom PC column names', () => {
      const geom = geom_biplot({
        pc1_col: 'Dim1',
        pc2_col: 'Dim2',
      })
      expect(geom.params.pc1_col).toBe('Dim1')
      expect(geom.params.pc2_col).toBe('Dim2')
    })

    it('should accept loadings data', () => {
      const loadings = [
        { variable: 'Var1', pc1: 0.5, pc2: 0.3 },
        { variable: 'Var2', pc1: -0.4, pc2: 0.6 },
      ]
      const geom = geom_biplot({ loadings })
      expect(geom.params.loadings).toEqual(loadings)
    })

    it('should accept variance explained', () => {
      const geom = geom_biplot({ var_explained: [0.45, 0.23] })
      expect(geom.params.var_explained).toEqual([0.45, 0.23])
    })

    it('should accept score styling options', () => {
      const geom = geom_biplot({
        show_scores: true,
        score_color: '#0000ff',
        score_size: 2,
        score_alpha: 0.5,
        score_char: '○',
        show_score_labels: true,
      })
      expect(geom.params.show_scores).toBe(true)
      expect(geom.params.score_color).toBe('#0000ff')
      expect(geom.params.score_size).toBe(2)
      expect(geom.params.score_alpha).toBe(0.5)
      expect(geom.params.score_char).toBe('○')
      expect(geom.params.show_score_labels).toBe(true)
    })

    it('should accept loading styling options', () => {
      const geom = geom_biplot({
        show_loadings: true,
        loading_color: '#ff0000',
        loading_scale: 2.5,
        arrow_char: '▶',
        show_loading_labels: false,
      })
      expect(geom.params.show_loadings).toBe(true)
      expect(geom.params.loading_color).toBe('#ff0000')
      expect(geom.params.loading_scale).toBe(2.5)
      expect(geom.params.arrow_char).toBe('▶')
      expect(geom.params.show_loading_labels).toBe(false)
    })

    it('should accept origin and circle options', () => {
      const geom = geom_biplot({
        show_origin: false,
        origin_color: '#cccccc',
        show_circle: true,
        circle_color: '#888888',
      })
      expect(geom.params.show_origin).toBe(false)
      expect(geom.params.origin_color).toBe('#cccccc')
      expect(geom.params.show_circle).toBe(true)
      expect(geom.params.circle_color).toBe('#888888')
    })
  })

  describe('rendering', () => {
    // Generate synthetic PCA data
    const generatePCAData = (n: number) => {
      const data = []
      for (let i = 0; i < n; i++) {
        const group = i < n / 2 ? 'A' : 'B'
        const offset = group === 'A' ? -1 : 1
        data.push({
          sample: `Sample${i + 1}`,
          group,
          PC1: offset + (Math.random() - 0.5) * 2,
          PC2: (Math.random() - 0.5) * 2,
        })
      }
      return data
    }

    it('should render a basic biplot with scores only', () => {
      const data = generatePCAData(20)
      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2' })
        .geom(geom_biplot({ show_loadings: false }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with color grouping', () => {
      const data = generatePCAData(20)
      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2', color: 'group' })
        .geom(geom_biplot({ show_loadings: false }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render with loadings', () => {
      const data = generatePCAData(20)
      const loadings = [
        { variable: 'Sepal.Length', pc1: 0.8, pc2: 0.2 },
        { variable: 'Sepal.Width', pc1: -0.3, pc2: 0.7 },
        { variable: 'Petal.Length', pc1: 0.9, pc2: -0.1 },
        { variable: 'Petal.Width', pc1: 0.85, pc2: -0.15 },
      ]

      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2', color: 'group' })
        .geom(geom_biplot({ loadings }))

      const output = plot.render({ width: 80, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render with sample labels', () => {
      const data = generatePCAData(10)
      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2', label: 'sample' })
        .geom(geom_biplot({ show_score_labels: true, show_loadings: false }))

      const output = plot.render({ width: 80, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render without origin crosshairs', () => {
      const data = generatePCAData(15)
      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2' })
        .geom(geom_biplot({ show_origin: false, show_loadings: false }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle custom PC column names', () => {
      const data = generatePCAData(15).map(d => ({
        ...d,
        Dim1: d.PC1,
        Dim2: d.PC2,
      }))

      const plot = gg(data)
        .aes({ x: 'Dim1', y: 'Dim2' })
        .geom(geom_biplot({
          pc1_col: 'Dim1',
          pc2_col: 'Dim2',
          show_loadings: false,
        }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle empty data gracefully', () => {
      const plot = gg([])
        .aes({ x: 'PC1', y: 'PC2' })
        .geom(geom_biplot())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with all positive values', () => {
      const data = [
        { sample: 'A', PC1: 1, PC2: 2 },
        { sample: 'B', PC1: 3, PC2: 4 },
        { sample: 'C', PC1: 2, PC2: 3 },
      ]

      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2' })
        .geom(geom_biplot({ show_loadings: false }))

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data centered around origin', () => {
      const data = [
        { sample: 'A', PC1: -2, PC2: -1 },
        { sample: 'B', PC1: -1, PC2: 1 },
        { sample: 'C', PC1: 1, PC2: -1 },
        { sample: 'D', PC1: 2, PC2: 1 },
      ]

      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2' })
        .geom(geom_biplot({ show_loadings: false }))

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })
  })

  describe('integration with GGPlot', () => {
    it('should work with labs()', () => {
      const data = [
        { sample: 'A', PC1: 1, PC2: 2, group: 'Control' },
        { sample: 'B', PC1: -1, PC2: -2, group: 'Treatment' },
      ]

      const plot = gg(data)
        .aes({ x: 'PC1', y: 'PC2', color: 'group' })
        .geom(geom_biplot({ show_loadings: false }))
        .labs({
          title: 'PCA Biplot',
          x: 'PC1 (45%)',
          y: 'PC2 (23%)',
        })

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toContain('PCA Biplot')
    })
  })
})

describe('Biplot real-world scenarios', () => {
  it('should handle iris-style PCA results', () => {
    // Simulated iris PCA results
    const data = [
      // Setosa cluster
      { sample: 'setosa1', species: 'setosa', PC1: -2.5, PC2: 0.5 },
      { sample: 'setosa2', species: 'setosa', PC1: -2.3, PC2: 0.3 },
      { sample: 'setosa3', species: 'setosa', PC1: -2.7, PC2: 0.7 },
      // Versicolor cluster
      { sample: 'versicolor1', species: 'versicolor', PC1: 0.5, PC2: -0.5 },
      { sample: 'versicolor2', species: 'versicolor', PC1: 0.3, PC2: -0.3 },
      { sample: 'versicolor3', species: 'versicolor', PC1: 0.7, PC2: -0.7 },
      // Virginica cluster
      { sample: 'virginica1', species: 'virginica', PC1: 2.5, PC2: 0.2 },
      { sample: 'virginica2', species: 'virginica', PC1: 2.3, PC2: 0.4 },
      { sample: 'virginica3', species: 'virginica', PC1: 2.7, PC2: 0.0 },
    ]

    const loadings = [
      { variable: 'Sepal.L', pc1: 0.52, pc2: -0.38 },
      { variable: 'Sepal.W', pc1: -0.27, pc2: 0.92 },
      { variable: 'Petal.L', pc1: 0.58, pc2: 0.02 },
      { variable: 'Petal.W', pc1: 0.57, pc2: 0.07 },
    ]

    const plot = gg(data)
      .aes({ x: 'PC1', y: 'PC2', color: 'species' })
      .geom(geom_biplot({
        loadings,
        var_explained: [0.73, 0.23],
      }))
      .labs({
        title: 'Iris PCA Biplot',
        x: 'PC1 (73%)',
        y: 'PC2 (23%)',
      })

    const output = plot.render({ width: 80, height: 25 })
    expect(output).toBeTruthy()
    expect(output).toContain('Iris PCA')
  })

  it('should handle metabolomics PCA', () => {
    const data = []
    const groups = ['Healthy', 'Disease']
    for (let i = 0; i < 20; i++) {
      const group = groups[i % 2]
      const offset = group === 'Healthy' ? -1.5 : 1.5
      data.push({
        sample: `P${i + 1}`,
        group,
        PC1: offset + (Math.random() - 0.5) * 2,
        PC2: (Math.random() - 0.5) * 3,
      })
    }

    const loadings = [
      { variable: 'Glucose', pc1: 0.7, pc2: 0.2 },
      { variable: 'Lactate', pc1: 0.6, pc2: -0.3 },
      { variable: 'Pyruvate', pc1: -0.5, pc2: 0.6 },
    ]

    const plot = gg(data)
      .aes({ x: 'PC1', y: 'PC2', color: 'group' })
      .geom(geom_biplot({ loadings }))
      .labs({ title: 'Metabolomics PCA' })

    const output = plot.render({ width: 80, height: 25 })
    expect(output).toBeTruthy()
  })
})
