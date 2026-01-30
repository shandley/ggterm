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
 *
 * Notes on mappings:
 * - Some geoms require special handling beyond mark type (see buildMark and special handlers)
 * - Composite geoms (pointrange, crossbar) are handled as layers
 * - Reference lines (hline, vline, abline) need special encoding
 */
const GEOM_TO_MARK: Record<string, string> = {
  // Basic geoms
  point: 'point',
  line: 'line',
  bar: 'bar',
  col: 'bar',           // Same as bar, values determine height
  area: 'area',
  rect: 'rect',
  text: 'text',
  label: 'text',        // Same as text
  rule: 'rule',

  // Statistical geoms
  boxplot: 'boxplot',
  histogram: 'bar',
  freqpoly: 'line',
  violin: 'area',       // Approximate as area

  // Heatmap/2D geoms
  tile: 'rect',
  raster: 'rect',
  bin2d: 'rect',        // 2D histogram as heatmap
  density_2d: 'rect',   // 2D density as heatmap
  contour: 'line',      // Contour lines (approximate)
  contour_filled: 'area', // Filled contours (approximate)

  // Line variants
  step: 'line',
  path: 'line',
  smooth: 'line',
  curve: 'line',        // Curved connection

  // Range/error geoms
  segment: 'rule',
  linerange: 'rule',    // Vertical line from ymin to ymax
  pointrange: 'rule',   // Rule + point (needs special handling)
  errorbar: 'errorbar',
  errorbarh: 'rule',    // Horizontal error bar (rule)
  crossbar: 'rule',     // Needs special handling (rule + rect)
  ribbon: 'area',       // Area with y and y2

  // Reference lines
  hline: 'rule',        // Horizontal reference line
  vline: 'rule',        // Vertical reference line
  abline: 'line',       // Line with slope and intercept

  // Q-Q plot geoms
  qq: 'point',          // Q-Q plot points
  qq_line: 'line',      // Q-Q reference line

  // Marginal geom
  rug: 'tick',          // Tick marks along axis
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
    if (geom.params.linetype === 'dashed') markProps.strokeDash = [4, 4]
    if (geom.params.linetype === 'dotted') markProps.strokeDash = [2, 2]
  }

  // Special handling for certain geoms
  if (geom.type === 'step') {
    markProps.interpolate = 'step-after'
  }
  if (geom.type === 'smooth' || geom.type === 'curve') {
    markProps.interpolate = 'monotone'
  }
  if (geom.type === 'histogram') {
    markProps.type = 'bar'
  }
  // Heatmap geoms need rect marks with proper tooltip
  if (geom.type === 'tile' || geom.type === 'raster' || geom.type === 'density_2d') {
    markProps.type = 'rect'
    markProps.tooltip = true
  }
  // Contour geoms
  if (geom.type === 'contour') {
    markProps.type = 'line'
    markProps.strokeWidth = 1
  }
  if (geom.type === 'contour_filled') {
    markProps.type = 'area'
    markProps.opacity = 0.7
  }
  // Q-Q geoms
  if (geom.type === 'qq') {
    markProps.type = 'point'
  }
  if (geom.type === 'qq_line') {
    markProps.type = 'line'
    markProps.strokeDash = [4, 4]
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
 * Build horizontal line (hline) spec
 */
function buildHLineSpec(
  geom: Geom,
  _data: Record<string, unknown>[]
): Partial<VegaLiteSpec> {
  const yintercept = geom.params?.yintercept as number | undefined

  if (yintercept !== undefined) {
    // Fixed y position - create a rule across the full x extent
    return {
      mark: { type: 'rule', strokeDash: geom.params?.linetype === 'dashed' ? [4, 4] : undefined },
      encoding: {
        y: { datum: yintercept },
        ...(geom.params?.color ? { color: { value: geom.params.color as string } } : {}),
      },
    }
  }

  // If no fixed intercept, use data
  return {
    mark: 'rule',
    encoding: {
      y: { field: 'y', type: 'quantitative' },
    },
  }
}

/**
 * Build vertical line (vline) spec
 */
function buildVLineSpec(
  geom: Geom,
  _data: Record<string, unknown>[]
): Partial<VegaLiteSpec> {
  const xintercept = geom.params?.xintercept as number | undefined

  if (xintercept !== undefined) {
    return {
      mark: { type: 'rule', strokeDash: geom.params?.linetype === 'dashed' ? [4, 4] : undefined },
      encoding: {
        x: { datum: xintercept },
        ...(geom.params?.color ? { color: { value: geom.params.color as string } } : {}),
      },
    }
  }

  return {
    mark: 'rule',
    encoding: {
      x: { field: 'x', type: 'quantitative' },
    },
  }
}

/**
 * Build abline (slope + intercept) spec
 * Note: Vega-Lite doesn't natively support slope/intercept, so we approximate
 * by generating line endpoints from the data extent
 */
function buildAblineSpec(
  geom: Geom,
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> {
  const slope = (geom.params?.slope as number) ?? 1
  const intercept = (geom.params?.intercept as number) ?? 0

  // Get x range from data to draw line endpoints
  const xValues = data.map(d => Number(d[aes.x])).filter(x => !isNaN(x))
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)

  // Calculate y values at endpoints
  const yMin = slope * xMin + intercept
  const yMax = slope * xMax + intercept

  // Create line data
  return {
    data: {
      values: [
        { x: xMin, y: yMin },
        { x: xMax, y: yMax },
      ],
    },
    mark: { type: 'line', strokeDash: geom.params?.linetype === 'dashed' ? [4, 4] : undefined },
    encoding: {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' },
      ...(geom.params?.color ? { color: { value: geom.params.color as string } } : {}),
    },
  } as unknown as Partial<VegaLiteSpec>
}

/**
 * Build linerange spec (vertical line from ymin to ymax)
 */
function buildLinerangeSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> {
  return {
    mark: 'rule',
    encoding: {
      x: { field: aes.x, type: inferFieldType(data, aes.x) },
      y: { field: aes.ymin || 'ymin', type: 'quantitative' },
      y2: { field: aes.ymax || 'ymax' },
      ...(aes.color
        ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
        : {}),
    },
  }
}

/**
 * Build pointrange spec (linerange + point at y)
 */
function buildPointrangeSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): VegaLiteLayer[] {
  const colorEncoding = aes.color
    ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
    : {}

  return [
    // Vertical line from ymin to ymax
    {
      mark: 'rule',
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: aes.ymin || 'ymin', type: 'quantitative' },
        y2: { field: aes.ymax || 'ymax' },
        ...colorEncoding,
      },
    },
    // Point at y value
    {
      mark: { type: 'point', filled: true },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: aes.y, type: 'quantitative' },
        ...colorEncoding,
      },
    },
  ]
}

