/**
 * Terminal Color Utilities
 *
 * Provides color conversion and palette optimization for different terminal capabilities:
 * - Truecolor (24-bit RGB)
 * - 256 color palette
 * - 16 color ANSI palette
 */

import type { RGBA } from '../types'

/**
 * Standard ANSI 16 colors
 * These are the basic 16 colors available on all terminals
 */
export const ANSI_16_COLORS: RGBA[] = [
  { r: 0, g: 0, b: 0, a: 255 }, // 0: Black
  { r: 128, g: 0, b: 0, a: 255 }, // 1: Red
  { r: 0, g: 128, b: 0, a: 255 }, // 2: Green
  { r: 128, g: 128, b: 0, a: 255 }, // 3: Yellow
  { r: 0, g: 0, b: 128, a: 255 }, // 4: Blue
  { r: 128, g: 0, b: 128, a: 255 }, // 5: Magenta
  { r: 0, g: 128, b: 128, a: 255 }, // 6: Cyan
  { r: 192, g: 192, b: 192, a: 255 }, // 7: White
  { r: 128, g: 128, b: 128, a: 255 }, // 8: Bright Black (Gray)
  { r: 255, g: 0, b: 0, a: 255 }, // 9: Bright Red
  { r: 0, g: 255, b: 0, a: 255 }, // 10: Bright Green
  { r: 255, g: 255, b: 0, a: 255 }, // 11: Bright Yellow
  { r: 0, g: 0, b: 255, a: 255 }, // 12: Bright Blue
  { r: 255, g: 0, b: 255, a: 255 }, // 13: Bright Magenta
  { r: 0, g: 255, b: 255, a: 255 }, // 14: Bright Cyan
  { r: 255, g: 255, b: 255, a: 255 }, // 15: Bright White
]

/**
 * Generate the 256-color palette
 * 0-15: ANSI 16 colors
 * 16-231: 6x6x6 RGB cube
 * 232-255: Grayscale ramp
 */
export function generate256Palette(): RGBA[] {
  const palette: RGBA[] = []

  // 0-15: Standard ANSI colors
  palette.push(...ANSI_16_COLORS)

  // 16-231: 6x6x6 color cube
  const levels = [0, 95, 135, 175, 215, 255]
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push({
          r: levels[r],
          g: levels[g],
          b: levels[b],
          a: 255,
        })
      }
    }
  }

  // 232-255: Grayscale ramp
  for (let i = 0; i < 24; i++) {
    const gray = 8 + i * 10
    palette.push({ r: gray, g: gray, b: gray, a: 255 })
  }

  return palette
}

// Cache the 256-color palette
let _palette256: RGBA[] | null = null
export function getPalette256(): RGBA[] {
  if (!_palette256) {
    _palette256 = generate256Palette()
  }
  return _palette256
}

/**
 * Calculate color distance using weighted Euclidean distance
 * Weighted for human perception (red and blue less than green)
 */
export function colorDistance(a: RGBA, b: RGBA): number {
  // Weighted RGB distance (approximates human perception)
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db)
}

/**
 * Find the closest color in a palette
 */
export function findClosestPaletteColor(color: RGBA, palette: RGBA[]): number {
  let minDist = Infinity
  let closest = 0

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistance(color, palette[i])
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  return closest
}

/**
 * Convert RGB to ANSI 256 color index
 */
export function rgbToAnsi256(color: RGBA): number {
  const { r, g, b } = color

  // Check for grayscale
  if (r === g && g === b) {
    if (r < 8) return 16 // Black
    if (r > 248) return 231 // White
    return Math.round((r - 8) / 10) + 232
  }

  // Convert to 6x6x6 cube
  const cubeVal = (v: number) => {
    if (v < 48) return 0
    if (v < 115) return 1
    return Math.min(5, Math.floor((v - 35) / 40))
  }

  const cr = cubeVal(r)
  const cg = cubeVal(g)
  const cb = cubeVal(b)

  return 16 + 36 * cr + 6 * cg + cb
}

/**
 * Convert RGB to ANSI 16 color index
 */
