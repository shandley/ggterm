/**
 * Geometry rendering to canvas
 *
 * Each geometry renderer takes data, scales, and canvas, and draws the visual marks.
 */

import type { TerminalCanvas } from '../canvas/canvas'
import type { AestheticMapping, DataSource, Geom, RGBA } from '../types'
import type { ScaleContext, ResolvedColorScale } from './scales'
import { DEFAULT_POINT_COLOR } from './scales'
import { applyPositionAdjustment, getPositionType, type AdjustedPoint } from '../positions'

/**
 * Point shapes for scatter plots
 */
const POINT_SHAPES: Record<string, string> = {
  circle: '●',
  filled_circle: '●',
  open_circle: '○',
  square: '■',
  open_square: '□',
  diamond: '◆',
  open_diamond: '◇',
  triangle: '▲',
  open_triangle: '△',
  cross: '✕',
  plus: '+',
  star: '★',
  dot: '•',
}

/**
 * Size-based point characters (smallest to largest)
 */
const SIZE_CHARS: string[] = ['·', '•', '●', '⬤']

/**
 * Get point shape character
 */
function getPointShape(shape?: string): string {
  if (!shape) return POINT_SHAPES.circle
  return POINT_SHAPES[shape] ?? shape.charAt(0)
}

/**
 * Get color for a data point
 */
function getPointColor(
  row: Record<string, unknown>,
  aes: AestheticMapping,
  colorScale?: ResolvedColorScale
): RGBA {
  if (colorScale && aes.color) {
    const value = row[aes.color]
    return colorScale.map(value)
  }
  return DEFAULT_POINT_COLOR
}

/**
 * Render geom_point
 */
export function renderGeomPoint(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const defaultShape = getPointShape(geom.params.shape as string | undefined)

  // Apply position adjustment (supports jitter, dodge, etc.)
  const positionType = getPositionType(geom.position)
  const adjustedData = positionType !== 'identity'
    ? applyPositionAdjustment(data, aes, geom.position || 'identity')
    : null

  // Use adjusted data if position was applied, otherwise use original
  const dataToRender = adjustedData || data.map(row => ({
    row,
    x: Number(row[aes.x]) || 0,
    y: Number(row[aes.y]) || 0,
    xOriginal: Number(row[aes.x]) || 0,
    yOriginal: Number(row[aes.y]) || 0,
  }))

  for (const point of dataToRender) {
    const { row, x, y } = point

    // Skip missing data
    if (x === null || x === undefined || y === null || y === undefined) {
      continue
    }

    // Map to canvas coordinates
    const cx = scales.x.map(x)
    const cy = scales.y.map(y)

    // Get color
    const color = getPointColor(row, aes, scales.color)

    // Determine point character based on size aesthetic
    let shape = defaultShape
    if (aes.size && scales.size) {
      const sizeVal = row[aes.size]
      if (sizeVal !== null && sizeVal !== undefined) {
        const sizeIndex = scales.size.map(sizeVal)
        shape = SIZE_CHARS[sizeIndex] ?? defaultShape
      }
    }

    // Draw the point
    canvas.drawPoint(Math.round(cx), Math.round(cy), color, shape)
  }
}

/**
 * Render geom_line
 */
export function renderGeomLine(
  data: DataSource,
  _geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  // Sort data by x value for proper line drawing
  const sorted = [...data].sort((a, b) => {
    const ax = Number(a[aes.x]) || 0
    const bx = Number(b[aes.x]) || 0
    return ax - bx
  })

  // Group by color/group aesthetic if present
  const groups = new Map<string, typeof sorted>()
  const groupField = aes.group || aes.color

  if (groupField) {
    for (const row of sorted) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', sorted)
  }

  // Draw lines for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    const color = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR

    // Draw line segments between consecutive points
    for (let i = 0; i < groupData.length - 1; i++) {
      const row1 = groupData[i]
      const row2 = groupData[i + 1]

      const x1 = Math.round(scales.x.map(row1[aes.x]))
      const y1 = Math.round(scales.y.map(row1[aes.y]))
      const x2 = Math.round(scales.x.map(row2[aes.x]))
      const y2 = Math.round(scales.y.map(row2[aes.y]))

      drawLine(canvas, x1, y1, x2, y2, color)
    }
  }
}

/**
 * Render geom_path (ordered path, not sorted by x)
 *
 * Unlike geom_line which sorts by x, geom_path connects points
 * in the order they appear in the data. Useful for trajectories,
 * drawing shapes, and non-monotonic sequences.
 */
export function renderGeomPath(
  data: DataSource,
  _geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  // DO NOT sort - preserve data order (key difference from geom_line)

  // Group by color/group aesthetic if present
  // We need to preserve order within groups, so we use an array of entries
  const groups = new Map<string, DataSource>()
  const groupField = aes.group || aes.color

  if (groupField) {
    for (const row of data) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', [...data])
  }

  // Draw paths for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    const color = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR

    // Draw line segments between consecutive points (in data order)
    for (let i = 0; i < groupData.length - 1; i++) {
      const row1 = groupData[i]
      const row2 = groupData[i + 1]

      const x1 = Math.round(scales.x.map(row1[aes.x]))
      const y1 = Math.round(scales.y.map(row1[aes.y]))
      const x2 = Math.round(scales.x.map(row2[aes.x]))
      const y2 = Math.round(scales.y.map(row2[aes.y]))

      drawLine(canvas, x1, y1, x2, y2, color)
    }
  }
}

/**
 * Render geom_rug (marginal rug marks along axes)
 *
 * Draws tick marks at data positions along the plot edges to show
 * marginal distributions.
 */
