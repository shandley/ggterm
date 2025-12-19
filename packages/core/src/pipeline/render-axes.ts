/**
 * Axis rendering for plots
 */

import type { TerminalCanvas } from '../canvas/canvas'
import type { Labels, RGBA, Theme } from '../types'
import type { ResolvedScale } from './scales'

/**
 * Axis configuration
 */
export interface AxisConfig {
  scale: ResolvedScale
  position: 'bottom' | 'left' | 'top' | 'right'
  label?: string
  theme: Theme
}

/**
 * Calculate nice tick values for a continuous scale
 *
 * For transformed scales (log10, sqrt, reverse), ticks are calculated
 * in the transformed space and then inverted back to data space.
 */
export function calculateTicks(
  domain: [number, number],
  targetTicks: number = 5,
  transform?: (v: number) => number,
  invert?: (v: number) => number
): number[] {
  const [min, max] = domain

  // For log10 scale, use special tick calculation
  if (transform && invert) {
    const transMin = transform(min)
    const transMax = transform(max)

    // Check if this looks like a log scale (transform of 10 is 1, transform of 100 is 2)
    const isLogScale = Math.abs(transform(10) - 1) < 0.001 && Math.abs(transform(100) - 2) < 0.001

    if (isLogScale && min > 0) {
      // For log scales, use powers of 10
      const ticks: number[] = []
      const minPow = Math.floor(transMin)
      const maxPow = Math.ceil(transMax)

      for (let pow = minPow; pow <= maxPow; pow++) {
        const tick = invert(pow)
        if (tick >= min * 0.999 && tick <= max * 1.001) {
          ticks.push(tick)
        }
      }

      // If we have too few ticks, add intermediate values
      if (ticks.length < 3 && ticks.length > 0) {
        const newTicks: number[] = []
        for (const tick of ticks) {
          newTicks.push(tick)
          const nextTick = tick * 10
          if (nextTick <= max) {
            // Add 2 and 5 as intermediate ticks
            for (const mult of [2, 5]) {
              const interTick = tick * mult
              if (interTick >= min && interTick <= max && !ticks.includes(interTick)) {
                newTicks.push(interTick)
              }
            }
          }
        }
        return newTicks.sort((a, b) => a - b)
      }

      return ticks.length > 0 ? ticks : [min, max]
    }

    // For other transforms (sqrt, reverse), calculate in transformed space
    const transRange = transMax - transMin
    if (transRange === 0) return [min]

    const rawStep = transRange / Math.max(1, targetTicks - 1)
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))))
    const normalized = rawStep / magnitude

    let niceStep: number
    if (normalized <= 1.5) niceStep = 1
    else if (normalized <= 3) niceStep = 2
    else if (normalized <= 7) niceStep = 5
    else niceStep = 10

    niceStep *= magnitude

    const ticks: number[] = []
    const start = Math.floor(transMin / niceStep) * niceStep

    for (let transTick = start; transTick <= transMax + niceStep * 0.001; transTick += niceStep) {
      if (transTick >= transMin - niceStep * 0.001 && transTick <= transMax + niceStep * 0.001) {
        const tick = invert(Math.round(transTick * 1e10) / 1e10)
        if (tick >= min * 0.999 && tick <= max * 1.001) {
          ticks.push(tick)
        }
      }
    }

    return ticks.length > 0 ? ticks : [min, max]
  }

  // Standard linear tick calculation
  const range = max - min
  if (range === 0) return [min]

  // Calculate a nice step size
  const rawStep = range / Math.max(1, targetTicks - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude

  // Choose a "nice" step that's close to the raw step
  let niceStep: number
  if (normalized <= 1.5) niceStep = 1
  else if (normalized <= 3) niceStep = 2
  else if (normalized <= 7) niceStep = 5
  else niceStep = 10

  niceStep *= magnitude

  // Generate ticks starting from a nice round number
  const ticks: number[] = []
  const start = Math.floor(min / niceStep) * niceStep

  for (let tick = start; tick <= max + niceStep * 0.001; tick += niceStep) {
    // Only include ticks within or very close to the domain
    if (tick >= min - niceStep * 0.001 && tick <= max + niceStep * 0.001) {
      // Round to avoid floating point errors
      const roundedTick = Math.round(tick * 1e10) / 1e10
      ticks.push(roundedTick)
    }
  }

  // Ensure we have at least min and max if range is small
  if (ticks.length === 0) {
    ticks.push(min, max)
  } else if (ticks.length === 1) {
    if (ticks[0] > min) ticks.unshift(min)
    if (ticks[0] < max) ticks.push(max)
  }

  return ticks
}

/**
 * Format a tick value for display
 */
export function formatTick(value: number): string {
  // Handle very small or very large numbers with scientific notation
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(1)
  }

  // Round to avoid floating point artifacts
  const rounded = Math.round(value * 1e10) / 1e10

  // Remove unnecessary decimal places
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }

  // Limit decimal places
  const str = rounded.toFixed(2)
  return str.replace(/\.?0+$/, '')
}

