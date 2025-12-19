/**
 * Main rendering pipeline
 *
 * Orchestrates the full flow from PlotSpec to rendered output.
 */

import type { AestheticMapping, DataSource, Facet, PlotSpec, RenderOptions, RGBA } from '../types'
import { TerminalCanvas, createCanvas } from '../canvas/canvas'
import { buildScaleContext, inferContinuousDomain, niceDomain } from './scales'
import type { ScaleContext } from './scales'
import { renderGeom } from './render-geoms'
import { renderAxes, renderTitle, renderLegend, renderGridLines, calculateTicks, formatTick } from './render-axes'
import { stat_bin } from '../stats/bin'
import { stat_boxplot } from '../stats/boxplot'
import { stat_density } from '../stats/density'
import { stat_smooth } from '../stats/smooth'
import { stat_summary } from '../stats/summary'
import { computeFacetPanels, calculatePanelLayouts } from '../facets'
import type { FacetPanel, PanelLayout } from '../facets'

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
  } else if (geom.stat === 'density') {
    const densityStat = stat_density({
      bw: geom.params.bw as number,
      kernel: geom.params.kernel as 'gaussian' | 'epanechnikov' | 'rectangular',
      n: geom.params.n as number,
      adjust: geom.params.adjust as number,
    })
    return densityStat.compute(data, aes)
  } else if (geom.stat === 'smooth') {
    const smoothStat = stat_smooth({
      method: geom.params.method as 'lm' | 'loess' | 'lowess',
      span: geom.params.span as number,
      n: geom.params.n as number,
      se: geom.params.se as boolean,
      level: geom.params.level as number,
    })
    return smoothStat.compute(data, aes)
  } else if (geom.stat === 'summary') {
    const summaryStat = stat_summary({
      fun: geom.params.fun as 'mean' | 'median' | 'min' | 'max' | 'sum',
      funMin: geom.params.funMin as 'mean' | 'median' | 'min' | 'max' | 'sum',
      funMax: geom.params.funMax as 'mean' | 'median' | 'min' | 'max' | 'sum',
      funData: geom.params.funData as 'mean_se' | 'mean_sd' | 'mean_cl_normal' | 'median_range',
    })
    return summaryStat.compute(data, aes)
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
  // Check if faceting is requested
  if (spec.facet) {
    return renderFacetedToCanvas(spec, options)
  }

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
 * Render a faceted plot specification to a canvas
 */
function renderFacetedToCanvas(
  spec: PlotSpec,
  options: RenderOptions
): TerminalCanvas {
  const facet = spec.facet!
  const { width, height } = options

  // Create canvas
  const canvas = createCanvas(width, height)

  // Compute facet panels (data splits)
  const { panels, nrow, ncol } = computeFacetPanels(spec.data, facet)

  if (panels.length === 0) {
    // No data to facet, render empty
    return canvas
  }

  // Render overall title
  if (spec.labels.title) {
    renderTitle(canvas, spec.labels.title, width, spec.theme)
  }

  const hasTitle = !!spec.labels.title
  const hasLegend = spec.theme.legend.position !== 'none' && !!spec.aes.color

  // Calculate margins
  const margins = {
    top: hasTitle ? 2 : 1,
    right: hasLegend && spec.theme.legend.position === 'right' ? 15 : 1,
    bottom: 3,  // Space for x-axis label
    left: 10,   // Space for y-axis
  }

  // Calculate panel layouts
  const panelLayouts = calculatePanelLayouts(width, height, nrow, ncol, hasTitle, margins)

  // Compute shared scales if needed
  const sharedScales = computeSharedScales(panels, spec, facet)

  // Render each panel
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i]
    const layout = panelLayouts[i]

    if (!layout) continue

    renderPanel(canvas, panel, layout, spec, facet, sharedScales)
  }

  // Render shared axis labels
  const axisColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  // X-axis label (centered at bottom)
  if (spec.labels.x) {
    const xLabelX = margins.left + Math.floor((width - margins.left - margins.right - spec.labels.x.length) / 2)
    canvas.drawString(xLabelX, height - 1, spec.labels.x, axisColor)
  }

  // Y-axis label (on left side)
  if (spec.labels.y) {
    const yLabelY = margins.top + Math.floor((height - margins.top - margins.bottom) / 2)
    // Truncate if too long
    const displayLabel = spec.labels.y.length > margins.left - 1
      ? spec.labels.y.substring(0, margins.left - 1)
      : spec.labels.y
    canvas.drawString(0, yLabelY, displayLabel, axisColor)
  }

  // Render legend if needed
  if (hasLegend && spec.aes.color) {
    // Get unique color values from all panels
    const colorValues = new Set<string>()
    for (const panel of panels) {
      for (const row of panel.data) {
        const value = row[spec.aes.color]
        if (value !== null && value !== undefined) {
          colorValues.add(String(value))
        }
      }
    }

    if (sharedScales.color) {
      const colorDomain = sharedScales.color.domain as string[]
      renderLegend(
        canvas,
        colorDomain,
        (v) => sharedScales.color!.map(v),
        width - margins.right + 1,
        margins.top,
        spec.labels.color,
        spec.theme
      )
    }
  }

  return canvas
}

/**
 * Compute shared scales across all panels
 */
