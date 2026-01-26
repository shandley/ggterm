/**
 * PlotSpec → Vega-Lite converter
 *
 * Converts ggterm PlotSpec to Vega-Lite specification for publication-quality output.
 * Vega-Lite can render to SVG, PNG, PDF via vl2svg, vl2png, vl2pdf CLI tools.
 */

import type { PlotSpec, Geom, AestheticMapping } from '../types'

export interface VegaLiteSpec {
  $schema: string
  width?: number
  height?: number
  title?: string | { text: string; subtitle?: string }
  data: { values: Record<string, unknown>[] }
  mark?: string | { type: string; [key: string]: unknown }
  encoding?: Record<string, unknown>
  layer?: VegaLiteLayer[]
  config?: Record<string, unknown>
}

interface VegaLiteLayer {
  mark: string | { type: string; [key: string]: unknown }
  encoding?: Record<string, unknown>
}

/**
 * Map ggterm geom types to Vega-Lite mark types
 */
const GEOM_TO_MARK: Record<string, string> = {
  point: 'point',
  line: 'line',
  bar: 'bar',
  area: 'area',
  boxplot: 'boxplot',
  rect: 'rect',
  text: 'text',
  rule: 'rule',
  // These need special handling
  histogram: 'bar',
  freqpoly: 'line',
  violin: 'area', // Approximate
  step: 'line',
  path: 'line',
  segment: 'rule',
  smooth: 'line',
  errorbar: 'errorbar',
}

/**
 * Infer Vega-Lite field type from data values
 */
function inferFieldType(data: Record<string, unknown>[], field: string): string {
  const values = data.map(d => d[field]).filter(v => v != null)
  if (values.length === 0) return 'nominal'

  const sample = values[0]

  // Check if it's a date (stored as timestamp)
  if (typeof sample === 'number' && sample > 946684800000 && sample < 4102444800000) {
    return 'temporal'
  }

  if (typeof sample === 'number') {
    return 'quantitative'
  }

  // Check if string values are mostly unique (quantitative-ish) or categorical
  const uniqueRatio = new Set(values).size / values.length
  if (uniqueRatio > 0.5 && values.length > 10) {
    return 'nominal' // Many unique values, likely categorical
  }

  return 'nominal'
}

/**
 * Build Vega-Lite encoding from ggterm aesthetics
 */
function buildEncoding(
  aes: AestheticMapping,
  data: Record<string, unknown>[],
  geom: Geom
): Record<string, unknown> {
  const encoding: Record<string, unknown> = {}

  // X axis
  if (aes.x) {
    const xType = inferFieldType(data, aes.x)
    encoding.x = {
      field: aes.x,
      type: xType,
      ...(xType === 'temporal' ? { timeUnit: 'yearmonthdate' } : {}),
    }
  }

  // Y axis
  if (aes.y) {
    // For histograms, y is count
    if (geom.stat === 'bin' || geom.type === 'histogram') {
      encoding.y = { aggregate: 'count', type: 'quantitative' }
    } else {
      const yType = inferFieldType(data, aes.y)
      encoding.y = {
        field: aes.y,
        type: yType,
      }
    }
  }

  // Color
  if (aes.color) {
    const colorType = inferFieldType(data, aes.color)
    encoding.color = {
      field: aes.color,
      type: colorType,
    }
  }

  // Fill (for bar charts, etc.)
  if (aes.fill && !aes.color) {
    const fillType = inferFieldType(data, aes.fill)
    encoding.color = {
      field: aes.fill,
      type: fillType,
    }
  }

  // Size
  if (aes.size) {
    encoding.size = {
      field: aes.size,
      type: 'quantitative',
    }
  }

  // Shape
  if (aes.shape) {
    encoding.shape = {
      field: aes.shape,
      type: 'nominal',
    }
  }

  return encoding
}

/**
 * Build mark specification from geom
 */
function buildMark(geom: Geom): string | { type: string; [key: string]: unknown } {
  const markType = GEOM_TO_MARK[geom.type] || 'point'

  const markProps: Record<string, unknown> = { type: markType }

  // Add geom params
  if (geom.params) {
    if (geom.params.size) markProps.size = geom.params.size * 20 // Scale up for publication
    if (geom.params.alpha) markProps.opacity = geom.params.alpha
    if (geom.params.color) markProps.color = geom.params.color
    if (geom.params.fill) markProps.fill = geom.params.fill
  }

  // Special handling for certain geoms
  if (geom.type === 'step') {
    markProps.interpolate = 'step-after'
  }
  if (geom.type === 'smooth') {
    markProps.interpolate = 'monotone'
  }
  if (geom.type === 'histogram') {
    markProps.type = 'bar'
  }

  // If only type, return string
  if (Object.keys(markProps).length === 1) {
    return markType
  }

  return markProps
}

/**
 * Build histogram transform for Vega-Lite
 */
function buildHistogramSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping,
  geom: Geom
): Partial<VegaLiteSpec> {
  const bins = geom.params?.bins || 20

  return {
    mark: 'bar',
    encoding: {
      x: {
        field: aes.x,
        bin: { maxbins: bins },
        type: 'quantitative',
      },
      y: {
        aggregate: 'count',
        type: 'quantitative',
      },
      ...(aes.color
        ? {
            color: {
              field: aes.color,
              type: inferFieldType(data, aes.color),
            },
          }
        : {}),
    },
  }
}

/**
 * Build boxplot spec
 */
function buildBoxplotSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> {
  return {
    mark: { type: 'boxplot', extent: 'min-max' },
    encoding: {
      x: {
        field: aes.x,
        type: inferFieldType(data, aes.x),
      },
      y: {
        field: aes.y,
        type: 'quantitative',
      },
      ...(aes.color
        ? {
            color: {
              field: aes.color,
              type: inferFieldType(data, aes.color),
            },
          }
        : {}),
    },
  }
}

/**
 * Publication-quality config defaults
 */
function getPublicationConfig(): Record<string, unknown> {
  return {
    font: 'Arial',
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    axis: {
      labelFontSize: 12,
      titleFontSize: 14,
      titlePadding: 10,
    },
    legend: {
      labelFontSize: 12,
      titleFontSize: 12,
    },
    view: {
      stroke: null, // Remove border
    },
  }
}

export interface ExportOptions {
  width?: number
  height?: number
  publication?: boolean // Apply publication-quality defaults
}

/**
 * Convert ggterm PlotSpec to Vega-Lite specification
 */
export function plotSpecToVegaLite(
  spec: PlotSpec,
  options: ExportOptions = {}
): VegaLiteSpec {
  const { width = 600, height = 400, publication = true } = options

  const vlSpec: VegaLiteSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width,
    height,
    data: { values: spec.data as Record<string, unknown>[] },
  }

  // Title
  if (spec.labels.title) {
    if (spec.labels.subtitle) {
      vlSpec.title = {
        text: spec.labels.title,
        subtitle: spec.labels.subtitle,
      }
    } else {
      vlSpec.title = spec.labels.title
    }
  }

  // Handle multiple geoms as layers
  if (spec.geoms.length > 1) {
    vlSpec.layer = spec.geoms.map(geom => {
      // Special handling for certain geom types
      if (geom.type === 'histogram' || geom.stat === 'bin') {
        const histSpec = buildHistogramSpec(spec.data, spec.aes, geom)
        return {
          mark: histSpec.mark as string,
          encoding: histSpec.encoding,
        }
      }

      if (geom.type === 'boxplot') {
        const boxSpec = buildBoxplotSpec(spec.data, spec.aes)
        return {
          mark: boxSpec.mark as { type: string },
          encoding: boxSpec.encoding,
        }
      }

      return {
        mark: buildMark(geom),
        encoding: buildEncoding(spec.aes, spec.data, geom),
      }
    })
  } else if (spec.geoms.length === 1) {
    const geom = spec.geoms[0]

    // Special handling for histogram
    if (geom.type === 'histogram' || geom.stat === 'bin') {
      const histSpec = buildHistogramSpec(spec.data, spec.aes, geom)
      vlSpec.mark = histSpec.mark as string
      vlSpec.encoding = histSpec.encoding
    } else if (geom.type === 'boxplot') {
      const boxSpec = buildBoxplotSpec(spec.data, spec.aes)
      vlSpec.mark = boxSpec.mark
      vlSpec.encoding = boxSpec.encoding
    } else {
      vlSpec.mark = buildMark(geom)
      vlSpec.encoding = buildEncoding(spec.aes, spec.data, geom)
    }
  } else {
    // Default to point if no geoms
    vlSpec.mark = 'point'
    vlSpec.encoding = buildEncoding(spec.aes, spec.data, { type: 'point', params: {} })
  }

  // Apply axis labels
  if (vlSpec.encoding) {
    if (spec.labels.x && vlSpec.encoding.x) {
      (vlSpec.encoding.x as Record<string, unknown>).title = spec.labels.x
    }
    if (spec.labels.y && vlSpec.encoding.y) {
      (vlSpec.encoding.y as Record<string, unknown>).title = spec.labels.y
    }
    if (spec.labels.color && vlSpec.encoding.color) {
      (vlSpec.encoding.color as Record<string, unknown>).title = spec.labels.color
    }
  }

  // Apply to layers if present
  if (vlSpec.layer) {
    for (const layer of vlSpec.layer) {
      if (layer.encoding) {
        if (spec.labels.x && layer.encoding.x) {
          (layer.encoding.x as Record<string, unknown>).title = spec.labels.x
        }
        if (spec.labels.y && layer.encoding.y) {
          (layer.encoding.y as Record<string, unknown>).title = spec.labels.y
        }
      }
    }
  }

  // Publication config
  if (publication) {
    vlSpec.config = getPublicationConfig()
  }

  return vlSpec
}

/**
 * Convert PlotSpec to Vega-Lite JSON string
 */
export function exportToVegaLiteJSON(spec: PlotSpec, options: ExportOptions = {}): string {
  const vlSpec = plotSpecToVegaLite(spec, options)
  return JSON.stringify(vlSpec, null, 2)
}
