/**
 * @ggterm/render-block - Block character renderer
 *
 * Uses Unicode block characters for universal terminal compatibility.
 * Implements half-block subpixel rendering for 2x vertical resolution.
 */

import type { Canvas, RenderOptions, Renderer, RGBA } from '@ggterm/core'

/**
 * Block characters for rendering
 */
export const BLOCKS = {
  full: '█', // Full block (U+2588)
  upper: '▀', // Upper half (U+2580)
  lower: '▄', // Lower half (U+2584)
  left: '▌', // Left half (U+258C)
  right: '▐', // Right half (U+2590)
  light: '░', // Light shade (U+2591)
  medium: '▒', // Medium shade (U+2592)
  heavy: '▓', // Dark shade (U+2593)
  empty: ' ', // Empty
}

/**
 * Box drawing characters
 */
export const BOX = {
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  topT: '┬',
  bottomT: '┴',
  leftT: '├',
  rightT: '┤',
  cross: '┼',
  // Rounded corners
  roundTopLeft: '╭',
  roundTopRight: '╮',
  roundBottomLeft: '╰',
  roundBottomRight: '╯',
}

/**
 * Subpixel buffer - 2x vertical resolution
 * Each character cell holds 2 vertical subpixels
 */
export interface SubpixelBuffer {
  /** Width in character cells */
  charWidth: number
  /** Height in character cells */
  charHeight: number
  /** Width in subpixels (same as charWidth) */
  pixelWidth: number
  /** Height in subpixels (2x charHeight) */
  pixelHeight: number
  /** Pixel data: row-major array of RGBA values (null = transparent) */
  pixels: (RGBA | null)[][]
}

/**
 * Create a subpixel buffer
 */
export function createSubpixelBuffer(charWidth: number, charHeight: number): SubpixelBuffer {
  const pixelWidth = charWidth
  const pixelHeight = charHeight * 2 // 2x vertical resolution

  const pixels: (RGBA | null)[][] = []
  for (let y = 0; y < pixelHeight; y++) {
    pixels.push(Array(pixelWidth).fill(null))
  }

  return {
    charWidth,
    charHeight,
    pixelWidth,
    pixelHeight,
    pixels,
  }
}

/**
 * Set a subpixel in the buffer
 */
export function setPixel(buffer: SubpixelBuffer, x: number, y: number, color: RGBA): void {
  if (x < 0 || x >= buffer.pixelWidth || y < 0 || y >= buffer.pixelHeight) {
    return
  }
  buffer.pixels[y][x] = color
}

/**
 * Get a subpixel from the buffer
 */
export function getPixel(buffer: SubpixelBuffer, x: number, y: number): RGBA | null {
  if (x < 0 || x >= buffer.pixelWidth || y < 0 || y >= buffer.pixelHeight) {
    return null
  }
  return buffer.pixels[y][x]
}

/**
 * Draw a line using Bresenham's algorithm
 */
export function drawLine(
  buffer: SubpixelBuffer,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: RGBA
): void {
  x0 = Math.round(x0)
  y0 = Math.round(y0)
  x1 = Math.round(x1)
  y1 = Math.round(y1)

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    setPixel(buffer, x0, y0, color)

    if (x0 === x1 && y0 === y1) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
}

/**
 * Draw a filled circle
 */
export function drawFilledCircle(
  buffer: SubpixelBuffer,
  cx: number,
  cy: number,
  radius: number,
  color: RGBA
): void {
  cx = Math.round(cx)
  cy = Math.round(cy)
  const r = Math.max(1, Math.round(radius))

  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        setPixel(buffer, cx + x, cy + y, color)
      }
    }
  }
}

/**
 * Draw a rectangle outline
 */
export function drawRect(
  buffer: SubpixelBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBA
): void {
  // Top and bottom
  for (let px = x; px < x + width; px++) {
    setPixel(buffer, px, y, color)
    setPixel(buffer, px, y + height - 1, color)
  }
  // Left and right
  for (let py = y; py < y + height; py++) {
    setPixel(buffer, x, py, color)
    setPixel(buffer, x + width - 1, py, color)
  }
}

/**
 * Draw a filled rectangle
 */
export function drawFilledRect(
  buffer: SubpixelBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBA
): void {
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      setPixel(buffer, px, py, color)
    }
  }
}

/**
 * Check if a color is "active" (not transparent/null and has some alpha)
 */
function isActive(color: RGBA | null): boolean {
  return color !== null && color.a > 0
}

/**
 * Compare two colors for equality
 */
