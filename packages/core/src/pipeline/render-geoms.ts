/**
 * Geometry rendering to canvas
 *
 * Each geometry renderer takes data, scales, and canvas, and draws the visual marks.
 */

import type { TerminalCanvas } from '../canvas/canvas'
import type { AestheticMapping, DataSource, Geom, RGBA } from '../types'
import type { ScaleContext, ResolvedColorScale } from './scales'
import { DEFAULT_POINT_COLOR } from './scales'
import { applyPositionAdjustment, getPositionType } from '../positions'

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
 * Parse a color value (hex string, named color, or RGBA object) to RGBA
 */
function parseColorToRgba(color: unknown, fallback: RGBA = { r: 128, g: 128, b: 128, a: 1 }): RGBA {
  if (!color) return fallback

  // Already RGBA object
  if (typeof color === 'object' && color !== null && 'r' in color) {
    return color as RGBA
  }

  // String color (hex or named)
  if (typeof color === 'string') {
    // Hex color
    if (color.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
      if (result) {
        return {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 1,
        }
      }
    }

    // Named colors
    const namedColors: Record<string, RGBA> = {
      red: { r: 255, g: 0, b: 0, a: 1 },
      blue: { r: 0, g: 0, b: 255, a: 1 },
      green: { r: 0, g: 128, b: 0, a: 1 },
      black: { r: 0, g: 0, b: 0, a: 1 },
      white: { r: 255, g: 255, b: 255, a: 1 },
      gray: { r: 128, g: 128, b: 128, a: 1 },
      grey: { r: 128, g: 128, b: 128, a: 1 },
      yellow: { r: 255, g: 255, b: 0, a: 1 },
      orange: { r: 255, g: 165, b: 0, a: 1 },
      purple: { r: 128, g: 0, b: 128, a: 1 },
      cyan: { r: 0, g: 255, b: 255, a: 1 },
      magenta: { r: 255, g: 0, b: 255, a: 1 },
    }

    const named = namedColors[color.toLowerCase()]
    if (named) return named
  }

  return fallback
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
      // Scale the data-space offset to pixel-space proportionally
      // For discrete scales, this approximation works reasonably well
      const dataRange = (scales.x.domain as any)[1] - (scales.x.domain as any)[0] || 1
      const pixelRange = scales.x.range[1] - scales.x.range[0]
      xOffset = Math.round((Number(x) - Number(point.xOriginal)) * pixelRange / Math.max(1, dataRange))
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
  const color = parseColorToRgba(geom.params.color)

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
  const color = parseColorToRgba(geom.params.color)

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
 * Render geom_density (1D kernel density estimation)
 * Data should be pre-transformed by stat_density
 */
export function renderGeomDensity(
  data: DataSource,
  geom: Geom,
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
  const groupField = aes.group || aes.color || aes.fill

  if (groupField) {
    for (const row of data) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', data as DataSource[number][])
  }

  // Get baseline (y=0 mapped to canvas, or bottom of plot area)
  let baseline = Math.round(scales.y.map(0))
  baseline = Math.max(plotTop, Math.min(plotBottom, baseline))

  const alpha = (geom.params.alpha as number) ?? 0.3
  const fillChar = '░'

  // Draw filled area and outline for each group
  for (const [groupKey, groupData] of groups) {
    if (groupData.length < 2) continue

    // Sort by x
    const sorted = [...groupData].sort((a, b) => {
      const ax = Number(a.x) || 0
      const bx = Number(b.x) || 0
      return ax - bx
    })

    // Get color for this group
    let baseColor = scales.color?.map(groupKey) ?? DEFAULT_POINT_COLOR

    // Apply alpha by reducing color intensity for fill
    const fillColor: RGBA = {
      r: Math.round(baseColor.r * alpha),
      g: Math.round(baseColor.g * alpha),
      b: Math.round(baseColor.b * alpha),
      a: baseColor.a,
    }

    // Draw filled area from baseline to density curve
    for (let i = 0; i < sorted.length - 1; i++) {
      const row1 = sorted[i]
      const row2 = sorted[i + 1]

      // Get density value (y or density field)
      const density1 = Number(row1.y ?? row1.density) || 0
      const density2 = Number(row2.y ?? row2.density) || 0

      const x1 = Math.round(scales.x.map(row1.x as number))
      const y1 = Math.round(scales.y.map(density1))
      const x2 = Math.round(scales.x.map(row2.x as number))
      const y2 = Math.round(scales.y.map(density2))

      // Fill columns between x1 and x2
      for (let x = x1; x <= x2; x++) {
        if (x < plotLeft || x > plotRight) continue

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

    // Draw outline on top
    for (let i = 0; i < sorted.length - 1; i++) {
      const row1 = sorted[i]
      const row2 = sorted[i + 1]

      const density1 = Number(row1.y ?? row1.density) || 0
      const density2 = Number(row2.y ?? row2.density) || 0

      const x1 = Math.round(scales.x.map(row1.x as number))
      const y1 = Math.round(scales.y.map(density1))
      const x2 = Math.round(scales.x.map(row2.x as number))
      const y2 = Math.round(scales.y.map(density2))

      // Clip line to plot area
      if (x1 >= plotLeft && x1 <= plotRight && x2 >= plotLeft && x2 <= plotRight &&
          y1 >= plotTop && y1 <= plotBottom && y2 >= plotTop && y2 <= plotBottom) {
        drawLine(canvas, x1, y1, x2, y2, baseColor)
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
 * Render geom_ridgeline (joy plot)
 * Creates stacked density plots for comparing distributions across groups.
 * Data should be density curves grouped by y (categorical)
 */
export function renderGeomRidgeline(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const scaleFactor = (geom.params.scale as number) ?? 0.9
  const alpha = (geom.params.alpha as number) ?? 0.8
  const showOutline = (geom.params.outline as boolean) ?? true
  const fixedFill = geom.params.fill as string | undefined
  const fixedColor = geom.params.color as string | undefined

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Data is pre-transformed by stat_xdensity:
  // { x: xPosition, y: groupKey, yIndex: groupIndex, density: densityValue, scaled: scaledDensity }

  // Group data by y (the categorical groups)
  const groups = new Map<string, { data: DataSource; index: number }>()
  const groupKeys: string[] = []

  for (const row of data) {
    const key = String(row.y ?? 'default')
    if (!groups.has(key)) {
      groups.set(key, { data: [], index: Number(row.yIndex) ?? groupKeys.length })
      groupKeys.push(key)
    }
    groups.get(key)!.data.push(row)
  }

  const numGroups = groupKeys.length
  if (numGroups === 0) return

  // Calculate available height per ridge
  const plotHeight = Math.abs(plotBottom - plotTop)
  const ridgeBaseHeight = plotHeight / numGroups

  // Color palette for groups
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
    { r: 204, g: 102, b: 204, a: 1 },  // Purple
    { r: 255, g: 200, b: 87, a: 1 },   // Yellow
    { r: 138, g: 201, b: 222, a: 1 },  // Cyan
    { r: 255, g: 153, b: 153, a: 1 },  // Pink
    { r: 170, g: 170, b: 170, a: 1 },  // Gray
  ]

  // Parse fixed fill color if provided
  let parsedFillColor: RGBA | null = null
  if (fixedFill) {
    parsedFillColor = parseColorToRgba(fixedFill)
  }

  // Draw each ridge (from back to front, bottom to top)
  const sortedKeys = [...groupKeys].sort((a, b) => {
    const idxA = groups.get(a)?.index ?? 0
    const idxB = groups.get(b)?.index ?? 0
    return idxB - idxA // Reverse order so we draw from bottom up
  })

  for (const groupKey of sortedKeys) {
    const group = groups.get(groupKey)
    if (!group) continue

    const groupIndex = group.index
    const groupData = group.data

    // Sort by x position
    const sorted = [...groupData].sort((a, b) => {
      const ax = Number(a.x) || 0
      const bx = Number(b.x) || 0
      return ax - bx
    })

    if (sorted.length < 2) continue

    // Calculate the baseline y position for this ridge
    // Groups are stacked from top to bottom
    const baseline = plotTop + (groupIndex + 0.5) * ridgeBaseHeight

    // Get color for this group
    let fillColor: RGBA
    if (parsedFillColor) {
      fillColor = parsedFillColor
    } else if ((aes.fill || aes.color) && scales.color) {
      const mappedColor = scales.color.map(groupKey)
      if (typeof mappedColor === 'object' && 'r' in mappedColor) {
        fillColor = mappedColor as RGBA
      } else {
        fillColor = defaultColors[groupIndex % defaultColors.length]
      }
    } else {
      fillColor = defaultColors[groupIndex % defaultColors.length]
    }

    // Apply alpha
    const alphaFillColor: RGBA = {
      r: Math.round(fillColor.r * alpha + 255 * (1 - alpha) * 0.1),
      g: Math.round(fillColor.g * alpha + 255 * (1 - alpha) * 0.1),
      b: Math.round(fillColor.b * alpha + 255 * (1 - alpha) * 0.1),
      a: 1,
    }

    // Maximum height for ridge in character cells
    const maxRidgeHeight = ridgeBaseHeight * scaleFactor * 1.5

    // Draw the filled ridge
    const outlinePoints: Array<{ x: number; y: number }> = []

    for (const row of sorted) {
      const xVal = Number(row.x)
      const scaled = Number(row.scaled) || 0

      const px = Math.round(scales.x.map(xVal))
      // Ridge goes upward from baseline
      const ridgeHeight = scaled * maxRidgeHeight
      const py = Math.round(baseline - ridgeHeight)

      if (px < plotLeft || px > plotRight) continue

      // Fill from baseline to ridge top
      const fillTop = Math.max(plotTop, py)
      const fillBottom = Math.min(plotBottom, Math.round(baseline))

      for (let y = fillTop; y <= fillBottom; y++) {
        canvas.drawChar(px, y, '█', alphaFillColor)
      }

      // Store outline points
      if (showOutline) {
        outlinePoints.push({ x: px, y: Math.max(plotTop, py) })
      }
    }

    // Draw outline on top
    if (showOutline && outlinePoints.length > 1) {
      const outlineColor: RGBA = fixedColor
        ? parseColorToRgba(fixedColor)
        : { r: Math.min(255, fillColor.r + 40), g: Math.min(255, fillColor.g + 40), b: Math.min(255, fillColor.b + 40), a: 1 }

      for (let i = 0; i < outlinePoints.length - 1; i++) {
        const p1 = outlinePoints[i]
        const p2 = outlinePoints[i + 1]

        // Simple line drawing between points
        if (Math.abs(p2.x - p1.x) <= 1) {
          if (p1.y >= plotTop && p1.y <= plotBottom) {
            canvas.drawChar(p1.x, p1.y, '▄', outlineColor)
          }
        }
      }
      // Draw last point
      const last = outlinePoints[outlinePoints.length - 1]
      if (last.y >= plotTop && last.y <= plotBottom) {
        canvas.drawChar(last.x, last.y, '▄', outlineColor)
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

  // Calculate tile size in canvas coordinates
  // For discrete scales, calculate based on number of categories
  // For continuous scales, infer from data spacing or use defaults
  let halfW: number
  let halfH: number

  const xIsDiscrete = scales.x.type === 'discrete'
  const yIsDiscrete = scales.y.type === 'discrete'

  if (xIsDiscrete) {
    // For discrete x, divide canvas width by number of categories
    const xDomain = scales.x.domain as string[]
    const canvasWidth = Math.abs(scales.x.range[1] - scales.x.range[0])
    halfW = Math.max(1, Math.floor(canvasWidth / (xDomain.length * 2)))
  } else {
    // For continuous x, check if data has width property (e.g., from bin2d), then geom.params, then infer from spacing
    let tileWidth = (data[0]?.width as number | undefined) ?? (geom.params.width as number | undefined)
    if (!tileWidth) {
      const xVals = [...new Set(data.map((r) => Number(r[aes.x])).filter(v => !isNaN(v)))].sort((a, b) => a - b)
      if (xVals.length > 1) {
        tileWidth = xVals[1] - xVals[0]
      }
    }
    tileWidth = tileWidth ?? 1
    // Calculate half-width by mapping tile extent
    const sampleX = data.find(r => r[aes.x] !== null && r[aes.x] !== undefined)?.[aes.x]
    if (sampleX !== undefined) {
      const cx = scales.x.map(sampleX)
      halfW = Math.max(1, Math.floor(Math.abs(scales.x.map(Number(sampleX) + tileWidth / 2) - cx)))
    } else {
      halfW = 1
    }
  }

  if (yIsDiscrete) {
    // For discrete y, divide canvas height by number of categories
    const yDomain = scales.y.domain as string[]
    const canvasHeight = Math.abs(scales.y.range[1] - scales.y.range[0])
    halfH = Math.max(1, Math.floor(canvasHeight / (yDomain.length * 2)))
  } else {
    // For continuous y, check if data has height property (e.g., from bin2d), then geom.params, then infer from spacing
    let tileHeight = (data[0]?.height as number | undefined) ?? (geom.params.height as number | undefined)
    if (!tileHeight) {
      const yVals = [...new Set(data.map((r) => Number(r[aes.y])).filter(v => !isNaN(v)))].sort((a, b) => a - b)
      if (yVals.length > 1) {
        tileHeight = yVals[1] - yVals[0]
      }
    }
    tileHeight = tileHeight ?? 1
    // Calculate half-height by mapping tile extent
    const sampleY = data.find(r => r[aes.y] !== null && r[aes.y] !== undefined)?.[aes.y]
    if (sampleY !== undefined) {
      const cy = scales.y.map(sampleY)
      halfH = Math.max(1, Math.floor(Math.abs(scales.y.map(Number(sampleY) + tileHeight / 2) - cy)))
    } else {
      halfH = 1
    }
  }

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
  const color = parseColorToRgba(geom.params.color)

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
 * Render geom_crossbar (box with thick middle line at y, spanning ymin to ymax)
 */
export function renderGeomCrossbar(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const width = (geom.params.width as number) ?? 0.5
  const fatten = (geom.params.fatten as number) ?? 2.5

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Calculate half-width in canvas coordinates
  const halfWidth = Math.max(2, Math.round(width * 4))

  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]
    const ymin = row['ymin'] as number
    const ymax = row['ymax'] as number

    if (xVal === null || xVal === undefined || ymin === undefined || ymax === undefined) {
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cy = yVal !== null && yVal !== undefined ? Math.round(scales.y.map(yVal)) : null
    const cyMin = Math.round(scales.y.map(ymin))
    const cyMax = Math.round(scales.y.map(ymax))

    const color = getPointColor(row, aes, scales.color)

    // Draw the box outline
    const top = Math.min(cyMin, cyMax)
    const bottom = Math.max(cyMin, cyMax)
    const left = cx - halfWidth
    const right = cx + halfWidth

    // Draw vertical sides
    for (let y = top; y <= bottom; y++) {
      if (y >= plotTop && y <= plotBottom) {
        if (left >= plotLeft && left <= plotRight) {
          canvas.drawChar(left, y, '│', color)
        }
        if (right >= plotLeft && right <= plotRight) {
          canvas.drawChar(right, y, '│', color)
        }
      }
    }

    // Draw horizontal top and bottom
    for (let x = left; x <= right; x++) {
      if (x >= plotLeft && x <= plotRight) {
        if (top >= plotTop && top <= plotBottom) {
          canvas.drawChar(x, top, '─', color)
        }
        if (bottom >= plotTop && bottom <= plotBottom) {
          canvas.drawChar(x, bottom, '─', color)
        }
      }
    }

    // Draw corners
    if (left >= plotLeft && left <= plotRight) {
      if (top >= plotTop && top <= plotBottom) canvas.drawChar(left, top, '┌', color)
      if (bottom >= plotTop && bottom <= plotBottom) canvas.drawChar(left, bottom, '└', color)
    }
    if (right >= plotLeft && right <= plotRight) {
      if (top >= plotTop && top <= plotBottom) canvas.drawChar(right, top, '┐', color)
      if (bottom >= plotTop && bottom <= plotBottom) canvas.drawChar(right, bottom, '┘', color)
    }

    // Draw thick middle line at y position (the "cross" bar)
    if (cy !== null && cy >= plotTop && cy <= plotBottom) {
      // Draw multiple lines for "fatten" effect
      const fattenLines = Math.max(1, Math.round(fatten / 2))
      for (let dy = -fattenLines + 1; dy < fattenLines; dy++) {
        const lineY = cy + dy
        if (lineY >= plotTop && lineY <= plotBottom && lineY >= top && lineY <= bottom) {
          for (let x = left + 1; x < right; x++) {
            if (x >= plotLeft && x <= plotRight) {
              canvas.drawChar(x, lineY, '━', color)
            }
          }
        }
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
  _aes: AestheticMapping,
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
 * Render geom_beeswarm (beeswarm/quasirandom points)
 * Data should be pre-transformed by stat_beeswarm with x containing offset positions
 */
export function renderGeomBeeswarm(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const alpha = (geom.params.alpha as number) ?? 1
  const fixedColor = geom.params.color as string | undefined
  const shape = getPointShape(geom.params.shape as string | undefined)

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Data from stat_beeswarm has:
  // x: groupIndex + offset (continuous)
  // y: original y value (continuous)
  // xOriginal: category name
  // xOffset: the offset applied

  // Color palette for groups
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
    { r: 204, g: 102, b: 204, a: 1 },  // Purple
    { r: 255, g: 200, b: 87, a: 1 },   // Yellow
    { r: 138, g: 201, b: 222, a: 1 },  // Cyan
    { r: 255, g: 153, b: 153, a: 1 },  // Pink
    { r: 170, g: 170, b: 170, a: 1 },  // Gray
  ]

  // Get unique categories to map colors
  const categories = new Set<string>()
  for (const row of data) {
    categories.add(String(row.xOriginal ?? row[aes.x] ?? 'default'))
  }
  const categoryList = [...categories]

  for (const row of data) {
    const xVal = row.x  // This is groupIndex + offset from stat_beeswarm
    const yVal = row.y

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map x (which is groupIndex + offset) to canvas coordinates
    // We need to map from [0, numGroups) range to the x scale range
    const numGroups = categoryList.length
    const xRange = plotRight - plotLeft
    const xNormalized = (Number(xVal) + 0.5) / numGroups
    const cx = Math.round(plotLeft + xNormalized * xRange)

    // Map y to canvas coordinates
    const cy = Math.round(scales.y.map(yVal))

    // Determine color
    let color: RGBA
    if (fixedColor) {
      color = parseColorToRgba(fixedColor)
    } else if (scales.color && aes.color) {
      color = getPointColor(row, aes, scales.color)
    } else {
      // Color by category
      const category = String(row.xOriginal ?? row[aes.x] ?? 'default')
      const categoryIdx = categoryList.indexOf(category)
      color = defaultColors[categoryIdx % defaultColors.length]
    }

    // Apply alpha
    if (alpha < 1) {
      color = { ...color, a: alpha }
    }

    // Draw point if within bounds
    if (cx >= plotLeft && cx <= plotRight && cy >= plotTop && cy <= plotBottom) {
      canvas.drawChar(cx, cy, shape, color)
    }
  }
}

/**
 * Render geom_dumbbell (two points connected by a line)
 * For before/after comparisons or showing ranges
 * Requires x (start), xend (end), y (category) aesthetics
 */
export function renderGeomDumbbell(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  // Note: size and sizeEnd params available for future use with larger point characters
  const lineColor = parseColorToRgba(geom.params.lineColor ?? '#666666')
  const alpha = (geom.params.alpha as number) ?? 1
  const shape = getPointShape(geom.params.shape as string | undefined)

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Color palette for groups
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
    { r: 204, g: 102, b: 204, a: 1 },  // Purple
  ]

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    // Get start and end x values
    const xVal = row[aes.x]
    const xendVal = row['xend'] ?? row[aes.x]
    const yVal = row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map to canvas coordinates
    const x1 = Math.round(scales.x.map(xVal))
    const x2 = Math.round(scales.x.map(xendVal))
    const cy = Math.round(scales.y.map(yVal))

    // Get colors
    let startColor: RGBA
    let endColor: RGBA

    if (geom.params.color) {
      startColor = parseColorToRgba(geom.params.color)
    } else if (scales.color && aes.color) {
      startColor = getPointColor(row, aes, scales.color)
    } else {
      startColor = defaultColors[0]
    }

    if (geom.params.colorEnd) {
      endColor = parseColorToRgba(geom.params.colorEnd)
    } else {
      endColor = geom.params.color ? startColor : defaultColors[1]
    }

    // Apply alpha
    if (alpha < 1) {
      startColor = { ...startColor, a: alpha }
      endColor = { ...endColor, a: alpha }
    }

    // Draw connecting line first (behind points)
    if (cy >= plotTop && cy <= plotBottom) {
      const left = Math.max(plotLeft, Math.min(x1, x2))
      const right = Math.min(plotRight, Math.max(x1, x2))
      for (let x = left; x <= right; x++) {
        canvas.drawChar(x, cy, '─', lineColor)
      }
    }

    // Draw start point
    if (x1 >= plotLeft && x1 <= plotRight && cy >= plotTop && cy <= plotBottom) {
      canvas.drawChar(x1, cy, shape, startColor)
    }

    // Draw end point
    if (x2 >= plotLeft && x2 <= plotRight && cy >= plotTop && cy <= plotBottom) {
      canvas.drawChar(x2, cy, shape, endColor)
    }
  }
}

/**
 * Render geom_lollipop (line from baseline to point with dot at end)
 * A cleaner alternative to bar charts, especially for sparse data
 */
export function renderGeomLollipop(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  // Note: size param available for future use with larger point characters
  const alpha = (geom.params.alpha as number) ?? 1
  const baseline = (geom.params.baseline as number) ?? 0
  const direction = (geom.params.direction as string) ?? 'vertical'
  const shape = getPointShape(geom.params.shape as string | undefined)

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Color palette for categories
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
    { r: 204, g: 102, b: 204, a: 1 },  // Purple
    { r: 255, g: 200, b: 87, a: 1 },   // Yellow
    { r: 138, g: 201, b: 222, a: 1 },  // Cyan
  ]

  // Get unique x categories if discrete
  const xValues = [...new Set(data.map(row => row[aes.x]))]

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    const xVal = row[aes.x]
    const yVal = row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map to canvas coordinates
    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    // Get color
    let color: RGBA
    if (geom.params.color) {
      color = parseColorToRgba(geom.params.color)
    } else if (scales.color && aes.color) {
      color = getPointColor(row, aes, scales.color)
    } else {
      // Color by x category index
      const categoryIdx = xValues.indexOf(xVal)
      color = defaultColors[categoryIdx % defaultColors.length]
    }

    // Get line color (same as point or slightly dimmer)
    let lineColor: RGBA
    if (geom.params.lineColor) {
      lineColor = parseColorToRgba(geom.params.lineColor)
    } else {
      // Slightly dimmer version of point color
      lineColor = {
        r: Math.round(color.r * 0.7),
        g: Math.round(color.g * 0.7),
        b: Math.round(color.b * 0.7),
        a: color.a,
      }
    }

    // Apply alpha
    if (alpha < 1) {
      color = { ...color, a: alpha }
      lineColor = { ...lineColor, a: alpha }
    }

    if (direction === 'vertical') {
      // Vertical lollipop: line from baseline to y, point at y
      let baselineY = Math.round(scales.y.map(baseline))
      baselineY = Math.max(plotTop, Math.min(plotBottom, baselineY))

      // Draw the stem (line from baseline to point)
      if (cx >= plotLeft && cx <= plotRight) {
        const top = Math.min(cy, baselineY)
        const bottom = Math.max(cy, baselineY)
        for (let y = top; y <= bottom; y++) {
          if (y >= plotTop && y <= plotBottom) {
            canvas.drawChar(cx, y, '│', lineColor)
          }
        }
      }

      // Draw the point at the end
      if (cx >= plotLeft && cx <= plotRight && cy >= plotTop && cy <= plotBottom) {
        canvas.drawChar(cx, cy, shape, color)
      }
    } else {
      // Horizontal lollipop: line from baseline to x, point at x
      let baselineX = Math.round(scales.x.map(baseline))
      baselineX = Math.max(plotLeft, Math.min(plotRight, baselineX))

      // Draw the stem (line from baseline to point)
      if (cy >= plotTop && cy <= plotBottom) {
        const left = Math.min(cx, baselineX)
        const right = Math.max(cx, baselineX)
        for (let x = left; x <= right; x++) {
          if (x >= plotLeft && x <= plotRight) {
            canvas.drawChar(x, cy, '─', lineColor)
          }
        }
      }

      // Draw the point at the end
      if (cx >= plotLeft && cx <= plotRight && cy >= plotTop && cy <= plotBottom) {
        canvas.drawChar(cx, cy, shape, color)
      }
    }
  }
}

/**
 * Render geom_waffle (grid-based part-of-whole visualization)
 * Data should have fill/category and value columns
 */
export function renderGeomWaffle(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const rows = (geom.params.rows as number) ?? 10
  const cols = (geom.params.cols as number) ?? 10
  // n_total param available for custom total values
  const fillChar = (geom.params.fill_char as string) ?? '█'
  const emptyChar = (geom.params.empty_char as string) ?? '░'
  const showLegend = (geom.params.show_legend as boolean) ?? true
  const flip = (geom.params.flip as boolean) ?? false
  const gap = (geom.params.gap as number) ?? 0

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Color palette for categories
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
    { r: 204, g: 102, b: 204, a: 1 },  // Purple
    { r: 255, g: 200, b: 87, a: 1 },   // Yellow
    { r: 138, g: 201, b: 222, a: 1 },  // Cyan
    { r: 255, g: 153, b: 153, a: 1 },  // Pink
    { r: 170, g: 170, b: 170, a: 1 },  // Gray
  ]

  // Calculate values and proportions
  const fillField = aes.fill || aes.color || 'category'
  const valueField = aes.y || 'value'

  // Group data by category
  const categories = new Map<string, number>()
  let totalValue = 0

  for (const row of data) {
    const cat = String(row[fillField] ?? 'default')
    const val = Number(row[valueField]) || 1
    categories.set(cat, (categories.get(cat) ?? 0) + val)
    totalValue += val
  }

  // Calculate cells per category
  const cellsPerCategory: Array<{ category: string; cells: number; color: RGBA }> = []
  const categoryList = [...categories.keys()]
  let cellsAssigned = 0

  for (let i = 0; i < categoryList.length; i++) {
    const cat = categoryList[i]
    const val = categories.get(cat)!
    const proportion = val / totalValue
    const cells = Math.round(proportion * rows * cols)
    const color = scales.color?.map(cat) ?? defaultColors[i % defaultColors.length]
    cellsPerCategory.push({ category: cat, cells, color })
    cellsAssigned += cells
  }

  // Adjust for rounding errors
  if (cellsAssigned < rows * cols && cellsPerCategory.length > 0) {
    cellsPerCategory[0].cells += (rows * cols - cellsAssigned)
  }

  // Build the grid
  const grid: Array<{ char: string; color: RGBA }> = []
  for (const { cells, color } of cellsPerCategory) {
    for (let i = 0; i < cells; i++) {
      grid.push({ char: fillChar, color })
    }
  }

  // Fill remaining with empty
  const emptyColor: RGBA = { r: 80, g: 80, b: 80, a: 0.3 }
  while (grid.length < rows * cols) {
    grid.push({ char: emptyChar, color: emptyColor })
  }

  // Calculate cell size in canvas coordinates
  const availableWidth = plotRight - plotLeft - (showLegend ? 15 : 0)
  const availableHeight = plotBottom - plotTop
  const cellWidth = Math.max(1, Math.floor(availableWidth / cols)) + gap
  const cellHeight = Math.max(1, Math.floor(availableHeight / rows)) + gap

  // Draw the waffle
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let idx: number
      if (flip) {
        idx = row * cols + col
      } else {
        idx = col * rows + (rows - 1 - row)
      }

      if (idx >= grid.length) continue

      const cell = grid[idx]
      const x = plotLeft + col * cellWidth
      const y = plotTop + row * cellHeight

      if (x >= plotLeft && x < plotRight - (showLegend ? 15 : 0) && y >= plotTop && y <= plotBottom) {
        canvas.drawChar(x, y, cell.char, cell.color)
      }
    }
  }

  // Draw legend
  if (showLegend) {
    const legendX = plotRight - 12
    let legendY = plotTop

    for (let i = 0; i < cellsPerCategory.length && legendY < plotBottom; i++) {
      const { category, cells, color } = cellsPerCategory[i]
      const pct = Math.round((cells / (rows * cols)) * 100)
      const label = `${category.slice(0, 6)} ${pct}%`

      canvas.drawChar(legendX, legendY, '█', color)
      canvas.drawString(legendX + 2, legendY, label, { r: 180, g: 180, b: 180, a: 1 })
      legendY += 2
    }
  }
}

/**
 * Render geom_sparkline (inline mini chart)
 * Creates compact trend visualizations
 */
export function renderGeomSparkline(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const sparkType = (geom.params.sparkType as string) ?? 'bar'
  const width = (geom.params.width as number) ?? 20
  const showMinmax = (geom.params.show_minmax as boolean) ?? false
  const normalize = (geom.params.normalize as boolean) ?? true
  const minColor = parseColorToRgba(geom.params.min_color ?? '#e74c3c')
  const maxColor = parseColorToRgba(geom.params.max_color ?? '#2ecc71')

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Spark bar characters (8 levels)
  const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

  // Default color
  const defaultColor: RGBA = { r: 79, g: 169, b: 238, a: 1 }

  // Group data if there's a group aesthetic
  const groupField = aes.group || aes.color
  const groups = new Map<string, DataSource>()

  if (groupField) {
    for (const row of data) {
      const key = String(row[groupField] ?? 'default')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
  } else {
    groups.set('default', [...data])
  }

  let currentY = plotTop

  for (const [groupKey, groupData] of groups) {
    // Sort by x if present
    const sorted = aes.x
      ? [...groupData].sort((a, b) => Number(a[aes.x]) - Number(b[aes.x]))
      : groupData

    // Extract y values
    const values = sorted.map(row => Number(row[aes.y]) || 0)

    if (values.length === 0) continue

    // Find min/max
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const minIdx = values.indexOf(minVal)
    const maxIdx = values.indexOf(maxVal)
    const range = maxVal - minVal || 1

    // Get color for this group
    const color = scales.color?.map(groupKey) ?? defaultColor

    // Sample or interpolate values to fit width
    const sparkValues: number[] = []
    if (values.length <= width) {
      sparkValues.push(...values)
    } else {
      // Downsample
      for (let i = 0; i < width; i++) {
        const idx = Math.floor(i * values.length / width)
        sparkValues.push(values[idx])
      }
    }

    // Draw the sparkline
    for (let i = 0; i < sparkValues.length; i++) {
      const val = sparkValues[i]
      const normalized = normalize ? (val - minVal) / range : val / (maxVal || 1)
      const charIdx = Math.min(7, Math.max(0, Math.floor(normalized * 8)))
      const char = sparkType === 'dot' ? '•' : SPARK_CHARS[charIdx]

      const x = plotLeft + i
      const y = currentY

      // Determine color (highlight min/max if enabled)
      let pointColor = color
      if (showMinmax) {
        const origIdx = Math.floor(i * values.length / sparkValues.length)
        if (origIdx === minIdx) pointColor = minColor
        else if (origIdx === maxIdx) pointColor = maxColor
      }

      if (x < plotLeft + width && y >= plotTop && y <= plotBottom) {
        canvas.drawChar(x, y, char, pointColor)
      }
    }

    // Draw label if grouped
    if (groupField && groups.size > 1) {
      const labelX = plotLeft + width + 1
      canvas.drawString(labelX, currentY, groupKey.slice(0, 8), { r: 180, g: 180, b: 180, a: 1 })
    }

    currentY += 2
  }
}

/**
 * Render geom_bullet (bullet chart with target)
 * Stephen Few's compact progress visualization
 */
export function renderGeomBullet(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const width = (geom.params.width as number) ?? 40
  const targetChar = (geom.params.target_char as string) ?? '│'
  const barChar = (geom.params.bar_char as string) ?? '█'
  const rangeChars = (geom.params.range_chars as [string, string, string]) ?? ['░', '▒', '▓']
  const showValues = (geom.params.show_values as boolean) ?? true
  const targetColor = parseColorToRgba(geom.params.target_color ?? '#e74c3c')

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Default colors
  const defaultColors: RGBA[] = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 238, g: 136, b: 102, a: 1 },  // Orange
    { r: 102, g: 204, b: 153, a: 1 },  // Green
  ]

  // Range colors (light to dark gray)
  const rangeColors: RGBA[] = [
    { r: 60, g: 60, b: 60, a: 1 },     // Poor (darkest)
    { r: 90, g: 90, b: 90, a: 1 },     // Satisfactory
    { r: 120, g: 120, b: 120, a: 1 },  // Good (lightest)
  ]

  let currentY = plotTop

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    // Get values
    const label = aes.x ? String(row[aes.x]).slice(0, 10) : `Item ${i + 1}`
    const value = Number(row[aes.y]) || 0
    const target = Number(row['target']) || null
    const maxValue = Number(row['max']) || Math.max(value, target || 0) * 1.2

    // Get ranges if specified (default: 60%, 80%, 100% of max)
    const ranges = row['ranges'] as number[] ?? [maxValue * 0.6, maxValue * 0.8, maxValue]

    const color = scales.color?.map(label) ?? defaultColors[i % defaultColors.length]

    // Draw label
    const labelWidth = 12
    canvas.drawString(plotLeft, currentY, label.padEnd(labelWidth), { r: 180, g: 180, b: 180, a: 1 })

    const barStart = plotLeft + labelWidth
    const barWidth = Math.min(width, scales.x.range[1] - barStart - (showValues ? 8 : 0))

    // Draw background ranges
    for (let r = ranges.length - 1; r >= 0; r--) {
      const rangeWidth = Math.round((ranges[r] / maxValue) * barWidth)
      for (let x = 0; x < rangeWidth; x++) {
        if (barStart + x <= scales.x.range[1]) {
          canvas.drawChar(barStart + x, currentY, rangeChars[r], rangeColors[r])
        }
      }
    }

    // Draw actual value bar
    const valueWidth = Math.round((value / maxValue) * barWidth)
    for (let x = 0; x < valueWidth; x++) {
      if (barStart + x <= scales.x.range[1]) {
        canvas.drawChar(barStart + x, currentY, barChar, color)
      }
    }

    // Draw target marker
    if (target !== null) {
      const targetX = barStart + Math.round((target / maxValue) * barWidth)
      if (targetX >= barStart && targetX <= barStart + barWidth) {
        canvas.drawChar(targetX, currentY, targetChar, targetColor)
      }
    }

    // Draw value label
    if (showValues) {
      const valueStr = value.toFixed(0)
      canvas.drawString(barStart + barWidth + 2, currentY, valueStr, { r: 180, g: 180, b: 180, a: 1 })
    }

    currentY += 2
    if (currentY > plotBottom) break
  }
}

/**
 * Render geom_braille (high-resolution braille plot)
 * Uses Unicode braille patterns for 8x resolution
 */
export function renderGeomBraille(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const brailleType = (geom.params.brailleType as string) ?? 'point'
  const fill = (geom.params.fill as boolean) ?? false
  const alpha = (geom.params.alpha as number) ?? 1

  // Braille constants
  const BRAILLE_BASE = 0x2800
  // Dot positions: [col][row] -> bit
  // Each cell is 2 cols x 4 rows
  const DOTS: number[][] = [
    [0x01, 0x02, 0x04, 0x40], // Left column
    [0x08, 0x10, 0x20, 0x80], // Right column
  ]

  // Get plot area boundaries
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  // Create braille buffer (each cell is 2x4 dots)
  const brailleWidth = plotWidth
  const brailleHeight = plotHeight
  const buffer: number[][] = []
  for (let y = 0; y < brailleHeight; y++) {
    buffer[y] = new Array(brailleWidth).fill(0)
  }

  // Default color
  const defaultColor: RGBA = { r: 79, g: 169, b: 238, a: 1 }
  const color = geom.params.color
    ? parseColorToRgba(geom.params.color)
    : defaultColor

  // Apply alpha
  const finalColor: RGBA = alpha < 1
    ? { ...color, a: alpha }
    : color

  // Sort data by x for line drawing
  const sorted = aes.x
    ? [...data].sort((a, b) => Number(a[aes.x]) - Number(b[aes.x]))
    : data

  // Set dots in the buffer
  const setDot = (canvasX: number, canvasY: number) => {
    // Convert canvas coordinates to braille sub-coordinates
    // Each character cell = 2 dots wide x 4 dots tall
    const subX = (canvasX - plotLeft) * 2
    const subY = (canvasY - plotTop) * 4

    // Calculate which character cell and which dot within it
    const cellX = Math.floor(subX / 2)
    const cellY = Math.floor(subY / 4)
    const dotCol = subX % 2
    const dotRow = subY % 4

    if (cellX >= 0 && cellX < brailleWidth && cellY >= 0 && cellY < brailleHeight) {
      if (dotCol >= 0 && dotCol < 2 && dotRow >= 0 && dotRow < 4) {
        buffer[cellY][cellX] |= DOTS[dotCol][dotRow]
      }
    }
  }

  // Plot points
  let prevCx: number | null = null
  let prevCy: number | null = null

  for (const row of sorted) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      prevCx = null
      prevCy = null
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    if (brailleType === 'line' && prevCx !== null && prevCy !== null) {
      // Draw line between points using Bresenham's algorithm
      const dx = Math.abs(cx - prevCx)
      const dy = Math.abs(cy - prevCy)
      const sx = prevCx < cx ? 1 : -1
      const sy = prevCy < cy ? 1 : -1
      let err = dx - dy
      let x: number = prevCx
      let y: number = prevCy

      while (true) {
        if (x >= plotLeft && x < plotRight && y >= plotTop && y < plotBottom) {
          setDot(x, y)
          if (fill) {
            // Fill down to bottom
            for (let fy = y; fy < plotBottom; fy++) {
              setDot(x, fy)
            }
          }
        }

        if (x === cx && y === cy) break
        const e2 = 2 * err
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    } else {
      // Just plot the point
      if (cx >= plotLeft && cx < plotRight && cy >= plotTop && cy < plotBottom) {
        setDot(cx, cy)
      }
    }

    prevCx = cx
    prevCy = cy
  }

  // Render the buffer to canvas
  for (let y = 0; y < brailleHeight; y++) {
    for (let x = 0; x < brailleWidth; x++) {
      if (buffer[y][x] > 0) {
        const char = String.fromCharCode(BRAILLE_BASE + buffer[y][x])
        canvas.drawChar(plotLeft + x, plotTop + y, char, finalColor)
      }
    }
  }
}

/**
 * Render geom_calendar (GitHub-style contribution heatmap)
 */
export function renderGeomCalendar(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const cellChar = (geom.params.cell_char as string) ?? '█'
  const emptyColor = parseColorToRgba(geom.params.empty_color ?? '#161b22')
  const fillColor = parseColorToRgba(geom.params.fill_color ?? '#39d353')
  const levels = (geom.params.levels as number) ?? 5
  const showDays = (geom.params.show_days as boolean) ?? true
  const showMonths = (geom.params.show_months as boolean) ?? true
  const weekStart = (geom.params.week_start as number) ?? 0

  // Parse dates and values
  const dateField = aes.x
  const valueField = aes.fill || aes.y || 'value'

  const entries: { date: Date; value: number }[] = []
  let minValue = Infinity
  let maxValue = -Infinity

  for (const row of data) {
    const dateVal = row[dateField]
    const val = Number(row[valueField]) || 0

    let date: Date
    if (dateVal instanceof Date) {
      date = dateVal
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      date = new Date(dateVal)
    } else {
      continue
    }

    if (isNaN(date.getTime())) continue

    entries.push({ date, value: val })
    if (val < minValue) minValue = val
    if (val > maxValue) maxValue = val
  }

  if (entries.length === 0) return

  // Sort by date
  entries.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Find date range
  const startDate = new Date(entries[0].date)
  const endDate = new Date(entries[entries.length - 1].date)

  // Adjust start to beginning of week
  startDate.setDate(startDate.getDate() - ((startDate.getDay() - weekStart + 7) % 7))

  // Build date -> value map
  const valueMap = new Map<string, number>()
  for (const entry of entries) {
    const key = entry.date.toISOString().slice(0, 10)
    valueMap.set(key, (valueMap.get(key) || 0) + entry.value)
  }

  // Get plot area
  const plotLeft = Math.round(scales.x.range[0])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))

  // Day labels
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Calculate weeks
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 7
  const numWeeks = Math.ceil(totalDays / 7)

  // Interpolate color
  const getColor = (value: number): RGBA => {
    if (value === 0 || maxValue === minValue) return emptyColor
    const t = Math.min(1, Math.max(0, (value - minValue) / (maxValue - minValue)))
    const level = Math.floor(t * (levels - 1))
    const levelT = level / (levels - 1)
    return {
      r: Math.round(emptyColor.r + (fillColor.r - emptyColor.r) * levelT),
      g: Math.round(emptyColor.g + (fillColor.g - emptyColor.g) * levelT),
      b: Math.round(emptyColor.b + (fillColor.b - emptyColor.b) * levelT),
      a: 1,
    }
  }

  // Render day labels
  const xOffset = showDays ? 3 : 0
  const yOffset = showMonths ? 2 : 0

  if (showDays) {
    for (let d = 0; d < 7; d++) {
      const dayIndex = (d + weekStart) % 7
      const y = plotTop + yOffset + d
      canvas.drawChar(plotLeft, y, dayLabels[dayIndex], { r: 128, g: 128, b: 128, a: 1 })
    }
  }

  // Render weeks
  let lastMonth = -1
  const currentDate = new Date(startDate)

  for (let week = 0; week < numWeeks; week++) {
    const x = plotLeft + xOffset + week * 2

    // Month label
    if (showMonths && currentDate.getMonth() !== lastMonth) {
      const monthLabel = monthLabels[currentDate.getMonth()]
      for (let i = 0; i < monthLabel.length; i++) {
        canvas.drawChar(x + i, plotTop, monthLabel[i], { r: 128, g: 128, b: 128, a: 1 })
      }
      lastMonth = currentDate.getMonth()
    }

    // Render days in this week
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(currentDate)
      dayDate.setDate(dayDate.getDate() + day)

      if (dayDate > endDate) break

      const key = dayDate.toISOString().slice(0, 10)
      const value = valueMap.get(key) || 0
      const color = getColor(value)
      const y = plotTop + yOffset + day

      canvas.drawChar(x, y, cellChar, color)
    }

    currentDate.setDate(currentDate.getDate() + 7)
  }
}

