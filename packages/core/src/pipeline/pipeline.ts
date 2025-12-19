/**
 * Main rendering pipeline
 *
 * Orchestrates the full flow from PlotSpec to rendered output.
 */

import type { AestheticMapping, DataSource, PlotSpec, RenderOptions } from '../types'
import { TerminalCanvas, createCanvas } from '../canvas/canvas'
import { buildScaleContext } from './scales'
import { renderGeom } from './render-geoms'
import { renderAxes, renderTitle, renderLegend, renderGridLines } from './render-axes'
import { stat_bin } from '../stats/bin'
import { stat_boxplot } from '../stats/boxplot'

/**
 * Layout configuration for plot elements
 */
export interface PlotLayout {
  width: number
  height: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  plotArea: {
    x: number
    y: number
    width: number
    height: number
  }
  legendArea?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Calculate layout based on render options and content
 */
export function calculateLayout(
  spec: PlotSpec,
  options: RenderOptions
): PlotLayout {
  const { width, height } = options

  // Determine margins based on content
  const hasTitle = !!spec.labels.title
  const hasXLabel = !!spec.labels.x
  const hasYLabel = !!spec.labels.y
  const hasLegend =
    spec.theme.legend.position !== 'none' && !!spec.aes.color

  // Calculate margins
  const margins = {
    top: hasTitle ? 2 : 1,
    right: hasLegend && spec.theme.legend.position === 'right' ? 15 : 1,
    bottom: 2 + (hasXLabel ? 1 : 0),
    left: 8 + (hasYLabel ? 2 : 0),
  }

  // Calculate plot area
  const plotArea = {
    x: margins.left,
    y: margins.top,
    width: width - margins.left - margins.right,
    height: height - margins.top - margins.bottom,
  }

  // Ensure minimum plot area
  plotArea.width = Math.max(10, plotArea.width)
  plotArea.height = Math.max(5, plotArea.height)

  const layout: PlotLayout = { width, height, margins, plotArea }

  // Legend area
  if (hasLegend && spec.theme.legend.position === 'right') {
    layout.legendArea = {
      x: width - margins.right + 1,
      y: margins.top,
      width: margins.right - 1,
      height: plotArea.height,
    }
  }

  return layout
}

/**
 * Apply statistical transformation to data if needed
 */
function applyStatTransform(
  data: DataSource,
  geom: { stat?: string; params: Record<string, unknown> },
  aes: AestheticMapping
): DataSource {
  if (geom.stat === 'bin') {
    const binStat = stat_bin({
      bins: geom.params.bins as number,
      binwidth: geom.params.binwidth as number,
    })
    return binStat.compute(data, aes)
  } else if (geom.stat === 'boxplot') {
    const boxStat = stat_boxplot({
      coef: geom.params.coef as number,
    })
    return boxStat.compute(data, aes)
  }
  return data
}

/**
 * Render a plot specification to a canvas
 */
export function renderToCanvas(
  spec: PlotSpec,
  options: RenderOptions
): TerminalCanvas {
  // Calculate layout
  const layout = calculateLayout(spec, options)

  // Create canvas
  const canvas = createCanvas(layout.width, layout.height)

  // Pre-compute transformed data for geoms with stats to determine proper scales
  // For histogram/boxplot, we need scales based on transformed data
  let scaleData = spec.data
  let scaleAes = spec.aes

  // Check if any geom needs a stat transform that affects scales
  for (const geom of spec.geoms) {
    if (geom.stat === 'bin') {
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      // Stats output x and y - histogram uses x for bin center, y for count
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    } else if (geom.stat === 'boxplot') {
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      // Boxplot: x stays as group name, y covers the range (use ymin/ymax for full range)
      // We need to expand the y domain to include outliers
      const allYValues: { y: number }[] = []
      for (const row of scaleData) {
        allYValues.push({ y: row.lower as number })
        allYValues.push({ y: row.upper as number })
        const outliers = row.outliers as number[] ?? []
        for (const o of outliers) {
          allYValues.push({ y: o })
        }
      }
      scaleData = [...scaleData, ...allYValues]
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    }
  }

  // Build scale context based on (potentially transformed) data
  const scales = buildScaleContext(
    scaleData,
    scaleAes,
    layout.plotArea,
    spec.scales
  )

  // Render title if present
  if (spec.labels.title) {
    renderTitle(canvas, spec.labels.title, layout.width, spec.theme)
  }

  // Render grid lines (behind data)
  renderGridLines(canvas, scales, layout.plotArea, spec.theme)

  // Render axes
  renderAxes(canvas, scales, layout.plotArea, spec.labels, spec.theme)

  // Render each geometry layer
  for (const geom of spec.geoms) {
    // Apply statistical transformation if needed
    const geomData = applyStatTransform(spec.data, geom, spec.aes)
    renderGeom(geomData, geom, spec.aes, scales, canvas)
  }

  // Render legend if needed
  if (layout.legendArea && scales.color) {
    const colorDomain = scales.color.domain as string[]
    renderLegend(
      canvas,
      colorDomain,
      (v) => scales.color!.map(v),
      layout.legendArea.x,
      layout.legendArea.y,
      spec.labels.color,
      spec.theme
    )
  }

  return canvas
}

/**
 * Render a plot specification to a string
 */
export function renderToString(
  spec: PlotSpec,
  options: RenderOptions
): string {
  const canvas = renderToCanvas(spec, options)

  // Use ANSI colors if not explicitly disabled
  if (options.colorMode === 'none') {
    return canvas.toString()
  }

  return canvas.toAnsiString()
}
