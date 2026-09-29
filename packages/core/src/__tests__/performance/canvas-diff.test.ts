/**
 * Tests for Canvas Diffing
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  CanvasDiff,
  createCanvasDiff,
  quickDiff,
  type CellChange,
  type RegionChange,
} from '../../performance/canvas-diff'
import type { Canvas, CanvasCell, RGBA } from '@ggterm/spec/types'

/**
 * Create a mock canvas for testing
 */
function createMockCanvas(width: number, height: number): Canvas {
  const defaultCell: CanvasCell = {
    char: ' ',
    fg: { r: 255, g: 255, b: 255, a: 1 },
    bg: { r: 0, g: 0, b: 0, a: 0 },
    bold: false,
    italic: false,
    underline: false,
  }

  const cells: CanvasCell[][] = []
  for (let y = 0; y < height; y++) {
    cells[y] = []
    for (let x = 0; x < width; x++) {
      cells[y][x] = { ...defaultCell, fg: { ...defaultCell.fg }, bg: { ...defaultCell.bg } }
    }
  }

  return {
    width,
    height,
    cells,
    setCell(x: number, y: number, cell: Partial<CanvasCell>) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        Object.assign(cells[y][x], cell)
      }
    },
    getCell(x: number, y: number): CanvasCell {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        return cells[y][x]
      }
      return defaultCell
    },
    clear() {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          cells[y][x] = { ...defaultCell, fg: { ...defaultCell.fg }, bg: { ...defaultCell.bg } }
        }
      }
    },
  }
}

