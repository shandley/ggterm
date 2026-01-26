#!/usr/bin/env bun
/**
 * ggterm Demo Script
 *
 * Run: bun run examples/demo.ts
 *
 * Demonstrates ggterm with the sample datasets.
 */

import { readFileSync } from 'fs'
import {
  gg,
  geom_point,
  geom_line,
  geom_boxplot,
  geom_histogram,
  geom_bar,
  scale_color_viridis,
  scale_color_brewer,
  facet_wrap,
  themeDark,
  themeMinimal
} from '../packages/core/src'

// Simple CSV loader
function loadCSV(path: string) {
  const text = readFileSync(path, 'utf-8')
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const row: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      const val = values[i]
      // Auto-convert numbers
      const num = Number(val)
      row[h] = isNaN(num) ? val : num
    })
    return row
  })
}

// Load datasets
console.log('Loading datasets...\n')
const iris = loadCSV('examples/data/iris.csv')
const stocks = loadCSV('examples/data/stocks.csv')
const weather = loadCSV('examples/data/weather.csv')
const experiment = loadCSV('examples/data/experiment.csv')
const sensors = loadCSV('examples/data/sensors.csv')

console.log(`Loaded: iris (${iris.length}), stocks (${stocks.length}), weather (${weather.length}), experiment (${experiment.length}), sensors (${sensors.length})\n`)

// ============================================
// Demo 1: Iris - Classic Scatter Plot
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 1: Iris Scatter Plot')
console.log('=' .repeat(70))

const irisPlot = gg(iris)
  .aes({ x: 'sepal_length', y: 'petal_length', color: 'species' })
  .geom(geom_point({ size: 1 }))
  .scale(scale_color_viridis())
  .labs({
    title: 'Iris: Sepal vs Petal Length',
    x: 'Sepal Length (cm)',
    y: 'Petal Length (cm)'
  })

console.log(irisPlot.render({ width: 70, height: 20 }))
console.log()

// ============================================
// Demo 2: Stocks - Time Series
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 2: Stock Prices Time Series')
console.log('=' .repeat(70))

// Convert dates for stocks
const stocksTyped = stocks.map(row => ({
  ...row,
  date: new Date(row.date as string).getTime()
}))

const stockPlot = gg(stocksTyped)
  .aes({ x: 'date', y: 'price', color: 'symbol' })
  .geom(geom_line())
  .scale(scale_color_brewer({ palette: 'Set1' }))
  .labs({
    title: 'Stock Prices - January 2024',
    x: 'Date',
    y: 'Price ($)'
  })

console.log(stockPlot.render({ width: 70, height: 18 }))
console.log()

// ============================================
// Demo 3: Experiment - Box Plot
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 3: Experiment Results Box Plot')
console.log('=' .repeat(70))

const expPlot = gg(experiment)
  .aes({ x: 'treatment', y: 'response_time' })
  .geom(geom_boxplot())
  .labs({
    title: 'Response Time by Treatment',
    x: 'Treatment Group',
    y: 'Response Time (ms)'
  })

console.log(expPlot.render({ width: 60, height: 18 }))
console.log()

// ============================================
// Demo 4: Weather - Faceted Plot
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 4: Weather by City (Faceted)')
console.log('=' .repeat(70))

const weatherPlot = gg(weather)
  .aes({ x: 'temp_low', y: 'temp_high', color: 'city' })
  .geom(geom_point({ size: 2 }))
  .scale(scale_color_brewer({ palette: 'Dark2' }))
  .labs({
    title: 'Temperature Range by City',
    x: 'Low Temp (F)',
    y: 'High Temp (F)'
  })

console.log(weatherPlot.render({ width: 70, height: 18 }))
console.log()

// ============================================
// Demo 5: Sensors - Status Monitoring
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 5: Sensor Temperature with Status')
console.log('=' .repeat(70))

// Filter to one sensor for clarity
const sensor03 = sensors.filter(s => s.sensor_id === 'sensor_03')

const sensorPlot = gg(sensor03)
  .aes({ x: 'humidity', y: 'temperature', color: 'status' })
  .geom(geom_point({ size: 2 }))
  .labs({
    title: 'Sensor 03: Temperature vs Humidity',
    x: 'Humidity (%)',
    y: 'Temperature (C)'
  })

console.log(sensorPlot.render({ width: 65, height: 16 }))
console.log()

// ============================================
// Demo 6: Histogram
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 6: Distribution of Sepal Width')
console.log('=' .repeat(70))

const histPlot = gg(iris)
  .aes({ x: 'sepal_width' })
  .geom(geom_histogram({ bins: 12 }))
  .labs({
    title: 'Distribution of Sepal Width',
    x: 'Sepal Width (cm)',
    y: 'Count'
  })

console.log(histPlot.render({ width: 65, height: 16 }))
console.log()

// ============================================
// Demo 7: Dark Theme
// ============================================
console.log('=' .repeat(70))
console.log('DEMO 7: Dark Theme')
console.log('=' .repeat(70))

const darkPlot = gg(iris)
  .aes({ x: 'petal_width', y: 'petal_length', color: 'species' })
  .geom(geom_point())
  .theme(themeDark())
  .labs({ title: 'Iris Petals (Dark Theme)' })

console.log(darkPlot.render({ width: 65, height: 16 }))
console.log()

console.log('=' .repeat(70))
console.log('Demo complete! Try modifying examples/demo.ts to experiment.')
console.log('=' .repeat(70))
