/**
 * Tests for geometry functions
 */

import { describe, expect, it } from 'bun:test'
import { geom_point } from '../../geoms/point'
import { geom_line, geom_hline, geom_vline } from '../../geoms/line'
import { geom_bar, geom_col } from '../../geoms/bar'

describe('geom_point', () => {
  it('should create a point geometry', () => {
    const geom = geom_point()
    expect(geom.type).toBe('point')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default parameters', () => {
    const geom = geom_point()
    expect(geom.params.size).toBe(1)
    expect(geom.params.shape).toBe('circle')
    expect(geom.params.alpha).toBe(1)
  })

  it('should accept custom size', () => {
    const geom = geom_point({ size: 3 })
    expect(geom.params.size).toBe(3)
  })

  it('should accept custom shape', () => {
    const geom = geom_point({ shape: 'square' })
    expect(geom.params.shape).toBe('square')
  })

  it('should accept custom alpha', () => {
    const geom = geom_point({ alpha: 0.5 })
    expect(geom.params.alpha).toBe(0.5)
  })

  it('should accept custom color', () => {
    const geom = geom_point({ color: '#ff0000' })
    expect(geom.params.color).toBe('#ff0000')
  })

  it('should accept all shapes', () => {
    const shapes = ['circle', 'square', 'triangle', 'cross', 'diamond'] as const
    for (const shape of shapes) {
      const geom = geom_point({ shape })
      expect(geom.params.shape).toBe(shape)
    }
  })
})

describe('geom_line', () => {
  it('should create a line geometry', () => {
    const geom = geom_line()
    expect(geom.type).toBe('line')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default parameters', () => {
    const geom = geom_line()
    expect(geom.params.linewidth).toBe(1)
    expect(geom.params.linetype).toBe('solid')
    expect(geom.params.alpha).toBe(1)
  })

  it('should accept custom linewidth', () => {
    const geom = geom_line({ linewidth: 2 })
    expect(geom.params.linewidth).toBe(2)
  })

  it('should accept custom linetype', () => {
    const geom = geom_line({ linetype: 'dashed' })
    expect(geom.params.linetype).toBe('dashed')
  })

  it('should accept dotted linetype', () => {
    const geom = geom_line({ linetype: 'dotted' })
    expect(geom.params.linetype).toBe('dotted')
  })

  it('should accept custom color', () => {
    const geom = geom_line({ color: '#00ff00' })
    expect(geom.params.color).toBe('#00ff00')
  })
})

describe('geom_hline', () => {
  it('should create a horizontal line geometry', () => {
    const geom = geom_hline({ yintercept: 10 })
    expect(geom.type).toBe('hline')
  })

  it('should store yintercept', () => {
    const geom = geom_hline({ yintercept: 25.5 })
    expect(geom.params.yintercept).toBe(25.5)
  })

  it('should default to dashed linetype', () => {
    const geom = geom_hline({ yintercept: 10 })
    expect(geom.params.linetype).toBe('dashed')
  })

  it('should accept custom linetype', () => {
    const geom = geom_hline({ yintercept: 10, linetype: 'solid' })
    expect(geom.params.linetype).toBe('solid')
  })

  it('should accept custom color', () => {
    const geom = geom_hline({ yintercept: 10, color: 'red' })
    expect(geom.params.color).toBe('red')
  })
})

describe('geom_vline', () => {
  it('should create a vertical line geometry', () => {
    const geom = geom_vline({ xintercept: 5 })
    expect(geom.type).toBe('vline')
  })

  it('should store xintercept', () => {
    const geom = geom_vline({ xintercept: 15.5 })
    expect(geom.params.xintercept).toBe(15.5)
  })

  it('should default to dashed linetype', () => {
    const geom = geom_vline({ xintercept: 5 })
    expect(geom.params.linetype).toBe('dashed')
  })

  it('should accept custom linetype', () => {
    const geom = geom_vline({ xintercept: 5, linetype: 'dotted' })
    expect(geom.params.linetype).toBe('dotted')
  })
})

describe('geom_bar', () => {
  it('should create a bar geometry', () => {
    const geom = geom_bar()
    expect(geom.type).toBe('bar')
  })

  it('should default to count stat', () => {
    const geom = geom_bar()
    expect(geom.stat).toBe('count')
  })

  it('should default to stack position', () => {
    const geom = geom_bar()
    expect(geom.position).toBe('stack')
  })

  it('should have default width', () => {
    const geom = geom_bar()
    expect(geom.params.width).toBe(0.9)
  })

  it('should accept identity stat', () => {
    const geom = geom_bar({ stat: 'identity' })
    expect(geom.stat).toBe('identity')
  })

  it('should accept custom width', () => {
    const geom = geom_bar({ width: 0.5 })
    expect(geom.params.width).toBe(0.5)
  })

  it('should accept dodge position', () => {
    const geom = geom_bar({ position: 'dodge' })
    expect(geom.position).toBe('dodge')
  })

  it('should accept fill position', () => {
    const geom = geom_bar({ position: 'fill' })
    expect(geom.position).toBe('fill')
  })

  it('should accept custom colors', () => {
    const geom = geom_bar({ color: '#000000', fill: '#ffffff' })
    expect(geom.params.color).toBe('#000000')
    expect(geom.params.fill).toBe('#ffffff')
  })
})

describe('geom_col', () => {
  it('should create a column geometry', () => {
    const geom = geom_col()
    expect(geom.type).toBe('bar')
  })

  it('should use identity stat', () => {
    const geom = geom_col()
    expect(geom.stat).toBe('identity')
  })

  it('should accept all bar options except stat', () => {
    const geom = geom_col({
      width: 0.8,
      position: 'dodge',
      alpha: 0.7,
      color: '#111',
      fill: '#222',
    })
    expect(geom.params.width).toBe(0.8)
    expect(geom.position).toBe('dodge')
    expect(geom.params.alpha).toBe(0.7)
    expect(geom.params.color).toBe('#111')
    expect(geom.params.fill).toBe('#222')
  })
})