export function renderGeomRug(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const sides = (geom.params.sides as string) ?? 'bl'
  const length = (geom.params.length as number) ?? 1
  const outside = (geom.params.outside as boolean) ?? true

  // Get plot boundaries
  const xRange = scales.x.range as [number, number]
  const yRange = scales.y.range as [number, number]
  const plotLeft = Math.round(Math.min(xRange[0], xRange[1]))
  const plotRight = Math.round(Math.max(xRange[0], xRange[1]))
  const plotTop = Math.round(Math.min(yRange[0], yRange[1]))
  const plotBottom = Math.round(Math.max(yRange[0], yRange[1]))

  // Determine which sides to draw
  const drawBottom = sides.includes('b')
  const drawTop = sides.includes('t')
  const drawLeft = sides.includes('l')
  const drawRight = sides.includes('r')

  // Draw rug marks for each data point
  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    // Get color for this point
    const color = getPointColor(row, aes, scales.color)

    // X-axis rugs (bottom and/or top)
    if (xVal !== null && xVal !== undefined) {
      const cx = Math.round(scales.x.map(xVal))

      // Only draw if within x bounds
      if (cx >= plotLeft && cx <= plotRight) {
        if (drawBottom) {
          // Draw tick at bottom edge
          const startY = outside ? plotBottom + 1 : plotBottom
          const endY = startY + length - 1
          for (let y = startY; y <= endY; y++) {
            canvas.drawChar(cx, y, '│', color)
          }
        }

        if (drawTop) {
          // Draw tick at top edge
          const startY = outside ? plotTop - length : plotTop
          const endY = outside ? plotTop - 1 : plotTop + length - 1
          for (let y = startY; y <= endY; y++) {
            canvas.drawChar(cx, y, '│', color)
          }
        }
      }
    }

    // Y-axis rugs (left and/or right)
    if (yVal !== null && yVal !== undefined) {
      const cy = Math.round(scales.y.map(yVal))

      // Only draw if within y bounds
      if (cy >= plotTop && cy <= plotBottom) {
        if (drawLeft) {
          // Draw tick at left edge
          const startX = outside ? plotLeft - length : plotLeft
          const endX = outside ? plotLeft - 1 : plotLeft + length - 1
          for (let x = startX; x <= endX; x++) {
            canvas.drawChar(x, cy, '─', color)
          }
        }

        if (drawRight) {
          // Draw tick at right edge
          const startX = outside ? plotRight + 1 : plotRight
          const endX = startX + length - 1
          for (let x = startX; x <= endX; x++) {
            canvas.drawChar(x, cy, '─', color)
          }
        }
      }
    }
  }
}

/**
 * Render geom_step (stairstep lines)
 *
 * Draws lines that only move horizontally or vertically, creating
 * a stairstep pattern. Useful for time series with discrete changes.
 */
export function renderGeomStep(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  const direction = (geom.params.direction as string) ?? 'hv'

  // Sort data by x value for proper step drawing
  const sorted = [...data].sort((a, b) => {
    const ax = Number(a[aes.x]) || 0
    const bx = Number(b[aes.x]) || 0
    return ax - bx
  })

  // Group by color/group aesthetic if present
  const groups = new Map<string, typeof sorted>()
  const groupField = aes.group || aes.color

  if (groupField) {
    for (const row of sorted) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', sorted)
  }

  // Draw steps for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    const color = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR

    // Draw step segments between consecutive points
    for (let i = 0; i < groupData.length - 1; i++) {
      const row1 = groupData[i]
      const row2 = groupData[i + 1]

      const x1 = Math.round(scales.x.map(row1[aes.x]))
      const y1 = Math.round(scales.y.map(row1[aes.y]))
      const x2 = Math.round(scales.x.map(row2[aes.x]))
      const y2 = Math.round(scales.y.map(row2[aes.y]))

      if (direction === 'hv') {
        // Horizontal first, then vertical
        // Draw horizontal line from (x1, y1) to (x2, y1)
        drawLine(canvas, x1, y1, x2, y1, color)
        // Draw vertical line from (x2, y1) to (x2, y2)
        drawLine(canvas, x2, y1, x2, y2, color)
      } else if (direction === 'vh') {
        // Vertical first, then horizontal
        // Draw vertical line from (x1, y1) to (x1, y2)
        drawLine(canvas, x1, y1, x1, y2, color)
        // Draw horizontal line from (x1, y2) to (x2, y2)
        drawLine(canvas, x1, y2, x2, y2, color)
      } else if (direction === 'mid') {
        // Step at midpoint
        const xMid = Math.round((x1 + x2) / 2)
        // Draw horizontal from (x1, y1) to (xMid, y1)
        drawLine(canvas, x1, y1, xMid, y1, color)
        // Draw vertical from (xMid, y1) to (xMid, y2)
        drawLine(canvas, xMid, y1, xMid, y2, color)
        // Draw horizontal from (xMid, y2) to (x2, y2)
        drawLine(canvas, xMid, y2, x2, y2, color)
      }
    }
  }
}

/**
 * Render geom_area (filled area under line)
 */
export function renderGeomArea(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  // Sort data by x value
  const sorted = [...data].sort((a, b) => {
    const ax = Number(a[aes.x]) || 0
    const bx = Number(b[aes.x]) || 0
    return ax - bx
  })

  // Group by color/group aesthetic if present
  const groups = new Map<string, typeof sorted>()
  const groupField = aes.group || aes.color

  if (groupField) {
    for (const row of sorted) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', sorted)
  }

  // Get baseline (y=0 mapped to canvas, or bottom of plot area)
  const plotBottom = Math.round(scales.y.range[0])
  const plotTop = Math.round(scales.y.range[1])
  let baseline = Math.round(scales.y.map(0))
  baseline = Math.max(plotTop, Math.min(plotBottom, baseline))

  // Area fill character - use a lighter shade for fill
  const fillChar = geom.params.fillChar as string ?? '░'
  const alpha = geom.params.alpha as number ?? 0.5

  // Draw filled area for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    let baseColor = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR
    // Apply alpha by reducing color intensity
    const fillColor: RGBA = {
      r: Math.round(baseColor.r * alpha),
      g: Math.round(baseColor.g * alpha),
      b: Math.round(baseColor.b * alpha),
      a: baseColor.a,
    }

    // For each x position, fill from baseline to the y value
    for (let i = 0; i < groupData.length - 1; i++) {
      const row1 = groupData[i]
      const row2 = groupData[i + 1]

      const x1 = Math.round(scales.x.map(row1[aes.x]))
      const y1 = Math.round(scales.y.map(row1[aes.y]))
      const x2 = Math.round(scales.x.map(row2[aes.x]))
      const y2 = Math.round(scales.y.map(row2[aes.y]))

      // Fill columns between x1 and x2
      for (let x = x1; x <= x2; x++) {
        // Interpolate y value at this x position
        const t = x2 !== x1 ? (x - x1) / (x2 - x1) : 0
        const yInterp = Math.round(y1 + (y2 - y1) * t)

        // Fill from yInterp to baseline
        const top = Math.min(yInterp, baseline)
        const bottom = Math.max(yInterp, baseline)

        for (let y = top; y <= bottom; y++) {
          if (y >= plotTop && y <= plotBottom) {
            canvas.drawChar(x, y, fillChar, fillColor)
          }
        }
      }
    }

    // Draw the top edge line with full color
    for (let i = 0; i < groupData.length - 1; i++) {
      const row1 = groupData[i]
      const row2 = groupData[i + 1]

      const x1 = Math.round(scales.x.map(row1[aes.x]))
      const y1 = Math.round(scales.y.map(row1[aes.y]))
      const x2 = Math.round(scales.x.map(row2[aes.x]))
      const y2 = Math.round(scales.y.map(row2[aes.y]))

      drawLine(canvas, x1, y1, x2, y2, baseColor, '▄')
    }
  }
}