/**
 * Render geom_flame (flame graph / icicle chart)
 */
export function renderGeomFlame(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const style = (geom.params.style as string) ?? 'flame'
  const palette = (geom.params.palette as string) ?? 'warm'
  const showLabels = (geom.params.show_labels as boolean) ?? true
  const minLabelWidth = (geom.params.min_label_width as number) ?? 10
  const barChar = (geom.params.bar_char as string) ?? '█'

  // Get plot area
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))
  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  // Extract frame data
  const nameField = aes.x || 'name'
  const valueField = aes.fill || 'value'
  const depthField = aes.y || 'depth'
  const startField = 'start'

  interface Frame {
    name: string
    value: number
    depth: number
    start: number
    width: number
  }

  // Parse frames
  const frames: Frame[] = []
  let totalValue = 0
  let maxDepth = 0

  for (const row of data) {
    const name = String(row[nameField] || '')
    const value = Number(row[valueField]) || 0
    const depth = Number(row[depthField]) || 0
    const start = row[startField] !== undefined ? Number(row[startField]) : -1

    frames.push({ name, value, depth, start, width: 0 })
    if (depth === 0) totalValue += value
    if (depth > maxDepth) maxDepth = depth
  }

  if (totalValue === 0) return

  // Calculate widths (as fraction of total)
  for (const frame of frames) {
    frame.width = (frame.value / totalValue) * plotWidth
  }

  // Sort by depth, then by start position
  frames.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth
    if (a.start !== b.start) return a.start - b.start
    return a.name.localeCompare(b.name)
  })

  // Compute start positions if not provided
  const depthOffsets: number[] = new Array(maxDepth + 1).fill(0)
  for (const frame of frames) {
    if (frame.start < 0) {
      frame.start = depthOffsets[frame.depth]
    }
    depthOffsets[frame.depth] = frame.start + frame.width
  }

  // Color palettes
  const getPaletteColor = (name: string): RGBA => {
    // Hash the name for consistent colors
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i)
      hash = hash & hash
    }
    const hue = Math.abs(hash) % 360

    // Convert palette preference to hue range
    let h: number
    if (palette === 'warm') {
      h = (hue % 60) + 0 // 0-60 (red to yellow)
    } else if (palette === 'cool') {
      h = (hue % 60) + 180 // 180-240 (cyan to blue)
    } else {
      h = (hue % 40) + 10 // 10-50 (orange to yellow)
    }

    // HSL to RGB (simplified)
    const s = 0.7
    const l = 0.5
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2

    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1,
    }
  }

  // Render frames
  const rowHeight = Math.max(1, Math.floor(plotHeight / (maxDepth + 1)))

  for (const frame of frames) {
    const x1 = plotLeft + Math.round(frame.start)
    const x2 = plotLeft + Math.round(frame.start + frame.width)
    const width = x2 - x1

    if (width < 1) continue

    // Y position based on style
    let y: number
    if (style === 'icicle') {
      y = plotTop + frame.depth * rowHeight
    } else {
      y = plotBottom - (frame.depth + 1) * rowHeight
    }

    const color = getPaletteColor(frame.name)

    // Draw the bar
    for (let row = 0; row < rowHeight; row++) {
      for (let col = x1; col < x2; col++) {
        if (col >= plotLeft && col < plotRight && y + row >= plotTop && y + row < plotBottom) {
          canvas.drawChar(col, y + row, barChar, color)
        }
      }
    }

    // Draw label if wide enough
    if (showLabels && width >= minLabelWidth) {
      const label = frame.name.slice(0, width - 2)
      const labelX = x1 + 1
      const labelY = y + Math.floor(rowHeight / 2)

      // Contrasting text color
      const textColor: RGBA = { r: 255, g: 255, b: 255, a: 1 }

      for (let i = 0; i < label.length; i++) {
        if (labelX + i < x2 - 1) {
          canvas.drawChar(labelX + i, labelY, label[i], textColor)
        }
      }
    }
  }
}

