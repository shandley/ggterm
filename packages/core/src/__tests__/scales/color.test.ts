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
