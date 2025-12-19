/**
 * Canvas Diffing
 *
 * Efficient incremental rendering by computing and applying only changes.
 * Useful for streaming updates where most of the canvas stays the same.
 */

import type { Canvas, CanvasCell, RGBA } from '../types'

/**
 * Diff options
 */
export interface DiffOptions {
  /** Compare colors with tolerance for minor variations */
  colorTolerance?: number
  /** Only diff within a specific region */
  region?: {
    x: number
    y: number
    width: number
    height: number
  }
  /** Track cell-level changes vs region-level */
  granularity?: 'cell' | 'region'
}

/**
 * Single cell change
 */
export interface CellChange {
  x: number
  y: number
  old: CanvasCell
  new: CanvasCell
}

/**
 * Region change (group of cells)
 */
export interface RegionChange {
  x: number
  y: number
  width: number
  height: number
  cells: CellChange[]
}

/**
 * Diff result
 */
export interface DiffResult {
  /** Whether there are any changes */
  hasChanges: boolean
  /** Number of changed cells */
  changedCells: number
  /** Total cells compared */
  totalCells: number
  /** Change percentage */
  changePercent: number
  /** Individual cell changes (if granularity is 'cell') */
  cellChanges?: CellChange[]
  /** Region changes (if granularity is 'region') */
  regionChanges?: RegionChange[]
  /** ANSI escape sequences to update only changed cells */
  patchSequence?: string
}

/**
 * Compare two RGBA colors
 */
function colorsEqual(a: RGBA, b: RGBA, tolerance: number = 0): boolean {
  if (tolerance === 0) {
    return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
  }

  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  )
}

/**
 * Compare two cells
 */
function cellsEqual(a: CanvasCell, b: CanvasCell, colorTolerance: number = 0): boolean {
  return (
    a.char === b.char &&
    colorsEqual(a.fg, b.fg, colorTolerance) &&
    colorsEqual(a.bg, b.bg, colorTolerance) &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline
  )
}

/**
 * Generate ANSI escape to position cursor
 */
function cursorTo(x: number, y: number): string {
  return `\x1b[${y + 1};${x + 1}H`
}

/**
 * Generate ANSI escape for cell styling
 */
function cellStyle(cell: CanvasCell): string {
  let style = ''

  // Reset first
  style += '\x1b[0m'

  // Foreground color
  style += `\x1b[38;2;${cell.fg.r};${cell.fg.g};${cell.fg.b}m`

  // Background color (only if not transparent)
  if (cell.bg.a > 0) {
    style += `\x1b[48;2;${cell.bg.r};${cell.bg.g};${cell.bg.b}m`
  }

  // Styles
  if (cell.bold) style += '\x1b[1m'
  if (cell.italic) style += '\x1b[3m'
  if (cell.underline) style += '\x1b[4m'

  return style
}

/**
 * Canvas Diff class
 */
export class CanvasDiff {
  private previousCanvas: CanvasCell[][] | null = null
  private options: Required<DiffOptions>

  constructor(options: DiffOptions = {}) {
    this.options = {
      colorTolerance: options.colorTolerance ?? 0,
      region: options.region ?? { x: 0, y: 0, width: 0, height: 0 },
      granularity: options.granularity ?? 'cell',
    }
  }

  /**
   * Compute diff between previous and current canvas
   */
  diff(canvas: Canvas): DiffResult {
    const changes: CellChange[] = []
    const width = canvas.width
    const height = canvas.height

    // Determine region to compare
    const region = this.options.region.width > 0 ? this.options.region : null
    const startX = region?.x ?? 0
    const startY = region?.y ?? 0
    const endX = region ? region.x + region.width : width
    const endY = region ? region.y + region.height : height

    // If no previous canvas, everything is changed
    if (!this.previousCanvas) {
      this.saveCanvas(canvas)

      return {
        hasChanges: true,
        changedCells: width * height,
        totalCells: width * height,
        changePercent: 100,
        patchSequence: undefined, // Full render needed
      }
    }

    // Compare cells
    for (let y = startY; y < endY && y < height; y++) {
      for (let x = startX; x < endX && x < width; x++) {
        const oldCell = this.previousCanvas[y]?.[x]
        const newCell = canvas.getCell(x, y)

        if (!oldCell || !cellsEqual(oldCell, newCell, this.options.colorTolerance)) {
          changes.push({ x, y, old: oldCell, new: newCell })
        }
      }
    }

    // Save current canvas for next diff
    this.saveCanvas(canvas)

    const totalCells = (endX - startX) * (endY - startY)

    const result: DiffResult = {
      hasChanges: changes.length > 0,
      changedCells: changes.length,
      totalCells,
      changePercent: totalCells > 0 ? (changes.length / totalCells) * 100 : 0,
    }

    if (this.options.granularity === 'cell') {
      result.cellChanges = changes
      result.patchSequence = this.generatePatch(changes)
    } else {
      result.regionChanges = this.groupIntoRegions(changes)
    }

    return result
  }

