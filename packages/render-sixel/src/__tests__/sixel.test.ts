/**
 * Tests for @ggterm/render-sixel
 */

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import {
  detectGraphicsProtocol,
  encodeToSixel,
  encodeToKitty,
  encodeToIterm2,
  sixelRenderer,
  createGraphicsRenderer,
  type GraphicsProtocol,
} from '../index'

// Test color constants
const WHITE = { r: 255, g: 255, b: 255, a: 255 }
const RED = { r: 255, g: 0, b: 0, a: 255 }
const GREEN = { r: 0, g: 255, b: 0, a: 255 }
const BLUE = { r: 0, g: 0, b: 255, a: 255 }
const BLACK = { r: 0, g: 0, b: 0, a: 255 }
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 }

// Store original env
let originalEnv: NodeJS.ProcessEnv

describe('detectGraphicsProtocol', () => {
  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should detect kitty when KITTY_WINDOW_ID is set', () => {
    process.env.KITTY_WINDOW_ID = '1'
    process.env.TERM = ''
    process.env.TERM_PROGRAM = ''

    expect(detectGraphicsProtocol()).toBe('kitty')
  })

  it('should detect iterm2 when TERM_PROGRAM is iTerm.app', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = 'iTerm.app'
    process.env.TERM = ''

    expect(detectGraphicsProtocol()).toBe('iterm2')
  })

  it('should detect sixel for xterm', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'xterm-256color'

    expect(detectGraphicsProtocol()).toBe('sixel')
  })

  it('should detect sixel for mlterm', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'mlterm'

    expect(detectGraphicsProtocol()).toBe('sixel')
  })

  it('should detect sixel for foot', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'foot'

    expect(detectGraphicsProtocol()).toBe('sixel')
  })

  it('should detect sixel for wezterm', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'wezterm'

    expect(detectGraphicsProtocol()).toBe('sixel')
  })

  it('should return none when no graphics support detected', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'vt100'

    expect(detectGraphicsProtocol()).toBe('none')
  })

  it('should return none for empty environment', () => {
    delete process.env.KITTY_WINDOW_ID
    delete process.env.TERM_PROGRAM
    delete process.env.TERM

    expect(detectGraphicsProtocol()).toBe('none')
  })

  it('should prioritize kitty over sixel', () => {
    process.env.KITTY_WINDOW_ID = '1'
    process.env.TERM = 'xterm-256color' // Would normally be sixel

    expect(detectGraphicsProtocol()).toBe('kitty')
  })
})

describe('encodeToSixel', () => {
  it('should return string starting with DCS escape', () => {
    const pixels = [RED, GREEN, BLUE, WHITE]
    const result = encodeToSixel(pixels, 2, 2)

    // DCS = ESC P
    expect(result.startsWith('\x1bP')).toBe(true)
  })

  it('should end with ST (string terminator)', () => {
    const pixels = [RED]
    const result = encodeToSixel(pixels, 1, 1)

    // ST = ESC \
    expect(result.endsWith('\x1b\\')).toBe(true)
  })

  it('should include color palette definitions', () => {
    const pixels = [RED, GREEN]
    const result = encodeToSixel(pixels, 2, 1)

    // Color definitions start with #n;2;r;g;b
    expect(result).toContain('#0;2;')
    expect(result).toContain('#1;2;')
  })

  it('should convert RGB to 0-100 range for sixel palette', () => {
    const pixels = [{ r: 255, g: 128, b: 0, a: 255 }]
    const result = encodeToSixel(pixels, 1, 1)

    // 255 -> 100, 128 -> ~50, 0 -> 0
    expect(result).toContain(';2;100;50;0')
  })

  it('should skip transparent pixels', () => {
    const pixels = [TRANSPARENT, RED]
    const result = encodeToSixel(pixels, 2, 1)

    // Should only have one color in palette
    expect(result).toContain('#0;2;100;0;0') // Red
    expect(result).not.toContain('#1;2;') // No second color
  })

  it('should use run-length encoding for repeated pixels', () => {
    // 10 identical red pixels
    const pixels = Array(10).fill(RED)
    const result = encodeToSixel(pixels, 10, 1)

    // RLE format: !n<char> for n repetitions
    expect(result).toMatch(/!\d+/)
  })

  it('should encode 6 vertical pixels per sixel band', () => {
    // 12 pixels tall = 2 sixel bands
    const pixels = Array(12).fill(WHITE)
    const result = encodeToSixel(pixels, 1, 12)

    // Band separator is '-'
    expect(result).toContain('-')
  })

  it('should handle aspect ratio option', () => {
    const pixels = [RED]
    const result = encodeToSixel(pixels, 1, 1, { pixelRatio: 2 })

    // Aspect ratio is first parameter after DCS
    expect(result.startsWith('\x1bP2;1;q')).toBe(true)
  })

  it('should handle empty image', () => {
    const pixels: typeof RED[] = []
    const result = encodeToSixel(pixels, 0, 0)

    expect(typeof result).toBe('string')
    expect(result.startsWith('\x1bP')).toBe(true)
    expect(result.endsWith('\x1b\\')).toBe(true)
  })

  it('should use sixel character encoding (0x3F base)', () => {
    // Single pixel with all 6 bits set would be 0x3F + 0x3F = 0x7E = '~'
    // But we're testing a single band with one pixel
    const pixels = [WHITE]
    const result = encodeToSixel(pixels, 1, 1)

    // Should contain characters in the valid sixel range (0x3F to 0x7E)
    const sixelChars = result.match(/[?-~]/g)
    expect(sixelChars).not.toBeNull()
  })
})

