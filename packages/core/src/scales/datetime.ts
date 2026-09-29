/**
 * Date/Time scales
 *
 * Maps date/time values to plot coordinates with intelligent tick formatting.
 */

import type { Scale } from '@ggterm/spec/types'

/**
 * Time intervals for tick calculation
 */
const TIME_INTERVALS = [
  { name: 'millisecond', ms: 1 },
  { name: 'second', ms: 1000 },
  { name: 'minute', ms: 60 * 1000 },
  { name: 'hour', ms: 60 * 60 * 1000 },
  { name: 'day', ms: 24 * 60 * 60 * 1000 },
  { name: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { name: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { name: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
]

/**
 * Parse a date value to milliseconds since epoch
 */
function parseDateTime(value: unknown): number | null {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') {
    return value // Assume milliseconds
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!isNaN(parsed)) return parsed
  }

  return null
}

/**
 * Format a date value based on the time span
 */
export function formatDateTime(ms: number, spanMs: number): string {
  const date = new Date(ms)

  // Choose format based on span
  if (spanMs < 60 * 1000) {
    // Less than a minute: show seconds
    return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`
  } else if (spanMs < 60 * 60 * 1000) {
    // Less than an hour: show minutes
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  } else if (spanMs < 24 * 60 * 60 * 1000) {
    // Less than a day: show hours
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  } else if (spanMs < 7 * 24 * 60 * 60 * 1000) {
    // Less than a week: show day and month
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else if (spanMs < 365 * 24 * 60 * 60 * 1000) {
    // Less than a year: show month and day
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}`
  } else {
    // More than a year: show year and month
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }
}

/**
 * Calculate nice tick positions for a time range
 */
export function calculateDateTimeTicks(minMs: number, maxMs: number, targetTicks: number = 5): number[] {
  const span = maxMs - minMs

  // Find appropriate interval
  let interval = TIME_INTERVALS[0]
  for (const int of TIME_INTERVALS) {
    if (span / int.ms >= targetTicks && span / int.ms <= targetTicks * 10) {
      interval = int
      break
    }
  }

  // Calculate nice multiples
  const tickInterval = interval.ms
  const niceMultiples = [1, 2, 5, 10, 15, 30]
  let bestMultiple = 1

  for (const mult of niceMultiples) {
    const numTicks = span / (tickInterval * mult)
    if (numTicks >= 3 && numTicks <= targetTicks * 2) {
      bestMultiple = mult
      break
    }
  }

  const finalInterval = tickInterval * bestMultiple

  // Generate ticks
  const ticks: number[] = []
  const start = Math.ceil(minMs / finalInterval) * finalInterval

  for (let t = start; t <= maxMs; t += finalInterval) {
    ticks.push(t)
  }

  return ticks
}

export interface DateTimeScaleOptions {
  /** Domain [min, max] as dates, numbers, or strings */
  domain?: [Date | number | string, Date | number | string]
  /** Time zone (default: local) */
  timezone?: string
  /** Date format string */
  format?: string
  /** Axis label */
  name?: string
}

/**
 * X-axis date/time scale
 */
export function scale_x_datetime(options: DateTimeScaleOptions = {}): Scale {
  let parsedDomain: [number, number] | undefined

  if (options.domain) {
    const d0 = parseDateTime(options.domain[0])
    const d1 = parseDateTime(options.domain[1])
    if (d0 !== null && d1 !== null) {
      parsedDomain = [d0, d1]
    }
  }

  return {
    type: 'continuous',
    aesthetic: 'x',
    domain: parsedDomain,
    range: undefined,
    map(value: unknown): number {
      const ms = parseDateTime(value)
      if (ms === null) return 0

      const domain = this.domain as [number, number] ?? [0, 1]
      const range = this.range as [number, number] ?? [0, 1]

      const t = (ms - domain[0]) / (domain[1] - domain[0] || 1)
      return range[0] + t * (range[1] - range[0])
    },
    invert(position: number): Date {
      const domain = this.domain as [number, number] ?? [0, 1]
      const range = this.range as [number, number] ?? [0, 1]

      const t = (position - range[0]) / (range[1] - range[0] || 1)
      const ms = domain[0] + t * (domain[1] - domain[0])
      return new Date(ms)
    },
  }
}

/**
 * Y-axis date/time scale
 */
export function scale_y_datetime(options: DateTimeScaleOptions = {}): Scale {
  const scale = scale_x_datetime(options)
  scale.aesthetic = 'y'
  return scale
}

/**
 * Date scale (no time component)
 */
export function scale_x_date(options: DateTimeScaleOptions = {}): Scale {
  return scale_x_datetime(options)
}

export function scale_y_date(options: DateTimeScaleOptions = {}): Scale {
  return scale_y_datetime(options)
}

/**
 * Time scale (time of day, ignoring date)
 */
export interface TimeScaleOptions {
  /** Domain as hours [0-24, 0-24] */
  domain?: [number, number]
  /** Axis label */
  name?: string
}

export function scale_x_time(options: TimeScaleOptions = {}): Scale {
  const domain = options.domain ?? [0, 24]

  return {
    type: 'continuous',
    aesthetic: 'x',
    domain: [domain[0] * 60 * 60 * 1000, domain[1] * 60 * 60 * 1000],
    range: undefined,
    map(value: unknown): number {
      let ms: number

      if (typeof value === 'number') {
        // Assume hours
        ms = value * 60 * 60 * 1000
      } else if (value instanceof Date) {
        // Extract time of day
        ms = (value.getHours() * 60 + value.getMinutes()) * 60 * 1000 + value.getSeconds() * 1000
      } else if (typeof value === 'string') {
        // Parse HH:MM or HH:MM:SS
        const parts = value.split(':').map(Number)
        ms = (parts[0] * 60 + (parts[1] || 0)) * 60 * 1000 + (parts[2] || 0) * 1000
      } else {
        return 0
      }

      const domainMs = this.domain as [number, number]
      const range = this.range as [number, number] ?? [0, 1]

      const t = (ms - domainMs[0]) / (domainMs[1] - domainMs[0] || 1)
      return range[0] + t * (range[1] - range[0])
    },
  }
}

export function scale_y_time(options: TimeScaleOptions = {}): Scale {
  const scale = scale_x_time(options)
  scale.aesthetic = 'y'
  return scale
}

/**
 * Duration scale (time spans)
 */
export interface DurationScaleOptions {
  /** Unit to display: 'auto', 'seconds', 'minutes', 'hours', 'days' */
  unit?: 'auto' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days'
  /** Axis label */
  name?: string
}

export function scale_x_duration(options: DurationScaleOptions = {}): Scale {
  const unit = options.unit ?? 'auto'

  const unitMs: Record<string, number> = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  }

  return {
    type: 'continuous',
    aesthetic: 'x',
    domain: undefined,
    range: undefined,
    map(value: unknown): number {
      let ms: number

      if (typeof value === 'number') {
        // Assume the configured unit
        const multiplier = unit !== 'auto' ? unitMs[unit] : 1000 // Default to seconds
        ms = value * multiplier
      } else {
        ms = 0
      }

      const domain = this.domain as [number, number] ?? [0, 1]
      const range = this.range as [number, number] ?? [0, 1]

      const t = (ms - domain[0]) / (domain[1] - domain[0] || 1)
      return range[0] + t * (range[1] - range[0])
    },
  }
}

export function scale_y_duration(options: DurationScaleOptions = {}): Scale {
  const scale = scale_x_duration(options)
  scale.aesthetic = 'y'
  return scale
}