export function rgbToAnsi16(color: RGBA): number {
  const { r, g, b } = color

  // Calculate brightness
  const brightness = (r + g + b) / 3

  // Check for gray/white/black
  if (Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 32) {
    if (brightness < 64) return 0 // Black
    if (brightness < 192) return 8 // Gray
    return 7 // White (or 15 for bright white)
  }

  // Determine primary/secondary color
  const bright = brightness > 127

  // Red dominant
  if (r > g && r > b) {
    if (g > b && g > 127) return bright ? 11 : 3 // Yellow
    return bright ? 9 : 1 // Red
  }

  // Green dominant
  if (g > r && g > b) {
    if (r > b && r > 127) return bright ? 11 : 3 // Yellow
    if (b > r && b > 127) return bright ? 14 : 6 // Cyan
    return bright ? 10 : 2 // Green
  }

  // Blue dominant
  if (b > r && b > g) {
    if (r > g && r > 127) return bright ? 13 : 5 // Magenta
    if (g > r && g > 127) return bright ? 14 : 6 // Cyan
    return bright ? 12 : 4 // Blue
  }

  // Fallback to closest match
  return findClosestPaletteColor(color, ANSI_16_COLORS)
}

/**
 * Generate ANSI escape sequence for foreground color
 */
export function fgEscape(color: RGBA, mode: 'truecolor' | '256' | '16'): string {
  switch (mode) {
    case 'truecolor':
      return `\x1b[38;2;${color.r};${color.g};${color.b}m`
    case '256':
      return `\x1b[38;5;${rgbToAnsi256(color)}m`
    case '16':
      const idx16 = rgbToAnsi16(color)
      // Use 30-37 for normal, 90-97 for bright
      return idx16 < 8 ? `\x1b[${30 + idx16}m` : `\x1b[${82 + idx16}m`
  }
}

/**
 * Generate ANSI escape sequence for background color
 */
export function bgEscape(color: RGBA, mode: 'truecolor' | '256' | '16'): string {
  switch (mode) {
    case 'truecolor':
      return `\x1b[48;2;${color.r};${color.g};${color.b}m`
    case '256':
      return `\x1b[48;5;${rgbToAnsi256(color)}m`
    case '16':
      const idx16 = rgbToAnsi16(color)
      // Use 40-47 for normal, 100-107 for bright
      return idx16 < 8 ? `\x1b[${40 + idx16}m` : `\x1b[${92 + idx16}m`
  }
}

/**
 * Quantize a color to a specific palette depth
 */
export function quantizeColor(color: RGBA, depth: '256' | '16'): RGBA {
  if (depth === '256') {
    const idx = rgbToAnsi256(color)
    return getPalette256()[idx]
  }

  const idx = rgbToAnsi16(color)
  return ANSI_16_COLORS[idx]
}

/**
 * Floyd-Steinberg dithering for color reduction
 * Distributes quantization error to neighboring pixels
 */
export function ditherPixels(
  pixels: RGBA[],
  width: number,
  height: number,
  depth: '256' | '16'
): RGBA[] {
  // Copy pixels to avoid modifying original
  const result = pixels.map((p) => ({ ...p }))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const old = result[idx]

      // Skip transparent pixels
      if (old.a === 0) continue

      // Quantize the pixel
      const quantized = quantizeColor(old, depth)
      result[idx] = quantized

      // Calculate error
      const errR = old.r - quantized.r
      const errG = old.g - quantized.g
      const errB = old.b - quantized.b

      // Distribute error to neighbors (Floyd-Steinberg coefficients)
      const distribute = (dx: number, dy: number, factor: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx
          if (result[nidx].a > 0) {
            result[nidx].r = Math.max(0, Math.min(255, result[nidx].r + errR * factor))
            result[nidx].g = Math.max(0, Math.min(255, result[nidx].g + errG * factor))
            result[nidx].b = Math.max(0, Math.min(255, result[nidx].b + errB * factor))
          }
        }
      }

      distribute(1, 0, 7 / 16) // Right
      distribute(-1, 1, 3 / 16) // Bottom-left
      distribute(0, 1, 5 / 16) // Bottom
      distribute(1, 1, 1 / 16) // Bottom-right
    }
  }

  return result
}

/**
 * Create an optimized palette from a set of colors
 * Uses median cut algorithm for color quantization
 */
