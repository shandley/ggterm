/**
 * Tests for geometry functions
 */

import { describe, expect, it } from 'bun:test'
import { geom_point } from '@ggterm/spec/geoms/point'
import { geom_line, geom_hline, geom_vline } from '@ggterm/spec/geoms/line'
import { geom_bar, geom_col } from '@ggterm/spec/geoms/bar'
import { geom_area, geom_ribbon } from '@ggterm/spec/geoms/area'
import { geom_histogram } from '@ggterm/spec/geoms/histogram'
import { geom_boxplot } from '@ggterm/spec/geoms/boxplot'
import { geom_segment, geom_curve } from '@ggterm/spec/geoms/segment'
import { geom_violin } from '@ggterm/spec/geoms/violin'
import { geom_text, geom_label } from '@ggterm/spec/geoms/text'
import { geom_tile, geom_raster } from '@ggterm/spec/geoms/tile'
import { geom_errorbar, geom_errorbarh, geom_crossbar, geom_linerange, geom_pointrange } from '@ggterm/spec/geoms/errorbar'
import { geom_contour, geom_contour_filled, geom_density_2d } from '@ggterm/spec/geoms/contour'
import { geom_rect, geom_abline } from '@ggterm/spec/geoms/rect'

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

describe('geom_area', () => {
  it('should create an area geometry', () => {
    const geom = geom_area()
    expect(geom.type).toBe('area')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('stack')
  })

  it('should have default alpha of 0.5', () => {
    const geom = geom_area()
    expect(geom.params.alpha).toBe(0.5)
  })

  it('should accept custom alpha', () => {
    const geom = geom_area({ alpha: 0.8 })
    expect(geom.params.alpha).toBe(0.8)
  })

  it('should accept custom colors', () => {
    const geom = geom_area({ color: '#000', fill: '#fff' })
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#fff')
  })
})

describe('geom_ribbon', () => {
  it('should create a ribbon geometry', () => {
    const geom = geom_ribbon()
    expect(geom.type).toBe('ribbon')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default alpha of 0.3', () => {
    const geom = geom_ribbon()
    expect(geom.params.alpha).toBe(0.3)
  })

  it('should accept custom options', () => {
    const geom = geom_ribbon({ alpha: 0.5, color: '#111', fill: '#222' })
    expect(geom.params.alpha).toBe(0.5)
    expect(geom.params.color).toBe('#111')
    expect(geom.params.fill).toBe('#222')
  })
})

describe('geom_histogram', () => {
  it('should create a histogram geometry', () => {
    const geom = geom_histogram()
    expect(geom.type).toBe('histogram')
    expect(geom.stat).toBe('bin')
  })

  it('should have default 30 bins', () => {
    const geom = geom_histogram()
    expect(geom.params.bins).toBe(30)
  })

  it('should accept custom bins', () => {
    const geom = geom_histogram({ bins: 50 })
    expect(geom.params.bins).toBe(50)
  })

  it('should accept binwidth', () => {
    const geom = geom_histogram({ binwidth: 5 })
    expect(geom.params.binwidth).toBe(5)
  })

  it('should accept center and boundary', () => {
    const geom = geom_histogram({ center: 0, boundary: 10 })
    expect(geom.params.center).toBe(0)
    expect(geom.params.boundary).toBe(10)
  })

  it('should accept color and fill', () => {
    const geom = geom_histogram({ color: '#000', fill: '#ccc' })
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#ccc')
  })

  it('should have default alpha of 1', () => {
    const geom = geom_histogram()
    expect(geom.params.alpha).toBe(1)
  })
})

describe('geom_boxplot', () => {
  it('should create a boxplot geometry', () => {
    const geom = geom_boxplot()
    expect(geom.type).toBe('boxplot')
    expect(geom.stat).toBe('boxplot')
  })

  it('should have default width of 0.75', () => {
    const geom = geom_boxplot()
    expect(geom.params.width).toBe(0.75)
  })

  it('should have default coef of 1.5', () => {
    const geom = geom_boxplot()
    expect(geom.params.coef).toBe(1.5)
  })

  it('should show outliers by default', () => {
    const geom = geom_boxplot()
    expect(geom.params.outliers).toBe(true)
  })

  it('should not show notch by default', () => {
    const geom = geom_boxplot()
    expect(geom.params.notch).toBe(false)
  })

  it('should accept custom options', () => {
    const geom = geom_boxplot({
      width: 0.5,
      coef: 2,
      outliers: false,
      notch: true,
      alpha: 0.8,
      color: '#000',
      fill: '#fff',
    })
    expect(geom.params.width).toBe(0.5)
    expect(geom.params.coef).toBe(2)
    expect(geom.params.outliers).toBe(false)
    expect(geom.params.notch).toBe(true)
    expect(geom.params.alpha).toBe(0.8)
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#fff')
  })
})

