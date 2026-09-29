/**
 * Tests for StreamingPlot
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  StreamingPlot,
  createStreamingPlot,
  createTimeSeriesPlot,
} from '../../streaming/streaming-plot'
import { geom_line, geom_point } from '@ggterm/spec/geoms'

describe('StreamingPlot', () => {
  describe('initialization', () => {
    it('should create with default options', () => {
      const plot = new StreamingPlot()

      expect(plot).toBeInstanceOf(StreamingPlot)
    })

    it('should accept custom options', () => {
      const plot = new StreamingPlot({
        maxPoints: 500,
        throttleMs: 100,
      })

      const stats = plot.getBufferStats()
      expect(stats.capacity).toBe(1000) // 500 * 2
    })

    it('should initialize with empty state', () => {
      const plot = new StreamingPlot()
      const state = plot.getState()

      expect(state.totalPoints).toBe(0)
      expect(state.displayedPoints).toBe(0)
      expect(state.isRendering).toBe(false)
    })
  })

  describe('push data', () => {
    it('should push single record', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      plot.push({ x: 1, y: 10 })

      const state = plot.getState()
      expect(state.totalPoints).toBe(1)
    })

    it('should push multiple records', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      plot.pushMany([
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ])

      expect(plot.getState().totalPoints).toBe(3)
    })

    it('should be chainable', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      const result = plot.push({ x: 1, y: 10 }).push({ x: 2, y: 20 })

      expect(result).toBe(plot)
    })

    it('should track lastUpdate timestamp', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()
      const before = Date.now()

      plot.push({ x: 1, y: 10 })

      const state = plot.getState()
      expect(state.lastUpdate).toBeGreaterThanOrEqual(before)
    })
  })

  describe('getData', () => {
    it('should return pushed data', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        maxPoints: 100,
      })

      plot.pushMany([
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ])

      const data = plot.getData()
      expect(data.length).toBe(2)
      expect(data[0].x).toBe(1)
    })

    it('should limit data to maxPoints', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        maxPoints: 5,
      })

      for (let i = 0; i < 10; i++) {
        plot.push({ x: i, y: i * 10 })
      }

      const data = plot.getData()
      expect(data.length).toBe(5)
    })
  })

  describe('render', () => {
    it('should render to string', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.pushMany([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ])

      const result = plot.render({ width: 40, height: 10 })

      expect(typeof result.output).toBe('string')
      expect(result.output.length).toBeGreaterThan(0)
      expect(result.pointCount).toBe(2)
    })

    it('should track render time', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.push({ x: 1, y: 1 })

      const result = plot.render()

      expect(result.renderMs).toBeGreaterThanOrEqual(0)
    })

    it('should use custom dimensions', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.push({ x: 1, y: 1 })

      const result = plot.render({ width: 60, height: 15 })

      // Output should have lines
      const lines = result.output.split('\n')
      expect(lines.length).toBeGreaterThan(0)
    })

    it('should update isRendering state', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.push({ x: 1, y: 1 })
      plot.render()

      // After render completes, isRendering should be false
      expect(plot.getState().isRendering).toBe(false)
    })
  })

  describe('configuration methods', () => {
    it('should setSize', () => {
      const plot = new StreamingPlot()

      const result = plot.setSize(100, 50)

      expect(result).toBe(plot) // Chainable
    })

    it('should setAes', () => {
      const plot = new StreamingPlot<{ time: number; value: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.setAes({ x: 'time', y: 'value' })
      plot.push({ time: 1, value: 10 })

      // Should render without error
      const result = plot.render()
      expect(result.pointCount).toBe(1)
    })

    it('should addGeom', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
      })

      plot.addGeom(geom_point())
      plot.push({ x: 1, y: 1 })

      const result = plot.render()
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('should setGeoms (replace)', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.setGeoms([geom_line()])
      plot.pushMany([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ])

      const result = plot.render()
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('should addScale', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      // Should not throw
      plot.addScale({ type: 'continuous', aesthetic: 'x' } as any)
    })

    it('should setLabels', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })

      plot.setLabels({ title: 'My Plot', x: 'X Axis' })
      plot.push({ x: 1, y: 1 })

      const result = plot.render()
      expect(result.output).toContain('My Plot')
    })
  })

  describe('aggregations', () => {
    it('should add aggregation', () => {
      const plot = new StreamingPlot<{ x: number; value: number }>({
        aes: { x: 'x', y: 'value' },
        geoms: [geom_point()],
      })

      plot.addAggregation({
        windowSize: 3,
        field: 'value',
        type: 'mean',
      })

      plot.pushMany([
        { x: 1, value: 10 },
        { x: 2, value: 20 },
        { x: 3, value: 30 },
      ])

      const data = plot.getData()
      expect(data[2]).toHaveProperty('value_mean')
    })

    it('should initialize with aggregations', () => {
      const plot = new StreamingPlot<{ x: number; value: number }>({
        aes: { x: 'x', y: 'value' },
        geoms: [geom_point()],
        aggregations: [
          { windowSize: 2, field: 'value', type: 'sum' },
        ],
      })

      plot.push({ x: 1, value: 10 })
      plot.push({ x: 2, value: 20 })

      const data = plot.getData()
      expect(data[1].value_sum).toBe(30)
    })
  })

  describe('clear', () => {
    it('should clear all data', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      plot.pushMany([
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ])

      plot.clear()

      expect(plot.getState().totalPoints).toBe(0)
      expect(plot.getData().length).toBe(0)
    })

    it('should be chainable', () => {
      const plot = new StreamingPlot()

      const result = plot.clear()

      expect(result).toBe(plot)
    })
  })

  describe('buffer stats', () => {
    it('should report buffer stats', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        maxPoints: 100,
      })

      plot.pushMany([
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ])

      const stats = plot.getBufferStats()

      expect(stats.size).toBe(2)
      expect(stats.capacity).toBe(200) // maxPoints * 2
      expect(stats.utilization).toBe(0.01) // 2/200
    })
  })

  describe('event handling', () => {
    it('should emit data event on push', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()
      let eventFired = false

      plot.on('data', () => {
        eventFired = true
      })

      plot.push({ x: 1, y: 10 })

      expect(eventFired).toBe(true)
    })

    it('should emit render event', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>({
        aes: { x: 'x', y: 'y' },
        geoms: [geom_point()],
      })
      let renderData: unknown = null

      plot.on('render', (data) => {
        renderData = data
      })

      plot.push({ x: 1, y: 1 })
      plot.render()

      expect(renderData).not.toBeNull()
    })

    it('should emit resize event', () => {
      const plot = new StreamingPlot()
      let resizeData: unknown = null

      plot.on('resize', (data) => {
        resizeData = data
      })

      plot.setSize(100, 50)

      expect(resizeData).toEqual({ width: 100, height: 50 })
    })

    it('should allow removing event handlers', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()
      let eventCount = 0

      const handler = () => {
        eventCount++
      }

      plot.on('data', handler)
      plot.push({ x: 1, y: 10 })
      expect(eventCount).toBe(1)

      plot.off('data', handler)
      plot.push({ x: 2, y: 20 })
      expect(eventCount).toBe(1)
    })
  })

  describe('extent methods', () => {
    it('should get time extent', () => {
      const plot = new StreamingPlot<{ time: number; value: number }>({
        timeField: 'time',
      })

      const now = Date.now()
      plot.push({ time: now - 1000, value: 10 })
      plot.push({ time: now, value: 20 })

      const extent = plot.getTimeExtent()

      expect(extent).not.toBeNull()
      expect(extent!.min).toBe(now - 1000)
      expect(extent!.max).toBe(now)
    })

    it('should get field extent', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      plot.pushMany([
        { x: 1, y: 10 },
        { x: 2, y: 50 },
        { x: 3, y: 30 },
      ])

      const extent = plot.getFieldExtent('y')

      expect(extent).not.toBeNull()
      expect(extent!.min).toBe(10)
      expect(extent!.max).toBe(50)
    })

    it('should return null for empty data', () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      expect(plot.getFieldExtent('y')).toBeNull()
    })
  })

  describe('rate tracking', () => {
    it('should track points per second', async () => {
      const plot = new StreamingPlot<{ x: number; y: number }>()

      // Push multiple points quickly
      for (let i = 0; i < 10; i++) {
        plot.push({ x: i, y: i })
      }

      const state = plot.getState()
      expect(state.pointsPerSecond).toBeGreaterThan(0)
    })
  })
})

describe('createStreamingPlot', () => {
  it('should create StreamingPlot instance', () => {
    const plot = createStreamingPlot()

    expect(plot).toBeInstanceOf(StreamingPlot)
  })

  it('should accept options', () => {
    const plot = createStreamingPlot({
      maxPoints: 200,
      throttleMs: 50,
    })

    expect(plot.getBufferStats().capacity).toBe(400)
  })

  it('should accept type parameter', () => {
    interface CustomData {
      timestamp: number
      value: number
    }

    const plot = createStreamingPlot<CustomData>({
      timeField: 'timestamp',
    })

    plot.push({ timestamp: Date.now(), value: 100 })
    expect(plot.getData()[0].value).toBe(100)
  })
})

describe('createTimeSeriesPlot', () => {
  it('should create time series plot', () => {
    const plot = createTimeSeriesPlot({})

    expect(plot).toBeInstanceOf(StreamingPlot)
  })

  it('should use default field names', () => {
    const plot = createTimeSeriesPlot<{ time: number; value: number }>({})

    plot.push({ time: 1, value: 10 })

    expect(plot.getData().length).toBe(1)
  })

  it('should accept custom field names', () => {
    const plot = createTimeSeriesPlot<{ ts: number; val: number }>({
      timeField: 'ts',
      valueField: 'val',
    })

    plot.push({ ts: 1, val: 10 })

    expect(plot.getData().length).toBe(1)
  })

  it('should accept title', () => {
    const plot = createTimeSeriesPlot<{ time: number; value: number }>({
      title: 'My Time Series',
    })

    plot.push({ time: 1, value: 10 })

    // Title should be in rendered output
    const result = plot.render({ width: 40, height: 10 })
    expect(result.output).toContain('My Time Series')
  })

  it('should accept maxPoints', () => {
    const plot = createTimeSeriesPlot<{ time: number; value: number }>({
      maxPoints: 50,
    })

    for (let i = 0; i < 100; i++) {
      plot.push({ time: i, value: i })
    }

    expect(plot.getData().length).toBe(50)
  })

  it('should accept timeWindow', () => {
    const plot = createTimeSeriesPlot<{ time: number; value: number }>({
      timeWindow: 5000, // 5 seconds
    })

    expect(plot).toBeInstanceOf(StreamingPlot)
  })
})

describe('edge cases', () => {
  it('should handle empty render', () => {
    const plot = new StreamingPlot<{ x: number; y: number }>({
      aes: { x: 'x', y: 'y' },
      geoms: [geom_point()],
    })

    // Render with no data
    const result = plot.render()

    expect(result.pointCount).toBe(0)
  })

  it('should handle rapid pushes', () => {
    const plot = new StreamingPlot<{ x: number; y: number }>()

    for (let i = 0; i < 1000; i++) {
      plot.push({ x: i, y: Math.random() * 100 })
    }

    expect(plot.getState().totalPoints).toBe(1000)
  })

  it('should handle multiple clears', () => {
    const plot = new StreamingPlot<{ x: number; y: number }>()

    plot.push({ x: 1, y: 1 })
    plot.clear()
    plot.clear() // Second clear

    expect(plot.getData().length).toBe(0)
  })
})
