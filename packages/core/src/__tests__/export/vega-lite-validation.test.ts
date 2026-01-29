/**
 * Vega-Lite Export Validation Tests
 *
 * These tests verify that the Vega-Lite export system correctly:
 * 1. Maps all geom types to valid Vega-Lite marks
 * 2. Produces correct encoding for different aesthetic types
 * 3. Handles special cases (histograms, boxplots, heatmaps)
 * 4. Supports multi-layer specs
 * 5. Handles faceting correctly
 *
 * Common issues this catches:
 * - Missing geom → mark mappings (geom renders as default 'point')
 * - Wrong field types (nominal vs quantitative)
 * - Missing heatmap color encoding
 * - Broken histogram/boxplot aggregations
 */

import { describe, expect, it } from 'bun:test'
import { plotSpecToVegaLite, exportToVegaLiteJSON } from '../../export/vega-lite'
import type { PlotSpec, Geom } from '../../types'

// Helper to create minimal PlotSpec
function createSpec(overrides: Partial<PlotSpec> = {}): PlotSpec {
  return {
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ],
    aes: { x: 'x', y: 'y' },
    geoms: [{ type: 'point', params: {} }],
    scales: [],
    coord: { type: 'cartesian' },
    labels: {},
    theme: {
      text: { color: '#000' },
      axis: { color: '#000', lineWidth: 1 },
      panel: { background: '#fff', gridColor: '#ccc' },
      legend: { position: 'right' },
    },
    ...overrides,
  }
}

// All geom types that should be exportable
const ALL_GEOM_TYPES = [
  'point', 'line', 'path', 'step', 'bar', 'col', 'histogram', 'freqpoly',
  'boxplot', 'violin', 'area', 'ribbon', 'rug', 'errorbar', 'errorbarh',
  'crossbar', 'linerange', 'pointrange', 'smooth', 'segment', 'rect',
  'raster', 'tile', 'bin2d', 'text', 'label', 'contour', 'contour_filled',
  'density_2d', 'qq', 'hline', 'vline', 'abline', 'curve', 'qq_line',
]

// Valid Vega-Lite mark types
const VALID_VL_MARKS = [
  'point', 'line', 'bar', 'area', 'rect', 'rule', 'text', 'tick',
  'circle', 'square', 'geoshape', 'boxplot', 'errorbar', 'errorband',
  'trail', 'image', 'arc',
]

