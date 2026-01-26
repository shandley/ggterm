#!/usr/bin/env bun
/**
 * Simple CLI for creating plots
 * Usage: bun cli-plot.ts <data.csv> <x> <y> [color] [title]
 */

import { gg, geom_point, geom_line, geom_histogram, geom_boxplot, geom_bar } from './index'
import { readFileSync } from 'fs'

const args = process.argv.slice(2)

if (args.length < 3) {
  console.error('Usage: bun cli-plot.ts <data.csv> <x> <y> [color] [title] [geom]')
  console.error('  geom: point (default), line, histogram, boxplot, bar')
  process.exit(1)
}

const [dataFile, x, y, color, title, geomType = 'point'] = args

// Load CSV
const text = readFileSync(dataFile, 'utf-8')
const lines = text.trim().split('\n')
const headers = lines[0].split(',')

// Date pattern: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
const datePattern = /^\d{4}-\d{2}-\d{2}/

const data = lines.slice(1).map(line => {
  const values = line.split(',')
  const row: Record<string, any> = {}
  headers.forEach((h, i) => {
    const val = values[i]
    // Check for date format first
    if (datePattern.test(val)) {
      row[h] = new Date(val).getTime()
    } else {
      const num = Number(val)
      row[h] = isNaN(num) ? val : num
    }
  })
  return row
})

// Build plot
const aes: Record<string, string> = { x }
if (y && y !== '-') aes.y = y
if (color && color !== '-') aes.color = color

let plot = gg(data).aes(aes)

// Add geom
switch (geomType) {
  case 'line':
    plot = plot.geom(geom_line())
    break
  case 'histogram':
    plot = plot.geom(geom_histogram({ bins: 20 }))
    break
  case 'boxplot':
    plot = plot.geom(geom_boxplot())
    break
  case 'bar':
    plot = plot.geom(geom_bar())
    break
  default:
    plot = plot.geom(geom_point())
}

// Determine y-axis label
let yLabel: string | undefined = y !== '-' ? y : undefined
// Histograms and bar charts show counts by default
if ((geomType === 'histogram' || geomType === 'bar') && !yLabel) {
  yLabel = 'count'
}

// Add labels
if (title && title !== '-') {
  plot = plot.labs({ title, x, y: yLabel })
} else {
  plot = plot.labs({ x, y: yLabel })
}

console.log(plot.render({ width: 70, height: 20, colorMode: 'truecolor' }))
