/**
 * @ggterm/render-sixel - Sixel/Kitty/iTerm2 graphics protocol renderer
 *
 * True pixel rendering for terminals with graphics support:
 * - Sixel: XTerm, mlterm, foot, wezterm
 * - Kitty: Kitty terminal graphics protocol
 * - iTerm2: Inline images protocol
 *
 * Falls back to braille/block when unsupported.
 */

import type { Canvas, RenderOptions, Renderer, RGBA } from '@ggterm/core'

/**
 * Graphics protocol types
 */
export type GraphicsProtocol = 'sixel' | 'kitty' | 'iterm2' | 'none'

/**
 * Detect available graphics protocol from environment
 */
export function detectGraphicsProtocol(): GraphicsProtocol {
  const term = process.env.TERM ?? ''
  const termProgram = process.env.TERM_PROGRAM ?? ''
  const kittyWindowId = process.env.KITTY_WINDOW_ID

  // Kitty terminal
  if (kittyWindowId) {
    return 'kitty'
  }

  // iTerm2
  if (termProgram === 'iTerm.app') {
    return 'iterm2'
  }

  // Sixel-capable terminals
  const sixelTerms = ['xterm', 'mlterm', 'foot', 'yaft', 'mintty', 'contour', 'wezterm']
  for (const sixelTerm of sixelTerms) {
    if (term.includes(sixelTerm)) {
      return 'sixel'
    }
  }

  return 'none'
}

/**
 * Color palette for Sixel rendering
 * Sixel uses indexed colors with a custom palette
 */
interface SixelPalette {
  colors: RGBA[]
  indices: Map<string, number>
}

/**
 * Create a color key for palette lookup
 */
function colorKey(color: RGBA): string {
  return `${color.r},${color.g},${color.b}`
}

/**
 * Build optimized color palette from pixels
 * Limits to 256 colors maximum (Sixel constraint)
 */
function buildPalette(pixels: RGBA[], maxColors = 256): SixelPalette {
  const colorCounts = new Map<string, { color: RGBA; count: number }>()

  // Count color occurrences
  for (const pixel of pixels) {
    if (pixel.a === 0) continue // Skip transparent
    const key = colorKey(pixel)
    const existing = colorCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      colorCounts.set(key, { color: pixel, count: 1 })
    }
  }

  // Sort by frequency and take top colors
  const sorted = Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)

  const colors: RGBA[] = []
  const indices = new Map<string, number>()

  for (let i = 0; i < sorted.length; i++) {
    colors.push(sorted[i].color)
    indices.set(colorKey(sorted[i].color), i)
  }

  return { colors, indices }
}

/**
 * Find closest color in palette using Euclidean distance
 */
