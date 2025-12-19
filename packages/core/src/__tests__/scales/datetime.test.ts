/**
 * Tests for date/time scales
 */

import { describe, expect, it } from 'bun:test'
import {
  scale_x_date,
  scale_y_date,
  scale_x_datetime,
  scale_y_datetime,
  scale_x_time,
  scale_y_time,
  formatDateTime,
  calculateDateTimeTicks,
} from '../../scales/datetime'

describe('scale_x_date', () => {
  it('should create a date scale', () => {
    const scale = scale_x_date()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should accept domain as Date objects', () => {
    const start = new Date('2024-01-01')
    const end = new Date('2024-12-31')
    const scale = scale_x_date({ domain: [start, end] })

    expect(scale.domain).toBeDefined()
    expect((scale.domain as [number, number])[0]).toBe(start.getTime())
    expect((scale.domain as [number, number])[1]).toBe(end.getTime())
  })

  it('should accept domain as date strings', () => {
    const scale = scale_x_date({ domain: ['2024-01-01', '2024-12-31'] })

    expect(scale.domain).toBeDefined()
    const domain = scale.domain as [number, number]
    expect(domain[0]).toBe(Date.parse('2024-01-01'))
    expect(domain[1]).toBe(Date.parse('2024-12-31'))
  })

  it('should accept domain as timestamps', () => {
    const start = Date.parse('2024-01-01')
    const end = Date.parse('2024-12-31')
    const scale = scale_x_date({ domain: [start, end] })

    expect(scale.domain).toBeDefined()
    expect((scale.domain as [number, number])[0]).toBe(start)
    expect((scale.domain as [number, number])[1]).toBe(end)
  })

  it('should map date to position', () => {
    const start = new Date('2024-01-01')
    const end = new Date('2024-12-31')
    const scale = scale_x_date({ domain: [start, end] })

    // Set range manually for testing
    scale.range = [0, 100]

    // Start should map to 0
    expect(scale.map(start)).toBe(0)

    // End should map to 100
    expect(scale.map(end)).toBe(100)

    // Middle should map to ~50
    const middle = new Date('2024-07-01')
    const mapped = scale.map(middle)
    expect(mapped).toBeGreaterThan(40)
    expect(mapped).toBeLessThan(60)
  })

  it('should map date strings', () => {
    const scale = scale_x_date({ domain: ['2024-01-01', '2024-12-31'] })
    scale.range = [0, 100]

    expect(scale.map('2024-01-01')).toBeCloseTo(0, 1)
    expect(scale.map('2024-12-31')).toBeCloseTo(100, 1)
  })

  it('should map timestamps', () => {
    const start = Date.parse('2024-01-01')
    const end = Date.parse('2024-12-31')
    const scale = scale_x_date({ domain: [start, end] })
    scale.range = [0, 100]

    expect(scale.map(start)).toBeCloseTo(0, 1)
    expect(scale.map(end)).toBeCloseTo(100, 1)
  })

  it('should invert position to date', () => {
    const start = new Date('2024-01-01')
    const end = new Date('2024-12-31')
    const scale = scale_x_date({ domain: [start, end] })
    scale.range = [0, 100]

    const inverted = scale.invert!(0)
    expect(inverted).toBeInstanceOf(Date)
    expect(inverted.getTime()).toBeCloseTo(start.getTime(), -3)
  })
})

describe('scale_y_date', () => {
  it('should create a y-axis date scale', () => {
    const scale = scale_y_date()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('y')
  })
})

describe('scale_x_datetime', () => {
  it('should be identical to scale_x_date', () => {
    const dateScale = scale_x_date()
    const datetimeScale = scale_x_datetime()

    expect(dateScale.type).toBe(datetimeScale.type)
    expect(dateScale.aesthetic).toBe(datetimeScale.aesthetic)
  })
})

describe('scale_x_time', () => {
  it('should create a time-of-day scale', () => {
    const scale = scale_x_time()
    expect(scale.type).toBe('continuous')
    expect(scale.aesthetic).toBe('x')
  })

  it('should accept domain as hours', () => {
    const scale = scale_x_time({ domain: [9, 17] }) // 9am to 5pm
    expect(scale.domain).toBeDefined()
  })

  it('should map time strings', () => {
    const scale = scale_x_time({ domain: [0, 24] })
    scale.range = [0, 100]

    // Noon should be roughly in the middle
    const noon = scale.map('12:00')
    expect(noon).toBeGreaterThan(40)
    expect(noon).toBeLessThan(60)
  })

  it('should map hours as numbers', () => {
    const scale = scale_x_time({ domain: [0, 24] })
    scale.range = [0, 100]

    expect(scale.map(0)).toBeCloseTo(0, 1)
    expect(scale.map(12)).toBeCloseTo(50, 1)
    expect(scale.map(24)).toBeCloseTo(100, 1)
  })
})

