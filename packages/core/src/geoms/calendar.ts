/**
 * geom_calendar - GitHub-style calendar heatmap
 *
 * Displays data as a grid of days organized by week, with color intensity
 * representing the value. Perfect for showing activity over time, habits,
 * contributions, etc.
 *
 * @example
 * ```ts
 * // Basic calendar heatmap
 * gg(data)
 *   .aes({ x: 'date', fill: 'count' })
 *   .geom(geom_calendar())
 *
 * // With custom colors
 * gg(data)
 *   .aes({ x: 'date', fill: 'commits' })
 *   .geom(geom_calendar({ empty_color: '#161b22', fill_color: '#39d353' }))
 * ```
 */

import type { Geom } from '../types'

export interface CalendarOptions {
  /** Character for filled cells (default: '█') */
  cell_char?: string
  /** Character for empty cells (default: '░') */
  empty_char?: string
  /** Base color for empty/low values (default: '#161b22' - GitHub dark) */
  empty_color?: string
  /** Color for high values (default: '#39d353' - GitHub green) */
  fill_color?: string
  /** Show month labels (default: true) */
  show_months?: boolean
  /** Show day labels (default: true) */
  show_days?: boolean
  /** Week starts on (default: 0 = Sunday) */
  week_start?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Number of intensity levels (default: 5) */
  levels?: number
}

/**
 * Create a calendar heatmap (GitHub contribution graph style)
 *
 * Data should have:
 * - x/date: Date values (string or Date)
 * - fill/value: Numeric value for color intensity
 */
export function geom_calendar(options: CalendarOptions = {}): Geom {
  return {
    type: 'calendar',
    stat: 'identity',
    position: 'identity',
    params: {
      cell_char: options.cell_char ?? '█',
      empty_char: options.empty_char ?? '░',
      empty_color: options.empty_color ?? '#161b22',
      fill_color: options.fill_color ?? '#39d353',
      show_months: options.show_months ?? true,
      show_days: options.show_days ?? true,
      week_start: options.week_start ?? 0,
      levels: options.levels ?? 5,
    },
  }
}
