#!/usr/bin/env node
/**
 * CLI for creating plots and inspecting data
 *
 * Commands:
 *   inspect <file>     - Show column types and statistics
 *   suggest <file>     - Suggest visualizations with ready-to-run commands
 *   history            - List all plots in history
 *   show <id>          - Re-render a plot from history
 *   export [id] [file] - Export plot to HTML (latest or by ID)
 *   <file> <x> <y> ... - Create a plot (original behavior)
 */

import {
  gg,
  geom_point,
  geom_line,
  geom_path,
  geom_step,
  geom_bar,
  geom_col,
  geom_histogram,
  geom_freqpoly,
  geom_density,
  geom_boxplot,
  geom_violin,
  geom_ridgeline,
  geom_beeswarm,
  geom_dumbbell,
  geom_lollipop,
  geom_waffle,
  geom_sparkline,
  geom_bullet,
  geom_braille,
  geom_area,
  geom_ribbon,
  geom_rug,
  geom_errorbar,
  geom_errorbarh,
  geom_crossbar,
  geom_linerange,
  geom_pointrange,
  geom_smooth,
  geom_segment,
  geom_rect,
  geom_raster,
  geom_tile,
  geom_bin2d,
  geom_text,
  geom_label,
  geom_contour,
  geom_contour_filled,
  geom_density_2d,
  geom_qq,
  geom_qq_line,
  geom_hline,
  geom_vline,
  geom_abline,
  geom_calendar,
  geom_flame,
  geom_icicle,
  geom_corrmat,
  geom_sankey,
  geom_treemap,
  geom_volcano,
  facet_wrap,
} from './index'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  savePlotToHistory,
  loadPlotFromHistory,
  getHistory,
  searchHistory,
  getLatestPlotId,
  getGGTermDir,
} from './history'
import { handleInit } from './init'

const GEOM_TYPES = [
  'point', 'line', 'path', 'step', 'bar', 'col', 'histogram', 'freqpoly', 'density',
  'boxplot', 'violin', 'ridgeline', 'joy', 'beeswarm', 'quasirandom',
  'dumbbell', 'lollipop', 'waffle', 'sparkline', 'bullet', 'braille',
  'area', 'ribbon', 'rug', 'errorbar', 'errorbarh',
  'crossbar', 'linerange', 'pointrange', 'smooth', 'segment', 'rect',
  'raster', 'tile', 'bin2d', 'text', 'label', 'contour', 'contour_filled',
  'density_2d', 'qq', 'calendar', 'flame', 'icicle', 'corrmat', 'sankey', 'treemap', 'volcano'
]

// Date pattern: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
const datePattern = /^\d{4}-\d{2}-\d{2}/

interface ColumnInfo {
  name: string
  type: 'numeric' | 'categorical' | 'date' | 'mixed'
  uniqueCount: number
  sampleValues: string[]
  min?: number
  max?: number
  nullCount: number
}

/**
 * Check if a file exists
 */
function fileExists(path: string): boolean {
  try {
    readFileSync(path)
    return true
  } catch {
    return false
  }
}

/**
 * Load and parse CSV file with friendly error messages
 */
function loadCSV(dataFile: string, text: string): { headers: string[]; data: Record<string, any>[] } {
  const lines = text.trim().split('\n')

  if (lines.length === 0) {
    console.error(`\nError: File is empty: ${dataFile}`)
    process.exit(1)
  }

  if (lines.length === 1) {
    console.error(`\nError: File has no data rows: ${dataFile}`)
    console.error(`The file only contains a header row. Add some data.`)
    process.exit(1)
  }

  const headers = lines[0].split(',').map(h => h.trim())

  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    console.error(`\nError: No columns found in header row`)
    console.error(`Expected a comma-separated header row like: x,y,color`)
    process.exit(1)
  }

  const data = lines.slice(1).map((line) => {
    const values = line.split(',')
    const row: Record<string, any> = {}
    headers.forEach((h, i) => {
      const val = values[i]?.trim()
      if (val === '' || val === undefined) {
        row[h] = null
      } else if (datePattern.test(val)) {
        row[h] = new Date(val).getTime()
      } else {
        const num = Number(val)
        row[h] = isNaN(num) ? val : num
      }
    })
    return row
  })

  return { headers, data }
}

/**
 * Load and parse JSON file
 */