export function createOptimizedPalette(colors: RGBA[], maxColors: number): RGBA[] {
  if (colors.length <= maxColors) {
    return [...colors]
  }

  // Count unique colors
  const colorMap = new Map<string, { color: RGBA; count: number }>()
  for (const color of colors) {
    if (color.a === 0) continue
    const key = `${color.r},${color.g},${color.b}`
    const existing = colorMap.get(key)
    if (existing) {
      existing.count++
    } else {
      colorMap.set(key, { color, count: 1 })
    }
  }

  const uniqueColors = Array.from(colorMap.values())

  if (uniqueColors.length <= maxColors) {
    return uniqueColors.map((c) => c.color)
  }

  // Median cut algorithm
  interface Bucket {
    colors: { color: RGBA; count: number }[]
    rMin: number
    rMax: number
    gMin: number
    gMax: number
    bMin: number
    bMax: number
  }

  function createBucket(colors: { color: RGBA; count: number }[]): Bucket {
    let rMin = 255,
      rMax = 0
    let gMin = 255,
      gMax = 0
    let bMin = 255,
      bMax = 0

    for (const { color } of colors) {
      rMin = Math.min(rMin, color.r)
      rMax = Math.max(rMax, color.r)
      gMin = Math.min(gMin, color.g)
      gMax = Math.max(gMax, color.g)
      bMin = Math.min(bMin, color.b)
      bMax = Math.max(bMax, color.b)
    }

    return { colors, rMin, rMax, gMin, gMax, bMin, bMax }
  }

  function splitBucket(bucket: Bucket): [Bucket, Bucket] {
    const rRange = bucket.rMax - bucket.rMin
    const gRange = bucket.gMax - bucket.gMin
    const bRange = bucket.bMax - bucket.bMin

    // Sort by the channel with the largest range
    let sortFn: (a: { color: RGBA }, b: { color: RGBA }) => number
    if (rRange >= gRange && rRange >= bRange) {
      sortFn = (a, b) => a.color.r - b.color.r
    } else if (gRange >= rRange && gRange >= bRange) {
      sortFn = (a, b) => a.color.g - b.color.g
    } else {
      sortFn = (a, b) => a.color.b - b.color.b
    }

    const sorted = [...bucket.colors].sort(sortFn)
    const mid = Math.floor(sorted.length / 2)

    return [createBucket(sorted.slice(0, mid)), createBucket(sorted.slice(mid))]
  }

  function getBucketAverage(bucket: Bucket): RGBA {
    let totalR = 0,
      totalG = 0,
      totalB = 0,
      totalCount = 0

    for (const { color, count } of bucket.colors) {
      totalR += color.r * count
      totalG += color.g * count
      totalB += color.b * count
      totalCount += count
    }

    return {
      r: Math.round(totalR / totalCount),
      g: Math.round(totalG / totalCount),
      b: Math.round(totalB / totalCount),
      a: 255,
    }
  }

  // Start with one bucket containing all colors
  let buckets: Bucket[] = [createBucket(uniqueColors)]

  // Split buckets until we have enough
  while (buckets.length < maxColors) {
    // Find bucket with largest range to split
    let maxRange = 0
    let maxIdx = 0

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i]
      if (b.colors.length <= 1) continue

      const range = Math.max(b.rMax - b.rMin, b.gMax - b.gMin, b.bMax - b.bMin)

      if (range > maxRange) {
        maxRange = range
        maxIdx = i
      }
    }

    // Can't split further
    if (maxRange === 0 || buckets[maxIdx].colors.length <= 1) {
      break
    }

    // Split the bucket
    const [a, b] = splitBucket(buckets[maxIdx])
    buckets.splice(maxIdx, 1, a, b)
  }

  // Get average color from each bucket
  return buckets.map(getBucketAverage)
}

/**
 * Color mode type
 */
export type ColorMode = 'truecolor' | '256' | '16' | 'none'

/**
 * Get color escape based on terminal capability
 */
export function getColorEscape(
  color: RGBA,
  mode: ColorMode,
  type: 'fg' | 'bg'
): string {
  if (mode === 'none' || color.a === 0) {
    return ''
  }

  if (type === 'fg') {
    return fgEscape(color, mode as 'truecolor' | '256' | '16')
  }
  return bgEscape(color, mode as 'truecolor' | '256' | '16')
}

/**
 * Reset escape sequence
 */
export const RESET = '\x1b[0m'

/**
 * Reset foreground only
 */
export const RESET_FG = '\x1b[39m'

/**
 * Reset background only
 */
export const RESET_BG = '\x1b[49m'
