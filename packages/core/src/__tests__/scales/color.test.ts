/**
 * Tests for color scales
 */

import { describe, expect, it } from 'bun:test'
import {
  scale_color_continuous,
  scale_color_viridis,
  scale_color_discrete,
  scale_color_manual,
  scale_fill_continuous,
  scale_fill_viridis,
  scale_fill_discrete,
  scale_fill_manual,
  // New palette scales
  scale_color_brewer,
  scale_fill_brewer,
  scale_color_distiller,
  scale_fill_distiller,
  scale_color_gradient,
  scale_fill_gradient,
  scale_color_gradient2,
  scale_fill_gradient2,
  scale_color_gradientn,
  scale_fill_gradientn,
  scale_color_viridis_c,
  scale_color_plasma,
  scale_color_inferno,
  scale_color_magma,
  scale_color_cividis,
  scale_color_turbo,
  scale_color_grey,
  scale_color_gray,
  scale_color_identity,
  scale_color_hue,
  getAvailablePalettes,
  getPaletteColors,
} from '../../scales/color'
import type { RGBA } from '../../types'

describe('scale_color_continuous', () => {
  it('should create a continuous color scale', () => {
    const scale = scale_color_continuous()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('color')
  })

  it('should use viridis palette by default', () => {
    const scale = scale_color_continuous()
    // At 0, should be first color (dark purple)
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBe(68)  // #440154
    expect(color0.g).toBe(1)
    expect(color0.b).toBe(84)

    // At 1, should be last color (yellow)
    const color1 = scale.map(1) as RGBA
    expect(color1.r).toBe(253)  // #fde725
    expect(color1.g).toBe(231)
    expect(color1.b).toBe(37)
  })

  it('should interpolate colors between stops', () => {
    const scale = scale_color_continuous()
    const colorMid = scale.map(0.5) as RGBA
    // Should be somewhere in the middle of the palette (greenish)
    expect(colorMid.r).toBeGreaterThan(30)
    expect(colorMid.g).toBeGreaterThan(100)
    expect(colorMid.b).toBeGreaterThan(80)
  })

  it('should clamp values to 0-1 range', () => {
    const scale = scale_color_continuous()
    const colorNeg = scale.map(-0.5) as RGBA
    const color0 = scale.map(0) as RGBA
    expect(colorNeg).toEqual(color0)

    const colorOver = scale.map(1.5) as RGBA
    const color1 = scale.map(1) as RGBA
    expect(colorOver).toEqual(color1)
  })

  it('should handle NaN with na_value', () => {
    const scale = scale_color_continuous({ na_value: '#ff0000' })
    const color = scale.map(NaN) as RGBA
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
  })

  it('should use gray for NaN by default', () => {
    const scale = scale_color_continuous()
    const color = scale.map('invalid') as RGBA
    expect(color.r).toBe(128)  // #808080
    expect(color.g).toBe(128)
    expect(color.b).toBe(128)
  })

  it('should accept custom palette', () => {
    const scale = scale_color_continuous({
      palette: ['#ff0000', '#00ff00', '#0000ff'],
    })

    const colorStart = scale.map(0) as RGBA
    expect(colorStart.r).toBe(255)
    expect(colorStart.g).toBe(0)

    const colorEnd = scale.map(1) as RGBA
    expect(colorEnd.r).toBe(0)
    expect(colorEnd.b).toBe(255)
  })

  it('should accept palette name', () => {
    const scale = scale_color_continuous({ palette: 'plasma' })
    const color = scale.map(0) as RGBA
    expect(color.r).toBe(13)  // #0d0887
    expect(color.g).toBe(8)
    expect(color.b).toBe(135)
  })
})

describe('scale_color_viridis', () => {
  it('should create viridis color scale', () => {
    const scale = scale_color_viridis()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('color')
  })

  it('should produce viridis colors', () => {
    const scale = scale_color_viridis()
    const color = scale.map(0) as RGBA
    expect(color.r).toBe(68)  // First viridis color
  })
})