describe('encodeToKitty', () => {
  it('should start with APC escape sequence', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1)

    // APC = ESC _
    expect(result.startsWith('\x1b_G')).toBe(true)
  })

  it('should end with ST escape sequence', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1)

    // ST = ESC \
    expect(result.endsWith('\x1b\\')).toBe(true)
  })

  it('should include transmit action', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1)

    // a=T for transmit and display
    expect(result).toContain('a=T')
  })

  it('should include RGBA format specifier', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1)

    // f=32 for RGBA
    expect(result).toContain('f=32')
  })

  it('should include dimensions', () => {
    const pixels = Array(20).fill(RED)
    const result = encodeToKitty(pixels, 5, 4)

    expect(result).toContain('s=5') // width
    expect(result).toContain('v=4') // height
  })

  it('should accept custom image ID', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1, { id: 12345 })

    expect(result).toContain('i=12345')
  })

  it('should include base64 encoded data', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1)

    // Extract base64 part after semicolon
    const match = result.match(/;([A-Za-z0-9+/=]+)/)
    expect(match).not.toBeNull()

    // Should be valid base64
    const base64 = match![1]
    expect(() => Buffer.from(base64, 'base64')).not.toThrow()
  })

  it('should encode RGBA data correctly', () => {
    const pixels = [{ r: 255, g: 128, b: 64, a: 200 }]
    const result = encodeToKitty(pixels, 1, 1)

    // Extract and decode base64
    const match = result.match(/;([A-Za-z0-9+/=]+)/)
    const decoded = Buffer.from(match![1], 'base64')

    expect(decoded[0]).toBe(255) // r
    expect(decoded[1]).toBe(128) // g
    expect(decoded[2]).toBe(64) // b
    expect(decoded[3]).toBe(200) // a
  })

  it('should chunk large images', () => {
    // Create a large pixel array (larger than 4096 bytes of base64)
    const pixels = Array(2000).fill(RED) // 2000 * 4 = 8000 bytes -> >5300 base64 chars
    const result = encodeToKitty(pixels, 50, 40)

    // Multiple chunks should have multiple escape sequences
    const chunkCount = (result.match(/\x1b_G/g) || []).length
    expect(chunkCount).toBeGreaterThan(1)
  })

  it('should use m=1 for continuation chunks', () => {
    const pixels = Array(2000).fill(RED)
    const result = encodeToKitty(pixels, 50, 40)

    // First chunk has m=1 (more), last has m=0
    expect(result).toContain('m=1')
    expect(result).toContain('m=0')
  })

  it('should include cursor movement for inline placement', () => {
    const pixels = [RED]
    const result = encodeToKitty(pixels, 1, 1, { placement: 'inline' })

    expect(result).toContain('C=1')
  })
})