function colorsEqual(a: RGBA | null, b: RGBA | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

/**
 * Generate ANSI escape for 24-bit foreground color
 */
function fgColor(color: RGBA): string {
  return `\x1b[38;2;${color.r};${color.g};${color.b}m`
}

/**
 * Generate ANSI escape for 24-bit background color
 */
function bgColor(color: RGBA): string {
  return `\x1b[48;2;${color.r};${color.g};${color.b}m`
}

/**
 * Reset ANSI styles
 */
const RESET = '\x1b[0m'

/**
 * Render character cell from two subpixels (upper and lower)
 */
interface CellRender {
  char: string
  fg: RGBA | null
  bg: RGBA | null
}

function renderCell(upper: RGBA | null, lower: RGBA | null): CellRender {
  const hasUpper = isActive(upper)
  const hasLower = isActive(lower)

  if (!hasUpper && !hasLower) {
    // Empty cell
    return { char: ' ', fg: null, bg: null }
  }

  if (hasUpper && hasLower) {
    if (colorsEqual(upper, lower)) {
      // Same color - use full block
      return { char: BLOCKS.full, fg: upper, bg: null }
    }
    // Different colors - upper half as fg, lower as bg
    return { char: BLOCKS.upper, fg: upper, bg: lower }
  }

  if (hasUpper) {
    // Only upper pixel - use upper half block
    return { char: BLOCKS.upper, fg: upper, bg: null }
  }

  // Only lower pixel - use lower half block
  return { char: BLOCKS.lower, fg: lower, bg: null }
}

/**
 * Render subpixel buffer to string with ANSI colors
 */
export function renderSubpixelBuffer(buffer: SubpixelBuffer): string {
  const lines: string[] = []

  for (let charY = 0; charY < buffer.charHeight; charY++) {
    let line = ''
    let lastFg: RGBA | null = null
    let lastBg: RGBA | null = null
    let hasColor = false

    for (let charX = 0; charX < buffer.charWidth; charX++) {
      // Get the two subpixels for this character cell
      const upperY = charY * 2
      const lowerY = charY * 2 + 1
      const upper = buffer.pixels[upperY]?.[charX] ?? null
      const lower = buffer.pixels[lowerY]?.[charX] ?? null

      const cell = renderCell(upper, lower)

      // Build color escape sequence
      let colorEscape = ''

      // Handle foreground color change
      if (!colorsEqual(cell.fg, lastFg)) {
        if (cell.fg) {
          colorEscape += fgColor(cell.fg)
          hasColor = true
        } else if (lastFg) {
          // Need to reset
          colorEscape += RESET
          hasColor = false
          lastBg = null // Reset clears bg too
          if (cell.bg) {
            colorEscape += bgColor(cell.bg)
            hasColor = true
          }
        }
        lastFg = cell.fg
      }

      // Handle background color change (if we didn't just reset)
      if (!colorsEqual(cell.bg, lastBg) && !(colorEscape.includes(RESET) && !cell.bg)) {
        if (cell.bg) {
          colorEscape += bgColor(cell.bg)
          hasColor = true
        } else if (lastBg && !colorEscape.includes(RESET)) {
          // Reset background only - use default bg
          colorEscape += '\x1b[49m'
        }
        lastBg = cell.bg
      }

      line += colorEscape + cell.char
    }

    // Reset at end of line if we have active colors
    if (hasColor) {
      line += RESET
    }

    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * Buffer for block rendering (legacy - character grid)
 */
export interface BlockBuffer {
  width: number
  height: number
  chars: string[][]
  colors: (RGBA | null)[][]
}

/**
 * Create a block buffer (legacy)
 */
export function createBlockBuffer(width: number, height: number): BlockBuffer {
  const chars: string[][] = []
  const colors: (RGBA | null)[][] = []

  for (let y = 0; y < height; y++) {
    chars.push(Array(width).fill(' '))
    colors.push(Array(width).fill(null))
  }

  return { width, height, chars, colors }
}

/**
 * Set a character in the block buffer (legacy)
 */
export function setChar(
  buffer: BlockBuffer,
  x: number,
  y: number,
  char: string,
  color?: RGBA
): void {
  if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) {
    return
  }

  buffer.chars[y][x] = char
  if (color) {
    buffer.colors[y][x] = color
  }
}

/**
 * Render block buffer to string with ANSI colors (legacy)
 */
export function renderBlockBuffer(buffer: BlockBuffer): string {
  const lines: string[] = []

  for (let y = 0; y < buffer.height; y++) {
    let line = ''
    let currentColor: RGBA | null = null

    for (let x = 0; x < buffer.width; x++) {
      const char = buffer.chars[y][x]
      const color = buffer.colors[y][x]

      // Add color escape if changed
      if (
        color &&
        (!currentColor ||
          currentColor.r !== color.r ||
          currentColor.g !== color.g ||
          currentColor.b !== color.b)
      ) {
        line += `\x1b[38;2;${color.r};${color.g};${color.b}m`
        currentColor = color
      } else if (!color && currentColor) {
        line += '\x1b[0m'
        currentColor = null
      }

      line += char
    }

    // Reset color at end of line
    if (currentColor) {
      line += '\x1b[0m'
    }
    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * Convert Canvas cells to subpixel buffer for rendering
 */
export function canvasToSubpixelBuffer(canvas: Canvas): SubpixelBuffer {
  const buffer = createSubpixelBuffer(canvas.width, canvas.height)

  // Each canvas cell maps to 2 vertical subpixels
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const cell = canvas.getCell(x, y)

      // If the cell has visible content, set both subpixels
      if (cell.char !== ' ' && cell.fg.a > 0) {
        const subY = y * 2
        buffer.pixels[subY][x] = cell.fg
        buffer.pixels[subY + 1][x] = cell.fg
      }
    }
  }

  return buffer
}

/**
 * Block renderer options
 */
export interface BlockRenderOptions extends RenderOptions {
  /** Use subpixel rendering for 2x vertical resolution */
  subpixel?: boolean
  /** Background color (default: transparent) */
  background?: RGBA
}

/**
 * Block renderer implementation with half-block subpixels
 */
export const blockRenderer: Renderer = {
  render(canvas: Canvas, options: RenderOptions): string {
    const blockOptions = options as BlockRenderOptions

    if (blockOptions.subpixel !== false) {
      // Use subpixel rendering by default
      const buffer = canvasToSubpixelBuffer(canvas)
      return renderSubpixelBuffer(buffer)
    }

    // Legacy character-based rendering
    const buffer = createBlockBuffer(options.width, options.height)

    // Copy canvas cells to block buffer
    for (let y = 0; y < Math.min(canvas.height, buffer.height); y++) {
      for (let x = 0; x < Math.min(canvas.width, buffer.width); x++) {
        const cell = canvas.getCell(x, y)
        buffer.chars[y][x] = cell.char
        if (cell.fg.a > 0) {
          buffer.colors[y][x] = cell.fg
        }
      }
    }

    return renderBlockBuffer(buffer)
  },
}

/**
 * Create a block renderer for direct drawing
 *
 * This creates a subpixel buffer that you can draw to directly,
 * then render to a string. Useful for custom graphics.
 */
export function createBlockRenderer(charWidth: number, charHeight: number) {
  const buffer = createSubpixelBuffer(charWidth, charHeight)

  return {
    buffer,

    /** Set a pixel (in subpixel coordinates) */
    setPixel: (x: number, y: number, color: RGBA) => setPixel(buffer, x, y, color),

    /** Get a pixel (in subpixel coordinates) */
    getPixel: (x: number, y: number) => getPixel(buffer, x, y),

    /** Draw a line (in subpixel coordinates) */
    drawLine: (x0: number, y0: number, x1: number, y1: number, color: RGBA) =>
      drawLine(buffer, x0, y0, x1, y1, color),

    /** Draw a filled circle (in subpixel coordinates) */
    drawFilledCircle: (cx: number, cy: number, radius: number, color: RGBA) =>
      drawFilledCircle(buffer, cx, cy, radius, color),

    /** Draw a rectangle outline (in subpixel coordinates) */
    drawRect: (x: number, y: number, width: number, height: number, color: RGBA) =>
      drawRect(buffer, x, y, width, height, color),

    /** Draw a filled rectangle (in subpixel coordinates) */
    drawFilledRect: (x: number, y: number, width: number, height: number, color: RGBA) =>
      drawFilledRect(buffer, x, y, width, height, color),

    /** Clear the buffer */
    clear: () => {
      for (let y = 0; y < buffer.pixelHeight; y++) {
        for (let x = 0; x < buffer.pixelWidth; x++) {
          buffer.pixels[y][x] = null
        }
      }
    },

    /** Render to string */
    render: () => renderSubpixelBuffer(buffer),

    /** Get dimensions */
    get pixelWidth() {
      return buffer.pixelWidth
    },
    get pixelHeight() {
      return buffer.pixelHeight
    },
    get charWidth() {
      return buffer.charWidth
    },
    get charHeight() {
      return buffer.charHeight
    },
  }
}

export default blockRenderer