/**
 * Draw a line using Bresenham's algorithm
 */
function drawLine(
  canvas: TerminalCanvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: RGBA,
  char = '·'
): void {
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  let err = dx - dy

  let x = x1
  let y = y1

  while (true) {
    canvas.drawChar(x, y, char, color)

    if (x === x2 && y === y2) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * Render geom_bar (vertical bars, or horizontal when coord_flip)
 */
export function renderGeomBar(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas,
  coordType?: string
): void {
  const isFlipped = coordType === 'flip'

  // Get plot area boundaries from scale range
  // y range is [bottom, top] (inverted for canvas coordinates)
  const plotBottom = Math.round(scales.y.range[0])
  const plotTop = Math.round(scales.y.range[1])
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])

  // Calculate base bar width
  let baseBarWidth: number
  const widthParam = geom.params.width as number | undefined

  if (scales.x.type === 'discrete') {
    // For discrete scales, calculate width based on available space
    const domain = scales.x.domain as string[]
    const plotWidth = scales.x.range[1] - scales.x.range[0]
    const spacePerCategory = plotWidth / domain.length

    if (widthParam !== undefined && widthParam >= 1) {
      // Absolute width specified
      baseBarWidth = Math.max(1, Math.floor(widthParam))
    } else {
      // Proportional width (default 0.9 = 90% of space)
      const proportion = widthParam ?? 0.9
      baseBarWidth = Math.max(1, Math.floor(spacePerCategory * proportion))
    }
  } else {
    // Continuous scale - use specified width or default to 1
    baseBarWidth = Math.max(1, Math.floor(widthParam ?? 1))
  }

  // Get position type from geom
  const positionType = getPositionType(geom.position)

  // Apply position adjustment
  const adjustedData = applyPositionAdjustment(
    data,
    aes,
    geom.position || 'stack',
    widthParam ?? 0.9
  )

  // For dodge position, calculate per-bar width
  let actualBarWidth = baseBarWidth
  if (positionType === 'dodge') {
    // Find number of groups to divide bar width
    const groups = new Set<string>()
    for (const point of adjustedData) {
      if (point.group) groups.add(point.group)
    }
    const nGroups = Math.max(1, groups.size)
    actualBarWidth = Math.max(1, Math.floor(baseBarWidth / nGroups))
  }

  for (const point of adjustedData) {
    const { row, x, y, ymin, ymax } = point

    // Skip missing data
    if (x === null || x === undefined || y === null || y === undefined) {
      continue
    }

    // Map to canvas coordinates
    // For dodge position, x is already adjusted in data space
    const cx = Math.round(scales.x.map(positionType === 'dodge' ? point.xOriginal : x))

    // For dodge position, calculate the offset in canvas space
    let xOffset = 0
    if (positionType === 'dodge' && point.xOriginal !== x) {
      // Calculate pixel offset from the adjusted position
      const originalPx = scales.x.map(point.xOriginal)
      const adjustedPx = scales.x.map(x)
      // Scale the data-space offset to pixel-space proportionally
      // For discrete scales, this approximation works reasonably well
      const dataRange = (scales.x.domain as any)[1] - (scales.x.domain as any)[0] || 1
      const pixelRange = scales.x.range[1] - scales.x.range[0]
      xOffset = Math.round((x - point.xOriginal) * pixelRange / Math.max(1, dataRange))
    }

    // For stack/fill, use ymin/ymax; otherwise use baseline
    let top: number
    let bottom: number

    if (ymin !== undefined && ymax !== undefined) {
      // Stacked bars: draw from ymin to ymax
      top = Math.round(scales.y.map(ymax))
      bottom = Math.round(scales.y.map(ymin))
      // Clamp to plot area
      top = Math.max(plotTop, Math.min(plotBottom, top))
      bottom = Math.max(plotTop, Math.min(plotBottom, bottom))
    } else {
      // Regular bars: draw from baseline to value
      const cy = Math.round(scales.y.map(y))
      let baseline = Math.round(scales.y.map(0))
      baseline = Math.max(plotTop, Math.min(plotBottom, baseline))
      top = Math.max(plotTop, Math.min(cy, baseline))
      bottom = Math.min(plotBottom, Math.max(cy, baseline))
    }

    const color = getPointColor(row, aes, scales.color)

    // Use per-point width if available (from dodge), otherwise use calculated width
    const barWidth = point.width
      ? Math.max(1, Math.floor(point.width * baseBarWidth / (widthParam ?? 0.9)))
      : actualBarWidth

    if (isFlipped) {
      // For flipped coordinates, draw horizontal bars
      // x now contains the value (bar length), y contains the category
      const cy = Math.round(scales.y.map(positionType === 'dodge' ? point.yOriginal ?? y : y))
      let baseline = Math.round(scales.x.map(0))
      baseline = Math.max(plotLeft, Math.min(plotRight, baseline))
      const barEnd = Math.round(scales.x.map(x))
      const left = Math.min(baseline, barEnd)
      const right = Math.max(baseline, barEnd)

      // Draw horizontal bar
      for (let xPos = left; xPos <= right; xPos++) {
        for (let dy = 0; dy < barWidth; dy++) {
          const yPos = cy + dy - Math.floor(barWidth / 2)
          if (yPos >= plotTop && yPos <= plotBottom && xPos >= plotLeft && xPos <= plotRight) {
            canvas.drawChar(xPos, yPos, '█', color)
          }
        }
      }
    } else {
      // Draw vertical bar (default)
      for (let yPos = top; yPos <= bottom; yPos++) {
        for (let dx = 0; dx < barWidth; dx++) {
          const xPos = cx + xOffset + dx - Math.floor(barWidth / 2)
          // Only draw within plot boundaries
          if (xPos >= plotLeft && xPos <= plotRight) {
            canvas.drawChar(xPos, yPos, '█', color)
          }
        }
      }
    }
  }
}