describe('encodeToIterm2', () => {
  it('should start with OSC 1337 escape', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    // OSC = ESC ]
    expect(result.startsWith('\x1b]1337;File=')).toBe(true)
  })

  it('should end with BEL', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    // BEL = 0x07
    expect(result.endsWith('\x07')).toBe(true)
  })

  it('should include base64 encoded name', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1, { name: 'test.png' })

    // name should be base64 encoded
    const expectedName = Buffer.from('test.png').toString('base64')
    expect(result).toContain(`name=${expectedName}`)
  })

  it('should include size parameter', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    expect(result).toMatch(/size=\d+/)
  })

  it('should include inline parameter', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    expect(result).toContain('inline=1')
  })

  it('should include preserveAspectRatio parameter', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    expect(result).toContain('preserveAspectRatio=1')
  })

  it('should respect preserveAspectRatio=false option', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1, { preserveAspectRatio: false })

    expect(result).toContain('preserveAspectRatio=0')
  })

  it('should contain base64 PNG data', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    // Extract base64 after colon
    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    expect(match).not.toBeNull()

    // Decode and check PNG signature
    const decoded = Buffer.from(match![1], 'base64')
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect(decoded[0]).toBe(0x89)
    expect(decoded[1]).toBe(0x50) // P
    expect(decoded[2]).toBe(0x4e) // N
    expect(decoded[3]).toBe(0x47) // G
  })
})

describe('PNG encoding', () => {
  it('should create valid PNG signature', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    const decoded = Buffer.from(match![1], 'base64')

    // PNG signature
    expect(decoded.slice(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  })

  it('should contain IHDR chunk', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    const decoded = Buffer.from(match![1], 'base64')

    // IHDR should appear after signature (8 bytes) and length (4 bytes)
    const ihdr = decoded.slice(12, 16).toString('ascii')
    expect(ihdr).toBe('IHDR')
  })

  it('should contain IDAT chunk', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    const decoded = Buffer.from(match![1], 'base64')
    const pngStr = decoded.toString('binary')

    expect(pngStr).toContain('IDAT')
  })

  it('should contain IEND chunk', () => {
    const pixels = [RED]
    const result = encodeToIterm2(pixels, 1, 1)

    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    const decoded = Buffer.from(match![1], 'base64')
    const pngStr = decoded.toString('binary')

    expect(pngStr).toContain('IEND')
  })

  it('should encode correct image dimensions in IHDR', () => {
    const pixels = Array(100).fill(RED)
    const result = encodeToIterm2(pixels, 10, 10)

    const match = result.match(/:([A-Za-z0-9+/=]+)\x07$/)
    const decoded = Buffer.from(match![1], 'base64')

    // IHDR is at offset 8 (signature) + 4 (length) + 4 (type) = 16
    // Width is first 4 bytes, height is next 4 bytes
    const width = decoded.readUInt32BE(16)
    const height = decoded.readUInt32BE(20)

    expect(width).toBe(10)
    expect(height).toBe(10)
  })
})

