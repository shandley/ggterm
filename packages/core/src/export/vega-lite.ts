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

  // Apply axis labels (swap x/y labels if boxplot swapped axes)
  const xLabel = boxplotSwapped ? spec.labels.y : spec.labels.x
  const yLabel = boxplotSwapped ? spec.labels.x : spec.labels.y
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
