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
  data?: { values: Record<string, unknown>[] }
  params?: VegaLiteParam[]
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
 * Check if a numeric field should be treated as ordinal (few unique values).
 * Useful for bar chart x-axes where fields like 'cyl' (4, 6, 8) are categories.
 */
function isLowCardinalityNumeric(data: Record<string, unknown>[], field: string): boolean {
  const values = data.map(d => d[field]).filter(v => v != null && typeof v === 'number')
  if (values.length === 0) return false
  const uniqueCount = new Set(values).size
  // If 20 or fewer unique numeric values, treat as categorical
  return uniqueCount <= 20 && uniqueCount < values.length * 0.5
}

/** Geoms where the y-axis should include zero (bar length/area fill encodes value from zero) */
const ZERO_BASELINE_GEOMS = new Set(['bar', 'col', 'area', 'histogram'])

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

  const isBarLike = ZERO_BASELINE_GEOMS.has(geom.type)

  // X axis
  if (aes.x) {
    const xType = inferFieldType(data, aes.x)
    // For bar charts, treat low-cardinality numeric fields as ordinal (e.g. cyl: 4, 6, 8)
    const useOrdinal = isBarLike && xType === 'quantitative' && isLowCardinalityNumeric(data, aes.x)
    const effectiveXType = isHeatmap && xType === 'quantitative' ? 'ordinal'
      : useOrdinal ? 'ordinal'
      : xType
    encoding.x = {
      field: aes.x,
      type: effectiveXType,
      ...(xType === 'temporal' ? { timeUnit: 'yearmonthdate' } : {}),
      // Don't force zero for quantitative scatter/line axes — zoom to data range
      // But skip for bar-like geoms (they need ordinal x or quantitative from zero)
      ...(effectiveXType === 'quantitative' && !isBarLike ? { scale: { zero: false } } : {}),
    }
  }

  // Y axis
  if (aes.y) {
    // For histograms, y is count
    if (geom.stat === 'bin' || geom.type === 'histogram') {
      encoding.y = { aggregate: 'count', type: 'quantitative' }
    } else {
      const yType = inferFieldType(data, aes.y)
      const effectiveYType = isHeatmap && yType === 'quantitative' ? 'ordinal' : yType
      encoding.y = {
        field: aes.y,
        type: effectiveYType,
        // Don't force zero for scatter/line — zoom to data range
        // Bar/area charts MUST start y from zero (bar length encodes value)
        ...(effectiveYType === 'quantitative' && !isBarLike ? { scale: { zero: false } } : {}),
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

  // Text channel for text/label geoms — use color field or label field as text content
  if (geom.type === 'text' || geom.type === 'label') {
    const textField = aes.label || aes.color || aes.y
    if (textField) {
      encoding.text = {
        field: textField,
        type: inferFieldType(data, textField),
      }
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
  // freqpoly uses line mark, histogram uses bar
  const mark = geom.type === 'freqpoly' ? 'line' : 'bar'

  return {
    mark,
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
 *
 * Boxplots need one quantitative axis (the distribution) and one
 * categorical axis (the grouping). Auto-detect which is which and
 * swap x/y if needed so the boxplot renders correctly.
 */
function buildBoxplotSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> & { _swapped?: boolean } {
  let xType = inferFieldType(data, aes.x)
  let yType = aes.y ? inferFieldType(data, aes.y) : 'quantitative'

  // For boxplots, low-cardinality numeric fields should be treated as the
  // grouping (ordinal) axis, not the distribution axis (e.g. cyl: 4, 6, 8)
  const xLowCard = xType === 'quantitative' && isLowCardinalityNumeric(data, aes.x)
  const yLowCard = aes.y && yType === 'quantitative' && isLowCardinalityNumeric(data, aes.y)
  if (xLowCard && !yLowCard) xType = 'ordinal'
  if (yLowCard && !xLowCard) yType = 'ordinal'

  // If x is quantitative and y is categorical, swap for standard boxplot layout
  // (category on x, distribution on y)
  const needsSwap = xType === 'quantitative' && yType !== 'quantitative'
  const xField = needsSwap ? aes.y : aes.x
  const yField = needsSwap ? aes.x : aes.y
  const xFieldType = needsSwap ? yType : xType
  const yFieldType = needsSwap ? xType : yType

  return {
    _swapped: needsSwap,
    mark: { type: 'boxplot', extent: 'min-max' },
    encoding: {
      x: {
        field: xField,
        type: xFieldType,
      },
      y: {
        field: yField,
        type: yFieldType,
        // Don't force zero — zoom to data range for better box visibility
        ...(yFieldType === 'quantitative' ? { scale: { zero: false } } : {}),
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
 * Check if a field exists in the data
 */
function fieldExists(data: Record<string, unknown>[], field: string): boolean {
  return data.length > 0 && field in data[0]
}

/**
 * Check if the data has pre-computed range fields (ymin/ymax or xmin/xmax).
 * If not, we need to use aggregate transforms.
 */
function hasYRangeFields(data: Record<string, unknown>[], aes: AestheticMapping): boolean {
  const yminField = aes.ymin || 'ymin'
  const ymaxField = aes.ymax || 'ymax'
  return fieldExists(data, yminField) && fieldExists(data, ymaxField)
}

function hasXRangeFields(data: Record<string, unknown>[], aes: AestheticMapping): boolean {
  const xminField = aes.xmin || 'xmin'
  const xmaxField = aes.xmax || 'xmax'
  return fieldExists(data, xminField) && fieldExists(data, xmaxField)
}

/**
 * Build y-range encoding for pre-computed data (ymin/ymax fields exist).
 */
function buildYRangeEncoding(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): { y: Record<string, unknown>; y2: Record<string, unknown> } {
  const yminField = aes.ymin || 'ymin'
  const ymaxField = aes.ymax || 'ymax'
  return {
    y: { field: yminField, type: 'quantitative' },
    y2: { field: ymaxField },
  }
}

/**
 * Build x-range encoding for pre-computed data.
 */
function buildXRangeEncoding(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): { x: Record<string, unknown>; x2: Record<string, unknown> } {
  const xminField = aes.xmin || 'xmin'
  const xmaxField = aes.xmax || 'xmax'
  return {
    x: { field: xminField, type: 'quantitative' },
    x2: { field: xmaxField },
  }
}

/**
 * Pre-aggregate raw data into summary stats per group for range geoms.
 * Returns [{group, ymin, ymax, ymean}, ...] with one row per group.
 */
function aggregateRangeData(
  data: Record<string, unknown>[],
  groupField: string,
  valueField: string
): Record<string, unknown>[] {
  // Preserve original group values for type fidelity
  const groups = new Map<string, { vals: number[]; originalKey: unknown }>()
  for (const row of data) {
    const rawKey = row[groupField]
    const key = String(rawKey ?? '')
    const val = Number(row[valueField])
    if (!isFinite(val)) continue
    if (!groups.has(key)) groups.set(key, { vals: [], originalKey: rawKey })
    groups.get(key)!.vals.push(val)
  }
  const result: Record<string, unknown>[] = []
  for (const [, { vals, originalKey }] of groups) {
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    result.push({ [groupField]: originalKey, ymin: min, ymax: max, ymean: mean })
  }
  return result
}

/**
 * Pre-aggregate raw data for horizontal range geoms (errorbarh).
 */
function aggregateXRangeData(
  data: Record<string, unknown>[],
  groupField: string,
  valueField: string
): Record<string, unknown>[] {
  const groups = new Map<string, { vals: number[]; originalKey: unknown }>()
  for (const row of data) {
    const rawKey = row[groupField]
    const key = String(rawKey ?? '')
    const val = Number(row[valueField])
    if (!isFinite(val)) continue
    if (!groups.has(key)) groups.set(key, { vals: [], originalKey: rawKey })
    groups.get(key)!.vals.push(val)
  }
  const result: Record<string, unknown>[] = []
  for (const [, { vals, originalKey }] of groups) {
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    result.push({ [groupField]: originalKey, xmin: min, xmax: max, xmean: mean })
  }
  return result
}

/**
 * Build linerange spec (vertical line from ymin to ymax)
 */
function buildLinerangeSpec(
  data: Record<string, unknown>[],
  aes: AestheticMapping
): Partial<VegaLiteSpec> & { _aggregatedData?: Record<string, unknown>[] } {
  if (hasYRangeFields(data, aes)) {
    return {
      mark: 'rule',
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        ...buildYRangeEncoding(data, aes),
        ...(aes.color
          ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
          : {}),
      },
    }
  }
  // Pre-aggregate: one rule per group showing min→max
  const aggData = aggregateRangeData(data, aes.x, aes.y)
  return {
    _aggregatedData: aggData,
    mark: 'rule',
    encoding: {
      x: { field: aes.x, type: inferFieldType(data, aes.x) },
      y: { field: 'ymin', type: 'quantitative', scale: { zero: false } },
      y2: { field: 'ymax' },
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

  if (hasYRangeFields(data, aes)) {
    return [
      {
        mark: 'rule',
        encoding: {
          x: { field: aes.x, type: inferFieldType(data, aes.x) },
          ...buildYRangeEncoding(data, aes),
          ...colorEncoding,
        },
      },
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
  // Pre-aggregate
  const aggData = aggregateRangeData(data, aes.x, aes.y)
  return [
    {
      mark: 'rule',
      data: { values: aggData },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: 'ymin', type: 'quantitative', scale: { zero: false } },
        y2: { field: 'ymax' },
        ...colorEncoding,
      },
    },
    {
      mark: { type: 'point', filled: true, size: 80 },
      data: { values: aggData },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: 'ymean', type: 'quantitative', scale: { zero: false } },
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

  if (hasYRangeFields(data, aes)) {
    return [
      {
        mark: { type: 'bar', width: 20 },
        encoding: {
          x: { field: aes.x, type: inferFieldType(data, aes.x) },
          ...buildYRangeEncoding(data, aes),
          ...colorEncoding,
        },
      },
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
  // Pre-aggregate
  const aggData = aggregateRangeData(data, aes.x, aes.y)
  return [
    {
      mark: { type: 'bar', width: 20 },
      data: { values: aggData },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: 'ymin', type: 'quantitative', scale: { zero: false } },
        y2: { field: 'ymax' },
        ...colorEncoding,
      },
    },
    {
      mark: { type: 'tick', thickness: 2 },
      data: { values: aggData },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        y: { field: 'ymean', type: 'quantitative', scale: { zero: false } },
        color: { value: 'white' },
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
): Partial<VegaLiteSpec> & { _aggregatedData?: Record<string, unknown>[] } {
  if (hasXRangeFields(data, aes)) {
    return {
      mark: 'rule',
      encoding: {
        y: { field: aes.y || aes.x, type: inferFieldType(data, aes.y || aes.x) },
        ...buildXRangeEncoding(data, aes),
        ...(aes.color
          ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
          : {}),
      },
    }
  }
  // For errorbarh without xmin/xmax: aggregate y per group, show horizontal range of x
  // Group by the categorical field (x=species), value from y (sepal_length)
  // But errorbarh swaps axes: group on y, range on x
  const groupField = aes.x  // species
  const valueField = aes.y  // sepal_length
  const aggData = aggregateXRangeData(data, groupField, valueField)
  return {
    _aggregatedData: aggData,
    mark: 'rule',
    encoding: {
      y: { field: groupField, type: inferFieldType(data, groupField) },
      x: { field: 'xmin', type: 'quantitative', scale: { zero: false } },
      x2: { field: 'xmax' },
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
): Partial<VegaLiteSpec> & { _aggregatedData?: Record<string, unknown>[] } {
  if (hasYRangeFields(data, aes)) {
    return {
      mark: { type: 'area', opacity: 0.3 },
      encoding: {
        x: { field: aes.x, type: inferFieldType(data, aes.x) },
        ...buildYRangeEncoding(data, aes),
        ...(aes.color
          ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
          : {}),
        ...(aes.fill
          ? { fill: { field: aes.fill, type: inferFieldType(data, aes.fill) } }
          : {}),
      },
    }
  }
  // Pre-aggregate for ribbon: need per-x-bin min/max of y, grouped by color
  // Bin continuous x values so multiple rows fall into each bin
  const colorField = aes.color
  const xValues = data.map(d => Number(d[aes.x])).filter(v => isFinite(v))
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const numBins = 20
  const binWidth = (xMax - xMin) / numBins || 1

  const groups = new Map<string, number[]>()
  for (const row of data) {
    const xNum = Number(row[aes.x])
    if (!isFinite(xNum)) continue
    // Snap to bin center
    const binIdx = Math.min(Math.floor((xNum - xMin) / binWidth), numBins - 1)
    const binCenter = xMin + (binIdx + 0.5) * binWidth
    const colorVal = colorField ? String(row[colorField]) : '_all'
    const key = `${binCenter}|${colorVal}`
    const val = Number(row[aes.y])
    if (!isFinite(val)) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(val)
  }
  const aggData: Record<string, unknown>[] = []
  for (const [key, vals] of groups) {
    const sepIdx = key.lastIndexOf('|')
    const binCenter = Number(key.slice(0, sepIdx))
    const colorVal = key.slice(sepIdx + 1)
    const entry: Record<string, unknown> = {
      [aes.x]: binCenter,
      ymin: Math.min(...vals),
      ymax: Math.max(...vals),
    }
    if (colorField && colorVal !== '_all') entry[colorField] = colorVal
    aggData.push(entry)
  }
  aggData.sort((a, b) => Number(a[aes.x]) - Number(b[aes.x]))
  return {
    _aggregatedData: aggData,
    mark: { type: 'area', opacity: 0.3 },
    encoding: {
      x: { field: aes.x, type: inferFieldType(data, aes.x) },
      y: { field: 'ymin', type: 'quantitative' },
      y2: { field: 'ymax' },
      ...(aes.color
        ? { color: { field: aes.color, type: inferFieldType(data, aes.color) } }
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

  // Track whether boxplot swapped x/y axes (so we can swap labels too)
  let boxplotSwapped = false
  // Track whether special geoms set their own axis titles (volcano, KM)
  let suppressAxisLabels = false

  /**
   * Build volcano plot spec: -log10(p) transform, significance classification, threshold lines
   */
  function buildVolcanoSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const fcThreshold = (opts.fc_threshold as number) ?? 1
    const pThreshold = (opts.p_threshold as number) ?? 0.05
    const yIsNegLog10 = (opts.y_is_neglog10 as boolean) ?? false
    const upColor = (opts.up_color as string) ?? '#e41a1c'
    const downColor = (opts.down_color as string) ?? '#377eb8'
    const nsColor = (opts.ns_color as string) ?? '#999999'
    const showThresholds = (opts.show_thresholds as boolean) ?? true
    const nLabels = (opts.n_labels as number) ?? 0

    const xField = aes.x ?? 'log2FoldChange'
    const yField = aes.y ?? 'padj'
    const labelField = typeof aes.color === 'string' ? aes.color : undefined
    const negLog10PThreshold = -Math.log10(pThreshold)

    // Pre-compute transformed data
    const transformed = data.map((row) => {
      const xVal = Number(row[xField]) || 0
      let yVal = Number(row[yField]) || 0
      if (!yIsNegLog10) {
        yVal = yVal > 0 ? -Math.log10(yVal) : 0
      }
      let status: 'Up' | 'Down' | 'NS' = 'NS'
      if (yVal >= negLog10PThreshold) {
        if (xVal >= fcThreshold) status = 'Up'
        else if (xVal <= -fcThreshold) status = 'Down'
      }
      const result: Record<string, unknown> = {
        ...row,
        _x: xVal,
        _neglog10p: yVal,
        _status: status,
      }
      return result
    })

    const layers: VegaLiteLayer[] = []

    // Main scatter layer with color by significance status
    layers.push({
      mark: { type: 'point', filled: true, size: 30, opacity: 0.7 },
      data: { values: transformed },
      encoding: {
        x: {
          field: '_x',
          type: 'quantitative' as const,
          title: aes.x ?? 'log2 Fold Change',
        },
        y: {
          field: '_neglog10p',
          type: 'quantitative' as const,
          title: '-log₁₀(p-value)',
        },
        color: {
          field: '_status',
          type: 'nominal' as const,
          scale: {
            domain: ['Down', 'NS', 'Up'],
            range: [downColor, nsColor, upColor],
          },
          title: 'Significance',
        },
        tooltip: [
          ...(labelField ? [{ field: labelField, type: 'nominal' as const }] : []),
          { field: '_x', type: 'quantitative' as const, title: 'log2FC', format: '.2f' },
          { field: '_neglog10p', type: 'quantitative' as const, title: '-log10(p)', format: '.2f' },
          { field: '_status', type: 'nominal' as const, title: 'Status' },
        ],
      },
    })

    // Threshold lines
    if (showThresholds) {
      // Horizontal p-value threshold
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: '#666666', opacity: 0.5 },
        data: { values: [{ _thresh: negLog10PThreshold }] },
        encoding: {
          y: { field: '_thresh', type: 'quantitative' as const },
        },
      })
      // Vertical FC thresholds
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: '#666666', opacity: 0.5 },
        data: { values: [{ _thresh: -fcThreshold }, { _thresh: fcThreshold }] },
        encoding: {
          x: { field: '_thresh', type: 'quantitative' as const },
        },
      })
    }

    // Top N labels
    if (nLabels > 0 && labelField) {
      const significant = transformed
        .filter((r) => r._status !== 'NS')
        .sort((a, b) => (b._neglog10p as number) - (a._neglog10p as number))
        .slice(0, nLabels)
      if (significant.length > 0) {
        layers.push({
          mark: { type: 'text', align: 'left', dx: 5, dy: -5, fontSize: 10 },
          data: { values: significant },
          encoding: {
            x: { field: '_x', type: 'quantitative' as const },
            y: { field: '_neglog10p', type: 'quantitative' as const },
            text: { field: labelField, type: 'nominal' as const },
          },
        })
      }
    }

    return layers
  }

  /**
   * Build Kaplan-Meier survival curve spec: compute survival probabilities, step-after interpolation
   */
  function buildKaplanMeierSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    _geom: Geom
  ): VegaLiteLayer[] {
    const timeField = aes.x ?? 'time'
    const statusField = aes.y ?? 'status'
    const colorField = typeof aes.color === 'string' ? aes.color : undefined

    // Group data by color field
    const groups = new Map<string, Array<{ time: number; status: number }>>()
    for (const row of data) {
      const group = colorField ? String(row[colorField]) : 'All'
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push({
        time: Number(row[timeField]) || 0,
        status: Number(row[statusField]) || 0,
      })
    }

    // Compute survival curve for each group
    const curveData: Record<string, unknown>[] = []
    const censorData: Record<string, unknown>[] = []

    for (const [groupName, events] of groups) {
      // Sort by time
      events.sort((a, b) => a.time - b.time)
      const n = events.length
      let atRisk = n
      let survival = 1.0

      // Start at time 0, survival 1.0
      curveData.push({ _time: 0, _survival: 1.0, _group: groupName })

      for (const event of events) {
        if (event.status === 1) {
          // Event: survival decreases
          survival *= (atRisk - 1) / atRisk
          curveData.push({ _time: event.time, _survival: survival, _group: groupName })
        } else {
          // Censored observation
          censorData.push({ _time: event.time, _survival: survival, _group: groupName })
        }
        atRisk--
      }
    }

    const layers: VegaLiteLayer[] = []

    // Survival curves with step-after interpolation
    const colorEncoding = colorField
      ? { color: { field: '_group', type: 'nominal' as const, title: colorField } }
      : {}

    layers.push({
      mark: { type: 'line', interpolate: 'step-after', strokeWidth: 2 },
      data: { values: curveData },
      encoding: {
        x: { field: '_time', type: 'quantitative' as const, title: 'Time' },
        y: {
          field: '_survival',
          type: 'quantitative' as const,
          title: 'Survival Probability',
          scale: { domain: [0, 1] },
        },
        ...colorEncoding,
      },
    })

    // Censored marks
    if (censorData.length > 0) {
      layers.push({
        mark: { type: 'point', shape: 'cross', size: 40, strokeWidth: 1.5, filled: false },
        data: { values: censorData },
        encoding: {
          x: { field: '_time', type: 'quantitative' as const },
          y: { field: '_survival', type: 'quantitative' as const },
          ...colorEncoding,
        },
      })
    }

    return layers
  }

  /**
   * Build MA plot spec: log2(mean expression) vs log2FC, significance classification
   */
  function buildMASpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const fcThreshold = (opts.fc_threshold as number) ?? 1
    const pThreshold = (opts.p_threshold as number) ?? 0.05
    const pCol = opts.p_col as string | undefined
    const xIsLog2 = (opts.x_is_log2 as boolean) ?? false
    const upColor = (opts.up_color as string) ?? '#e41a1c'
    const downColor = (opts.down_color as string) ?? '#377eb8'
    const nsColor = (opts.ns_color as string) ?? '#999999'
    const showBaseline = (opts.show_baseline as boolean) ?? true
    const showThresholds = (opts.show_thresholds as boolean) ?? true
    const nLabels = (opts.n_labels as number) ?? 0

    const xField = aes.x ?? 'baseMean'
    const yField = aes.y ?? 'log2FoldChange'
    const labelField = typeof aes.color === 'string' ? aes.color : undefined

    // Pre-compute: log2 transform A values, classify significance
    const transformed = data.map((row) => {
      let aVal = Number(row[xField]) || 0
      if (!xIsLog2) {
        aVal = aVal > 0 ? Math.log2(aVal) : 0
      }
      const mVal = Number(row[yField]) || 0
      const pVal = pCol ? Number(row[pCol]) || 1 : 1

      let status: 'Up' | 'Down' | 'NS' = 'NS'
      const passesP = pCol ? pVal < pThreshold : true
      if (passesP) {
        if (mVal >= fcThreshold) status = 'Up'
        else if (mVal <= -fcThreshold) status = 'Down'
      }

      return { ...row, _a: aVal, _m: mVal, _status: status }
    })

    const layers: VegaLiteLayer[] = []

    // Scatter layer
    layers.push({
      mark: { type: 'point', filled: true, size: 30, opacity: 0.7 },
      data: { values: transformed },
      encoding: {
        x: { field: '_a', type: 'quantitative' as const, title: 'log₂(Mean Expression)' },
        y: { field: '_m', type: 'quantitative' as const, title: 'log₂(Fold Change)' },
        color: {
          field: '_status',
          type: 'nominal' as const,
          scale: { domain: ['Down', 'NS', 'Up'], range: [downColor, nsColor, upColor] },
          title: 'Significance',
        },
        tooltip: [
          ...(labelField ? [{ field: labelField, type: 'nominal' as const }] : []),
          { field: '_a', type: 'quantitative' as const, title: 'log2(Mean)', format: '.2f' },
          { field: '_m', type: 'quantitative' as const, title: 'log2FC', format: '.2f' },
          { field: '_status', type: 'nominal' as const, title: 'Status' },
        ],
      },
    })

    // Baseline at M=0
    if (showBaseline) {
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: '#666666', opacity: 0.5 },
        data: { values: [{ _y: 0 }] },
        encoding: { y: { field: '_y', type: 'quantitative' as const } },
      })
    }

    // FC threshold lines
    if (showThresholds) {
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: '#666666', opacity: 0.5 },
        data: { values: [{ _y: -fcThreshold }, { _y: fcThreshold }] },
        encoding: { y: { field: '_y', type: 'quantitative' as const } },
      })
    }

    // Top N labels
    if (nLabels > 0 && labelField) {
      const significant = transformed
        .filter((r) => r._status !== 'NS')
        .sort((a, b) => Math.abs(b._m) - Math.abs(a._m))
        .slice(0, nLabels)
      if (significant.length > 0) {
        layers.push({
          mark: { type: 'text', align: 'left', dx: 5, dy: -5, fontSize: 10 },
          data: { values: significant },
          encoding: {
            x: { field: '_a', type: 'quantitative' as const },
            y: { field: '_m', type: 'quantitative' as const },
            text: { field: labelField, type: 'nominal' as const },
          },
        })
      }
    }

    return layers
  }

  /**
   * Build Manhattan plot spec: cumulative chromosome positions, -log10(p), significance thresholds
   */
  function buildManhattanSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const suggestiveThreshold = (opts.suggestive_threshold as number) ?? 1e-5
    const genomeWideThreshold = (opts.genome_wide_threshold as number) ?? 5e-8
    const yIsNegLog10 = (opts.y_is_neglog10 as boolean) ?? false
    const chrColors = (opts.chr_colors as string[]) ?? ['#1f78b4', '#a6cee3']
    const highlightColor = (opts.highlight_color as string) ?? '#e41a1c'
    const suggestiveColor = (opts.suggestive_color as string) ?? '#ff7f00'
    const showThresholds = (opts.show_thresholds as boolean) ?? true
    const nLabels = (opts.n_labels as number) ?? 0

    const xField = aes.x ?? 'pos'
    const yField = aes.y ?? 'pvalue'
    const chrField = typeof aes.color === 'string' ? aes.color : 'chr'
    const labelField = opts.label_col as string | undefined

    // Natural chromosome sort order
    const chrOrder = (c: string) => {
      const n = parseInt(c.replace(/^chr/i, ''), 10)
      if (!isNaN(n)) return n
      const s = c.replace(/^chr/i, '').toUpperCase()
      if (s === 'X') return 23
      if (s === 'Y') return 24
      if (s === 'M' || s === 'MT') return 25
      return 26
    }

    // Group by chromosome and compute cumulative positions
    const chrGroups = new Map<string, Array<{ pos: number; pval: number; row: Record<string, unknown> }>>()
    for (const row of data) {
      const chr = String(row[chrField] ?? '')
      if (!chrGroups.has(chr)) chrGroups.set(chr, [])
      chrGroups.get(chr)!.push({
        pos: Number(row[xField]) || 0,
        pval: Number(row[yField]) || 0,
        row,
      })
    }

    const sortedChrs = [...chrGroups.keys()].sort((a, b) => chrOrder(a) - chrOrder(b))
    let cumOffset = 0
    const chrMidpoints: Array<{ chr: string; mid: number }> = []

    const negLog10Suggestive = -Math.log10(suggestiveThreshold)
    const negLog10GenomeWide = -Math.log10(genomeWideThreshold)

    const transformed: Record<string, unknown>[] = []
    for (let i = 0; i < sortedChrs.length; i++) {
      const chr = sortedChrs[i]
      const points = chrGroups.get(chr)!
      points.sort((a, b) => a.pos - b.pos)
      const minPos = points[0]?.pos ?? 0
      const maxPos = points[points.length - 1]?.pos ?? 0

      for (const pt of points) {
        let negLog10P = pt.pval
        if (!yIsNegLog10) {
          negLog10P = pt.pval > 0 ? -Math.log10(pt.pval) : 0
        }
        transformed.push({
          ...pt.row,
          _cumPos: pt.pos - minPos + cumOffset,
          _neglog10p: negLog10P,
          _chr: chr,
          _chrIdx: i,
        })
      }

      const chrSpan = maxPos - minPos
      chrMidpoints.push({ chr, mid: cumOffset + chrSpan / 2 })
      cumOffset += chrSpan + chrSpan * 0.02 // 2% gap
    }

    // Assign alternating colors
    const colorDomain: string[] = []
    const colorRange: string[] = []
    for (let i = 0; i < sortedChrs.length; i++) {
      colorDomain.push(sortedChrs[i])
      colorRange.push(chrColors[i % chrColors.length])
    }

    const layers: VegaLiteLayer[] = []

    // Main scatter layer
    layers.push({
      mark: { type: 'point', filled: true, size: 20, opacity: 0.6 },
      data: { values: transformed },
      encoding: {
        x: {
          field: '_cumPos',
          type: 'quantitative' as const,
          title: 'Genomic Position',
          axis: { labels: false, ticks: false },
        },
        y: { field: '_neglog10p', type: 'quantitative' as const, title: '-log₁₀(p-value)' },
        color: {
          field: '_chr',
          type: 'nominal' as const,
          scale: { domain: colorDomain, range: colorRange },
          legend: null,
        },
        tooltip: [
          { field: '_chr', type: 'nominal' as const, title: 'Chr' },
          { field: xField, type: 'quantitative' as const, title: 'Position' },
          { field: '_neglog10p', type: 'quantitative' as const, title: '-log10(p)', format: '.2f' },
          ...(labelField ? [{ field: labelField, type: 'nominal' as const }] : []),
        ],
      },
    })

    // Threshold lines
    if (showThresholds) {
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: suggestiveColor, opacity: 0.6 },
        data: { values: [{ _thresh: negLog10Suggestive }] },
        encoding: { y: { field: '_thresh', type: 'quantitative' as const } },
      })
      layers.push({
        mark: { type: 'rule', strokeDash: [4, 4], color: highlightColor, opacity: 0.6 },
        data: { values: [{ _thresh: negLog10GenomeWide }] },
        encoding: { y: { field: '_thresh', type: 'quantitative' as const } },
      })
    }

    // Top N labels
    if (nLabels > 0 && labelField) {
      const topHits = [...transformed]
        .sort((a, b) => (b._neglog10p as number) - (a._neglog10p as number))
        .slice(0, nLabels)
      if (topHits.length > 0) {
        layers.push({
          mark: { type: 'text', align: 'left', dx: 5, dy: -5, fontSize: 10 },
          data: { values: topHits },
          encoding: {
            x: { field: '_cumPos', type: 'quantitative' as const },
            y: { field: '_neglog10p', type: 'quantitative' as const },
            text: { field: labelField, type: 'nominal' as const },
          },
        })
      }
    }

    return layers
  }

  /**
   * Build forest plot spec: effect sizes with confidence intervals, null effect line
   */
  function buildForestSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const nullLine = (opts.null_line as number) ?? 1
    const logScale = (opts.log_scale as boolean) ?? false
    const nullLineColor = (opts.null_line_color as string) ?? '#888888'

    const xField = aes.x ?? 'estimate'
    const yField = aes.y ?? 'study'

    // Try to find CI fields from the data
    const sampleRow = data[0] ?? {}
    const xminField = 'xmin' in sampleRow ? 'xmin' : 'ci_lower' in sampleRow ? 'ci_lower' : 'lower'
    const xmaxField = 'xmax' in sampleRow ? 'xmax' : 'ci_upper' in sampleRow ? 'ci_upper' : 'upper'

    // Transform data: optionally log-scale, ensure all fields present
    const transformed = data.map((row) => {
      let est = Number(row[xField]) || 0
      let lo = Number(row[xminField]) || 0
      let hi = Number(row[xmaxField]) || 0
      if (logScale) {
        est = est > 0 ? Math.log10(est) : 0
        lo = lo > 0 ? Math.log10(lo) : 0
        hi = hi > 0 ? Math.log10(hi) : 0
      }
      return { ...row, _est: est, _lo: lo, _hi: hi, _study: String(row[yField] ?? '') }
    })

    const layers: VegaLiteLayer[] = []

    // Null effect vertical line
    const nullVal = logScale && nullLine > 0 ? Math.log10(nullLine) : nullLine
    layers.push({
      mark: { type: 'rule', strokeDash: [4, 4], color: nullLineColor, opacity: 0.6 },
      data: { values: [{ _null: nullVal }] },
      encoding: { x: { field: '_null', type: 'quantitative' as const } },
    })

    // CI horizontal rules
    layers.push({
      mark: { type: 'rule', strokeWidth: 1.5 },
      data: { values: transformed },
      encoding: {
        y: { field: '_study', type: 'nominal' as const, title: '' },
        x: { field: '_lo', type: 'quantitative' as const, title: logScale ? 'log₁₀(Effect Size)' : 'Effect Size' },
        x2: { field: '_hi' },
      },
    })

    // Point estimates
    layers.push({
      mark: { type: 'point', filled: true, size: 80 },
      data: { values: transformed },
      encoding: {
        y: { field: '_study', type: 'nominal' as const },
        x: { field: '_est', type: 'quantitative' as const },
        tooltip: [
          { field: '_study', type: 'nominal' as const, title: 'Study' },
          { field: '_est', type: 'quantitative' as const, title: 'Estimate', format: '.3f' },
          { field: '_lo', type: 'quantitative' as const, title: 'CI Lower', format: '.3f' },
          { field: '_hi', type: 'quantitative' as const, title: 'CI Upper', format: '.3f' },
        ],
      },
    })

    return layers
  }

  /**
   * Build ROC curve spec: TPR vs FPR line, diagonal reference, AUC annotation
   */
  function buildRocSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const showDiagonal = (opts.show_diagonal as boolean) ?? true
    const diagonalColor = (opts.diagonal_color as string) ?? '#888888'
    const showAuc = (opts.show_auc as boolean) ?? true

    const xField = aes.x ?? 'fpr'
    const yField = aes.y ?? 'tpr'
    const colorField = typeof aes.color === 'string' ? aes.color : undefined

    // Group by color field for AUC computation
    const groups = new Map<string, Array<{ fpr: number; tpr: number }>>()
    for (const row of data) {
      const group = colorField ? String(row[colorField]) : 'ROC'
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group)!.push({
        fpr: Number(row[xField]) || 0,
        tpr: Number(row[yField]) || 0,
      })
    }

    // Sort each group by FPR and compute AUC (trapezoidal rule)
    const aucValues: Array<{ group: string; auc: number }> = []
    for (const [groupName, points] of groups) {
      points.sort((a, b) => a.fpr - b.fpr)
      let auc = 0
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].fpr - points[i - 1].fpr
        const avgY = (points[i].tpr + points[i - 1].tpr) / 2
        auc += dx * avgY
      }
      aucValues.push({ group: groupName, auc })
    }

    const layers: VegaLiteLayer[] = []

    // Diagonal reference line
    if (showDiagonal) {
      layers.push({
        mark: { type: 'line', strokeDash: [4, 4], color: diagonalColor, opacity: 0.5 },
        data: { values: [{ _x: 0, _y: 0 }, { _x: 1, _y: 1 }] },
        encoding: {
          x: { field: '_x', type: 'quantitative' as const },
          y: { field: '_y', type: 'quantitative' as const },
        },
      })
    }

    // ROC curve(s)
    const colorEncoding = colorField
      ? { color: { field: colorField, type: 'nominal' as const } }
      : {}

    layers.push({
      mark: { type: 'line', strokeWidth: 2 },
      data: { values: data as Record<string, unknown>[] },
      encoding: {
        x: {
          field: xField,
          type: 'quantitative' as const,
          title: 'False Positive Rate',
          scale: { domain: [0, 1] },
        },
        y: {
          field: yField,
          type: 'quantitative' as const,
          title: 'True Positive Rate',
          scale: { domain: [0, 1] },
        },
        ...colorEncoding,
      },
    })

    // AUC annotation
    if (showAuc && aucValues.length > 0) {
      const aucText = aucValues.map((a) => `${a.group}: AUC = ${a.auc.toFixed(3)}`).join('; ')
      layers.push({
        mark: { type: 'text', align: 'right', baseline: 'top', fontSize: 12, dx: -10, dy: 10 },
        data: { values: [{ _x: 1, _y: 0, _text: aucText }] },
        encoding: {
          x: { field: '_x', type: 'quantitative' as const },
          y: { field: '_y', type: 'quantitative' as const },
          text: { field: '_text', type: 'nominal' as const },
        },
      })
    }

    return layers
  }

  /**
   * Build heatmap spec: rect grid with diverging color scale
   */
  function buildHeatmapSpec(
    data: Record<string, unknown>[],
    aes: AestheticMapping,
    geom: Geom
  ): VegaLiteLayer[] {
    const opts = (geom.params ?? {}) as Record<string, unknown>
    const lowColor = (opts.low_color as string) ?? '#313695'
    const midColor = (opts.mid_color as string) ?? '#ffffbf'
    const highColor = (opts.high_color as string) ?? '#a50026'
    const naColor = (opts.na_color as string) ?? '#808080'

    const xField = aes.x ?? 'x'
    // Heatmap: x=row, y=column, color=value. CLI maps: x, y, color
    // If color is set, it's the value column; y is the second categorical axis
    const colorIsValue = typeof aes.color === 'string'
    const yField = colorIsValue ? (aes.y ?? 'y') : (opts.y_col as string ?? 'y')
    const valueCol = (opts.value_col as string) ?? (colorIsValue ? (aes.color as string) : (aes.y ?? 'value'))

    // Determine value range for color midpoint
    const values = data.map((r) => Number(r[valueCol])).filter((v) => !isNaN(v))
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const midpoint = (opts.midpoint as number) ?? (minVal + maxVal) / 2

    return [{
      mark: { type: 'rect' },
      data: { values: data as Record<string, unknown>[] },
      encoding: {
        x: { field: xField, type: 'ordinal' as const },
        y: { field: yField, type: 'ordinal' as const },
        color: {
          field: valueCol,
          type: 'quantitative' as const,
          scale: {
            domainMid: midpoint,
            range: [lowColor, midColor, highColor],
          },
          title: valueCol,
        },
        tooltip: [
          { field: xField, type: 'nominal' as const },
          { field: yField, type: 'nominal' as const },
          { field: valueCol, type: 'quantitative' as const, format: '.2f' },
        ],
      },
    }]
  }

  /**
   * Build density plot spec: use Vega-Lite's native density transform
   */
  function buildDensitySpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const xField = aes.x as string ?? 'x'
    const opts = geom.params ?? {}
    const bandwidth = opts.bw as number | undefined
    const groupField = aes.color as string ?? aes.fill as string ?? aes.group as string

    const layers: VegaLiteLayer[] = []

    // Area layer with density transform
    const areaLayer: VegaLiteLayer = {
      transform: [{
        density: xField,
        ...(bandwidth ? { bandwidth } : {}),
        ...(groupField ? { groupby: [groupField] } : {}),
      }],
      mark: { type: 'area', opacity: (opts.alpha as number) ?? 0.3, line: true },
      encoding: {
        x: { field: 'value', type: 'quantitative' as const, title: xField },
        y: { field: 'density', type: 'quantitative' as const, title: 'Density' },
        ...(groupField ? {
          color: { field: groupField, type: 'nominal' as const },
        } : {}),
        tooltip: [
          { field: 'value', type: 'quantitative' as const, format: '.2f' },
          { field: 'density', type: 'quantitative' as const, format: '.4f' },
        ],
      },
    }
    layers.push(areaLayer)

    return layers
  }

  /**
   * Build ECDF spec: sort values and compute cumulative proportions
   */
  function buildECDFSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const xField = aes.x as string ?? 'x'
    const opts = geom.params ?? {}
    const complement = opts.complement as boolean ?? false
    const groupField = aes.color as string

    // Group data
    const groups = new Map<string, number[]>()
    for (const row of data) {
      const val = Number(row[xField])
      if (isNaN(val)) continue
      const grp = groupField ? String(row[groupField] ?? 'all') : 'all'
      if (!groups.has(grp)) groups.set(grp, [])
      groups.get(grp)!.push(val)
    }

    // Compute ECDF for each group
    const ecdfData: Record<string, unknown>[] = []
    for (const [grp, values] of groups) {
      values.sort((a, b) => a - b)
      const n = values.length
      // Add starting point at (min, 0)
      ecdfData.push({ _x: values[0], _ecdf: complement ? 1 : 0, _group: grp })
      for (let i = 0; i < n; i++) {
        const ecdf = complement ? 1 - (i + 1) / n : (i + 1) / n
        ecdfData.push({ _x: values[i], _ecdf: ecdf, _group: grp })
      }
    }

    return [{
      data: { values: ecdfData },
      mark: { type: 'line', interpolate: 'step-after', strokeWidth: 2 },
      encoding: {
        x: { field: '_x', type: 'quantitative' as const, title: xField },
        y: {
          field: '_ecdf', type: 'quantitative' as const,
          title: complement ? '1 - F(x)' : 'F(x)',
          scale: { domain: [0, 1] },
        },
        ...(groupField ? { color: { field: '_group', type: 'nominal' as const, title: groupField } } : {}),
        tooltip: [
          { field: '_x', type: 'quantitative' as const, format: '.2f', title: xField },
          { field: '_ecdf', type: 'quantitative' as const, format: '.3f', title: 'ECDF' },
        ],
      },
    }]
  }

  /**
   * Build Bland-Altman spec: scatter of mean vs difference with limits of agreement
   */
  function buildBlandAltmanSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const opts = geom.params ?? {}
    const precomputed = opts.precomputed as boolean ?? false
    const limitMultiplier = opts.limit_multiplier as number ?? 1.96
    const showBias = opts.show_bias as boolean ?? true
    const showLimits = opts.show_limits as boolean ?? true
    const biasColor = opts.bias_color as string ?? '#0000ff'
    const limitColor = opts.limit_color as string ?? '#ff0000'

    // Compute mean and difference
    const baData: Record<string, unknown>[] = []
    if (precomputed) {
      const meanField = aes.x as string ?? 'mean'
      const diffField = aes.y as string ?? 'diff'
      for (const row of data) {
        baData.push({ _mean: Number(row[meanField]), _diff: Number(row[diffField]) })
      }
    } else {
      const m1Field = aes.x as string ?? 'method1'
      const m2Field = aes.y as string ?? 'method2'
      for (const row of data) {
        const v1 = Number(row[m1Field])
        const v2 = Number(row[m2Field])
        baData.push({ _mean: (v1 + v2) / 2, _diff: v1 - v2 })
      }
    }

    // Compute bias and limits
    const diffs = baData.map(d => d._diff as number)
    const bias = diffs.reduce((s, v) => s + v, 0) / diffs.length
    const variance = diffs.reduce((s, v) => s + (v - bias) ** 2, 0) / (diffs.length - 1)
    const sd = Math.sqrt(variance)
    const upperLimit = bias + limitMultiplier * sd
    const lowerLimit = bias - limitMultiplier * sd

    const layers: VegaLiteLayer[] = []

    // Scatter layer
    layers.push({
      data: { values: baData },
      mark: { type: 'point', filled: true, size: 60 },
      encoding: {
        x: { field: '_mean', type: 'quantitative' as const, title: 'Mean of Methods' },
        y: { field: '_diff', type: 'quantitative' as const, title: 'Difference' },
        tooltip: [
          { field: '_mean', type: 'quantitative' as const, format: '.2f', title: 'Mean' },
          { field: '_diff', type: 'quantitative' as const, format: '.2f', title: 'Difference' },
        ],
      },
    })

    // Bias line
    if (showBias) {
      layers.push({
        mark: { type: 'rule', color: biasColor, strokeWidth: 2 },
        encoding: { y: { datum: bias } },
      })
    }

    // Upper limit of agreement
    if (showLimits) {
      layers.push({
        mark: { type: 'rule', color: limitColor, strokeWidth: 1.5, strokeDash: [6, 4] },
        encoding: { y: { datum: upperLimit } },
      })
      // Lower limit of agreement
      layers.push({
        mark: { type: 'rule', color: limitColor, strokeWidth: 1.5, strokeDash: [6, 4] },
        encoding: { y: { datum: lowerLimit } },
      })
    }

    return layers
  }

  /**
   * Build correlation matrix spec: compute pairwise correlations, render as colored grid
   */
  function buildCorrmatSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const opts = geom.params ?? {}
    const xField = aes.x as string ?? 'var1'
    const yField = aes.y as string ?? 'var2'
    const valueField = aes.fill as string ?? aes.color as string ?? 'correlation'
    const showValues = opts.show_values as boolean ?? true
    const decimals = opts.decimals as number ?? 2
    const positiveColor = opts.positive_color as string ?? '#2166ac'
    const negativeColor = opts.negative_color as string ?? '#b2182b'
    const neutralColor = opts.neutral_color as string ?? '#f7f7f7'

    // Detect pre-computed correlation matrix: data must have a dedicated value column
    // (like 'correlation', 'corr', 'r') that's distinct from x and y fields.
    // If x/y fields just happen to be in the data (e.g., raw numeric table), compute correlations.
    const hasExplicitValueCol = data.length > 0
      && valueField in (data[0] as Record<string, unknown>)
      && valueField !== xField && valueField !== yField
      && typeof data[0][valueField] === 'number'

    let corrData: Record<string, unknown>[]
    if (hasExplicitValueCol) {
      corrData = data.map(row => ({
        _var1: String(row[xField]),
        _var2: String(row[yField]),
        _corr: Number(row[valueField] ?? 0),
      }))
    } else {
      // Compute pairwise correlations from all numeric columns
      const numCols = Object.keys(data[0] as Record<string, unknown>).filter(k => {
        return data.every(row => typeof row[k] === 'number' || !isNaN(Number(row[k])))
      })
      corrData = []
      for (const c1 of numCols) {
        for (const c2 of numCols) {
          const v1 = data.map(r => Number(r[c1]))
          const v2 = data.map(r => Number(r[c2]))
          const n = v1.length
          const m1 = v1.reduce((s, v) => s + v, 0) / n
          const m2 = v2.reduce((s, v) => s + v, 0) / n
          const cov = v1.reduce((s, v, i) => s + (v - m1) * (v2[i] - m2), 0) / (n - 1)
          const s1 = Math.sqrt(v1.reduce((s, v) => s + (v - m1) ** 2, 0) / (n - 1))
          const s2 = Math.sqrt(v2.reduce((s, v) => s + (v - m2) ** 2, 0) / (n - 1))
          const r = s1 > 0 && s2 > 0 ? cov / (s1 * s2) : 0
          corrData.push({ _var1: c1, _var2: c2, _corr: r })
        }
      }
    }

    const layers: VegaLiteLayer[] = []

    // Rect grid
    layers.push({
      data: { values: corrData },
      mark: { type: 'rect' },
      encoding: {
        x: { field: '_var1', type: 'nominal' as const, title: null },
        y: { field: '_var2', type: 'nominal' as const, title: null },
        color: {
          field: '_corr',
          type: 'quantitative' as const,
          scale: {
            domainMid: 0,
            range: [negativeColor, neutralColor, positiveColor],
          },
          title: 'Correlation',
        },
        tooltip: [
          { field: '_var1', type: 'nominal' as const },
          { field: '_var2', type: 'nominal' as const },
          { field: '_corr', type: 'quantitative' as const, format: `.${decimals}f` },
        ],
      },
    })

    // Text labels
    if (showValues) {
      layers.push({
        data: { values: corrData },
        mark: { type: 'text', fontSize: 10 },
        encoding: {
          x: { field: '_var1', type: 'nominal' as const },
          y: { field: '_var2', type: 'nominal' as const },
          text: { field: '_corr', type: 'quantitative' as const, format: `.${decimals}f` },
          color: {
            condition: {
              test: 'abs(datum._corr) > 0.5',
              value: 'white',
            },
            value: 'black',
          },
        },
      })
    }

    return layers
  }

  /**
   * Build PCA biplot spec: scores scatter + loading arrows
   */
  function buildBiplotSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const opts = geom.params ?? {}
    const pc1Col = opts.pc1_col as string ?? aes.x as string ?? 'PC1'
    const pc2Col = opts.pc2_col as string ?? aes.y as string ?? 'PC2'
    const loadings = opts.loadings as Array<{ variable: string; pc1: number; pc2: number }> | undefined
    const varExplained = opts.var_explained as [number, number] | undefined
    const showScores = opts.show_scores as boolean ?? true
    const showLoadings = opts.show_loadings as boolean ?? true
    const loadingColor = opts.loading_color as string ?? '#e41a1c'
    const showOrigin = opts.show_origin as boolean ?? true
    const colorField = aes.color as string

    const xTitle = varExplained ? `${pc1Col} (${varExplained[0].toFixed(1)}%)` : pc1Col
    const yTitle = varExplained ? `${pc2Col} (${varExplained[1].toFixed(1)}%)` : pc2Col

    const layers: VegaLiteLayer[] = []

    // Origin crosshairs
    if (showOrigin) {
      layers.push({
        mark: { type: 'rule', color: '#999999', strokeDash: [3, 3], strokeWidth: 0.5 },
        encoding: { y: { datum: 0 } },
      })
      layers.push({
        mark: { type: 'rule', color: '#999999', strokeDash: [3, 3], strokeWidth: 0.5 },
        encoding: { x: { datum: 0 } },
      })
    }

    // Score points
    if (showScores) {
      layers.push({
        mark: { type: 'point', filled: true, size: 60 },
        encoding: {
          x: { field: pc1Col, type: 'quantitative' as const, title: xTitle },
          y: { field: pc2Col, type: 'quantitative' as const, title: yTitle },
          ...(colorField ? { color: { field: colorField, type: 'nominal' as const } } : {}),
          tooltip: [
            { field: pc1Col, type: 'quantitative' as const, format: '.2f' },
            { field: pc2Col, type: 'quantitative' as const, format: '.2f' },
            ...(colorField ? [{ field: colorField, type: 'nominal' as const }] : []),
          ],
        },
      })
    }

    // Loading arrows
    if (showLoadings && loadings && loadings.length > 0) {
      // Auto-scale loadings to fit data range
      const pc1Values = data.map(r => Number(r[pc1Col])).filter(v => !isNaN(v))
      const pc2Values = data.map(r => Number(r[pc2Col])).filter(v => !isNaN(v))
      const maxScore = Math.max(
        Math.abs(Math.min(...pc1Values)), Math.abs(Math.max(...pc1Values)),
        Math.abs(Math.min(...pc2Values)), Math.abs(Math.max(...pc2Values)),
      )
      const maxLoading = Math.max(...loadings.map(l => Math.sqrt(l.pc1 ** 2 + l.pc2 ** 2)))
      const loadingScale = (opts.loading_scale as number) ?? (maxScore * 0.8) / (maxLoading || 1)

      const arrowData = loadings.map(l => ({
        _x: 0, _y: 0,
        _x2: l.pc1 * loadingScale, _y2: l.pc2 * loadingScale,
        _variable: l.variable,
      }))

      // Arrow lines (rule from origin to tip)
      layers.push({
        data: { values: arrowData },
        mark: { type: 'rule', color: loadingColor, strokeWidth: 1.5 },
        encoding: {
          x: { field: '_x', type: 'quantitative' as const },
          y: { field: '_y', type: 'quantitative' as const },
          x2: { field: '_x2' },
          y2: { field: '_y2' },
        },
      })

      // Arrow endpoint markers (triangles)
      layers.push({
        data: { values: arrowData },
        mark: { type: 'point', shape: 'triangle', color: loadingColor, size: 40, filled: true },
        encoding: {
          x: { field: '_x2', type: 'quantitative' as const },
          y: { field: '_y2', type: 'quantitative' as const },
        },
      })

      // Loading labels
      layers.push({
        data: { values: arrowData },
        mark: { type: 'text', color: loadingColor, fontSize: 11, dx: 5, dy: -5, fontWeight: 'bold' },
        encoding: {
          x: { field: '_x2', type: 'quantitative' as const },
          y: { field: '_y2', type: 'quantitative' as const },
          text: { field: '_variable', type: 'nominal' as const },
        },
      })
    }

    return layers
  }

  /**
   * Build ridgeline spec: faceted density distributions stacked vertically
   */
  function buildRidgelineSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const xField = aes.x as string ?? 'x'
    const groupField = aes.y as string ?? aes.color as string ?? 'group'
    const opts = geom.params ?? {}
    const bandwidth = (opts.bw ?? opts.bandwidth) as number | undefined
    const alpha = opts.alpha as number ?? 0.7

    // Get unique groups in order
    const groups: string[] = []
    const seen = new Set<string>()
    for (const row of data) {
      const g = String(row[groupField] ?? '')
      if (g && !seen.has(g)) { groups.push(g); seen.add(g) }
    }

    return [{
      transform: [
        {
          density: xField,
          ...(bandwidth ? { bandwidth } : {}),
          groupby: [groupField],
        },
      ],
      mark: { type: 'area', opacity: alpha, line: true },
      encoding: {
        x: { field: 'value', type: 'quantitative' as const, title: xField },
        y: {
          field: 'density', type: 'quantitative' as const,
          title: 'Density',
          axis: null,
          stack: null,
        },
        color: { field: groupField, type: 'nominal' as const },
        row: {
          field: groupField, type: 'nominal' as const,
          title: null,
          header: { labelAngle: 0, labelAlign: 'left' },
          sort: groups,
        },
      },
    }]
  }

  /**
   * Build lollipop spec: vertical/horizontal stems with point caps
   */
  function buildLollipopSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const xField = aes.x as string ?? 'x'
    const yField = aes.y as string ?? 'y'
    const opts = geom.params ?? {}
    const direction = opts.direction as string ?? 'vertical'
    const baseline = opts.baseline as number ?? 0
    const colorField = aes.color as string

    const layers: VegaLiteLayer[] = []

    if (direction === 'horizontal') {
      // Horizontal: stems from baseline along x-axis
      // Use field for x (has type) and datum for x2 (constant baseline)
      layers.push({
        mark: { type: 'rule', strokeWidth: 1.5 },
        encoding: {
          y: { field: yField, type: 'nominal' as const },
          x: { field: xField, type: 'quantitative' as const },
          x2: { datum: baseline },
          ...(colorField ? { color: { field: colorField, type: 'nominal' as const } } : {}),
        },
      })
      layers.push({
        mark: { type: 'point', filled: true, size: 80 },
        encoding: {
          y: { field: yField, type: 'nominal' as const },
          x: { field: xField, type: 'quantitative' as const, title: xField },
          ...(colorField ? { color: { field: colorField, type: 'nominal' as const } } : {}),
          tooltip: [
            { field: yField, type: 'nominal' as const },
            { field: xField, type: 'quantitative' as const },
          ],
        },
      })
    } else {
      // Vertical: stems from baseline along y-axis
      // Use field for y (has type) and datum for y2 (constant baseline)
      layers.push({
        mark: { type: 'rule', strokeWidth: 1.5 },
        encoding: {
          x: { field: xField, type: 'nominal' as const },
          y: { field: yField, type: 'quantitative' as const },
          y2: { datum: baseline },
          ...(colorField ? { color: { field: colorField, type: 'nominal' as const } } : {}),
        },
      })
      layers.push({
        mark: { type: 'point', filled: true, size: 80 },
        encoding: {
          x: { field: xField, type: 'nominal' as const },
          y: { field: yField, type: 'quantitative' as const, title: yField },
          ...(colorField ? { color: { field: colorField, type: 'nominal' as const } } : {}),
          tooltip: [
            { field: xField, type: 'nominal' as const },
            { field: yField, type: 'quantitative' as const },
          ],
        },
      })
    }

    return layers
  }

  /**
   * Build dumbbell spec: horizontal rules connecting two points per category
   */
  function buildDumbbellSpec(data: Record<string, unknown>[], aes: AestheticMapping, geom: Geom): VegaLiteLayer[] {
    const xField = aes.x as string ?? 'x'
    const yField = aes.y as string ?? 'y'
    const opts = geom.params ?? {}
    const lineColor = opts.lineColor as string ?? opts.line_color as string ?? '#666666'
    const startColor = opts.color as string ?? '#4fa9ee'
    const endColor = opts.colorEnd as string ?? opts.color_end as string ?? '#ee8866'

    // Pre-compute dumbbell data
    const dbData = data.map(row => ({
      ...row,
      _x1: Number(row[xField]),
      _x2: Number(row['xend'] ?? row[xField]),
      _y: row[yField],
    }))

    const layers: VegaLiteLayer[] = []

    // Connecting rules
    layers.push({
      data: { values: dbData },
      mark: { type: 'rule', color: lineColor, strokeWidth: 1.5 },
      encoding: {
        y: { field: '_y', type: 'nominal' as const, title: yField },
        x: { field: '_x1', type: 'quantitative' as const },
        x2: { field: '_x2' },
      },
    })

    // Start points
    layers.push({
      data: { values: dbData },
      mark: { type: 'point', filled: true, size: 80, color: startColor },
      encoding: {
        y: { field: '_y', type: 'nominal' as const },
        x: { field: '_x1', type: 'quantitative' as const, title: xField },
        tooltip: [
          { field: '_y', type: 'nominal' as const, title: yField },
          { field: '_x1', type: 'quantitative' as const, title: 'Start' },
        ],
      },
    })

    // End points
    layers.push({
      data: { values: dbData },
      mark: { type: 'point', filled: true, size: 80, color: endColor },
      encoding: {
        y: { field: '_y', type: 'nominal' as const },
        x: { field: '_x2', type: 'quantitative' as const },
        tooltip: [
          { field: '_y', type: 'nominal' as const, title: yField },
          { field: '_x2', type: 'quantitative' as const, title: 'End' },
        ],
      },
    })

    return layers
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
      boxplotSwapped = !!boxSpec._swapped
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
        ...(linerangeSpec._aggregatedData ? { data: { values: linerangeSpec._aggregatedData } } : {}),
      }
    }

    if (geom.type === 'pointrange') {
      // Returns multiple layers (may include layer-level data)
      return buildPointrangeSpec(data, spec.aes)
    }

    if (geom.type === 'crossbar') {
      // Returns multiple layers (may include layer-level data)
      return buildCrossbarSpec(data, spec.aes)
    }

    if (geom.type === 'errorbarh') {
      const errorhSpec = buildErrorbarhSpec(data, spec.aes)
      return {
        mark: errorhSpec.mark as string,
        encoding: errorhSpec.encoding,
        ...(errorhSpec._aggregatedData ? { data: { values: errorhSpec._aggregatedData } } : {}),
      }
    }

    if (geom.type === 'ribbon') {
      const ribbonSpec = buildRibbonSpec(data, spec.aes)
      return {
        mark: ribbonSpec.mark as { type: string },
        encoding: ribbonSpec.encoding,
        ...(ribbonSpec._aggregatedData ? { data: { values: ribbonSpec._aggregatedData } } : {}),
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

    if (geom.type === 'volcano') {
      suppressAxisLabels = true
      return buildVolcanoSpec(data, spec.aes, geom)
    }

    if (geom.type === 'kaplan_meier') {
      suppressAxisLabels = true
      return buildKaplanMeierSpec(data, spec.aes, geom)
    }

    if (geom.type === 'ma') {
      suppressAxisLabels = true
      return buildMASpec(data, spec.aes, geom)
    }

    if (geom.type === 'manhattan') {
      suppressAxisLabels = true
      return buildManhattanSpec(data, spec.aes, geom)
    }

    if (geom.type === 'forest') {
      suppressAxisLabels = true
      return buildForestSpec(data, spec.aes, geom)
    }

    if (geom.type === 'roc') {
      suppressAxisLabels = true
      return buildRocSpec(data, spec.aes, geom)
    }

    if (geom.type === 'heatmap') {
      suppressAxisLabels = true
      return buildHeatmapSpec(data, spec.aes, geom)
    }

    if (geom.type === 'density') {
      suppressAxisLabels = true
      return buildDensitySpec(data, spec.aes, geom)
    }

    if (geom.type === 'ecdf') {
      suppressAxisLabels = true
      return buildECDFSpec(data, spec.aes, geom)
    }

    if (geom.type === 'bland_altman') {
      suppressAxisLabels = true
      return buildBlandAltmanSpec(data, spec.aes, geom)
    }

    if (geom.type === 'corrmat') {
      suppressAxisLabels = true
      return buildCorrmatSpec(data, spec.aes, geom)
    }

    if (geom.type === 'biplot') {
      suppressAxisLabels = true
      return buildBiplotSpec(data, spec.aes, geom)
    }

    if (geom.type === 'ridgeline' || geom.type === 'joy') {
      suppressAxisLabels = true
      return buildRidgelineSpec(data, spec.aes, geom)
    }

    if (geom.type === 'lollipop') {
      suppressAxisLabels = true
      return buildLollipopSpec(data, spec.aes, geom)
    }

    if (geom.type === 'dumbbell') {
      suppressAxisLabels = true
      return buildDumbbellSpec(data, spec.aes, geom)
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
      // If the layer has its own data (e.g. pre-aggregated range geoms), override top-level data
      if (layerResult.data) {
        vlSpec.data = layerResult.data
      }
    }
  } else {
    // Default to point if no geoms
    vlSpec.mark = 'point'
    vlSpec.encoding = buildEncoding(spec.aes, spec.data, { type: 'point', params: {} })
  }

  // Handle coord_flip: swap x and y encodings in Vega-Lite
  const isFlipped = spec.coord?.type === 'flip'
  if (isFlipped) {
    const swapEncoding = (enc: Record<string, unknown> | undefined) => {
      if (!enc) return
      const tmp = enc.x
      enc.x = enc.y
      enc.y = tmp
    }
    if (vlSpec.encoding) swapEncoding(vlSpec.encoding)
    if (vlSpec.layer) {
      for (const layer of vlSpec.layer) {
        if (layer.encoding) swapEncoding(layer.encoding)
      }
    }
  }

  // Apply axis labels (swap x/y labels if boxplot swapped axes or coord_flip)
  // Skip for geoms that set their own titles (volcano, KM)
  const axesSwapped = boxplotSwapped || isFlipped
  const xLabel = suppressAxisLabels ? undefined : (axesSwapped ? spec.labels.y : spec.labels.x)
  const yLabel = suppressAxisLabels ? undefined : (axesSwapped ? spec.labels.x : spec.labels.y)
  if (vlSpec.encoding) {
    if (xLabel && vlSpec.encoding.x) {
      (vlSpec.encoding.x as Record<string, unknown>).title = xLabel
    }
    if (yLabel && vlSpec.encoding.y) {
      (vlSpec.encoding.y as Record<string, unknown>).title = yLabel
    }
    if (spec.labels.color && vlSpec.encoding.color) {
      (vlSpec.encoding.color as Record<string, unknown>).title = spec.labels.color
    }
  }

  // Apply to layers if present
  if (vlSpec.layer) {
    for (const layer of vlSpec.layer) {
      if (layer.encoding) {
        if (xLabel && layer.encoding.x) {
          (layer.encoding.x as Record<string, unknown>).title = xLabel
        }
        if (yLabel && layer.encoding.y) {
          (layer.encoding.y as Record<string, unknown>).title = yLabel
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

    // Check if layers have their own data (per-layer data causes VL to compile
    // top-level params into each layer scope, creating duplicate signals)
    const layersHaveOwnData = vlSpec.layer?.some(l => !!(l as Record<string, unknown>).data)

    if (params.length > 0) {
      if (vlSpec.layer && layersHaveOwnData) {
        // Put params on only the first non-rule layer to avoid duplicate signals
        for (const layer of vlSpec.layer) {
          const markType = typeof layer.mark === 'string' ? layer.mark : layer.mark?.type
          if (markType !== 'rule') {
            ;(layer as Record<string, unknown>).params = params
            break
          }
        }
      } else {
        vlSpec.params = params
      }
    }

    // Apply encoding modifications (tooltip, opacity, etc.)
    if (Object.keys(encodingMods).length > 0) {
      if (vlSpec.encoding) {
        Object.assign(vlSpec.encoding, encodingMods)
      }
      // Also apply to layers (skip rule marks like hline/vline — they don't support selections)
      if (vlSpec.layer) {
        for (const layer of vlSpec.layer) {
          if (layer.encoding) {
            const markType = typeof layer.mark === 'string' ? layer.mark : layer.mark?.type
            if (markType === 'rule') {
              // Only add tooltip to rule layers, not hover/selection params
              if (encodingMods.tooltip) {
                layer.encoding.tooltip = encodingMods.tooltip
              }
            } else {
              Object.assign(layer.encoding, encodingMods)
            }
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
      // Facet variables must be discrete — use ordinal for low-cardinality numeric fields
      let facetType = inferFieldType(spec.data as Record<string, unknown>[], facetVar)
      if (facetType === 'quantitative' && isLowCardinalityNumeric(spec.data as Record<string, unknown>[], facetVar)) {
        facetType = 'ordinal'
      } else if (facetType === 'quantitative') {
        facetType = 'ordinal' // Facets must be discrete
      }
      vlSpec.facet = {
        field: facetVar,
        type: facetType,
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
        const rowType = inferFieldType(spec.data as Record<string, unknown>[], vars.rows)
        vlSpec.facet.row = {
          field: vars.rows,
          type: rowType === 'quantitative' ? 'ordinal' : rowType,
        }
      }
      if (vars.cols) {
        const colType = inferFieldType(spec.data as Record<string, unknown>[], vars.cols)
        vlSpec.facet.column = {
          field: vars.cols,
          type: colType === 'quantitative' ? 'ordinal' : colType,
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
