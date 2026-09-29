/**
 * Faceting functions for creating small multiples
 */

import type { Facet, DataSource, Labeller } from '@ggterm/spec/types'

// Re-export Labeller type for convenience
export type { Labeller } from '@ggterm/spec/types'

/**
 * Default labeller - just returns the value
 */
export const label_value: Labeller = (value) => value

/**
 * Labeller that shows both variable name and value
 * @example "category: A"
 */
export const label_both: Labeller = (value, variable) =>
  variable ? `${variable}: ${value}` : value

/**
 * Labeller that parses underscores as spaces
 * @example "my_category" -> "my category"
 */
export const label_parsed: Labeller = (value) => value.replace(/_/g, ' ')

/**
 * Labeller that wraps long labels
 */
export const label_wrap: (width: number) => Labeller = (width) => (value) => {
  if (value.length <= width) return value
  // Simple truncation with ellipsis for terminal
  return value.substring(0, width - 1) + '…'
}

/**
 * Create a custom labeller from a record of value -> label mappings
 */
export function as_labeller(labels: Record<string, string>): Labeller {
  return (value) => labels[value] ?? value
}

export interface FacetWrapOptions {
  /** Number of columns (default: auto-calculated) */
  ncol?: number
  /** Number of rows (default: auto-calculated) */
  nrow?: number
  /** Scale behavior: 'fixed' (same for all), 'free' (independent), 'free_x', 'free_y' */
  scales?: 'fixed' | 'free' | 'free_x' | 'free_y'
  /** Direction to fill panels: 'h' (horizontal) or 'v' (vertical) */
  dir?: 'h' | 'v'
  /** Strip position: 'top' or 'bottom' (default: 'top') */
  strip?: 'top' | 'bottom'
  /** Labeller function for customizing strip labels */
  labeller?: Labeller
}

/**
 * Wrap a 1D ribbon of panels into 2D
 *
 * Facet by a single variable, arranging panels in a wrapped layout.
 *
 * @example
 * ```ts
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_point())
 *   .facet(facet_wrap('category', { ncol: 3 }))
 * ```
 */
export function facet_wrap(
  facets: string,
  options: FacetWrapOptions = {}
): Facet {
  return {
    type: 'wrap',
    vars: facets,
    ncol: options.ncol,
    nrow: options.nrow,
    scales: options.scales ?? 'fixed',
    labeller: options.labeller,
  }
}

export interface FacetGridOptions {
  /** Scale behavior: 'fixed' (same for all), 'free' (independent), 'free_x', 'free_y' */
  scales?: 'fixed' | 'free' | 'free_x' | 'free_y'
  /** Move row/column strips: 'x' moves col strips to bottom, 'y' moves row strips to left */
  switch?: 'x' | 'y' | 'both' | null
  /** Labeller function for customizing strip labels */
  labeller?: Labeller
}

/**
 * Lay out panels in a 2D grid by row and/or column variables
 *
 * @example
 * ```ts
 * // Grid by two variables
 * gg(data)
 *   .aes({ x: 'x', y: 'y' })
 *   .geom(geom_point())
 *   .facet(facet_grid({ rows: 'gender', cols: 'treatment' }))
 *
 * // Just rows
 * gg(data)
 *   .facet(facet_grid({ rows: 'category' }))
 *
 * // Just columns
 * gg(data)
 *   .facet(facet_grid({ cols: 'year' }))
 * ```
 */
export function facet_grid(
  facets: { rows?: string; cols?: string },
  options: FacetGridOptions = {}
): Facet {
  return {
    type: 'grid',
    vars: facets,
    scales: options.scales ?? 'fixed',
    labeller: options.labeller,
    switch: options.switch,
  }
}

/**
 * Panel information for layout
 */
export interface FacetPanel {
  /** Panel index (0-based) */
  index: number
  /** Row index in grid (0-based) */
  row: number
  /** Column index in grid (0-based) */
  col: number
  /** Label for this panel */
  label: string
  /** Row variable value (for grid facets) */
  rowValue?: string
  /** Column variable value (for grid facets) */
  colValue?: string
  /** Data subset for this panel */
  data: DataSource
}

/**
 * Compute facet panels from data and facet specification
 */
export function computeFacetPanels(
  data: DataSource,
  facet: Facet
): { panels: FacetPanel[]; nrow: number; ncol: number } {
  if (facet.type === 'wrap') {
    return computeWrapPanels(data, facet)
  } else {
    return computeGridPanels(data, facet)
  }
}

