/**
 * Scale utilities for the rendering pipeline
 *
 * Handles domain inference, normalization, and mapping to canvas coordinates.
 */

import type {
  AestheticMapping,
  DataSource,
  RGBA,
  Scale,
  ScaleTransform,
} from '../types'

/**
 * Infer the domain (min/max) for a continuous aesthetic from data
 */
export function inferContinuousDomain(
  data: DataSource,
  field: string
): [number, number] {
  let min = Infinity
  let max = -Infinity

  for (const row of data) {
    const value = row[field]
    if (typeof value === 'number' && !isNaN(value)) {
      if (value < min) min = value
      if (value > max) max = value
    }
  }

  // Handle edge cases
  if (min === Infinity) min = 0
  if (max === -Infinity) max = 1
  if (min === max) {
    // Add some padding if all values are the same
    min = min - 1
    max = max + 1
  }

  return [min, max]
}

/**
 * Ordering strategy for discrete scales
 */
export type DiscreteOrder =
  | 'alphabetical'  // Sort alphabetically (default)
  | 'data'          // Order by first appearance in data
  | 'frequency'     // Order by frequency (most common first)
  | 'reverse'       // Reverse alphabetical

/**
 * Options for inferring discrete domain
 */
export interface InferDiscreteOptions {
  /** Explicit order of categories (overrides order option) */
  limits?: string[]
  /** Ordering strategy when limits not provided */
  order?: DiscreteOrder
  /** Reverse the order (applied after order/limits) */
  reverse?: boolean
  /** Exclude specific categories */
  exclude?: string[]
  /** Whether to drop categories not in data (default: true) */
  drop?: boolean
}

/**
 * Infer discrete domain (unique values) for a categorical aesthetic
 * Supports various ordering strategies
 */
export function inferDiscreteDomain(
  data: DataSource,
  field: string,
  options: InferDiscreteOptions = {}
): string[] {
  const { limits, order = 'alphabetical', reverse = false, exclude, drop = true } = options

  // Track values in order of appearance and frequency
  const seen = new Map<string, { firstIndex: number; count: number }>()

  let index = 0
  for (const row of data) {
    const value = row[field]
    if (value !== null && value !== undefined) {
      const key = String(value)
      if (!seen.has(key)) {
        seen.set(key, { firstIndex: index, count: 1 })
      } else {
        seen.get(key)!.count++
      }
    }
    index++
  }

  let result: string[]

  // If explicit limits provided, use them
  if (limits) {
    if (drop) {
      // Only include limits that appear in data
      result = limits.filter(v => seen.has(v))
    } else {
      // Include all limits, even if not in data
      result = [...limits]
    }
  } else {
    // Apply ordering strategy
    const values = Array.from(seen.keys())

    switch (order) {
      case 'data':
        // Sort by first appearance
        result = values.sort((a, b) => seen.get(a)!.firstIndex - seen.get(b)!.firstIndex)
        break
      case 'frequency':
        // Sort by frequency (descending)
        result = values.sort((a, b) => seen.get(b)!.count - seen.get(a)!.count)
        break
      case 'reverse':
        // Reverse alphabetical
        result = values.sort().reverse()
        break
      case 'alphabetical':
      default:
        // Alphabetical (default)
        result = values.sort()
        break
    }
  }

  // Apply exclusions
  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(exclude)
    result = result.filter(v => !excludeSet.has(v))
  }

  // Apply reverse
  if (reverse) {
    result = result.reverse()
  }

  return result
}

/**
 * Expand domain by a percentage (adds padding)
 */
export function expandDomain(
  domain: [number, number],
  expand: number = 0.05
): [number, number] {
  const range = domain[1] - domain[0]
  const padding = range * expand
  return [domain[0] - padding, domain[1] + padding]
}

/**
 * Calculate a nice step size for the given range
 */