/**
 * Render geom_corrmat (correlation matrix heatmap)
 */
export function renderGeomCorrmat(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const showValues = (geom.params.show_values as boolean) ?? true
  const decimals = (geom.params.decimals as number) ?? 2
  const positiveColor = parseColorToRgba(geom.params.positive_color ?? '#2166ac')
  const negativeColor = parseColorToRgba(geom.params.negative_color ?? '#b2182b')
  const neutralColor = parseColorToRgba(geom.params.neutral_color ?? '#f7f7f7')
  const lowerTriangle = (geom.params.lower_triangle as boolean) ?? false
  const upperTriangle = (geom.params.upper_triangle as boolean) ?? false

  // Get plot area
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Extract correlation data
  const xField = aes.x || 'var1'
  const yField = aes.y || 'var2'
  const valueField = aes.fill || 'correlation'

  // Get unique variables
  const xVars = new Set<string>()
  const yVars = new Set<string>()
  const corrMap = new Map<string, number>()

  for (const row of data) {
    const x = String(row[xField] || '')
    const y = String(row[yField] || '')
    const r = Number(row[valueField]) || 0

    xVars.add(x)
    yVars.add(y)
    corrMap.set(`${x}|${y}`, r)
  }

  const xList = [...xVars]
  const yList = [...yVars]
  const numX = xList.length
  const numY = yList.length

  if (numX === 0 || numY === 0) return

  // Calculate cell size
  const cellWidth = Math.max(4, Math.floor((plotRight - plotLeft) / numX))
  const cellHeight = Math.max(2, Math.floor((plotBottom - plotTop) / numY))

  // Color interpolation for correlation values (-1 to 1)
  const getColor = (r: number): RGBA => {
    const t = (r + 1) / 2 // Map -1..1 to 0..1

    if (t < 0.5) {
      // Negative: interpolate from negative to neutral
      const s = t * 2
      return {
        r: Math.round(negativeColor.r + (neutralColor.r - negativeColor.r) * s),
        g: Math.round(negativeColor.g + (neutralColor.g - negativeColor.g) * s),
        b: Math.round(negativeColor.b + (neutralColor.b - negativeColor.b) * s),
        a: 1,
      }
    } else {
      // Positive: interpolate from neutral to positive
      const s = (t - 0.5) * 2
      return {
        r: Math.round(neutralColor.r + (positiveColor.r - neutralColor.r) * s),
        g: Math.round(neutralColor.g + (positiveColor.g - neutralColor.g) * s),
        b: Math.round(neutralColor.b + (positiveColor.b - neutralColor.b) * s),
        a: 1,
      }
    }
  }

  // Render cells
  for (let i = 0; i < numX; i++) {
    for (let j = 0; j < numY; j++) {
      // Handle triangle options
      if (lowerTriangle && i < j) continue
      if (upperTriangle && i > j) continue

      const x = xList[i]
      const y = yList[j]
      const key = `${x}|${y}`
      const r = corrMap.get(key) ?? corrMap.get(`${y}|${x}`) ?? (i === j ? 1 : 0)

      const color = getColor(r)
      const cellX = plotLeft + i * cellWidth
      const cellY = plotTop + j * cellHeight

      // Fill cell
      for (let cy = 0; cy < cellHeight; cy++) {
        for (let cx = 0; cx < cellWidth; cx++) {
          if (cellX + cx < plotRight && cellY + cy < plotBottom) {
            canvas.drawChar(cellX + cx, cellY + cy, '█', color)
          }
        }
      }

      // Draw value
      if (showValues && cellWidth >= 4) {
        const valueStr = r.toFixed(decimals)
        const textX = cellX + Math.floor((cellWidth - valueStr.length) / 2)
        const textY = cellY + Math.floor(cellHeight / 2)

        // Contrasting text color
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
        const textColor: RGBA = brightness > 128
          ? { r: 0, g: 0, b: 0, a: 1 }
          : { r: 255, g: 255, b: 255, a: 1 }

        for (let k = 0; k < valueStr.length; k++) {
          if (textX + k < cellX + cellWidth && textX + k < plotRight) {
            canvas.drawChar(textX + k, textY, valueStr[k], textColor)
          }
        }
      }
    }
  }
}

/**
 * Render a Sankey flow diagram
 */
export function renderGeomSankey(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const nodeWidth = (geom.params.node_width as number) ?? 3
  const nodePadding = (geom.params.node_padding as number) ?? 2
  const nodeChar = (geom.params.node_char as string) ?? '█'
  const showLabels = (geom.params.show_labels as boolean) ?? true
  const showValues = (geom.params.show_values as boolean) ?? false
  const minFlowWidth = (geom.params.min_flow_width as number) ?? 1

  // Get plot area
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))
  const plotHeight = plotBottom - plotTop

  // Extract flow data - use x for source, y for target, fill for value
  const sourceField = aes.x || 'source'
  const targetField = aes.y || 'target'
  const valueField = aes.fill || 'value'

  // Node type definition
  type SankeyNode = { name: string; value: number; column: number; y: number; height: number }

  // Build node and link structures
  const nodes = new Map<string, SankeyNode>()
  const links: { source: string; target: string; value: number }[] = []
  const sourceNodes = new Set<string>()
  const targetNodes = new Set<string>()

  for (const row of data) {
    const source = String(row[sourceField] ?? '')
    const target = String(row[targetField] ?? '')
    const value = Number(row[valueField]) || 0

    if (!source || !target) continue

    sourceNodes.add(source)
    targetNodes.add(target)
    links.push({ source, target, value })

    // Track total flow through each node
    if (!nodes.has(source)) {
      nodes.set(source, { name: source, value: 0, column: 0, y: 0, height: 0 })
    }
    if (!nodes.has(target)) {
      nodes.set(target, { name: target, value: 0, column: 1, y: 0, height: 0 })
    }
    nodes.get(source)!.value += value
    nodes.get(target)!.value += value
  }

  // Determine columns (simple 2-column layout for now)
  // Nodes that are only sources go to column 0, only targets to column 1
  // Nodes that are both stay in column 0
  for (const [name, node] of nodes) {
    if (sourceNodes.has(name) && !targetNodes.has(name)) {
      node.column = 0
    } else if (targetNodes.has(name) && !sourceNodes.has(name)) {
      node.column = 1
    } else {
      // Both source and target - put in middle
      node.column = 0
    }
  }

  // Group nodes by column
  const columns: SankeyNode[][] = [[], []]
  for (const [, node] of nodes) {
    if (!columns[node.column]) columns[node.column] = []
    columns[node.column].push(node)
  }

  // Calculate total value for scaling
  const maxColumnValue = Math.max(
    columns[0]?.reduce((sum, n) => sum + n.value, 0) || 0,
    columns[1]?.reduce((sum, n) => sum + n.value, 0) || 0
  )

  if (maxColumnValue === 0) return

  // Position nodes vertically within columns
  const availableHeight = plotHeight - (nodePadding * Math.max(columns[0]?.length || 0, columns[1]?.length || 0))

  for (let col = 0; col < 2; col++) {
    if (!columns[col]) continue
    let currentY = plotTop

    // Sort by value (largest first)
    columns[col].sort((a, b) => b.value - a.value)

    for (const node of columns[col]) {
      node.height = Math.max(1, Math.round((node.value / maxColumnValue) * availableHeight))
      node.y = currentY
      currentY += node.height + nodePadding
    }
  }

  // Get colors for nodes
  const colorPalette = [
    { r: 79, g: 169, b: 238, a: 1 },   // Blue
    { r: 240, g: 128, b: 60, a: 1 },   // Orange
    { r: 102, g: 194, b: 114, a: 1 },  // Green
    { r: 218, g: 98, b: 125, a: 1 },   // Pink
    { r: 169, g: 140, b: 204, a: 1 },  // Purple
    { r: 255, g: 204, b: 102, a: 1 },  // Yellow
  ]

  const nodeColors = new Map<string, RGBA>()
  let colorIdx = 0
  for (const [name] of nodes) {
    nodeColors.set(name, colorPalette[colorIdx % colorPalette.length])
    colorIdx++
  }

  // Calculate column x positions
  const labelSpace = showLabels ? 8 : 0
  const col0X = plotLeft + labelSpace
  const col1X = plotRight - nodeWidth - labelSpace

  // Draw nodes
  for (const [name, node] of nodes) {
    const x = node.column === 0 ? col0X : col1X
    const color = nodeColors.get(name)!

    // Draw node bar
    for (let dy = 0; dy < node.height; dy++) {
      for (let dx = 0; dx < nodeWidth; dx++) {
        canvas.drawChar(x + dx, node.y + dy, nodeChar, color)
      }
    }

    // Draw label
    if (showLabels) {
      const labelX = node.column === 0 ? x - name.length - 1 : x + nodeWidth + 1
      const labelY = node.y + Math.floor(node.height / 2)
      const labelColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

      for (let i = 0; i < name.length && labelX + i >= plotLeft && labelX + i < plotRight; i++) {
        canvas.drawChar(labelX + i, labelY, name[i], labelColor)
      }
    }
  }

  // Draw flows (simplified - straight lines with varying thickness)
  for (const link of links) {
    const sourceNode = nodes.get(link.source)
    const targetNode = nodes.get(link.target)
    if (!sourceNode || !targetNode) continue

    const flowWidth = Math.max(minFlowWidth, Math.round((link.value / maxColumnValue) * (plotHeight / 4)))
    const sourceColor = nodeColors.get(link.source)!

    // Calculate flow positions
    const x1 = col0X + nodeWidth
    const x2 = col1X
    const y1 = sourceNode.y + Math.floor(sourceNode.height / 2)
    const y2 = targetNode.y + Math.floor(targetNode.height / 2)

    // Draw curved/angled flow using bezier-like steps
    const steps = Math.abs(x2 - x1)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Smooth curve
      const x = Math.round(x1 + (x2 - x1) * t)
      const y = Math.round(y1 + (y2 - y1) * (3 * t * t - 2 * t * t * t)) // Smooth step

      // Draw flow band
      const halfWidth = Math.floor(flowWidth / 2)
      for (let dy = -halfWidth; dy <= halfWidth; dy++) {
        const flowY = y + dy
        if (flowY >= plotTop && flowY < plotBottom && x >= plotLeft && x < plotRight) {
          // Blend with existing - use semi-transparent flow
          const flowColor: RGBA = {
            r: sourceColor.r,
            g: sourceColor.g,
            b: sourceColor.b,
            a: 0.4
          }
          const char = dy === 0 ? '─' : '░'
          canvas.drawChar(x, flowY, char, flowColor)
        }
      }
    }

    // Draw value if requested
    if (showValues) {
      const midX = Math.round((x1 + x2) / 2)
      const midY = Math.round((y1 + y2) / 2)
      const valueStr = String(link.value)
      const textColor: RGBA = { r: 200, g: 200, b: 200, a: 1 }

      for (let i = 0; i < valueStr.length; i++) {
        canvas.drawChar(midX - Math.floor(valueStr.length / 2) + i, midY, valueStr[i], textColor)
      }
    }
  }
}

