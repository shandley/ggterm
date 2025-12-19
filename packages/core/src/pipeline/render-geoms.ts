/**
 * Geometry rendering to canvas
 *
 * Each geometry renderer takes data, scales, and canvas, and draws the visual marks.
 */

import type { TerminalCanvas } from '../canvas/canvas'
import type { AestheticMapping, DataSource, Geom, RGBA } from '../types'
import type { ScaleContext, ResolvedColorScale } from './scales'
import { DEFAULT_POINT_COLOR } from './scales'

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

  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    // Skip missing data
    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    // Map to canvas coordinates
    const cx = scales.x.map(xVal)
    const cy = scales.y.map(yVal)

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
 * Render geom_bar (vertical bars)
 */
export function renderGeomBar(
  data: DataSource,
  geom: Geom,
  aes: AestheticMapping,
  scales: ScaleContext,
  canvas: TerminalCanvas
): void {
  const barWidth = Math.max(1, Math.floor((geom.params.width as number) ?? 1))

  // Get plot area boundaries from scale range
  // y range is [bottom, top] (inverted for canvas coordinates)
  const plotBottom = Math.round(scales.y.range[0])
  const plotTop = Math.round(scales.y.range[1])

  for (const row of data) {
    const xVal = row[aes.x]
    const yVal = row[aes.y]

    if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
      continue
    }

    const cx = Math.round(scales.x.map(xVal))
    const cy = Math.round(scales.y.map(yVal))

    // Calculate baseline, clamped to plot area
    let baseline = Math.round(scales.y.map(0))
    baseline = Math.max(plotTop, Math.min(plotBottom, baseline))

    const color = getPointColor(row, aes, scales.color)

    // Draw vertical bar from baseline to value, clamped to plot area
    const top = Math.max(plotTop, Math.min(cy, baseline))
    const bottom = Math.min(plotBottom, Math.max(cy, baseline))

    for (let y = top; y <= bottom; y++) {
      for (let dx = 0; dx < barWidth; dx++) {
        canvas.drawChar(cx + dx - Math.floor(barWidth / 2), y, '█', color)
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
  const boxWidth = Math.max(1, Math.floor((geom.params.width as number ?? 3)))
  const showOutliers = geom.params.outliers !== false

  const boxColor: RGBA = { r: 79, g: 169, b: 238, a: 1 }
  const whiskerColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }
  const medianColor: RGBA = { r: 255, g: 200, b: 50, a: 1 }
  const outlierColor: RGBA = { r: 214, g: 39, b: 40, a: 1 }

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
      canvas.drawChar(cx, y, '│', whiskerColor)
    }
    // Lower whisker cap
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      canvas.drawChar(cx + dx, yLower, '─', whiskerColor)
    }

    // Draw upper whisker (vertical line from Q3 to upper)
    for (let y = yUpper; y <= yQ3; y++) {
      canvas.drawChar(cx, y, '│', whiskerColor)
    }
    // Upper whisker cap
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      canvas.drawChar(cx + dx, yUpper, '─', whiskerColor)
    }

    // Draw box (from Q1 to Q3)
    // Top of box (Q3)
    canvas.drawChar(cx - halfWidth, yQ3, '┌', boxColor)
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      canvas.drawChar(cx + dx, yQ3, '─', boxColor)
    }
    canvas.drawChar(cx + halfWidth, yQ3, '┐', boxColor)

    // Sides of box
    for (let y = yQ3 + 1; y < yQ1; y++) {
      canvas.drawChar(cx - halfWidth, y, '│', boxColor)
      canvas.drawChar(cx + halfWidth, y, '│', boxColor)
    }

    // Bottom of box (Q1)
    canvas.drawChar(cx - halfWidth, yQ1, '└', boxColor)
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      canvas.drawChar(cx + dx, yQ1, '─', boxColor)
    }
    canvas.drawChar(cx + halfWidth, yQ1, '┘', boxColor)

    // Draw median line
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      canvas.drawChar(cx + dx, yMedian, '━', medianColor)
    }

    // Draw outliers
    if (showOutliers && outliers.length > 0) {
      for (const outlier of outliers) {
        const yOutlier = Math.round(scales.y.map(outlier))
        canvas.drawChar(cx, yOutlier, '○', outlierColor)
      }
    }
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
  canvas: TerminalCanvas
): void {
  switch (geom.type) {
    case 'point':
      renderGeomPoint(data, geom, aes, scales, canvas)
      break
    case 'line':
      renderGeomLine(data, geom, aes, scales, canvas)
      break
    case 'bar':
    case 'col':
      renderGeomBar(data, geom, aes, scales, canvas)
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
    case 'boxplot':
      renderGeomBoxplot(data, geom, aes, scales, canvas)
      break
    default:
      // Unknown geom type, skip
      break
  }
}