describe('geom_segment', () => {
  it('should create a segment geometry', () => {
    const geom = geom_segment()
    expect(geom.type).toBe('segment')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default parameters', () => {
    const geom = geom_segment()
    expect(geom.params.linewidth).toBe(1)
    expect(geom.params.linetype).toBe('solid')
    expect(geom.params.alpha).toBe(1)
    expect(geom.params.arrow).toBe(false)
    expect(geom.params.arrowType).toBe('closed')
  })

  it('should accept custom options', () => {
    const geom = geom_segment({
      linewidth: 2,
      linetype: 'dashed',
      alpha: 0.5,
      color: '#ff0000',
      arrow: true,
      arrowType: 'open',
    })
    expect(geom.params.linewidth).toBe(2)
    expect(geom.params.linetype).toBe('dashed')
    expect(geom.params.alpha).toBe(0.5)
    expect(geom.params.color).toBe('#ff0000')
    expect(geom.params.arrow).toBe(true)
    expect(geom.params.arrowType).toBe('open')
  })
})

describe('geom_curve', () => {
  it('should create a segment geometry (curve renders as segment)', () => {
    const geom = geom_curve()
    expect(geom.type).toBe('segment')
  })

  it('should have default curvature of 0.5', () => {
    const geom = geom_curve()
    expect(geom.params.curvature).toBe(0.5)
  })

  it('should accept custom curvature', () => {
    const geom = geom_curve({ curvature: -0.3 })
    expect(geom.params.curvature).toBe(-0.3)
  })

  it('should accept segment options', () => {
    const geom = geom_curve({ linewidth: 2, arrow: true })
    expect(geom.params.linewidth).toBe(2)
    expect(geom.params.arrow).toBe(true)
  })
})

describe('geom_violin', () => {
  it('should create a violin geometry', () => {
    const geom = geom_violin()
    expect(geom.type).toBe('violin')
    expect(geom.stat).toBe('ydensity')
  })

  it('should have default width of 0.8', () => {
    const geom = geom_violin()
    expect(geom.params.width).toBe(0.8)
  })

  it('should draw quartile lines by default', () => {
    const geom = geom_violin()
    expect(geom.params.draw_quantiles).toEqual([0.25, 0.5, 0.75])
  })

  it('should default to area scaling', () => {
    const geom = geom_violin()
    expect(geom.params.scale).toBe('area')
  })

  it('should trim by default', () => {
    const geom = geom_violin()
    expect(geom.params.trim).toBe(true)
  })

  it('should have default adjust of 1', () => {
    const geom = geom_violin()
    expect(geom.params.adjust).toBe(1)
  })

  it('should have default alpha of 0.8', () => {
    const geom = geom_violin()
    expect(geom.params.alpha).toBe(0.8)
  })

  it('should accept custom options', () => {
    const geom = geom_violin({
      width: 0.5,
      draw_quantiles: [0.5],
      scale: 'width',
      trim: false,
      adjust: 2,
      alpha: 0.6,
      color: '#000',
      fill: '#ccc',
    })
    expect(geom.params.width).toBe(0.5)
    expect(geom.params.draw_quantiles).toEqual([0.5])
    expect(geom.params.scale).toBe('width')
    expect(geom.params.trim).toBe(false)
    expect(geom.params.adjust).toBe(2)
    expect(geom.params.alpha).toBe(0.6)
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#ccc')
  })
})

describe('geom_text', () => {
  it('should create a text geometry', () => {
    const geom = geom_text()
    expect(geom.type).toBe('text')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default parameters', () => {
    const geom = geom_text()
    expect(geom.params.nudge_x).toBe(0)
    expect(geom.params.nudge_y).toBe(0)
    expect(geom.params.hjust).toBe('center')
    expect(geom.params.vjust).toBe('middle')
    expect(geom.params.size).toBe(1)
  })

  it('should accept custom nudge', () => {
    const geom = geom_text({ nudge_x: 5, nudge_y: -3 })
    expect(geom.params.nudge_x).toBe(5)
    expect(geom.params.nudge_y).toBe(-3)
  })

  it('should accept custom justification', () => {
    const geom = geom_text({ hjust: 'left', vjust: 'top' })
    expect(geom.params.hjust).toBe('left')
    expect(geom.params.vjust).toBe('top')
  })

  it('should accept custom color and size', () => {
    const geom = geom_text({ color: '#ff0000', size: 2 })
    expect(geom.params.color).toBe('#ff0000')
    expect(geom.params.size).toBe(2)
  })
})

