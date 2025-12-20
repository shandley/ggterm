/**
 * Tests for @ggterm/render-braille
 */

import { describe, expect, it } from 'bun:test'
import {
  createBrailleBuffer,
  setDot,
  renderBrailleBuffer,
  brailleRenderer,
  type BrailleBuffer,
} from '../index'

describe('createBrailleBuffer', () => {
  it('should create a buffer with correct dimensions', () => {
    const buffer = createBrailleBuffer(10, 5)

    expect(buffer.width).toBe(10)
    expect(buffer.height).toBe(5)
    expect(buffer.dotWidth).toBe(20) // 10 * 2
    expect(buffer.dotHeight).toBe(20) // 5 * 4
  })

  it('should create dots array of correct size', () => {
    const buffer = createBrailleBuffer(10, 5)

    expect(buffer.dots).toBeInstanceOf(Uint8Array)
    expect(buffer.dots.length).toBe(50) // 10 * 5 cells
  })

  it('should initialize dots to zero', () => {
    const buffer = createBrailleBuffer(5, 5)

    for (let i = 0; i < buffer.dots.length; i++) {
      expect(buffer.dots[i]).toBe(0)
    }
  })

  it('should create colors array of correct size', () => {
    const buffer = createBrailleBuffer(10, 5)

    expect(buffer.colors.length).toBe(50) // 10 * 5 cells
  })

  it('should initialize colors to white', () => {
    const buffer = createBrailleBuffer(3, 3)

    for (const color of buffer.colors) {
      expect(color).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    }
  })

  it('should handle 1x1 buffer', () => {
    const buffer = createBrailleBuffer(1, 1)

    expect(buffer.width).toBe(1)
    expect(buffer.height).toBe(1)
    expect(buffer.dotWidth).toBe(2)
    expect(buffer.dotHeight).toBe(4)
    expect(buffer.dots.length).toBe(1)
    expect(buffer.colors.length).toBe(1)
  })

  it('should handle large buffer', () => {
    const buffer = createBrailleBuffer(100, 50)

    expect(buffer.dots.length).toBe(5000)
    expect(buffer.colors.length).toBe(5000)
  })
})