function niceStep(range: number, targetTicks: number = 5): number {
  const rawStep = range / Math.max(1, targetTicks - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude

  let nice: number
  if (normalized <= 1.5) nice = 1
  else if (normalized <= 3) nice = 2
  else if (normalized <= 7) nice = 5
  else nice = 10

  return nice * magnitude
}

/**
 * Expand domain to nice round numbers that include all data
 * This creates visually appealing axis limits with round tick values
 */
export function niceDomain(
  domain: [number, number],
  targetTicks: number = 5
): [number, number] {
  const [min, max] = domain
  const range = max - min

  // Handle edge cases
  if (range === 0) {
    // Single value - expand around it
    if (min === 0) return [-1, 1]
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(min))))
    return [min - magnitude, min + magnitude]
  }

  // Calculate a nice step size
  const step = niceStep(range, targetTicks)

  // Expand min down to nearest nice number
  const niceMin = Math.floor(min / step) * step

  // Expand max up to nearest nice number
  const niceMax = Math.ceil(max / step) * step

  return [niceMin, niceMax]
}

/**
 * Resolved scale with concrete domain and mapping functions
 */
export interface ResolvedScale {
  aesthetic: string
  type: 'continuous' | 'discrete'
  domain: [number, number] | string[]
  range: [number, number]

  /** Custom tick positions (if specified by user) */
  breaks?: number[]

  /** Custom tick labels (if specified by user) */
  labels?: string[]

  /** Scale transformation type */
  trans?: ScaleTransform

  /** Transform function (data space -> transformed space) */
  transform?: (value: number) => number

  /** Inverse transform function (transformed space -> data space) */
  invert?: (value: number) => number

  /** Map data value to normalized 0-1 position */
  normalize(value: unknown): number

  /** Map normalized position to canvas coordinate */
  toCanvas(normalized: number): number

  /** Convenience: map data value directly to canvas coordinate */
  map(value: unknown): number
}

/**
 * Transform configuration
 */
export interface TransformConfig {
  type: ScaleTransform
  transform: (v: number) => number
  invert: (v: number) => number
}

/**
 * Get transform functions for a given transform type
 */
export function getTransformFunctions(trans: ScaleTransform = 'identity'): TransformConfig {
  switch (trans) {
    case 'log10':
      return {
        type: 'log10',
        transform: (v: number) => v > 0 ? Math.log10(v) : -Infinity,
        invert: (v: number) => Math.pow(10, v),
      }
    case 'sqrt':
      return {
        type: 'sqrt',
        transform: (v: number) => v >= 0 ? Math.sqrt(v) : 0,
        invert: (v: number) => v * v,
      }
    case 'reverse':
      return {
        type: 'reverse',
        transform: (v: number) => -v,
        invert: (v: number) => -v,
      }
    default:
      return {
        type: 'identity',
        transform: (v: number) => v,
        invert: (v: number) => v,
      }
  }
}

/**
 * Create a resolved continuous scale
 */
export function createResolvedContinuousScale(
  aesthetic: string,
  domain: [number, number],
  range: [number, number],
  trans: ScaleTransform = 'identity'
): ResolvedScale {
  const [domainMin, domainMax] = domain
  const [rangeMin, rangeMax] = range
  const rangeSpan = rangeMax - rangeMin

  const { transform, invert } = getTransformFunctions(trans)

  return {
    aesthetic,
    type: 'continuous',
    domain,
    range,
    trans,
    transform,
    invert,

    normalize(value: unknown): number {
      const num = Number(value)
      if (isNaN(num)) return 0
      const transformed = transform(num)
      const transformedMin = transform(domainMin)
      const transformedMax = transform(domainMax)
      if (transformedMax === transformedMin) return 0.5
      return (transformed - transformedMin) / (transformedMax - transformedMin)
    },

    toCanvas(normalized: number): number {
      return rangeMin + normalized * rangeSpan
    },

    map(value: unknown): number {
      return this.toCanvas(this.normalize(value))
    },
  }
}

/**
 * Create a resolved discrete scale
 */
export function createResolvedDiscreteScale(
  aesthetic: string,
  domain: string[],
  range: [number, number]
): ResolvedScale {
  const [rangeMin, rangeMax] = range
  const rangeSpan = rangeMax - rangeMin

  return {
    aesthetic,
    type: 'discrete',
    domain,
    range,

    normalize(value: unknown): number {
      const str = String(value)
      const index = domain.indexOf(str)
      if (index < 0) return 0
      return domain.length > 1 ? index / (domain.length - 1) : 0.5
    },

    toCanvas(normalized: number): number {
      return rangeMin + normalized * rangeSpan
    },

    map(value: unknown): number {
      return this.toCanvas(this.normalize(value))
    },
  }
}