describe('scale_color_discrete', () => {
  it('should create a discrete color scale', () => {
    const scale = scale_color_discrete()
    expect(scale.type).toBe('discrete')
    expect(scale.aesthetic).toBe('color')
  })

  it('should use category10 palette by default', () => {
    const scale = scale_color_discrete()
    const color = scale.map('A') as RGBA
    expect(color.r).toBe(31)  // #1f77b4
    expect(color.g).toBe(119)
    expect(color.b).toBe(180)
  })

  it('should assign different colors to different values', () => {
    const scale = scale_color_discrete()
    const colorA = scale.map('A') as RGBA
    const colorB = scale.map('B') as RGBA
    // Should be different colors
    expect(colorA.r).not.toBe(colorB.r)
  })

  it('should return same color for same value', () => {
    const scale = scale_color_discrete()
    const color1 = scale.map('test') as RGBA
    const color2 = scale.map('test') as RGBA
    expect(color1).toEqual(color2)
  })

  it('should cycle through palette for many values', () => {
    const scale = scale_color_discrete()
    // Create 11 values (more than category10's 10 colors)
    const colors: RGBA[] = []
    for (let i = 0; i < 11; i++) {
      colors.push(scale.map(`value${i}`) as RGBA)
    }
    // 11th color should cycle back to first
    expect(colors[10]).toEqual(colors[0])
  })

  it('should accept custom palette', () => {
    const scale = scale_color_discrete({
      palette: ['#ff0000', '#00ff00'],
    })
    const colorA = scale.map('A') as RGBA
    expect(colorA.r).toBe(255)
    expect(colorA.g).toBe(0)
  })
})

describe('scale_color_manual', () => {
  it('should create a manual color scale', () => {
    const scale = scale_color_manual({
      values: { A: '#ff0000', B: '#00ff00' },
    })
    expect(scale.type).toBe('discrete')
    expect(scale.aesthetic).toBe('color')
  })

  it('should map values to specified colors', () => {
    const scale = scale_color_manual({
      values: { red: '#ff0000', green: '#00ff00', blue: '#0000ff' },
    })

    const red = scale.map('red') as RGBA
    expect(red.r).toBe(255)
    expect(red.g).toBe(0)

    const green = scale.map('green') as RGBA
    expect(green.r).toBe(0)
    expect(green.g).toBe(255)

    const blue = scale.map('blue') as RGBA
    expect(blue.b).toBe(255)
  })

  it('should use na_value for unknown keys', () => {
    const scale = scale_color_manual({
      values: { A: '#ff0000' },
      na_value: '#ffffff',
    })
    const unknown = scale.map('unknown') as RGBA
    expect(unknown.r).toBe(255)
    expect(unknown.g).toBe(255)
    expect(unknown.b).toBe(255)
  })

  it('should use gray for unknown keys by default', () => {
    const scale = scale_color_manual({
      values: { A: '#ff0000' },
    })
    const unknown = scale.map('unknown') as RGBA
    expect(unknown.r).toBe(128)
    expect(unknown.g).toBe(128)
    expect(unknown.b).toBe(128)
  })
})