/**
 * Render a treemap visualization
 */
export function renderGeomTreemap(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  if (data.length === 0) return

  const showLabels = (geom.params.show_labels as boolean) ?? true
  const showValues = (geom.params.show_values as boolean) ?? false
  const border = (geom.params.border as boolean) ?? true
  const minLabelSize = (geom.params.min_label_size as number) ?? 4
  const fillChar = (geom.params.fill_char as string) ?? '█'
  // algorithm param reserved for future use

  // Get plot area
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
  const plotBottom = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

  // Extract data - use x for label/id, y for value, group for parent
  const labelField = aes.x || 'name'
  const valueField = aes.fill || aes.y || 'value'
  const parentField = aes.group || 'parent'
  const idField = aes.x || 'id'

  interface TreeNode {
    id: string
    label: string
    value: number
    parent?: string
    children: TreeNode[]
    x: number
    y: number
    width: number
    height: number
  }

  // Build nodes
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const row of data) {
    const id = String(row[idField] ?? row[labelField] ?? '')
    const label = String(row[labelField] ?? id)
    const value = Number(row[valueField]) || 0
    const parent = row[parentField] ? String(row[parentField]) : undefined

    const node: TreeNode = {
      id,
      label,
      value,
      parent,
      children: [],
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
    nodeMap.set(id, node)
  }

  // Build tree structure
  for (const [, node] of nodeMap) {
    if (node.parent && nodeMap.has(node.parent)) {
      nodeMap.get(node.parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // If no hierarchy, treat all as roots
  if (roots.length === 0) {
    for (const [, node] of nodeMap) {
      roots.push(node)
    }
  }

  // Calculate values (propagate up if needed)
  function calculateValue(node: TreeNode): number {
    if (node.children.length === 0) {
      return node.value
    }
    const childSum = node.children.reduce((sum, child) => sum + calculateValue(child), 0)
    return node.value || childSum
  }

  for (const root of roots) {
    root.value = calculateValue(root)
  }

  // Filter out zero-value nodes and sort by value
  const validRoots = roots.filter(n => n.value > 0).sort((a, b) => b.value - a.value)
  if (validRoots.length === 0) return

  // Squarify algorithm for treemap layout
  function squarify(
    nodes: TreeNode[],
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (nodes.length === 0 || width <= 0 || height <= 0) return

    const totalValue = nodes.reduce((sum, n) => sum + n.value, 0)
    if (totalValue === 0) return

    if (nodes.length === 1) {
      const node = nodes[0]
      node.x = x
      node.y = y
      node.width = width
      node.height = height
      return
    }

    // Simple slice-and-dice based on aspect ratio
    const isHorizontal = width > height

    let currentPos = isHorizontal ? x : y
    const totalSize = isHorizontal ? width : height

    for (const node of nodes) {
      const fraction = node.value / totalValue
      const size = Math.round(totalSize * fraction)

      if (isHorizontal) {
        node.x = currentPos
        node.y = y
        node.width = Math.max(1, size)
        node.height = height
        currentPos += node.width
      } else {
        node.x = x
        node.y = currentPos
        node.width = width
        node.height = Math.max(1, size)
        currentPos += node.height
      }
    }
  }

  // Layout the treemap
  squarify(
    validRoots,
    plotLeft,
    plotTop,
    plotRight - plotLeft,
    plotBottom - plotTop
  )

  // Color palette for treemap cells
  const colorPalette = [
    { r: 66, g: 133, b: 244, a: 1 },   // Blue
    { r: 234, g: 67, b: 53, a: 1 },    // Red
    { r: 251, g: 188, b: 5, a: 1 },    // Yellow
    { r: 52, g: 168, b: 83, a: 1 },    // Green
    { r: 154, g: 102, b: 255, a: 1 },  // Purple
    { r: 255, g: 109, b: 0, a: 1 },    // Orange
    { r: 0, g: 188, b: 212, a: 1 },    // Cyan
    { r: 233, g: 30, b: 99, a: 1 },    // Pink
  ]

  // Render each rectangle
  function renderNode(node: TreeNode, colorIndex: number, depth: number): void {
    if (node.width <= 0 || node.height <= 0) return

    const baseColor = colorPalette[colorIndex % colorPalette.length]
    // Darken based on depth
    const depthFactor = Math.max(0.5, 1 - depth * 0.15)
    const color: RGBA = {
      r: Math.round(baseColor.r * depthFactor),
      g: Math.round(baseColor.g * depthFactor),
      b: Math.round(baseColor.b * depthFactor),
      a: 1,
    }

    // Fill rectangle
    for (let dy = 0; dy < node.height; dy++) {
      for (let dx = 0; dx < node.width; dx++) {
        const px = node.x + dx
        const py = node.y + dy
        if (px >= plotLeft && px < plotRight && py >= plotTop && py < plotBottom) {
          canvas.drawChar(px, py, fillChar, color)
        }
      }
    }

    // Draw border
    if (border && node.width >= 2 && node.height >= 2) {
      const borderColor: RGBA = { r: 40, g: 40, b: 40, a: 1 }

      // Top and bottom borders
      for (let dx = 0; dx < node.width; dx++) {
        const px = node.x + dx
        if (px >= plotLeft && px < plotRight) {
          if (node.y >= plotTop) canvas.drawChar(px, node.y, '─', borderColor)
          if (node.y + node.height - 1 < plotBottom) canvas.drawChar(px, node.y + node.height - 1, '─', borderColor)
        }
      }

      // Left and right borders
      for (let dy = 0; dy < node.height; dy++) {
        const py = node.y + dy
        if (py >= plotTop && py < plotBottom) {
          if (node.x >= plotLeft) canvas.drawChar(node.x, py, '│', borderColor)
          if (node.x + node.width - 1 < plotRight) canvas.drawChar(node.x + node.width - 1, py, '│', borderColor)
        }
      }

      // Corners
      if (node.x >= plotLeft && node.y >= plotTop) canvas.drawChar(node.x, node.y, '┌', borderColor)
      if (node.x + node.width - 1 < plotRight && node.y >= plotTop) canvas.drawChar(node.x + node.width - 1, node.y, '┐', borderColor)
      if (node.x >= plotLeft && node.y + node.height - 1 < plotBottom) canvas.drawChar(node.x, node.y + node.height - 1, '└', borderColor)
      if (node.x + node.width - 1 < plotRight && node.y + node.height - 1 < plotBottom) canvas.drawChar(node.x + node.width - 1, node.y + node.height - 1, '┘', borderColor)
    }

    // Draw label
    if (showLabels && node.width >= minLabelSize && node.height >= 1) {
      const label = node.label.substring(0, node.width - 2)
      const labelX = node.x + 1
      const labelY = node.y + Math.floor(node.height / 2)

      // Contrasting text color
      const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
      const textColor: RGBA = brightness > 128
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 }

      for (let i = 0; i < label.length; i++) {
        const px = labelX + i
        if (px >= plotLeft && px < node.x + node.width - 1 && px < plotRight) {
          canvas.drawChar(px, labelY, label[i], textColor)
        }
      }

      // Draw value below label if requested and there's space
      if (showValues && node.height >= 3) {
        const valueStr = String(node.value)
        const valueY = labelY + 1
        for (let i = 0; i < valueStr.length; i++) {
          const px = labelX + i
          if (px >= plotLeft && px < node.x + node.width - 1 && px < plotRight && valueY < plotBottom) {
            canvas.drawChar(px, valueY, valueStr[i], textColor)
          }
        }
      }
    }

    // Recursively render children
    if (node.children.length > 0) {
      const childrenSorted = [...node.children].sort((a, b) => b.value - a.value)
      squarify(
        childrenSorted,
        node.x + (border ? 1 : 0),
        node.y + (border ? 1 : 0),
        node.width - (border ? 2 : 0),
        node.height - (border ? 2 : 0)
      )
      for (let i = 0; i < childrenSorted.length; i++) {
        renderNode(childrenSorted[i], colorIndex, depth + 1)
      }
    }
  }

  // Render all root nodes
  for (let i = 0; i < validRoots.length; i++) {
    renderNode(validRoots[i], i, 0)
  }
}

/**
 * Render geom_volcano - Volcano plot for differential expression
 */
export function renderGeomVolcano(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const fcThreshold = (geom.params.fc_threshold as number) ?? 1
  const pThreshold = (geom.params.p_threshold as number) ?? 0.05
  const yIsNegLog10 = (geom.params.y_is_neglog10 as boolean) ?? false
  const upColor = parseColorToRgba(geom.params.up_color as string ?? '#e41a1c')
  const downColor = parseColorToRgba(geom.params.down_color as string ?? '#377eb8')
  const nsColor = parseColorToRgba(geom.params.ns_color as string ?? '#999999')
  const showThresholds = (geom.params.show_thresholds as boolean) ?? true
  const nLabels = (geom.params.n_labels as number) ?? 0
  const pointChar = (geom.params.point_char as string) ?? '●'

  // Calculate -log10(p) threshold
  const negLog10PThreshold = -Math.log10(pThreshold)

  // Classify and render each point
  interface ClassifiedPoint {
    row: Record<string, unknown>
    x: number
    y: number
    significance: number  // for sorting top hits
    status: 'up' | 'down' | 'ns'
    label?: string
  }

  const points: ClassifiedPoint[] = []

  for (const row of data) {
    const xVal = Number(row[aes.x])
    let yVal = Number(row[aes.y])

    if (isNaN(xVal) || isNaN(yVal) || yVal <= 0) continue

    // Transform p-value to -log10 if needed
    if (!yIsNegLog10) {
      yVal = -Math.log10(yVal)
    }

    // Classify the point
    let status: 'up' | 'down' | 'ns' = 'ns'
    if (yVal >= negLog10PThreshold) {
      if (xVal >= fcThreshold) {
        status = 'up'
      } else if (xVal <= -fcThreshold) {
        status = 'down'
      }
    }

    const label = aes.label ? String(row[aes.label] ?? '') : undefined

    points.push({
      row,
      x: xVal,
      y: yVal,
      significance: yVal,  // higher -log10(p) = more significant
      status,
      label,
    })
  }

  // Draw threshold lines first (below points)
  if (showThresholds) {
    const thresholdColor: RGBA = { r: 150, g: 150, b: 150, a: 0.7 }

    // Horizontal line at p-value threshold
    const cy = Math.round(scales.y.map(negLog10PThreshold))
    const startX = Math.round(scales.x.range[0])
    const endX = Math.round(scales.x.range[1])

    // Draw dashed horizontal line
    for (let x = startX; x <= endX; x += 2) {
      canvas.drawChar(x, cy, '─', thresholdColor)
    }

    // Vertical lines at fold change thresholds
    const cxPos = Math.round(scales.x.map(fcThreshold))
    const cxNeg = Math.round(scales.x.map(-fcThreshold))
    const startY = Math.round(Math.min(scales.y.range[0], scales.y.range[1]))
    const endY = Math.round(Math.max(scales.y.range[0], scales.y.range[1]))

    // Draw dashed vertical lines
    for (let y = startY; y <= endY; y += 2) {
      canvas.drawChar(cxPos, y, '│', thresholdColor)
      canvas.drawChar(cxNeg, y, '│', thresholdColor)
    }
  }

  // Draw non-significant points first (background)
  for (const point of points) {
    if (point.status === 'ns') {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      canvas.drawPoint(cx, cy, nsColor, pointChar)
    }
  }

  // Draw significant points on top
  for (const point of points) {
    if (point.status !== 'ns') {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      const color = point.status === 'up' ? upColor : downColor
      canvas.drawPoint(cx, cy, color, pointChar)
    }
  }

  // Label top N significant points
  if (nLabels > 0 && aes.label) {
    // Get top hits by significance (highest -log10(p))
    const significantPoints = points
      .filter(p => p.status !== 'ns' && p.label)
      .sort((a, b) => b.significance - a.significance)
      .slice(0, nLabels)

    const labelColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }

    for (const point of significantPoints) {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      const label = point.label!

      // Position label to the right of the point
      const labelX = cx + 1
      const labelY = cy

      for (let i = 0; i < label.length; i++) {
        canvas.drawChar(labelX + i, labelY, label[i], labelColor)
      }
    }
  }
}

/**
 * Render geom_ma - MA plot for differential expression
 */
export function renderGeomMA(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const fcThreshold = (geom.params.fc_threshold as number) ?? 1
  const pThreshold = (geom.params.p_threshold as number) ?? 0.05
  const pCol = geom.params.p_col as string | undefined
  const xIsLog2 = (geom.params.x_is_log2 as boolean) ?? false
  const upColor = parseColorToRgba(geom.params.up_color as string ?? '#e41a1c')
  const downColor = parseColorToRgba(geom.params.down_color as string ?? '#377eb8')
  const nsColor = parseColorToRgba(geom.params.ns_color as string ?? '#999999')
  const showBaseline = (geom.params.show_baseline as boolean) ?? true
  const showThresholds = (geom.params.show_thresholds as boolean) ?? true
  const nLabels = (geom.params.n_labels as number) ?? 0
  const pointChar = (geom.params.point_char as string) ?? '●'

  // Classify and render each point
  interface ClassifiedPoint {
    row: Record<string, unknown>
    x: number  // A value (average expression)
    y: number  // M value (log fold change)
    absM: number  // for sorting top hits
    status: 'up' | 'down' | 'ns'
    label?: string
  }

  const points: ClassifiedPoint[] = []

  for (const row of data) {
    let xVal = Number(row[aes.x])
    const yVal = Number(row[aes.y])  // M value (log2 fold change)

    if (isNaN(xVal) || isNaN(yVal)) continue
    if (xVal <= 0) continue  // Can't log transform non-positive values

    // Transform A value to log2 if needed
    if (!xIsLog2) {
      xVal = Math.log2(xVal)
    }

    // Classify the point
    let status: 'up' | 'down' | 'ns' = 'ns'

    // Check if passes fold change threshold
    const passesFcThreshold = Math.abs(yVal) >= fcThreshold

    // Check p-value if column specified
    let passesPThreshold = true
    if (pCol && row[pCol] !== undefined) {
      const pVal = Number(row[pCol])
      passesPThreshold = !isNaN(pVal) && pVal < pThreshold
    }

    if (passesFcThreshold && passesPThreshold) {
      status = yVal > 0 ? 'up' : 'down'
    }

    const label = aes.label ? String(row[aes.label] ?? '') : undefined

    points.push({
      row,
      x: xVal,
      y: yVal,
      absM: Math.abs(yVal),
      status,
      label,
    })
  }

  // Draw reference lines first (below points)
  const lineColor: RGBA = { r: 150, g: 150, b: 150, a: 0.7 }
  const startX = Math.round(scales.x.range[0])
  const endX = Math.round(scales.x.range[1])

  // Baseline at M=0
  if (showBaseline) {
    const cy = Math.round(scales.y.map(0))
    for (let x = startX; x <= endX; x++) {
      canvas.drawChar(x, cy, '─', lineColor)
    }
  }

  // Threshold lines at ±fc_threshold
  if (showThresholds) {
    const cyUp = Math.round(scales.y.map(fcThreshold))
    const cyDown = Math.round(scales.y.map(-fcThreshold))

    // Draw dashed horizontal lines
    for (let x = startX; x <= endX; x += 2) {
      canvas.drawChar(x, cyUp, '─', lineColor)
      canvas.drawChar(x, cyDown, '─', lineColor)
    }
  }

  // Draw non-significant points first (background)
  for (const point of points) {
    if (point.status === 'ns') {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      canvas.drawPoint(cx, cy, nsColor, pointChar)
    }
  }

  // Draw significant points on top
  for (const point of points) {
    if (point.status !== 'ns') {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      const color = point.status === 'up' ? upColor : downColor
      canvas.drawPoint(cx, cy, color, pointChar)
    }
  }

  // Label top N significant points
  if (nLabels > 0 && aes.label) {
    // Get top hits by absolute M value (highest fold change)
    const significantPoints = points
      .filter(p => p.status !== 'ns' && p.label)
      .sort((a, b) => b.absM - a.absM)
      .slice(0, nLabels)

    const labelColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }

    for (const point of significantPoints) {
      const cx = Math.round(scales.x.map(point.x))
      const cy = Math.round(scales.y.map(point.y))
      const label = point.label!

      // Position label to the right of the point
      const labelX = cx + 1
      const labelY = cy

      for (let i = 0; i < label.length; i++) {
        canvas.drawChar(labelX + i, labelY, label[i], labelColor)
      }
    }
  }
}

/**
 * Render Manhattan plot for GWAS data
 */
