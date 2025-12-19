#!/usr/bin/env npx tsx
/**
 * Streaming Performance Demo
 *
 * Demonstrates Phase 6 streaming and performance features:
 * - High-speed data streaming with .push() API
 * - Time-windowed rendering
 * - Rolling aggregations (mean, EMA)
 * - Level-of-detail for large datasets
 * - LTTB sampling for time series
 * - Performance statistics
 *
 * Run with: npx tsx examples/streaming-performance-demo.ts
 *
 * Press Ctrl+C to stop.
 */

import {
  createStreamingPlot,
  createLOD,
  lttbSample,
  systematicSample,
  RollingAggregator,
  ExponentialMovingAverage,
  geom_line,
  geom_point,
} from '../packages/core/src'

// Configuration
const UPDATE_INTERVAL_MS = 50 // 20 updates per second
const POINTS_PER_UPDATE = 10 // 10 points per update = 200 points/sec
const DISPLAY_WINDOW_MS = 10000 // Show last 10 seconds
const MAX_DISPLAY_POINTS = 200 // Max points to render

// State
let time = 0
let totalPointsPushed = 0
let lastRenderMs = 0
const startTime = Date.now()

// Create streaming plot
const plot = createStreamingPlot<{ time: number; value: number; signal: number }>({
  maxPoints: 2000,
  timeWindow: DISPLAY_WINDOW_MS,
  timeField: 'time',
  throttleMs: UPDATE_INTERVAL_MS,
  aes: { x: 'time', y: 'value' },
  geoms: [geom_line()],
  labels: { title: 'Streaming Performance Demo' },
})

// Rolling aggregators
const rollingMean = new RollingAggregator<{ time: number; value: number }>({
  windowSize: 20,
  field: 'value',
  type: 'mean',
})

const ema = new ExponentialMovingAverage(10)

// Level of detail manager
const lod = createLOD({
  xField: 'time',
  yField: 'value',
  targetRenderMs: 16, // 60fps target
})

// Generate synthetic data
function generatePoint(): { time: number; value: number; signal: number } {
  const signal = Math.sin(time * 0.1) * 30 + 50
  const noise = (Math.random() - 0.5) * 20
  const value = signal + noise
  const timestamp = Date.now() // Use actual timestamp for time-windowed display

  time++
  return { time: timestamp, value, signal }
}

function clearScreen() {
  process.stdout.write('\x1b[H\x1b[J')
}

function render() {
  clearScreen()

  const width = 75
  const now = Date.now()
  const elapsedSec = (now - startTime) / 1000

  // Get data and apply LOD
  let data = plot.getData()
  const originalCount = data.length

  // Apply LTTB sampling for time series
  if (data.length > MAX_DISPLAY_POINTS) {
    data = lttbSample(data, MAX_DISPLAY_POINTS, 'time', 'value')
  }

  // Render
  const renderStart = performance.now()
  const output = plot.render({ width, height: 15 })
  lastRenderMs = performance.now() - renderStart

  // Update LOD with render time
  lod.updateRenderTime(lastRenderMs)

  // Header
  console.log('\x1b[1;36m' + '═'.repeat(width) + '\x1b[0m')
  console.log('\x1b[1;36m' + '                 STREAMING PERFORMANCE DEMO' + '\x1b[0m')
  console.log('\x1b[1;36m' + '═'.repeat(width) + '\x1b[0m')
  console.log('')

  // Plot
  console.log(output)

  // Statistics
  console.log('')
  console.log('\x1b[36m' + '─'.repeat(width) + '\x1b[0m')
  console.log('')

  const state = plot.getState()
  const bufferStats = plot.getBufferStats()
  const lodStats = lod.getStats()

  // Performance stats
  console.log('\x1b[33mPerformance:\x1b[0m')
  console.log(
    `  Points/sec: ${state.pointsPerSecond.toFixed(0).padStart(5)} | ` +
      `Total: ${totalPointsPushed.toLocaleString().padStart(8)} | ` +
      `Elapsed: ${elapsedSec.toFixed(1)}s`
  )
  console.log(
    `  Render: ${lastRenderMs.toFixed(1).padStart(5)}ms | ` +
      `Target: ${lodStats.targetRenderMs}ms | ` +
      `FPS: ${(1000 / Math.max(1, lastRenderMs)).toFixed(0)}`
  )
  console.log('')

  // Buffer stats
  console.log('\x1b[33mBuffer:\x1b[0m')
  console.log(
    `  Size: ${bufferStats.size.toLocaleString().padStart(6)} / ${bufferStats.capacity.toLocaleString()} | ` +
      `Utilization: ${(bufferStats.utilization * 100).toFixed(1)}%`
  )
  console.log(
    `  Window: ${state.displayedPoints.toLocaleString().padStart(5)} points | ` +
      `After LOD: ${data.length} points`
  )
  console.log('')

  // Rolling stats
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0
  const meanValue = rollingMean.push(latestValue)
  const emaValue = ema.push(latestValue)

  console.log('\x1b[33mRolling Aggregations:\x1b[0m')
  console.log(
    `  Latest: ${latestValue.toFixed(2).padStart(7)} | ` +
      `Mean(20): ${(meanValue ?? 0).toFixed(2).padStart(7)} | ` +
      `EMA(10): ${(emaValue ?? 0).toFixed(2).padStart(7)}`
  )
  console.log('')

  // LOD stats
  console.log('\x1b[33mLevel of Detail:\x1b[0m')
  console.log(
    `  Level: ${lodStats.currentLevel.padEnd(10)} | ` +
      `Max: ${lodStats.maxPoints.toLocaleString().padStart(5)} | ` +
      `Adaptive: ${lodStats.adaptiveMaxPoints.toLocaleString().padStart(5)}`
  )
  console.log('')

  console.log('\x1b[90mGenerating ' + POINTS_PER_UPDATE + ' points every ' + UPDATE_INTERVAL_MS + 'ms | Press Ctrl+C to stop\x1b[0m')
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  clearScreen()
  console.log('')
  console.log('\x1b[1;33mStreaming Performance Demo - Final Statistics\x1b[0m')
  console.log('')

  const elapsedSec = (Date.now() - startTime) / 1000

  console.log(`Total points pushed: ${totalPointsPushed.toLocaleString()}`)
  console.log(`Duration: ${elapsedSec.toFixed(1)} seconds`)
  console.log(`Average rate: ${(totalPointsPushed / elapsedSec).toFixed(1)} points/sec`)
  console.log(`Last render time: ${lastRenderMs.toFixed(2)}ms`)
  console.log('')
  process.exit(0)
})

// Main loop
console.log('Starting streaming performance demo...')
console.log('')

function update() {
  // Generate and push multiple points per update
  for (let i = 0; i < POINTS_PER_UPDATE; i++) {
    const point = generatePoint()
    plot.push(point)
    totalPointsPushed++
  }

  render()
}

// Initial render
render()

// Start updates
setInterval(update, UPDATE_INTERVAL_MS)