/**
 * Build crossbar spec (rectangle with horizontal line at y)
 */
function buildCrossbarSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): VegaLiteLayer[] {
  const colorEncoding = aes.color
    ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
    : {}

  return [
    // Rectangle from ymin to ymax
    {
      mark: { type: 'bar', width: 20 },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: aes.ymin || 'ymin', type: 'quantitative' },
        y2: { field: aes.ymax || 'ymax' },
        ...colorEncoding,
      },
    },
    // Horizontal line at y (middle)
    {
      mark: { type: 'tick', thickness: 2 },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: aes.y, type: 'quantitative' },
        color: { value: 'black' },
      },
    },
  ]
}

/**
 * Build horizontal errorbar spec
 */
function buildErrorbarhSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> {
  return {
    mark: 'rule',
    encoding: {
      y: { field: aes.y, type: inferFieldType(data, aes.y) },
      x: { field: aes.xmin || 'xmin', type: 'quantitative' },
      x2: { field: aes.xmax || 'xmax' },
      ...(aes.color
        ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
        : {}),
    },
  }
}

/**
 * Build ribbon spec (area with y and y2)
 */
function buildRibbonSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> {
  return {
    mark: { type: 'area', opacity: 0.3 },
    encoding: {
      x: { field: aes.x, type: inferFieldType(data, aes.x) },
      y: { field: aes.ymin || 'ymin', type: 'quantitative' },
      y2: { field: aes.ymax || 'ymax' },
      ...(aes.color
        ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
        : {}),
      ...(aes.fill
        ? { fill: { field: aes.fill, type: inferFieldType(data, aes.fill) } }
        : {}),
    },
  }
}

/**
 * Build rug spec (tick marks along axis)
 */
function buildRugSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping,
  geom: Geom
): Partial<VegaLiteSpec> {
  // Rug can be on x, y, or both
  const sides = geom.params?.sides as string || 'b' // b=bottom, l=left, t=top, r=right

  const encoding: Record<string, unknown> = {}

  if (sides.includes('b') || sides.includes('t')) {
    encoding.x = { field: aes.x, type: inferFieldType(data, aes.x) }
  }
  if (sides.includes('l') || sides.includes('r')) {
    encoding.y = { field: aes.y, type: inferFieldType(data, aes.y) }
  }

  // Default to x if no sides specified
  if (Object.keys(encoding).length === 0) {
    encoding.x = { field: aes.x, type: inferFieldType(data, aes.x) }
  }

  return {
    mark: { type: 'tick', thickness: 1 },
    encoding,
  }
}

