import { describe, it, expect } from 'bun:test'
import { plotSpecToVegaLite, exportToVegaLiteJSON } from '../../export'
import type { PlotSpec } from '../../types'

describe('Vega-Lite export', () => {
  const simpleSpec: PlotSpec = {
    data: [
      { x: 1, y: 10, cat: 'A' },
      { x: 2, y: 20, cat: 'A' },
      { x: 3, y: 15, cat: 'B' },
    ],
    aes: { x: 'x', y: 'y' },
    geoms: [{ type: 'point', params: {} }],
    labels: { title: 'Test Plot', x: 'X Value', y: 'Y Value' },
    scales: [],
    theme: {} as any,
  }

  describe('plotSpecToVegaLite', () => {
    it('generates valid Vega-Lite schema', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json')
    })

    it('sets dimensions from options', () => {
      const vl = plotSpecToVegaLite(simpleSpec, { width: 800, height: 600 })
      expect(vl.width).toBe(800)
      expect(vl.height).toBe(600)
    })

    it('includes data values', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.data.values).toHaveLength(3)
      expect(vl.data.values[0]).toEqual({ x: 1, y: 10, cat: 'A' })
    })

    it('maps title', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.title).toBe('Test Plot')
    })

    it('maps title with subtitle', () => {
      const specWithSubtitle: PlotSpec = {
        ...simpleSpec,
        labels: { ...simpleSpec.labels, subtitle: 'A subtitle' },
      }
      const vl = plotSpecToVegaLite(specWithSubtitle)
      expect(vl.title).toEqual({ text: 'Test Plot', subtitle: 'A subtitle' })
    })

    it('maps point geom to point mark', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.mark).toBe('point')
    })

    it('maps line geom to line mark', () => {
      const lineSpec: PlotSpec = {
        ...simpleSpec,
        geoms: [{ type: 'line', params: {} }],
      }
      const vl = plotSpecToVegaLite(lineSpec)
      expect(vl.mark).toBe('line')
    })

    it('maps encoding from aesthetics', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.encoding?.x).toMatchObject({ field: 'x', type: 'quantitative' })
      expect(vl.encoding?.y).toMatchObject({ field: 'y', type: 'quantitative' })
    })

    it('includes axis titles', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect((vl.encoding?.x as any).title).toBe('X Value')
      expect((vl.encoding?.y as any).title).toBe('Y Value')
    })

    it('maps color aesthetic', () => {
      const colorSpec: PlotSpec = {
        ...simpleSpec,
        aes: { ...simpleSpec.aes, color: 'cat' },
      }
      const vl = plotSpecToVegaLite(colorSpec)
      expect(vl.encoding?.color).toMatchObject({ field: 'cat', type: 'nominal' })
    })

    it('handles histogram geom', () => {
      const histSpec: PlotSpec = {
        ...simpleSpec,
        aes: { x: 'x' },
        geoms: [{ type: 'histogram', params: { bins: 15 } }],
      }
      const vl = plotSpecToVegaLite(histSpec)
      expect(vl.mark).toBe('bar')
      expect((vl.encoding?.x as any).bin).toMatchObject({ maxbins: 15 })
      expect((vl.encoding?.y as any).aggregate).toBe('count')
    })

    it('handles boxplot geom', () => {
      const boxSpec: PlotSpec = {
        ...simpleSpec,
        geoms: [{ type: 'boxplot', params: {} }],
      }
      const vl = plotSpecToVegaLite(boxSpec)
      expect(vl.mark).toMatchObject({ type: 'boxplot', extent: 'min-max' })
    })

    it('handles multiple geoms as layers', () => {
      const multiSpec: PlotSpec = {
        ...simpleSpec,
        geoms: [
          { type: 'point', params: {} },
          { type: 'line', params: {} },
        ],
      }
      const vl = plotSpecToVegaLite(multiSpec)
      expect(vl.layer).toHaveLength(2)
      expect(vl.layer?.[0].mark).toBe('point')
      expect(vl.layer?.[1].mark).toBe('line')
    })

    it('applies publication config by default', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect(vl.config).toBeDefined()
      expect(vl.config?.font).toBe('Arial')
      expect(vl.config?.title).toMatchObject({ fontSize: 16 })
    })

    it('skips publication config when disabled', () => {
      const vl = plotSpecToVegaLite(simpleSpec, { publication: false })
      expect(vl.config).toBeUndefined()
    })

    it('maps geom params to mark properties', () => {
      const paramSpec: PlotSpec = {
        ...simpleSpec,
        geoms: [{ type: 'point', params: { size: 3, alpha: 0.5, color: 'red' } }],
      }
      const vl = plotSpecToVegaLite(paramSpec)
      expect(vl.mark).toMatchObject({
        type: 'point',
        size: 60, // 3 * 20
        opacity: 0.5,
        color: 'red',
      })
    })
  })

  describe('exportToVegaLiteJSON', () => {
    it('returns valid JSON string', () => {
      const json = exportToVegaLiteJSON(simpleSpec)
      const parsed = JSON.parse(json)
      expect(parsed.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json')
    })

    it('is pretty-printed', () => {
      const json = exportToVegaLiteJSON(simpleSpec)
      expect(json).toContain('\n')
      expect(json).toContain('  ')
    })
  })

  describe('field type inference', () => {
    it('infers quantitative for numbers', () => {
      const vl = plotSpecToVegaLite(simpleSpec)
      expect((vl.encoding?.x as any).type).toBe('quantitative')
    })

    it('infers nominal for strings', () => {
      const stringSpec: PlotSpec = {
        ...simpleSpec,
        data: [
          { x: 'a', y: 10 },
          { x: 'b', y: 20 },
        ],
        aes: { x: 'x', y: 'y' },
      }
      const vl = plotSpecToVegaLite(stringSpec)
      expect((vl.encoding?.x as any).type).toBe('nominal')
    })

    it('infers temporal for timestamp-like numbers', () => {
      const dateSpec: PlotSpec = {
        ...simpleSpec,
        data: [
          { date: 1704067200000, y: 10 }, // 2024-01-01
          { date: 1704153600000, y: 20 }, // 2024-01-02
        ],
        aes: { x: 'date', y: 'y' },
      }
      const vl = plotSpecToVegaLite(dateSpec)
      expect((vl.encoding?.x as any).type).toBe('temporal')
    })
  })
})