/**
 * Scale context holding all resolved scales for a plot
 */
export interface ScaleContext {
  x: ResolvedScale
  y: ResolvedScale
  /** Secondary y-axis scale */
  y2?: ResolvedScale
  color?: ResolvedColorScale
  size?: ResolvedSizeScale
}

/**
 * Resolved color scale
 */
export interface ResolvedColorScale {
  aesthetic: string
  type: 'continuous' | 'discrete'
  domain: [number, number] | string[]
  map(value: unknown): RGBA
}

/**
 * Default color palette for discrete values
 */
const CATEGORY_COLORS: RGBA[] = [
  { r: 31, g: 119, b: 180, a: 1 },   // blue
  { r: 255, g: 127, b: 14, a: 1 },   // orange
  { r: 44, g: 160, b: 44, a: 1 },    // green
  { r: 214, g: 39, b: 40, a: 1 },    // red
  { r: 148, g: 103, b: 189, a: 1 },  // purple
  { r: 140, g: 86, b: 75, a: 1 },    // brown
  { r: 227, g: 119, b: 194, a: 1 },  // pink
  { r: 127, g: 127, b: 127, a: 1 },  // gray
  { r: 188, g: 189, b: 34, a: 1 },   // olive
  { r: 23, g: 190, b: 207, a: 1 },   // cyan
]

/**
 * Default color for points (when no color aesthetic)
 */
export const DEFAULT_POINT_COLOR: RGBA = { r: 79, g: 169, b: 238, a: 1 }

/**
 * Interpolate between two colors
 */
function interpolateColor(color1: RGBA, color2: RGBA, t: number): RGBA {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t),
    a: color1.a + (color2.a - color1.a) * t,
  }
}

/**
 * Create a resolved discrete color scale
 */
export function createResolvedDiscreteColorScale(
  domain: string[],
  palette: RGBA[] = CATEGORY_COLORS
): ResolvedColorScale {
  return {
    aesthetic: 'color',
    type: 'discrete',
    domain,
    map(value: unknown): RGBA {
      const str = String(value)
      const index = domain.indexOf(str)
      if (index < 0) return palette[0]
      return palette[index % palette.length]
    },
  }
}

/**
 * Create a resolved continuous color scale (blue to red gradient)
 */
export function createResolvedContinuousColorScale(
  domain: [number, number],
  lowColor: RGBA = { r: 68, g: 1, b: 84, a: 1 },   // viridis low
  highColor: RGBA = { r: 253, g: 231, b: 37, a: 1 } // viridis high
): ResolvedColorScale {
  const [min, max] = domain
  const span = max - min

  return {
    aesthetic: 'color',
    type: 'continuous',
    domain,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return lowColor
      const t = Math.max(0, Math.min(1, (num - min) / span))
      return interpolateColor(lowColor, highColor, t)
    },
  }
}

/**
 * Check if data field contains categorical (non-numeric) values
 */
function isCategoricalField(data: DataSource, field: string): boolean {
  for (const row of data) {
    const value = row[field]
    if (value !== null && value !== undefined) {
      if (typeof value === 'string' && isNaN(Number(value))) {
        return true
      }
    }
  }
  return false
}

/**
 * Resolved size scale - maps values to size indices (0-3)
 */
export interface ResolvedSizeScale {
  aesthetic: string
  type: 'continuous'
  domain: [number, number]
  map(value: unknown): number  // Returns 0-3 size index
}

/**
 * Create a resolved continuous size scale
 */
export function createResolvedSizeScale(
  domain: [number, number]
): ResolvedSizeScale {
  const [min, max] = domain
  const span = max - min

  return {
    aesthetic: 'size',
    type: 'continuous',
    domain,
    map(value: unknown): number {
      const num = Number(value)
      if (isNaN(num)) return 1  // Default to medium size
      // Map to 0-3 size index
      const t = Math.max(0, Math.min(1, (num - min) / span))
      return Math.floor(t * 3.99)  // 0, 1, 2, or 3
    },
  }
}

/**
 * Coordinate limits for zooming/clipping
 */
export interface CoordLimits {
  xlim?: [number, number]
  ylim?: [number, number]
}

/**
 * Compute domain for a scale, handling transforms appropriately
 * For log scales, uses the raw data range without nice expansion to 0
 */
