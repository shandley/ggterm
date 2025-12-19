#!/usr/bin/env npx tsx
/**
 * Interactive Terminal Demo
 *
 * A hands-on demo that responds to keypresses and shows ggterm in action.
 *
 * Run with: npx tsx examples/interactive-demo.ts
 *
 * Controls:
 *   Arrow keys: Navigate cursor
 *   Space: Select/deselect point
 *   +/-: Zoom in/out
 *   d: Add random data point
 *   c: Clear data
 *   f: Toggle faceting
 *   r: Reset view
 *   q: Quit
 */

import * as readline from 'readline'
import { gg } from '../packages/core/src/grammar'
import { geom_point, geom_line } from '../packages/core/src/geoms'
import { facet_wrap } from '../packages/core/src/facets'

// Terminal setup
const stdin = process.stdin
const stdout = process.stdout

// Enable raw mode for keypress detection
if (stdin.isTTY) {
  readline.emitKeypressEvents(stdin)
  stdin.setRawMode(true)
}

// State
interface AppState {
  data: { x: number; y: number; group: string }[]
  selectedIndices: Set<number>
  cursorX: number
  cursorY: number
  zoomLevel: number
  useFacets: boolean
  message: string
}

const state: AppState = {
  data: [
    { x: 1, y: 2, group: 'A' },
    { x: 2, y: 4, group: 'A' },
    { x: 3, y: 3, group: 'A' },
    { x: 4, y: 5, group: 'A' },
    { x: 5, y: 4, group: 'A' },
    { x: 1, y: 3, group: 'B' },
    { x: 2, y: 5, group: 'B' },
    { x: 3, y: 4, group: 'B' },
    { x: 4, y: 6, group: 'B' },
    { x: 5, y: 5, group: 'B' },
  ],
  selectedIndices: new Set(),
  cursorX: 30,
  cursorY: 10,
  zoomLevel: 1,
  useFacets: false,
  message: 'Use arrow keys to move, space to select, d to add data, q to quit',
}

// Clear screen and move cursor to top
function clearScreen() {
  stdout.write('\x1b[2J\x1b[H')
}

// Render the current state
function render() {
  clearScreen()

  // Build plot
  let plot = gg(state.data)
    .aes({ x: 'x', y: 'y', color: 'group' })
    .geom(geom_point())
    .geom(geom_line())
    .labs({
      title: state.useFacets ? 'Interactive Demo (Faceted)' : 'Interactive Demo',
      x: 'X Value',
      y: 'Y Value',
    })

  if (state.useFacets) {
    plot = plot.facet(facet_wrap('group', { ncol: 2 }))
  }

  const width = 70
  const height = state.useFacets ? 22 : 20

  const rendered = plot.render({ width, height })

  // Print the plot
  console.log(rendered)
  console.log('')

  // Print status bar
  const statusLine = [
    `Data: ${state.data.length} points`,
    `Selected: ${state.selectedIndices.size}`,
    `Zoom: ${state.zoomLevel.toFixed(1)}x`,
    state.useFacets ? 'Faceted' : 'Single',
  ].join(' | ')

  console.log('\x1b[36m' + '─'.repeat(width) + '\x1b[0m')
  console.log('\x1b[33m' + statusLine + '\x1b[0m')
  console.log('')
  console.log('\x1b[90m' + state.message + '\x1b[0m')
  console.log('')
  console.log('\x1b[90mControls: ←↑→↓ move | space select | +/- zoom | d add | c clear | f facet | r reset | q quit\x1b[0m')
}

// Add a random data point
function addRandomPoint() {
  const groups = ['A', 'B']
  const newPoint = {
    x: Math.round((Math.random() * 8 + 1) * 10) / 10,
    y: Math.round((Math.random() * 8 + 1) * 10) / 10,
    group: groups[Math.floor(Math.random() * groups.length)],
  }
  state.data.push(newPoint)
  state.message = `Added point: (${newPoint.x}, ${newPoint.y}) group ${newPoint.group}`
}

