#!/usr/bin/env npx tsx
/**
 * Dashboard Demo
 *
 * Shows multiple plots updating together - simulating a real dashboard.
 *
 * Run with: npx tsx examples/dashboard-demo.ts
 *
 * Press Ctrl+C to stop.
 */

import { gg } from '../packages/core/src/grammar'
import { geom_line, geom_point, geom_bar } from '../packages/core/src/geoms'

// Configuration
const UPDATE_INTERVAL_MS = 500
const MAX_POINTS = 30

// State
interface TimeSeriesPoint {
  time: number
  cpu: number
  memory: number
  network: number
}

interface CategoryData {
  category: string
  value: number
}

const timeSeries: TimeSeriesPoint[] = []
let time = 0

// Initialize time series
for (let i = 0; i < 15; i++) {
  addTimeSeriesPoint()
}

function addTimeSeriesPoint() {
  // Simulate system metrics
  const cpu = 30 + Math.sin(time * 0.2) * 20 + Math.random() * 15
  const memory = 50 + Math.sin(time * 0.1) * 10 + Math.random() * 5
  const network = Math.abs(Math.sin(time * 0.3) * 100 + (Math.random() - 0.5) * 50)

  timeSeries.push({
    time,
    cpu: Math.max(0, Math.min(100, cpu)),
    memory: Math.max(0, Math.min(100, memory)),
    network: Math.max(0, network),
  })

  if (timeSeries.length > MAX_POINTS) {
    timeSeries.shift()
  }

  time++
}

function getCategoryData(): CategoryData[] {
  // Random category values that change slightly each update
  const base = [
    { category: 'API', value: 45 },
    { category: 'Web', value: 32 },
    { category: 'DB', value: 28 },
    { category: 'Cache', value: 15 },
  ]

  return base.map(item => ({
    category: item.category,
    value: Math.max(5, item.value + (Math.random() - 0.5) * 20),
  }))
}

function clearScreen() {
  process.stdout.write('\x1b[H\x1b[J')
}

function render() {
  clearScreen()

  const width = 75

  // Header
  console.log('\x1b[1;36m' + '═'.repeat(width) + '\x1b[0m')
  console.log('\x1b[1;36m' + '                        SYSTEM DASHBOARD' + '\x1b[0m')
  console.log('\x1b[1;36m' + '═'.repeat(width) + '\x1b[0m')
  console.log('')

  // CPU Usage Plot
  const cpuData = timeSeries.map(d => ({ time: d.time, value: d.cpu }))
  const cpuPlot = gg(cpuData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .labs({ title: 'CPU Usage (%)', x: '', y: '' })

  console.log(cpuPlot.render({ width: width, height: 10 }))

  // Memory Usage Plot
  const memData = timeSeries.map(d => ({ time: d.time, value: d.memory }))
  const memPlot = gg(memData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .geom(geom_point())
    .labs({ title: 'Memory Usage (%)', x: '', y: '' })

  console.log(memPlot.render({ width: width, height: 10 }))

  // Request Distribution (Bar chart)
  const categoryData = getCategoryData()
  const barPlot = gg(categoryData)
    .aes({ x: 'category', y: 'value' })
    .geom(geom_bar())
    .labs({ title: 'Request Distribution', x: '', y: '' })

  console.log(barPlot.render({ width: width, height: 10 }))

  // Stats footer
  const latest = timeSeries[timeSeries.length - 1]
  console.log('\x1b[36m' + '─'.repeat(width) + '\x1b[0m')
  console.log('')
  console.log(`\x1b[33mCPU: ${latest.cpu.toFixed(1)}% | Memory: ${latest.memory.toFixed(1)}% | Network: ${latest.network.toFixed(0)} req/s\x1b[0m`)
  console.log('')
  console.log(`\x1b[90mUpdating every ${UPDATE_INTERVAL_MS}ms | Time: ${time} | Press Ctrl+C to stop\x1b[0m`)
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  clearScreen()
  console.log('')
  console.log('Dashboard stopped.')
  console.log('')
  process.exit(0)
})

// Main loop
console.log('Starting dashboard demo...')

function update() {
  addTimeSeriesPoint()
  render()
}

// Initial render
render()

// Start updates
setInterval(update, UPDATE_INTERVAL_MS)