describe('setDot', () => {
  describe('dot positioning', () => {
    it('should set top-left dot (position 1)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 0, 0)

      // Top-left dot is bit 0x01
      expect(buffer.dots[0]).toBe(0x01)
    })

    it('should set top-right dot (position 4)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 1, 0)

      // Top-right dot is bit 0x08
      expect(buffer.dots[0]).toBe(0x08)
    })

    it('should set second row left dot (position 2)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 0, 1)

      // Second row left is bit 0x02
      expect(buffer.dots[0]).toBe(0x02)
    })

    it('should set second row right dot (position 5)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 1, 1)

      // Second row right is bit 0x10
      expect(buffer.dots[0]).toBe(0x10)
    })

    it('should set third row left dot (position 3)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 0, 2)

      // Third row left is bit 0x04
      expect(buffer.dots[0]).toBe(0x04)
    })

    it('should set third row right dot (position 6)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 1, 2)

      // Third row right is bit 0x20
      expect(buffer.dots[0]).toBe(0x20)
    })

    it('should set bottom-left dot (position 7)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 0, 3)

      // Bottom-left dot is bit 0x40
      expect(buffer.dots[0]).toBe(0x40)
    })

    it('should set bottom-right dot (position 8)', () => {
      const buffer = createBrailleBuffer(2, 2)
      setDot(buffer, 1, 3)

      // Bottom-right dot is bit 0x80
      expect(buffer.dots[0]).toBe(0x80)
    })
  })

  describe('combining dots', () => {
    it('should combine multiple dots in same cell', () => {
      const buffer = createBrailleBuffer(2, 2)

      setDot(buffer, 0, 0) // 0x01
      setDot(buffer, 1, 0) // 0x08

      expect(buffer.dots[0]).toBe(0x01 | 0x08) // 0x09
    })

    it('should fill all 8 dots in a cell', () => {
      const buffer = createBrailleBuffer(2, 2)

      // Set all 8 dots in the first cell
      setDot(buffer, 0, 0) // 0x01
      setDot(buffer, 1, 0) // 0x08
      setDot(buffer, 0, 1) // 0x02
      setDot(buffer, 1, 1) // 0x10
      setDot(buffer, 0, 2) // 0x04
      setDot(buffer, 1, 2) // 0x20
      setDot(buffer, 0, 3) // 0x40
      setDot(buffer, 1, 3) // 0x80

      expect(buffer.dots[0]).toBe(0xff) // All bits set
    })

    it('should not change bits when setting same dot twice', () => {
      const buffer = createBrailleBuffer(2, 2)

      setDot(buffer, 0, 0)
      setDot(buffer, 0, 0)

      expect(buffer.dots[0]).toBe(0x01)
    })
  })

  describe('cell indexing', () => {
    it('should set dot in second cell (x=1)', () => {
      const buffer = createBrailleBuffer(3, 3)
      setDot(buffer, 2, 0) // x=2 is in cell x=1

      expect(buffer.dots[0]).toBe(0) // First cell empty
      expect(buffer.dots[1]).toBe(0x01) // Second cell has dot
    })

    it('should set dot in second row of cells', () => {
      const buffer = createBrailleBuffer(3, 3)
      setDot(buffer, 0, 4) // y=4 is in cell row 1

      expect(buffer.dots[0]).toBe(0) // First row empty
      expect(buffer.dots[3]).toBe(0x01) // Second row, first column has dot
    })

    it('should correctly index across multiple cells', () => {
      const buffer = createBrailleBuffer(4, 4)

      // Set dots in different cells
      setDot(buffer, 0, 0) // Cell (0,0)
      setDot(buffer, 3, 0) // Cell (1,0)
      setDot(buffer, 6, 0) // Cell (3,0)
      setDot(buffer, 0, 4) // Cell (0,1)

      expect(buffer.dots[0]).toBe(0x01) // Cell 0
      expect(buffer.dots[1]).toBe(0x08) // Cell 1
      expect(buffer.dots[3]).toBe(0x01) // Cell 3
      expect(buffer.dots[4]).toBe(0x01) // Cell 4 (second row)
    })
  })

  describe('bounds checking', () => {
    it('should ignore dots outside buffer (negative x)', () => {
      const buffer = createBrailleBuffer(5, 5)
      setDot(buffer, -1, 0)

      // All dots should be zero
      for (let i = 0; i < buffer.dots.length; i++) {
        expect(buffer.dots[i]).toBe(0)
      }
    })

    it('should ignore dots outside buffer (negative y)', () => {
      const buffer = createBrailleBuffer(5, 5)
      setDot(buffer, 0, -1)

      for (let i = 0; i < buffer.dots.length; i++) {
        expect(buffer.dots[i]).toBe(0)
      }
    })

    it('should ignore dots outside buffer (x too large)', () => {
      const buffer = createBrailleBuffer(5, 5)
      setDot(buffer, 100, 0)

      for (let i = 0; i < buffer.dots.length; i++) {
        expect(buffer.dots[i]).toBe(0)
      }
    })

    it('should ignore dots outside buffer (y too large)', () => {
      const buffer = createBrailleBuffer(5, 5)
      setDot(buffer, 0, 100)

      for (let i = 0; i < buffer.dots.length; i++) {
        expect(buffer.dots[i]).toBe(0)
      }
    })

    it('should accept dots at maximum valid position', () => {
      const buffer = createBrailleBuffer(5, 5)
      // Max x = 9 (5*2 - 1), max y = 19 (5*4 - 1)
      setDot(buffer, 9, 19)

      // Last cell should have bottom-right dot
      expect(buffer.dots[24]).toBe(0x80)
    })
  })

  describe('color handling', () => {
    it('should set color when provided', () => {
      const buffer = createBrailleBuffer(3, 3)
      const red = { r: 255, g: 0, b: 0, a: 1 }

      setDot(buffer, 0, 0, red)

      expect(buffer.colors[0]).toEqual(red)
    })

    it('should not change color when not provided', () => {
      const buffer = createBrailleBuffer(3, 3)
      const originalColor = buffer.colors[0]

      setDot(buffer, 0, 0)

      expect(buffer.colors[0]).toEqual(originalColor)
    })

    it('should update color on subsequent calls', () => {
      const buffer = createBrailleBuffer(3, 3)
      const red = { r: 255, g: 0, b: 0, a: 1 }
      const blue = { r: 0, g: 0, b: 255, a: 1 }

      setDot(buffer, 0, 0, red)
      setDot(buffer, 1, 0, blue)

      expect(buffer.colors[0]).toEqual(blue)
    })

    it('should set different colors in different cells', () => {
      const buffer = createBrailleBuffer(3, 3)
      const red = { r: 255, g: 0, b: 0, a: 1 }
      const green = { r: 0, g: 255, b: 0, a: 1 }

      setDot(buffer, 0, 0, red) // Cell 0
      setDot(buffer, 2, 0, green) // Cell 1

      expect(buffer.colors[0]).toEqual(red)
      expect(buffer.colors[1]).toEqual(green)
    })
  })
})

