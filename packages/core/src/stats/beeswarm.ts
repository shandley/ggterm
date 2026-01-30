/**
 * stat_beeswarm - Arrange points to avoid overlap in categorical plots
 *
 * Beeswarm plots show individual data points jittered to avoid overlap,
 * creating a "swarm" pattern that reveals both distribution and individual values.
 */

import type { AestheticMapping, DataSource, Stat } from '../types'

export interface StatBeeswarmParams {
  /** Method for arranging points: 'swarm' | 'center' | 'square' (default: 'swarm') */
  method?: 'swarm' | 'center' | 'square'
  /** Point size for collision detection (default: 1) */
  cex?: number
  /** Spacing between points (default: 1) */
  spacing?: number
  /** Side to place points: 0 (both), -1 (left/below), 1 (right/above) (default: 0) */
  side?: -1 | 0 | 1
  /** Priority for placing points: 'ascending' | 'descending' | 'density' | 'random' (default: 'ascending') */
  priority?: 'ascending' | 'descending' | 'density' | 'random'
  /** Dodge width for categorical spacing (default: 0.8) */
  dodge?: number
}

export interface BeeswarmResult {
  x: number
  y: number
  xOriginal: number | string
  yOriginal: number
  xOffset: number
  [key: string]: unknown
}

/**
 * Classic swarm algorithm - places points as close to center as possible
 * while avoiding collisions with already-placed points.
 */
function swarmArrange(
  yValues: number[],
  params: StatBeeswarmParams
): { offsets: number[]; indices: number[] } {
  const n = yValues.length
  if (n === 0) return { offsets: [], indices: [] }

  const cex = params.cex ?? 1
  const spacing = params.spacing ?? 1
  const side = params.side ?? 0

  // Size of a point in y-units (approximate)
  const yRange = Math.max(...yValues) - Math.min(...yValues)
  const pointSize = (yRange / Math.max(n, 10)) * cex * spacing

  // Create indices and sort by y value based on priority
  let indices = yValues.map((_, i) => i)
  const priority = params.priority ?? 'ascending'

  switch (priority) {
    case 'ascending':
      indices.sort((a, b) => yValues[a] - yValues[b])
      break
    case 'descending':
      indices.sort((a, b) => yValues[b] - yValues[a])
      break
    case 'random':
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      break
    case 'density':
      // Sort by local density (points near median first)
      const median = yValues.slice().sort((a, b) => a - b)[Math.floor(n / 2)]
      indices.sort((a, b) => Math.abs(yValues[a] - median) - Math.abs(yValues[b] - median))
      break
  }

  // Track placed points: { y, xOffset }
  const placed: { y: number; x: number }[] = []
  const offsets = new Array(n).fill(0)

  for (const idx of indices) {
    const y = yValues[idx]

    // Find the best x offset that doesn't collide
    let bestOffset = 0

    if (placed.length > 0) {
      // Find nearby points that might collide
      const nearby = placed.filter(p => Math.abs(p.y - y) < pointSize * 2)

      if (nearby.length > 0) {
        // Try offsets from center outward
        const maxOffset = nearby.length * pointSize
        let foundSpot = false

        for (let tryOffset = 0; tryOffset <= maxOffset && !foundSpot; tryOffset += pointSize * 0.5) {
          // Try positive offset
          if (side >= 0) {
            let collision = false
            for (const p of nearby) {
              const dx = tryOffset - p.x
              const dy = y - p.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < pointSize) {
                collision = true
                break
              }
            }
            if (!collision) {
              bestOffset = tryOffset
              foundSpot = true
              break
            }
          }

          // Try negative offset (if side allows and positive didn't work)
          if (side <= 0 && tryOffset > 0 && !foundSpot) {
            let collision = false
            for (const p of nearby) {
              const dx = -tryOffset - p.x
              const dy = y - p.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < pointSize) {
                collision = true
                break
              }
            }
            if (!collision) {
              bestOffset = -tryOffset
              foundSpot = true
              break
            }
          }
        }
      }
    }

    offsets[idx] = bestOffset
    placed.push({ y, x: bestOffset })
  }

  // Normalize offsets to [-0.5, 0.5] range
  const maxAbsOffset = Math.max(...offsets.map(Math.abs), 0.001)
  const dodge = params.dodge ?? 0.8
  const scale = (dodge * 0.5) / maxAbsOffset

  for (let i = 0; i < offsets.length; i++) {
    offsets[i] *= scale
  }

  return { offsets, indices }
}

/**
 * Center method - simple alternating left/right placement
 */
