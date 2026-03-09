import { describe, it, expect } from 'bun:test'
import { BUILTIN_DATASETS, DATASET_INFO, DATASET_NAMES } from '../datasets'

describe('BUILTIN_DATASETS', () => {
  it('should have 4 datasets', () => {
    expect(DATASET_NAMES).toHaveLength(4)
    expect(DATASET_NAMES).toContain('iris')
    expect(DATASET_NAMES).toContain('mtcars')
    expect(DATASET_NAMES).toContain('airway')
    expect(DATASET_NAMES).toContain('lung')
  })

  describe('iris', () => {
    it('should return 150 rows with correct headers', () => {
      const result = BUILTIN_DATASETS.iris()
      expect(result.data).toHaveLength(150)
      expect(result.headers).toEqual(['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'])
    })

    it('should have valid species values', () => {
      const result = BUILTIN_DATASETS.iris()
      const species = new Set(result.data.map(r => r.species))
      expect(species).toEqual(new Set(['setosa', 'versicolor', 'virginica']))
    })
  })

  describe('mtcars', () => {
    it('should return 16 rows with correct headers', () => {
      const result = BUILTIN_DATASETS.mtcars()
      expect(result.data).toHaveLength(16)
      expect(result.headers).toEqual(['name', 'mpg', 'cyl', 'hp', 'wt'])
    })
  })

  describe('airway', () => {
    it('should return 500 rows with DESeq2 columns', () => {
      const result = BUILTIN_DATASETS.airway()
      expect(result.data).toHaveLength(500)
      expect(result.headers).toEqual(['gene', 'baseMean', 'log2FoldChange', 'lfcSE', 'pvalue', 'padj'])
    })

    it('should have numeric DESeq2 values', () => {
      const result = BUILTIN_DATASETS.airway()
      const row = result.data[0]
      expect(typeof row.baseMean).toBe('number')
      expect(typeof row.log2FoldChange).toBe('number')
      expect(typeof row.pvalue).toBe('number')
      expect(typeof row.padj).toBe('number')
    })

    it('should have gene symbols as strings', () => {
      const result = BUILTIN_DATASETS.airway()
      result.data.forEach(r => {
        expect(typeof r.gene).toBe('string')
        expect((r.gene as string).length).toBeGreaterThan(0)
      })
    })

    it('should contain a mix of significant and non-significant genes', () => {
      const result = BUILTIN_DATASETS.airway()
      const sig = result.data.filter(r =>
        (r.padj as number) < 0.05 && Math.abs(r.log2FoldChange as number) > 1
      )
      const nonsig = result.data.filter(r =>
        (r.padj as number) >= 0.05 || Math.abs(r.log2FoldChange as number) <= 1
      )
      expect(sig.length).toBeGreaterThan(50)
      expect(nonsig.length).toBeGreaterThan(100)
    })
  })

  describe('lung', () => {
    it('should return 227 rows with correct headers', () => {
      const result = BUILTIN_DATASETS.lung()
      expect(result.data).toHaveLength(227)
      expect(result.headers).toEqual(['time', 'status', 'age', 'sex', 'ph_ecog'])
    })

    it('should have binary status values (0 or 1)', () => {
      const result = BUILTIN_DATASETS.lung()
      result.data.forEach(r => {
        expect([0, 1]).toContain(r.status)
      })
    })

    it('should have sex as male or female', () => {
      const result = BUILTIN_DATASETS.lung()
      const sexValues = new Set(result.data.map(r => r.sex))
      expect(sexValues).toEqual(new Set(['male', 'female']))
    })

    it('should have numeric time, age, and ph_ecog', () => {
      const result = BUILTIN_DATASETS.lung()
      const row = result.data[0]
      expect(typeof row.time).toBe('number')
      expect(typeof row.age).toBe('number')
      expect(typeof row.ph_ecog).toBe('number')
    })
  })

  describe('DATASET_INFO', () => {
    it('should have info for all datasets', () => {
      for (const name of DATASET_NAMES) {
        expect(DATASET_INFO[name]).toBeDefined()
        expect(DATASET_INFO[name].name).toBe(name)
        expect(DATASET_INFO[name].headers.length).toBeGreaterThan(0)
      }
    })
  })
})