describe('fill scales', () => {
  describe('scale_fill_continuous', () => {
    it('should create fill aesthetic', () => {
      const scale = scale_fill_continuous()
      expect(scale.aesthetic).toBe('fill')
      expect(scale.type).toBe('continuous')
    })
  })

  describe('scale_fill_viridis', () => {
    it('should create fill aesthetic with viridis', () => {
      const scale = scale_fill_viridis()
      expect(scale.aesthetic).toBe('fill')
    })
  })

  describe('scale_fill_discrete', () => {
    it('should create discrete fill scale', () => {
      const scale = scale_fill_discrete()
      expect(scale.aesthetic).toBe('fill')
      expect(scale.type).toBe('discrete')
    })
  })

  describe('scale_fill_manual', () => {
    it('should create manual fill scale', () => {
      const scale = scale_fill_manual({
        values: { A: '#ff0000' },
      })
      expect(scale.aesthetic).toBe('fill')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NEW PALETTE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('scale_color_brewer', () => {
  it('should create a discrete brewer scale', () => {
    const scale = scale_color_brewer()
    expect(scale.type).toBe('discrete')
    expect(scale.aesthetic).toBe('color')
  })

  it('should use Set1 palette by default', () => {
    const scale = scale_color_brewer()
    const color = scale.map('A') as RGBA
    // Set1 first color is #e41a1c (red)
    expect(color.r).toBe(228)
    expect(color.g).toBe(26)
    expect(color.b).toBe(28)
  })

  it('should accept different palettes', () => {
    const scale = scale_color_brewer({ palette: 'Dark2' })
    const color = scale.map('A') as RGBA
    // Dark2 first color is #1b9e77 (teal)
    expect(color.r).toBe(27)
    expect(color.g).toBe(158)
    expect(color.b).toBe(119)
  })

  it('should reverse direction when specified', () => {
    const scale1 = scale_color_brewer({ palette: 'Set1' })
    const scale2 = scale_color_brewer({ palette: 'Set1', direction: -1 })
    const color1 = scale1.map('A') as RGBA
    const color2 = scale2.map('A') as RGBA
    // Reversed palette should have different first color
    expect(color1.r).not.toBe(color2.r)
  })
})

describe('scale_fill_brewer', () => {
  it('should create fill aesthetic', () => {
    const scale = scale_fill_brewer()
    expect(scale.aesthetic).toBe('fill')
  })
})

describe('scale_color_distiller', () => {
  it('should create a continuous brewer scale', () => {
    const scale = scale_color_distiller()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('color')
  })

  it('should use Blues palette by default', () => {
    const scale = scale_color_distiller()
    // At 0, should be light blue
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBeGreaterThan(200)
    // At 1, should be dark blue
    const color1 = scale.map(1) as RGBA
    expect(color1.r).toBeLessThan(50)
  })

  it('should interpolate between palette colors', () => {
    const scale = scale_color_distiller({ palette: 'Reds' })
    const colorMid = scale.map(0.5) as RGBA
    expect(colorMid.r).toBeGreaterThan(200)
  })
})

describe('scale_fill_distiller', () => {
  it('should create fill aesthetic', () => {
    const scale = scale_fill_distiller()
    expect(scale.aesthetic).toBe('fill')
  })
})

describe('scale_color_gradient', () => {
  it('should create a two-color gradient', () => {
    const scale = scale_color_gradient()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('color')
  })

  it('should interpolate between low and high colors', () => {
    const scale = scale_color_gradient({
      low: '#000000',
      high: '#ffffff',
    })
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBe(0)

    const color1 = scale.map(1) as RGBA
    expect(color1.r).toBe(255)

    const colorMid = scale.map(0.5) as RGBA
    expect(colorMid.r).toBeGreaterThan(100)
    expect(colorMid.r).toBeLessThan(200)
  })
})

describe('scale_fill_gradient', () => {
  it('should create fill aesthetic', () => {
    const scale = scale_fill_gradient()
    expect(scale.aesthetic).toBe('fill')
  })
})

describe('scale_color_gradient2', () => {
  it('should create a three-color diverging gradient', () => {
    const scale = scale_color_gradient2()
    expect(scale.type).toBe('continuous')
  })

  it('should interpolate through mid color', () => {
    const scale = scale_color_gradient2({
      low: '#ff0000',
      mid: '#ffffff',
      high: '#0000ff',
    })
    // At 0, should be red
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBe(255)
    expect(color0.b).toBe(0)

    // At 0.5, should be white
    const colorMid = scale.map(0.5) as RGBA
    expect(colorMid.r).toBe(255)
    expect(colorMid.g).toBe(255)
    expect(colorMid.b).toBe(255)

    // At 1, should be blue
    const color1 = scale.map(1) as RGBA
    expect(color1.r).toBe(0)
    expect(color1.b).toBe(255)
  })
})

describe('scale_fill_gradient2', () => {
  it('should create fill aesthetic', () => {
    const scale = scale_fill_gradient2()
    expect(scale.aesthetic).toBe('fill')
  })
})

describe('scale_color_gradientn', () => {
  it('should create an n-color gradient', () => {
    const scale = scale_color_gradientn({
      colors: ['#ff0000', '#00ff00', '#0000ff'],
    })
    expect(scale.type).toBe('continuous')
  })

  it('should interpolate through all colors', () => {
    const scale = scale_color_gradientn({
      colors: ['#ff0000', '#00ff00', '#0000ff'],
    })
    // At 0, should be red
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBe(255)

    // At 0.5, should be green
    const colorMid = scale.map(0.5) as RGBA
    expect(colorMid.g).toBe(255)

    // At 1, should be blue
    const color1 = scale.map(1) as RGBA
    expect(color1.b).toBe(255)
  })
})

describe('scale_fill_gradientn', () => {
  it('should create fill aesthetic', () => {
    const scale = scale_fill_gradientn({
      colors: ['#ff0000', '#0000ff'],
    })
    expect(scale.aesthetic).toBe('fill')
  })
})

describe('viridis family scales', () => {
  describe('scale_color_viridis_c', () => {
    it('should create viridis scale by default', () => {
      const scale = scale_color_viridis_c()
      expect(scale.type).toBe('continuous')
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(68)  // viridis start
    })

    it('should accept different viridis options', () => {
      const scale = scale_color_viridis_c({ option: 'plasma' })
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(13)  // plasma start
    })

    it('should reverse when direction is -1', () => {
      const scale1 = scale_color_viridis_c()
      const scale2 = scale_color_viridis_c({ direction: -1 })
      const color1 = scale1.map(0) as RGBA
      const color2 = scale2.map(0) as RGBA
      expect(color1.r).not.toBe(color2.r)
    })
  })

  describe('scale_color_plasma', () => {
    it('should create plasma scale', () => {
      const scale = scale_color_plasma()
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(13)  // #0d0887
    })
  })

  describe('scale_color_inferno', () => {
    it('should create inferno scale', () => {
      const scale = scale_color_inferno()
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(0)  // #000004
    })
  })

  describe('scale_color_magma', () => {
    it('should create magma scale', () => {
      const scale = scale_color_magma()
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(0)  // #000004
    })
  })

  describe('scale_color_cividis', () => {
    it('should create cividis scale', () => {
      const scale = scale_color_cividis()
      const color = scale.map(0) as RGBA
      expect(color.r).toBe(0)  // #002051
      expect(color.g).toBe(32)
      expect(color.b).toBe(81)
    })
  })

  describe('scale_color_turbo', () => {
    it('should create turbo scale', () => {
      const scale = scale_color_turbo()
      expect(scale.type).toBe('continuous')
    })
  })
})

describe('scale_color_grey', () => {
  it('should create a grey scale', () => {
    const scale = scale_color_grey()
    expect(scale.type).toBe('continuous')
  })

  it('should produce grey colors', () => {
    const scale = scale_color_grey()
    const color = scale.map(0.5) as RGBA
    expect(color.r).toBe(color.g)
    expect(color.g).toBe(color.b)
  })

  it('should respect start and end parameters', () => {
    const scale = scale_color_grey({ start: 0, end: 1 })
    const color0 = scale.map(0) as RGBA
    expect(color0.r).toBe(255)  // Light
    const color1 = scale.map(1) as RGBA
    expect(color1.r).toBe(0)  // Dark
  })
})

describe('scale_color_gray', () => {
  it('should be alias for scale_color_grey', () => {
    expect(scale_color_gray).toBe(scale_color_grey)
  })
})

describe('scale_color_identity', () => {
  it('should create identity scale', () => {
    const scale = scale_color_identity()
    expect(scale.type).toBe('identity')
    expect(scale.aesthetic).toBe('color')
  })

  it('should use data values directly as colors', () => {
    const scale = scale_color_identity()
    const color = scale.map('#ff0000') as RGBA
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
  })
})

describe('scale_color_hue', () => {
  it('should create hue-based scale', () => {
    const scale = scale_color_hue()
    expect(scale.type).toBe('continuous')
  })

  it('should vary hue across the range', () => {
    const scale = scale_color_hue({ h: [0, 180] })  // Use non-wrapping range
    const color0 = scale.map(0) as RGBA
    const color1 = scale.map(1) as RGBA
    // Different positions should have different hues
    // At h=0 (red) vs h=180 (cyan), colors should be distinctly different
    expect(color0.r).not.toBe(color1.r)
  })

  it('should respect hue range', () => {
    const scale = scale_color_hue({ h: [0, 360] })
    const color0 = scale.map(0) as RGBA
    const color1 = scale.map(1) as RGBA
    // At h=0 and h=360, we should get similar colors (red)
    expect(Math.abs(color0.r - color1.r)).toBeLessThan(20)
  })
})

describe('utility functions', () => {
  describe('getAvailablePalettes', () => {
    it('should return list of palette names', () => {
      const palettes = getAvailablePalettes()
      expect(Array.isArray(palettes)).toBe(true)
      expect(palettes.length).toBeGreaterThan(20)
      expect(palettes).toContain('viridis')
      expect(palettes).toContain('Set1')
      expect(palettes).toContain('Blues')
      expect(palettes).toContain('RdBu')
    })
  })

  describe('getPaletteColors', () => {
    it('should return colors for valid palette', () => {
      const colors = getPaletteColors('viridis')
      expect(Array.isArray(colors)).toBe(true)
      expect(colors!.length).toBeGreaterThan(0)
      expect(colors![0]).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should return undefined for invalid palette', () => {
      const colors = getPaletteColors('not_a_palette')
      expect(colors).toBeUndefined()
    })
  })
})