/**
 * Build bin2d spec (2D histogram as heatmap)
 */
function buildBin2dSpec(
  _data: Record<string, unknown>[],
  aes: AestheticMapping,
  geom: Geom
): Partial<VegaLiteSpec> {
  const binX = geom.params?.binwidth_x || geom.params?.bins || 10
  const binY = geom.params?.binwidth_y || geom.params?.bins || 10

  return {
    mark: 'rect',
    encoding: {
      x: {
        field: aes.x,
        bin: { maxbins: binX as number },
        type: 'quantitative',
      },
      y: {
        field: aes.y,
        bin: { maxbins: binY as number },
        type: 'quantitative',
      },
      color: {
        aggregate: 'count',
        type: 'quantitative',
        scale: { scheme: 'viridis' },
      },
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

  /**
   * Build layer spec for a single geom, handling special cases
   */
  function buildGeomLayer(geom: Geom): VegaLiteLayer | VegaLiteLayer[] {
    const data = spec.data as Record<string, unknown>[]

    // Special handling for certain geom types
    if (geom.type === 'histogram' || geom.stat === 'bin') {
      const histSpec = buildHistogramSpec(data, spec.aes, geom)
      return {
        mark: histSpec.mark as string,
        encoding: histSpec.encoding,
      }
    }

    if (geom.type === 'boxplot') {
      const boxSpec = buildBoxplotSpec(data, spec.aes)
      return {
        mark: boxSpec.mark as { type: string },
        encoding: boxSpec.encoding,
      }
    }

    if (geom.type === 'hline') {
      const hlineSpec = buildHLineSpec(geom, data)
      return {
        mark: hlineSpec.mark as { type: string },
        encoding: hlineSpec.encoding,
      }
    }

    if (geom.type === 'vline') {
      const vlineSpec = buildVLineSpec(geom, data)
      return {
        mark: vlineSpec.mark as { type: string },
        encoding: vlineSpec.encoding,
      }
    }

    if (geom.type === 'abline') {
      const ablineSpec = buildAblineSpec(geom, data, spec.aes)
      return {
        mark: ablineSpec.mark as { type: string },
        encoding: ablineSpec.encoding,
        // Note: abline needs its own data, handled at top level
      }
    }

    if (geom.type === 'linerange') {
      const linerangeSpec = buildLinerangeSpec(data, spec.aes)
      return {
        mark: linerangeSpec.mark as string,
        encoding: linerangeSpec.encoding,
      }
    }

    if (geom.type === 'pointrange') {
      // Returns multiple layers
      return buildPointrangeSpec(data, spec.aes)
    }

    if (geom.type === 'crossbar') {
      // Returns multiple layers
      return buildCrossbarSpec(data, spec.aes)
    }

    if (geom.type === 'errorbarh') {
      const errorhSpec = buildErrorbarhSpec(data, spec.aes)
      return {
        mark: errorhSpec.mark as string,
        encoding: errorhSpec.encoding,
      }
    }

    if (geom.type === 'ribbon') {
      const ribbonSpec = buildRibbonSpec(data, spec.aes)
      return {
        mark: ribbonSpec.mark as { type: string },
        encoding: ribbonSpec.encoding,
      }
    }

    if (geom.type === 'rug') {
      const rugSpec = buildRugSpec(data, spec.aes, geom)
      return {
        mark: rugSpec.mark as { type: string },
        encoding: rugSpec.encoding,
      }
    }

    if (geom.type === 'bin2d') {
      const bin2dSpec = buildBin2dSpec(data, spec.aes, geom)
      return {
        mark: bin2dSpec.mark as string,
        encoding: bin2dSpec.encoding,
      }
    }

    // Default: use mark type and encoding builder
    return {
      mark: buildMark(geom),
      encoding: buildEncoding(spec.aes, data, geom),
    }
  }

  // Handle multiple geoms as layers
  if (spec.geoms.length > 1) {
    vlSpec.layer = []
    for (const geom of spec.geoms) {
      const layerResult = buildGeomLayer(geom)
      if (Array.isArray(layerResult)) {
        vlSpec.layer.push(...layerResult)
      } else {
        vlSpec.layer.push(layerResult)
      }
    }
  } else if (spec.geoms.length === 1) {
    const geom = spec.geoms[0]
    const layerResult = buildGeomLayer(geom)

    if (Array.isArray(layerResult)) {
      // Composite geoms become layers
      vlSpec.layer = layerResult
    } else {
      vlSpec.mark = layerResult.mark
      vlSpec.encoding = layerResult.encoding
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
