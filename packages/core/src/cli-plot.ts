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
const data = lines.slice(1).map(line => {
  const values = line.split(',')
  const row: Record<string, any> = {}
  headers.forEach((h, i) => {
    const num = Number(values[i])
    row[h] = isNaN(num) ? values[i] : num
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

// Add title if provided
if (title && title !== '-') {
  plot = plot.labs({ title, x, y: y !== '-' ? y : undefined })
} else {
  plot = plot.labs({ x, y: y !== '-' ? y : undefined })
}

console.log(plot.render({ width: 70, height: 20, colorMode: 'truecolor' }))