function findClosestColor(color: RGBA, palette: SixelPalette): number {
  const key = colorKey(color)
  const exact = palette.indices.get(key)
  if (exact !== undefined) return exact

  let minDist = Infinity
  let closest = 0

  for (let i = 0; i < palette.colors.length; i++) {
    const c = palette.colors[i]
    const dr = color.r - c.r
    const dg = color.g - c.g
    const db = color.b - c.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  return closest
}

/**
 * Sixel encoder
 *
 * Sixel format encodes 6 vertical pixels per character row.
 * Each pixel column is encoded as a character where:
 * - Character value = 0x3F + sum(bit[i] * 2^i) for i=0..5
 * - bit[i] is set if pixel at row offset i is active
 */
export function encodeToSixel(
  pixels: RGBA[],
  width: number,
  height: number,
  options: { pixelRatio?: number } = {}
): string {
  const pixelRatio = options.pixelRatio || 1 // 1:1 aspect ratio
  const lines: string[] = []

  // Build color palette
  const palette = buildPalette(pixels)

  // Start sixel sequence
  // Pq - DCS (Device Control String) for sixel
  // "1;1" - aspect ratio 1:1
  // q - enter sixel mode
  lines.push(`\x1bP${pixelRatio};1;q`)

  // Define color palette
  // #n;2;r;g;b - define color n in RGB (0-100 range)
  for (let i = 0; i < palette.colors.length; i++) {
    const c = palette.colors[i]
    const r = Math.round((c.r / 255) * 100)
    const g = Math.round((c.g / 255) * 100)
    const b = Math.round((c.b / 255) * 100)
    lines.push(`#${i};2;${r};${g};${b}`)
  }

  // Index pixels for fast lookup
  const pixelColors: number[][] = []
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      const pixel = pixels[y * width + x]
      if (pixel.a === 0) {
        row.push(-1) // Transparent
      } else {
        row.push(findClosestColor(pixel, palette))
      }
    }
    pixelColors.push(row)
  }

  // Encode sixel bands (6 rows at a time)
  for (let bandY = 0; bandY < height; bandY += 6) {
    // For each color in use in this band
    const colorsInBand = new Set<number>()
    for (let y = bandY; y < Math.min(bandY + 6, height); y++) {
      for (let x = 0; x < width; x++) {
        const colorIdx = pixelColors[y]?.[x] ?? -1
        if (colorIdx >= 0) {
          colorsInBand.add(colorIdx)
        }
      }
    }

    // Process each color
    const colorArray = Array.from(colorsInBand).sort((a, b) => a - b)
    for (let ci = 0; ci < colorArray.length; ci++) {
      const colorIdx = colorArray[ci]

      // Select color
      lines.push(`#${colorIdx}`)

      // Encode the row for this color
      let rowData = ''
      let repeatCount = 0
      let lastChar = ''

      for (let x = 0; x < width; x++) {
        // Build sixel character for this column
        let sixelValue = 0
        for (let bit = 0; bit < 6; bit++) {
          const y = bandY + bit
          if (y < height) {
            const pixelColor = pixelColors[y]?.[x] ?? -1
            if (pixelColor === colorIdx) {
              sixelValue |= 1 << bit
            }
          }
        }

        const char = String.fromCharCode(0x3f + sixelValue)

        // Run-length encoding
        if (char === lastChar) {
          repeatCount++
        } else {
          if (repeatCount > 0) {
            if (repeatCount >= 3) {
              rowData += `!${repeatCount}${lastChar}`
            } else {
              rowData += lastChar.repeat(repeatCount)
            }
          }
          lastChar = char
          repeatCount = 1
        }
      }

      // Flush remaining
      if (repeatCount > 0) {
        if (repeatCount >= 3) {
          rowData += `!${repeatCount}${lastChar}`
        } else {
          rowData += lastChar.repeat(repeatCount)
        }
      }

      lines.push(rowData)

      // Carriage return if not last color in band
      if (ci < colorArray.length - 1) {
        lines.push('$') // CR - go back to start of band
      }
    }

    // Move to next band (newline in sixel)
    if (bandY + 6 < height) {
      lines.push('-') // LF - move to next sixel band
    }
  }

  // End sixel sequence (ST - String Terminator)
  lines.push('\x1b\\')

  return lines.join('')
}

/**
 * Kitty graphics protocol encoder
 *
 * Uses base64-encoded raw RGBA data with special escape sequences.
 * Supports chunked transmission for large images.
 */
export function encodeToKitty(
  pixels: RGBA[],
  width: number,
  height: number,
  options: { id?: number; placement?: 'inline' | 'cursor' } = {}
): string {
  const id = options.id || Math.floor(Math.random() * 0xffffffff)
  const placement = options.placement || 'inline'

  // Convert to raw RGBA bytes
  const rawData = new Uint8Array(width * height * 4)
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i]
    rawData[i * 4] = p.r
    rawData[i * 4 + 1] = p.g
    rawData[i * 4 + 2] = p.b
    rawData[i * 4 + 3] = p.a
  }

  // Convert to base64
  const base64 = Buffer.from(rawData).toString('base64')

  // Kitty protocol escape sequence
  // a=T - transmit and display
  // f=32 - RGBA format
  // s=width, v=height - dimensions
  // i=id - image ID
  // C=1 - cursor movement (for inline)
  const lines: string[] = []

  // Chunk size (max 4096 bytes of base64 per chunk)
  const chunkSize = 4096

  for (let offset = 0; offset < base64.length; offset += chunkSize) {
    const chunk = base64.slice(offset, offset + chunkSize)
    const isFirst = offset === 0
    const isLast = offset + chunkSize >= base64.length
    const more = isLast ? 0 : 1

    if (isFirst) {
      // First chunk includes full header
      const cursorMove = placement === 'inline' ? ',C=1' : ''
      lines.push(`\x1b_Ga=T,f=32,s=${width},v=${height},i=${id}${cursorMove},m=${more};${chunk}\x1b\\`)
    } else {
      // Continuation chunks
      lines.push(`\x1b_Gm=${more};${chunk}\x1b\\`)
    }
  }

  return lines.join('')
}