/**
 * Render bottom (x) axis
 */
export function renderBottomAxis(
  canvas: TerminalCanvas,
  scale: ResolvedScale,
  y: number,
  xStart: number,
  xEnd: number,
  label: string | undefined,
  _theme: Theme
): void {
  const axisColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  // Draw axis line
  canvas.drawHLine(xStart, y, xEnd - xStart + 1, '─', axisColor)

  // Calculate and draw ticks
  if (scale.type === 'continuous') {
    const domain = scale.domain as [number, number]
    // Use custom breaks if provided, otherwise calculate nice ticks
    const ticks = scale.breaks ?? (() => {
      // Request more ticks - aim for one every ~8 characters
      const targetTicks = Math.max(3, Math.floor((xEnd - xStart) / 8))
      // Pass transform functions for proper tick calculation on transformed scales
      return calculateTicks(domain, targetTicks, scale.transform, scale.invert)
    })()

    for (let i = 0; i < ticks.length; i++) {
      const tickValue = ticks[i]
      const x = Math.round(scale.toCanvas(scale.normalize(tickValue)))
      if (x >= xStart && x <= xEnd) {
        // Tick mark
        canvas.drawChar(x, y, '┬', axisColor)

        // Tick label - use custom label if provided, otherwise format the value
        const tickLabel = scale.labels?.[i] ?? formatTick(tickValue)
        const labelX = x - Math.floor(tickLabel.length / 2)
        canvas.drawString(Math.max(xStart, labelX), y + 1, tickLabel, axisColor)
      }
    }
  } else if (scale.type === 'discrete') {
    // Discrete scale - show category labels
    const domain = scale.domain as string[]
    for (const category of domain) {
      const x = Math.round(scale.map(category))
      if (x >= xStart && x <= xEnd) {
        // Tick mark
        canvas.drawChar(x, y, '┬', axisColor)

        // Category label (truncate with ellipsis if needed)
        const maxLen = Math.floor((xEnd - xStart) / domain.length) - 1
        let tickLabel: string
        if (category.length > maxLen) {
          // Truncate and add ellipsis if there's room
          if (maxLen >= 4) {
            tickLabel = category.substring(0, maxLen - 1) + '…'
          } else {
            tickLabel = category.substring(0, Math.max(1, maxLen))
          }
        } else {
          tickLabel = category
        }
        const labelX = x - Math.floor(tickLabel.length / 2)
        canvas.drawString(Math.max(xStart, labelX), y + 1, tickLabel, axisColor)
      }
    }
  }

  // Draw axis label centered below tick labels
  if (label) {
    const labelX = xStart + Math.floor((xEnd - xStart - label.length) / 2)
    canvas.drawString(labelX, y + 2, label, axisColor)
  }
}

/**
 * Render left (y) axis
 */
export function renderLeftAxis(
  canvas: TerminalCanvas,
  scale: ResolvedScale,
  x: number,
  yStart: number,
  yEnd: number,
  label: string | undefined,
  _theme: Theme
): void {
  const axisColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  // Draw axis line (vertical)
  const top = Math.min(yStart, yEnd)
  const bottom = Math.max(yStart, yEnd)
  canvas.drawVLine(x, top, bottom - top + 1, '│', axisColor)

  // Calculate and draw ticks
  if (scale.type === 'continuous') {
    const domain = scale.domain as [number, number]
    // Use custom breaks if provided, otherwise calculate nice ticks
    const ticks = scale.breaks ?? (() => {
      // Request more ticks - aim for one every ~3 rows
      const targetTicks = Math.max(3, Math.floor((bottom - top) / 3))
      // Pass transform functions for proper tick calculation on transformed scales
      return calculateTicks(domain, targetTicks, scale.transform, scale.invert)
    })()

    for (let i = 0; i < ticks.length; i++) {
      const tickValue = ticks[i]
      const y = Math.round(scale.toCanvas(scale.normalize(tickValue)))
      if (y >= top && y <= bottom) {
        // Tick mark
        canvas.drawChar(x, y, '┤', axisColor)

        // Tick label - use custom label if provided, otherwise format the value
        const tickLabel = scale.labels?.[i] ?? formatTick(tickValue)
        const labelX = x - tickLabel.length - 1
        canvas.drawString(Math.max(0, labelX), y, tickLabel, axisColor)
      }
    }
  }

  // Draw axis label horizontally in the left margin
  if (label) {
    // Truncate label if too long for margin
    const maxLabelLen = x - 1
    const displayLabel = label.length > maxLabelLen
      ? label.substring(0, maxLabelLen)
      : label
    // Center vertically
    const labelY = top + Math.floor((bottom - top) / 2)
    canvas.drawString(0, labelY, displayLabel, axisColor)
  }
}

/**
 * Render all axes for a plot
 */