function renderGeomManhattan(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const suggestiveThreshold = Number(params.suggestive_threshold ?? 1e-5)
  const genomeWideThreshold = Number(params.genome_wide_threshold ?? 5e-8)
  const yIsNegLog10 = Boolean(params.y_is_neglog10 ?? false)
  const chrColors = (params.chr_colors ?? ['#1f78b4', '#a6cee3']) as string[]
  const highlightColor = String(params.highlight_color ?? '#e41a1c')
  const suggestiveColor = String(params.suggestive_color ?? '#ff7f00')
  const showThresholds = Boolean(params.show_thresholds ?? true)
  const nLabels = Number(params.n_labels ?? 0)
  const pointChar = String(params.point_char ?? '●')
  const chrGap = Number(params.chr_gap ?? 0.02)

  if (!Array.isArray(data) || data.length === 0) return

  // Parse colors
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }

  const chrColorsParsed = chrColors.map((c) => parseHex(c))
  const highlightColorParsed = parseHex(highlightColor)
  const suggestiveColorParsed = parseHex(suggestiveColor)

  // Calculate -log10 thresholds for drawing lines
  const suggestiveLine = -Math.log10(suggestiveThreshold)
  const genomeWideLine = -Math.log10(genomeWideThreshold)

  // Process data: get chromosome and position info
  const xField = aes.x as string
  const yField = aes.y as string
  const labelField = aes.label as string | undefined

  // Group data by chromosome to assign cumulative positions
  interface ProcessedPoint {
    chr: string | number
    pos: number
    pval: number
    negLogP: number
    cumPos: number
    label?: string
    chrIndex: number
  }

  const points: ProcessedPoint[] = []
  const chrMap = new Map<string | number, ProcessedPoint[]>()

  for (const row of data) {
    // Try to extract chromosome - could be in color aesthetic or x contains "chr:pos" format
    let chr: string | number
    let pos: number
    const rawX = row[xField]
    const rawY = row[yField]

    // Check if x contains chromosome info (e.g., "1:12345" or just position)
    if (typeof rawX === 'string' && rawX.includes(':')) {
      const parts = rawX.split(':')
      chr = parts[0]
      pos = parseFloat(parts[1])
    } else {
      // Use color field as chromosome if available
      chr = aes.color ? String(row[aes.color as string] ?? '1') : '1'
      pos = typeof rawX === 'number' ? rawX : parseFloat(String(rawX))
    }

    const pval = typeof rawY === 'number' ? rawY : parseFloat(String(rawY))
    if (isNaN(pos) || isNaN(pval) || pval <= 0) continue

    const negLogP = yIsNegLog10 ? pval : -Math.log10(pval)
    const label = labelField ? String(row[labelField] ?? '') : undefined

    const point: ProcessedPoint = {
      chr,
      pos,
      pval: yIsNegLog10 ? Math.pow(10, -pval) : pval,
      negLogP,
      cumPos: 0,
      label,
      chrIndex: 0,
    }

    if (!chrMap.has(chr)) {
      chrMap.set(chr, [])
    }
    chrMap.get(chr)!.push(point)
    points.push(point)
  }

  if (points.length === 0) return

  // Sort chromosomes naturally (1, 2, ... 22, X, Y)
  const chrOrder = Array.from(chrMap.keys()).sort((a, b) => {
    const aNum = parseInt(String(a).replace(/^chr/i, ''))
    const bNum = parseInt(String(b).replace(/^chr/i, ''))
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    if (!isNaN(aNum)) return -1
    if (!isNaN(bNum)) return 1
    return String(a).localeCompare(String(b))
  })

  // Calculate cumulative positions
  let cumOffset = 0
  const chrOffsets = new Map<string | number, number>()

  for (let i = 0; i < chrOrder.length; i++) {
    const chr = chrOrder[i]
    chrOffsets.set(chr, cumOffset)

    const chrPoints = chrMap.get(chr)!
    const maxPos = Math.max(...chrPoints.map(p => p.pos))

    for (const point of chrPoints) {
      point.cumPos = cumOffset + point.pos
      point.chrIndex = i
    }

    cumOffset += maxPos * (1 + chrGap)
  }

  // Find data ranges
  const minX = Math.min(...points.map(p => p.cumPos))
  const maxX = Math.max(...points.map(p => p.cumPos))
  const minY = 0
  const maxY = Math.max(...points.map(p => p.negLogP)) * 1.1

  // Create local scale mappers using scales range
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const mapX = (v: number) => plotLeft + ((v - minX) / (maxX - minX)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - ((v - minY) / (maxY - minY)) * (plotBottom - plotTop)

  // Draw threshold lines
  if (showThresholds) {
    const lineColor: RGBA = { r: 150, g: 150, b: 150, a: 1 }

    // Suggestive threshold
    if (suggestiveLine <= maxY) {
      const sy = Math.round(mapY(suggestiveLine))
      for (let x = plotLeft; x <= plotRight; x += 2) {
        canvas.drawChar(x, sy, '─', lineColor)
      }
    }

    // Genome-wide threshold
    if (genomeWideLine <= maxY) {
      const gy = Math.round(mapY(genomeWideLine))
      for (let x = plotLeft; x <= plotRight; x += 2) {
        canvas.drawChar(x, gy, '─', highlightColorParsed)
      }
    }
  }

  // Draw points by significance level
  // First pass: non-significant points
  for (const point of points) {
    if (point.pval >= suggestiveThreshold) {
      const cx = Math.round(mapX(point.cumPos))
      const cy = Math.round(mapY(point.negLogP))
      const color = chrColorsParsed[point.chrIndex % chrColorsParsed.length]
      canvas.drawPoint(cx, cy, color, pointChar)
    }
  }

  // Second pass: suggestive points
  for (const point of points) {
    if (point.pval < suggestiveThreshold && point.pval >= genomeWideThreshold) {
      const cx = Math.round(mapX(point.cumPos))
      const cy = Math.round(mapY(point.negLogP))
      canvas.drawPoint(cx, cy, suggestiveColorParsed, pointChar)
    }
  }

  // Third pass: genome-wide significant points
  for (const point of points) {
    if (point.pval < genomeWideThreshold) {
      const cx = Math.round(mapX(point.cumPos))
      const cy = Math.round(mapY(point.negLogP))
      canvas.drawPoint(cx, cy, highlightColorParsed, pointChar)
    }
  }

  // Label top N significant points
  if (nLabels > 0) {
    const labelColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }
    const topPoints = points
      .filter(p => p.label && p.pval < suggestiveThreshold)
      .sort((a, b) => a.pval - b.pval)
      .slice(0, nLabels)

    for (const point of topPoints) {
      const cx = Math.round(mapX(point.cumPos))
      const cy = Math.round(mapY(point.negLogP))
      const label = point.label!

      for (let i = 0; i < label.length; i++) {
        canvas.drawChar(cx + 1 + i, cy, label[i], labelColor)
      }
    }
  }
}

/**
 * Render heatmap with optional clustering
 */
function renderGeomHeatmap(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const valueCol = String(params.value_col ?? 'value')
  const lowColor = String(params.low_color ?? '#313695')
  const midColor = String(params.mid_color ?? '#ffffbf')
  const highColor = String(params.high_color ?? '#a50026')
  const naColor = String(params.na_color ?? '#808080')
  const clusterRows = Boolean(params.cluster_rows ?? false)
  const clusterCols = Boolean(params.cluster_cols ?? false)
  const showRowLabels = Boolean(params.show_row_labels ?? true)
  const showColLabels = Boolean(params.show_col_labels ?? true)
  const cellChar = String(params.cell_char ?? '█')
  const scaleMethod = String(params.scale ?? 'none') as 'none' | 'row' | 'column'

  if (!Array.isArray(data) || data.length === 0) return

  const xField = typeof aes.x === 'string' ? aes.x : 'x'
  const yField = typeof aes.y === 'string' ? aes.y : 'y'
  const fillField = typeof aes.fill === 'string' ? aes.fill : valueCol

  // Parse colors
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }

  const lowRgb = parseHex(lowColor)
  const midRgb = parseHex(midColor)
  const highRgb = parseHex(highColor)
  const naRgb = parseHex(naColor)

  // Build matrix from data
  const rowSet = new Set<string>()
  const colSet = new Set<string>()
  const valueMap = new Map<string, number>()

  for (const row of data) {
    const rowKey = String(row[yField as keyof typeof row] ?? '')
    const colKey = String(row[xField as keyof typeof row] ?? '')
    const val = row[fillField as keyof typeof row]

    if (rowKey && colKey) {
      rowSet.add(rowKey)
      colSet.add(colKey)
      if (typeof val === 'number' && !isNaN(val)) {
        valueMap.set(`${rowKey}|${colKey}`, val)
      }
    }
  }

  let rowKeys = Array.from(rowSet)
  let colKeys = Array.from(colSet)

  if (rowKeys.length === 0 || colKeys.length === 0) return

  // Simple hierarchical clustering (complete linkage)
  const clusterOrder = (keys: string[], getDistance: (a: string, b: string) => number): string[] => {
    if (keys.length <= 2) return keys

    // Build distance matrix and do greedy clustering
    const remaining = [...keys]
    const result: string[] = []

    // Start with the item that has minimum average distance to others
    let minAvg = Infinity
    let startIdx = 0
    for (let i = 0; i < remaining.length; i++) {
      let sum = 0
      for (let j = 0; j < remaining.length; j++) {
        if (i !== j) sum += getDistance(remaining[i], remaining[j])
      }
      const avg = sum / (remaining.length - 1)
      if (avg < minAvg) {
        minAvg = avg
        startIdx = i
      }
    }

    result.push(remaining.splice(startIdx, 1)[0])

    // Greedily add closest item
    while (remaining.length > 0) {
      let minDist = Infinity
      let minIdx = 0
      for (let i = 0; i < remaining.length; i++) {
        const dist = getDistance(result[result.length - 1], remaining[i])
        if (dist < minDist) {
          minDist = dist
          minIdx = i
        }
      }
      result.push(remaining.splice(minIdx, 1)[0])
    }

    return result
  }

  // Clustering
  if (clusterRows) {
    const rowDistance = (a: string, b: string): number => {
      let sum = 0
      let count = 0
      for (const col of colKeys) {
        const va = valueMap.get(`${a}|${col}`)
        const vb = valueMap.get(`${b}|${col}`)
        if (va !== undefined && vb !== undefined) {
          sum += (va - vb) ** 2
          count++
        }
      }
      return count > 0 ? Math.sqrt(sum / count) : Infinity
    }
    rowKeys = clusterOrder(rowKeys, rowDistance)
  }

  if (clusterCols) {
    const colDistance = (a: string, b: string): number => {
      let sum = 0
      let count = 0
      for (const row of rowKeys) {
        const va = valueMap.get(`${row}|${a}`)
        const vb = valueMap.get(`${row}|${b}`)
        if (va !== undefined && vb !== undefined) {
          sum += (va - vb) ** 2
          count++
        }
      }
      return count > 0 ? Math.sqrt(sum / count) : Infinity
    }
    colKeys = clusterOrder(colKeys, colDistance)
  }

  // Get value range
  const values = Array.from(valueMap.values())
  let minVal = Math.min(...values)
  let maxVal = Math.max(...values)
  // midpoint is available via params.midpoint if needed for asymmetric color scales

  // Scale data if requested
  const scaledValues = new Map<string, number>()
  if (scaleMethod === 'row') {
    for (const rowKey of rowKeys) {
      const rowVals = colKeys.map(c => valueMap.get(`${rowKey}|${c}`)).filter((v): v is number => v !== undefined)
      if (rowVals.length > 0) {
        const mean = rowVals.reduce((a, b) => a + b, 0) / rowVals.length
        const std = Math.sqrt(rowVals.reduce((a, b) => a + (b - mean) ** 2, 0) / rowVals.length) || 1
        for (const colKey of colKeys) {
          const v = valueMap.get(`${rowKey}|${colKey}`)
          if (v !== undefined) {
            scaledValues.set(`${rowKey}|${colKey}`, (v - mean) / std)
          }
        }
      }
    }
  } else if (scaleMethod === 'column') {
    for (const colKey of colKeys) {
      const colVals = rowKeys.map(r => valueMap.get(`${r}|${colKey}`)).filter((v): v is number => v !== undefined)
      if (colVals.length > 0) {
        const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length
        const std = Math.sqrt(colVals.reduce((a, b) => a + (b - mean) ** 2, 0) / colVals.length) || 1
        for (const rowKey of rowKeys) {
          const v = valueMap.get(`${rowKey}|${colKey}`)
          if (v !== undefined) {
            scaledValues.set(`${rowKey}|${colKey}`, (v - mean) / std)
          }
        }
      }
    }
  }

  const finalValues = scaleMethod === 'none' ? valueMap : scaledValues
  if (scaleMethod !== 'none') {
    const scaled = Array.from(finalValues.values())
    minVal = Math.min(...scaled)
    maxVal = Math.max(...scaled)
  }

  // Color interpolation
  const interpolateColor = (val: number): RGBA => {
    if (isNaN(val)) return naRgb

    const t = (val - minVal) / (maxVal - minVal || 1)

    // Two-segment interpolation: low -> mid -> high
    if (t <= 0.5) {
      const t2 = t * 2
      return {
        r: Math.round(lowRgb.r + (midRgb.r - lowRgb.r) * t2),
        g: Math.round(lowRgb.g + (midRgb.g - lowRgb.g) * t2),
        b: Math.round(lowRgb.b + (midRgb.b - lowRgb.b) * t2),
        a: 1,
      }
    } else {
      const t2 = (t - 0.5) * 2
      return {
        r: Math.round(midRgb.r + (highRgb.r - midRgb.r) * t2),
        g: Math.round(midRgb.g + (highRgb.g - midRgb.g) * t2),
        b: Math.round(midRgb.b + (highRgb.b - midRgb.b) * t2),
        a: 1,
      }
    }
  }

  // Calculate cell dimensions using scales range
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const labelWidth = showRowLabels ? Math.min(10, Math.max(...rowKeys.map(k => k.length))) + 1 : 0
  const labelHeight = showColLabels ? 1 : 0

  const availWidth = plotRight - plotLeft - labelWidth
  const availHeight = plotBottom - plotTop - labelHeight

  const cellWidth = Math.max(1, Math.floor(availWidth / colKeys.length))
  const cellHeight = Math.max(1, Math.floor(availHeight / rowKeys.length))

  // Draw cells
  for (let ri = 0; ri < rowKeys.length; ri++) {
    const rowKey = rowKeys[ri]
    const baseY = plotTop + labelHeight + ri * cellHeight

    for (let ci = 0; ci < colKeys.length; ci++) {
      const colKey = colKeys[ci]
      const baseX = plotLeft + labelWidth + ci * cellWidth

      const val = finalValues.get(`${rowKey}|${colKey}`)
      const color = val !== undefined ? interpolateColor(val) : naRgb

      // Fill cell
      for (let dy = 0; dy < cellHeight; dy++) {
        for (let dx = 0; dx < cellWidth; dx++) {
          canvas.drawChar(baseX + dx, baseY + dy, cellChar, color)
        }
      }
    }
  }

  // Draw row labels
  if (showRowLabels) {
    const labelColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }
    for (let ri = 0; ri < rowKeys.length; ri++) {
      const label = rowKeys[ri].slice(0, labelWidth - 1)
      const y = plotTop + labelHeight + ri * cellHeight + Math.floor(cellHeight / 2)
      for (let i = 0; i < label.length; i++) {
        canvas.drawChar(plotLeft + i, y, label[i], labelColor)
      }
    }
  }

  // Draw column labels (rotated/abbreviated)
  if (showColLabels) {
    const labelColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }
    for (let ci = 0; ci < colKeys.length; ci++) {
      const label = colKeys[ci].slice(0, cellWidth)
      const x = plotLeft + labelWidth + ci * cellWidth + Math.floor(cellWidth / 2)
      for (let i = 0; i < Math.min(label.length, 1); i++) {
        canvas.drawChar(x, plotTop + i, label[i], labelColor)
      }
    }
  }
}

/**
 * Render PCA biplot
 */
function renderGeomBiplot(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const pc1Col = params.pc1_col ?? 'PC1'
  const pc2Col = params.pc2_col ?? 'PC2'
  const loadings = params.loadings as Array<{ variable: string; pc1: number; pc2: number }> | undefined
  // varExplained (params.var_explained) can be used for axis labels showing % variance
  const showScores = params.show_scores ?? true
  // scoreSize (params.score_size) can be used for point size variation
  const scoreChar = String(params.score_char ?? '●')
  const showScoreLabels = params.show_score_labels ?? false
  const showLoadings = params.show_loadings ?? true
  const loadingColor = String(params.loading_color ?? '#e41a1c')
  const loadingScale = params.loading_scale as number | undefined
  const showLoadingLabels = params.show_loading_labels ?? true
  const showOrigin = params.show_origin ?? true
  const originColor = String(params.origin_color ?? '#999999')

  if (!Array.isArray(data) || data.length === 0) return

  // Parse colors
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }

  const loadingColorParsed = parseHex(loadingColor)
  const originColorParsed = parseHex(originColor)

  // Extract scores from data
  interface ScorePoint {
    pc1: number
    pc2: number
    label?: string
    color?: RGBA
  }

  const scores: ScorePoint[] = []
  const xField = typeof aes.x === 'string' ? aes.x : pc1Col
  const yField = typeof aes.y === 'string' ? aes.y : pc2Col
  const labelField = typeof aes.label === 'string' ? aes.label : undefined
  const colorField = typeof aes.color === 'string' ? aes.color : undefined

  for (const row of data) {
    const rawPc1 = row[xField as keyof typeof row]
    const rawPc2 = row[yField as keyof typeof row]
    const pc1 = typeof rawPc1 === 'number' ? rawPc1 : parseFloat(String(rawPc1))
    const pc2 = typeof rawPc2 === 'number' ? rawPc2 : parseFloat(String(rawPc2))

    if (!isNaN(pc1) && !isNaN(pc2)) {
      const point: ScorePoint = { pc1, pc2 }
      if (labelField) point.label = String(row[labelField as keyof typeof row] ?? '')

      // Get color from scale if available
      if (colorField && scales.color) {
        point.color = scales.color.map(row[colorField])
      }

      scores.push(point)
    }
  }

  if (scores.length === 0) return

  // Calculate data range (include loadings if present)
  let minX = Math.min(...scores.map(s => s.pc1))
  let maxX = Math.max(...scores.map(s => s.pc1))
  let minY = Math.min(...scores.map(s => s.pc2))
  let maxY = Math.max(...scores.map(s => s.pc2))

  // Auto-calculate loading scale if needed
  let actualLoadingScale = loadingScale
  if (loadings && loadings.length > 0 && !actualLoadingScale) {
    const maxLoading = Math.max(
      ...loadings.map(l => Math.sqrt(l.pc1 ** 2 + l.pc2 ** 2))
    )
    const maxScore = Math.max(
      Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY)
    )
    actualLoadingScale = (maxScore * 0.8) / (maxLoading || 1)
  }

  // Extend range to include loadings
  if (loadings && actualLoadingScale) {
    for (const l of loadings) {
      const lx = l.pc1 * actualLoadingScale
      const ly = l.pc2 * actualLoadingScale
      minX = Math.min(minX, lx)
      maxX = Math.max(maxX, lx)
      minY = Math.min(minY, ly)
      maxY = Math.max(maxY, ly)
    }
  }

  // Add padding
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  minX -= rangeX * 0.1
  maxX += rangeX * 0.1
  minY -= rangeY * 0.1
  maxY += rangeY * 0.1

  // Create local scale mappers using scales range
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const mapX = (v: number) => plotLeft + ((v - minX) / (maxX - minX)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - ((v - minY) / (maxY - minY)) * (plotBottom - plotTop)

  // Draw origin crosshairs
  if (showOrigin && minX <= 0 && maxX >= 0 && minY <= 0 && maxY >= 0) {
    const originX = Math.round(mapX(0))
    const originY = Math.round(mapY(0))

    // Horizontal line
    for (let x = plotLeft; x <= plotRight; x++) {
      canvas.drawChar(x, originY, '─', originColorParsed)
    }

    // Vertical line
    for (let y = plotTop; y <= plotBottom; y++) {
      canvas.drawChar(originX, y, '│', originColorParsed)
    }

    // Center cross
    canvas.drawChar(originX, originY, '┼', originColorParsed)
  }

  // Draw loading arrows
  if (showLoadings && loadings && actualLoadingScale) {
    for (const loading of loadings) {
      const endX = loading.pc1 * actualLoadingScale
      const endY = loading.pc2 * actualLoadingScale

      const sx = Math.round(mapX(0))
      const sy = Math.round(mapY(0))
      const ex = Math.round(mapX(endX))
      const ey = Math.round(mapY(endY))

      // Draw line from origin to loading
      const steps = Math.max(Math.abs(ex - sx), Math.abs(ey - sy))
      for (let i = 0; i <= steps; i++) {
        const t = steps > 0 ? i / steps : 0
        const px = Math.round(sx + (ex - sx) * t)
        const py = Math.round(sy + (ey - sy) * t)

        // Choose character based on direction
        const dx = ex - sx
        const dy = ey - sy
        let char = '·'
        if (Math.abs(dx) > Math.abs(dy) * 2) {
          char = dx > 0 ? '─' : '─'
        } else if (Math.abs(dy) > Math.abs(dx) * 2) {
          char = '│'
        } else if ((dx > 0 && dy < 0) || (dx < 0 && dy > 0)) {
          char = '/'
        } else {
          char = '\\'
        }

        canvas.drawChar(px, py, char, loadingColorParsed)
      }

      // Draw arrow head
      const angle = Math.atan2(ey - sy, ex - sx)
      let arrowChar = '→'
      if (angle > Math.PI * 3 / 4 || angle < -Math.PI * 3 / 4) arrowChar = '←'
      else if (angle > Math.PI / 4) arrowChar = '↓'
      else if (angle < -Math.PI / 4) arrowChar = '↑'
      canvas.drawChar(ex, ey, arrowChar, loadingColorParsed)

      // Draw variable label
      if (showLoadingLabels) {
        const labelX = ex + (ex >= sx ? 1 : -loading.variable.length)
        for (let i = 0; i < loading.variable.length; i++) {
          canvas.drawChar(labelX + i, ey, loading.variable[i], loadingColorParsed)
        }
      }
    }
  }

  // Draw score points
  if (showScores) {
    const defaultColor: RGBA = { r: 31, g: 120, b: 180, a: 1 }

    for (const score of scores) {
      const cx = Math.round(mapX(score.pc1))
      const cy = Math.round(mapY(score.pc2))
      const color = score.color ?? defaultColor
      canvas.drawPoint(cx, cy, color, scoreChar)

      // Draw label if requested
      if (showScoreLabels && score.label) {
        const labelColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }
        for (let i = 0; i < score.label.length; i++) {
          canvas.drawChar(cx + 1 + i, cy, score.label[i], labelColor)
        }
      }
    }
  }
}