function computeDomain(
  data: DataSource,
  field: string,
  trans: ScaleTransform = 'identity'
): [number, number] {
  const rawDomain = inferContinuousDomain(data, field)

  // For log scales, don't use niceDomain since it might expand to 0
  // Instead, use nice values that stay within the positive range
  if (trans === 'log10') {
    const [min, max] = rawDomain
    // Ensure minimum is positive for log scale
    const safeMin = min > 0 ? min : 0.001
    const safeMax = max > 0 ? max : 1

    // Find nice powers of 10 that bound the data
    const minPow = Math.floor(Math.log10(safeMin))
    const maxPow = Math.ceil(Math.log10(safeMax))

    return [Math.pow(10, minPow), Math.pow(10, maxPow)]
  }

  // For other transforms, use niceDomain
  return niceDomain(rawDomain)
}

/**
 * Build scale context from data and aesthetic mapping
 */
export function buildScaleContext(
  data: DataSource,
  aes: AestheticMapping,
  plotArea: { x: number; y: number; width: number; height: number },
  userScales: Scale[] = [],
  coordLimits?: CoordLimits
): ScaleContext {
  // Find user-provided scales
  const userXScale = userScales.find((s) => s.aesthetic === 'x')
  const userYScale = userScales.find((s) => s.aesthetic === 'y')
  const userColorScale = userScales.find(
    (s) => s.aesthetic === 'color' || s.aesthetic === 'fill'
  )

  // Determine if x is categorical or continuous
  const xIsCategorical = isCategoricalField(data, aes.x)

  // Create x scale
  let x: ResolvedScale
  if (xIsCategorical) {
    // Extract ordering options from user scale if provided
    const xOrderOptions: InferDiscreteOptions = {}
    if (userXScale) {
      if (userXScale.domain && Array.isArray(userXScale.domain)) {
        xOrderOptions.limits = userXScale.domain as string[]
      }
      // Check for orderOptions on user scale (from scale_x_discrete)
      const orderOpts = (userXScale as any).orderOptions
      if (orderOpts) {
        if (orderOpts.order) xOrderOptions.order = orderOpts.order
        if (orderOpts.reverse) xOrderOptions.reverse = orderOpts.reverse
        if (orderOpts.exclude) xOrderOptions.exclude = orderOpts.exclude
        if (orderOpts.drop !== undefined) xOrderOptions.drop = orderOpts.drop
      }
    }
    const xDomain = inferDiscreteDomain(data, aes.x, xOrderOptions)
    x = createResolvedDiscreteScale(
      'x',
      xDomain,
      [plotArea.x, plotArea.x + plotArea.width - 1]
    )
    // Apply custom labels if provided
    if (userXScale?.labels) {
      x.labels = userXScale.labels as string[]
    }
  } else {
    // Get transform from user scale
    const xTrans = userXScale?.trans ?? 'identity'
    // Priority: coord xlim > user scale domain > computed from data
    const xDomain = coordLimits?.xlim ??
      userXScale?.domain as [number, number] | undefined ??
      computeDomain(data, aes.x, xTrans)
    x = createResolvedContinuousScale(
      'x',
      xDomain,
      [plotArea.x, plotArea.x + plotArea.width - 1],
      xTrans
    )
    // Apply user-provided breaks and labels
    if (userXScale?.breaks) {
      x.breaks = userXScale.breaks
    }
    if (userXScale?.labels) {
      x.labels = userXScale.labels
    }
  }

  // Determine if y is categorical or continuous
  const yIsCategorical = isCategoricalField(data, aes.y)

  // Create y scale (maps to vertical canvas range, inverted because y=0 is top)
  let y: ResolvedScale
  if (yIsCategorical) {
    // Extract ordering options from user scale if provided
    const yOrderOptions: InferDiscreteOptions = {}
    if (userYScale) {
      if (userYScale.domain && Array.isArray(userYScale.domain)) {
        yOrderOptions.limits = userYScale.domain as string[]
      }
      // Check for orderOptions on user scale (from scale_y_discrete)
      const orderOpts = (userYScale as any).orderOptions
      if (orderOpts) {
        if (orderOpts.order) yOrderOptions.order = orderOpts.order
        if (orderOpts.reverse) yOrderOptions.reverse = orderOpts.reverse
        if (orderOpts.exclude) yOrderOptions.exclude = orderOpts.exclude
        if (orderOpts.drop !== undefined) yOrderOptions.drop = orderOpts.drop
      }
    }
    const yDomain = inferDiscreteDomain(data, aes.y, yOrderOptions)
    y = createResolvedDiscreteScale(
      'y',
      yDomain,
      [plotArea.y + plotArea.height - 1, plotArea.y] // Inverted!
    )
    // Apply custom labels if provided
    if (userYScale?.labels) {
      y.labels = userYScale.labels as string[]
    }
  } else {
    // Get transform from user scale
    const yTrans = userYScale?.trans ?? 'identity'
    // Priority: coord ylim > user scale domain > computed from data
    const yDomain = coordLimits?.ylim ??
      userYScale?.domain as [number, number] | undefined ??
      computeDomain(data, aes.y, yTrans)

    y = createResolvedContinuousScale(
      'y',
      yDomain,
      [plotArea.y + plotArea.height - 1, plotArea.y], // Inverted!
      yTrans
    )
    // Apply user-provided breaks and labels
    if (userYScale?.breaks) {
      y.breaks = userYScale.breaks
    }
    if (userYScale?.labels) {
      y.labels = userYScale.labels
    }
  }

  const context: ScaleContext = { x, y }

  // Handle secondary y-axis if present
  if (aes.y2) {
    const userY2Scale = userScales.find((s) => s.aesthetic === 'y2')
    const y2Trans = userY2Scale?.trans ?? 'identity'
    const y2Domain = userY2Scale?.domain as [number, number] | undefined ??
      computeDomain(data, aes.y2, y2Trans)

    // Create y2 scale with same range as y (inverted for canvas)
    const y2 = createResolvedContinuousScale(
      'y2',
      y2Domain,
      [plotArea.y + plotArea.height - 1, plotArea.y], // Same inverted range
      y2Trans
    )
    // Apply user-provided breaks and labels
    if (userY2Scale?.breaks) {
      y2.breaks = userY2Scale.breaks
    }
    if (userY2Scale?.labels) {
      y2.labels = userY2Scale.labels
    }
    context.y2 = y2
  }

  // Handle color aesthetic if present
  const colorAesField = aes.color || aes.fill
  if (colorAesField) {
    // Extract ordering options from user color scale if provided
    const colorOrderOptions: InferDiscreteOptions = {}
    if (userColorScale) {
      if (userColorScale.domain && Array.isArray(userColorScale.domain)) {
        colorOrderOptions.limits = userColorScale.domain as string[]
      }
      // Check for orderOptions on user scale
      const orderOpts = (userColorScale as any).orderOptions
      if (orderOpts) {
        if (orderOpts.order) colorOrderOptions.order = orderOpts.order
        if (orderOpts.reverse) colorOrderOptions.reverse = orderOpts.reverse
        if (orderOpts.exclude) colorOrderOptions.exclude = orderOpts.exclude
        if (orderOpts.drop !== undefined) colorOrderOptions.drop = orderOpts.drop
      }
    }
    const colorDomain = inferDiscreteDomain(data, colorAesField, colorOrderOptions)

    // Use user-provided color scale if available
    if (userColorScale && userColorScale.map) {
      context.color = {
        aesthetic: userColorScale.aesthetic || 'color',
        type: userColorScale.type === 'continuous' ? 'continuous' : 'discrete',
        domain: userColorScale.type === 'continuous'
          ? (userColorScale.domain as [number, number] ?? inferContinuousDomain(data, colorAesField))
          : colorDomain,
        map: (value: unknown): RGBA => {
          const result = userColorScale.map(value)
          // Handle both RGBA and hex string returns
          if (typeof result === 'object' && 'r' in result) {
            return result as RGBA
          }
          // Default fallback
          return { r: 128, g: 128, b: 128, a: 1 }
        },
      }
    } else {
      context.color = createResolvedDiscreteColorScale(colorDomain)
    }
  }

  // Handle size aesthetic if present
  if (aes.size) {
    const sizeDomain = inferContinuousDomain(data, aes.size)
    context.size = createResolvedSizeScale(sizeDomain)
  }

  return context
}
