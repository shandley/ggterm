#!/usr/bin/env bun
/**
 * Simple CLI for creating plots
 * Usage: bun cli-plot.ts <data.csv> <x> <y> [color] [title] [geom]
 */

import {
  gg,
  geom_point,
  geom_line,
  geom_path,
  geom_step,
  geom_bar,
  geom_histogram,
  geom_freqpoly,
  geom_boxplot,
  geom_violin,
  geom_area,
  geom_rug,
  geom_errorbar,
  geom_smooth,
  geom_segment,
  geom_rect,
  geom_tile,
  geom_text,
  geom_contour,
  geom_qq,
  geom_qq_line,
} from './index'
import { readFileSync } from 'fs'

const GEOM_TYPES = [
  'point', 'line', 'path', 'step', 'bar', 'histogram', 'freqpoly', 'boxplot',
  'violin', 'area', 'rug', 'errorbar', 'smooth', 'segment', 'rect',
  'tile', 'text', 'contour', 'qq'
]

const args = process.argv.slice(2)

if (args.length < 3) {
  console.error('Usage: bun cli-plot.ts <data.csv> <x> <y> [color] [title] [geom]')
  console.error(`  geom: ${GEOM_TYPES.join(', ')}`)
  console.error('  (default: point)')
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
  case 'area':
    plot = plot.geom(geom_area())
    break
  case 'rug':
    plot = plot.geom(geom_rug())
    break
  case 'errorbar':
    plot = plot.geom(geom_errorbar())
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
  case 'tile':
    plot = plot.geom(geom_tile())
    break
  case 'text':
    plot = plot.geom(geom_text())
    break
  case 'contour':
    plot = plot.geom(geom_contour())
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
// Histograms, bar charts, and freqpoly show counts by default
if ((geomType === 'histogram' || geomType === 'bar' || geomType === 'freqpoly') && !yLabel) {
  yLabel = 'count'
}
// Q-Q plots have specific labels
if (geomType === 'qq') {
  yLabel = 'Sample Quantiles'
}

// Determine x-axis label
let xLabel: string = x
// Q-Q plots have specific labels
if (geomType === 'qq') {
  xLabel = 'Theoretical Quantiles'
}

// Add labels
if (title && title !== '-') {
  plot = plot.labs({ title, x: xLabel, y: yLabel })
} else {
  plot = plot.labs({ x: xLabel, y: yLabel })
}

console.log(plot.render({ width: 70, height: 20, colorMode: 'truecolor' }))
