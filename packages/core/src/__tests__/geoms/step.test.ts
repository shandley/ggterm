/**
 * Tests for geom_step
 */

import { describe, expect, it } from 'bun:test'
import { geom_step } from '../../geoms/step'
import { gg } from '../../grammar'
import { geom_point, geom_line } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('geom_step', () => {
  describe('geom creation', () => {
    it('should create step geom with defaults', () => {
      const geom = geom_step()
      expect(geom.type).toBe('step')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
    })

    it('should have default direction of hv', () => {
      const geom = geom_step()
      expect(geom.params.direction).toBe('hv')
    })

    it('should have default linewidth of 1', () => {
      const geom = geom_step()
      expect(geom.params.linewidth).toBe(1)
    })

    it('should have default linetype of solid', () => {
      const geom = geom_step()
      expect(geom.params.linetype).toBe('solid')
    })

    it('should have default alpha of 1', () => {
      const geom = geom_step()
      expect(geom.params.alpha).toBe(1)
    })

    it('should accept direction option hv', () => {
      const geom = geom_step({ direction: 'hv' })
      expect(geom.params.direction).toBe('hv')
    })

    it('should accept direction option vh', () => {
      const geom = geom_step({ direction: 'vh' })
      expect(geom.params.direction).toBe('vh')
    })

    it('should accept direction option mid', () => {
      const geom = geom_step({ direction: 'mid' })
      expect(geom.params.direction).toBe('mid')
    })

    it('should accept linewidth option', () => {
      const geom = geom_step({ linewidth: 2 })
      expect(geom.params.linewidth).toBe(2)
    })

    it('should accept linetype option', () => {
      const geom = geom_step({ linetype: 'dashed' })
      expect(geom.params.linetype).toBe('dashed')
    })

    it('should accept alpha option', () => {
      const geom = geom_step({ alpha: 0.5 })
      expect(geom.params.alpha).toBe(0.5)
    })

    it('should accept color option', () => {
      const geom = geom_step({ color: '#ff0000' })
      expect(geom.params.color).toBe('#ff0000')
    })
  })

  describe('rendering', () => {
    // Time series data (like stock prices)
    const timeSeriesData = [
      { time: 0, value: 10 },
      { time: 1, value: 15 },
      { time: 2, value: 12 },
      { time: 3, value: 18 },
      { time: 4, value: 20 },
    ]

    it('should render step plot with default direction (hv)', () => {
      const spec = gg(timeSeriesData)
        .aes({ x: 'time', y: 'value' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(40)
      expect(canvas.height).toBe(15)
    })

    it('should render step plot with vh direction', () => {
      const spec = gg(timeSeriesData)
        .aes({ x: 'time', y: 'value' })
        .geom(geom_step({ direction: 'vh' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render step plot with mid direction', () => {
      const spec = gg(timeSeriesData)
        .aes({ x: 'time', y: 'value' })
        .geom(geom_step({ direction: 'mid' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render step with custom color', () => {
      const spec = gg(timeSeriesData)
        .aes({ x: 'time', y: 'value' })
        .geom(geom_step({ color: '#00ff00' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('grouping', () => {
    const groupedData = [
      { x: 1, y: 10, group: 'A' },
      { x: 2, y: 15, group: 'A' },
      { x: 3, y: 12, group: 'A' },
      { x: 1, y: 5, group: 'B' },
      { x: 2, y: 8, group: 'B' },
      { x: 3, y: 6, group: 'B' },
    ]

    it('should render separate steps for each color group', () => {
      const spec = gg(groupedData)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render separate steps for each group aesthetic', () => {
      const spec = gg(groupedData)
        .aes({ x: 'x', y: 'y', group: 'group' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('with other geoms', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 15 },
      { x: 3, y: 12 },
      { x: 4, y: 18 },
    ]

    it('should render step over scatter points', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_step())
        .spec()

      expect(spec.geoms).toHaveLength(2)
      expect(spec.geoms[0].type).toBe('point')
      expect(spec.geoms[1].type).toBe('step')

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render step and line together for comparison', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_line())
        .geom(geom_step({ direction: 'vh' }))
        .spec()

      expect(spec.geoms).toHaveLength(2)
      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const spec = gg([])
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      // Should not throw
      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle single data point', () => {
      const data = [{ x: 1, y: 10 }]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      // Should not throw (but won't draw anything)
      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle two data points', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle horizontal line (constant y)', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 10 },
        { x: 3, y: 10 },
        { x: 4, y: 10 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle negative values', () => {
      const data = [
        { x: -2, y: -10 },
        { x: -1, y: 5 },
        { x: 0, y: -3 },
        { x: 1, y: 8 },
        { x: 2, y: -2 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle unsorted x values', () => {
      const data = [
        { x: 3, y: 30 },
        { x: 1, y: 10 },
        { x: 4, y: 40 },
        { x: 2, y: 20 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_step())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('use cases', () => {
    it('should work for stock price visualization', () => {
      const stockData = [
        { day: 1, price: 100 },
        { day: 2, price: 105 },
        { day: 3, price: 102 },
        { day: 4, price: 108 },
        { day: 5, price: 115 },
      ]

      const spec = gg(stockData)
        .aes({ x: 'day', y: 'price' })
        .geom(geom_step())
        .labs({ title: 'Stock Price', x: 'Day', y: 'Price' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should work for cumulative count', () => {
      const cumulativeData = [
        { time: 0, count: 0 },
        { time: 1, count: 5 },
        { time: 2, count: 12 },
        { time: 3, count: 15 },
        { time: 4, count: 28 },
      ]

      const spec = gg(cumulativeData)
        .aes({ x: 'time', y: 'count' })
        .geom(geom_step({ direction: 'vh' }))
        .labs({ title: 'Cumulative Events', x: 'Time', y: 'Count' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should work for state machine visualization', () => {
      const stateData = [
        { time: 0, state: 0 },
        { time: 1, state: 1 },
        { time: 3, state: 0 },
        { time: 5, state: 2 },
        { time: 7, state: 1 },
      ]

      const spec = gg(stateData)
        .aes({ x: 'time', y: 'state' })
        .geom(geom_step())
        .labs({ title: 'State Machine', x: 'Time', y: 'State' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 15 })
      expect(canvas).toBeDefined()
    })
  })
})
