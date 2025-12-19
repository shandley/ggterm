#!/usr/bin/env npx tsx
/**
 * Advanced Renderer Demo
 *
 * Demonstrates the terminal capability detection and renderer selection system.
 * Shows how ggterm automatically adapts to your terminal's capabilities.
 *
 * Run with: npx tsx examples/renderer-demo.ts
 */

import {
  getTerminalInfo,
  getCapabilities,
  autoRenderer,
  RendererChain,
  createRendererChain,
  rgbToAnsi256,
  rgbToAnsi16,
  ANSI_16_COLORS,
  getPalette256,
  fgEscape,
  RESET,
} from '../packages/core/src'

import { createBlockRenderer, BLOCKS } from '../packages/render-block/src'

console.log('═'.repeat(70))
console.log('          Advanced Rendering Demo - Terminal Capabilities')
console.log('═'.repeat(70))
console.log('')

// ============================================================
// Terminal Information
// ============================================================

console.log('=== Terminal Information ===\n')

const info = getTerminalInfo()
console.log(`Terminal:    ${info.terminal}`)
console.log(`Size:        ${info.size.width}x${info.size.height} characters`)
console.log(`Graphics:    ${info.graphics}`)
console.log(`Color Mode:  ${info.colorMode}`)
console.log(`Renderer:    ${info.renderer}`)
console.log(`Unicode:     ${info.unicode ? 'yes' : 'no'}`)
console.log(`TTY:         ${info.isTTY ? 'yes' : 'no'}`)
console.log(`CI:          ${info.isCI ? 'yes' : 'no'}`)
console.log('')

// ============================================================
// Auto Renderer Selection
// ============================================================

console.log('=== Auto Renderer Selection ===\n')

const auto = autoRenderer()
console.log(`Selected renderer: ${auto.type}`)
console.log(`Selected color mode: ${auto.colorMode}`)
console.log('')

// Show the renderer chain
const chain = createRendererChain()
console.log(`Renderer chain description:`)
console.log(`  ${chain.describe()}`)
console.log('')

// ============================================================
// Color Capabilities
// ============================================================

console.log('=== Color Capabilities ===\n')

// Show ANSI 16 colors
console.log('ANSI 16 Colors:')
let row1 = '  '
let row2 = '  '
for (let i = 0; i < 8; i++) {
  const c = ANSI_16_COLORS[i]
  row1 += fgEscape(c, 'truecolor') + '██' + RESET + ' '
}
for (let i = 8; i < 16; i++) {
  const c = ANSI_16_COLORS[i]
  row2 += fgEscape(c, 'truecolor') + '██' + RESET + ' '
}
console.log(row1)
console.log(row2)
console.log('')

// Show 256 color cube (simplified)
console.log('256 Color Cube (6x6x6):')
const palette256 = getPalette256()
for (let g = 0; g < 6; g++) {
  let line = '  '
  for (let r = 0; r < 6; r++) {
    for (let b = 0; b < 6; b++) {
      const idx = 16 + r * 36 + g * 6 + b
      const c = palette256[idx]
      line += fgEscape(c, 'truecolor') + '▀' + RESET
    }
    line += ' '
  }
  console.log(line)
}
console.log('')

// Show grayscale ramp
console.log('Grayscale Ramp:')
let gray = '  '
for (let i = 232; i < 256; i++) {
  const c = palette256[i]
  gray += fgEscape(c, 'truecolor') + '█' + RESET
}
console.log(gray)
console.log('')

// ============================================================
// Color Conversion
// ============================================================

console.log('=== Color Conversion ===\n')

const testColors = [
  { r: 255, g: 0, b: 0, a: 255 },
  { r: 0, g: 255, b: 0, a: 255 },
  { r: 0, g: 0, b: 255, a: 255 },
  { r: 255, g: 255, b: 0, a: 255 },
  { r: 255, g: 128, b: 64, a: 255 },
  { r: 128, g: 128, b: 128, a: 255 },
]