/**
 * Render geom_text
 */
export function renderGeomText(
  data: DataSource,
  _geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]
    const label = aes.label ? String(row[aes.label] ?? '') : ''

    if (!label || xVal === null || xVal === undefined) continue

    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    const color = getPointColor(row, aes, scales.color)

    // Center the text on the point
    const offsetX = -Math.floor(label.length / 2)
    canvas.drawString(cx + offsetX, cy, label, color)
  }
}

/**
 * Render geom_hline (horizontal reference line)
 */
export function renderGeomHLine(
  _data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const yintercept = geom.params.yintercept as number
  if (yintercept === undefined) return

  const cy = Math.round(scales.y.map(yintercept))
  const color = (geom.params.color as RGBA) ?? { r: 128, g: 128, b: 128, a: 1 }

  const startX = Math.round(scales.x.range[0])
  const endX = Math.round(scales.x.range[1])

  canvas.drawHLine(startX, cy, endX - startX + 1, '─', color)
}

/**
 * Render geom_vline (vertical reference line)
 */
export function renderGeomVLine(
  _data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const xintercept = geom.params.xintercept as number
  if (xintercept === undefined) return

  const cx = Math.round(scales.x.map(xintercept))
  const color = (geom.params.color as RGBA) ?? { r: 128, g: 128, b: 128, a: 1 }

  const startY = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const endY = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  canvas.drawVLine(cx, startY, endY - startY + 1, '│', color)
}

/**
 * Render geom_histogram (binned bar chart)
 * Data should be pre-transformed by stat_bin
 */
export function renderGeomHistogram(
  data: DataSource,
  _geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  // Get plot area boundaries
  const plotBottom = Math.round(scales.y.range[0])
  const plotTop = Math.round(scales.y.range[1])

  // Calculate baseline (y=0), clamped to plot area
  let baseline = Math.round(scales.y.map(0))
  baseline = Math.max(plotTop, Math.min(plotBottom, baseline))

  const color = DEFAULT_POINT_COLOR

  for (const row of data) {
    const xmin = row.xmin as number
    const xmax = row.xmax as number
    const count = row.count as number ?? row.y as number

    if (count === 0) continue

    // Map x edges to canvas coordinates
    const x1 = Math.round(scales.x.map(xmin))
    const x2 = Math.round(scales.x.map(xmax))
    const cy = Math.round(scales.y.map(count))

    // Draw bar from baseline to count
    const top = Math.max(plotTop, Math.min(cy, baseline))
    const bottom = Math.min(plotBottom, Math.max(cy, baseline))

    for (let y = top; y <= bottom; y++) {
      for (let x = x1; x < x2; x++) {
        canvas.drawChar(x, y, '█', color)
      }
    }
  }
}

/**
 * Render geom_freqpoly (frequency polygon)
 * Like histogram but connects bin midpoints with lines
 * Data should be pre-transformed by stat_bin
 */
export function renderGeomFreqpoly(
  data: DataSource,
  _geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Group by color aesthetic if present
  const groups = new Map<string, DataSource[number][]>()
  const groupField = aes.group || aes.color

  if (groupField) {
    for (const row of data) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', data as DataSource[number][])
  }

  // Draw lines for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    // Sort by x (bin center)
    const sorted = [...groupData].sort((a, b) => {
      const ax = Number(a.x) || 0
      const bx = Number(b.x) || 0
      return ax - bx
    })

    const color = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR

    // Draw line segments between consecutive bin centers
    for (let i = 0; i < sorted.length - 1; i++) {
      const row1 = sorted[i]
      const row2 = sorted[i + 1]

      const x1 = Math.round(scales.x.map(row1.x as number))
      const y1 = Math.round(scales.y.map(row1.y as number ?? row1.count as number))
      const x2 = Math.round(scales.x.map(row2.x as number))
      const y2 = Math.round(scales.y.map(row2.y as number ?? row2.count as number))

      // Clip line to plot area
      if (x1 >= plotLeft && x1 <= plotRight && x2 >= plotLeft && x2 <= plotRight &&
          y1 >= plotTop && y1 <= plotBottom && y2 >= plotTop && y2 <= plotBottom) {
        drawLine(canvas, x1, y1, x2, y2, color)
      }
    }
  }
}

/**
 * Render geom_boxplot
 * Data should be pre-transformed by stat_boxplot
 */
export function renderGeomBoxplot(
  data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  // Calculate box width based on available space
  // If x is discrete, calculate spacing between categories
  const widthFactor = geom.params.width as number ?? 0.75
  let boxWidth: number

  if (scales.x.type === 'discrete') {
    const domain = scales.x.domain as string[]
    const plotWidth = Math.abs(scales.x.range[1] - scales.x.range[0])
    const spacing = plotWidth / Math.max(1, domain.length)
    boxWidth = Math.max(3, Math.floor(spacing * widthFactor))
  } else {
    // For continuous x, use a reasonable default
    boxWidth = Math.max(3, Math.floor((geom.params.width as number ?? 5)))
  }

  const showOutliers = geom.params.outliers !== false

  const boxColor: RGBA = { r: 79, g: 169, b: 238, a: 1 }
  const whiskerColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }
  const medianColor: RGBA = { r: 255, g: 200, b: 50, a: 1 }
  const outlierColor: RGBA = { r: 214, g: 39, b: 40, a: 1 }

  // Get plot area boundaries for clipping
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Helper to draw a character only if within plot bounds
  const drawClipped = (x: number, y: number, char: string, color: RGBA) => {
    if (x >= plotLeft && x <= plotRight && y >= plotTop && y <= plotBottom) {
      canvas.drawChar(x, y, char, color)
    }
  }

  for (const row of data) {
    const x = row.x
    const lower = row.lower as number
    const q1 = row.q1 as number
    const median = row.median as number
    const q3 = row.q3 as number
    const upper = row.upper as number
    const outliers = row.outliers as number[] ?? []

    // Map x to canvas coordinate
    const cx = Math.round(scales.x.map(x))

    // Map y values to canvas coordinates
    const yLower = Math.round(scales.y.map(lower))
    const yQ1 = Math.round(scales.y.map(q1))
    const yMedian = Math.round(scales.y.map(median))
    const yQ3 = Math.round(scales.y.map(q3))
    const yUpper = Math.round(scales.y.map(upper))

    const halfWidth = Math.floor(boxWidth / 2)

    // Draw lower whisker (vertical line from lower to Q1)
    for (let y = yQ1; y <= yLower; y++) {
      drawClipped(cx, y, '│', whiskerColor)
    }
    // Lower whisker cap
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      drawClipped(cx + dx, yLower, '─', whiskerColor)
    }

    // Draw upper whisker (vertical line from Q3 to upper)
    for (let y = yUpper; y <= yQ3; y++) {
      drawClipped(cx, y, '│', whiskerColor)
    }
    // Upper whisker cap
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      drawClipped(cx + dx, yUpper, '─', whiskerColor)
    }

    // Draw box (from Q1 to Q3)
    // Top of box (Q3)
    drawClipped(cx - halfWidth, yQ3, '┌', boxColor)
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      drawClipped(cx + dx, yQ3, '─', boxColor)
    }
    drawClipped(cx + halfWidth, yQ3, '┐', boxColor)

    // Sides of box
    for (let y = yQ3 + 1; y < yQ1; y++) {
      drawClipped(cx - halfWidth, y, '│', boxColor)
      drawClipped(cx + halfWidth, y, '│', boxColor)
    }

    // Bottom of box (Q1)
    drawClipped(cx - halfWidth, yQ1, '└', boxColor)
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      drawClipped(cx + dx, yQ1, '─', boxColor)
    }
    drawClipped(cx + halfWidth, yQ1, '┘', boxColor)

    // Draw median line
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      drawClipped(cx + dx, yMedian, '━', medianColor)
    }

    // Draw outliers
    if (showOutliers && outliers.length > 0) {
      for (const outlier of outliers) {
        const yOutlier = Math.round(scales.y.map(outlier))
        drawClipped(cx, yOutlier, '○', outlierColor)
      }
    }
  }
}

