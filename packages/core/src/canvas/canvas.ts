/**
 * Canvas - Abstract 2D buffer for terminal rendering
 */

import type { Canvas, CanvasCell, RGBA } from '../types'

/**
 * Default colors
 */
export const DEFAULT_FG: RGBA = { r: 255, g: 255, b: 255, a: 1 }
export const DEFAULT_BG: RGBA = { r: 0, g: 0, b: 0, a: 0 }

/**
 * Create an empty canvas cell
 */
function createEmptyCell(): CanvasCell {
  return {
    char: ' ',
    fg: { ...DEFAULT_FG },
    bg: { ...DEFAULT_BG },
  }
}

/**
 * Concrete Canvas implementation
 */
export class TerminalCanvas implements Canvas {
  readonly width: number
  readonly height: number
  cells: CanvasCell[][]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.cells = []
    this.clear()
  }

  /**
   * Set a cell at the given position
   */
  setCell(x: number, y: number, cell: Partial<CanvasCell>): void {
    // Bounds check - also handles NaN and Infinity which fail standard comparisons
    if (!Number.isFinite(x) || !Number.isFinite(y) ||
        x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return
    }

    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const existing = this.cells[iy][ix]

    this.cells[iy][ix] = {
      char: cell.char ?? existing.char,
      fg: cell.fg ?? existing.fg,
      bg: cell.bg ?? existing.bg,
      bold: cell.bold ?? existing.bold,
      italic: cell.italic ?? existing.italic,
      underline: cell.underline ?? existing.underline,
    }
  }

  /**
   * Get a cell at the given position
   */
  getCell(x: number, y: number): CanvasCell {
    // Bounds check - also handles NaN and Infinity
    if (!Number.isFinite(x) || !Number.isFinite(y) ||
        x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return createEmptyCell()
    }
    return this.cells[Math.floor(y)][Math.floor(x)]
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.cells = []
    for (let y = 0; y < this.height; y++) {
      const row: CanvasCell[] = []
      for (let x = 0; x < this.width; x++) {
        row.push(createEmptyCell())
      }
      this.cells.push(row)
    }
  }

  /**
   * Draw a character at position
   */
  drawChar(x: number, y: number, char: string, fg?: RGBA): void {
    this.setCell(x, y, { char, fg })
  }

  /**
   * Draw a string horizontally starting at position
   */
  drawString(x: number, y: number, str: string, fg?: RGBA): void {
    for (let i = 0; i < str.length; i++) {
      this.drawChar(x + i, y, str[i], fg)
    }
  }

  /**
   * Draw a horizontal line
   */
  drawHLine(x: number, y: number, length: number, char = '─', fg?: RGBA): void {
    for (let i = 0; i < length; i++) {
      this.drawChar(x + i, y, char, fg)
    }
  }

  /**
   * Draw a vertical line
   */
  drawVLine(x: number, y: number, length: number, char = '│', fg?: RGBA): void {
    for (let i = 0; i < length; i++) {
      this.drawChar(x, y + i, char, fg)
    }
  }

  /**
   * Draw a point marker
   */
  drawPoint(x: number, y: number, fg?: RGBA, shape = '●'): void {
    this.drawChar(x, y, shape, fg)
  }

  /**
   * Fill a rectangular region
   */
  fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    char = ' ',
    fg?: RGBA,
    bg?: RGBA
  ): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.setCell(x + dx, y + dy, { char, fg, bg })
      }
    }
  }

  /**
   * Draw a box border
   */
  drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
    style: 'single' | 'double' | 'rounded' = 'single',
    fg?: RGBA
  ): void {
    const chars =
      style === 'double'
        ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' }
        : style === 'rounded'
          ? { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' }
          : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }

    // Corners
    this.drawChar(x, y, chars.tl, fg)
    this.drawChar(x + width - 1, y, chars.tr, fg)
    this.drawChar(x, y + height - 1, chars.bl, fg)
    this.drawChar(x + width - 1, y + height - 1, chars.br, fg)

    // Horizontal lines
    this.drawHLine(x + 1, y, width - 2, chars.h, fg)
    this.drawHLine(x + 1, y + height - 1, width - 2, chars.h, fg)

    // Vertical lines
    this.drawVLine(x, y + 1, height - 2, chars.v, fg)
    this.drawVLine(x + width - 1, y + 1, height - 2, chars.v, fg)
  }

  /**
   * Render canvas to plain string (no colors)
   */
  toString(): string {
    return this.cells.map((row) => row.map((cell) => cell.char).join('')).join('\n')
  }

  /**
   * Render canvas to ANSI-colored string
   */
  toAnsiString(): string {
    const lines: string[] = []

    for (const row of this.cells) {
      let line = ''
      let currentFg: RGBA | null = null
      let currentBg: RGBA | null = null

      for (const cell of row) {
        // Check if we need to change foreground color
        const fgChanged =
          !currentFg ||
          currentFg.r !== cell.fg.r ||
          currentFg.g !== cell.fg.g ||
          currentFg.b !== cell.fg.b

        // Check if we need to change background color
        const bgChanged =
          cell.bg.a > 0 &&
          (!currentBg ||
            currentBg.r !== cell.bg.r ||
            currentBg.g !== cell.bg.g ||
            currentBg.b !== cell.bg.b)

        if (fgChanged) {
          line += `\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m`
          currentFg = cell.fg
        }

        if (bgChanged) {
          line += `\x1b[48;2;${cell.bg.r};${cell.bg.g};${cell.bg.b}m`
          currentBg = cell.bg
        }

        // Add formatting
        if (cell.bold) line += '\x1b[1m'
        if (cell.italic) line += '\x1b[3m'
        if (cell.underline) line += '\x1b[4m'

        line += cell.char

        // Reset formatting if used
        if (cell.bold || cell.italic || cell.underline) {
          line += '\x1b[22;23;24m'
          // Re-apply colors after reset
          if (currentFg) {
            line += `\x1b[38;2;${currentFg.r};${currentFg.g};${currentFg.b}m`
          }
        }
      }

      // Reset at end of line
      line += '\x1b[0m'
      lines.push(line)
    }

    return lines.join('\n')
  }
}

/**
 * Create a new canvas
 */
export function createCanvas(width: number, height: number): TerminalCanvas {
  return new TerminalCanvas(width, height)
}
