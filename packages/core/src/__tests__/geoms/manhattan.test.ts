import { describe, it, expect } from 'bun:test'
import { geom_manhattan, ManhattanOptions } from '../../geoms/manhattan'
import { gg } from '../../grammar'

describe('geom_manhattan', () => {
  describe('geom creation', () => {
    it('should create a Manhattan geom with default options', () => {
      const geom = geom_manhattan()
      expect(geom.type).toBe('manhattan')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
      expect(geom.params.suggestive_threshold).toBe(1e-5)
      expect(geom.params.genome_wide_threshold).toBe(5e-8)
      expect(geom.params.y_is_neglog10).toBe(false)
      expect(geom.params.show_thresholds).toBe(true)
      expect(geom.params.n_labels).toBe(0)
    })

    it('should accept custom significance thresholds', () => {
      const geom = geom_manhattan({
        suggestive_threshold: 1e-4,
        genome_wide_threshold: 1e-7,
      })
      expect(geom.params.suggestive_threshold).toBe(1e-4)
      expect(geom.params.genome_wide_threshold).toBe(1e-7)
    })

    it('should accept y_is_neglog10 option', () => {
      const geom = geom_manhattan({ y_is_neglog10: true })
      expect(geom.params.y_is_neglog10).toBe(true)
    })

    it('should accept custom colors', () => {
      const geom = geom_manhattan({
        chr_colors: ['#ff0000', '#00ff00'],
        highlight_color: '#0000ff',
        suggestive_color: '#ffff00',
      })
      expect(geom.params.chr_colors).toEqual(['#ff0000', '#00ff00'])
      expect(geom.params.highlight_color).toBe('#0000ff')
      expect(geom.params.suggestive_color).toBe('#ffff00')
    })

    it('should accept threshold line options', () => {
      const geom = geom_manhattan({
        show_thresholds: false,
        threshold_linetype: 'dotted',
      })
      expect(geom.params.show_thresholds).toBe(false)
      expect(geom.params.threshold_linetype).toBe('dotted')
    })

    it('should accept labeling options', () => {
      const geom = geom_manhattan({ n_labels: 10 })
      expect(geom.params.n_labels).toBe(10)
    })

    it('should accept point styling options', () => {
      const geom = geom_manhattan({
        size: 2,
        alpha: 0.8,
        point_char: '○',
      })
      expect(geom.params.size).toBe(2)
      expect(geom.params.alpha).toBe(0.8)
      expect(geom.params.point_char).toBe('○')
    })

    it('should accept chromosome gap option', () => {
      const geom = geom_manhattan({ chr_gap: 0.05 })
      expect(geom.params.chr_gap).toBe(0.05)
    })
  })

  describe('rendering', () => {
    // Generate synthetic GWAS data
    const generateGWASData = (n: number) => {
      const chromosomes = ['1', '2', '3', '4', '5']
      const data = []
      for (let i = 0; i < n; i++) {
        const chr = chromosomes[Math.floor(Math.random() * chromosomes.length)]
        const pos = Math.floor(Math.random() * 1e8)
        const pvalue = Math.random() * Math.random() * Math.random() // Skewed towards 0
        data.push({
          snp: `rs${i}`,
          chr,
          pos,
          pvalue: Math.max(pvalue, 1e-300),
        })
      }
      return data
    }

    it('should render a basic Manhattan plot', () => {
      const data = generateGWASData(100)
      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr' })
        .geom(geom_manhattan())

      const output = plot.render({ width: 80, height: 20 })
      expect(output).toBeTruthy()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should render with labels', () => {
      const data = generateGWASData(50)
      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr', label: 'snp' })
        .geom(geom_manhattan({ n_labels: 5 }))

      const output = plot.render({ width: 80, height: 25 })
      expect(output).toBeTruthy()
    })

    it('should render with custom thresholds', () => {
      const data = generateGWASData(100)
      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr' })
        .geom(geom_manhattan({
          suggestive_threshold: 1e-4,
          genome_wide_threshold: 1e-6,
        }))

      const output = plot.render({ width: 80, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should render without threshold lines', () => {
      const data = generateGWASData(50)
      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr' })
        .geom(geom_manhattan({ show_thresholds: false }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle pre-transformed -log10 p-values', () => {
      const data = generateGWASData(50).map(d => ({
        ...d,
        neglogp: -Math.log10(d.pvalue),
      }))

      const plot = gg(data)
        .aes({ x: 'pos', y: 'neglogp', color: 'chr' })
        .geom(geom_manhattan({ y_is_neglog10: true }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })

    it('should handle empty data gracefully', () => {
      const plot = gg([])
        .aes({ x: 'pos', y: 'pvalue' })
        .geom(geom_manhattan())

      const output = plot.render({ width: 40, height: 15 })
      expect(output).toBeTruthy()
    })

    it('should handle data with significant hits', () => {
      const data = [
        { snp: 'rs123', chr: '1', pos: 1000000, pvalue: 1e-9 },
        { snp: 'rs456', chr: '2', pos: 2000000, pvalue: 1e-6 },
        { snp: 'rs789', chr: '3', pos: 3000000, pvalue: 0.05 },
      ]

      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr', label: 'snp' })
        .geom(geom_manhattan({ n_labels: 2 }))

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toBeTruthy()
    })
  })

  describe('integration with GGPlot', () => {
    it('should work with labs()', () => {
      const data = [
        { snp: 'rs1', chr: '1', pos: 100, pvalue: 1e-5 },
        { snp: 'rs2', chr: '2', pos: 200, pvalue: 1e-3 },
      ]

      const plot = gg(data)
        .aes({ x: 'pos', y: 'pvalue', color: 'chr' })
        .geom(geom_manhattan())
        .labs({
          title: 'GWAS Manhattan Plot',
          x: 'Genomic Position',
          y: '-log10(p-value)',
        })

      const output = plot.render({ width: 60, height: 20 })
      expect(output).toContain('GWAS Manhattan Plot')
    })
  })
})

describe('Manhattan plot real-world scenarios', () => {
  it('should handle multi-chromosome GWAS data', () => {
    const data = []
    for (let chr = 1; chr <= 22; chr++) {
      for (let i = 0; i < 10; i++) {
        data.push({
          snp: `rs${chr}_${i}`,
          chr: String(chr),
          pos: i * 1e7,
          pvalue: Math.random() * 0.1,
        })
      }
    }
    // Add some significant hits
    data.push({ snp: 'rs_sig1', chr: '6', pos: 3e7, pvalue: 1e-10 })
    data.push({ snp: 'rs_sig2', chr: '11', pos: 5e7, pvalue: 5e-9 })

    const plot = gg(data)
      .aes({ x: 'pos', y: 'pvalue', color: 'chr', label: 'snp' })
      .geom(geom_manhattan({
        n_labels: 2,
      }))
      .labs({ title: 'Genome-Wide Association Study' })

    const output = plot.render({ width: 100, height: 25 })
    expect(output).toBeTruthy()
    expect(output).toContain('Genome-Wide')
  })
})