/**
 * Kaplan-Meier survival curve renderer
 */
function renderGeomKaplanMeier(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showCensored = Boolean(params.show_censored ?? true)
  const censorChar = String(params.censor_char ?? '+')
  const showMedian = Boolean(params.show_median ?? false)

  if (!Array.isArray(data) || data.length === 0) return

  const xField = typeof aes.x === 'string' ? aes.x : 'time'
  const yField = typeof aes.y === 'string' ? aes.y : 'status'
  const colorField = typeof aes.color === 'string' ? aes.color : undefined

  // Group data by color field for multiple curves
  const groups = new Map<string, Array<{ time: number; status: number }>>()

  for (const row of data) {
    const time = Number(row[xField as keyof typeof row] ?? 0)
    const status = Number(row[yField as keyof typeof row] ?? 0)
    const group = colorField ? String(row[colorField as keyof typeof row] ?? 'default') : 'default'

    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push({ time, status })
  }

  // Color palette
  const colors: RGBA[] = [
    { r: 31, g: 119, b: 180, a: 1 },
    { r: 255, g: 127, b: 14, a: 1 },
    { r: 44, g: 160, b: 44, a: 1 },
    { r: 214, g: 39, b: 40, a: 1 },
    { r: 148, g: 103, b: 189, a: 1 },
  ]

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find overall time range
  let maxTime = 0
  for (const [, events] of groups) {
    for (const e of events) {
      if (e.time > maxTime) maxTime = e.time
    }
  }

  const mapX = (t: number) => plotLeft + (t / maxTime) * (plotRight - plotLeft)
  const mapY = (s: number) => plotBottom - s * (plotBottom - plotTop)

  let colorIndex = 0
  for (const [, events] of groups) {
    const color = colors[colorIndex % colors.length]
    colorIndex++

    // Sort by time
    events.sort((a, b) => a.time - b.time)

    // Compute Kaplan-Meier estimate
    const n = events.length
    let survival = 1.0
    let atRisk = n

    const survivalCurve: Array<{ time: number; survival: number; censored: boolean }> = []
    survivalCurve.push({ time: 0, survival: 1.0, censored: false })

    for (const event of events) {
      if (event.status === 1) {
        // Event occurred
        survival *= (atRisk - 1) / atRisk
        survivalCurve.push({ time: event.time, survival, censored: false })
      } else {
        // Censored
        survivalCurve.push({ time: event.time, survival, censored: true })
      }
      atRisk--
    }

    // Draw step function
    for (let i = 0; i < survivalCurve.length; i++) {
      const point = survivalCurve[i]
      const x = Math.round(mapX(point.time))
      const y = Math.round(mapY(point.survival))

      if (i > 0) {
        // Horizontal line from previous point
        const prevPoint = survivalCurve[i - 1]
        const px = Math.round(mapX(prevPoint.time))
        const py = Math.round(mapY(prevPoint.survival))

        // Draw horizontal segment
        for (let hx = px; hx <= x; hx++) {
          canvas.drawChar(hx, py, '─', color)
        }

        // Draw vertical drop (if survival changed)
        if (py !== y) {
          for (let vy = Math.min(py, y); vy <= Math.max(py, y); vy++) {
            canvas.drawChar(x, vy, '│', color)
          }
        }
      }

      // Draw censored marks
      if (point.censored && showCensored) {
        canvas.drawChar(x, y, censorChar, color)
      }
    }

    // Draw median survival line if requested
    if (showMedian) {
      const medianY = mapY(0.5)
      for (let mx = plotLeft; mx <= plotRight; mx += 2) {
        canvas.drawChar(mx, Math.round(medianY), '·', { r: 150, g: 150, b: 150, a: 1 })
      }
    }
  }
}

/**
 * Forest plot renderer for meta-analysis
 */
function renderGeomForest(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const nullLine = Number(params.null_line ?? 1)
  const logScale = Boolean(params.log_scale ?? false)
  const nullLineColor = String(params.null_line_color ?? '#888888')
  const pointChar = String(params.point_char ?? '■')
  // Size scaling could be added later with minSize/maxSize params

  if (!Array.isArray(data) || data.length === 0) return

  // Parse null line color
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const nullColor = parseHex(nullLineColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'estimate'
  const yField = typeof aes.y === 'string' ? aes.y : 'study'
  const xminField = typeof aes.xmin === 'string' ? aes.xmin : 'ci_lower'
  const xmaxField = typeof aes.xmax === 'string' ? aes.xmax : 'ci_upper'
  const sizeField = typeof aes.size === 'string' ? aes.size : undefined

  // Extract data
  interface ForestRow {
    study: string
    estimate: number
    ci_lower: number
    ci_upper: number
    weight?: number
  }

  const rows: ForestRow[] = []
  let minWeight = Infinity
  let maxWeight = -Infinity

  for (const row of data) {
    const estimate = Number(row[xField as keyof typeof row] ?? 0)
    const ci_lower = Number(row[xminField as keyof typeof row] ?? estimate)
    const ci_upper = Number(row[xmaxField as keyof typeof row] ?? estimate)
    const study = String(row[yField as keyof typeof row] ?? '')
    const weight = sizeField ? Number(row[sizeField as keyof typeof row] ?? 1) : 1

    if (weight < minWeight) minWeight = weight
    if (weight > maxWeight) maxWeight = weight

    rows.push({ study, estimate, ci_lower, ci_upper, weight })
  }

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find x range
  let xMin = Math.min(...rows.map(r => r.ci_lower), nullLine)
  let xMax = Math.max(...rows.map(r => r.ci_upper), nullLine)

  if (logScale) {
    xMin = Math.log10(Math.max(xMin, 0.001))
    xMax = Math.log10(Math.max(xMax, 0.001))
  }

  const mapX = (v: number) => {
    const val = logScale ? Math.log10(Math.max(v, 0.001)) : v
    return plotLeft + ((val - xMin) / (xMax - xMin)) * (plotRight - plotLeft)
  }

  // Draw null line
  const nullX = Math.round(mapX(nullLine))
  for (let y = plotTop; y <= plotBottom; y++) {
    if ((y - plotTop) % 2 === 0) {
      canvas.drawChar(nullX, y, '│', nullColor)
    }
  }

  // Draw each study
  const rowHeight = (plotBottom - plotTop) / rows.length
  const pointColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  const ciColor: RGBA = { r: 80, g: 80, b: 80, a: 1 }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const y = Math.round(plotTop + (i + 0.5) * rowHeight)

    // Draw CI line
    const x1 = Math.round(mapX(row.ci_lower))
    const x2 = Math.round(mapX(row.ci_upper))
    for (let x = x1; x <= x2; x++) {
      canvas.drawChar(x, y, '─', ciColor)
    }

    // Draw CI caps
    canvas.drawChar(x1, y, '├', ciColor)
    canvas.drawChar(x2, y, '┤', ciColor)

    // Draw point estimate (size based on weight)
    const px = Math.round(mapX(row.estimate))
    canvas.drawChar(px, y, pointChar, pointColor)
  }
}

/**
 * ROC curve renderer
 */
function renderGeomRoc(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showDiagonal = Boolean(params.show_diagonal ?? true)
  const diagonalColor = String(params.diagonal_color ?? '#888888')
  const showAuc = Boolean(params.show_auc ?? true)
  const showOptimal = Boolean(params.show_optimal ?? false)
  const optimalChar = String(params.optimal_char ?? '●')

  if (!Array.isArray(data) || data.length === 0) return

  // Parse diagonal color
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const diagColor = parseHex(diagonalColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'fpr'
  const yField = typeof aes.y === 'string' ? aes.y : 'tpr'
  const colorField = typeof aes.color === 'string' ? aes.color : undefined

  // Group by color for multiple curves
  const groups = new Map<string, Array<{ fpr: number; tpr: number }>>()

  for (const row of data) {
    const fpr = Number(row[xField as keyof typeof row] ?? 0)
    const tpr = Number(row[yField as keyof typeof row] ?? 0)
    const group = colorField ? String(row[colorField as keyof typeof row] ?? 'default') : 'default'

    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push({ fpr, tpr })
  }

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const mapX = (v: number) => plotLeft + v * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - v * (plotBottom - plotTop)

  // Draw diagonal reference line (random classifier)
  if (showDiagonal) {
    const steps = plotRight - plotLeft
    for (let i = 0; i <= steps; i += 2) {
      const t = i / steps
      const x = Math.round(mapX(t))
      const y = Math.round(mapY(t))
      canvas.drawChar(x, y, '·', diagColor)
    }
  }

  // Color palette
  const colors: RGBA[] = [
    { r: 31, g: 119, b: 180, a: 1 },
    { r: 255, g: 127, b: 14, a: 1 },
    { r: 44, g: 160, b: 44, a: 1 },
    { r: 214, g: 39, b: 40, a: 1 },
  ]

  let colorIndex = 0
  for (const [, points] of groups) {
    const color = colors[colorIndex % colors.length]
    colorIndex++

    // Sort by FPR
    points.sort((a, b) => a.fpr - b.fpr)

    // Calculate AUC using trapezoidal rule
    let auc = 0
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].fpr - points[i - 1].fpr
      const avgY = (points[i].tpr + points[i - 1].tpr) / 2
      auc += dx * avgY
    }

    // Find optimal point (maximum Youden's J = TPR - FPR)
    let optimalPoint = points[0]
    let maxJ = -Infinity
    for (const p of points) {
      const j = p.tpr - p.fpr
      if (j > maxJ) {
        maxJ = j
        optimalPoint = p
      }
    }

    // Draw curve
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const x = Math.round(mapX(p.fpr))
      const y = Math.round(mapY(p.tpr))

      if (i > 0) {
        const prev = points[i - 1]
        const px = Math.round(mapX(prev.fpr))
        const py = Math.round(mapY(prev.tpr))

        // Draw line between points
        const steps = Math.max(Math.abs(x - px), Math.abs(y - py))
        for (let s = 0; s <= steps; s++) {
          const t = steps > 0 ? s / steps : 0
          const lx = Math.round(px + (x - px) * t)
          const ly = Math.round(py + (y - py) * t)
          canvas.drawChar(lx, ly, '─', color)
        }
      }

      canvas.drawChar(x, y, '●', color)
    }

    // Draw optimal point
    if (showOptimal) {
      const ox = Math.round(mapX(optimalPoint.fpr))
      const oy = Math.round(mapY(optimalPoint.tpr))
      canvas.drawChar(ox, oy, optimalChar, { r: 255, g: 0, b: 0, a: 1 })
    }

    // Show AUC in legend area
    if (showAuc && colorIndex === 1) {
      const aucText = `AUC=${auc.toFixed(3)}`
      const labelColor: RGBA = { r: 100, g: 100, b: 100, a: 1 }
      for (let i = 0; i < aucText.length; i++) {
        canvas.drawChar(plotRight - aucText.length + i, plotTop + 1, aucText[i], labelColor)
      }
    }
  }
}

/**
 * Bland-Altman plot renderer
 */
function renderGeomBlandAltman(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showLimits = Boolean(params.show_limits ?? true)
  const showBias = Boolean(params.show_bias ?? true)
  const limitMultiplier = Number(params.limit_multiplier ?? 1.96)
  const biasColor = String(params.bias_color ?? '#0000ff')
  const limitColor = String(params.limit_color ?? '#ff0000')
  const pointChar = String(params.point_char ?? '●')
  const precomputed = Boolean(params.precomputed ?? false)

  if (!Array.isArray(data) || data.length === 0) return

  // Parse colors
  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const biasColorParsed = parseHex(biasColor)
  const limitColorParsed = parseHex(limitColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'method1'
  const yField = typeof aes.y === 'string' ? aes.y : 'method2'

  // Compute mean and difference for each point
  interface BAPoint {
    mean: number
    diff: number
  }

  const points: BAPoint[] = []

  if (precomputed) {
    // Data already has mean and diff columns
    for (const row of data) {
      const mean = Number(row[xField as keyof typeof row] ?? 0)
      const diff = Number(row[yField as keyof typeof row] ?? 0)
      points.push({ mean, diff })
    }
  } else {
    // Compute mean and difference from two methods
    for (const row of data) {
      const m1 = Number(row[xField as keyof typeof row] ?? 0)
      const m2 = Number(row[yField as keyof typeof row] ?? 0)
      const mean = (m1 + m2) / 2
      const diff = m1 - m2
      points.push({ mean, diff })
    }
  }

  if (points.length === 0) return

  // Calculate bias and limits of agreement
  const diffs = points.map(p => p.diff)
  const bias = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const variance = diffs.reduce((a, b) => a + Math.pow(b - bias, 2), 0) / (diffs.length - 1)
  const sd = Math.sqrt(variance)
  const upperLimit = bias + limitMultiplier * sd
  const lowerLimit = bias - limitMultiplier * sd

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find ranges
  const minMean = Math.min(...points.map(p => p.mean))
  const maxMean = Math.max(...points.map(p => p.mean))
  const minDiff = Math.min(...points.map(p => p.diff), lowerLimit)
  const maxDiff = Math.max(...points.map(p => p.diff), upperLimit)

  const mapX = (v: number) => plotLeft + ((v - minMean) / (maxMean - minMean)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - ((v - minDiff) / (maxDiff - minDiff)) * (plotBottom - plotTop)

  // Draw bias line
  if (showBias) {
    const biasY = Math.round(mapY(bias))
    for (let x = plotLeft; x <= plotRight; x++) {
      canvas.drawChar(x, biasY, '─', biasColorParsed)
    }
  }

  // Draw limits of agreement
  if (showLimits) {
    const upperY = Math.round(mapY(upperLimit))
    const lowerY = Math.round(mapY(lowerLimit))

    for (let x = plotLeft; x <= plotRight; x += 2) {
      canvas.drawChar(x, upperY, '─', limitColorParsed)
      canvas.drawChar(x, lowerY, '─', limitColorParsed)
    }
  }

  // Draw points
  const pointColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  for (const p of points) {
    const x = Math.round(mapX(p.mean))
    const y = Math.round(mapY(p.diff))
    canvas.drawChar(x, y, pointChar, pointColor)
  }
}

/**
 * Q-Q Plot renderer
 */
function renderGeomQQ(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showLine = params.show_line ?? true
  const lineColor = (params.line_color as string) ?? '#ff0000'
  const pointChar = (params.point_char as string) ?? '●'
  const standardize = params.standardize ?? true

  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const lineColorParsed = parseHex(lineColor)

  // Get sample values from x aesthetic
  const sampleField = typeof aes.x === 'string' ? aes.x : 'x'

  const values: number[] = []
  for (const row of data) {
    const v = Number(row[sampleField as keyof typeof row])
    if (!isNaN(v)) values.push(v)
  }

  if (values.length === 0) return

  // Sort values
  values.sort((a, b) => a - b)
  const n = values.length

  // Compute sample quantiles and theoretical quantiles
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1)
  const sd = Math.sqrt(variance)

  // Standard normal quantile function (approximation using Abramowitz and Stegun)
  const qnorm = (p: number): number => {
    if (p <= 0) return -Infinity
    if (p >= 1) return Infinity
    if (p === 0.5) return 0

    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
      1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0
    ]
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
      6.680131188771972e1, -1.328068155288572e1
    ]
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
      -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0
    ]
    const d = [
      7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
      3.754408661907416e0
    ]

    const pLow = 0.02425
    const pHigh = 1 - pLow
    let q: number

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p))
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    } else if (p <= pHigh) {
      q = p - 0.5
      const r = q * q
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p))
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    }
  }

  // Compute theoretical quantiles
  interface QQPoint {
    theoretical: number
    sample: number
  }

  const points: QQPoint[] = []
  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n
    const theoretical = qnorm(p)
    const sample = standardize ? (values[i] - mean) / sd : values[i]
    points.push({ theoretical, sample })
  }

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find ranges
  const minT = Math.min(...points.map(p => p.theoretical))
  const maxT = Math.max(...points.map(p => p.theoretical))
  const minS = Math.min(...points.map(p => p.sample))
  const maxS = Math.max(...points.map(p => p.sample))

  // Use same range for both axes for proper comparison
  const minVal = Math.min(minT, minS)
  const maxVal = Math.max(maxT, maxS)

  const mapX = (v: number) => plotLeft + ((v - minVal) / (maxVal - minVal)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - ((v - minVal) / (maxVal - minVal)) * (plotBottom - plotTop)

  // Draw reference line (y = x)
  if (showLine) {
    const steps = plotRight - plotLeft
    for (let i = 0; i <= steps; i++) {
      const v = minVal + (i / steps) * (maxVal - minVal)
      const x = Math.round(mapX(v))
      const y = Math.round(mapY(v))
      if (y >= plotTop && y <= plotBottom) {
        canvas.drawChar(x, y, '─', lineColorParsed)
      }
    }
  }

  // Draw points
  const pointColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  for (const p of points) {
    const x = Math.round(mapX(p.theoretical))
    const y = Math.round(mapY(p.sample))
    canvas.drawChar(x, y, pointChar, pointColor)
  }
}