function loadJSON(dataFile: string, text: string): { headers: string[]; data: Record<string, any>[] } {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (err: any) {
    console.error(`\nError: Invalid JSON in ${dataFile}`)
    console.error(`Reason: ${err.message}`)
    process.exit(1)
  }

  // Handle array of objects
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      console.error(`\nError: JSON array is empty: ${dataFile}`)
      process.exit(1)
    }

    // Extract headers from first object
    const headers = Object.keys(parsed[0])
    if (headers.length === 0) {
      console.error(`\nError: JSON objects have no properties`)
      process.exit(1)
    }

    // Convert values (dates, numbers)
    const data = parsed.map((row: any) => {
      const converted: Record<string, any> = {}
      for (const key of headers) {
        const val = row[key]
        if (val === null || val === undefined) {
          converted[key] = null
        } else if (typeof val === 'string' && datePattern.test(val)) {
          converted[key] = new Date(val).getTime()
        } else {
          converted[key] = val
        }
      }
      return converted
    })

    return { headers, data }
  }

  // Handle object with "data" array
  if (parsed.data && Array.isArray(parsed.data)) {
    return loadJSON(dataFile, JSON.stringify(parsed.data))
  }

  console.error(`\nError: Expected JSON array or object with "data" array`)
  console.error(`Got: ${typeof parsed}`)
  process.exit(1)
}

/**
 * Load and parse JSONL (JSON Lines) file
 */
function loadJSONL(dataFile: string, text: string): { headers: string[]; data: Record<string, any>[] } {
  const lines = text.trim().split('\n').filter(line => line.trim())

  if (lines.length === 0) {
    console.error(`\nError: JSONL file is empty: ${dataFile}`)
    process.exit(1)
  }

  const data: Record<string, any>[] = []
  let headers: string[] = []

  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i])
      if (i === 0) {
        headers = Object.keys(obj)
      }

      // Convert values
      const converted: Record<string, any> = {}
      for (const key of headers) {
        const val = obj[key]
        if (val === null || val === undefined) {
          converted[key] = null
        } else if (typeof val === 'string' && datePattern.test(val)) {
          converted[key] = new Date(val).getTime()
        } else {
          converted[key] = val
        }
      }
      data.push(converted)
    } catch (err: any) {
      console.error(`\nError: Invalid JSON on line ${i + 1} of ${dataFile}`)
      console.error(`Reason: ${err.message}`)
      console.error(`Line: ${lines[i].slice(0, 50)}...`)
      process.exit(1)
    }
  }

  if (headers.length === 0) {
    console.error(`\nError: JSONL objects have no properties`)
    process.exit(1)
  }

  return { headers, data }
}

/**
 * Detect file type and load data
 */
function loadData(dataFile: string): { headers: string[]; data: Record<string, any>[] } {
  // Check file exists
  if (!fileExists(dataFile)) {
    console.error(`\nError: File not found: ${dataFile}`)
    console.error(`\nMake sure the file path is correct and the file exists.`)
    console.error(`Current directory: ${process.cwd()}`)
    process.exit(1)
  }

  let text: string
  try {
    text = readFileSync(dataFile, 'utf-8')
  } catch (err: any) {
    console.error(`\nError: Cannot read file: ${dataFile}`)
    console.error(`Reason: ${err.message}`)
    process.exit(1)
  }

  // Detect file type by extension
  const ext = dataFile.toLowerCase().split('.').pop()

  if (ext === 'json') {
    return loadJSON(dataFile, text)
  } else if (ext === 'jsonl' || ext === 'ndjson') {
    return loadJSONL(dataFile, text)
  } else {
    // Default to CSV (includes .csv, .tsv, .txt, etc.)
    return loadCSV(dataFile, text)
  }
}

/**
 * Analyze column types and statistics
 */
