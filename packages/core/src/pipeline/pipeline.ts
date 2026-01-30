/**
 * Main rendering pipeline
 *
 * Orchestrates the full flow from PlotSpec to rendered output.
 */

import type { AestheticMapping, DataSource, Facet, Geom, PlotSpec, RenderOptions, RGBA } from '../types'
import { TerminalCanvas, createCanvas } from '../canvas/canvas'
import { buildScaleContext, inferContinuousDomain, niceDomain } from './scales'
import type { ScaleContext } from './scales'
import { renderGeom } from './render-geoms'
import { renderAxes, renderTitle, renderMultiLegend, renderGridLines, calculateTicks, formatTick } from './render-axes'
import type { LegendEntry } from './render-axes'
import { stat_bin } from '../stats/bin'
import { stat_bin2d } from '../stats/bin2d'
import { stat_boxplot } from '../stats/boxplot'
import { stat_count } from '../stats/count'
import { stat_density, stat_ydensity, stat_xdensity } from '../stats/density'
import { stat_beeswarm } from '../stats/beeswarm'
import { stat_smooth } from '../stats/smooth'
import { stat_summary } from '../stats/summary'
import { stat_qq, stat_qq_line } from '../stats/qq'
import { stat_density_2d } from '../stats/density2d'
import { computeFacetPanels, calculatePanelLayouts, calculateGridStripLayout, label_value } from '../facets'
import type { FacetPanel, PanelLayout, Labeller } from '../facets'

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
  const hasY2 = !!spec.aes.y2 || spec.scales.some(s => s.aesthetic === 'y2')
  const hasY2Label = !!spec.labels.y2
  // Check for any legend-worthy aesthetics (color or size)
  const hasLegend =
    spec.theme.legend.position !== 'none' && (!!spec.aes.color || !!spec.aes.size)

  // Calculate margins
  const legendPosition = spec.theme.legend.position
  // Right margin: legend takes priority, then y2 axis, then minimal
  let rightMargin = 1
  if (hasLegend && legendPosition === 'right') {
    rightMargin = 15
  } else if (hasY2) {
    // Reserve space for secondary y-axis: ticks (6) + label (2) + padding (1)
    rightMargin = 8 + (hasY2Label ? 2 : 0)
  }
  const margins = {
    top: hasTitle ? 2 : 1,
    right: rightMargin,
    bottom: 2 + (hasXLabel ? 1 : 0) + (hasLegend && legendPosition === 'bottom' ? 2 : 0),
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
  if (hasLegend) {
    if (legendPosition === 'right') {
      layout.legendArea = {
        x: width - margins.right + 1,
        y: margins.top,
        width: margins.right - 1,
        height: plotArea.height,
      }
    } else if (legendPosition === 'bottom') {
      layout.legendArea = {
        x: margins.left,
        y: height - 2,
        width: plotArea.width,
        height: 2,
      }
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
  } else if (geom.stat === 'ydensity') {
    // For violin plots - compute density on y values grouped by x
    const ydensityStat = stat_ydensity({
      bw: geom.params.bw as number,
      kernel: geom.params.kernel as 'gaussian' | 'epanechnikov' | 'rectangular',
      n: geom.params.n as number,
      adjust: geom.params.adjust as number,
    })
    return ydensityStat.compute(data, aes)
  } else if (geom.stat === 'xdensity') {
    // For ridgeline plots - compute density on x values grouped by y
    const xdensityStat = stat_xdensity({
      bw: geom.params.bw as number,
      kernel: geom.params.kernel as 'gaussian' | 'epanechnikov' | 'rectangular',
      n: geom.params.n as number,
      adjust: geom.params.adjust as number,
    })
    return xdensityStat.compute(data, aes)
  } else if (geom.stat === 'beeswarm') {
    // For beeswarm plots - arrange points to avoid overlap
    const beeswarmStat = stat_beeswarm({
      method: geom.params.method as 'swarm' | 'center' | 'square',
      cex: geom.params.cex as number,
      side: geom.params.side as -1 | 0 | 1,
      priority: geom.params.priority as 'ascending' | 'descending' | 'density' | 'random',
      dodge: geom.params.dodge as number,
    })
    return beeswarmStat.compute(data, aes)
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
  } else if (geom.stat === 'count') {
    const countStat = stat_count({})
    const counts = countStat.compute(data, aes)
    // Map count results to y field for bar rendering
    return counts.map(c => ({ x: c.x, y: c.count, count: c.count }))
  } else if (geom.stat === 'qq') {
    const qqStat = stat_qq({
      distribution: geom.params.distribution as 'norm' | 'uniform' | 'exp',
      dparams: geom.params.dparams as { mean?: number; sd?: number; rate?: number },
    })
    return qqStat.compute(data, aes)
  } else if (geom.stat === 'qq_line') {
    const qqLineStat = stat_qq_line({
      distribution: geom.params.distribution as 'norm' | 'uniform' | 'exp',
      dparams: geom.params.dparams as { mean?: number; sd?: number; rate?: number },
    })
    return qqLineStat.compute(data, aes)
  } else if (geom.stat === 'bin2d') {
    const bin2dStat = stat_bin2d({
      bins: geom.params.bins as number,
      binsx: geom.params.binsx as number,
      binsy: geom.params.binsy as number,
      drop: geom.params.drop as boolean,
    })
    return bin2dStat.compute(data, aes)
  } else if (geom.stat === 'density_2d') {
    const density2dStat = stat_density_2d({
      h: geom.params.bandwidth as number | [number, number],
      n: geom.params.n as number,
      nx: geom.params.nx as number,
      ny: geom.params.ny as number,
      adjust: geom.params.adjust as number,
    })
    return density2dStat.compute(data, aes)
  }
  return data
}

/**
 * Apply coordinate transformation to data
 *
 * This transforms x/y values based on the coordinate system:
 * - coordFlip: swaps x and y
 * - coordPolar: converts (angle, radius) to (x, y) cartesian
 * - coordTrans: applies log10/sqrt/reverse transforms
 * - coordCartesian/Fixed/Equal: identity (no change)
 */
function applyCoordTransform(
  data: DataSource,
  aes: AestheticMapping,
  coord: { type: string; transform: (x: number, y: number) => { x: number; y: number } }
): DataSource {
  // Skip for identity transforms (cartesian, fixed)
  if (coord.type === 'cartesian' || coord.type === 'fixed') {
    return data
  }

  return data.map(row => {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    // Skip if x or y is not a number
    if (typeof xVal !== 'number' || typeof yVal !== 'number') {
      return row
    }

    // Apply coordinate transform
    const transformed = coord.transform(xVal, yVal)

    // Return new row with transformed coordinates
    return {
      ...row,
      [aes.x]: transformed.x,
      [aes.y]: transformed.y,
    }
  })
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
    } else if (geom.stat === 'count') {
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      // Count stat outputs x (categories) and y (counts)
      // Add y=0 baseline so bar charts always start from 0
      scaleData = [...scaleData, { x: scaleData[0]?.x ?? '', y: 0 }]
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    } else if (geom.stat === 'qq') {
      // Q-Q plot: x = theoretical quantiles, y = sample quantiles
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    } else if (geom.stat === 'qq_line') {
      // Q-Q line uses the same data range as Q-Q points
      // Get the qq data for scale determination
      const qqGeom = spec.geoms.find(g => g.stat === 'qq')
      if (qqGeom) {
        scaleData = applyStatTransform(spec.data, qqGeom, spec.aes)
        scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      }
      break
    } else if (geom.stat === 'bin2d') {
      // 2D binning: x and y are bin centers, fill is count
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      scaleAes = { ...spec.aes, x: 'x', y: 'y', fill: 'fill' }
      break
    } else if (geom.stat === 'density_2d') {
      // 2D density: x and y are grid points, z is density
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    } else if (geom.stat === 'xdensity') {
      // Ridgeline: x is density positions, y is categorical groups
      scaleData = applyStatTransform(spec.data, geom, spec.aes)
      scaleAes = { ...spec.aes, x: 'x', y: 'y' }
      break
    } else if (geom.stat === 'beeswarm') {
      // Beeswarm: keep original x for discrete scale, use original y
      // The stat transforms x to continuous positions, but we want categorical x-axis
      scaleData = spec.data  // Use original data for scale building
      scaleAes = spec.aes    // Use original aesthetics
      break
    }
  }

  // Apply coordinate transformation to scale data
  // This ensures scales are built on transformed coordinates (e.g., polar -> cartesian)
  scaleData = applyCoordTransform(scaleData, scaleAes, spec.coord)

  // Build scale context based on (potentially transformed) data
  // Pass coord limits for zooming/clipping
  const coordLimits = spec.coord.xlim || spec.coord.ylim
    ? { xlim: spec.coord.xlim, ylim: spec.coord.ylim }
    : undefined

  const scales = buildScaleContext(
    scaleData,
    scaleAes,
    layout.plotArea,
    spec.scales,
    coordLimits
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
    let geomData: DataSource
    let geomAes = spec.aes

    // Annotations have their data in params, not in spec.data
    if (geom.params.annotation) {
      geomData = synthesizeAnnotationData(geom, scales)
      // Use annotation-specific aes mapping that maps to synthesized fields
      geomAes = {
        x: 'x',
        y: 'y',
        label: 'label',
        xend: 'xend',
        yend: 'yend',
        xmin: 'xmin',
        xmax: 'xmax',
        ymin: 'ymin',
        ymax: 'ymax',
        color: geomData[0]?.color !== undefined ? 'color' : undefined,
        fill: geomData[0]?.fill !== undefined ? 'fill' : undefined,
      }
    } else {
      // Apply statistical transformation if needed
      geomData = applyStatTransform(spec.data, geom, spec.aes)

      // Update geomAes for stat-transformed data that uses different field names
      if (geom.stat === 'bin' || geom.stat === 'boxplot' || geom.stat === 'count' || geom.stat === 'qq') {
        geomAes = { ...spec.aes, x: 'x', y: 'y' }
      } else if (geom.stat === 'qq_line') {
        // Q-Q line uses segment format with endpoints
        geomAes = { ...spec.aes, x: 'x', y: 'y', xend: 'xend', yend: 'yend' }
      } else if (geom.stat === 'bin2d') {
        // bin2d outputs x, y (centers), fill (count), width, height
        geomAes = { ...spec.aes, x: 'x', y: 'y', fill: 'fill' }
      } else if (geom.stat === 'density_2d') {
        // density_2d outputs x, y (grid points), z (density)
        geomAes = { ...spec.aes, x: 'x', y: 'y' }
      } else if (geom.stat === 'xdensity') {
        // xdensity outputs x (positions), y (groups), density, scaled
        geomAes = { ...spec.aes, x: 'x', y: 'y' }
      } else if (geom.stat === 'beeswarm') {
        // beeswarm outputs x (groupIndex + offset), y (original y values)
        geomAes = { ...spec.aes, x: 'x', y: 'y' }
      }

      // Apply coordinate transformation (flip, polar, trans, etc.)
      geomData = applyCoordTransform(geomData, geomAes, spec.coord)
    }

    renderGeom(geomData, geom, geomAes, scales, canvas, spec.coord.type)
  }

  // Render legend if needed (supports multiple aesthetics)
  if (layout.legendArea) {
    const legendEntries: LegendEntry[] = []

    // Add color legend entry if color aesthetic is mapped
    if (scales.color) {
      legendEntries.push({
        aesthetic: 'color',
        type: scales.color.type,
        title: spec.labels.color,
        domain: scales.color.domain,
        map: (v) => scales.color!.map(v),
      })
    }

    // Add size legend entry if size aesthetic is mapped
    if (scales.size) {
      legendEntries.push({
        aesthetic: 'size',
        type: 'continuous',
        title: spec.labels.size,
        domain: scales.size.domain,
        map: (v) => scales.size!.map(v),
      })
    }

    // Render all legends
    if (legendEntries.length > 0) {
      renderMultiLegend(
        canvas,
        legendEntries,
        layout.legendArea.x,
        layout.legendArea.y,
        spec.theme,
        layout.legendArea.width
      )
    }
  }

  return canvas
}