/**
 * ECDF (Empirical Cumulative Distribution Function) renderer
 */
function renderGeomECDF(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const complement = params.complement ?? false
  const showPoints = params.show_points ?? false

  const xField = typeof aes.x === 'string' ? aes.x : 'x'
  const colorField = typeof aes.color === 'string' ? aes.color : null

  // Group data by color if specified
  const groups = new Map<string, number[]>()

  for (const row of data) {
    const v = Number(row[xField as keyof typeof row])
    if (isNaN(v)) continue

    const groupKey = colorField ? String(row[colorField as keyof typeof row] ?? 'default') : 'default'
    if (!groups.has(groupKey)) groups.set(groupKey, [])
    groups.get(groupKey)!.push(v)
  }

  if (groups.size === 0) return

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find global x range
  let globalMin = Infinity
  let globalMax = -Infinity
  for (const values of groups.values()) {
    globalMin = Math.min(globalMin, ...values)
    globalMax = Math.max(globalMax, ...values)
  }

  const mapX = (v: number) => plotLeft + ((v - globalMin) / (globalMax - globalMin)) * (plotRight - plotLeft)
  const mapY = (v: number) => {
    const ecdf = complement ? 1 - v : v
    return plotBottom - ecdf * (plotBottom - plotTop)
  }

  const colors: RGBA[] = [
    { r: 31, g: 119, b: 180, a: 1 },
    { r: 255, g: 127, b: 14, a: 1 },
    { r: 44, g: 160, b: 44, a: 1 },
    { r: 214, g: 39, b: 40, a: 1 },
    { r: 148, g: 103, b: 189, a: 1 },
  ]

  let colorIdx = 0
  for (const [, values] of groups) {
    const color = colors[colorIdx % colors.length]
    colorIdx++

    // Sort values
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length

    // Draw step function
    let prevX = plotLeft
    let prevY = Math.round(mapY(0))

    for (let i = 0; i < n; i++) {
      const ecdfVal = (i + 1) / n
      const x = Math.round(mapX(sorted[i]))
      const y = Math.round(mapY(ecdfVal))

      // Horizontal step to current x
      for (let px = prevX; px <= x; px++) {
        canvas.drawChar(px, prevY, '─', color)
      }

      // Vertical step
      const stepDir = y < prevY ? -1 : 1
      for (let py = prevY; stepDir > 0 ? py <= y : py >= y; py += stepDir) {
        canvas.drawChar(x, py, '│', color)
      }

      if (showPoints) {
        canvas.drawChar(x, y, '●', color)
      }

      prevX = x
      prevY = y
    }

    // Extend to right edge
    for (let px = prevX; px <= plotRight; px++) {
      canvas.drawChar(px, prevY, '─', color)
    }
  }
}

/**
 * Funnel Plot renderer (for meta-analysis publication bias)
 */
function renderGeomFunnel(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showContours = params.show_contours ?? true
  const showSummaryLine = params.show_summary_line ?? true
  const summaryEffect = params.summary_effect as number | undefined
  const pointChar = (params.point_char as string) ?? '●'
  const contourColor = (params.contour_color as string) ?? '#888888'
  const invertY = params.invert_y ?? true

  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const contourColorParsed = parseHex(contourColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'effect'
  const yField = typeof aes.y === 'string' ? aes.y : 'se'

  interface FunnelPoint {
    effect: number
    se: number
  }

  const points: FunnelPoint[] = []
  for (const row of data) {
    const effect = Number(row[xField as keyof typeof row])
    const se = Number(row[yField as keyof typeof row])
    if (!isNaN(effect) && !isNaN(se)) {
      points.push({ effect, se })
    }
  }

  if (points.length === 0) return

  // Calculate summary effect if not provided
  const summary = summaryEffect ?? points.reduce((a, b) => a + b.effect, 0) / points.length

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find ranges
  const minEffect = Math.min(...points.map(p => p.effect))
  const maxEffect = Math.max(...points.map(p => p.effect))
  const maxSE = Math.max(...points.map(p => p.se))

  // Pad effect range for contours
  const effectPad = (maxEffect - minEffect) * 0.2
  const effectMin = minEffect - effectPad
  const effectMax = maxEffect + effectPad

  const mapX = (v: number) => plotLeft + ((v - effectMin) / (effectMax - effectMin)) * (plotRight - plotLeft)
  const mapY = (v: number) => {
    if (invertY) {
      return plotTop + (v / maxSE) * (plotBottom - plotTop)
    }
    return plotBottom - (v / maxSE) * (plotBottom - plotTop)
  }

  // Draw funnel contours (95% CI)
  if (showContours) {
    const z = 1.96 // 95% CI
    // Draw from SE=0 (top) to maxSE (bottom)
    for (let se = 0; se <= maxSE; se += maxSE / 40) {
      const leftBound = summary - z * se
      const rightBound = summary + z * se

      const y = Math.round(mapY(se))
      const leftX = Math.round(mapX(leftBound))
      const rightX = Math.round(mapX(rightBound))

      if (leftX >= plotLeft && leftX <= plotRight) {
        canvas.drawChar(leftX, y, '·', contourColorParsed)
      }
      if (rightX >= plotLeft && rightX <= plotRight) {
        canvas.drawChar(rightX, y, '·', contourColorParsed)
      }
    }
  }

  // Draw summary effect line
  if (showSummaryLine) {
    const summaryX = Math.round(mapX(summary))
    for (let y = plotTop; y <= plotBottom; y += 2) {
      canvas.drawChar(summaryX, y, '│', contourColorParsed)
    }
  }

  // Draw points
  const pointColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  for (const p of points) {
    const x = Math.round(mapX(p.effect))
    const y = Math.round(mapY(p.se))
    canvas.drawChar(x, y, pointChar, pointColor)
  }
}

/**
 * Control Chart (Shewhart Chart) renderer
 */
function renderGeomControl(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const sigma = (params.sigma as number) ?? 3
  const showCenter = params.show_center ?? true
  const showUCL = params.show_ucl ?? true
  const showLCL = params.show_lcl ?? true
  const showWarning = params.show_warning ?? false
  const customCenter = params.center as number | undefined
  const customUCL = params.ucl as number | undefined
  const customLCL = params.lcl as number | undefined
  const centerColor = (params.center_color as string) ?? '#0000ff'
  const limitColor = (params.limit_color as string) ?? '#ff0000'
  const warningColor = (params.warning_color as string) ?? '#ffa500'
  const connectPoints = params.connect_points ?? true
  const highlightOOC = params.highlight_ooc ?? true
  const oocChar = (params.ooc_char as string) ?? '◆'
  const pointChar = (params.point_char as string) ?? '●'

  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const centerColorParsed = parseHex(centerColor)
  const limitColorParsed = parseHex(limitColor)
  const warningColorParsed = parseHex(warningColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'x'
  const yField = typeof aes.y === 'string' ? aes.y : 'y'

  interface ControlPoint {
    x: number
    y: number
  }

  const points: ControlPoint[] = []
  for (const row of data) {
    const x = Number(row[xField as keyof typeof row])
    const y = Number(row[yField as keyof typeof row])
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y })
    }
  }

  if (points.length === 0) return

  // Sort by x
  points.sort((a, b) => a.x - b.x)

  // Calculate control limits
  const yValues = points.map(p => p.y)
  const mean = customCenter ?? yValues.reduce((a, b) => a + b, 0) / yValues.length

  // For I-chart, use moving range for sigma estimate
  let sigmaEst: number
  if (points.length > 1) {
    const movingRanges: number[] = []
    for (let i = 1; i < points.length; i++) {
      movingRanges.push(Math.abs(points[i].y - points[i - 1].y))
    }
    const avgMR = movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length
    sigmaEst = avgMR / 1.128 // d2 constant for n=2
  } else {
    const variance = yValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (yValues.length - 1)
    sigmaEst = Math.sqrt(variance)
  }

  const ucl = customUCL ?? mean + sigma * sigmaEst
  const lcl = customLCL ?? mean - sigma * sigmaEst
  const uwl = mean + 2 * sigmaEst // Warning limits at 2 sigma
  const lwl = mean - 2 * sigmaEst

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find ranges
  const minX = Math.min(...points.map(p => p.x))
  const maxX = Math.max(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y), lcl)
  const maxY = Math.max(...points.map(p => p.y), ucl)

  const mapX = (v: number) => plotLeft + ((v - minX) / (maxX - minX)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - ((v - minY) / (maxY - minY)) * (plotBottom - plotTop)

  // Draw center line
  if (showCenter) {
    const centerY = Math.round(mapY(mean))
    for (let x = plotLeft; x <= plotRight; x++) {
      canvas.drawChar(x, centerY, '─', centerColorParsed)
    }
  }

  // Draw control limits
  if (showUCL) {
    const uclY = Math.round(mapY(ucl))
    for (let x = plotLeft; x <= plotRight; x += 2) {
      canvas.drawChar(x, uclY, '─', limitColorParsed)
    }
  }
  if (showLCL) {
    const lclY = Math.round(mapY(lcl))
    for (let x = plotLeft; x <= plotRight; x += 2) {
      canvas.drawChar(x, lclY, '─', limitColorParsed)
    }
  }

  // Draw warning limits
  if (showWarning) {
    const uwlY = Math.round(mapY(uwl))
    const lwlY = Math.round(mapY(lwl))
    for (let x = plotLeft; x <= plotRight; x += 3) {
      canvas.drawChar(x, uwlY, '·', warningColorParsed)
      canvas.drawChar(x, lwlY, '·', warningColorParsed)
    }
  }

  // Draw connecting lines
  if (connectPoints && points.length > 1) {
    const lineColor: RGBA = { r: 100, g: 100, b: 100, a: 1 }
    for (let i = 1; i < points.length; i++) {
      const x1 = Math.round(mapX(points[i - 1].x))
      const y1 = Math.round(mapY(points[i - 1].y))
      const x2 = Math.round(mapX(points[i].x))
      const y2 = Math.round(mapY(points[i].y))

      // Bresenham's line algorithm
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const sx = x1 < x2 ? 1 : -1
      const sy = y1 < y2 ? 1 : -1
      let err = dx - dy
      let x = x1
      let y = y1

      while (true) {
        canvas.drawChar(x, y, '·', lineColor)
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
  }

  // Draw points
  const inControlColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  const oocColor: RGBA = { r: 214, g: 39, b: 40, a: 1 }

  for (const p of points) {
    const x = Math.round(mapX(p.x))
    const y = Math.round(mapY(p.y))
    const isOOC = p.y > ucl || p.y < lcl

    if (highlightOOC && isOOC) {
      canvas.drawChar(x, y, oocChar, oocColor)
    } else {
      canvas.drawChar(x, y, pointChar, inControlColor)
    }
  }
}

/**
 * Scree Plot renderer (for PCA variance)
 */
function renderGeomScree(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const showCumulative = params.show_cumulative ?? false
  const showKaiser = params.show_kaiser ?? false
  const connectPoints = params.connect_points ?? true
  const showBars = params.show_bars ?? false
  const pointChar = (params.point_char as string) ?? '●'
  const cumulativeColor = (params.cumulative_color as string) ?? '#ff0000'
  const kaiserColor = (params.kaiser_color as string) ?? '#888888'
  const threshold = params.threshold as number | undefined
  const thresholdColor = (params.threshold_color as string) ?? '#00aa00'

  const parseHex = (hex: string): RGBA => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 1 }
  }
  const cumulativeColorParsed = parseHex(cumulativeColor)
  const kaiserColorParsed = parseHex(kaiserColor)
  const thresholdColorParsed = parseHex(thresholdColor)

  const xField = typeof aes.x === 'string' ? aes.x : 'component'
  const yField = typeof aes.y === 'string' ? aes.y : 'variance'

  interface ScreePoint {
    component: number
    variance: number
  }

  const points: ScreePoint[] = []
  for (const row of data) {
    const component = Number(row[xField as keyof typeof row])
    const variance = Number(row[yField as keyof typeof row])
    if (!isNaN(component) && !isNaN(variance)) {
      points.push({ component, variance })
    }
  }

  if (points.length === 0) return

  // Sort by component
  points.sort((a, b) => a.component - b.component)

  // Calculate cumulative variance
  const total = points.reduce((a, b) => a + b.variance, 0)
  let cumSum = 0
  const cumulativePoints = points.map(p => {
    cumSum += p.variance
    return { component: p.component, cumulative: cumSum / total }
  })

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  // Find ranges
  const minX = Math.min(...points.map(p => p.component))
  const maxX = Math.max(...points.map(p => p.component))
  const maxY = Math.max(...points.map(p => p.variance))

  // For cumulative, y goes to 1
  const yMax = showCumulative ? Math.max(maxY, total) : maxY

  const mapX = (v: number) => plotLeft + ((v - minX) / (maxX - minX)) * (plotRight - plotLeft)
  const mapY = (v: number) => plotBottom - (v / yMax) * (plotBottom - plotTop)
  const mapYCumulative = (v: number) => plotBottom - v * (plotBottom - plotTop)

  // Draw Kaiser line (eigenvalue = 1)
  if (showKaiser) {
    const kaiserY = Math.round(mapY(1))
    if (kaiserY >= plotTop && kaiserY <= plotBottom) {
      for (let x = plotLeft; x <= plotRight; x += 2) {
        canvas.drawChar(x, kaiserY, '─', kaiserColorParsed)
      }
    }
  }

  // Draw threshold line
  if (threshold !== undefined) {
    const thresholdY = Math.round(mapYCumulative(threshold))
    for (let x = plotLeft; x <= plotRight; x += 2) {
      canvas.drawChar(x, thresholdY, '─', thresholdColorParsed)
    }
  }

  // Draw bars if requested
  if (showBars) {
    const barColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }
    const barWidth = Math.max(1, Math.floor((plotRight - plotLeft) / points.length / 2))

    for (const p of points) {
      const x = Math.round(mapX(p.component))
      const y = Math.round(mapY(p.variance))

      for (let bx = x - barWidth; bx <= x + barWidth; bx++) {
        for (let by = y; by <= plotBottom; by++) {
          canvas.drawChar(bx, by, '░', barColor)
        }
      }
    }
  }

  // Draw connecting line for variance
  if (connectPoints && points.length > 1) {
    const lineColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
    for (let i = 1; i < points.length; i++) {
      const x1 = Math.round(mapX(points[i - 1].component))
      const y1 = Math.round(mapY(points[i - 1].variance))
      const x2 = Math.round(mapX(points[i].component))
      const y2 = Math.round(mapY(points[i].variance))

      // Simple line
      const steps = Math.max(Math.abs(x2 - x1), 1)
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const x = Math.round(x1 + t * (x2 - x1))
        const y = Math.round(y1 + t * (y2 - y1))
        canvas.drawChar(x, y, '─', lineColor)
      }
    }
  }

  // Draw cumulative line
  if (showCumulative && cumulativePoints.length > 1) {
    for (let i = 1; i < cumulativePoints.length; i++) {
      const x1 = Math.round(mapX(cumulativePoints[i - 1].component))
      const y1 = Math.round(mapYCumulative(cumulativePoints[i - 1].cumulative))
      const x2 = Math.round(mapX(cumulativePoints[i].component))
      const y2 = Math.round(mapYCumulative(cumulativePoints[i].cumulative))

      const steps = Math.max(Math.abs(x2 - x1), 1)
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const x = Math.round(x1 + t * (x2 - x1))
        const y = Math.round(y1 + t * (y2 - y1))
        canvas.drawChar(x, y, '─', cumulativeColorParsed)
      }
    }

    // Draw cumulative points
    for (const p of cumulativePoints) {
      const x = Math.round(mapX(p.component))
      const y = Math.round(mapYCumulative(p.cumulative))
      canvas.drawChar(x, y, '○', cumulativeColorParsed)
    }
  }

  // Draw variance points
  const pointColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  for (const p of points) {
    const x = Math.round(mapX(p.component))
    const y = Math.round(mapY(p.variance))
    canvas.drawChar(x, y, pointChar, pointColor)
  }
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
    case 'density':
      renderGeomDensity(data, geom, aes, scales, canvas)
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
    case 'ridgeline':
    case 'joy':
      renderGeomRidgeline(data, geom, aes, scales, canvas)
      break
    case 'tile':
    case 'raster':
    case 'bin2d':
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
    case 'crossbar':
      renderGeomCrossbar(data, geom, aes, scales, canvas)
      break
    case 'pointrange':
      renderGeomPointrange(data, geom, aes, scales, canvas)
      break
    case 'smooth':
      renderGeomSmooth(data, geom, aes, scales, canvas)
      break
    case 'beeswarm':
    case 'quasirandom':
      renderGeomBeeswarm(data, geom, aes, scales, canvas)
      break
    case 'dumbbell':
      renderGeomDumbbell(data, geom, aes, scales, canvas)
      break
    case 'lollipop':
      renderGeomLollipop(data, geom, aes, scales, canvas)
      break
    // Terminal-native geoms
    case 'waffle':
      renderGeomWaffle(data, geom, aes, scales, canvas)
      break
    case 'sparkline':
      renderGeomSparkline(data, geom, aes, scales, canvas)
      break
    case 'bullet':
      renderGeomBullet(data, geom, aes, scales, canvas)
      break
    case 'braille':
      renderGeomBraille(data, geom, aes, scales, canvas)
      break
    // Specialized visualizations
    case 'calendar':
      renderGeomCalendar(data, geom, aes, scales, canvas)
      break
    case 'flame':
    case 'icicle':
      renderGeomFlame(data, geom, aes, scales, canvas)
      break
    case 'corrmat':
      renderGeomCorrmat(data, geom, aes, scales, canvas)
      break
    case 'sankey':
      renderGeomSankey(data, geom, aes, scales, canvas)
      break
    case 'treemap':
      renderGeomTreemap(data, geom, aes, scales, canvas)
      break
    case 'volcano':
      renderGeomVolcano(data, geom, aes, scales, canvas)
      break
    case 'ma':
      renderGeomMA(data, geom, aes, scales, canvas)
      break
    case 'manhattan':
      renderGeomManhattan(data, geom, aes, scales, canvas)
      break
    case 'heatmap':
      renderGeomHeatmap(data, geom, aes, scales, canvas)
      break
    case 'biplot':
      renderGeomBiplot(data, geom, aes, scales, canvas)
      break
    // Clinical/Statistical visualizations
    case 'kaplan_meier':
      renderGeomKaplanMeier(data, geom, aes, scales, canvas)
      break
    case 'forest':
      renderGeomForest(data, geom, aes, scales, canvas)
      break
    case 'roc':
      renderGeomRoc(data, geom, aes, scales, canvas)
      break
    case 'bland_altman':
      renderGeomBlandAltman(data, geom, aes, scales, canvas)
      break
    // Statistical diagnostic geoms
    case 'qq':
      renderGeomQQ(data, geom, aes, scales, canvas)
      break
    case 'ecdf':
      renderGeomECDF(data, geom, aes, scales, canvas)
      break
    case 'funnel':
      renderGeomFunnel(data, geom, aes, scales, canvas)
      break
    case 'control':
      renderGeomControl(data, geom, aes, scales, canvas)
      break
    case 'scree':
      renderGeomScree(data, geom, aes, scales, canvas)
      break
    case 'upset':
      renderGeomUpset(data, geom, aes, scales, canvas)
      break
    case 'dendrogram':
      renderGeomDendrogram(data, geom, aes, scales, canvas)
      break
    default:
      // Unknown geom type, skip
      break
  }
}

