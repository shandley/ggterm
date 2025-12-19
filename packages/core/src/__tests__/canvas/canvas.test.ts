/**
 * Tests for TerminalCanvas
 */

import { describe, expect, it } from 'bun:test'
import { createCanvas, TerminalCanvas, DEFAULT_FG, DEFAULT_BG } from '../../canvas/canvas'

describe('createCanvas', () => {
  it('should create a canvas with specified dimensions', () => {
    const canvas = createCanvas(80, 24)
    expect(canvas.width).toBe(80)
    expect(canvas.height).toBe(24)
  })

  it('should return TerminalCanvas instance', () => {
    const canvas = createCanvas(40, 20)
    expect(canvas).toBeInstanceOf(TerminalCanvas)
  })
})

describe('TerminalCanvas', () => {
  describe('constructor', () => {
    it('should create canvas with given dimensions', () => {
      const canvas = new TerminalCanvas(60, 30)
      expect(canvas.width).toBe(60)
      expect(canvas.height).toBe(30)
    })

    it('should initialize all cells to empty', () => {
      const canvas = new TerminalCanvas(10, 10)
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const cell = canvas.getCell(x, y)
          expect(cell.char).toBe(' ')
        }
      }
    })
  })

  describe('setCell / getCell', () => {
    it('should set and get cell character', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.setCell(5, 5, { char: 'X' })
      expect(canvas.getCell(5, 5).char).toBe('X')
    })

    it('should set and get cell foreground color', () => {
      const canvas = new TerminalCanvas(10, 10)
      const red = { r: 255, g: 0, b: 0, a: 1 }
      canvas.setCell(5, 5, { char: 'X', fg: red })
      expect(canvas.getCell(5, 5).fg).toEqual(red)
    })

    it('should set and get cell background color', () => {
      const canvas = new TerminalCanvas(10, 10)
      const blue = { r: 0, g: 0, b: 255, a: 1 }
      canvas.setCell(5, 5, { char: 'X', bg: blue })
      expect(canvas.getCell(5, 5).bg).toEqual(blue)
    })

    it('should ignore out-of-bounds setCell', () => {
      const canvas = new TerminalCanvas(10, 10)
      // Should not throw
      canvas.setCell(-1, 0, { char: 'X' })
      canvas.setCell(0, -1, { char: 'X' })
      canvas.setCell(10, 0, { char: 'X' })
      canvas.setCell(0, 10, { char: 'X' })
    })

    it('should return empty cell for out-of-bounds getCell', () => {
      const canvas = new TerminalCanvas(10, 10)
      const cell = canvas.getCell(-1, 0)
      expect(cell.char).toBe(' ')
    })

    it('should handle formatting options', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.setCell(0, 0, { char: 'B', bold: true })
      canvas.setCell(1, 0, { char: 'I', italic: true })
      canvas.setCell(2, 0, { char: 'U', underline: true })

      expect(canvas.getCell(0, 0).bold).toBe(true)
      expect(canvas.getCell(1, 0).italic).toBe(true)
      expect(canvas.getCell(2, 0).underline).toBe(true)
    })
  })

  describe('clear', () => {
    it('should reset all cells to empty', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.setCell(5, 5, { char: 'X' })
      canvas.clear()
      expect(canvas.getCell(5, 5).char).toBe(' ')
    })
  })

  describe('drawChar', () => {
    it('should draw a character at position', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawChar(3, 3, 'A')
      expect(canvas.getCell(3, 3).char).toBe('A')
    })

    it('should apply foreground color', () => {
      const canvas = new TerminalCanvas(10, 10)
      const green = { r: 0, g: 255, b: 0, a: 1 }
      canvas.drawChar(0, 0, 'G', green)
      expect(canvas.getCell(0, 0).fg).toEqual(green)
    })
  })

  describe('drawString', () => {
    it('should draw a horizontal string', () => {
      const canvas = new TerminalCanvas(20, 10)
      canvas.drawString(0, 0, 'Hello')
      expect(canvas.getCell(0, 0).char).toBe('H')
      expect(canvas.getCell(1, 0).char).toBe('e')
      expect(canvas.getCell(2, 0).char).toBe('l')
      expect(canvas.getCell(3, 0).char).toBe('l')
      expect(canvas.getCell(4, 0).char).toBe('o')
    })

    it('should handle string overflow gracefully', () => {
      const canvas = new TerminalCanvas(5, 5)
      // Should not throw even if string exceeds bounds
      canvas.drawString(3, 0, 'Hello World')
      expect(canvas.getCell(3, 0).char).toBe('H')
      expect(canvas.getCell(4, 0).char).toBe('e')
      // Beyond width should be ignored
    })
  })

  describe('drawHLine', () => {
    it('should draw a horizontal line', () => {
      const canvas = new TerminalCanvas(20, 10)
      canvas.drawHLine(0, 5, 10)
      for (let x = 0; x < 10; x++) {
        expect(canvas.getCell(x, 5).char).toBe('─')
      }
    })

    it('should use custom character', () => {
      const canvas = new TerminalCanvas(20, 10)
      canvas.drawHLine(0, 0, 5, '=')
      expect(canvas.getCell(0, 0).char).toBe('=')
    })
  })

  describe('drawVLine', () => {
    it('should draw a vertical line', () => {
      const canvas = new TerminalCanvas(20, 10)
      canvas.drawVLine(5, 0, 8)
      for (let y = 0; y < 8; y++) {
        expect(canvas.getCell(5, y).char).toBe('│')
      }
    })

    it('should use custom character', () => {
      const canvas = new TerminalCanvas(20, 10)
      canvas.drawVLine(0, 0, 3, '|')
      expect(canvas.getCell(0, 0).char).toBe('|')
    })
  })

  describe('drawPoint', () => {
    it('should draw a point marker', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawPoint(5, 5)
      expect(canvas.getCell(5, 5).char).toBe('●')
    })

    it('should use custom shape', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawPoint(5, 5, undefined, '◆')
      expect(canvas.getCell(5, 5).char).toBe('◆')
    })
  })

  describe('fillRect', () => {
    it('should fill a rectangular region', () => {
      const canvas = new TerminalCanvas(20, 20)
      canvas.fillRect(5, 5, 3, 3, '#')

      for (let y = 5; y < 8; y++) {
        for (let x = 5; x < 8; x++) {
          expect(canvas.getCell(x, y).char).toBe('#')
        }
      }
    })

    it('should apply colors', () => {
      const canvas = new TerminalCanvas(10, 10)
      const fg = { r: 255, g: 0, b: 0, a: 1 }
      const bg = { r: 0, g: 0, b: 255, a: 1 }
      canvas.fillRect(0, 0, 2, 2, 'X', fg, bg)

      expect(canvas.getCell(0, 0).fg).toEqual(fg)
      expect(canvas.getCell(0, 0).bg).toEqual(bg)
    })
  })

  describe('drawBox', () => {
    it('should draw a box with single line style', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawBox(0, 0, 5, 3)

      expect(canvas.getCell(0, 0).char).toBe('┌')
      expect(canvas.getCell(4, 0).char).toBe('┐')
      expect(canvas.getCell(0, 2).char).toBe('└')
      expect(canvas.getCell(4, 2).char).toBe('┘')
      expect(canvas.getCell(2, 0).char).toBe('─')
      expect(canvas.getCell(0, 1).char).toBe('│')
    })

    it('should draw a box with double line style', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawBox(0, 0, 5, 3, 'double')

      expect(canvas.getCell(0, 0).char).toBe('╔')
      expect(canvas.getCell(4, 0).char).toBe('╗')
      expect(canvas.getCell(0, 2).char).toBe('╚')
      expect(canvas.getCell(4, 2).char).toBe('╝')
    })

    it('should draw a box with rounded style', () => {
      const canvas = new TerminalCanvas(10, 10)
      canvas.drawBox(0, 0, 5, 3, 'rounded')

      expect(canvas.getCell(0, 0).char).toBe('╭')
      expect(canvas.getCell(4, 0).char).toBe('╮')
      expect(canvas.getCell(0, 2).char).toBe('╰')
      expect(canvas.getCell(4, 2).char).toBe('╯')
    })
  })

  describe('toString', () => {
    it('should render canvas to plain string', () => {
      const canvas = new TerminalCanvas(5, 3)
      canvas.drawString(0, 0, 'Hello')
      canvas.drawString(0, 1, 'World')

      const output = canvas.toString()
      const lines = output.split('\n')

      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('Hello')
      expect(lines[1]).toBe('World')
      expect(lines[2]).toBe('     ')
    })
  })

  describe('toAnsiString', () => {
    it('should render canvas with ANSI colors', () => {
      const canvas = new TerminalCanvas(5, 1)
      const red = { r: 255, g: 0, b: 0, a: 1 }
      canvas.drawChar(0, 0, 'R', red)

      const output = canvas.toAnsiString()

      // Should contain ANSI escape sequences
      expect(output).toContain('\x1b[38;2;255;0;0m')
      expect(output).toContain('R')
      expect(output).toContain('\x1b[0m') // Reset at end
    })

    it('should handle bold formatting', () => {
      const canvas = new TerminalCanvas(5, 1)
      canvas.setCell(0, 0, { char: 'B', bold: true })

      const output = canvas.toAnsiString()

      expect(output).toContain('\x1b[1m') // Bold escape
    })
  })
})

describe('DEFAULT_FG and DEFAULT_BG', () => {
  it('should have correct default foreground (white)', () => {
    expect(DEFAULT_FG).toEqual({ r: 255, g: 255, b: 255, a: 1 })
  })

  it('should have correct default background (transparent black)', () => {
    expect(DEFAULT_BG).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })
})