describe('scale_y_time', () => {
  it('should create a y-axis time scale', () => {
    const scale = scale_y_time()
    expect(scale.aesthetic).toBe('y')
  })
})

describe('formatDateTime', () => {
  it('should format seconds for short spans', () => {
    const ms = Date.parse('2024-01-15T10:30:45')
    const span = 30 * 1000 // 30 seconds
    const formatted = formatDateTime(ms, span)
    expect(formatted).toContain(':')
    expect(formatted).toContain('45') // seconds
  })

  it('should format hours:minutes for medium spans', () => {
    const ms = Date.parse('2024-01-15T10:30:00')
    const span = 2 * 60 * 60 * 1000 // 2 hours
    const formatted = formatDateTime(ms, span)
    expect(formatted).toMatch(/\d+:\d+/)
  })

  it('should format month/day for weekly spans', () => {
    const ms = Date.parse('2024-01-15')
    const span = 5 * 24 * 60 * 60 * 1000 // 5 days
    const formatted = formatDateTime(ms, span)
    expect(formatted).toMatch(/\d+\/\d+/)
  })

  it('should format month name for monthly spans', () => {
    const ms = Date.parse('2024-03-15')
    const span = 60 * 24 * 60 * 60 * 1000 // 60 days
    const formatted = formatDateTime(ms, span)
    expect(formatted).toContain('Mar')
  })

  it('should format year-month for yearly spans', () => {
    const ms = Date.parse('2024-06-15')
    const span = 400 * 24 * 60 * 60 * 1000 // > 1 year
    const formatted = formatDateTime(ms, span)
    expect(formatted).toContain('2024')
  })
})

describe('calculateDateTimeTicks', () => {
  it('should generate ticks within range', () => {
    const min = Date.parse('2024-01-01')
    const max = Date.parse('2024-12-31')
    const ticks = calculateDateTimeTicks(min, max)

    expect(ticks.length).toBeGreaterThan(0)
    for (const tick of ticks) {
      expect(tick).toBeGreaterThanOrEqual(min)
      expect(tick).toBeLessThanOrEqual(max)
    }
  })

  it('should generate approximately target number of ticks', () => {
    const min = Date.parse('2024-01-01')
    const max = Date.parse('2024-12-31')
    const ticks = calculateDateTimeTicks(min, max, 5)

    // Should be roughly 3-10 ticks for a year span
    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks.length).toBeLessThanOrEqual(15)
  })

  it('should generate evenly spaced ticks', () => {
    const min = Date.parse('2024-01-01')
    const max = Date.parse('2024-03-01')
    const ticks = calculateDateTimeTicks(min, max)

    if (ticks.length >= 3) {
      const interval1 = ticks[1] - ticks[0]
      const interval2 = ticks[2] - ticks[1]
      expect(interval1).toBeCloseTo(interval2, -3)
    }
  })

  it('should handle short time spans', () => {
    const min = Date.parse('2024-01-01T10:00:00')
    const max = Date.parse('2024-01-01T10:05:00') // 5 minutes
    const ticks = calculateDateTimeTicks(min, max)

    expect(ticks.length).toBeGreaterThan(0)
  })

  it('should handle long time spans', () => {
    const min = Date.parse('2020-01-01')
    const max = Date.parse('2024-12-31') // ~5 years
    const ticks = calculateDateTimeTicks(min, max)

    expect(ticks.length).toBeGreaterThan(0)
    expect(ticks.length).toBeLessThan(20)
  })
})

// Integration tests
import { gg } from '../../grammar'
import { geom_line, geom_point } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('date scale integration', () => {
  it('should render a time series plot with date scale', () => {
    const data = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-02-01', value: 25 },
      { date: '2024-03-01', value: 15 },
      { date: '2024-04-01', value: 30 },
    ]

    const spec = gg(data)
      .aes({ x: 'date', y: 'value' })
      .geom(geom_line())
      .geom(geom_point())
      .scale(scale_x_date())
      .labs({ title: 'Time Series', x: 'Date', y: 'Value' })
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render with Date objects', () => {
    const data = [
      { date: new Date('2024-01-15'), value: 100 },
      { date: new Date('2024-02-15'), value: 150 },
      { date: new Date('2024-03-15'), value: 120 },
    ]

    const spec = gg(data)
      .aes({ x: 'date', y: 'value' })
      .geom(geom_point())
      .scale(scale_x_date())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should render with timestamps', () => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    const data = [
      { time: now - 7 * day, value: 50 },
      { time: now - 3 * day, value: 75 },
      { time: now, value: 100 },
    ]

    const spec = gg(data)
      .aes({ x: 'time', y: 'value' })
      .geom(geom_line())
      .scale(scale_x_datetime())
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 20 })
    expect(canvas).toBeDefined()
  })
})