function analyzeColumns(headers: string[], data: Record<string, any>[]): ColumnInfo[] {
  return headers.map(name => {
    const values = data.map(row => row[name])
    const nonNullValues = values.filter(v => v !== null && v !== undefined)
    const uniqueValues = [...new Set(nonNullValues)]

    // Determine type
    let numericCount = 0
    let dateCount = 0
    let stringCount = 0

    for (const val of nonNullValues) {
      if (typeof val === 'number') {
        // Check if it looks like a timestamp (large number from date parsing)
        if (val > 946684800000 && val < 4102444800000) { // 2000-2100 range in ms
          dateCount++
        } else {
          numericCount++
        }
      } else if (typeof val === 'string') {
        stringCount++
      }
    }

    let type: ColumnInfo['type']
    if (dateCount > nonNullValues.length * 0.8) {
      type = 'date'
    } else if (numericCount > nonNullValues.length * 0.8) {
      type = 'numeric'
    } else if (stringCount > nonNullValues.length * 0.8) {
      type = 'categorical'
    } else {
      type = 'mixed'
    }

    // Get sample values (as strings for display)
    const sampleValues = uniqueValues.slice(0, 4).map(v => {
      if (type === 'date' && typeof v === 'number') {
        return new Date(v).toISOString().split('T')[0]
      }
      return String(v)
    })

    // Calculate min/max for numeric
    let min: number | undefined
    let max: number | undefined
    if (type === 'numeric') {
      const nums = nonNullValues.filter(v => typeof v === 'number') as number[]
      if (nums.length > 0) {
        min = Math.min(...nums)
        max = Math.max(...nums)
      }
    }

    return {
      name,
      type,
      uniqueCount: uniqueValues.length,
      sampleValues,
      min,
      max,
      nullCount: values.length - nonNullValues.length,
    }
  })
}

/**
 * Handle 'inspect' command
 */
function handleInspect(dataFile: string): void {
  const { headers, data } = loadData(dataFile)
  const columns = analyzeColumns(headers, data)

  console.log(`\n${dataFile}: ${data.length} rows × ${headers.length} columns\n`)

  // Calculate column widths
  const nameWidth = Math.max(12, ...columns.map(c => c.name.length))
  const typeWidth = 12
  const uniqueWidth = 8
  const rangeWidth = 20
  const sampleWidth = 35

  // Header
  const header = [
    'Column'.padEnd(nameWidth),
    'Type'.padEnd(typeWidth),
    'Unique'.padStart(uniqueWidth),
    'Range/Stats'.padEnd(rangeWidth),
    'Sample Values',
  ].join('  ')

  const separator = '─'.repeat(header.length)

  console.log(header)
  console.log(separator)

  // Rows
  for (const col of columns) {
    let rangeStr = ''
    if (col.type === 'numeric' && col.min !== undefined && col.max !== undefined) {
      rangeStr = `${col.min.toFixed(1)} – ${col.max.toFixed(1)}`
    } else if (col.type === 'categorical') {
      rangeStr = `${col.uniqueCount} categories`
    } else if (col.type === 'date') {
      rangeStr = 'date range'
    }

    const row = [
      col.name.padEnd(nameWidth),
      col.type.padEnd(typeWidth),
      String(col.uniqueCount).padStart(uniqueWidth),
      rangeStr.padEnd(rangeWidth),
      col.sampleValues.join(', ').slice(0, sampleWidth),
    ].join('  ')

    console.log(row)
  }

  if (columns.some(c => c.nullCount > 0)) {
    console.log(`\nNote: Some columns have null values`)
  }
  console.log('')
}

/**
 * Generate plot suggestions based on column types
 */