describe('geom_label', () => {
  it('should create a label geometry', () => {
    const geom = geom_label({})
    expect(geom.type).toBe('label')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should accept fill option', () => {
    const geom = geom_label({ fill: '#ffffff' })
    expect(geom.params.fill).toBe('#ffffff')
  })

  it('should accept text options', () => {
    const geom = geom_label({ nudge_x: 2, hjust: 'right', color: '#000' })
    expect(geom.params.nudge_x).toBe(2)
    expect(geom.params.hjust).toBe('right')
    expect(geom.params.color).toBe('#000')
  })
})

describe('geom_tile', () => {
  it('should create a tile geometry', () => {
    const geom = geom_tile()
    expect(geom.type).toBe('tile')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default alpha of 1', () => {
    const geom = geom_tile()
    expect(geom.params.alpha).toBe(1)
  })

  it('should accept custom dimensions', () => {
    const geom = geom_tile({ width: 10, height: 5 })
    expect(geom.params.width).toBe(10)
    expect(geom.params.height).toBe(5)
  })

  it('should accept custom colors', () => {
    const geom = geom_tile({ color: '#000', fill: '#fff' })
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#fff')
  })
})

describe('geom_raster', () => {
  it('should be an alias for geom_tile', () => {
    const geom = geom_raster()
    expect(geom.type).toBe('tile')
  })

  it('should accept tile options', () => {
    const geom = geom_raster({ alpha: 0.5 })
    expect(geom.params.alpha).toBe(0.5)
  })
})

describe('geom_errorbar', () => {
  it('should create an errorbar geometry', () => {
    const geom = geom_errorbar()
    expect(geom.type).toBe('errorbar')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default width of 0.5', () => {
    const geom = geom_errorbar()
    expect(geom.params.width).toBe(0.5)
  })

  it('should have default linetype of solid', () => {
    const geom = geom_errorbar()
    expect(geom.params.linetype).toBe('solid')
  })

  it('should accept custom options', () => {
    const geom = geom_errorbar({
      width: 0.3,
      alpha: 0.8,
      color: '#ff0000',
      linetype: 'dashed',
    })
    expect(geom.params.width).toBe(0.3)
    expect(geom.params.alpha).toBe(0.8)
    expect(geom.params.color).toBe('#ff0000')
    expect(geom.params.linetype).toBe('dashed')
  })
})

describe('geom_errorbarh', () => {
  it('should create a horizontal errorbar geometry', () => {
    const geom = geom_errorbarh()
    expect(geom.type).toBe('errorbarh')
    expect(geom.stat).toBe('identity')
  })

  it('should accept errorbar options', () => {
    const geom = geom_errorbarh({ width: 0.4, color: '#000' })
    expect(geom.params.width).toBe(0.4)
    expect(geom.params.color).toBe('#000')
  })
})

describe('geom_crossbar', () => {
  it('should create a crossbar geometry', () => {
    const geom = geom_crossbar()
    expect(geom.type).toBe('crossbar')
  })

  it('should have default fatten of 2.5', () => {
    const geom = geom_crossbar()
    expect(geom.params.fatten).toBe(2.5)
  })

  it('should accept custom fatten', () => {
    const geom = geom_crossbar({ fatten: 4 })
    expect(geom.params.fatten).toBe(4)
  })
})

describe('geom_linerange', () => {
  it('should create a linerange geometry', () => {
    const geom = geom_linerange()
    expect(geom.type).toBe('linerange')
  })

  it('should not have width parameter', () => {
    const geom = geom_linerange()
    expect(geom.params.width).toBeUndefined()
  })

  it('should accept color and linetype', () => {
    const geom = geom_linerange({ color: '#000', linetype: 'dotted' })
    expect(geom.params.color).toBe('#000')
    expect(geom.params.linetype).toBe('dotted')
  })
})

describe('geom_pointrange', () => {
  it('should create a pointrange geometry', () => {
    const geom = geom_pointrange()
    expect(geom.type).toBe('pointrange')
  })

  it('should have default fatten of 4', () => {
    const geom = geom_pointrange()
    expect(geom.params.fatten).toBe(4)
  })

  it('should accept custom fatten', () => {
    const geom = geom_pointrange({ fatten: 6 })
    expect(geom.params.fatten).toBe(6)
  })
})

