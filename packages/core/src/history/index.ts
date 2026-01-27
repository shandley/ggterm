/**
 * Plot history management
 *
 * Tracks all plots created with provenance metadata for later retrieval.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { PlotSpec } from '../types'

export interface PlotProvenance {
  id: string
  timestamp: string
  dataFile?: string
  command?: string
  description: string
  geomTypes: string[]
  aesthetics: string[]
}

export interface HistoricalPlot {
  _provenance: PlotProvenance
  spec: PlotSpec
}

export interface HistoryEntry {
  id: string
  timestamp: string
  description: string
  dataFile?: string
  geomTypes: string[]
}

/**
 * Get the .ggterm directory path
 */
export function getGGTermDir(): string {
  return join(process.cwd(), '.ggterm')
}

/**
 * Get the plots directory path
 */
export function getPlotsDir(): string {
  return join(getGGTermDir(), 'plots')
}

/**
 * Get the history file path
 */
export function getHistoryFile(): string {
  return join(getGGTermDir(), 'history.jsonl')
}

/**
 * Ensure the history directories exist
 */
export function ensureHistoryDirs(): void {
  const ggTermDir = getGGTermDir()
  const plotsDir = getPlotsDir()

  if (!existsSync(ggTermDir)) {
    mkdirSync(ggTermDir, { recursive: true })
  }
  if (!existsSync(plotsDir)) {
    mkdirSync(plotsDir, { recursive: true })
  }
}

/**
 * Generate a unique plot ID based on date and sequence
 */
export function generatePlotId(): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD

  // Find existing plots for today to get next sequence number
  const plotsDir = getPlotsDir()
  if (!existsSync(plotsDir)) {
    return `${dateStr}-001`
  }

  const todaysPlots = readdirSync(plotsDir)
    .filter(f => f.startsWith(dateStr) && f.endsWith('.json'))
    .sort()

  if (todaysPlots.length === 0) {
    return `${dateStr}-001`
  }

  // Extract highest sequence number
  const lastPlot = todaysPlots[todaysPlots.length - 1]
  const match = lastPlot.match(/-(\d+)\.json$/)
  const nextSeq = match ? parseInt(match[1], 10) + 1 : 1

  return `${dateStr}-${String(nextSeq).padStart(3, '0')}`
}

/**
 * Auto-generate a description based on the plot spec
 */
export function generateDescription(spec: PlotSpec): string {
  const parts: string[] = []

  // Geom types
  const geomTypes = spec.geoms.map(g => g.type)
  if (geomTypes.length === 1) {
    parts.push(capitalizeGeom(geomTypes[0]))
  } else {
    parts.push(geomTypes.map(capitalizeGeom).join(' + '))
  }

  // Aesthetics
  const aes = spec.aes
  if (aes.x && aes.y) {
    parts.push(`of ${aes.y} vs ${aes.x}`)
  } else if (aes.x) {
    parts.push(`of ${aes.x}`)
  }

  // Color grouping
  if (aes.color) {
    parts.push(`by ${aes.color}`)
  }

  // Title if present
  if (spec.labels.title) {
    parts.push(`- "${spec.labels.title}"`)
  }

  return parts.join(' ')
}

function capitalizeGeom(geomType: string): string {
  const names: Record<string, string> = {
    point: 'Scatter plot',
    line: 'Line chart',
    bar: 'Bar chart',
    histogram: 'Histogram',
    boxplot: 'Box plot',
    violin: 'Violin plot',
    area: 'Area chart',
    step: 'Step chart',
    path: 'Path plot',
    smooth: 'Smooth line',
    qq: 'Q-Q plot',
    freqpoly: 'Frequency polygon',
    hline: 'Horizontal line',
    vline: 'Vertical line',
    segment: 'Segment',
    text: 'Text labels',
    tile: 'Tile/Heatmap',
    contour: 'Contour plot',
    errorbar: 'Error bars',
    rug: 'Rug plot',
    rect: 'Rectangle',
  }
  return names[geomType] || geomType
}

/**
 * Save a plot to history
 */
export function savePlotToHistory(
  spec: PlotSpec,
  options: {
    dataFile?: string
    command?: string
    description?: string
  } = {}
): string {
  ensureHistoryDirs()

  const id = generatePlotId()
  const timestamp = new Date().toISOString()
  const description = options.description || generateDescription(spec)

  const provenance: PlotProvenance = {
    id,
    timestamp,
    dataFile: options.dataFile,
    command: options.command,
    description,
    geomTypes: spec.geoms.map(g => g.type),
    aesthetics: Object.keys(spec.aes).filter(k => spec.aes[k as keyof typeof spec.aes]),
  }

  const historicalPlot: HistoricalPlot = {
    _provenance: provenance,
    spec,
  }

  // Save full plot spec
  const plotPath = join(getPlotsDir(), `${id}.json`)
  writeFileSync(plotPath, JSON.stringify(historicalPlot, null, 2))

  // Append to history index
  const historyEntry: HistoryEntry = {
    id,
    timestamp,
    description,
    dataFile: options.dataFile,
    geomTypes: provenance.geomTypes,
  }
  appendFileSync(getHistoryFile(), JSON.stringify(historyEntry) + '\n')

  // Also save as "last" for backward compatibility
  writeFileSync(join(getGGTermDir(), 'last-plot.json'), JSON.stringify(spec, null, 2))

  return id
}

/**
 * Load a plot from history by ID
 */
export function loadPlotFromHistory(id: string): HistoricalPlot | null {
  const plotPath = join(getPlotsDir(), `${id}.json`)

  if (!existsSync(plotPath)) {
    return null
  }

  return JSON.parse(readFileSync(plotPath, 'utf-8'))
}

/**
 * Get all history entries
 */
export function getHistory(): HistoryEntry[] {
  const historyFile = getHistoryFile()

  if (!existsSync(historyFile)) {
    return []
  }

  const content = readFileSync(historyFile, 'utf-8').trim()
  if (!content) {
    return []
  }

  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
}

/**
 * Search history by text (searches description, dataFile, geomTypes)
 */
export function searchHistory(query: string): HistoryEntry[] {
  const history = getHistory()
  const lowerQuery = query.toLowerCase()

  return history.filter(entry => {
    const searchText = [
      entry.description,
      entry.dataFile || '',
      entry.geomTypes.join(' '),
    ].join(' ').toLowerCase()

    return searchText.includes(lowerQuery)
  })
}

/**
 * Get the most recent plot ID
 */
export function getLatestPlotId(): string | null {
  const history = getHistory()
  if (history.length === 0) {
    return null
  }
  return history[history.length - 1].id
}