/**
 * iTerm2 inline image encoder
 *
 * Uses OSC 1337 with base64-encoded PNG data.
 * iTerm2 supports PNG, JPEG, GIF directly.
 */
export function encodeToIterm2(
  pixels: RGBA[],
  width: number,
  height: number,
  options: { name?: string; preserveAspectRatio?: boolean; inline?: boolean } = {}
): string {
  const name = options.name || 'plot.png'
  const preserveAspect = options.preserveAspectRatio !== false ? 1 : 0
  const inline = options.inline !== false ? 1 : 0

  // Create minimal PNG
  const pngData = createMinimalPNG(pixels, width, height)
  const base64 = Buffer.from(pngData).toString('base64')

  // iTerm2 protocol
  // OSC 1337 ; File=name=<name>;size=<size>;inline=<0|1>;width=<cols>;height=<rows>;preserveAspectRatio=<0|1> : <base64> ST
  const parts = [
    `name=${Buffer.from(name).toString('base64')}`,
    `size=${pngData.length}`,
    `inline=${inline}`,
    `preserveAspectRatio=${preserveAspect}`,
  ]

  return `\x1b]1337;File=${parts.join(';')}:${base64}\x07`
}

/**
 * Create minimal PNG from RGBA pixels
 * This is a simplified PNG encoder - produces valid but uncompressed PNGs
 */
function createMinimalPNG(pixels: RGBA[], width: number, height: number): Uint8Array {
  // PNG signature
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  // Helper to create a PNG chunk
  function createChunk(type: string, data: number[]): number[] {
    const length = data.length
    const typeBytes = type.split('').map((c) => c.charCodeAt(0))
    const chunk = [...typeBytes, ...data]

    // CRC32
    const crc = crc32(chunk)

    return [
      (length >> 24) & 0xff,
      (length >> 16) & 0xff,
      (length >> 8) & 0xff,
      length & 0xff,
      ...chunk,
      (crc >> 24) & 0xff,
      (crc >> 16) & 0xff,
      (crc >> 8) & 0xff,
      crc & 0xff,
    ]
  }

  // CRC32 calculation
  function crc32(data: number[]): number {
    let crc = 0xffffffff
    const table = getCRC32Table()
    for (const byte of data) {
      crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
    return crc ^ 0xffffffff
  }

  // CRC32 lookup table
  let crcTable: number[] | null = null
  function getCRC32Table(): number[] {
    if (crcTable) return crcTable
    crcTable = []
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        if (c & 1) {
          c = 0xedb88320 ^ (c >>> 1)
        } else {
          c = c >>> 1
        }
      }
      crcTable.push(c)
    }
    return crcTable
  }

  // IHDR chunk (image header)
  const ihdr = createChunk('IHDR', [
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    8, // bit depth
    6, // color type (RGBA)
    0, // compression
    0, // filter
    0, // interlace
  ])

  // Prepare raw image data with filter bytes
  const rawData: number[] = []
  for (let y = 0; y < height; y++) {
    rawData.push(0) // Filter type: None
    for (let x = 0; x < width; x++) {
      const p = pixels[y * width + x]
      rawData.push(p.r, p.g, p.b, p.a)
    }
  }

  // Compress with zlib (uncompressed deflate block)
  const compressedData = createUncompressedDeflate(rawData)

  // IDAT chunk (image data)
  const idat = createChunk('IDAT', compressedData)

  // IEND chunk (image end)
  const iend = createChunk('IEND', [])

  // Combine all
  return new Uint8Array([...signature, ...ihdr, ...idat, ...iend])
}

/**
 * Create uncompressed deflate stream
 * Creates a valid zlib stream with no compression
 */