export function renderAxes(
  canvas: TerminalCanvas,
  scales: { x: ResolvedScale; y: ResolvedScale },
  plotArea: { x: number; y: number; width: number; height: number },
  labels: Labels,
  theme: Theme
): void {
  // Bottom axis (x)
  renderBottomAxis(
    canvas,
    scales.x,
    plotArea.y + plotArea.height,
    plotArea.x,
    plotArea.x + plotArea.width - 1,
    labels.x,
    theme
  )

  // Left axis (y)
  renderLeftAxis(
    canvas,
    scales.y,
    plotArea.x - 1,
    plotArea.y,
    plotArea.y + plotArea.height - 1,
    labels.y,
    theme
  )

  // Draw corner
  canvas.drawChar(plotArea.x - 1, plotArea.y + plotArea.height, '└', {
    r: 180,
    g: 180,
    b: 180,
    a: 1,
  })
}

/**
 * Render grid lines for the plot
 */
export function renderGridLines(
  canvas: TerminalCanvas,
  scales: { x: ResolvedScale; y: ResolvedScale },
  plotArea: { x: number; y: number; width: number; height: number },
  theme: Theme
): void {
  const gridChar = theme.panel.grid.major
  if (!gridChar) return

  const gridColor: RGBA = { r: 80, g: 80, b: 80, a: 1 }

  // Horizontal grid lines (at y tick positions)
  if (scales.y.type === 'continuous') {
    const yDomain = scales.y.domain as [number, number]
    const targetTicks = Math.max(3, Math.floor(plotArea.height / 3))
    const yTicks = calculateTicks(yDomain, targetTicks)

    for (const tickValue of yTicks) {
      const y = Math.round(scales.y.toCanvas(scales.y.normalize(tickValue)))
      if (y >= plotArea.y && y < plotArea.y + plotArea.height) {
        for (let x = plotArea.x; x < plotArea.x + plotArea.width; x++) {
          canvas.drawChar(x, y, gridChar, gridColor)
        }
      }
    }
  }

  // Vertical grid lines (at x tick positions)
  if (scales.x.type === 'continuous') {
    const xDomain = scales.x.domain as [number, number]
    const targetTicks = Math.max(3, Math.floor(plotArea.width / 8))
    const xTicks = calculateTicks(xDomain, targetTicks)

    for (const tickValue of xTicks) {
      const x = Math.round(scales.x.toCanvas(scales.x.normalize(tickValue)))
      if (x >= plotArea.x && x < plotArea.x + plotArea.width) {
        for (let y = plotArea.y; y < plotArea.y + plotArea.height; y++) {
          canvas.drawChar(x, y, gridChar, gridColor)
        }
      }
    }
  } else if (scales.x.type === 'discrete') {
    // For discrete scales, draw grid lines at category positions
    const domain = scales.x.domain as string[]
    for (const category of domain) {
      const x = Math.round(scales.x.map(category))
      if (x >= plotArea.x && x < plotArea.x + plotArea.width) {
        for (let y = plotArea.y; y < plotArea.y + plotArea.height; y++) {
          canvas.drawChar(x, y, gridChar, gridColor)
        }
      }
    }
  }
}

/**
 * Render plot title
 */
export function renderTitle(
  canvas: TerminalCanvas,
  title: string,
  width: number,
  theme: Theme
): void {
  const titleColor: RGBA = { r: 255, g: 255, b: 255, a: 1 }

  let x: number
  switch (theme.title.align) {
    case 'left':
      x = 1
      break
    case 'right':
      x = width - title.length - 1
      break
    case 'center':
    default:
      x = Math.floor((width - title.length) / 2)
  }

  canvas.drawString(x, 0, title, titleColor)
}

/**
 * Render legend for color aesthetic
 */
export function renderLegend(
  canvas: TerminalCanvas,
  colorDomain: string[],
  colorMap: (value: string) => RGBA,
  x: number,
  y: number,
  title: string | undefined,
  theme: Theme,
  width?: number
): void {
  if (theme.legend.position === 'none') return

  const legendColor: RGBA = { r: 180, g: 180, b: 180, a: 1 }

  if (theme.legend.position === 'bottom' && width) {
    // Horizontal layout for bottom legend
    let currentX = x

    // Legend title (optional, inline)
    if (title) {
      canvas.drawString(currentX, y, title + ':', legendColor)
      currentX += title.length + 2
    }

    // Legend items laid out horizontally
    for (const value of colorDomain) {
      const color = colorMap(value)
      const label = value.substring(0, 10)
      const itemWidth = label.length + 3 // bullet + space + label + spacing

      // Check if we have room for this item
      if (currentX + itemWidth > x + width) {
        break // No more room
      }

      canvas.drawChar(currentX, y, '●', color)
      canvas.drawString(currentX + 2, y, label, legendColor)
      currentX += itemWidth
    }
  } else {
    // Vertical layout for right legend (default)
    let currentY = y

    // Legend title
    if (title) {
      canvas.drawString(x, currentY, title, legendColor)
      currentY++
    }

    // Legend items
    for (const value of colorDomain) {
      const color = colorMap(value)
      canvas.drawChar(x, currentY, '●', color)
      canvas.drawString(x + 2, currentY, value.substring(0, 12), legendColor)
      currentY++
    }
  }
}