/**
 * Render geom_segment (line segments from x,y to xend,yend)
 */
export function renderGeomSegment(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const arrow = geom.params.arrow as boolean ?? false
  const linetype = geom.params.linetype as string ?? 'solid'

  // Get plot area boundaries for clipping
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Choose line character based on linetype
  let lineChar: string
  switch (linetype) {
    case 'dashed':
      lineChar = '╌'
      break
    case 'dotted':
      lineChar = '·'
      break
    case 'solid':
    default:
      lineChar = '─'
  }

  // Get default color from geom.params if specified (for stats like qq_line)
  const paramColor = geom.params.color
  let defaultColor: RGBA = DEFAULT_POINT_COLOR
  if (typeof paramColor === 'string') {
    // Convert named color to RGBA
    const namedColors: Record<string, RGBA> = {
      'gray': { r: 128, g: 128, b: 128, a: 1 },
      'grey': { r: 128, g: 128, b: 128, a: 1 },
      'red': { r: 255, g: 0, b: 0, a: 1 },
      'blue': { r: 0, g: 0, b: 255, a: 1 },
      'black': { r: 0, g: 0, b: 0, a: 1 },
    }
    defaultColor = namedColors[paramColor] ?? DEFAULT_POINT_COLOR
  } else if (paramColor && typeof paramColor === 'object') {
    defaultColor = paramColor as RGBA
  }

  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]
    const xendVal = row['xend'] ?? row[aes.x]
    const yendVal = row['yend'] ?? row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map to canvas coordinates
    const x1 = Math.round(scales.x.map(xVal))
    const y1 = Math.round(scales.y.map(yVal))
    const x2 = Math.round(scales.x.map(xendVal))
    const y2 = Math.round(scales.y.map(yendVal))

    // Get color - use scale if available, otherwise use param color
    const color = (aes.color && scales.color) ? getPointColor(row, aes, scales.color) : defaultColor

    // Draw the line segment with clipping
    drawLineClipped(canvas, x1, y1, x2, y2, color, lineChar, plotLeft, plotRight, plotTop, plotBottom)

    // Draw arrow head if requested
    if (arrow) {
      // Calculate arrow direction
      const dx = x2 - x1
      const dy = y2 - y1

      // Choose arrow character based on direction
      let arrowChar = '►'
      if (Math.abs(dx) > Math.abs(dy)) {
        arrowChar = dx > 0 ? '►' : '◄'
      } else {
        arrowChar = dy > 0 ? '▼' : '▲'
      }

      // Draw arrow at endpoint
      if (x2 >= plotLeft && x2 <= plotRight && y2 >= plotTop && y2 <= plotBottom) {
        canvas.drawChar(x2, y2, arrowChar, color)
      }
    }
  }
}

/**
 * Draw a line with clipping to plot area
 */