function createUncompressedDeflate(data: number[]): number[] {
  const result: number[] = []

  // Zlib header (no compression, no dictionary)
  result.push(0x78, 0x01)

  // Split data into 65535-byte blocks (max for uncompressed deflate)
  const blockSize = 65535
  for (let offset = 0; offset < data.length; offset += blockSize) {
    const isLast = offset + blockSize >= data.length
    const blockData = data.slice(offset, offset + blockSize)
    const len = blockData.length

    // Block header
    result.push(isLast ? 0x01 : 0x00) // BFINAL (1 if last) + BTYPE (00 = no compression)
    result.push(len & 0xff)
    result.push((len >> 8) & 0xff)
    result.push((~len) & 0xff)
    result.push((~len >> 8) & 0xff)

    // Block data
    result.push(...blockData)
  }

  // Adler32 checksum
  let s1 = 1
  let s2 = 0
  for (const byte of data) {
    s1 = (s1 + byte) % 65521
    s2 = (s2 + s1) % 65521
  }
  const adler = (s2 << 16) | s1
  result.push((adler >> 24) & 0xff, (adler >> 16) & 0xff, (adler >> 8) & 0xff, adler & 0xff)

  return result
}

/**
 * Graphics renderer options
 */
export interface GraphicsRenderOptions extends RenderOptions {
  /** Force specific protocol */
  protocol?: GraphicsProtocol
  /** Sixel pixel ratio (aspect ratio) */
  pixelRatio?: number
  /** Kitty image ID */
  kittyId?: number
  /** iTerm2 image name */
  imageName?: string
}

/**
 * Main graphics renderer
 *
 * Automatically detects the best available protocol and encodes accordingly.
 */
export const sixelRenderer: Renderer = {
  render(canvas: Canvas, options: RenderOptions): string {
    const gfxOptions = options as GraphicsRenderOptions
    const protocol = gfxOptions.protocol || detectGraphicsProtocol()

    if (protocol === 'none') {
      return '[Graphics not supported]\n'
    }

    // Convert canvas to pixel buffer
    const pixels: RGBA[] = []
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const cell = canvas.getCell(x, y)
        // Use foreground color, with full alpha for non-space chars
        if (cell.char !== ' ') {
          pixels.push(cell.fg)
        } else {
          // Transparent pixel
          pixels.push({ r: 0, g: 0, b: 0, a: 0 })
        }
      }
    }

    switch (protocol) {
      case 'sixel':
        return encodeToSixel(pixels, canvas.width, canvas.height, {
          pixelRatio: gfxOptions.pixelRatio,
        })
      case 'kitty':
        return encodeToKitty(pixels, canvas.width, canvas.height, {
          id: gfxOptions.kittyId,
        })
      case 'iterm2':
        return encodeToIterm2(pixels, canvas.width, canvas.height, {
          name: gfxOptions.imageName,
        })
      default:
        return ''
    }
  },
}

/**
 * Create a graphics renderer for direct pixel manipulation
 */
export function createGraphicsRenderer(width: number, height: number) {
  const pixels: RGBA[] = Array(width * height).fill({ r: 0, g: 0, b: 0, a: 0 })

  return {
    width,
    height,

    /** Set a pixel */
    setPixel(x: number, y: number, color: RGBA): void {
      if (x < 0 || x >= width || y < 0 || y >= height) return
      pixels[y * width + x] = color
    },

    /** Get a pixel */
    getPixel(x: number, y: number): RGBA {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return { r: 0, g: 0, b: 0, a: 0 }
      }
      return pixels[y * width + x]
    },

    /** Fill with color */
    fill(color: RGBA): void {
      for (let i = 0; i < pixels.length; i++) {
        pixels[i] = color
      }
    },

    /** Clear to transparent */
    clear(): void {
      for (let i = 0; i < pixels.length; i++) {
        pixels[i] = { r: 0, g: 0, b: 0, a: 0 }
      }
    },

    /** Render using best available protocol */
    render(protocol?: GraphicsProtocol): string {
      const proto = protocol || detectGraphicsProtocol()
      switch (proto) {
        case 'sixel':
          return encodeToSixel(pixels, width, height)
        case 'kitty':
          return encodeToKitty(pixels, width, height)
        case 'iterm2':
          return encodeToIterm2(pixels, width, height)
        default:
          return '[Graphics not supported]'
      }
    },

    /** Get raw pixel buffer */
    getPixels(): RGBA[] {
      return [...pixels]
    },
  }
}

// Re-export protocol detection from core if available
export { detectGraphicsProtocol as detectProtocol }

export default sixelRenderer
