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
  params?: VegaLiteParam[]
  config?: Record<string, unknown>
  // Faceting support
  facet?: {
    field?: string
    type?: string
    columns?: number
    row?: { field: string; type?: string }
    column?: { field: string; type?: string }
  }
  spec?: {
    mark?: string | { type: string; [key: string]: unknown }
    encoding?: Record<string, unknown>
    layer?: VegaLiteLayer[]
  }
}

interface VegaLiteParam {
  name: string
  select?: string | { type: string; [key: string]: unknown }
  bind?: string | Record<string, unknown>
  value?: unknown
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
  // Heatmap geoms
  tile: 'rect',
  raster: 'rect',
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

  // Check if this is a heatmap geom (tile or raster)
  const isHeatmap = geom.type === 'tile' || geom.type === 'raster'

  // X axis
  if (aes.x) {
    const xType = inferFieldType(data, aes.x)
    encoding.x = {
      field: aes.x,
      // For heatmaps, prefer ordinal/nominal for proper grid layout
      type: isHeatmap && xType === 'quantitative' ? 'ordinal' : xType,
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
        // For heatmaps, prefer ordinal/nominal for proper grid layout
        type: isHeatmap && yType === 'quantitative' ? 'ordinal' : yType,
      }
    }
  }

  // Color - for heatmaps, use fill aesthetic as the color encoding
  if (isHeatmap && aes.fill) {
    const fillType = inferFieldType(data, aes.fill)
    encoding.color = {
      field: aes.fill,
      type: fillType === 'nominal' ? 'quantitative' : fillType, // Heatmap fill should be quantitative
      scale: { scheme: 'viridis' },
    }
  } else if (aes.color) {
    const colorType = inferFieldType(data, aes.color)
    encoding.color = {
      field: aes.color,
      type: colorType,
    }
  }

  // Fill (for bar charts, etc.) - skip if already handled for heatmaps
  if (aes.fill && !aes.color && !isHeatmap) {
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
    if (geom.params.size) markProps.size = Number(geom.params.size) * 20 // Scale up for publication
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
  // Heatmap geoms need rect marks with proper tooltip
  if (geom.type === 'tile' || geom.type === 'raster') {
    markProps.type = 'rect'
    markProps.tooltip = true
  }

  // If only type, return string
  if (Object.keys(markProps).length === 1) {
    return markType
  }

  return markProps as { type: string; [key: string]: unknown }
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

export interface InteractiveOptions {
  tooltip?: boolean      // Show data on hover
  hover?: boolean        // Highlight on hover
  brush?: boolean        // Drag to select region
  zoom?: boolean         // Scroll to zoom, drag to pan
  legendFilter?: boolean // Click legend to filter
}

export interface ExportOptions {
  width?: number
  height?: number
  publication?: boolean // Apply publication-quality defaults
  interactive?: boolean | InteractiveOptions // Enable interactivity
}

/**
 * Build interactivity params and encoding modifications
 */
function buildInteractivity(
  options: boolean | InteractiveOptions,
  aes: AestheticMapping,
  data: Record<string, unknown>[]
): { params: VegaLiteParam[]; encodingMods: Record<string, unknown> } {
  const params: VegaLiteParam[] = []
  const encodingMods: Record<string, unknown> = {}

  // Normalize options - if false, use empty options (no interactivity)
  const opts: InteractiveOptions =
    options === true
      ? { tooltip: true, hover: true, zoom: false, brush: false, legendFilter: true }
      : options === false
        ? {}
        : options

  // Hover highlight
  if (opts.hover) {
    params.push({
      name: 'hover',
      select: { type: 'point', on: 'pointerover', clear: 'pointerout' },
    })
    encodingMods.opacity = {
      condition: { param: 'hover', empty: false, value: 1 },
      value: 0.7,
    }
    encodingMods.strokeWidth = {
      condition: { param: 'hover', empty: false, value: 3 },
      value: 1,
    }
  }

  // Brush selection
  if (opts.brush) {
    params.push({
      name: 'brush',
      select: { type: 'interval' },
    })
    // If we already have opacity from hover, combine them
    if (!encodingMods.opacity) {
      encodingMods.opacity = {
        condition: { param: 'brush', value: 1 },
        value: 0.3,
      }
    }
  }

  // Zoom and pan
  if (opts.zoom) {
    params.push({
      name: 'grid',
      select: { type: 'interval' },
      bind: 'scales',
    })
  }

  // Legend filter (click legend to filter data)
  if (opts.legendFilter && aes.color) {
    params.push({
      name: 'legendFilter',
      select: { type: 'point', fields: [aes.color] },
      bind: 'legend',
    })
    if (!encodingMods.opacity) {
      encodingMods.opacity = {
        condition: { param: 'legendFilter', value: 1 },
        value: 0.2,
      }
    }
  }

  // Tooltip - build from all mapped aesthetics
  if (opts.tooltip) {
    const tooltipFields: Array<{ field: string; type: string; title?: string }> = []
    if (aes.x) tooltipFields.push({ field: aes.x, type: inferFieldType(data, aes.x) })
    if (aes.y) tooltipFields.push({ field: aes.y, type: inferFieldType(data, aes.y) })
    if (aes.color) tooltipFields.push({ field: aes.color, type: inferFieldType(data, aes.color) })
    if (aes.size) tooltipFields.push({ field: aes.size, type: inferFieldType(data, aes.size) })
    encodingMods.tooltip = tooltipFields
  }

  return { params, encodingMods }
}

/**
 * Convert ggterm PlotSpec to Vega-Lite specification
 */
export function plotSpecToVegaLite(
  spec: PlotSpec,
  options: ExportOptions = {}
): VegaLiteSpec {
  const { width = 600, height = 400, publication = true, interactive = false } = options

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

  // Apply interactivity
  if (interactive) {
    const { params, encodingMods } = buildInteractivity(
      interactive,
      spec.aes,
      spec.data as Record<string, unknown>[]
    )

    if (params.length > 0) {
      vlSpec.params = params
    }

    // Apply encoding modifications (tooltip, opacity, etc.)
    if (Object.keys(encodingMods).length > 0) {
      if (vlSpec.encoding) {
        Object.assign(vlSpec.encoding, encodingMods)
      }
      // Also apply to layers
      if (vlSpec.layer) {
        for (const layer of vlSpec.layer) {
          if (layer.encoding) {
            Object.assign(layer.encoding, encodingMods)
          }
        }
      }
    }
  }

  // Handle faceting - restructure spec to use Vega-Lite facet format
  if (spec.facet) {
    const innerSpec: VegaLiteSpec['spec'] = {}

    // Move mark/encoding/layer to inner spec
    if (vlSpec.mark) {
      innerSpec.mark = vlSpec.mark
      delete vlSpec.mark
    }
    if (vlSpec.encoding) {
      innerSpec.encoding = vlSpec.encoding
      delete vlSpec.encoding
    }
    if (vlSpec.layer) {
      innerSpec.layer = vlSpec.layer
      delete vlSpec.layer
    }

    vlSpec.spec = innerSpec

    if (spec.facet.type === 'wrap') {
      // facet_wrap: single variable
      const facetVar = spec.facet.vars as string
      vlSpec.facet = {
        field: facetVar,
        type: inferFieldType(spec.data as Record<string, unknown>[], facetVar),
      }
      // Add columns if specified
      if (spec.facet.ncol) {
        vlSpec.facet.columns = spec.facet.ncol
      }
    } else if (spec.facet.type === 'grid') {
      // facet_grid: row and/or column variables
      const vars = spec.facet.vars as { rows?: string; cols?: string }
      vlSpec.facet = {}

      if (vars.rows) {
        vlSpec.facet.row = {
          field: vars.rows,
          type: inferFieldType(spec.data as Record<string, unknown>[], vars.rows),
        }
      }
      if (vars.cols) {
        vlSpec.facet.column = {
          field: vars.cols,
          type: inferFieldType(spec.data as Record<string, unknown>[], vars.cols),
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