function computeSharedScales(
  panels: FacetPanel[],
  spec: PlotSpec,
  facet: Facet
): Partial<ScaleContext> {
  const scales = facet.scales ?? 'fixed'

  // Combine all data for scale computation
  const allData: DataSource = []
  for (const panel of panels) {
    allData.push(...panel.data)
  }

  // Compute domains from all data
  const xDomain = niceDomain(inferContinuousDomain(allData, spec.aes.x))
  const yDomain = niceDomain(inferContinuousDomain(allData, spec.aes.y))

  // For color scale, always compute from all data
  let color: ScaleContext['color'] | undefined
  if (spec.aes.color) {
    const { createResolvedDiscreteColorScale, inferDiscreteDomain } = require('./scales')
    const colorDomain = inferDiscreteDomain(allData, spec.aes.color)
    color = createResolvedDiscreteColorScale(colorDomain)
  }

  return {
    // Store domains for later use in individual panels
    x: { domain: xDomain, scales },
    y: { domain: yDomain, scales },
    color,
  } as unknown as Partial<ScaleContext>
}

/**
 * Render a single facet panel
 */
function renderPanel(
  canvas: TerminalCanvas,
  panel: FacetPanel,
  layout: PanelLayout,
  spec: PlotSpec,
  facet: Facet,
  sharedScales: Partial<ScaleContext>
): void {
  const stripColor: RGBA = { r: 200, g: 200, b: 200, a: 1 }

  // Draw strip label (facet title)
  const labelText = panel.label.length > layout.width - 2
    ? panel.label.substring(0, layout.width - 3) + '…'
    : panel.label
  const labelX = layout.x + Math.floor((layout.width - labelText.length) / 2)
  canvas.drawString(labelX, layout.labelY, labelText, stripColor)

  // Create plot area for this panel
  const plotArea = {
    x: layout.x + 6,  // Leave space for y-axis ticks
    y: layout.y,
    width: layout.width - 7,
    height: layout.height - 2,  // Leave space for x-axis
  }

  // Ensure minimum sizes
  plotArea.width = Math.max(5, plotArea.width)
  plotArea.height = Math.max(3, plotArea.height)

  // Build scales for this panel
  const scalesMode = facet.scales ?? 'fixed'

  // Use shared or panel-specific domains based on scales setting
  let scaleData = panel.data
  let scaleAes = spec.aes

  // Handle stat transforms
  for (const geom of spec.geoms) {
    if (geom.stat === 'bin' || geom.stat === 'boxplot') {
      scaleData = applyStatTransform(panel.data, geom, spec.aes)
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    }
  }

  // Build scale context
  const scales = buildScaleContext(
    scalesMode === 'fixed' || scalesMode === 'free_y'
      ? [...scaleData, { [spec.aes.x]: (sharedScales as any).x?.domain?.[0], [spec.aes.y]: (sharedScales as any).y?.domain?.[0] }, { [spec.aes.x]: (sharedScales as any).x?.domain?.[1], [spec.aes.y]: (sharedScales as any).y?.domain?.[1] }]
      : scaleData,
    scaleAes,
    plotArea,
    spec.scales
  )

  // Override color scale with shared one
  if (sharedScales.color) {
    scales.color = sharedScales.color
  }

  // Render grid lines
  renderGridLines(canvas, scales, plotArea, spec.theme)

  // Render simplified axes (just ticks, labels handled differently for facets)
  renderPanelAxes(canvas, scales, plotArea, panel.row, panel.col, spec.theme)

  // Render geometry layers
  for (const geom of spec.geoms) {
    const geomData = applyStatTransform(panel.data, geom, spec.aes)
    renderGeom(geomData, geom, spec.aes, scales, canvas)
  }
}

/**
 * Render axes for a facet panel (simplified version)
 */
function renderPanelAxes(
  canvas: TerminalCanvas,
  scales: ScaleContext,
  plotArea: { x: number; y: number; width: number; height: number },
  _row: number,
  _col: number,
  _theme: any
): void {
  const axisColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  // Bottom axis line
  canvas.drawHLine(plotArea.x, plotArea.y + plotArea.height, plotArea.width, '─', axisColor)

  // Left axis line
  canvas.drawVLine(plotArea.x - 1, plotArea.y, plotArea.height, '│', axisColor)

  // Corner
  canvas.drawChar(plotArea.x - 1, plotArea.y + plotArea.height, '└', axisColor)

  // X-axis ticks and labels
  if (scales.x.type === 'continuous') {
    const domain = scales.x.domain as [number, number]
    const ticks = calculateTicks(domain, Math.max(2, Math.floor(plotArea.width / 10)))

    for (const tickValue of ticks) {
      const x = Math.round(scales.x.map(tickValue))
      if (x >= plotArea.x && x < plotArea.x + plotArea.width) {
        canvas.drawChar(x, plotArea.y + plotArea.height, '┬', axisColor)
        const tickLabel = formatTick(tickValue)
        const labelX = x - Math.floor(tickLabel.length / 2)
        canvas.drawString(Math.max(plotArea.x, labelX), plotArea.y + plotArea.height + 1, tickLabel, axisColor)
      }
    }
  }

  // Y-axis ticks and labels
  if (scales.y.type === 'continuous') {
    const domain = scales.y.domain as [number, number]
    const ticks = calculateTicks(domain, Math.max(2, Math.floor(plotArea.height / 4)))

    for (const tickValue of ticks) {
      const y = Math.round(scales.y.map(tickValue))
      if (y >= plotArea.y && y < plotArea.y + plotArea.height) {
        canvas.drawChar(plotArea.x - 1, y, '┤', axisColor)
        const tickLabel = formatTick(tickValue)
        const labelX = plotArea.x - tickLabel.length - 2
        canvas.drawString(Math.max(0, labelX), y, tickLabel, axisColor)
      }
    }
  }
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