describe('sixelRenderer', () => {
  const createMockCanvas = (width: number, height: number, cells?: Record<string, { char: string; fg: typeof WHITE }>) => ({
    width,
    height,
    getCell: (x: number, y: number) => {
      const key = `${x},${y}`
      if (cells && cells[key]) {
        return cells[key]
      }
      return { char: ' ', fg: { r: 255, g: 255, b: 255, a: 255 }, bg: { r: 0, g: 0, b: 0, a: 255 } }
    },
  })

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should have render method', () => {
    expect(typeof sixelRenderer.render).toBe('function')
  })

  it('should return "Graphics not supported" when no protocol available', () => {
    delete process.env.KITTY_WINDOW_ID
    delete process.env.TERM_PROGRAM
    process.env.TERM = 'vt100'

    const canvas = createMockCanvas(10, 10)
    const result = sixelRenderer.render(canvas as any, { width: 10, height: 10 })

    expect(result).toContain('Graphics not supported')
  })

  it('should use sixel when TERM indicates support', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''
    process.env.TERM = 'xterm-256color'

    const canvas = createMockCanvas(5, 5)
    const result = sixelRenderer.render(canvas as any, { width: 5, height: 5 })

    expect(result.startsWith('\x1bP')).toBe(true)
  })

  it('should use kitty when KITTY_WINDOW_ID is set', () => {
    process.env.KITTY_WINDOW_ID = '1'
    process.env.TERM = ''
    process.env.TERM_PROGRAM = ''

    const canvas = createMockCanvas(5, 5)
    const result = sixelRenderer.render(canvas as any, { width: 5, height: 5 })

    expect(result.startsWith('\x1b_G')).toBe(true)
  })

  it('should use iterm2 when TERM_PROGRAM is iTerm.app', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = 'iTerm.app'
    process.env.TERM = ''

    const canvas = createMockCanvas(5, 5)
    const result = sixelRenderer.render(canvas as any, { width: 5, height: 5 })

    expect(result.startsWith('\x1b]1337;')).toBe(true)
  })

  it('should respect forced protocol option', () => {
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM = 'vt100' // Would normally be 'none'

    const canvas = createMockCanvas(5, 5)
    const result = sixelRenderer.render(canvas as any, { width: 5, height: 5, protocol: 'sixel' } as any)

    expect(result.startsWith('\x1bP')).toBe(true)
  })

  it('should convert canvas cells to pixels', () => {
    process.env.TERM = 'xterm'
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''

    const cells = {
      '0,0': { char: '●', fg: RED },
      '1,0': { char: '●', fg: GREEN },
    }
    const canvas = createMockCanvas(2, 1, cells)
    const result = sixelRenderer.render(canvas as any, { width: 2, height: 1 })

    // Should contain both red and green in palette
    expect(result).toContain(';2;100;0;0') // Red
    expect(result).toContain(';2;0;100;0') // Green
  })

  it('should treat space characters as transparent', () => {
    process.env.TERM = 'xterm'
    delete process.env.KITTY_WINDOW_ID
    process.env.TERM_PROGRAM = ''

    const cells = {
      '0,0': { char: ' ', fg: RED }, // Space = transparent
      '1,0': { char: '●', fg: GREEN },
    }
    const canvas = createMockCanvas(2, 1, cells)
    const result = sixelRenderer.render(canvas as any, { width: 2, height: 1 })

    // Should only have green in palette (red is transparent)
    expect(result).toContain(';2;0;100;0') // Green
    expect(result).not.toContain(';2;100;0;0') // No red
  })
})