/**
 * Synthesize data from annotation params
 * Annotations store their coordinates in geom.params rather than in the data array
 */
function synthesizeAnnotationData(geom: Geom, scales: ScaleContext): DataSource {
  const params = geom.params

  // Helper to resolve 'Inf' / '-Inf' edge positions
  const resolveInf = (
    value: unknown,
    domain: readonly unknown[]
  ): unknown => {
    if (value === 'Inf') return domain[1]
    if (value === '-Inf') return domain[0]
    return value
  }

  // Get domains for edge resolution
  const xDomain = scales.x?.domain ?? [0, 1]
  const yDomain = scales.y?.domain ?? [0, 1]

  // Build data row from params
  const row: Record<string, unknown> = {}

  // Copy coordinate params with Inf resolution
  if (params.x !== undefined) row.x = resolveInf(params.x, xDomain)
  if (params.y !== undefined) row.y = resolveInf(params.y, yDomain)
  if (params.xend !== undefined) row.xend = resolveInf(params.xend, xDomain)
  if (params.yend !== undefined) row.yend = resolveInf(params.yend, yDomain)
  if (params.xmin !== undefined) row.xmin = resolveInf(params.xmin, xDomain)
  if (params.xmax !== undefined) row.xmax = resolveInf(params.xmax, xDomain)
  if (params.ymin !== undefined) row.ymin = resolveInf(params.ymin, yDomain)
  if (params.ymax !== undefined) row.ymax = resolveInf(params.ymax, yDomain)
  if (params.label !== undefined) row.label = params.label

  // Copy styling params for color mapping
  if (params.color !== undefined) row.color = params.color
  if (params.fill !== undefined) row.fill = params.fill

  return [row]
}