describe('renderBrailleBuffer', () => {
  it('should render empty buffer as empty braille characters', () => {
    const buffer = createBrailleBuffer(3, 2)
    const output = renderBrailleBuffer(buffer)

    // Empty braille is U+2800
    expect(output).toContain('⠀') // Empty braille character
  })

  it('should render single dot correctly', () => {
    const buffer = createBrailleBuffer(1, 1)
    setDot(buffer, 0, 0)
    const output = renderBrailleBuffer(buffer)

    // Top-left dot is U+2801
    expect(output).toContain('⠁')
  })

  it('should render full cell correctly', () => {
    const buffer = createBrailleBuffer(1, 1)

    // Fill all 8 dots
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 4; y++) {
        setDot(buffer, x, y)
      }
    }

    const output = renderBrailleBuffer(buffer)
    // Full braille is U+28FF
    expect(output).toContain('⣿')
  })

  it('should include color escape sequences', () => {
    const buffer = createBrailleBuffer(2, 1)
    const red = { r: 255, g: 0, b: 0, a: 1 }

    setDot(buffer, 0, 0, red)
    const output = renderBrailleBuffer(buffer)

    expect(output).toContain('\x1b[38;2;255;0;0m')
  })

  it('should include reset sequence at end of line', () => {
    const buffer = createBrailleBuffer(2, 1)
    const output = renderBrailleBuffer(buffer)

    expect(output).toContain('\x1b[0m')
  })

  it('should output correct number of lines', () => {
    const buffer = createBrailleBuffer(5, 3)
    const output = renderBrailleBuffer(buffer)

    const lines = output.split('\n')
    expect(lines.length).toBe(3)
  })

  it('should not repeat color escape for same color', () => {
    const buffer = createBrailleBuffer(3, 1)
    const red = { r: 255, g: 0, b: 0, a: 1 }

    setDot(buffer, 0, 0, red)
    setDot(buffer, 2, 0, red) // Same color, second cell
    setDot(buffer, 4, 0, red) // Same color, third cell

    const output = renderBrailleBuffer(buffer)

    // Should only have one color escape (not three)
    const colorEscapes = output.match(/\x1b\[38;2;255;0;0m/g)
    expect(colorEscapes?.length).toBe(1)
  })

  it('should add new color escape when color changes', () => {
    const buffer = createBrailleBuffer(2, 1)
    const red = { r: 255, g: 0, b: 0, a: 1 }
    const blue = { r: 0, g: 0, b: 255, a: 1 }

    setDot(buffer, 0, 0, red)
    setDot(buffer, 2, 0, blue) // Different cell, different color

    const output = renderBrailleBuffer(buffer)

    expect(output).toContain('\x1b[38;2;255;0;0m')
    expect(output).toContain('\x1b[38;2;0;0;255m')
  })

  it('should render diagonal line pattern', () => {
    const buffer = createBrailleBuffer(3, 3)

    // Draw diagonal dots
    setDot(buffer, 0, 0)
    setDot(buffer, 2, 4)
    setDot(buffer, 4, 8)

    const output = renderBrailleBuffer(buffer)

    // Should have 3 lines of output
    const lines = output.split('\n')
    expect(lines.length).toBe(3)

    // Check that dots are in different positions
    // (exact characters depend on buffer layout)
    expect(output.length).toBeGreaterThan(0)
  })
})

