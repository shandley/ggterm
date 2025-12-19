/**
 * Position adjustments
 *
 * Position adjustments modify the placement of geoms to handle
 * overlapping data:
 * - identity: No adjustment (default)
 * - dodge: Place overlapping objects side-by-side
 * - stack: Stack overlapping objects on top of each other
 * - fill: Stack and normalize to 100%
 * - jitter: Add random noise to avoid overplotting
 */

import type { AestheticMapping, DataSource } from '../types'

/**
 * Position configuration object
 */
export interface Position {
  type: 'identity' | 'dodge' | 'stack' | 'fill' | 'jitter'
  /** Width for dodge (0-1, fraction of bar width) */
  width?: number
  /** Height for jitter */
  height?: number
  /** Preserve total for fill (unused, always normalizes to 1) */
  preserve?: 'total' | 'single'
  /** Random seed for jitter (for reproducibility) */
  seed?: number
}

/**
 * Adjusted data point with computed position
 */
export interface AdjustedPoint {
  /** Original row data */
  row: Record<string, unknown>
  /** Adjusted x position (in data space) */
  x: number
  /** Adjusted y position (in data space) */
  y: number
  /** For stacked/filled: bottom y value */
  ymin?: number
  /** For stacked/filled: top y value */
  ymax?: number
  /** Original x value before adjustment */
  xOriginal: number
  /** Original y value before adjustment */
  yOriginal: number
  /** Group identifier */
  group?: string
  /** Width for bar-like geoms */
  width?: number
}

export interface DodgeOptions {
  /** Width of the total dodge area (0-1) */
  width?: number
  /** Preserve total or single items */
  preserve?: 'total' | 'single'
}

export interface JitterOptions {
  /** Amount of jitter in x direction */
  width?: number
  /** Amount of jitter in y direction */
  height?: number
  /** Random seed for reproducibility */
  seed?: number
}

export interface StackOptions {
  /** Reverse stack order */
  reverse?: boolean
}

export interface FillOptions {
  /** Reverse stack order */
  reverse?: boolean
}

/**
 * No position adjustment (identity)
 */
export function position_identity(): Position {
  return { type: 'identity' }
}

/**
 * Dodge overlapping objects side-by-side
 *
 * @example
 * ```ts
 * // Grouped bar chart
 * gg(data).geom(geom_bar({ position: position_dodge() }))
 *
 * // With narrower bars
 * gg(data).geom(geom_bar({ position: position_dodge({ width: 0.7 }) }))
 * ```
 */
export function position_dodge(options: DodgeOptions = {}): Position {
  return {
    type: 'dodge',
    width: options.width ?? 0.9,
    preserve: options.preserve ?? 'total',
  }
}

/**
 * Stack overlapping objects on top of each other
 *
 * @example
 * ```ts
 * // Stacked bar chart
 * gg(data).geom(geom_bar({ position: position_stack() }))
 * ```
 */
export function position_stack(options: StackOptions = {}): Position {
  return {
    type: 'stack',
  }
}

/**
 * Stack and normalize to fill the panel (0-100%)
 *
 * @example
 * ```ts
 * // 100% stacked bar chart
 * gg(data).geom(geom_bar({ position: position_fill() }))
 * ```
 */
export function position_fill(options: FillOptions = {}): Position {
  return {
    type: 'fill',
  }
}

/**
 * Add random noise to avoid overplotting
 *
 * @example
 * ```ts
 * // Jittered scatter plot
 * gg(data).geom(geom_point({ position: position_jitter() }))
 *
 * // With custom jitter amount
 * gg(data).geom(geom_point({ position: position_jitter({ width: 0.2, height: 0.1 }) }))
 * ```
 */
export function position_jitter(options: JitterOptions = {}): Position {
  return {
    type: 'jitter',
    width: options.width ?? 0.4,
    height: options.height ?? 0.4,
    seed: options.seed,
  }
}

/**
 * Simple seeded random number generator for reproducible jitter
 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

/**
 * Group data by x value and optional grouping variable
 */
function groupByX(
  data: DataSource,
  aes: AestheticMapping
): Map<string, { group: string; rows: Record<string, unknown>[] }[]> {
  const xGroups = new Map<string, Map<string, Record<string, unknown>[]>>()
  const groupField = aes.fill || aes.color || aes.group

  for (const row of data) {
    const xVal = String(row[aes.x])
    const groupVal = groupField ? String(row[groupField] ?? 'default') : 'default'

    if (!xGroups.has(xVal)) {
      xGroups.set(xVal, new Map())
    }
    const groups = xGroups.get(xVal)!
    if (!groups.has(groupVal)) {
      groups.set(groupVal, [])
    }
    groups.get(groupVal)!.push(row)
  }

  // Convert to array format
  const result = new Map<string, { group: string; rows: Record<string, unknown>[] }[]>()
  for (const [xVal, groups] of xGroups) {
    const groupArray: { group: string; rows: Record<string, unknown>[] }[] = []
    for (const [groupVal, rows] of groups) {
      groupArray.push({ group: groupVal, rows })
    }
    result.set(xVal, groupArray)
  }

  return result
}

/**
 * Apply position adjustment to data
 *
 * This is the main function that computes adjusted positions for each data point
 * based on the position type and grouping.
 */