function generateSuggestions(
  dataFile: string,
  columns: ColumnInfo[]
): Array<{ description: string; command: string }> {
  const suggestions: Array<{ description: string; command: string }> = []

  const numeric = columns.filter(c => c.type === 'numeric')
  const categorical = columns.filter(c => c.type === 'categorical')
  const dates = columns.filter(c => c.type === 'date')

  const cliBase = `bun packages/core/src/cli-plot.ts ${dataFile}`

  // 1. If we have dates and numeric, suggest time series
  if (dates.length > 0 && numeric.length > 0) {
    const dateCol = dates[0].name
    const numCol = numeric[0].name
    suggestions.push({
      description: `Time series: ${numCol} over ${dateCol}`,
      command: `${cliBase} ${dateCol} ${numCol} - - line`,
    })
  }

  // 2. If we have 2+ numeric columns, suggest scatter
  if (numeric.length >= 2) {
    const [x, y] = numeric
    const colorCol = categorical.length > 0 ? categorical[0].name : '-'
    suggestions.push({
      description: `Scatter: ${x.name} vs ${y.name}${colorCol !== '-' ? ` (by ${colorCol})` : ''}`,
      command: `${cliBase} ${x.name} ${y.name} ${colorCol} - point`,
    })
  }

  // 3. Distribution of numeric columns
  if (numeric.length > 0) {
    const col = numeric[0].name
    if (categorical.length > 0) {
      // Grouped histogram using freqpoly
      suggestions.push({
        description: `Distribution: ${col} by ${categorical[0].name}`,
        command: `${cliBase} ${col} - ${categorical[0].name} - freqpoly`,
      })
    } else {
      suggestions.push({
        description: `Distribution: ${col}`,
        command: `${cliBase} ${col} - - - histogram`,
      })
    }
  }

  // 4. Box plot for numeric by categorical
  if (numeric.length > 0 && categorical.length > 0) {
    const cat = categorical[0]
    const num = numeric[0]
    if (cat.uniqueCount <= 10) {
      suggestions.push({
        description: `Box plot: ${num.name} by ${cat.name}`,
        command: `${cliBase} ${cat.name} ${num.name} - - boxplot`,
      })
    }
  }

  // 5. Bar chart for categorical
  if (categorical.length > 0) {
    const cat = categorical[0]
    if (cat.uniqueCount <= 15) {
      suggestions.push({
        description: `Bar chart: counts of ${cat.name}`,
        command: `${cliBase} ${cat.name} - - - bar`,
      })
    }
  }

  // 6. Q-Q plot for normality check
  if (numeric.length > 0) {
    const col = numeric[0].name
    suggestions.push({
      description: `Q-Q plot: check ${col} normality`,
      command: `${cliBase} ${col} - - - qq`,
    })
  }

  // 7. If multiple numeric, suggest correlation exploration
  if (numeric.length >= 3) {
    const [a, , c] = numeric
    suggestions.push({
      description: `Scatter: ${a.name} vs ${c.name} (alternative pairing)`,
      command: `${cliBase} ${a.name} ${c.name} - - point`,
    })
  }

  return suggestions
}

/**
 * Handle 'suggest' command
 */
function handleSuggest(dataFile: string): void {
  const { headers, data } = loadData(dataFile)
  const columns = analyzeColumns(headers, data)
  const suggestions = generateSuggestions(dataFile, columns)

  console.log(`\nSuggested visualizations for ${dataFile}:\n`)

  if (suggestions.length === 0) {
    console.log('No suggestions available. Check that the file has plottable columns.')
    return
  }

  suggestions.forEach((s, i) => {
    console.log(`${i + 1}. ${s.description}`)
    console.log(`   ${s.command}`)
    console.log('')
  })
}

/**
 * Validate that a column exists in the data
 */
function validateColumn(colName: string, headers: string[], argName: string): void {
  if (colName === '-') return // Skip placeholder
  if (!headers.includes(colName)) {
    console.error(`\nError: Column "${colName}" not found in data`)
    console.error(`\nAvailable columns: ${headers.join(', ')}`)
    console.error(`\nYou specified "${colName}" for the ${argName} argument.`)
    process.exit(1)
  }
}

/**
 * Validate geom type (base type, not including reference lines)
 */
function validateGeomType(geomType: string): void {
  if (!GEOM_TYPES.includes(geomType)) {
    console.error(`\nError: Unknown geometry type "${geomType}"`)
    console.error(`\nAvailable geom types:`)
    // Group by category for readability
    console.error(`  Points/Lines: point, line, path, step, smooth, segment`)
    console.error(`  Bars/Areas:   bar, col, histogram, freqpoly, area, ribbon`)
    console.error(`  Distributions: boxplot, violin, ridgeline, joy, beeswarm, quasirandom, qq, density, density_2d`)
    console.error(`  Uncertainty:  errorbar, errorbarh, crossbar, linerange, pointrange`)
    console.error(`  2D:           tile, rect, raster, bin2d, contour, contour_filled`)
    console.error(`  Text:         text, label`)
    console.error(`  Other:        rug`)
    console.error(`\nReference lines (add with +):`)
    console.error(`  hline@<y>           - horizontal line at y value`)
    console.error(`  vline@<x>           - vertical line at x value`)
    console.error(`  abline@<slope>,<intercept> - line with slope and intercept`)
    console.error(`\nExample: point+hline@50+vline@2.5`)
    process.exit(1)
  }
}

interface RefLine {
  type: 'hline' | 'vline' | 'abline'
  value: number
  slope?: number // for abline
}

/**
 * Parse geom specification with optional reference lines
 * Format: "point+hline@50+vline@2" => { baseGeom: 'point', refLines: [...] }
 */