describe('CanvasDiff', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const diff = new CanvasDiff()

      expect(diff).toBeInstanceOf(CanvasDiff)
    })

    it('should accept custom options', () => {
      const diff = new CanvasDiff({
        colorTolerance: 5,
        granularity: 'region',
      })

      expect(diff).toBeInstanceOf(CanvasDiff)
    })
  })

  describe('diff', () => {
    it('should mark everything changed on first diff', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      const result = diff.diff(canvas)

      expect(result.hasChanges).toBe(true)
      expect(result.changedCells).toBe(100) // 10x10
      expect(result.changePercent).toBe(100)
    })

    it('should detect no changes on identical second diff', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas) // First diff
      const result = diff.diff(canvas) // Second diff

      expect(result.hasChanges).toBe(false)
      expect(result.changedCells).toBe(0)
      expect(result.changePercent).toBe(0)
    })

    it('should detect changed cells', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Modify one cell
      canvas.setCell(5, 5, { char: 'X' })

      const result = diff.diff(canvas)

      expect(result.hasChanges).toBe(true)
      expect(result.changedCells).toBe(1)
      expect(result.cellChanges![0].x).toBe(5)
      expect(result.cellChanges![0].y).toBe(5)
    })

    it('should detect color changes', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Modify foreground color
      canvas.setCell(3, 3, { fg: { r: 255, g: 0, b: 0, a: 1 } })

      const result = diff.diff(canvas)

      expect(result.hasChanges).toBe(true)
      expect(result.changedCells).toBe(1)
    })

    it('should respect color tolerance', () => {
      const diff = new CanvasDiff({ colorTolerance: 10 })
      const canvas = createMockCanvas(10, 10)
      canvas.setCell(0, 0, { fg: { r: 100, g: 100, b: 100, a: 1 } })

      diff.diff(canvas)

      // Small change within tolerance
      canvas.setCell(0, 0, { fg: { r: 105, g: 100, b: 100, a: 1 } })

      const result = diff.diff(canvas)

      expect(result.hasChanges).toBe(false)
    })

    it('should detect style changes (bold, italic, underline)', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      canvas.setCell(0, 0, { bold: true })
      const result1 = diff.diff(canvas)
      expect(result1.changedCells).toBe(1)

      canvas.setCell(1, 0, { italic: true })
      const result2 = diff.diff(canvas)
      expect(result2.changedCells).toBe(1)

      canvas.setCell(2, 0, { underline: true })
      const result3 = diff.diff(canvas)
      expect(result3.changedCells).toBe(1)
    })

    it('should limit diff to specified region', () => {
      const diff = new CanvasDiff({
        region: { x: 0, y: 0, width: 5, height: 5 },
      })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Change inside region
      canvas.setCell(2, 2, { char: 'X' })
      // Change outside region
      canvas.setCell(8, 8, { char: 'Y' })

      const result = diff.diff(canvas)

      expect(result.changedCells).toBe(1) // Only the one inside region
      expect(result.totalCells).toBe(25) // 5x5 region
    })
  })

  describe('granularity', () => {
    it('should return cell changes for cell granularity', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })

      const result = diff.diff(canvas)

      expect(result.cellChanges).toBeDefined()
      expect(result.cellChanges!.length).toBe(1)
    })

    it('should return region changes for region granularity', () => {
      const diff = new CanvasDiff({ granularity: 'region' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })
      canvas.setCell(6, 5, { char: 'Y' })
      canvas.setCell(7, 5, { char: 'Z' })

      const result = diff.diff(canvas)

      expect(result.regionChanges).toBeDefined()
      // Adjacent cells on same row should be grouped
      expect(result.regionChanges!.length).toBeGreaterThan(0)
    })

    it('should group adjacent cells into regions', () => {
      const diff = new CanvasDiff({ granularity: 'region' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Create a horizontal line of changes
      for (let x = 0; x < 5; x++) {
        canvas.setCell(x, 0, { char: 'X' })
      }

      const result = diff.diff(canvas)

      // Should be grouped into one region
      expect(result.regionChanges!.length).toBe(1)
      expect(result.regionChanges![0].width).toBe(5)
      expect(result.regionChanges![0].cells.length).toBe(5)
    })

    it('should create separate regions for non-adjacent cells', () => {
      const diff = new CanvasDiff({ granularity: 'region' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Two separate changes
      canvas.setCell(0, 0, { char: 'A' })
      canvas.setCell(9, 9, { char: 'B' })

      const result = diff.diff(canvas)

      expect(result.regionChanges!.length).toBe(2)
    })
  })

  describe('patchSequence', () => {
    it('should generate patch sequence for cell changes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })

      const result = diff.diff(canvas)

      expect(result.patchSequence).toBeDefined()
      expect(result.patchSequence!.length).toBeGreaterThan(0)
    })

    it('should include cursor positioning escapes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })

      const result = diff.diff(canvas)

      // Should contain cursor positioning (ESC[row;colH)
      expect(result.patchSequence).toContain('\x1b[')
    })

    it('should include color escapes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, {
        char: 'X',
        fg: { r: 255, g: 0, b: 0, a: 1 },
      })

      const result = diff.diff(canvas)

      // Should contain color escape (ESC[38;2;r;g;bm)
      expect(result.patchSequence).toContain('\x1b[38;2;')
    })

    it('should include background color for non-transparent', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, {
        char: 'X',
        bg: { r: 0, g: 0, b: 255, a: 1 }, // Non-transparent
      })

      const result = diff.diff(canvas)

      // Should contain background color escape (ESC[48;2;r;g;bm)
      expect(result.patchSequence).toContain('\x1b[48;2;')
    })

    it('should include style escapes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X', bold: true, italic: true, underline: true })

      const result = diff.diff(canvas)

      // Should contain bold (ESC[1m), italic (ESC[3m), underline (ESC[4m)
      expect(result.patchSequence).toContain('\x1b[1m')
      expect(result.patchSequence).toContain('\x1b[3m')
      expect(result.patchSequence).toContain('\x1b[4m')
    })

    it('should end with reset escape', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })

      const result = diff.diff(canvas)

      expect(result.patchSequence).toMatch(/\x1b\[0m$/)
    })

    it('should be empty for no changes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      const result = diff.diff(canvas)

      expect(result.patchSequence).toBe('')
    })
  })

  describe('reset', () => {
    it('should clear previous canvas state', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas) // First diff
      diff.reset()

      const result = diff.diff(canvas) // After reset

      // Should treat as first diff again
      expect(result.changedCells).toBe(100)
    })
  })

  describe('needsFullRender', () => {
    it('should return true when no previous state', () => {
      const diff = new CanvasDiff()

      expect(diff.needsFullRender()).toBe(true)
    })

    it('should return false after first diff', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      expect(diff.needsFullRender()).toBe(false)
    })

    it('should return true after reset', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      diff.reset()

      expect(diff.needsFullRender()).toBe(true)
    })
  })

  describe('applyPatch', () => {
    it('should return current output when no changes', () => {
      const diff = new CanvasDiff()
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      const result = diff.diff(canvas)

      const output = diff.applyPatch('current output', result)

      expect(output).toBe('current output')
    })

    it('should return patch sequence for small changes', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)
      canvas.setCell(5, 5, { char: 'X' })
      const result = diff.diff(canvas)

      const output = diff.applyPatch('current output', result)

      expect(output).toBe(result.patchSequence)
    })

    it('should return null for large changes (> 50%)', () => {
      const diff = new CanvasDiff({ granularity: 'cell' })
      const canvas = createMockCanvas(10, 10)

      diff.diff(canvas)

      // Change more than 50% of cells
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 6; x++) {
          canvas.setCell(x, y, { char: 'X' })
        }
      }

      const result = diff.diff(canvas)

      const output = diff.applyPatch('current output', result)

      expect(output).toBeNull() // Full render more efficient
    })
  })
})