export function applyPositionAdjustment(
  data: DataSource,
  aes: AestheticMapping,
  position: Position | string,
  barWidth: number = 0.9
): AdjustedPoint[] {
  // Normalize position to object
  const pos: Position = typeof position === 'string'
    ? { type: position as Position['type'] }
    : position

  const groupField = aes.fill || aes.color || aes.group

  switch (pos.type) {
    case 'identity':
      return applyIdentity(data, aes)

    case 'dodge':
      return applyDodge(data, aes, pos.width ?? 0.9, barWidth, groupField)

    case 'stack':
      return applyStack(data, aes, groupField, false)

    case 'fill':
      return applyStack(data, aes, groupField, true)

    case 'jitter':
      return applyJitter(data, aes, pos.width ?? 0.4, pos.height ?? 0.4, pos.seed)

    default:
      return applyIdentity(data, aes)
  }
}

/**
 * Identity position - no adjustment
 */
function applyIdentity(data: DataSource, aes: AestheticMapping): AdjustedPoint[] {
  return data.map(row => {
    const x = Number(row[aes.x]) || 0
    const y = Number(row[aes.y]) || 0
    return {
      row,
      x,
      y,
      xOriginal: x,
      yOriginal: y,
    }
  })
}

/**
 * Dodge position - place groups side by side
 */
function applyDodge(
  data: DataSource,
  aes: AestheticMapping,
  dodgeWidth: number,
  barWidth: number,
  groupField?: string
): AdjustedPoint[] {
  const result: AdjustedPoint[] = []
  const xGroups = groupByX(data, aes)

  // Find all unique groups across all x values for consistent ordering
  const allGroups = new Set<string>()
  for (const [, groups] of xGroups) {
    for (const { group } of groups) {
      allGroups.add(group)
    }
  }
  const groupOrder = Array.from(allGroups).sort()
  const nGroups = groupOrder.length

  if (nGroups <= 1) {
    // No grouping, use identity
    return applyIdentity(data, aes)
  }

  // Calculate individual bar width
  const individualWidth = (barWidth * dodgeWidth) / nGroups

  for (const [xVal, groups] of xGroups) {
    const xBase = Number(xVal) || 0

    for (const { group, rows } of groups) {
      const groupIndex = groupOrder.indexOf(group)
      // Calculate offset: center the group of bars at x
      const totalWidth = barWidth * dodgeWidth
      const offset = -totalWidth / 2 + individualWidth / 2 + groupIndex * individualWidth

      for (const row of rows) {
        const y = Number(row[aes.y]) || 0
        result.push({
          row,
          x: xBase + offset,
          y,
          xOriginal: xBase,
          yOriginal: y,
          group,
          width: individualWidth,
        })
      }
    }
  }

  return result
}

/**
 * Stack position - stack groups on top of each other
 * When normalize=true, acts as position_fill (normalizes to 100%)
 */
function applyStack(
  data: DataSource,
  aes: AestheticMapping,
  groupField?: string,
  normalize: boolean = false
): AdjustedPoint[] {
  const result: AdjustedPoint[] = []
  const xGroups = groupByX(data, aes)

  for (const [xVal, groups] of xGroups) {
    const xBase = Number(xVal) || 0

    // Calculate total for this x value (for normalization)
    let total = 0
    if (normalize) {
      for (const { rows } of groups) {
        for (const row of rows) {
          total += Math.abs(Number(row[aes.y]) || 0)
        }
      }
    }

    // Stack from bottom (y=0)
    let stackY = 0

    for (const { group, rows } of groups) {
      for (const row of rows) {
        let y = Number(row[aes.y]) || 0

        // Normalize if fill position
        if (normalize && total > 0) {
          y = y / total
        }

        const ymin = stackY
        const ymax = stackY + y

        result.push({
          row,
          x: xBase,
          y: ymax,  // Top of the stacked bar
          ymin,
          ymax,
          xOriginal: xBase,
          yOriginal: Number(row[aes.y]) || 0,
          group,
        })

        stackY = ymax
      }
    }
  }

  return result
}

/**
 * Jitter position - add random noise
 */
function applyJitter(
  data: DataSource,
  aes: AestheticMapping,
  width: number,
  height: number,
  seed?: number
): AdjustedPoint[] {
  const random = seed !== undefined ? seededRandom(seed) : Math.random

  return data.map(row => {
    const x = Number(row[aes.x]) || 0
    const y = Number(row[aes.y]) || 0

    // Add random offset
    const jitterX = (random() - 0.5) * width
    const jitterY = (random() - 0.5) * height

    return {
      row,
      x: x + jitterX,
      y: y + jitterY,
      xOriginal: x,
      yOriginal: y,
    }
  })
}

/**
 * Check if a position type requires stacking (stack or fill)
 */
export function isStackPosition(position: Position | string): boolean {
  const type = typeof position === 'string' ? position : position.type
  return type === 'stack' || type === 'fill'
}

/**
 * Check if a position type requires dodging
 */
export function isDodgePosition(position: Position | string): boolean {
  const type = typeof position === 'string' ? position : position.type
  return type === 'dodge'
}

/**
 * Get the position type string from a Position object or string
 */
export function getPositionType(position: Position | string | undefined): string {
  if (!position) return 'identity'
  return typeof position === 'string' ? position : position.type
}