console.log('RGB → ANSI 256 → ANSI 16 conversion:')
for (const c of testColors) {
  const a256 = rgbToAnsi256(c)
  const a16 = rgbToAnsi16(c)
  const original = fgEscape(c, 'truecolor') + '██' + RESET
  const conv256 = fgEscape(palette256[a256], 'truecolor') + '██' + RESET
  const conv16 = fgEscape(ANSI_16_COLORS[a16], 'truecolor') + '██' + RESET

  console.log(
    `  RGB(${c.r.toString().padStart(3)},${c.g.toString().padStart(3)},${c.b.toString().padStart(3)}) ` +
      `${original} → 256[${a256.toString().padStart(3)}] ${conv256} → 16[${a16.toString().padStart(2)}] ${conv16}`
  )
}
console.log('')

// ============================================================
// Block Renderer Demo
// ============================================================

console.log('=== Half-Block Subpixel Rendering ===\n')

console.log('Block characters available:')
console.log(`  Full:  ${BLOCKS.full}  Upper: ${BLOCKS.upper}  Lower: ${BLOCKS.lower}`)
console.log(`  Light: ${BLOCKS.light}  Medium: ${BLOCKS.medium}  Heavy: ${BLOCKS.heavy}`)
console.log('')

// Create a small block renderer demo
const renderer = createBlockRenderer(40, 10)

// Draw a simple pattern
const red = { r: 255, g: 100, b: 100, a: 255 }
const green = { r: 100, g: 255, b: 100, a: 255 }
const blue = { r: 100, g: 100, b: 255, a: 255 }
const yellow = { r: 255, g: 255, b: 100, a: 255 }

// Draw a sine wave
for (let x = 0; x < renderer.pixelWidth; x++) {
  const y = Math.floor(renderer.pixelHeight / 2 + Math.sin(x * 0.3) * (renderer.pixelHeight / 3))
  renderer.drawFilledCircle(x, y, 2, red)
}

// Draw some shapes
renderer.drawFilledRect(2, 2, 6, 4, green)
renderer.drawFilledRect(10, 14, 6, 4, blue)
renderer.drawFilledCircle(30, 10, 4, yellow)

// Draw a diagonal line
renderer.drawLine(0, 0, renderer.pixelWidth - 1, renderer.pixelHeight - 1, { r: 255, g: 255, b: 255, a: 255 })

console.log('Half-block subpixel rendering (2x vertical resolution):')
console.log('')
const rendered = renderer.render()
rendered.split('\n').forEach((line) => console.log('  ' + line))
console.log('')

console.log(`Character dimensions: ${renderer.charWidth}x${renderer.charHeight}`)
console.log(`Subpixel dimensions:  ${renderer.pixelWidth}x${renderer.pixelHeight}`)
console.log('')

// ============================================================
// Graphics Protocol Info
// ============================================================

console.log('=== Graphics Protocols ===\n')

const caps = getCapabilities()

console.log('Supported protocols:')
console.log(`  Sixel:  ${caps.graphics === 'sixel' ? '✓ Available' : '✗ Not detected'}`)
console.log(`  Kitty:  ${caps.graphics === 'kitty' ? '✓ Available' : '✗ Not detected'}`)
console.log(`  iTerm2: ${caps.graphics === 'iterm2' ? '✓ Available' : '✗ Not detected'}`)
console.log('')

if (caps.graphics !== 'none') {
  console.log(`Your terminal supports the ${caps.graphics} graphics protocol.`)
  console.log(`This enables true pixel rendering for plots.`)
} else {
  console.log('No graphics protocol detected.')
  console.log('Using text-based rendering (braille, block, or ASCII).')
}
console.log('')

// ============================================================
// Summary
// ============================================================

console.log('═'.repeat(70))
console.log('                              Summary')
console.log('═'.repeat(70))
console.log('')
console.log('ggterm automatically detects your terminal capabilities and selects')
console.log('the best rendering strategy:')
console.log('')
console.log('  1. Graphics protocols (Kitty/iTerm2/Sixel) - True pixel rendering')
console.log('  2. Braille characters - 2x4 subpixel resolution')
console.log('  3. Half-block characters - 2x1 subpixel resolution')
console.log('  4. Block characters - 1:1 character resolution')
console.log('  5. ASCII fallback - Works everywhere')
console.log('')
console.log('Color modes automatically adapt to terminal support:')
console.log('  • Truecolor (24-bit) - 16 million colors')
console.log('  • 256 colors - Extended ANSI palette')
console.log('  • 16 colors - Standard ANSI colors')
console.log('')
console.log('Use getTerminalInfo() to query your terminal capabilities.')
console.log('')