describe('GEOM_TO_MARK mapping coverage', () => {
  it('should produce valid Vega-Lite mark for all common geom types', () => {
    const commonGeoms = ['point', 'line', 'bar', 'area', 'boxplot', 'histogram']

    for (const geomType of commonGeoms) {
      const spec = createSpec({
        geoms: [{ type: geomType, params: {} }],
      })
      const vlSpec = plotSpecToVegaLite(spec)

      const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : vlSpec.mark?.type
      expect(mark).toBeDefined()
      expect(VALID_VL_MARKS).toContain(mark)
    }
  })

  it('should map heatmap geoms (tile, raster) to rect mark', () => {
    for (const geomType of ['tile', 'raster']) {
      const spec = createSpec({
        geoms: [{ type: geomType, params: {} }],
      })
      const vlSpec = plotSpecToVegaLite(spec)

      const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : vlSpec.mark?.type
      expect(mark).toBe('rect')
    }
  })

  it('should map segment to rule mark', () => {
    const spec = createSpec({
      geoms: [{ type: 'segment', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : vlSpec.mark?.type
    expect(mark).toBe('rule')
  })

  it('should map step to line with interpolation', () => {
    const spec = createSpec({
      geoms: [{ type: 'step', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { type: string; interpolate?: string }
    expect(markObj.type).toBe('line')
    expect(markObj.interpolate).toBe('step-after')
  })

  it('should map smooth to line with monotone interpolation', () => {
    const spec = createSpec({
      geoms: [{ type: 'smooth', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { type: string; interpolate?: string }
    expect(markObj.type).toBe('line')
    expect(markObj.interpolate).toBe('monotone')
  })

  it('should fall back to point for unknown geom types', () => {
    const spec = createSpec({
      geoms: [{ type: 'unknown_geom_type', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : vlSpec.mark?.type
    expect(mark).toBe('point')
  })

  it('should document geoms that need export support added', () => {
    // These geoms don't have explicit mappings and would fall back to 'point'
    // This test documents which geoms need attention
    const geomsNeedingSupport: string[] = []

    for (const geomType of ALL_GEOM_TYPES) {
      const spec = createSpec({
        geoms: [{ type: geomType, params: {} }],
      })
      const vlSpec = plotSpecToVegaLite(spec)

      const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : vlSpec.mark?.type

      // If it falls back to point but isn't actually a point geom, note it
      if (mark === 'point' && geomType !== 'point') {
        geomsNeedingSupport.push(geomType)
      }
    }

    // Document current state - these geoms fall back to point
    // Note: qq intentionally falls back to point (Q-Q plots are scatter plots)
    // All other geoms now have proper Vega-Lite mappings
    const expectedFallbacks = [
      'qq', // Intentional: Q-Q plots are scatter plots of quantiles
    ]

    // This test will fail when new geoms are added but not mapped
    expect(geomsNeedingSupport.sort()).toEqual(expectedFallbacks.sort())
  })
})

describe('Encoding generation', () => {
  it('should generate x encoding with correct field type', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.x).toBeDefined()
    const xEnc = vlSpec.encoding!.x as { field: string; type: string }
    expect(xEnc.field).toBe('x')
    expect(xEnc.type).toBe('quantitative')
  })

  it('should generate y encoding with correct field type', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.y).toBeDefined()
    const yEnc = vlSpec.encoding!.y as { field: string; type: string }
    expect(yEnc.field).toBe('y')
    expect(yEnc.type).toBe('quantitative')
  })

  it('should detect categorical fields as nominal', () => {
    const spec = createSpec({
      data: [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
        { x: 'C', y: 30 },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { field: string; type: string }
    expect(xEnc.type).toBe('nominal')
  })

  it('should generate color encoding when color aesthetic is mapped', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, color: 'A' },
        { x: 2, y: 20, color: 'B' },
      ],
      aes: { x: 'x', y: 'y', color: 'color' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.color).toBeDefined()
    const colorEnc = vlSpec.encoding!.color as { field: string; type: string }
    expect(colorEnc.field).toBe('color')
    expect(colorEnc.type).toBe('nominal')
  })

  it('should generate size encoding when size aesthetic is mapped', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, size: 5 },
        { x: 2, y: 20, size: 10 },
      ],
      aes: { x: 'x', y: 'y', size: 'size' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.size).toBeDefined()
    const sizeEnc = vlSpec.encoding!.size as { field: string; type: string }
    expect(sizeEnc.field).toBe('size')
    expect(sizeEnc.type).toBe('quantitative')
  })

  it('should generate shape encoding when shape aesthetic is mapped', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, shape: 'circle' },
        { x: 2, y: 20, shape: 'square' },
      ],
      aes: { x: 'x', y: 'y', shape: 'shape' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.shape).toBeDefined()
    const shapeEnc = vlSpec.encoding!.shape as { field: string; type: string }
    expect(shapeEnc.field).toBe('shape')
    expect(shapeEnc.type).toBe('nominal')
  })
})

describe('Heatmap encoding (tile/raster)', () => {
  it('should use ordinal type for x/y in heatmaps with quantitative data', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 1, fill: 5 },
        { x: 2, y: 2, fill: 10 },
      ],
      aes: { x: 'x', y: 'y', fill: 'fill' },
      geoms: [{ type: 'tile', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { type: string }
    const yEnc = vlSpec.encoding!.y as { type: string }

    // For heatmaps, quantitative data should be treated as ordinal for grid layout
    expect(xEnc.type).toBe('ordinal')
    expect(yEnc.type).toBe('ordinal')
  })

  it('should map fill aesthetic to color encoding with viridis scale', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 1, fill: 5 },
        { x: 2, y: 2, fill: 10 },
      ],
      aes: { x: 'x', y: 'y', fill: 'fill' },
      geoms: [{ type: 'tile', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.color).toBeDefined()
    const colorEnc = vlSpec.encoding!.color as { field: string; scale: { scheme: string } }
    expect(colorEnc.field).toBe('fill')
    expect(colorEnc.scale?.scheme).toBe('viridis')
  })

  it('should use quantitative type for fill values in heatmap color', () => {
    const spec = createSpec({
      data: [
        { x: 'A', y: 'X', fill: 5 },
        { x: 'B', y: 'Y', fill: 10 },
      ],
      aes: { x: 'x', y: 'y', fill: 'fill' },
      geoms: [{ type: 'tile', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const colorEnc = vlSpec.encoding!.color as { type: string }
    expect(colorEnc.type).toBe('quantitative')
  })

  it('should enable tooltip for heatmap marks', () => {
    const spec = createSpec({
      geoms: [{ type: 'tile', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { tooltip?: boolean }
    expect(markObj.tooltip).toBe(true)
  })
})

describe('Histogram special handling', () => {
  it('should produce bar mark for histogram', () => {
    const spec = createSpec({
      geoms: [{ type: 'histogram', params: { bins: 20 } }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.mark).toBe('bar')
  })

  it('should add bin transform to x encoding', () => {
    const spec = createSpec({
      geoms: [{ type: 'histogram', params: { bins: 15 } }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { bin: { maxbins: number } }
    expect(xEnc.bin).toBeDefined()
    expect(xEnc.bin.maxbins).toBe(15)
  })

  it('should use aggregate count for y encoding', () => {
    const spec = createSpec({
      geoms: [{ type: 'histogram', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const yEnc = vlSpec.encoding!.y as { aggregate: string }
    expect(yEnc.aggregate).toBe('count')
  })

  it('should support color grouping in histogram', () => {
    const spec = createSpec({
      data: [
        { x: 1, color: 'A' },
        { x: 2, color: 'B' },
      ],
      aes: { x: 'x', y: 'y', color: 'color' },
      geoms: [{ type: 'histogram', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.encoding?.color).toBeDefined()
  })
})

describe('Boxplot special handling', () => {
  it('should produce boxplot mark', () => {
    const spec = createSpec({
      data: [
        { x: 'A', y: 10 },
        { x: 'A', y: 15 },
        { x: 'B', y: 20 },
        { x: 'B', y: 25 },
      ],
      geoms: [{ type: 'boxplot', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const mark = typeof vlSpec.mark === 'string' ? vlSpec.mark : (vlSpec.mark as { type: string }).type
    expect(mark).toBe('boxplot')
  })

  it('should include extent property in boxplot mark', () => {
    const spec = createSpec({
      geoms: [{ type: 'boxplot', params: {} }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { extent: string }
    expect(markObj.extent).toBe('min-max')
  })
})

describe('Multi-layer support', () => {
  it('should create layer array for multiple geoms', () => {
    const spec = createSpec({
      geoms: [
        { type: 'point', params: {} },
        { type: 'line', params: {} },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.layer).toBeDefined()
    expect(vlSpec.layer!.length).toBe(2)
  })

  it('should not have mark/encoding at top level when using layers', () => {
    const spec = createSpec({
      geoms: [
        { type: 'point', params: {} },
        { type: 'line', params: {} },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.mark).toBeUndefined()
    expect(vlSpec.encoding).toBeUndefined()
    expect(vlSpec.layer).toBeDefined()
  })

  it('should have mark and encoding in each layer', () => {
    const spec = createSpec({
      geoms: [
        { type: 'point', params: {} },
        { type: 'line', params: {} },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    for (const layer of vlSpec.layer!) {
      expect(layer.mark).toBeDefined()
      expect(layer.encoding).toBeDefined()
    }
  })

  it('should use correct mark type for each layer', () => {
    const spec = createSpec({
      geoms: [
        { type: 'point', params: {} },
        { type: 'line', params: {} },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const mark0 = typeof vlSpec.layer![0].mark === 'string'
      ? vlSpec.layer![0].mark
      : (vlSpec.layer![0].mark as { type: string }).type
    const mark1 = typeof vlSpec.layer![1].mark === 'string'
      ? vlSpec.layer![1].mark
      : (vlSpec.layer![1].mark as { type: string }).type

    expect(mark0).toBe('point')
    expect(mark1).toBe('line')
  })
})

describe('Faceting support', () => {
  it('should add facet property for facet_wrap', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, group: 'A' },
        { x: 2, y: 20, group: 'B' },
      ],
      facet: { type: 'wrap', vars: 'group' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.facet).toBeDefined()
    expect(vlSpec.facet!.field).toBe('group')
  })

  it('should move mark/encoding to spec property when faceted', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, group: 'A' },
        { x: 2, y: 20, group: 'B' },
      ],
      facet: { type: 'wrap', vars: 'group' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    // Top-level mark/encoding should be moved to spec
    expect(vlSpec.mark).toBeUndefined()
    expect(vlSpec.encoding).toBeUndefined()
    expect(vlSpec.spec).toBeDefined()
    expect(vlSpec.spec!.mark).toBeDefined()
    expect(vlSpec.spec!.encoding).toBeDefined()
  })

  it('should support ncol in facet_wrap', () => {
    const spec = createSpec({
      facet: { type: 'wrap', vars: 'group', ncol: 3 },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.facet!.columns).toBe(3)
  })

  it('should support facet_grid with row variable', () => {
    const spec = createSpec({
      data: [
        { x: 1, y: 10, row: 'A', col: 'X' },
        { x: 2, y: 20, row: 'B', col: 'Y' },
      ],
      facet: { type: 'grid', vars: { rows: 'row' } },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.facet!.row).toBeDefined()
    expect(vlSpec.facet!.row!.field).toBe('row')
  })

  it('should support facet_grid with column variable', () => {
    const spec = createSpec({
      facet: { type: 'grid', vars: { cols: 'col' } },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.facet!.column).toBeDefined()
    expect(vlSpec.facet!.column!.field).toBe('col')
  })

  it('should support facet_grid with both row and column', () => {
    const spec = createSpec({
      facet: { type: 'grid', vars: { rows: 'row', cols: 'col' } },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.facet!.row).toBeDefined()
    expect(vlSpec.facet!.column).toBeDefined()
  })
})

describe('Labels and titles', () => {
  it('should include title from spec', () => {
    const spec = createSpec({
      labels: { title: 'My Plot' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.title).toBe('My Plot')
  })

  it('should support title with subtitle', () => {
    const spec = createSpec({
      labels: { title: 'Main Title', subtitle: 'Subtitle' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.title).toBe('object')
    const titleObj = vlSpec.title as { text: string; subtitle: string }
    expect(titleObj.text).toBe('Main Title')
    expect(titleObj.subtitle).toBe('Subtitle')
  })

  it('should apply x axis label', () => {
    const spec = createSpec({
      labels: { x: 'X Axis Label' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { title: string }
    expect(xEnc.title).toBe('X Axis Label')
  })

  it('should apply y axis label', () => {
    const spec = createSpec({
      labels: { y: 'Y Axis Label' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const yEnc = vlSpec.encoding!.y as { title: string }
    expect(yEnc.title).toBe('Y Axis Label')
  })

  it('should apply color legend label', () => {
    const spec = createSpec({
      data: [{ x: 1, y: 10, color: 'A' }],
      aes: { x: 'x', y: 'y', color: 'color' },
      labels: { color: 'Color Legend' },
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const colorEnc = vlSpec.encoding!.color as { title: string }
    expect(colorEnc.title).toBe('Color Legend')
  })
})

describe('Export options', () => {
  it('should respect width option', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { width: 800 })

    expect(vlSpec.width).toBe(800)
  })

  it('should respect height option', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { height: 500 })

    expect(vlSpec.height).toBe(500)
  })

  it('should include publication config by default', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.config).toBeDefined()
    expect(vlSpec.config!.font).toBe('Arial')
  })

  it('should exclude publication config when publication=false', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { publication: false })

    expect(vlSpec.config).toBeUndefined()
  })
})

describe('Interactivity', () => {
  it('should add params when interactive=true', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { interactive: true })

    expect(vlSpec.params).toBeDefined()
    expect(vlSpec.params!.length).toBeGreaterThan(0)
  })

  it('should add hover param', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { interactive: { hover: true } })

    const hoverParam = vlSpec.params?.find(p => p.name === 'hover')
    expect(hoverParam).toBeDefined()
  })

  it('should add brush param', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { interactive: { brush: true } })

    const brushParam = vlSpec.params?.find(p => p.name === 'brush')
    expect(brushParam).toBeDefined()
  })

  it('should add zoom/grid param', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { interactive: { zoom: true } })

    const gridParam = vlSpec.params?.find(p => p.name === 'grid')
    expect(gridParam).toBeDefined()
    expect(gridParam!.bind).toBe('scales')
  })

  it('should add legend filter when color is mapped', () => {
    const spec = createSpec({
      data: [{ x: 1, y: 10, color: 'A' }],
      aes: { x: 'x', y: 'y', color: 'color' },
    })
    const vlSpec = plotSpecToVegaLite(spec, { interactive: { legendFilter: true } })

    const filterParam = vlSpec.params?.find(p => p.name === 'legendFilter')
    expect(filterParam).toBeDefined()
    expect(filterParam!.bind).toBe('legend')
  })

  it('should add tooltip encoding when tooltip enabled', () => {
    const spec = createSpec()
    const vlSpec = plotSpecToVegaLite(spec, { interactive: { tooltip: true } })

    expect(vlSpec.encoding?.tooltip).toBeDefined()
    expect(Array.isArray(vlSpec.encoding!.tooltip)).toBe(true)
  })
})

describe('JSON export', () => {
  it('should produce valid JSON string', () => {
    const spec = createSpec()
    const json = exportToVegaLiteJSON(spec)

    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('should include $schema in JSON output', () => {
    const spec = createSpec()
    const json = exportToVegaLiteJSON(spec)
    const parsed = JSON.parse(json)

    expect(parsed.$schema).toContain('vega-lite')
  })

  it('should be properly formatted with indentation', () => {
    const spec = createSpec()
    const json = exportToVegaLiteJSON(spec)

    // Check for newlines (formatted)
    expect(json).toContain('\n')
    // Check for indentation
    expect(json).toContain('  ')
  })
})

describe('Field type inference', () => {
  it('should infer quantitative for numeric data', () => {
    const spec = createSpec({
      data: [{ x: 1 }, { x: 2 }, { x: 3 }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { type: string }
    expect(xEnc.type).toBe('quantitative')
  })

  it('should infer nominal for string data', () => {
    const spec = createSpec({
      data: [{ x: 'A' }, { x: 'B' }, { x: 'C' }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { type: string }
    expect(xEnc.type).toBe('nominal')
  })

  it('should infer temporal for date-like timestamps', () => {
    // Timestamps in milliseconds (2020-01-01 to 2020-01-03)
    const spec = createSpec({
      data: [
        { x: 1577836800000 },
        { x: 1577923200000 },
        { x: 1578009600000 },
      ],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { type: string }
    expect(xEnc.type).toBe('temporal')
  })

  it('should add timeUnit for temporal fields', () => {
    const spec = createSpec({
      data: [{ x: 1577836800000 }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    const xEnc = vlSpec.encoding!.x as { timeUnit: string }
    expect(xEnc.timeUnit).toBe('yearmonthdate')
  })
})

describe('Geom params', () => {
  it('should apply alpha as opacity', () => {
    const spec = createSpec({
      geoms: [{ type: 'point', params: { alpha: 0.5 } }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { opacity: number }
    expect(markObj.opacity).toBe(0.5)
  })

  it('should apply size param scaled up', () => {
    const spec = createSpec({
      geoms: [{ type: 'point', params: { size: 5 } }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { size: number }
    expect(markObj.size).toBe(100) // 5 * 20
  })

  it('should apply color param', () => {
    const spec = createSpec({
      geoms: [{ type: 'point', params: { color: 'red' } }],
    })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(typeof vlSpec.mark).toBe('object')
    const markObj = vlSpec.mark as { color: string }
    expect(markObj.color).toBe('red')
  })
})

describe('Edge cases', () => {
  it('should handle empty data', () => {
    const spec = createSpec({ data: [] })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.data.values).toEqual([])
  })

  it('should handle no geoms (defaults to point)', () => {
    const spec = createSpec({ geoms: [] })
    const vlSpec = plotSpecToVegaLite(spec)

    expect(vlSpec.mark).toBe('point')
  })

  it('should handle missing aesthetic fields gracefully', () => {
    const spec = createSpec({
      data: [{ x: 1 }], // No y field
      aes: { x: 'x', y: 'missing' },
    })

    // Should not throw
    expect(() => plotSpecToVegaLite(spec)).not.toThrow()
  })
})