function parseGeomSpec(geomSpec: string): { baseGeom: string; refLines: RefLine[] } {
  const parts = geomSpec.split('+')
  const baseGeom = parts[0]
  const refLines: RefLine[] = []

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]

    if (part.startsWith('hline@')) {
      const value = parseFloat(part.slice(6))
      if (isNaN(value)) {
        console.error(`\nError: Invalid hline value: "${part}"`)
        console.error(`Expected format: hline@<number> (e.g., hline@50)`)
        process.exit(1)
      }
      refLines.push({ type: 'hline', value })
    } else if (part.startsWith('vline@')) {
      const value = parseFloat(part.slice(6))
      if (isNaN(value)) {
        console.error(`\nError: Invalid vline value: "${part}"`)
        console.error(`Expected format: vline@<number> (e.g., vline@2.5)`)
        process.exit(1)
      }
      refLines.push({ type: 'vline', value })
    } else if (part.startsWith('abline@')) {
      const params = part.slice(7).split(',')
      if (params.length !== 2) {
        console.error(`\nError: Invalid abline format: "${part}"`)
        console.error(`Expected format: abline@<slope>,<intercept> (e.g., abline@1,0)`)
        process.exit(1)
      }
      const slope = parseFloat(params[0])
      const intercept = parseFloat(params[1])
      if (isNaN(slope) || isNaN(intercept)) {
        console.error(`\nError: Invalid abline values: "${part}"`)
        console.error(`Expected format: abline@<slope>,<intercept> (e.g., abline@1,0)`)
        process.exit(1)
      }
      refLines.push({ type: 'abline', value: intercept, slope })
    } else {
      console.error(`\nError: Unknown reference line type: "${part}"`)
      console.error(`Valid types: hline@<y>, vline@<x>, abline@<slope>,<intercept>`)
      process.exit(1)
    }
  }

  return { baseGeom, refLines }
}

/**
 * Handle plot command (original behavior)
 */