// Find point near cursor (simplified)
function findNearestPoint(): number | null {
  // This is a simplified version - in real implementation
  // we'd use the actual plot coordinates
  const plotWidth = 50
  const plotHeight = 12
  const plotX = 10
  const plotY = 3

  // Normalize cursor to data coordinates
  const relX = (state.cursorX - plotX) / plotWidth
  const relY = 1 - (state.cursorY - plotY) / plotHeight

  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null

  // Find data bounds
  const xVals = state.data.map(d => d.x)
  const yVals = state.data.map(d => d.y)
  const xMin = Math.min(...xVals)
  const xMax = Math.max(...xVals)
  const yMin = Math.min(...yVals)
  const yMax = Math.max(...yVals)

  const dataX = xMin + relX * (xMax - xMin)
  const dataY = yMin + relY * (yMax - yMin)

  // Find closest point
  let closest = -1
  let minDist = Infinity

  state.data.forEach((point, i) => {
    const dx = (point.x - dataX) / (xMax - xMin || 1)
    const dy = (point.y - dataY) / (yMax - yMin || 1)
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist && dist < 0.15) {
      minDist = dist
      closest = i
    }
  })

  return closest >= 0 ? closest : null
}

// Toggle selection
function toggleSelection() {
  const nearest = findNearestPoint()
  if (nearest !== null) {
    if (state.selectedIndices.has(nearest)) {
      state.selectedIndices.delete(nearest)
      state.message = `Deselected point ${nearest}`
    } else {
      state.selectedIndices.add(nearest)
      const point = state.data[nearest]
      state.message = `Selected point ${nearest}: (${point.x}, ${point.y}) group ${point.group}`
    }
  } else {
    state.message = 'No point nearby to select'
  }
}

// Handle keypress
function handleKeypress(key: string, ctrl: boolean) {
  if (ctrl && key === 'c') {
    cleanup()
    process.exit(0)
  }

  switch (key) {
    case 'q':
      cleanup()
      process.exit(0)
      break
    case 'left':
      state.cursorX = Math.max(0, state.cursorX - 2)
      state.message = `Cursor: (${state.cursorX}, ${state.cursorY})`
      break
    case 'right':
      state.cursorX = Math.min(70, state.cursorX + 2)
      state.message = `Cursor: (${state.cursorX}, ${state.cursorY})`
      break
    case 'up':
      state.cursorY = Math.max(0, state.cursorY - 1)
      state.message = `Cursor: (${state.cursorX}, ${state.cursorY})`
      break
    case 'down':
      state.cursorY = Math.min(20, state.cursorY + 1)
      state.message = `Cursor: (${state.cursorX}, ${state.cursorY})`
      break
    case 'space':
      toggleSelection()
      break
    case '+':
    case '=':
      state.zoomLevel = Math.min(5, state.zoomLevel * 1.2)
      state.message = `Zoom: ${state.zoomLevel.toFixed(1)}x`
      break
    case '-':
      state.zoomLevel = Math.max(0.2, state.zoomLevel / 1.2)
      state.message = `Zoom: ${state.zoomLevel.toFixed(1)}x`
      break
    case 'd':
      addRandomPoint()
      break
    case 'c':
      state.data = []
      state.selectedIndices.clear()
      state.message = 'Cleared all data'
      break
    case 'f':
      state.useFacets = !state.useFacets
      state.message = state.useFacets ? 'Faceting enabled' : 'Faceting disabled'
      break
    case 'r':
      state.zoomLevel = 1
      state.cursorX = 30
      state.cursorY = 10
      state.selectedIndices.clear()
      state.message = 'View reset'
      break
  }

  render()
}

// Cleanup on exit
function cleanup() {
  if (stdin.isTTY) {
    stdin.setRawMode(false)
  }
  clearScreen()
  console.log('Thanks for trying the interactive demo!')
  console.log('')
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})

// Main
console.log('Starting interactive demo...')

if (!stdin.isTTY) {
  console.log('')
  console.log('Note: Running without TTY. Keypresses won\'t work.')
  console.log('For full interactivity, run in a terminal.')
  console.log('')

  // Just render once and exit
  render()
  process.exit(0)
}

// Listen for keypresses
stdin.on('keypress', (str, key) => {
  if (key) {
    handleKeypress(key.name || str, key.ctrl || false)
  }
})

// Initial render
render()
