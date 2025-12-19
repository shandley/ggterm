#!/usr/bin/env npx tsx
/**
 * Streaming Data Demo
 *
 * Shows real-time data streaming with ggterm.
 * Data is continuously added and the plot updates in place.
 *
 * Run with: npx tsx examples/streaming-demo.ts
 *
 * Press Ctrl+C to stop.
 */

import { gg } from '../packages/core/src/grammar'
import { geom_line, geom_point } from '../packages/core/src/geoms'

// Configuration
const MAX_POINTS = 50
const UPDATE_INTERVAL_MS = 200
const WIDTH = 70
const HEIGHT = 18

// State
interface DataPoint {
  time: number
  value: number
  signal: number
}

const data: DataPoint[] = []
let time = 0

// Generate initial data
for (let i = 0; i < 20; i++) {
  addDataPoint()
}

function addDataPoint() {
  // Generate sinusoidal data with noise
  const signal = Math.sin(time * 0.3) * 30 + 50
  const noise = (Math.random() - 0.5) * 20
  const value = signal + noise

  data.push({
    time,
    value,
    signal,
  })

  // Keep only last MAX_POINTS
  if (data.length > MAX_POINTS) {
    data.shift()
  }

  time++
}

function clearScreen() {
  // Move cursor to top-left and clear
  process.stdout.write('\x1b[H\x1b[J')
}

function render() {
  clearScreen()

  // Calculate stats
  const values = data.map(d => d.value)
  const min = Math.min(...values).toFixed(1)
  const max = Math.max(...values).toFixed(1)
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  const latest = values[values.length - 1].toFixed(1)

  // Build plot
  const plot = gg(data)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .geom(geom_point())
    .labs({
      title: 'Live Streaming Data',
      x: 'Time',
      y: 'Value',
    })

  const rendered = plot.render({ width: WIDTH, height: HEIGHT })

  // Print
  console.log(rendered)
  console.log('')
  console.log('\x1b[36m' + '─'.repeat(WIDTH) + '\x1b[0m')
  console.log('')
  console.log(`\x1b[33mPoints: ${data.length}/${MAX_POINTS} | Latest: ${latest} | Min: ${min} | Max: ${max} | Avg: ${avg}\x1b[0m`)
  console.log('')
  console.log('\x1b[90mStreaming at ' + (1000 / UPDATE_INTERVAL_MS).toFixed(0) + ' updates/sec | Press Ctrl+C to stop\x1b[0m')
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  clearScreen()
  console.log('')
  console.log('Streaming stopped.')
  console.log(`Final stats: ${data.length} points displayed`)
  console.log('')
  process.exit(0)
})

// Main loop
console.log('Starting streaming demo...')

function update() {
  addDataPoint()
  render()
}

// Initial render
render()

// Start updates
setInterval(update, UPDATE_INTERVAL_MS)