/**
 * Compute panels for facet_wrap
 */
function computeWrapPanels(
  data: DataSource,
  facet: Facet
): { panels: FacetPanel[]; nrow: number; ncol: number } {
  const varName = facet.vars as string

  // Get unique values for the faceting variable
  const uniqueValues = new Set<string>()
  for (const row of data) {
    const value = row[varName]
    if (value !== null && value !== undefined) {
      uniqueValues.add(String(value))
    }
  }

  const values = Array.from(uniqueValues).sort()
  const numPanels = values.length

  if (numPanels === 0) {
    return { panels: [], nrow: 0, ncol: 0 }
  }

  // Calculate grid dimensions
  let ncol = facet.ncol
  let nrow = facet.nrow

  if (ncol && nrow) {
    // Both specified - use as-is
  } else if (ncol) {
    nrow = Math.ceil(numPanels / ncol)
  } else if (nrow) {
    ncol = Math.ceil(numPanels / nrow)
  } else {
    // Auto-calculate: prefer wider than tall, aim for ~1.5:1 aspect
    ncol = Math.ceil(Math.sqrt(numPanels * 1.5))
    nrow = Math.ceil(numPanels / ncol)
  }

  // Create panels
  const panels: FacetPanel[] = values.map((value, index) => {
    // Filter data for this panel
    const panelData = data.filter(row => String(row[varName]) === value)

    return {
      index,
      row: Math.floor(index / ncol),
      col: index % ncol,
      label: value,
      data: panelData,
    }
  })

  return { panels, nrow, ncol }
}

/**
 * Compute panels for facet_grid
 */
function computeGridPanels(
  data: DataSource,
  facet: Facet
): { panels: FacetPanel[]; nrow: number; ncol: number } {
  const vars = facet.vars as { rows?: string; cols?: string }
  const rowVar = vars.rows
  const colVar = vars.cols

  // Get unique values for row and column variables
  const rowValues: string[] = []
  const colValues: string[] = []

  if (rowVar) {
    const uniqueRows = new Set<string>()
    for (const row of data) {
      const value = row[rowVar]
      if (value !== null && value !== undefined) {
        uniqueRows.add(String(value))
      }
    }
    rowValues.push(...Array.from(uniqueRows).sort())
  } else {
    rowValues.push('')  // Single row if no row variable
  }

  if (colVar) {
    const uniqueCols = new Set<string>()
    for (const row of data) {
      const value = row[colVar]
      if (value !== null && value !== undefined) {
        uniqueCols.add(String(value))
      }
    }
    colValues.push(...Array.from(uniqueCols).sort())
  } else {
    colValues.push('')  // Single column if no column variable
  }

  const nrow = rowValues.length
  const ncol = colValues.length

  if (nrow === 0 || ncol === 0) {
    return { panels: [], nrow: 0, ncol: 0 }
  }

  // Create panels for each cell in the grid
  const panels: FacetPanel[] = []
  let index = 0

  for (let r = 0; r < nrow; r++) {
    for (let c = 0; c < ncol; c++) {
      const rowValue = rowValues[r]
      const colValue = colValues[c]

      // Filter data for this panel
      const panelData = data.filter(row => {
        const matchRow = !rowVar || String(row[rowVar]) === rowValue
        const matchCol = !colVar || String(row[colVar]) === colValue
        return matchRow && matchCol
      })

      // Create label
      const labelParts: string[] = []
      if (rowValue) labelParts.push(rowValue)
      if (colValue) labelParts.push(colValue)
      const label = labelParts.join(', ') || 'All'

      panels.push({
        index,
        row: r,
        col: c,
        label,
        rowValue: rowValue || undefined,
        colValue: colValue || undefined,
        data: panelData,
      })

      index++
    }
  }

  return { panels, nrow, ncol }
}

/**
 * Calculate panel layout positions
 */
export interface PanelLayout {
  x: number
  y: number
  width: number
  height: number
  labelY: number  // Y position for strip label (for wrap facets)
}

/**
 * Layout options for panel calculation
 */
export interface PanelLayoutOptions {
  /** Whether this is a grid facet with separate row/col strips */
  isGrid?: boolean
  /** Whether the grid has row variable */
  hasRowVar?: boolean
  /** Whether the grid has column variable */
  hasColVar?: boolean
}