function drawLineClipped(
  canvas: TerminalCanvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: RGBA,
  char: string,
  plotLeft: number,
  plotRight: number,
  plotTop: number,
  plotBottom: number
): void {
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  let err = dx - dy

  let x = x1
  let y = y1

  while (true) {
    // Only draw if within plot bounds
    if (x >= plotLeft && x <= plotRight && y >= plotTop && y <= plotBottom) {
      canvas.drawChar(x, y, char, color)
    }

    if (x === x2 && y === y2) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * Render geom_violin (violin plot)
 * Data should be density curves grouped by x
 */
export function renderGeomViolin(
  data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const widthFactor = (geom.params.width as number) ?? 0.8
  const alpha = (geom.params.alpha as number) ?? 0.8
  const drawQuantiles = geom.params.draw_quantiles as number[] | null

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  const violinColor: RGBA = { r: 79, g: 169, b: 238, a: 1 }
  const quantileColor: RGBA = { r: 255, g: 255, b: 255, a: 1 }

  // Data is pre-transformed by stat_ydensity:
  // { x: groupKey, y: yPosition, density: densityValue, scaled: scaledDensity }

  // Group data by x (the categorical groups)
  const groups = new Map<string, DataSource>()

  for (const row of data) {
    const key = String(row.x ?? 'default')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  // Calculate available width per violin based on discrete scale
  let violinMaxWidth: number
  if (scales.x.type === 'discrete') {
    const domain = scales.x.domain as string[]
    const plotWidth = Math.abs(scales.x.range[1] - scales.x.range[0])
    const spacing = plotWidth / Math.max(1, domain.length)
    violinMaxWidth = Math.max(3, Math.floor(spacing * widthFactor))
  } else {
    violinMaxWidth = 8
  }

  // Draw each violin
  for (const [groupKey, groupData] of groups) {
    // Sort by y position
    const sorted = [...groupData].sort((a, b) => {
      const ay = Number(a.y) || 0
      const by = Number(b.y) || 0
      return ay - by
    })

    if (sorted.length < 2) continue

    // Get the center x position for this group
    const cx = Math.round(scales.x.map(groupKey))

    // Find max density for scaling width
    let maxDensity = 0
    for (const row of sorted) {
      const density = Number(row.density) || 0
      if (density > maxDensity) maxDensity = density
    }

    if (maxDensity === 0) continue

    // Draw the violin shape
    for (const row of sorted) {
      const yVal = row.y
      const density = Number(row.density) || 0

      const cy = Math.round(scales.y.map(yVal))
      const halfWidth = Math.max(0, Math.round((density / maxDensity) * violinMaxWidth / 2))

      // Draw both sides of the violin
      const fillColor: RGBA = {
        r: Math.round(violinColor.r * alpha),
        g: Math.round(violinColor.g * alpha),
        b: Math.round(violinColor.b * alpha),
        a: 1,
      }

      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        const x = cx + dx
        if (x >= plotLeft && x <= plotRight && cy >= plotTop && cy <= plotBottom) {
          canvas.drawChar(x, cy, '█', fillColor)
        }
      }
    }

    // Draw quantile lines if requested
    if (drawQuantiles && drawQuantiles.length > 0) {
      // Calculate quantile positions from the y values in transformed data
      const yValues = sorted.map((r) => Number(r.y) || 0).sort((a, b) => a - b)

      for (const q of drawQuantiles) {
        const idx = Math.floor(q * (yValues.length - 1))
        const qValue = yValues[idx]
        const qY = Math.round(scales.y.map(qValue))

        // Draw short horizontal line at quantile
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx
          if (x >= plotLeft && x <= plotRight && qY >= plotTop && qY <= plotBottom) {
            canvas.drawChar(x, qY, '─', quantileColor)
          }
        }
      }
    }
  }
}

/**
 * Render geom_tile (heatmap)
 */
export function renderGeomTile(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const alpha = (geom.params.alpha as number) ?? 1

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Calculate tile size from data spacing or use defaults
  let tileWidth = geom.params.width as number | undefined
  let tileHeight = geom.params.height as number | undefined

  if (!tileWidth || !tileHeight) {
    // Infer from data spacing
    const xVals = [...new Set(data.map((r) => Number(r[aes.x]) || 0))].sort((a, b) => a - b)
    const yVals = [...new Set(data.map((r) => Number(r[aes.y]) || 0))].sort((a, b) => a - b)

    if (xVals.length > 1) {
      tileWidth = tileWidth ?? (xVals[1] - xVals[0])
    }
    if (yVals.length > 1) {
      tileHeight = tileHeight ?? (yVals[1] - yVals[0])
    }
  }

  tileWidth = tileWidth ?? 1
  tileHeight = tileHeight ?? 1

  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]
    const fillVal = aes.fill ? row[aes.fill] : row['fill'] ?? row['value'] ?? 1

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map center to canvas coordinates
    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    // Calculate tile extent in canvas coordinates
    const halfW = Math.max(1, Math.floor(Math.abs(scales.x.map(Number(xVal) + tileWidth / 2) - cx)))
    const halfH = Math.max(1, Math.floor(Math.abs(scales.y.map(Number(yVal) + tileHeight / 2) - cy)))

    // Get color from scale or default
    let color: RGBA
    if (scales.color && typeof fillVal === 'number') {
      color = scales.color.map(fillVal)
    } else if (scales.color) {
      color = scales.color.map(fillVal)
    } else {
      // Default gradient based on value
      const intensity = Math.min(1, Math.max(0, Number(fillVal) || 0.5))
      color = {
        r: Math.round(79 + 176 * intensity),
        g: Math.round(169 - 130 * intensity),
        b: Math.round(238 - 198 * intensity),
        a: alpha,
      }
    }

    // Apply alpha
    color = { ...color, a: color.a * alpha }

    // Choose fill character based on value intensity
    const fillChar = '█'

    // Draw the tile
    for (let dy = -halfH; dy <= halfH; dy++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x >= plotLeft && x <= plotRight && y >= plotTop && y <= plotBottom) {
          canvas.drawChar(x, y, fillChar, color)
        }
      }
    }
  }
}

/**
 * Render geom_contour (contour lines)
 * Uses marching squares algorithm for contour extraction
 */
export function renderGeomContour(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const numLevels = (geom.params.bins as number) ?? 10
  const breaks = geom.params.breaks as number[] | undefined
  const linetype = (geom.params.linetype as string) ?? 'solid'

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Build grid from data (assuming data has x, y, z/level values)
  const zField = 'z' in data[0] ? 'z' : 'level' in data[0] ? 'level' : aes.fill || 'value'

  // Get unique x and y values to build grid
  const xSet = new Set<number>()
  const ySet = new Set<number>()
  const zMap = new Map<string, number>()

  for (const row of data) {
    const x = Number(row[aes.x])
    const y = Number(row[aes.y])
    const z = Number(row[zField] ?? 0)
    xSet.add(x)
    ySet.add(y)
    zMap.set(`${x},${y}`, z)
  }

  const xVals = [...xSet].sort((a, b) => a - b)
  const yVals = [...ySet].sort((a, b) => a - b)

  if (xVals.length < 2 || yVals.length < 2) return

  // Find z range
  let zMin = Infinity
  let zMax = -Infinity
  for (const z of zMap.values()) {
    if (z < zMin) zMin = z
    if (z > zMax) zMax = z
  }

  // Calculate contour levels
  const levels = breaks ?? Array.from(
    { length: numLevels },
    (_, i) => zMin + (zMax - zMin) * (i + 1) / (numLevels + 1)
  )

  // Contour line characters
  const lineChar = linetype === 'dotted' ? '·' : linetype === 'dashed' ? '╌' : '─'

  // Color gradient for different levels
  const getContourColor = (level: number): RGBA => {
    const t = (level - zMin) / (zMax - zMin || 1)
    return {
      r: Math.round(68 + 187 * t),
      g: Math.round(1 + 148 * (1 - t)),
      b: Math.round(84 + 171 * (1 - t)),
      a: 1,
    }
  }

  // Simple contour tracing using threshold
  for (const level of levels) {
    const color = getContourColor(level)

    // For each cell in the grid, check if contour passes through
    for (let i = 0; i < xVals.length - 1; i++) {
      for (let j = 0; j < yVals.length - 1; j++) {
        const x0 = xVals[i], x1 = xVals[i + 1]
        const y0 = yVals[j], y1 = yVals[j + 1]

        const z00 = zMap.get(`${x0},${y0}`) ?? 0
        const z10 = zMap.get(`${x1},${y0}`) ?? 0
        const z01 = zMap.get(`${x0},${y1}`) ?? 0
        const z11 = zMap.get(`${x1},${y1}`) ?? 0

        // Check if level crosses any edge
        const crosses = (
          (z00 < level && z10 >= level) || (z00 >= level && z10 < level) ||
          (z00 < level && z01 >= level) || (z00 >= level && z01 < level) ||
          (z10 < level && z11 >= level) || (z10 >= level && z11 < level) ||
          (z01 < level && z11 >= level) || (z01 >= level && z11 < level)
        )

        if (crosses) {
          // Draw contour point at cell center
          const cx = Math.round(scales.x.map((x0 + x1) / 2))
          const cy = Math.round(scales.y.map((y0 + y1) / 2))

          if (cx >= plotLeft && cx <= plotRight && cy >= plotTop && cy <= plotBottom) {
            canvas.drawChar(cx, cy, lineChar, color)
          }
        }
      }
    }
  }
}