function handlePlot(args: string[]): void {
  if (args.length < 2) {
    console.error(`\nError: Not enough arguments`)
    console.error(`\nUsage: cli-plot.ts <file> <x> <y> [color] [title] [geom] [facet]`)
    console.error(`\nExamples:`)
    console.error(`  cli-plot.ts data.csv x y              # Scatter plot`)
    console.error(`  cli-plot.ts data.csv value - - - histogram  # Histogram`)
    console.error(`  cli-plot.ts data.csv x y color "Title" point`)
    console.error(`\nTip: Use "inspect <file>" to see available columns`)
    process.exit(1)
  }

  // Check if file argument looks like a file
  if (!args[0].includes('.') && !fileExists(args[0])) {
    console.error(`\nError: "${args[0]}" doesn't look like a file path`)
    console.error(`\nDid you mean one of these commands?`)
    console.error(`  inspect <file>  - Show column types`)
    console.error(`  suggest <file>  - Get plot suggestions`)
    console.error(`  history         - List saved plots`)
    console.error(`  help            - Show full usage`)
    process.exit(1)
  }

  const [dataFile, x, y, color, title, geomSpec = 'point', facetVar] = args
  const { headers, data } = loadData(dataFile)

  // Parse geom specification (may include reference lines like point+hline@50)
  const { baseGeom: geomType, refLines } = parseGeomSpec(geomSpec)

  // Validate geom type first
  validateGeomType(geomType)

  // Validate column names
  validateColumn(x, headers, 'x')
  if (y && y !== '-') validateColumn(y, headers, 'y')
  if (color && color !== '-') validateColumn(color, headers, 'color')
  if (facetVar && facetVar !== '-') validateColumn(facetVar, headers, 'facet')

  // Check for missing y when required
  const geomsRequiringY = ['line', 'path', 'step', 'point', 'smooth', 'segment', 'area', 'ribbon', 'tile', 'rect', 'raster', 'bin2d', 'contour', 'contour_filled', 'density_2d', 'text', 'label', 'col', 'errorbar', 'errorbarh', 'crossbar', 'linerange', 'pointrange']
  if (geomsRequiringY.includes(geomType) && (!y || y === '-')) {
    console.error(`\nError: Geometry type "${geomType}" requires a y column`)
    console.error(`\nUsage: cli-plot.ts ${dataFile} <x> <y> [color] [title] ${geomType}`)
    console.error(`\nIf you want a univariate plot, try: histogram, density, bar, qq, or freqpoly`)
    process.exit(1)
  }

  // Build plot
  // Note: y may be absent for histograms (stat computes it)
  const aes: Record<string, string> = { x }
  if (y && y !== '-') aes.y = y
  // For heatmap geoms (tile, raster, bin2d), use fill instead of color
  if (color && color !== '-') {
    if (geomType === 'tile' || geomType === 'raster' || geomType === 'bin2d') {
      aes.fill = color
    } else {
      aes.color = color
    }
  }

  let plot = gg(data).aes(aes as any)

  // Add geom
  switch (geomType) {
    case 'line':
      plot = plot.geom(geom_line())
      break
    case 'path':
      plot = plot.geom(geom_path())
      break
    case 'step':
      plot = plot.geom(geom_step())
      break
    case 'histogram':
      plot = plot.geom(geom_histogram({ bins: 20 }))
      break
    case 'freqpoly':
      plot = plot.geom(geom_freqpoly({ bins: 20 }))
      break
    case 'density':
      plot = plot.geom(geom_density())
      break
    case 'boxplot':
      plot = plot.geom(geom_boxplot())
      break
    case 'violin':
      plot = plot.geom(geom_violin())
      break
    case 'ridgeline':
    case 'joy':
      plot = plot.geom(geom_ridgeline())
      break
    case 'beeswarm':
    case 'quasirandom':
      plot = plot.geom(geom_beeswarm())
      break
    case 'dumbbell':
      plot = plot.geom(geom_dumbbell())
      break
    case 'lollipop':
      plot = plot.geom(geom_lollipop())
      break
    case 'waffle':
      plot = plot.geom(geom_waffle())
      break
    case 'sparkline':
      plot = plot.geom(geom_sparkline())
      break
    case 'bullet':
      plot = plot.geom(geom_bullet())
      break
    case 'braille':
      plot = plot.geom(geom_braille())
      break
    case 'bar':
      plot = plot.geom(geom_bar())
      break
    case 'col':
      plot = plot.geom(geom_col())
      break
    case 'area':
      plot = plot.geom(geom_area())
      break
    case 'ribbon':
      plot = plot.geom(geom_ribbon())
      break
    case 'rug':
      plot = plot.geom(geom_rug())
      break
    case 'errorbar':
      plot = plot.geom(geom_errorbar())
      break
    case 'errorbarh':
      plot = plot.geom(geom_errorbarh())
      break
    case 'crossbar':
      plot = plot.geom(geom_crossbar())
      break
    case 'linerange':
      plot = plot.geom(geom_linerange())
      break
    case 'pointrange':
      plot = plot.geom(geom_pointrange())
      break
    case 'smooth':
      plot = plot.geom(geom_smooth())
      break
    case 'segment':
      plot = plot.geom(geom_segment())
      break
    case 'rect':
      plot = plot.geom(geom_rect())
      break
    case 'raster':
      plot = plot.geom(geom_raster())
      break
    case 'tile':
      plot = plot.geom(geom_tile())
      break
    case 'bin2d':
      plot = plot.geom(geom_bin2d())
      break
    case 'text':
      plot = plot.geom(geom_text())
      break
    case 'label':
      plot = plot.geom(geom_label())
      break
    case 'contour':
      plot = plot.geom(geom_contour())
      break
    case 'contour_filled':
      plot = plot.geom(geom_contour_filled())
      break
    case 'density_2d':
      plot = plot.geom(geom_density_2d())
      break
    case 'qq':
      plot = plot.geom(geom_qq())
      plot = plot.geom(geom_qq_line())
      break
    case 'calendar':
      plot = plot.geom(geom_calendar())
      break
    case 'flame':
      plot = plot.geom(geom_flame())
      break
    case 'icicle':
      plot = plot.geom(geom_icicle())
      break
    case 'corrmat':
      plot = plot.geom(geom_corrmat())
      break
    case 'sankey':
      plot = plot.geom(geom_sankey())
      break
    case 'treemap':
      plot = plot.geom(geom_treemap())
      break
    case 'volcano':
      plot = plot.geom(geom_volcano())
      break
    case 'point':
    default:
      plot = plot.geom(geom_point())
  }

  // Add reference lines
  for (const refLine of refLines) {
    if (refLine.type === 'hline') {
      plot = plot.geom(geom_hline({ yintercept: refLine.value, linetype: 'dashed', color: '#888888' }))
    } else if (refLine.type === 'vline') {
      plot = plot.geom(geom_vline({ xintercept: refLine.value, linetype: 'dashed', color: '#888888' }))
    } else if (refLine.type === 'abline') {
      plot = plot.geom(geom_abline({ slope: refLine.slope!, intercept: refLine.value, linetype: 'dashed', color: '#888888' }))
    }
  }

  // Determine y-axis label
  let yLabel: string | undefined = y !== '-' ? y : undefined
  if ((geomType === 'histogram' || geomType === 'bar' || geomType === 'freqpoly') && !yLabel) {
    yLabel = 'count'
  }
  if (geomType === 'density' && !yLabel) {
    yLabel = 'density'
  }
  if (geomType === 'qq') {
    yLabel = 'Sample Quantiles'
  }

  // Determine x-axis label
  let xLabel: string = x
  if (geomType === 'qq') {
    xLabel = 'Theoretical Quantiles'
  }

  // Add labels
  if (title && title !== '-') {
    plot = plot.labs({ title, x: xLabel, y: yLabel })
  } else {
    plot = plot.labs({ x: xLabel, y: yLabel })
  }

  // Add faceting if specified
  if (facetVar && facetVar !== '-') {
    plot = plot.facet(facet_wrap(facetVar))
  }

  console.log(plot.render({ width: 70, height: 20, colorMode: 'truecolor' }))

  // Save to history with provenance
  const spec = plot.spec()
  const commandStr = `cli-plot.ts ${args.join(' ')}`
  const plotId = savePlotToHistory(spec, {
    dataFile,
    command: commandStr,
  })

  console.log(`\n[Saved as ${plotId}]`)
}