function centerArrange(
  yValues: number[],
  params: StatBeeswarmParams
): { offsets: number[]; indices: number[] } {
  const n = yValues.length
  if (n === 0) return { offsets: [], indices: [] }

  const dodge = params.dodge ?? 0.8
  const side = params.side ?? 0

  // Sort indices by y value
  const indices = yValues.map((_, i) => i)
  indices.sort((a, b) => yValues[a] - yValues[b])

  const offsets = new Array(n).fill(0)
  const maxOffset = dodge * 0.4

  // Alternate placement left and right
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    const layer = Math.floor(i / 2) + 1
    const offset = (layer / Math.ceil(n / 2)) * maxOffset

    if (side === 0) {
      offsets[idx] = i % 2 === 0 ? offset : -offset
    } else {
      offsets[idx] = side * offset
    }
  }

  return { offsets, indices }
}

/**
 * Square method - grid-like arrangement
 */
function squareArrange(
  yValues: number[],
  params: StatBeeswarmParams
): { offsets: number[]; indices: number[] } {
  const n = yValues.length
  if (n === 0) return { offsets: [], indices: [] }

  const dodge = params.dodge ?? 0.8
  const side = params.side ?? 0

  // Sort indices by y value
  const indices = yValues.map((_, i) => i)
  indices.sort((a, b) => yValues[a] - yValues[b])

  const offsets = new Array(n).fill(0)

  // Group points by similar y values
  const yRange = Math.max(...yValues) - Math.min(...yValues)
  const binSize = yRange / Math.max(Math.sqrt(n), 3)

  const bins = new Map<number, number[]>()
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    const y = yValues[idx]
    const binKey = Math.floor(y / binSize)
    if (!bins.has(binKey)) {
      bins.set(binKey, [])
    }
    bins.get(binKey)!.push(idx)
  }

  // Arrange each bin in a row
  for (const binIndices of bins.values()) {
    const binN = binIndices.length
    const maxOffset = dodge * 0.4

    for (let i = 0; i < binN; i++) {
      const idx = binIndices[i]
      // Center the row
      const offset = (i - (binN - 1) / 2) * (maxOffset * 2 / Math.max(binN - 1, 1))

      if (side === 0) {
        offsets[idx] = offset
      } else if (side > 0) {
        offsets[idx] = Math.abs(offset)
      } else {
        offsets[idx] = -Math.abs(offset)
      }
    }
  }

  return { offsets, indices }
}

/**
 * Compute beeswarm positions for a single group
 */
export function computeBeeswarm(
  data: DataSource,
  _xField: string,
  yField: string,
  groupKey: string | number,
  groupIndex: number,
  params: StatBeeswarmParams = {}
): BeeswarmResult[] {
  // Extract y values
  const yValues: number[] = []
  const originalRows: unknown[] = []

  for (const row of data) {
    const yVal = row[yField]
    if (yVal === null || yVal === undefined) continue
    const numY = Number(yVal)
    if (isNaN(numY)) continue

    yValues.push(numY)
    originalRows.push(row)
  }

  if (yValues.length === 0) return []

  // Choose arrangement method
  const method = params.method ?? 'swarm'
  let result: { offsets: number[]; indices: number[] }

  switch (method) {
    case 'center':
      result = centerArrange(yValues, params)
      break
    case 'square':
      result = squareArrange(yValues, params)
      break
    case 'swarm':
    default:
      result = swarmArrange(yValues, params)
  }

  // Build output records
  const output: BeeswarmResult[] = []

  for (let i = 0; i < yValues.length; i++) {
    const originalRow = originalRows[i] as Record<string, unknown>
    output.push({
      x: groupIndex + result.offsets[i],
      y: yValues[i],
      xOriginal: groupKey,
      yOriginal: yValues[i],
      xOffset: result.offsets[i],
      // Preserve other fields from original row
      ...originalRow,
    })
  }

  return output
}

/**
 * Create stat_beeswarm transformation
 */
export function stat_beeswarm(params: StatBeeswarmParams = {}): Stat {
  return {
    type: 'beeswarm',
    compute(data: DataSource, aes: AestheticMapping): DataSource {
      // Group data by x aesthetic (categorical)
      const groups = new Map<string, DataSource>()
      const groupOrder: string[] = []

      for (const row of data) {
        const groupKey = String(row[aes.x] ?? 'default')

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
          groupOrder.push(groupKey)
        }
        groups.get(groupKey)!.push(row)
      }

      // Compute beeswarm for each group
      const result: DataSource = []
      let groupIndex = 0

      for (const groupKey of groupOrder) {
        const groupData = groups.get(groupKey)!
        const swarmResult = computeBeeswarm(
          groupData,
          aes.x,
          aes.y,
          groupKey,
          groupIndex,
          params
        )
        result.push(...swarmResult)
        groupIndex++
      }

      return result
    },
  }
}