describe('createCanvasDiff', () => {
  it('should create CanvasDiff instance', () => {
    const diff = createCanvasDiff()

    expect(diff).toBeInstanceOf(CanvasDiff)
  })

  it('should accept options', () => {
    const diff = createCanvasDiff({
      colorTolerance: 10,
      granularity: 'region',
    })

    expect(diff).toBeInstanceOf(CanvasDiff)
  })
})

describe('quickDiff', () => {
  it('should return true for different sizes', () => {
    const canvas1 = createMockCanvas(10, 10)
    const canvas2 = createMockCanvas(20, 20)

    const result = quickDiff(canvas1, canvas2)

    expect(result).toBe(true)
  })

  it('should return false for identical canvases', () => {
    const canvas1 = createMockCanvas(10, 10)
    const canvas2 = createMockCanvas(10, 10)

    const result = quickDiff(canvas1, canvas2)

    expect(result).toBe(false)
  })

  it('should return true for different content', () => {
    const canvas1 = createMockCanvas(10, 10)
    const canvas2 = createMockCanvas(10, 10)
    canvas2.setCell(5, 5, { char: 'X' })

    const result = quickDiff(canvas1, canvas2)

    expect(result).toBe(true)
  })

  it('should detect color differences', () => {
    const canvas1 = createMockCanvas(10, 10)
    const canvas2 = createMockCanvas(10, 10)
    canvas2.setCell(0, 0, { fg: { r: 255, g: 0, b: 0, a: 1 } })

    const result = quickDiff(canvas1, canvas2)

    expect(result).toBe(true)
  })

  it('should be fast for identical large canvases', () => {
    const canvas1 = createMockCanvas(100, 100)
    const canvas2 = createMockCanvas(100, 100)

    const start = performance.now()
    const result = quickDiff(canvas1, canvas2)
    const duration = performance.now() - start

    expect(result).toBe(false)
    expect(duration).toBeLessThan(100) // Should be very fast
  })
})

describe('edge cases', () => {
  it('should handle 1x1 canvas', () => {
    const diff = new CanvasDiff()
    const canvas = createMockCanvas(1, 1)

    const result1 = diff.diff(canvas)
    expect(result1.totalCells).toBe(1)

    canvas.setCell(0, 0, { char: 'X' })
    const result2 = diff.diff(canvas)
    expect(result2.changedCells).toBe(1)
  })

  it('should handle wide canvas', () => {
    const diff = new CanvasDiff()
    const canvas = createMockCanvas(200, 5)

    const result = diff.diff(canvas)
    expect(result.totalCells).toBe(1000)
  })

  it('should handle tall canvas', () => {
    const diff = new CanvasDiff()
    const canvas = createMockCanvas(5, 200)

    const result = diff.diff(canvas)
    expect(result.totalCells).toBe(1000)
  })

  it('should handle region larger than canvas', () => {
    const diff = new CanvasDiff({
      region: { x: 0, y: 0, width: 100, height: 100 },
    })
    const canvas = createMockCanvas(10, 10)

    const result = diff.diff(canvas)

    // Should not crash and should limit to canvas bounds
    expect(result.totalCells).toBe(100) // 10x10 actual
  })

  it('should handle empty patch (no changes)', () => {
    const diff = new CanvasDiff({ granularity: 'cell' })
    const canvas = createMockCanvas(10, 10)

    diff.diff(canvas)
    const result = diff.diff(canvas)

    expect(result.patchSequence).toBe('')
    expect(result.cellChanges).toEqual([])
  })

  it('should handle canvas with all same cells', () => {
    const diff = new CanvasDiff()
    const canvas = createMockCanvas(10, 10)

    // Set all cells to same value
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        canvas.setCell(x, y, { char: 'A' })
      }
    }

    diff.diff(canvas)
    const result = diff.diff(canvas)

    expect(result.hasChanges).toBe(false)
  })
})