/**
 * Handle 'history' command - list all plots
 */
function handleHistory(searchQuery?: string): void {
  const entries = searchQuery ? searchHistory(searchQuery) : getHistory()

  if (entries.length === 0) {
    if (searchQuery) {
      console.log(`No plots found matching "${searchQuery}"`)
    } else {
      console.log('No plots in history. Create a plot first.')
    }
    return
  }

  console.log(`\nPlot History${searchQuery ? ` (matching "${searchQuery}")` : ''}:\n`)

  // Table header
  const idWidth = 16
  const dateWidth = 12
  const descWidth = 45

  console.log(
    'ID'.padEnd(idWidth) +
    'Date'.padEnd(dateWidth) +
    'Description'
  )
  console.log('─'.repeat(idWidth + dateWidth + descWidth))

  for (const entry of entries) {
    const date = entry.timestamp.split('T')[0]
    const desc = entry.description.length > descWidth
      ? entry.description.slice(0, descWidth - 3) + '...'
      : entry.description

    console.log(
      entry.id.padEnd(idWidth) +
      date.padEnd(dateWidth) +
      desc
    )
  }

  console.log(`\nTotal: ${entries.length} plot(s)`)
  console.log('Use "show <id>" to re-render or "export <id>" to export')
}

/**
 * Handle 'show' command - re-render a plot from history
 */
function handleShow(plotId: string): void {
  const historical = loadPlotFromHistory(plotId)

  if (!historical) {
    console.error(`Plot "${plotId}" not found in history.`)
    console.error('Use "history" to see available plots.')
    process.exit(1)
  }

  const spec = historical.spec

  // Render the stored spec directly using renderToString
  const { renderToString } = require('./index')
  console.log(renderToString(spec, { width: 70, height: 20, colorMode: 'truecolor' }))

  console.log(`\n[${plotId}] ${historical._provenance.description}`)
}

/**
 * Handle 'export' command - create HTML file for publication export
 */