  /**
   * Generate ANSI patch sequence for cell changes
   */
  private generatePatch(changes: CellChange[]): string {
    if (changes.length === 0) return ''

    // Sort changes by position for efficient cursor movement
    changes.sort((a, b) => a.y - b.y || a.x - b.x)

    let patch = ''
    let lastX = -1
    let lastY = -1
    let lastStyle = ''

    for (const change of changes) {
      // Move cursor if not adjacent
      if (change.y !== lastY || change.x !== lastX + 1) {
        patch += cursorTo(change.x, change.y)
      }

      // Apply style if changed
      const style = cellStyle(change.new)
      if (style !== lastStyle) {
        patch += style
        lastStyle = style
      }

      // Output character
      patch += change.new.char

      lastX = change.x
      lastY = change.y
    }

    // Reset at end
    patch += '\x1b[0m'

    return patch
  }

  /**
   * Group cell changes into contiguous regions
   */
  private groupIntoRegions(changes: CellChange[]): RegionChange[] {
    if (changes.length === 0) return []

    // Simple grouping: group by row spans
    const regions: RegionChange[] = []
    let currentRegion: RegionChange | null = null

    // Sort by position
    changes.sort((a, b) => a.y - b.y || a.x - b.x)

    for (const change of changes) {
      // Start new region if needed
      if (
        !currentRegion ||
        change.y !== currentRegion.y ||
        change.x > currentRegion.x + currentRegion.width
      ) {
        if (currentRegion) {
          regions.push(currentRegion)
        }
        currentRegion = {
          x: change.x,
          y: change.y,
          width: 1,
          height: 1,
          cells: [change],
        }
      } else {
        // Extend current region
        currentRegion.width = change.x - currentRegion.x + 1
        currentRegion.cells.push(change)
      }
    }

    if (currentRegion) {
      regions.push(currentRegion)
    }

    return regions
  }

  /**
   * Save canvas state for next comparison
   */
  private saveCanvas(canvas: Canvas): void {
    this.previousCanvas = []

    for (let y = 0; y < canvas.height; y++) {
      const row: CanvasCell[] = []
      for (let x = 0; x < canvas.width; x++) {
        const cell = canvas.getCell(x, y)
        row.push({ ...cell, fg: { ...cell.fg }, bg: { ...cell.bg } })
      }
      this.previousCanvas.push(row)
    }
  }

  /**
   * Reset diff state (forces full render on next diff)
   */
  reset(): void {
    this.previousCanvas = null
  }

  /**
   * Check if full render is needed (no previous state)
   */
  needsFullRender(): boolean {
    return this.previousCanvas === null
  }

  /**
   * Apply patch to terminal output
   * Returns the patched output or indicates full render needed
   */
  applyPatch(currentOutput: string, diff: DiffResult): string | null {
    if (!diff.hasChanges) {
      return currentOutput // No changes
    }

    if (!diff.patchSequence || diff.changePercent > 50) {
      return null // Full render more efficient
    }

    // For terminal output, return the patch sequence
    // The caller should output this after positioning cursor
    return diff.patchSequence
  }
}

/**
 * Create a canvas diff instance
 */
export function createCanvasDiff(options: DiffOptions = {}): CanvasDiff {
  return new CanvasDiff(options)
}

/**
 * Quick diff check between two canvases
 */
export function quickDiff(oldCanvas: Canvas, newCanvas: Canvas): boolean {
  if (oldCanvas.width !== newCanvas.width || oldCanvas.height !== newCanvas.height) {
    return true // Size changed
  }

  for (let y = 0; y < oldCanvas.height; y++) {
    for (let x = 0; x < oldCanvas.width; x++) {
      const oldCell = oldCanvas.getCell(x, y)
      const newCell = newCanvas.getCell(x, y)
      if (!cellsEqual(oldCell, newCell)) {
        return true // Found a difference
      }
    }
  }

  return false // No differences
}