/**
 * Grid strip layout information
 */
export interface GridStripLayout {
  /** X position for each column strip (at top) */
  colStripX: number[]
  /** Y position for column strips */
  colStripY: number
  /** Width of column strips */
  colStripWidth: number
  /** Y position for each row strip (on right) */
  rowStripY: number[]
  /** X position for row strips */
  rowStripX: number
  /** Max width for row strip text */
  rowStripWidth: number
}

export function calculatePanelLayouts(
  totalWidth: number,
  totalHeight: number,
  nrow: number,
  ncol: number,
  hasTitle: boolean,
  margins: { top: number; right: number; bottom: number; left: number },
  options: PanelLayoutOptions = {}
): PanelLayout[] {
  const { isGrid = false, hasRowVar = false, hasColVar = false } = options

  // Reserve space for overall title and margins
  const titleHeight = hasTitle ? 2 : 0

  // For grid facets, we need space for column strips at top and row strips on right
  const colStripHeight = isGrid && hasColVar ? 1 : 0
  const rowStripWidth = isGrid && hasRowVar ? 10 : 0  // Space for row labels on right

  const availableWidth = totalWidth - margins.left - margins.right - rowStripWidth
  const availableHeight = totalHeight - margins.top - margins.bottom - titleHeight - colStripHeight

  // Calculate panel dimensions (including space for strip labels)
  // For wrap facets, we still need per-panel strips
  const stripHeight = isGrid ? 0 : 1  // For wrap: space for facet label above each panel
  const panelGapX = 2    // Gap between panels horizontally
  const panelGapY = 1    // Gap between panels vertically

  const totalGapX = (ncol - 1) * panelGapX
  const totalGapY = (nrow - 1) * panelGapY + (isGrid ? 0 : nrow * stripHeight)

  const panelWidth = Math.floor((availableWidth - totalGapX) / ncol)
  const panelHeight = Math.floor((availableHeight - totalGapY) / nrow)

  const layouts: PanelLayout[] = []

  for (let r = 0; r < nrow; r++) {
    for (let c = 0; c < ncol; c++) {
      const x = margins.left + c * (panelWidth + panelGapX)
      const baseY = margins.top + titleHeight + colStripHeight
      const y = baseY + r * (panelHeight + stripHeight + panelGapY)

      layouts.push({
        x,
        y: isGrid ? y : y + stripHeight,  // Panel starts after strip label for wrap
        width: panelWidth,
        height: panelHeight,
        labelY: isGrid ? y : y,  // Strip label at top of panel area
      })
    }
  }

  return layouts
}

/**
 * Calculate grid strip layout for facet_grid
 */
export function calculateGridStripLayout(
  totalWidth: number,
  totalHeight: number,
  nrow: number,
  ncol: number,
  hasTitle: boolean,
  margins: { top: number; right: number; bottom: number; left: number },
  hasRowVar: boolean,
  hasColVar: boolean
): GridStripLayout {
  const titleHeight = hasTitle ? 2 : 0
  const colStripHeight = hasColVar ? 1 : 0
  const rowStripWidth = hasRowVar ? 10 : 0

  const availableWidth = totalWidth - margins.left - margins.right - rowStripWidth
  const panelGapX = 2
  const panelGapY = 1
  const totalGapX = (ncol - 1) * panelGapX
  const totalGapY = (nrow - 1) * panelGapY

  const panelWidth = Math.floor((availableWidth - totalGapX) / ncol)
  const panelHeight = Math.floor((totalHeight - margins.top - margins.bottom - titleHeight - colStripHeight - totalGapY) / nrow)

  // Column strip positions (at top)
  const colStripX: number[] = []
  for (let c = 0; c < ncol; c++) {
    colStripX.push(margins.left + c * (panelWidth + panelGapX))
  }

  // Row strip positions (on right)
  const rowStripY: number[] = []
  const baseY = margins.top + titleHeight + colStripHeight
  for (let r = 0; r < nrow; r++) {
    const panelY = baseY + r * (panelHeight + panelGapY)
    rowStripY.push(panelY + Math.floor(panelHeight / 2))  // Centered vertically
  }

  return {
    colStripX,
    colStripY: margins.top + titleHeight,
    colStripWidth: panelWidth,
    rowStripY,
    rowStripX: totalWidth - margins.right - rowStripWidth + 1,
    rowStripWidth: rowStripWidth - 1,
  }
}
