#!/usr/bin/env bun
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
  geom_boxplot,
  geom_violin,
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
  geom_text,
  geom_label,
  geom_contour,
  geom_contour_filled,
  geom_density_2d,
  geom_qq,
  geom_qq_line,
  facet_wrap,
} from './index'
import { readFileSync, writeFileSync } from 'fs'
import {
  savePlotToHistory,
  loadPlotFromHistory,
  getHistory,
  searchHistory,
  getLatestPlotId,
} from './history'

const GEOM_TYPES = [
  'point', 'line', 'path', 'step', 'bar', 'col', 'histogram', 'freqpoly',
  'boxplot', 'violin', 'area', 'ribbon', 'rug', 'errorbar', 'errorbarh',
  'crossbar', 'linerange', 'pointrange', 'smooth', 'segment', 'rect',
  'raster', 'tile', 'text', 'label', 'contour', 'contour_filled',
  'density_2d', 'qq'
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
 * Load and parse CSV file
 */
function loadCSV(dataFile: string): { headers: string[]; data: Record<string, any>[] } {
  const text = readFileSync(dataFile, 'utf-8')
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())

  const data = lines.slice(1).map(line => {
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
  const { headers, data } = loadCSV(dataFile)
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
  const { headers, data } = loadCSV(dataFile)
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
 * Handle plot command (original behavior)
 */
function handlePlot(args: string[]): void {
  if (args.length < 3) {
    printUsage()
    process.exit(1)
  }

  const [dataFile, x, y, color, title, geomType = 'point', facetVar] = args
  const { data } = loadCSV(dataFile)

  // Build plot
  // Note: y may be absent for histograms (stat computes it)
  const aes: Record<string, string> = { x }
  if (y && y !== '-') aes.y = y
  if (color && color !== '-') aes.color = color

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
    case 'boxplot':
      plot = plot.geom(geom_boxplot())
      break
    case 'violin':
      plot = plot.geom(geom_violin())
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
    case 'point':
    default:
      plot = plot.geom(geom_point())
  }

  // Determine y-axis label
  let yLabel: string | undefined = y !== '-' ? y : undefined
  if ((geomType === 'histogram' || geomType === 'bar' || geomType === 'freqpoly') && !yLabel) {
    yLabel = 'count'
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
  inspect <file>                              Show column types and statistics
  suggest <file>                              Suggest visualizations with commands
  history [search]                            List all plots (optionally filter by search)
  show <id>                                   Re-render a plot from history
  export [id] [output.html]                   Export plot to HTML (latest or by ID)
  <file> <x> <y> [color] [title] [geom] [facet]   Create a plot

Geom types: ${GEOM_TYPES.join(', ')}

Examples:
  bun cli-plot.ts inspect data.csv
  bun cli-plot.ts suggest data.csv
  bun cli-plot.ts data.csv x y color "Title" point
  bun cli-plot.ts data.csv value - - - histogram
  bun cli-plot.ts data.csv x y color "Faceted" point category
  bun cli-plot.ts history
  bun cli-plot.ts history scatter
  bun cli-plot.ts show 2024-01-26-001
  bun cli-plot.ts export 2024-01-26-001 figure.html
`)
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  printUsage()
  process.exit(1)
}

const command = args[0]

if (command === 'inspect') {
  if (args.length < 2) {
    console.error('Usage: bun cli-plot.ts inspect <file>')
    process.exit(1)
  }
  handleInspect(args[1])
} else if (command === 'suggest') {
  if (args.length < 2) {
    console.error('Usage: bun cli-plot.ts suggest <file>')
    process.exit(1)
  }
  handleSuggest(args[1])
} else if (command === 'history') {
  handleHistory(args[1]) // Optional search query
} else if (command === 'show') {
  if (args.length < 2) {
    console.error('Usage: bun cli-plot.ts show <plot-id>')
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