describe('createGraphicsRenderer', () => {
  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create renderer with correct dimensions', () => {
    const renderer = createGraphicsRenderer(10, 20)

    expect(renderer.width).toBe(10)
    expect(renderer.height).toBe(20)
  })

  it('should initialize pixels to transparent', () => {
    const renderer = createGraphicsRenderer(5, 5)

    const pixel = renderer.getPixel(0, 0)
    expect(pixel).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('should set pixel at valid position', () => {
    const renderer = createGraphicsRenderer(5, 5)
    renderer.setPixel(2, 3, RED)

    expect(renderer.getPixel(2, 3)).toEqual(RED)
  })

  it('should ignore setPixel at invalid position', () => {
    const renderer = createGraphicsRenderer(5, 5)

    // Should not throw
    expect(() => renderer.setPixel(-1, 0, RED)).not.toThrow()
    expect(() => renderer.setPixel(0, -1, RED)).not.toThrow()
    expect(() => renderer.setPixel(100, 0, RED)).not.toThrow()
    expect(() => renderer.setPixel(0, 100, RED)).not.toThrow()
  })

  it('should return transparent for getPixel at invalid position', () => {
    const renderer = createGraphicsRenderer(5, 5)

    expect(renderer.getPixel(-1, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(renderer.getPixel(100, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('should fill all pixels with color', () => {
    const renderer = createGraphicsRenderer(3, 3)
    renderer.fill(BLUE)

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(renderer.getPixel(x, y)).toEqual(BLUE)
      }
    }
  })

  it('should clear all pixels to transparent', () => {
    const renderer = createGraphicsRenderer(3, 3)
    renderer.fill(RED)
    renderer.clear()

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(renderer.getPixel(x, y)).toEqual({ r: 0, g: 0, b: 0, a: 0 })
      }
    }
  })

  it('should render using specified protocol', () => {
    const renderer = createGraphicsRenderer(5, 5)
    renderer.fill(WHITE)

    const sixelResult = renderer.render('sixel')
    expect(sixelResult.startsWith('\x1bP')).toBe(true)

    const kittyResult = renderer.render('kitty')
    expect(kittyResult.startsWith('\x1b_G')).toBe(true)

    const itermResult = renderer.render('iterm2')
    expect(itermResult.startsWith('\x1b]1337;')).toBe(true)
  })

  it('should return message when protocol is none', () => {
    const renderer = createGraphicsRenderer(5, 5)

    const result = renderer.render('none')
    expect(result).toContain('Graphics not supported')
  })

  it('should return copy of pixels via getPixels', () => {
    const renderer = createGraphicsRenderer(2, 2)
    renderer.setPixel(0, 0, RED)
    renderer.setPixel(1, 1, BLUE)

    const pixels = renderer.getPixels()

    expect(pixels.length).toBe(4)
    expect(pixels[0]).toEqual(RED)
    expect(pixels[3]).toEqual(BLUE)

    // Modifying returned array should not affect renderer
    pixels[0] = GREEN
    expect(renderer.getPixel(0, 0)).toEqual(RED)
  })
})

describe('color palette optimization', () => {
  it('should limit palette to 256 colors', () => {
    // Create 300 unique colors
    const pixels: typeof RED[] = []
    for (let i = 0; i < 300; i++) {
      pixels.push({ r: i % 256, g: (i * 7) % 256, b: (i * 13) % 256, a: 255 })
    }

    const result = encodeToSixel(pixels, 300, 1)

    // Count palette entries
    const paletteEntries = result.match(/#\d+;2;\d+;\d+;\d+/g) || []
    expect(paletteEntries.length).toBeLessThanOrEqual(256)
  })

  it('should prioritize most frequent colors', () => {
    // 100 red pixels, 10 green pixels, 1 blue pixel
    const pixels: typeof RED[] = []
    for (let i = 0; i < 100; i++) pixels.push(RED)
    for (let i = 0; i < 10; i++) pixels.push(GREEN)
    pixels.push(BLUE)

    const result = encodeToSixel(pixels, 111, 1)

    // Red should be color 0 (most frequent)
    expect(result).toContain('#0;2;100;0;0')
  })

  it('should find closest color for out-of-palette pixels', () => {
    // Create exactly 256 colors, then add a 257th
    const pixels: typeof RED[] = []
    for (let i = 0; i < 256; i++) {
      pixels.push({ r: i, g: 0, b: 0, a: 255 })
    }
    // Add one more unique color that will need closest match
    pixels.push({ r: 128, g: 128, b: 128, a: 255 })

    // Should not throw
    expect(() => encodeToSixel(pixels, 257, 1)).not.toThrow()
  })
})

describe('sixel run-length encoding', () => {
  it('should not use RLE for less than 3 repetitions', () => {
    // Two identical pixels
    const pixels = [RED, RED]
    const result = encodeToSixel(pixels, 2, 1)

    // Should not contain RLE marker for 2 repetitions
    expect(result).not.toContain('!2')
  })

  it('should use RLE for 3 or more repetitions', () => {
    // Three identical pixels
    const pixels = [RED, RED, RED]
    const result = encodeToSixel(pixels, 3, 1)

    // Should contain RLE marker
    expect(result).toContain('!3')
  })

  it('should handle alternating colors without RLE', () => {
    const pixels = [RED, GREEN, RED, GREEN]
    const result = encodeToSixel(pixels, 4, 1)

    // Should have multiple color selections
    expect(result.match(/#\d+[^;]/g)?.length).toBeGreaterThan(1)
  })
})

describe('sixel band handling', () => {
  it('should use $ for carriage return within band', () => {
    // Create image with multiple colors in same row
    const pixels = [RED, GREEN, BLUE]
    const result = encodeToSixel(pixels, 3, 1)

    // $ is used between colors in same band
    expect(result).toContain('$')
  })

  it('should use - for line feed between bands', () => {
    // Create image taller than 6 pixels (2 bands)
    const pixels = Array(14).fill(RED) // 7 rows = 2 bands
    const result = encodeToSixel(pixels, 2, 7)

    // - is used between bands
    expect(result).toContain('-')
  })
})