/**
 * Render geom_errorbar (vertical error bars)
 */
export function renderGeomErrorbar(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const width = (geom.params.width as number) ?? 0.5
  const linetype = (geom.params.linetype as string) ?? 'solid'

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  const lineChar = linetype === 'dotted' ? '·' : linetype === 'dashed' ? '╌' : '│'
  const capChar = '─'

  for (const row of data) {
    const xVal = row[aes.x]
    const ymin = row['ymin'] as number
    const ymax = row['ymax'] as number

    if (xVal === null || xVal === undefined || ymin === undefined || ymax === undefined) {
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cyMin = Math.round(scales.y.map(ymin))
    const cyMax = Math.round(scales.y.map(ymax))

    const color = getPointColor(row, aes, scales.color)
    const halfWidth = Math.max(1, Math.round(width * 2))

    // Draw vertical line
    const top = Math.min(cyMin, cyMax)
    const bottom = Math.max(cyMin, cyMax)
    for (let y = top; y <= bottom; y++) {
      if (cx >= plotLeft && cx <= plotRight && y >= plotTop && y <= plotBottom) {
        canvas.drawChar(cx, y, lineChar, color)
      }
    }

    // Draw caps
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      const x = cx + dx
      if (x >= plotLeft && x <= plotRight) {
        if (cyMin >= plotTop && cyMin <= plotBottom) {
          canvas.drawChar(x, cyMin, capChar, color)
        }
        if (cyMax >= plotTop && cyMax <= plotBottom) {
          canvas.drawChar(x, cyMax, capChar, color)
        }
      }
    }
  }
}

/**
 * Render geom_rect (rectangles)
 */
export function renderGeomRect(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const alpha = (geom.params.alpha as number) ?? 0.5

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  for (const row of data) {
    const xmin = row['xmin'] as number ?? row[aes.x]
    const xmax = row['xmax'] as number ?? row[aes.x]
    const ymin = row['ymin'] as number ?? row[aes.y]
    const ymax = row['ymax'] as number ?? row[aes.y]

    if (xmin === undefined || xmax === undefined || ymin === undefined || ymax === undefined) {
      continue
    }

    const x1 = Math.round(scales.x.map(xmin))
    const x2 = Math.round(scales.x.map(xmax))
    const y1 = Math.round(scales.y.map(ymax)) // Note: y is inverted
    const y2 = Math.round(scales.y.map(ymin))

    let color = getPointColor(row, aes, scales.color)
    color = {
      r: Math.round(color.r * alpha),
      g: Math.round(color.g * alpha),
      b: Math.round(color.b * alpha),
      a: 1,
    }

    // Fill the rectangle
    const left = Math.max(plotLeft, Math.min(x1, x2))
    const right = Math.min(plotRight, Math.max(x1, x2))
    const top = Math.max(plotTop, Math.min(y1, y2))
    const bottom = Math.min(plotBottom, Math.max(y1, y2))

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        canvas.drawChar(x, y, '░', color)
      }
    }

    // Draw border
    const borderColor: RGBA = { ...color, r: Math.min(255, color.r + 50), g: Math.min(255, color.g + 50), b: Math.min(255, color.b + 50) }
    for (let x = left; x <= right; x++) {
      if (top >= plotTop && top <= plotBottom) canvas.drawChar(x, top, '─', borderColor)
      if (bottom >= plotTop && bottom <= plotBottom) canvas.drawChar(x, bottom, '─', borderColor)
    }
    for (let y = top; y <= bottom; y++) {
      if (left >= plotLeft && left <= plotRight) canvas.drawChar(left, y, '│', borderColor)
      if (right >= plotLeft && right <= plotRight) canvas.drawChar(right, y, '│', borderColor)
    }
  }
}

/**
 * Render geom_abline (arbitrary lines y = slope * x + intercept)
 */
export function renderGeomAbline(
  _data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const slope = (geom.params.slope as number) ?? 1
  const intercept = (geom.params.intercept as number) ?? 0
  const linetype = (geom.params.linetype as string) ?? 'solid'

  const lineChar = linetype === 'dotted' ? '·' : linetype === 'dashed' ? '╌' : '─'
  const color = (geom.params.color as RGBA) ?? { r: 128, g: 128, b: 128, a: 1 }

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Get x domain for line calculation
  const xDomain = scales.x.domain as [number, number]

  // Calculate y values at domain edges
  const y1 = slope * xDomain[0] + intercept
  const y2 = slope * xDomain[1] + intercept

  // Map to canvas coordinates
  const cx1 = Math.round(scales.x.map(xDomain[0]))
  const cy1 = Math.round(scales.y.map(y1))
  const cx2 = Math.round(scales.x.map(xDomain[1]))
  const cy2 = Math.round(scales.y.map(y2))

  // Draw line with clipping
  drawLineClipped(canvas, cx1, cy1, cx2, cy2, color, lineChar, plotLeft, plotRight, plotTop, plotBottom)
}

/**
 * Render geom_linerange (vertical line from ymin to ymax)
 */