/**
 * Render UpSet plot for set intersections
 */
function renderGeomUpset(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const sets = params.sets as string[] | undefined
  const minSize = (params.min_size as number) ?? 1
  const maxIntersections = (params.max_intersections as number) ?? 20
  const sortBy = (params.sort_by as string) ?? 'size'
  const sortOrder = (params.sort_order as string) ?? 'desc'
  const showSetSizes = params.show_set_sizes ?? true
  const dotChar = (params.dot_char as string) ?? '●'
  const emptyChar = (params.empty_char as string) ?? '○'
  const lineChar = (params.line_char as string) ?? '│'
  const barChar = (params.bar_char as string) ?? '█'

  // Detect set columns from data or params
  let setNames: string[] = []
  if (sets && sets.length > 0) {
    setNames = sets
  } else if (data.length > 0) {
    // Try to detect binary columns (0/1 values)
    const firstRow = data[0]
    for (const key of Object.keys(firstRow)) {
      const values = data.map(row => row[key as keyof typeof row])
      const isBinary = values.every(v => v === 0 || v === 1 || v === '0' || v === '1')
      if (isBinary && key !== 'id' && key !== 'name' && key !== 'element') {
        setNames.push(key)
      }
    }
    // If no binary columns, try 'sets' column with comma-separated values
    if (setNames.length === 0) {
      const setsField = typeof aes.x === 'string' ? aes.x : 'sets'
      const allSets = new Set<string>()
      for (const row of data) {
        const val = row[setsField as keyof typeof row]
        if (typeof val === 'string') {
          val.split(',').forEach(s => allSets.add(s.trim()))
        }
      }
      setNames = Array.from(allSets).sort()
    }
  }

  if (setNames.length === 0) return

  // Calculate intersections
  interface Intersection {
    sets: Set<string>
    count: number
    key: string
  }

  const intersectionMap = new Map<string, number>()

  // Check if data has comma-separated 'sets' column
  const setsField = typeof aes.x === 'string' ? aes.x : 'sets'
  const hasListFormat = data.length > 0 && typeof data[0][setsField as keyof typeof data[0]] === 'string'

  for (const row of data) {
    let memberSets: string[]
    if (hasListFormat) {
      const val = row[setsField as keyof typeof row]
      memberSets = typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(s => setNames.includes(s)) : []
    } else {
      memberSets = setNames.filter(s => {
        const v = row[s as keyof typeof row]
        return v === 1 || v === '1'
      })
    }

    if (memberSets.length > 0) {
      const key = memberSets.sort().join('|')
      intersectionMap.set(key, (intersectionMap.get(key) || 0) + 1)
    }
  }

  // Convert to array and filter
  let intersections: Intersection[] = Array.from(intersectionMap.entries())
    .map(([key, count]) => ({
      sets: new Set(key.split('|')),
      count,
      key,
    }))
    .filter(i => i.count >= minSize)

  // Sort intersections
  if (sortBy === 'size') {
    intersections.sort((a, b) => sortOrder === 'desc' ? b.count - a.count : a.count - b.count)
  } else if (sortBy === 'degree') {
    intersections.sort((a, b) => sortOrder === 'desc' ? b.sets.size - a.sets.size : a.sets.size - b.sets.size)
  }

  // Limit intersections
  intersections = intersections.slice(0, maxIntersections)

  if (intersections.length === 0) return

  // Calculate layout
  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  // Layout: top part for bar chart, bottom part for matrix
  const matrixHeight = Math.min(setNames.length * 2 + 2, Math.floor(plotHeight * 0.4))
  const barHeight = plotHeight - matrixHeight - 2

  const barTop = plotTop
  const barBottom = plotTop + barHeight
  const matrixTop = barBottom + 2

  // Calculate column width
  const setLabelWidth = showSetSizes ? Math.max(...setNames.map(s => s.length)) + 8 : 0
  const colWidth = Math.max(2, Math.floor((plotWidth - setLabelWidth) / intersections.length))

  const maxCount = Math.max(...intersections.map(i => i.count))

  const barColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  const dotColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }
  const lineColor: RGBA = { r: 100, g: 100, b: 100, a: 1 }
  const labelColor: RGBA = { r: 150, g: 150, b: 150, a: 1 }

  // Draw bar chart
  for (let i = 0; i < intersections.length; i++) {
    const inter = intersections[i]
    const x = plotLeft + setLabelWidth + i * colWidth + Math.floor(colWidth / 2)
    const barHeightPx = Math.round((inter.count / maxCount) * barHeight)

    for (let y = barBottom - barHeightPx; y <= barBottom; y++) {
      canvas.drawChar(x, y, barChar, barColor)
    }

    // Draw count label above bar
    const countStr = inter.count.toString()
    const labelY = barBottom - barHeightPx - 1
    if (labelY >= barTop) {
      for (let ci = 0; ci < countStr.length; ci++) {
        canvas.drawChar(x - Math.floor(countStr.length / 2) + ci, labelY, countStr[ci], labelColor)
      }
    }
  }

  // Draw matrix
  const rowSpacing = Math.max(1, Math.floor(matrixHeight / setNames.length))

  // Draw set labels on the left
  if (showSetSizes) {
    for (let si = 0; si < setNames.length; si++) {
      const setName = setNames[si]
      const y = matrixTop + si * rowSpacing + 1

      // Count set size
      let setSize = 0
      for (const row of data) {
        if (hasListFormat) {
          const val = row[setsField as keyof typeof row]
          if (typeof val === 'string' && val.split(',').map(s => s.trim()).includes(setName)) {
            setSize++
          }
        } else {
          const v = row[setName as keyof typeof row]
          if (v === 1 || v === '1') setSize++
        }
      }

      // Draw label
      const label = `${setName.substring(0, 6)}`
      for (let ci = 0; ci < label.length; ci++) {
        canvas.drawChar(plotLeft + ci, y, label[ci], labelColor)
      }

      // Draw size bar
      const sizeBarLen = Math.max(1, Math.round((setSize / data.length) * 5))
      for (let bi = 0; bi < sizeBarLen; bi++) {
        canvas.drawChar(plotLeft + label.length + 1 + bi, y, '▪', barColor)
      }
    }
  }

  // Draw matrix dots and lines
  for (let i = 0; i < intersections.length; i++) {
    const inter = intersections[i]
    const x = plotLeft + setLabelWidth + i * colWidth + Math.floor(colWidth / 2)

    const activeRows: number[] = []

    for (let si = 0; si < setNames.length; si++) {
      const setName = setNames[si]
      const y = matrixTop + si * rowSpacing + 1
      const isActive = inter.sets.has(setName)

      if (isActive) {
        canvas.drawChar(x, y, dotChar, dotColor)
        activeRows.push(y)
      } else {
        canvas.drawChar(x, y, emptyChar, { r: 200, g: 200, b: 200, a: 1 })
      }
    }

    // Draw connecting lines between active dots
    if (activeRows.length > 1) {
      const minY = Math.min(...activeRows)
      const maxY = Math.max(...activeRows)
      for (let y = minY + 1; y < maxY; y++) {
        if (!activeRows.includes(y)) {
          canvas.drawChar(x, y, lineChar, lineColor)
        }
      }
    }
  }
}

/**
 * Render dendrogram for hierarchical clustering visualization
 */
function renderGeomDendrogram(
  data: DataSource,
  geom: Geom,
  _aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const params = geom.params || {}
  const orientation = (params.orientation as string) ?? 'vertical'
  const labels = params.labels as string[] | undefined
  const showLabels = params.show_labels ?? true
  const hang = params.hang ?? false
  const hConnector = (params.h_connector as string) ?? '─'
  const vConnector = (params.v_connector as string) ?? '│'
  const cornerTR = (params.corner_tr as string) ?? '┐'
  const cornerBL = (params.corner_bl as string) ?? '└'
  const cornerBR = (params.corner_br as string) ?? '┘'
  const leafChar = (params.leaf_char as string) ?? '○'
  const parentCol = (params.parent_col as string) ?? 'parent'
  const heightCol = (params.height_col as string) ?? 'height'
  const idCol = (params.id_col as string) ?? 'id'

  const plotLeft = Math.round(scales.x.range[0])
  const plotRight = Math.round(scales.x.range[1])
  const plotTop = Math.round(scales.y.range[1])
  const plotBottom = Math.round(scales.y.range[0])

  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  const lineColor: RGBA = { r: 50, g: 50, b: 50, a: 1 }
  const leafColor: RGBA = { r: 31, g: 119, b: 180, a: 1 }
  const labelColor: RGBA = { r: 100, g: 100, b: 100, a: 1 }

  // Check data format
  // Format 1: Linkage matrix (merge1, merge2, height, size)
  // Format 2: Parent-child (id, parent, height)

  const hasLinkageFormat = data.length > 0 &&
    ('merge1' in data[0] || 'merge_1' in data[0])

  if (hasLinkageFormat) {
    // Linkage matrix format
    interface LinkageRow {
      merge1: number
      merge2: number
      height: number
      size?: number
    }

    const linkage: LinkageRow[] = data.map(row => ({
      merge1: Number(row['merge1' as keyof typeof row] ?? row['merge_1' as keyof typeof row]),
      merge2: Number(row['merge2' as keyof typeof row] ?? row['merge_2' as keyof typeof row]),
      height: Number(row[heightCol as keyof typeof row] ?? row['height' as keyof typeof row]),
      size: Number(row['size' as keyof typeof row] ?? 2),
    }))

    if (linkage.length === 0) return

    // Number of original observations
    const n = linkage.length + 1

    // Build tree structure
    interface TreeNode {
      id: number
      left?: TreeNode
      right?: TreeNode
      height: number
      x?: number  // Position for rendering
      label?: string
    }

    const nodes: Map<number, TreeNode> = new Map()

    // Initialize leaf nodes
    for (let i = 0; i < n; i++) {
      nodes.set(i, {
        id: i,
        height: 0,
        label: labels?.[i] ?? `${i}`,
      })
    }

    // Build internal nodes from linkage
    for (let i = 0; i < linkage.length; i++) {
      const row = linkage[i]
      const newId = n + i

      const leftNode = nodes.get(row.merge1 < n ? row.merge1 : row.merge1)
      const rightNode = nodes.get(row.merge2 < n ? row.merge2 : row.merge2)

      nodes.set(newId, {
        id: newId,
        left: leftNode,
        right: rightNode,
        height: row.height,
      })
    }

    // Root is the last internal node
    const root = nodes.get(n + linkage.length - 1)
    if (!root) return

    // Calculate x positions (in-order traversal)
    let xPos = 0
    const assignX = (node: TreeNode): void => {
      if (!node.left && !node.right) {
        // Leaf node
        node.x = xPos++
      } else {
        if (node.left) assignX(node.left)
        if (node.right) assignX(node.right)
        // Internal node x is average of children
        const leftX = node.left?.x ?? 0
        const rightX = node.right?.x ?? 0
        node.x = (leftX + rightX) / 2
      }
    }
    assignX(root)

    const maxHeight = root.height
    const leafCount = xPos

    // Map coordinates
    const mapX = (x: number) => {
      if (orientation === 'vertical') {
        return plotLeft + (x / (leafCount - 1 || 1)) * plotWidth
      } else {
        return plotBottom - (x / (leafCount - 1 || 1)) * plotHeight
      }
    }

    const mapY = (h: number) => {
      if (orientation === 'vertical') {
        return plotTop + (1 - h / maxHeight) * (plotHeight - 3)  // Leave space for labels
      } else {
        return plotLeft + (h / maxHeight) * plotWidth
      }
    }

    // Draw tree
    const drawNode = (node: TreeNode): void => {
      if (node.x === undefined) return

      if (node.left && node.right) {
        const nodeY = mapY(node.height)
        const leftX = mapX(node.left.x!)
        const leftY = mapY(node.left.height)
        const rightX = mapX(node.right.x!)
        const rightY = mapY(node.right.height)

        if (orientation === 'vertical') {
          // Draw horizontal line connecting children
          const hLineY = Math.round(nodeY)
          const leftXRound = Math.round(leftX)
          const rightXRound = Math.round(rightX)

          for (let x = Math.min(leftXRound, rightXRound); x <= Math.max(leftXRound, rightXRound); x++) {
            canvas.drawChar(x, hLineY, hConnector, lineColor)
          }

          // Draw corners
          canvas.drawChar(leftXRound, hLineY, cornerBL, lineColor)
          canvas.drawChar(rightXRound, hLineY, cornerBR, lineColor)

          // Draw vertical lines down to children
          const leftYRound = Math.round(leftY)
          const rightYRound = Math.round(rightY)

          for (let y = hLineY + 1; y < leftYRound; y++) {
            canvas.drawChar(leftXRound, y, vConnector, lineColor)
          }
          for (let y = hLineY + 1; y < rightYRound; y++) {
            canvas.drawChar(rightXRound, y, vConnector, lineColor)
          }
        } else {
          // Horizontal orientation
          const hLineX = Math.round(nodeY)
          const leftYRound = Math.round(leftX)
          const rightYRound = Math.round(rightX)

          for (let y = Math.min(leftYRound, rightYRound); y <= Math.max(leftYRound, rightYRound); y++) {
            canvas.drawChar(hLineX, y, vConnector, lineColor)
          }

          canvas.drawChar(hLineX, leftYRound, cornerTR, lineColor)
          canvas.drawChar(hLineX, rightYRound, cornerBR, lineColor)

          const leftXRound = Math.round(mapY(node.left.height))
          const rightXRound = Math.round(mapY(node.right.height))

          for (let x = hLineX + 1; x < leftXRound; x++) {
            canvas.drawChar(x, leftYRound, hConnector, lineColor)
          }
          for (let x = hLineX + 1; x < rightXRound; x++) {
            canvas.drawChar(x, rightYRound, hConnector, lineColor)
          }
        }

        drawNode(node.left)
        drawNode(node.right)
      } else {
        // Leaf node
        if (orientation === 'vertical') {
          const x = Math.round(mapX(node.x))
          const y = hang ? plotBottom - 2 : Math.round(mapY(0))
          canvas.drawChar(x, y, leafChar, leafColor)

          // Draw label below
          if (showLabels && node.label) {
            const label = node.label.substring(0, 4)
            for (let ci = 0; ci < label.length; ci++) {
              canvas.drawChar(x - Math.floor(label.length / 2) + ci, y + 1, label[ci], labelColor)
            }
          }
        } else {
          const y = Math.round(mapX(node.x))
          const x = Math.round(mapY(0))
          canvas.drawChar(x, y, leafChar, leafColor)

          if (showLabels && node.label) {
            const label = node.label.substring(0, 6)
            for (let ci = 0; ci < label.length; ci++) {
              canvas.drawChar(x + 2 + ci, y, label[ci], labelColor)
            }
          }
        }
      }
    }

    drawNode(root)

  } else {
    // Parent-child format
    interface TreeNode {
      id: string
      parent: string | null
      height: number
      children: TreeNode[]
      x?: number
    }

    const nodeMap = new Map<string, TreeNode>()

    // Build node map
    for (const row of data) {
      const id = String(row[idCol as keyof typeof row] ?? '')
      const parent = row[parentCol as keyof typeof row]
      const height = Number(row[heightCol as keyof typeof row] ?? 0)

      nodeMap.set(id, {
        id,
        parent: parent === null || parent === '' || parent === 'null' ? null : String(parent),
        height,
        children: [],
      })
    }

    // Build tree structure
    let root: TreeNode | null = null
    for (const node of nodeMap.values()) {
      if (node.parent === null) {
        root = node
      } else {
        const parentNode = nodeMap.get(node.parent)
        if (parentNode) {
          parentNode.children.push(node)
        }
      }
    }

    if (!root) return

    // Calculate x positions
    let xPos = 0
    const assignX = (node: TreeNode): void => {
      if (node.children.length === 0) {
        node.x = xPos++
      } else {
        for (const child of node.children) {
          assignX(child)
        }
        const childXs = node.children.map(c => c.x ?? 0)
        node.x = childXs.reduce((a, b) => a + b, 0) / childXs.length
      }
    }
    assignX(root)

    // Find max height and leaf count
    const findMaxHeight = (node: TreeNode): number => {
      if (node.children.length === 0) return node.height
      return Math.max(node.height, ...node.children.map(findMaxHeight))
    }
    const maxHeight = findMaxHeight(root) || 1
    const leafCount = xPos || 1

    // Map coordinates
    const mapX = (x: number) => plotLeft + (x / (leafCount - 1 || 1)) * plotWidth
    const mapY = (h: number) => plotTop + (1 - h / maxHeight) * (plotHeight - 3)

    // Draw tree
    const drawNode = (node: TreeNode): void => {
      if (node.x === undefined) return

      if (node.children.length > 0) {
        const nodeY = Math.round(mapY(node.height))

        // Draw horizontal line spanning all children
        const childXs = node.children.map(c => Math.round(mapX(c.x ?? 0)))
        const minX = Math.min(...childXs)
        const maxX = Math.max(...childXs)

        for (let x = minX; x <= maxX; x++) {
          canvas.drawChar(x, nodeY, hConnector, lineColor)
        }

        // Draw corners and vertical lines
        for (const child of node.children) {
          const childX = Math.round(mapX(child.x ?? 0))
          const childY = Math.round(mapY(child.height))

          canvas.drawChar(childX, nodeY, child === node.children[0] ? cornerBL :
                          child === node.children[node.children.length - 1] ? cornerBR : '┴', lineColor)

          for (let y = nodeY + 1; y < childY; y++) {
            canvas.drawChar(childX, y, vConnector, lineColor)
          }

          drawNode(child)
        }
      } else {
        // Leaf
        const x = Math.round(mapX(node.x))
        const y = hang ? plotBottom - 2 : Math.round(mapY(node.height))
        canvas.drawChar(x, y, leafChar, leafColor)

        if (showLabels) {
          const label = node.id.substring(0, 4)
          for (let ci = 0; ci < label.length; ci++) {
            canvas.drawChar(x - Math.floor(label.length / 2) + ci, y + 1, label[ci], labelColor)
          }
        }
      }
    }

    drawNode(root)
  }
}