/**
 * Parse hex color to RGBA
 */
function parseHexColor(hex: string): RGBA {
  if (!hex || hex.length < 4) return { r: 200, g: 200, b: 200, a: 1 }
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const r = parseInt(h.slice(0, 2), 16) || 200
  const g = parseInt(h.slice(2, 4), 16) || 200
  const b = parseInt(h.slice(4, 6), 16) || 200
  return { r, g, b, a: 1 }
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
  const hasLegend = spec.theme.legend.position !== 'none' && (!!spec.aes.color || !!spec.aes.size)
  const legendPosition = spec.theme.legend.position

  // Determine if grid facet with row/col variables
  const isGrid = facet.type === 'grid'
  const vars = isGrid ? facet.vars as { rows?: string; cols?: string } : null
  const hasRowVar = isGrid && !!vars?.rows
  const hasColVar = isGrid && !!vars?.cols

  // Calculate margins (account for row strips on right for grid)
  const margins = {
    top: hasTitle ? 2 : 1,
    right: hasLegend && legendPosition === 'right' ? 15 : (hasRowVar ? 1 : 1),
    bottom: 3 + (hasLegend && legendPosition === 'bottom' ? 2 : 0),  // Space for x-axis label + legend
    left: 10,   // Space for y-axis
  }

  // Calculate panel layouts with grid options
  const panelLayouts = calculatePanelLayouts(width, height, nrow, ncol, hasTitle, margins, {
    isGrid,
    hasRowVar,
    hasColVar,
  })

  // Compute shared scales if needed
  const sharedScales = computeSharedScales(panels, spec, facet)

  // Get labeller function
  const labeller: Labeller = facet.labeller ?? label_value

  // Get strip color from theme
  const stripColor = parseHexColor(spec.theme.facet?.strip?.text ?? '#c8c8c8')

  // For grid facets, render column strips at top and row strips on right
  if (isGrid && (hasRowVar || hasColVar)) {
    const gridStripLayout = calculateGridStripLayout(
      width, height, nrow, ncol, hasTitle, margins, hasRowVar, hasColVar
    )

    // Get unique row and column values from panels
    const rowValues: string[] = []
    const colValues: string[] = []
    for (const panel of panels) {
      if (panel.rowValue && !rowValues.includes(panel.rowValue)) {
        rowValues.push(panel.rowValue)
      }
      if (panel.colValue && !colValues.includes(panel.colValue)) {
        colValues.push(panel.colValue)
      }
    }

    // Render column strips at top
    if (hasColVar && colValues.length > 0) {
      for (let c = 0; c < colValues.length; c++) {
        const labelText = labeller(colValues[c], vars?.cols)
        const maxWidth = gridStripLayout.colStripWidth
        const displayText = labelText.length > maxWidth
          ? labelText.substring(0, maxWidth - 1) + '…'
          : labelText
        const x = gridStripLayout.colStripX[c] + Math.floor((maxWidth - displayText.length) / 2)
        canvas.drawString(Math.max(0, x), gridStripLayout.colStripY, displayText, stripColor)
      }
    }

    // Render row strips on right
    if (hasRowVar && rowValues.length > 0) {
      for (let r = 0; r < rowValues.length; r++) {
        const labelText = labeller(rowValues[r], vars?.rows)
        const maxWidth = gridStripLayout.rowStripWidth
        const displayText = labelText.length > maxWidth
          ? labelText.substring(0, maxWidth - 1) + '…'
          : labelText
        const x = gridStripLayout.rowStripX
        canvas.drawString(x, gridStripLayout.rowStripY[r], displayText, stripColor)
      }
    }
  }

  // Render each panel
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i]
    const layout = panelLayouts[i]

    if (!layout) continue

    renderPanel(canvas, panel, layout, spec, facet, sharedScales, nrow, ncol, labeller)
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

  // Render legend if needed (supports multiple aesthetics)
  if (hasLegend) {
    const legendEntries: LegendEntry[] = []

    // Add color legend entry if color aesthetic is mapped
    if (sharedScales.color) {
      legendEntries.push({
        aesthetic: 'color',
        type: sharedScales.color.type,
        title: spec.labels.color,
        domain: sharedScales.color.domain,
        map: (v) => sharedScales.color!.map(v),
      })
    }

    // Add size legend entry if size aesthetic is mapped
    // Build size scale from all data
    if (spec.aes.size) {
      const { inferContinuousDomain, createResolvedSizeScale } = require('./scales')
      const allData: DataSource = []
      for (const panel of panels) {
        allData.push(...panel.data)
      }
      const sizeDomain = inferContinuousDomain(allData, spec.aes.size)
      const sizeScale = createResolvedSizeScale(sizeDomain)
      legendEntries.push({
        aesthetic: 'size',
        type: 'continuous',
        title: spec.labels.size,
        domain: sizeDomain,
        map: (v) => sizeScale.map(v),
      })
    }

    // Render all legends
    if (legendEntries.length > 0) {
      const legendPosition = spec.theme.legend.position

      if (legendPosition === 'bottom') {
        renderMultiLegend(
          canvas,
          legendEntries,
          margins.left,
          height - 2,
          spec.theme,
          width - margins.left - margins.right
        )
      } else {
        renderMultiLegend(
          canvas,
          legendEntries,
          width - margins.right + 1,
          margins.top,
          spec.theme,
          margins.right - 1
        )
      }
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
  sharedScales: Partial<ScaleContext>,
  nrow: number = 1,
  ncol: number = 1,
  labeller?: Labeller
): void {
  const stripColor = parseHexColor(spec.theme.facet?.strip?.text ?? '#c8c8c8')

  // For wrap facets, draw strip label above each panel
  // For grid facets, strips are rendered separately at top/right
  if (facet.type === 'wrap') {
    const labelFn = labeller ?? label_value
    const labelText = labelFn(panel.label, facet.vars as string)
    const displayText = labelText.length > layout.width - 2
      ? labelText.substring(0, layout.width - 3) + '…'
      : labelText
    const labelX = layout.x + Math.floor((layout.width - displayText.length) / 2)
    canvas.drawString(labelX, layout.labelY, displayText, stripColor)
  }

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

  // Apply coordinate transformation to scale data
  scaleData = applyCoordTransform(scaleData, scaleAes, spec.coord)

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
  // Only render tick labels on outer panels to reduce clutter
  renderPanelAxes(canvas, scales, plotArea, panel.row, panel.col, nrow, ncol, spec.theme)

  // Render geometry layers
  for (const geom of spec.geoms) {
    let geomData = applyStatTransform(panel.data, geom, spec.aes)
    let geomAes = spec.aes
    // Update geomAes for stat-transformed data
    if (geom.stat === 'bin' || geom.stat === 'boxplot' || geom.stat === 'count' || geom.stat === 'qq') {
      geomAes = { ...spec.aes, x: 'x', y: 'y' }
    } else if (geom.stat === 'bin2d') {
      geomAes = { ...spec.aes, x: 'x', y: 'y', fill: 'fill' }
    }
    // Apply coordinate transformation
    geomData = applyCoordTransform(geomData, geomAes, spec.coord)
    renderGeom(geomData, geom, geomAes, scales, canvas, spec.coord.type)
  }
}

/**
 * Render axes for a facet panel (simplified version)
 * Only renders tick labels on outer panels to reduce visual clutter
 */
function renderPanelAxes(
  canvas: TerminalCanvas,
  scales: ScaleContext,
  plotArea: { x: number; y: number; width: number; height: number },
  row: number,
  col: number,
  nrow: number,
  _ncol: number,
  _theme: any
): void {
  const axisColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  // Determine if this is an outer panel
  const isBottomRow = row === nrow - 1
  const isLeftCol = col === 0

  // Bottom axis line (always draw)
  canvas.drawHLine(plotArea.x, plotArea.y + plotArea.height, plotArea.width, '─', axisColor)

  // Left axis line (always draw)
  canvas.drawVLine(plotArea.x - 1, plotArea.y, plotArea.height, '│', axisColor)

  // Corner
  canvas.drawChar(plotArea.x - 1, plotArea.y + plotArea.height, '└', axisColor)

  // X-axis ticks and labels (only on bottom row)
  if (scales.x.type === 'continuous') {
    const domain = scales.x.domain as [number, number]
    const ticks = calculateTicks(domain, Math.max(2, Math.floor(plotArea.width / 10)))

    for (const tickValue of ticks) {
      const x = Math.round(scales.x.map(tickValue))
      if (x >= plotArea.x && x < plotArea.x + plotArea.width) {
        // Always draw tick marks
        canvas.drawChar(x, plotArea.y + plotArea.height, '┬', axisColor)
        // Only draw labels on bottom row
        if (isBottomRow) {
          const tickLabel = formatTick(tickValue)
          const labelX = x - Math.floor(tickLabel.length / 2)
          canvas.drawString(Math.max(plotArea.x, labelX), plotArea.y + plotArea.height + 1, tickLabel, axisColor)
        }
      }
    }
  }

  // Y-axis ticks and labels (only on left column)
  if (scales.y.type === 'continuous') {
    const domain = scales.y.domain as [number, number]
    const ticks = calculateTicks(domain, Math.max(2, Math.floor(plotArea.height / 4)))

    for (const tickValue of ticks) {
      const y = Math.round(scales.y.map(tickValue))
      if (y >= plotArea.y && y < plotArea.y + plotArea.height) {
        // Always draw tick marks
        canvas.drawChar(plotArea.x - 1, y, '┤', axisColor)
        // Only draw labels on left column
        if (isLeftCol) {
          const tickLabel = formatTick(tickValue)
          const labelX = plotArea.x - tickLabel.length - 2
          canvas.drawString(Math.max(0, labelX), y, tickLabel, axisColor)
        }
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