export function renderGeomLinerange(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const linetype = (geom.params.linetype as string) ?? 'solid'
  const lineChar = linetype === 'dotted' ? '·' : linetype === 'dashed' ? '╌' : '│'

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  for (const row of data) {
    const xVal = row[aes.x]
    const ymin = row['ymin'] as number
    const ymax = row['ymax'] as number

    if (xVal === null || xVal === undefined || ymin === undefined || ymax === undefined) {
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cyMin = Math.round(scales.y.map(ymin))
    const cyMax = Math.round(scales.y.map(ymax))

    const color = getPointColor(row, aes, scales.color)

    // Draw vertical line
    const top = Math.min(cyMin, cyMax)
    const bottom = Math.max(cyMin, cyMax)
    for (let y = top; y <= bottom; y++) {
      if (cx >= plotLeft && cx <= plotRight && y >= plotTop && y <= plotBottom) {
        canvas.drawChar(cx, y, lineChar, color)
      }
    }
  }
}

/**
 * Render geom_pointrange (point with vertical line from ymin to ymax)
 */
export function renderGeomPointrange(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  // First render the linerange
  renderGeomLinerange(data, geom, aes, scales, canvas)

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Then render points at y position
  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    const color = getPointColor(row, aes, scales.color)

    if (cx >= plotLeft && cx <= plotRight && cy >= plotTop && cy <= plotBottom) {
      canvas.drawChar(cx, cy, '●', color)
    }
  }
}

/**
 * Render geom_smooth (smoothed line with optional confidence band)
 */
export function renderGeomSmooth(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length < 2) return

  // Sort data by x value for proper rendering
  const sorted = [...data].sort((a, b) => {
    const ax = Number(a['x']) || 0
    const bx = Number(b['x']) || 0
    return ax - bx
  })

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Get styling from params
  const showSE = geom.params.se !== false
  const alpha = (geom.params.alpha as number) ?? 0.3

  // Get base color - use geom param color or default blue
  const baseColor: RGBA = geom.params.color
    ? parseColor(geom.params.color as string)
    : { r: 51, g: 102, b: 204, a: 1 } // Nice blue default

  // Confidence band color with alpha
  const bandColor: RGBA = {
    ...baseColor,
    a: alpha,
  }

  // Render confidence band first (behind the line) if SE is enabled
  if (showSE) {
    // Check if data has ymin/ymax
    const hasCI = sorted.some(row => row['ymin'] !== undefined && row['ymax'] !== undefined)

    if (hasCI) {
      // Fill the confidence band using vertical lines at each x
      for (const row of sorted) {
        const xVal = row['x'] as number
        const ymin = row['ymin'] as number
        const ymax = row['ymax'] as number

        if (xVal === undefined || ymin === undefined || ymax === undefined) {
          continue
        }

        const cx = Math.round(scales.x.map(xVal))
        const cyMin = Math.round(scales.y.map(ymin))
        const cyMax = Math.round(scales.y.map(ymax))

        // Draw vertical fill at this x position
        const top = Math.min(cyMin, cyMax)
        const bottom = Math.max(cyMin, cyMax)

        for (let y = top; y <= bottom; y++) {
          if (cx >= plotLeft && cx <= plotRight && y >= plotTop && y <= plotBottom) {
            // Use a lighter character for the band fill
            canvas.drawChar(cx, y, '░', bandColor)
          }
        }
      }
    }
  }

  // Render the smooth line on top
  for (let i = 0; i < sorted.length - 1; i++) {
    const row1 = sorted[i]
    const row2 = sorted[i + 1]

    const x1Val = row1['x'] as number
    const y1Val = row1['y'] as number
    const x2Val = row2['x'] as number
    const y2Val = row2['y'] as number

    if (x1Val === undefined || y1Val === undefined ||
        x2Val === undefined || y2Val === undefined) {
      continue
    }

    const x1 = Math.round(scales.x.map(x1Val))
    const y1 = Math.round(scales.y.map(y1Val))
    const x2 = Math.round(scales.x.map(x2Val))
    const y2 = Math.round(scales.y.map(y2Val))

    // Draw line segment
    drawLine(canvas, x1, y1, x2, y2, baseColor)
  }
}

/**
 * Parse a color string to RGBA
 */
function parseColor(color: string): RGBA {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      }
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      }
    }
  }
  // Default to gray if parsing fails
  return { r: 128, g: 128, b: 128, a: 1 }
}

/**
 * Geometry renderer dispatch
 */
export function renderGeom(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas,
  coordType?: string
): void {
  switch (geom.type) {
    case 'point':
      renderGeomPoint(data, geom, aes, scales, canvas)
      break
    case 'line':
      renderGeomLine(data, geom, aes, scales, canvas)
      break
    case 'path':
      renderGeomPath(data, geom, aes, scales, canvas)
      break
    case 'step':
      renderGeomStep(data, geom, aes, scales, canvas)
      break
    case 'rug':
      renderGeomRug(data, geom, aes, scales, canvas)
      break
    case 'bar':
    case 'col':
      renderGeomBar(data, geom, aes, scales, canvas, coordType)
      break
    case 'text':
    case 'label':
      renderGeomText(data, geom, aes, scales, canvas)
      break
    case 'hline':
      renderGeomHLine(data, geom, aes, scales, canvas)
      break
    case 'vline':
      renderGeomVLine(data, geom, aes, scales, canvas)
      break
    case 'histogram':
      renderGeomHistogram(data, geom, aes, scales, canvas)
      break
    case 'freqpoly':
      renderGeomFreqpoly(data, geom, aes, scales, canvas)
      break
    case 'boxplot':
      renderGeomBoxplot(data, geom, aes, scales, canvas)
      break
    case 'area':
      renderGeomArea(data, geom, aes, scales, canvas)
      break
    case 'segment':
      renderGeomSegment(data, geom, aes, scales, canvas)
      break
    // Phase 7: Extended Grammar
    case 'violin':
      renderGeomViolin(data, geom, aes, scales, canvas)
      break
    case 'tile':
    case 'raster':
      renderGeomTile(data, geom, aes, scales, canvas)
      break
    case 'contour':
    case 'contour_filled':
    case 'density_2d':
      renderGeomContour(data, geom, aes, scales, canvas)
      break
    case 'errorbar':
      renderGeomErrorbar(data, geom, aes, scales, canvas)
      break
    case 'rect':
      renderGeomRect(data, geom, aes, scales, canvas)
      break
    case 'abline':
      renderGeomAbline(data, geom, aes, scales, canvas)
      break
    case 'linerange':
      renderGeomLinerange(data, geom, aes, scales, canvas)
      break
    case 'pointrange':
      renderGeomPointrange(data, geom, aes, scales, canvas)
      break
    case 'smooth':
      renderGeomSmooth(data, geom, aes, scales, canvas)
      break
    default:
      // Unknown geom type, skip
      break
  }
}