describe('geom_contour', () => {
  it('should create a contour geometry', () => {
    const geom = geom_contour()
    expect(geom.type).toBe('contour')
    expect(geom.stat).toBe('contour')
    expect(geom.position).toBe('identity')
  })

  it('should have default 10 bins', () => {
    const geom = geom_contour()
    expect(geom.params.bins).toBe(10)
  })

  it('should have default solid linetype', () => {
    const geom = geom_contour()
    expect(geom.params.linetype).toBe('solid')
  })

  it('should accept custom breaks', () => {
    const geom = geom_contour({ breaks: [10, 20, 30] })
    expect(geom.params.breaks).toEqual([10, 20, 30])
  })

  it('should accept bandwidth', () => {
    const geom = geom_contour({ bandwidth: 5 })
    expect(geom.params.bandwidth).toBe(5)
  })

  it('should accept array bandwidth', () => {
    const geom = geom_contour({ bandwidth: [3, 5] })
    expect(geom.params.bandwidth).toEqual([3, 5])
  })

  it('should accept custom options', () => {
    const geom = geom_contour({
      bins: 20,
      alpha: 0.5,
      color: '#00ff00',
      linetype: 'dashed',
    })
    expect(geom.params.bins).toBe(20)
    expect(geom.params.alpha).toBe(0.5)
    expect(geom.params.color).toBe('#00ff00')
    expect(geom.params.linetype).toBe('dashed')
  })
})

describe('geom_contour_filled', () => {
  it('should create a filled contour geometry', () => {
    const geom = geom_contour_filled()
    expect(geom.type).toBe('contour_filled')
    expect(geom.stat).toBe('contour')
  })

  it('should have filled param set to true', () => {
    const geom = geom_contour_filled()
    expect(geom.params.filled).toBe(true)
  })

  it('should accept contour options', () => {
    const geom = geom_contour_filled({ bins: 15, alpha: 0.7 })
    expect(geom.params.bins).toBe(15)
    expect(geom.params.alpha).toBe(0.7)
  })
})

describe('geom_density_2d', () => {
  it('should create a 2D density contour geometry', () => {
    const geom = geom_density_2d()
    expect(geom.type).toBe('contour')
    expect(geom.stat).toBe('density_2d')
  })

  it('should accept contour options', () => {
    const geom = geom_density_2d({ bins: 8, bandwidth: 2 })
    expect(geom.params.bins).toBe(8)
    expect(geom.params.bandwidth).toBe(2)
  })
})

describe('geom_rect', () => {
  it('should create a rect geometry', () => {
    const geom = geom_rect()
    expect(geom.type).toBe('rect')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default alpha of 0.5', () => {
    const geom = geom_rect()
    expect(geom.params.alpha).toBe(0.5)
  })

  it('should have default solid linetype', () => {
    const geom = geom_rect()
    expect(geom.params.linetype).toBe('solid')
  })

  it('should accept custom options', () => {
    const geom = geom_rect({
      alpha: 0.8,
      color: '#000',
      fill: '#fff',
      linetype: 'dashed',
    })
    expect(geom.params.alpha).toBe(0.8)
    expect(geom.params.color).toBe('#000')
    expect(geom.params.fill).toBe('#fff')
    expect(geom.params.linetype).toBe('dashed')
  })
})

describe('geom_abline', () => {
  it('should create an abline geometry', () => {
    const geom = geom_abline()
    expect(geom.type).toBe('abline')
    expect(geom.stat).toBe('identity')
    expect(geom.position).toBe('identity')
  })

  it('should have default slope of 1', () => {
    const geom = geom_abline()
    expect(geom.params.slope).toBe(1)
  })

  it('should have default intercept of 0', () => {
    const geom = geom_abline()
    expect(geom.params.intercept).toBe(0)
  })

  it('should accept custom slope and intercept', () => {
    const geom = geom_abline({ slope: 2, intercept: 5 })
    expect(geom.params.slope).toBe(2)
    expect(geom.params.intercept).toBe(5)
  })

  it('should accept styling options', () => {
    const geom = geom_abline({
      alpha: 0.5,
      color: '#ff0000',
      linetype: 'dotted',
    })
    expect(geom.params.alpha).toBe(0.5)
    expect(geom.params.color).toBe('#ff0000')
    expect(geom.params.linetype).toBe('dotted')
  })
})
