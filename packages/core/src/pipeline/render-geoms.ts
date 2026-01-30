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
    default:
      // Unknown geom type, skip
      break
  }
}