function handleExport(idOrFile?: string, outputFile?: string): void {
  let plotSpec: any
  let plotId: string | null = null

  // Determine if first arg is an ID or output file
  if (idOrFile && idOrFile.match(/^\d{4}-\d{2}-\d{2}-\d{3}$/)) {
    // It's a plot ID
    plotId = idOrFile
    const historical = loadPlotFromHistory(plotId)
    if (!historical) {
      console.error(`Plot "${plotId}" not found in history.`)
      process.exit(1)
    }
    plotSpec = historical.spec
  } else if (idOrFile) {
    // It's an output filename, use latest plot
    outputFile = idOrFile
    plotId = getLatestPlotId()
    if (!plotId) {
      console.error('No plot found. Create a plot first using the CLI.')
      process.exit(1)
    }
    const historical = loadPlotFromHistory(plotId)
    plotSpec = historical?.spec
  } else {
    // No args, use latest plot
    plotId = getLatestPlotId()
    if (!plotId) {
      console.error('No plot found. Create a plot first using the CLI.')
      process.exit(1)
    }
    const historical = loadPlotFromHistory(plotId)
    plotSpec = historical?.spec
  }

  if (!plotSpec) {
    console.error('Could not load plot spec.')
    process.exit(1)
  }

  // Convert to Vega-Lite with interactivity enabled
  const { plotSpecToVegaLite } = require('./export')
  const spec = plotSpecToVegaLite(plotSpec, {
    interactive: true,
  })

  // Save Vega-Lite spec for style skill to modify
  writeFileSync(
    join(getGGTermDir(), 'last-plot-vegalite.json'),
    JSON.stringify(spec, null, 2)
  )

  const title = typeof spec.title === 'string' ? spec.title : spec.title?.text || 'Plot'
  const output = outputFile || `${plotId}.html`

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
    h1 { margin-top: 0; color: #333; font-size: 24px; }
    .buttons { margin-top: 20px; }
    button { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; font-size: 14px; }
    .btn-svg { background: #4CAF50; color: white; }
    .btn-png { background: #2196F3; color: white; }
    button:hover { opacity: 0.9; }
    #vis { margin: 20px 0; }
    .info { color: #666; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div id="vis"></div>
    <div class="buttons">
      <button class="btn-svg" onclick="exportSVG()">Download SVG</button>
      <button class="btn-png" onclick="exportPNG()">Download PNG</button>
    </div>
    <p class="info">Generated by ggterm</p>
  </div>
  <script>
    const spec = ${JSON.stringify(spec, null, 2)};
    let view;
    vegaEmbed('#vis', spec, {actions: false}).then(result => { view = result.view; });
    function exportSVG() {
      view.toSVG().then(svg => {
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '${title.toLowerCase().replace(/\s+/g, '-')}.svg';
        a.click();
      });
    }
    function exportPNG() {
      view.toCanvas(2).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = '${title.toLowerCase().replace(/\s+/g, '-')}.png';
        a.click();
      });
    }
  </script>
</body>
</html>`

  writeFileSync(output, html)
  console.log(`Created ${output} - open in browser to view and export`)
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.error(`
ggterm CLI - Terminal plotting tool

Commands:
  init                                        Install ggterm skills in current directory
  inspect <file>                              Show column types and statistics
  suggest <file>                              Suggest visualizations with commands
  history [search]                            List all plots (optionally filter by search)
  show <id>                                   Re-render a plot from history
  export [id] [output.html]                   Export plot to HTML (latest or by ID)
  <file> <x> <y> [color] [title] [geom] [facet]   Create a plot

Supported formats: CSV, JSON, JSONL (auto-detected by extension)

Geom types: ${GEOM_TYPES.join(', ')}

Reference lines (append to geom with +):
  hline@<y>              Horizontal line at y value
  vline@<x>              Vertical line at x value
  abline@<slope>,<int>   Line with slope and intercept

Examples:
  ggterm-plot init                             # Set up skills in current project
  ggterm-plot inspect data.csv
  ggterm-plot data.json x y                    # JSON array of objects
  ggterm-plot data.jsonl x y color             # JSON Lines format
  ggterm-plot data.csv x y color "Title" point
  ggterm-plot data.csv value - - - histogram
  ggterm-plot data.csv x y - - point+hline@50  # With reference line
  ggterm-plot data.csv x y - - line+vline@2.5+hline@100
  ggterm-plot data.csv x y - - point+abline@1,0  # y = x line
  ggterm-plot history
  ggterm-plot show 2024-01-26-001
  ggterm-plot export 2024-01-26-001 figure.html
`)
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  printUsage()
  process.exit(1)
}

const command = args[0]

if (command === 'init') {
  handleInit()
} else if (command === 'inspect') {
  if (args.length < 2) {
    console.error('Usage: ggterm-plot inspect <file>')
    process.exit(1)
  }
  handleInspect(args[1])
} else if (command === 'suggest') {
  if (args.length < 2) {
    console.error('Usage: ggterm-plot suggest <file>')
    process.exit(1)
  }
  handleSuggest(args[1])
} else if (command === 'history') {
  handleHistory(args[1]) // Optional search query
} else if (command === 'show') {
  if (args.length < 2) {
    console.error('Usage: ggterm-plot show <plot-id>')
    process.exit(1)
  }
  handleShow(args[1])
} else if (command === 'export') {
  handleExport(args[1], args[2])
} else if (command === 'help' || command === '--help' || command === '-h') {
  printUsage()
} else {
  // Assume it's a plot command (original behavior)
  handlePlot(args)
}