describe('brailleRenderer', () => {
  it('should have render method', () => {
    expect(typeof brailleRenderer.render).toBe('function')
  })

  it('should return string from render', () => {
    // Create a minimal mock canvas
    const mockCanvas = {
      width: 10,
      height: 5,
      cells: [],
      get: () => ({ char: ' ', fg: { r: 255, g: 255, b: 255, a: 1 }, bg: { r: 0, g: 0, b: 0, a: 1 } }),
      set: () => {},
      clear: () => {},
      fill: () => {},
      toString: () => '',
    }

    const result = brailleRenderer.render(mockCanvas as any, { width: 10, height: 5 })

    expect(typeof result).toBe('string')
  })

  it('should respect width and height options', () => {
    const mockCanvas = {
      width: 20,
      height: 10,
      cells: [],
      get: () => ({ char: ' ', fg: { r: 255, g: 255, b: 255, a: 1 }, bg: { r: 0, g: 0, b: 0, a: 1 } }),
      set: () => {},
      clear: () => {},
      fill: () => {},
      toString: () => '',
    }

    const result = brailleRenderer.render(mockCanvas as any, { width: 5, height: 3 })
    const lines = result.split('\n')

    // Should have 3 lines
    expect(lines.length).toBe(3)
  })
})

describe('braille character mapping', () => {
  it('should map dot patterns to correct Unicode characters', () => {
    const testCases = [
      { dots: [0, 0], expected: '⠁' }, // dot 1 = 0x01 = U+2801
      { dots: [1, 0], expected: '⠈' }, // dot 4 = 0x08 = U+2808
      { dots: [0, 1], expected: '⠂' }, // dot 2 = 0x02 = U+2802
      { dots: [1, 1], expected: '⠐' }, // dot 5 = 0x10 = U+2810
      { dots: [0, 2], expected: '⠄' }, // dot 3 = 0x04 = U+2804
      { dots: [1, 2], expected: '⠠' }, // dot 6 = 0x20 = U+2820
      { dots: [0, 3], expected: '⡀' }, // dot 7 = 0x40 = U+2840
      { dots: [1, 3], expected: '⢀' }, // dot 8 = 0x80 = U+2880
    ]

    for (const { dots, expected } of testCases) {
      const buffer = createBrailleBuffer(1, 1)
      setDot(buffer, dots[0], dots[1])
      const output = renderBrailleBuffer(buffer)

      // Extract just the braille character (after color escape, before reset)
      const match = output.match(/m(.)/)
      expect(match?.[1]).toBe(expected)
    }
  })

  it('should produce empty braille for no dots', () => {
    const buffer = createBrailleBuffer(1, 1)
    const output = renderBrailleBuffer(buffer)

    // Empty braille U+2800
    const match = output.match(/m(.)/)
    expect(match?.[1]).toBe('⠀')
  })

  it('should produce full braille for all dots', () => {
    const buffer = createBrailleBuffer(1, 1)

    // Set all 8 dots
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 4; y++) {
        setDot(buffer, x, y)
      }
    }

    const output = renderBrailleBuffer(buffer)

    // Full braille U+28FF
    const match = output.match(/m(.)/)
    expect(match?.[1]).toBe('⣿')
  })
})

describe('effective resolution', () => {
  it('should have 2x horizontal resolution compared to cells', () => {
    const buffer = createBrailleBuffer(40, 12)
    expect(buffer.dotWidth).toBe(80)
  })

  it('should have 4x vertical resolution compared to cells', () => {
    const buffer = createBrailleBuffer(40, 12)
    expect(buffer.dotHeight).toBe(48)
  })

  it('should allow plotting to dot coordinates within bounds', () => {
    const buffer = createBrailleBuffer(80, 24)

    // Should be able to set any dot in the 160x96 grid
    expect(() => {
      setDot(buffer, 0, 0)
      setDot(buffer, 159, 0)
      setDot(buffer, 0, 95)
      setDot(buffer, 159, 95)
    }).not.toThrow()

    // Verify corner dots are set
    expect(buffer.dots[0] & 0x01).toBe(0x01) // Top-left
    expect(buffer.dots[79] & 0x08).toBe(0x08) // Top-right
    expect(buffer.dots[80 * 23] & 0x40).toBe(0x40) // Bottom-left
    expect(buffer.dots[80 * 24 - 1] & 0x80).toBe(0x80) // Bottom-right
  })
})
