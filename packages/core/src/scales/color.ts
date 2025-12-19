/**
 * Color scales
 *
 * Provides a comprehensive set of color palettes for data visualization,
 * including sequential, diverging, and categorical palettes.
 */

import type { Scale, RGBA } from '../types'

// Color palette definitions organized by type
const PALETTES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // VIRIDIS FAMILY (perceptually uniform, colorblind-friendly)
  // ═══════════════════════════════════════════════════════════════════════════
  viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
  plasma: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'],
  inferno: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'],
  magma: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'],
  cividis: ['#002051', '#1d3f6e', '#52596a', '#7b7b78', '#a89f68', '#d9c84a', '#fdea45'],
  turbo: ['#30123b', '#4662d7', '#35aaf8', '#1ae4b6', '#72fe5e', '#c8ef34', '#faba39', '#f66b19', '#ca2a04'],

  // ═══════════════════════════════════════════════════════════════════════════
  // SEQUENTIAL SINGLE-HUE (ColorBrewer)
  // ═══════════════════════════════════════════════════════════════════════════
  Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
  Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
  Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
  Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],

  // ═══════════════════════════════════════════════════════════════════════════
  // SEQUENTIAL MULTI-HUE (ColorBrewer)
  // ═══════════════════════════════════════════════════════════════════════════
  BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
  BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
  GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
  OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
  PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
  PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
  PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
  RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
  YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238b45', '#006837', '#004529'],
  YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
  YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
  YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],

  // ═══════════════════════════════════════════════════════════════════════════
  // DIVERGING (ColorBrewer)
  // ═══════════════════════════════════════════════════════════════════════════
  BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
  PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
  PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
  RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
  RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
  Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORICAL/QUALITATIVE (ColorBrewer & D3)
  // ═══════════════════════════════════════════════════════════════════════════
  category10: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  ],
  category20: [
    '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
    '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
    '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
    '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5',
  ],
  Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
  Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
  Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
  Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'],
  Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
  Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
  Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
  Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
  Tab10: [
    '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
    '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
  ],
  Tab20: [
    '#4e79a7', '#a0cbe8', '#f28e2c', '#ffbe7d', '#59a14f',
    '#8cd17d', '#b6992d', '#f1ce63', '#499894', '#86bcb6',
    '#e15759', '#ff9d9a', '#79706e', '#bab0ac', '#d37295',
    '#fabfd2', '#b07aa1', '#d4a6c8', '#9d7660', '#d7b5a6',
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENTIFIC/DOMAIN-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════
  // Ocean temperature
  thermal: ['#042333', '#2c3e50', '#0b5345', '#1e8449', '#f39c12', '#e74c3c', '#fadbd8'],
  // Bathymetry
  haline: ['#2c3e50', '#1a5276', '#2980b9', '#5dade2', '#aed6f1', '#d5f5e3'],
  // Topography
  terrain: ['#333399', '#0099ff', '#00cc00', '#ffff00', '#ff9900', '#cc6600', '#996633', '#ffffff'],
  // Rainbow (use sparingly - not perceptually uniform)
  rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'],
  // Cubehelix (perceptually uniform, good for grayscale conversion)
  cubehelix: ['#000000', '#1a1530', '#30304d', '#4d5366', '#6d826e', '#8ab17d', '#add38a', '#dae8a2', '#ffffff'],
}

/**
 * Parse hex color to RGBA
 */
function hexToRgba(hex: string): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0, a: 1 }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1,
  }
}

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

export interface ColorContinuousOptions {
  palette?: keyof typeof PALETTES | string[]
  limits?: [number, number]
  na_value?: string
}

/**
 * Continuous color scale
 */
export function scale_color_continuous(
  options: ColorContinuousOptions = {}
): Scale {
  const paletteColors = Array.isArray(options.palette)
    ? options.palette
    : PALETTES[options.palette ?? 'viridis']

  const colors = paletteColors.map(hexToRgba)

  return {
    type: 'continuous',
    aesthetic: 'color',
    domain: options.limits,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return hexToRgba(options.na_value ?? '#808080')

      // Normalize to 0-1 range (actual normalization happens during rendering)
      const t = Math.max(0, Math.min(1, num))

      // Find the two colors to interpolate between
      const segmentLength = 1 / (colors.length - 1)
      const segmentIndex = Math.min(
        Math.floor(t / segmentLength),
        colors.length - 2
      )
      const segmentT = (t - segmentIndex * segmentLength) / segmentLength

      return interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], segmentT)
    },
  }
}

/**
 * Viridis color scale
 */
export function scale_color_viridis(
  options: Omit<ColorContinuousOptions, 'palette'> = {}
): Scale {
  return scale_color_continuous({ ...options, palette: 'viridis' })
}

/**
 * Ordering strategy for discrete color scales
 */
export type ColorDiscreteOrder =
  | 'alphabetical'  // Sort alphabetically (default)
  | 'data'          // Order by first appearance in data
  | 'frequency'     // Order by frequency (most common first)
  | 'reverse'       // Reverse alphabetical

export interface ColorDiscreteOptions {
  palette?: keyof typeof PALETTES | string[]
  na_value?: string
  /** Explicit order of categories */
  limits?: string[]
  /** Ordering strategy when limits not provided */
  order?: ColorDiscreteOrder
  /** Reverse the order */
  reverse?: boolean
  /** Exclude specific categories */
  exclude?: string[]
}

/**
 * Discrete color scale with ordering support
 */
export function scale_color_discrete(
  options: ColorDiscreteOptions = {}
): Scale & { orderOptions?: ColorDiscreteOptions } {
  const paletteColors = Array.isArray(options.palette)
    ? options.palette
    : PALETTES[options.palette ?? 'category10']

  const valueToIndex = new Map<string, number>()

  // Apply limits ordering if provided
  let effectiveLimits = options.limits
  if (effectiveLimits && options.reverse) {
    effectiveLimits = [...effectiveLimits].reverse()
  }

  // Apply exclusions
  if (effectiveLimits && options.exclude) {
    const excludeSet = new Set(options.exclude)
    effectiveLimits = effectiveLimits.filter(v => !excludeSet.has(v))
  }

  // Pre-populate valueToIndex with limits order
  if (effectiveLimits) {
    effectiveLimits.forEach((v, i) => valueToIndex.set(v, i))
  }

  return {
    type: 'discrete',
    aesthetic: 'color',
    domain: effectiveLimits,
    // Store order options for pipeline
    orderOptions: options,
    map(value: unknown): RGBA {
      const key = String(value)

      // Check exclusions
      if (options.exclude?.includes(key)) {
        return hexToRgba(options.na_value ?? '#808080')
      }

      if (!valueToIndex.has(key)) {
        valueToIndex.set(key, valueToIndex.size)
      }

      const index = valueToIndex.get(key)!
      const colorHex = paletteColors[index % paletteColors.length]
      return hexToRgba(colorHex)
    },
  }
}

export interface ColorManualOptions {
  values: Record<string, string>
  na_value?: string
}

/**
 * Manual color scale with explicit mappings
 */
export function scale_color_manual(options: ColorManualOptions): Scale {
  return {
    type: 'discrete',
    aesthetic: 'color',
    map(value: unknown): RGBA {
      const key = String(value)
      const colorHex = options.values[key] ?? options.na_value ?? '#808080'
      return hexToRgba(colorHex)
    },
  }
}

// Fill scale variants (same as color but for fill aesthetic)
export function scale_fill_continuous(options: ColorContinuousOptions = {}): Scale {
  const scale = scale_color_continuous(options)
  return { ...scale, aesthetic: 'fill' }
}

export function scale_fill_viridis(options: Omit<ColorContinuousOptions, 'palette'> = {}): Scale {
  const scale = scale_color_viridis(options)
  return { ...scale, aesthetic: 'fill' }
}

export function scale_fill_discrete(options: ColorDiscreteOptions = {}): Scale {
  const scale = scale_color_discrete(options)
  return { ...scale, aesthetic: 'fill' }
}

export function scale_fill_manual(options: ColorManualOptions): Scale {
  const scale = scale_color_manual(options)
  return { ...scale, aesthetic: 'fill' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORBREWER-STYLE CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type BrewerPalette =
  // Sequential
  | 'Blues' | 'Greens' | 'Greys' | 'Oranges' | 'Purples' | 'Reds'
  | 'BuGn' | 'BuPu' | 'GnBu' | 'OrRd' | 'PuBu' | 'PuBuGn' | 'PuRd' | 'RdPu'
  | 'YlGn' | 'YlGnBu' | 'YlOrBr' | 'YlOrRd'
  // Diverging
  | 'BrBG' | 'PiYG' | 'PRGn' | 'PuOr' | 'RdBu' | 'RdGy' | 'RdYlBu' | 'RdYlGn' | 'Spectral'
  // Qualitative
  | 'Accent' | 'Dark2' | 'Paired' | 'Pastel1' | 'Pastel2' | 'Set1' | 'Set2' | 'Set3'

export interface BrewerOptions {
  palette?: BrewerPalette
  direction?: 1 | -1
  na_value?: string
  /** Explicit order of categories */
  limits?: string[]
  /** Ordering strategy when limits not provided */
  order?: ColorDiscreteOrder
  /** Reverse the order */
  reverse?: boolean
  /** Exclude specific categories */
  exclude?: string[]
}

/**
 * ColorBrewer scale for discrete data (categorical palettes)
 * Use this for categorical/qualitative data with ordering support
 */
export function scale_color_brewer(options: BrewerOptions = {}): Scale & { orderOptions?: BrewerOptions } {
  const paletteName = options.palette ?? 'Set1'
  let paletteColors = PALETTES[paletteName] ?? PALETTES.Set1

  if (options.direction === -1) {
    paletteColors = [...paletteColors].reverse()
  }

  const valueToIndex = new Map<string, number>()

  // Apply limits ordering if provided
  let effectiveLimits = options.limits
  if (effectiveLimits && options.reverse) {
    effectiveLimits = [...effectiveLimits].reverse()
  }

  // Apply exclusions
  if (effectiveLimits && options.exclude) {
    const excludeSet = new Set(options.exclude)
    effectiveLimits = effectiveLimits.filter(v => !excludeSet.has(v))
  }

  // Pre-populate valueToIndex with limits order
  if (effectiveLimits) {
    effectiveLimits.forEach((v, i) => valueToIndex.set(v, i))
  }

  return {
    type: 'discrete',
    aesthetic: 'color',
    domain: effectiveLimits,
    orderOptions: options,
    map(value: unknown): RGBA {
      const key = String(value)

      // Check exclusions
      if (options.exclude?.includes(key)) {
        return hexToRgba(options.na_value ?? '#808080')
      }

      if (!valueToIndex.has(key)) {
        valueToIndex.set(key, valueToIndex.size)
      }
      const index = valueToIndex.get(key)!
      const colorHex = paletteColors[index % paletteColors.length]
      return hexToRgba(colorHex)
    },
  }
}

export function scale_fill_brewer(options: BrewerOptions = {}): Scale {
  const scale = scale_color_brewer(options)
  return { ...scale, aesthetic: 'fill' }
}

export interface DistillerOptions {
  palette?: BrewerPalette
  direction?: 1 | -1
  limits?: [number, number]
  na_value?: string
}

/**
 * ColorBrewer scale for continuous data (distiller)
 * Interpolates between palette colors for continuous values
 */
export function scale_color_distiller(options: DistillerOptions = {}): Scale {
  const paletteName = options.palette ?? 'Blues'
  let paletteColors = PALETTES[paletteName] ?? PALETTES.Blues

  if (options.direction === -1) {
    paletteColors = [...paletteColors].reverse()
  }

  return scale_color_continuous({
    palette: paletteColors,
    limits: options.limits,
    na_value: options.na_value,
  })
}

export function scale_fill_distiller(options: DistillerOptions = {}): Scale {
  const scale = scale_color_distiller(options)
  return { ...scale, aesthetic: 'fill' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT SCALES (ggplot2-style)
// ═══════════════════════════════════════════════════════════════════════════════

export interface GradientOptions {
  low?: string
  high?: string
  limits?: [number, number]
  na_value?: string
}

/**
 * Two-color gradient scale
 * Creates a smooth gradient from low to high color
 */
export function scale_color_gradient(options: GradientOptions = {}): Scale {
  const lowColor = hexToRgba(options.low ?? '#132B43')
  const highColor = hexToRgba(options.high ?? '#56B1F7')

  return {
    type: 'continuous',
    aesthetic: 'color',
    domain: options.limits,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return hexToRgba(options.na_value ?? '#808080')
      const t = Math.max(0, Math.min(1, num))
      return interpolateColor(lowColor, highColor, t)
    },
  }
}

export function scale_fill_gradient(options: GradientOptions = {}): Scale {
  const scale = scale_color_gradient(options)
  return { ...scale, aesthetic: 'fill' }
}

export interface Gradient2Options {
  low?: string
  mid?: string
  high?: string
  midpoint?: number
  limits?: [number, number]
  na_value?: string
}

/**
 * Three-color diverging gradient scale
 * Creates a gradient from low through mid to high color
 */
export function scale_color_gradient2(options: Gradient2Options = {}): Scale {
  const lowColor = hexToRgba(options.low ?? '#67001F')
  const midColor = hexToRgba(options.mid ?? '#FFFFFF')
  const highColor = hexToRgba(options.high ?? '#053061')

  return {
    type: 'continuous',
    aesthetic: 'color',
    domain: options.limits,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return hexToRgba(options.na_value ?? '#808080')
      const t = Math.max(0, Math.min(1, num))

      if (t < 0.5) {
        return interpolateColor(lowColor, midColor, t * 2)
      } else {
        return interpolateColor(midColor, highColor, (t - 0.5) * 2)
      }
    },
  }
}

export function scale_fill_gradient2(options: Gradient2Options = {}): Scale {
  const scale = scale_color_gradient2(options)
  return { ...scale, aesthetic: 'fill' }
}

export interface GradientNOptions {
  colors: string[]
  limits?: [number, number]
  na_value?: string
}

/**
 * N-color gradient scale
 * Creates a smooth gradient through multiple colors
 */
export function scale_color_gradientn(options: GradientNOptions): Scale {
  return scale_color_continuous({
    palette: options.colors,
    limits: options.limits,
    na_value: options.na_value,
  })
}

export function scale_fill_gradientn(options: GradientNOptions): Scale {
  const scale = scale_color_gradientn(options)
  return { ...scale, aesthetic: 'fill' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIRIDIS FAMILY CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type ViridisOption = 'viridis' | 'magma' | 'plasma' | 'inferno' | 'cividis' | 'turbo'

export interface ViridisOptions {
  option?: ViridisOption
  direction?: 1 | -1
  limits?: [number, number]
  na_value?: string
}

/**
 * Viridis family color scales (perceptually uniform, colorblind-friendly)
 */
export function scale_color_viridis_c(options: ViridisOptions = {}): Scale {
  const paletteName = options.option ?? 'viridis'
  let paletteColors = PALETTES[paletteName] ?? PALETTES.viridis

  if (options.direction === -1) {
    paletteColors = [...paletteColors].reverse()
  }

  return scale_color_continuous({
    palette: paletteColors,
    limits: options.limits,
    na_value: options.na_value,
  })
}

export function scale_fill_viridis_c(options: ViridisOptions = {}): Scale {
  const scale = scale_color_viridis_c(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Plasma color scale
 */
export function scale_color_plasma(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  return scale_color_viridis_c({ ...options, option: 'plasma' })
}

export function scale_fill_plasma(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  const scale = scale_color_plasma(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Inferno color scale
 */
export function scale_color_inferno(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  return scale_color_viridis_c({ ...options, option: 'inferno' })
}

export function scale_fill_inferno(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  const scale = scale_color_inferno(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Magma color scale
 */
export function scale_color_magma(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  return scale_color_viridis_c({ ...options, option: 'magma' })
}

export function scale_fill_magma(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  const scale = scale_color_magma(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Cividis color scale (optimized for color vision deficiency)
 */
export function scale_color_cividis(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  return scale_color_viridis_c({ ...options, option: 'cividis' })
}

export function scale_fill_cividis(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  const scale = scale_color_cividis(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Turbo color scale (rainbow-like but more perceptually uniform)
 */
export function scale_color_turbo(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  return scale_color_viridis_c({ ...options, option: 'turbo' })
}

export function scale_fill_turbo(options: Omit<ViridisOptions, 'option'> = {}): Scale {
  const scale = scale_color_turbo(options)
  return { ...scale, aesthetic: 'fill' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GREY/GRAY SCALE
// ═══════════════════════════════════════════════════════════════════════════════

export interface GreyOptions {
  start?: number  // 0-1, darkness of lightest color
  end?: number    // 0-1, darkness of darkest color
  limits?: [number, number]
  na_value?: string
}

/**
 * Grey/Grayscale for continuous data
 */
export function scale_color_grey(options: GreyOptions = {}): Scale {
  const start = options.start ?? 0.2
  const end = options.end ?? 0.8

  return {
    type: 'continuous',
    aesthetic: 'color',
    domain: options.limits,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return hexToRgba(options.na_value ?? '#808080')
      const t = Math.max(0, Math.min(1, num))
      const grey = Math.round((start + t * (end - start)) * 255)
      return { r: 255 - grey, g: 255 - grey, b: 255 - grey, a: 1 }
    },
  }
}

// Alias for American spelling
export const scale_color_gray = scale_color_grey

export function scale_fill_grey(options: GreyOptions = {}): Scale {
  const scale = scale_color_grey(options)
  return { ...scale, aesthetic: 'fill' }
}

export const scale_fill_gray = scale_fill_grey

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY SCALE (use data values directly as colors)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Identity color scale - uses data values directly as color specifications
 * Data should contain valid hex colors like '#ff0000'
 */
export function scale_color_identity(): Scale {
  return {
    type: 'identity',
    aesthetic: 'color',
    map(value: unknown): RGBA {
      const colorStr = String(value)
      return hexToRgba(colorStr)
    },
  }
}

export function scale_fill_identity(): Scale {
  const scale = scale_color_identity()
  return { ...scale, aesthetic: 'fill' }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUE SCALE (for cyclical data like angles or time of day)
// ═══════════════════════════════════════════════════════════════════════════════

export interface HueOptions {
  h?: [number, number]  // Hue range (0-360)
  c?: number            // Chroma (saturation) 0-100
  l?: number            // Luminance 0-100
  limits?: [number, number]
  na_value?: string
}

/**
 * Hue-based color scale for cyclical data
 * Varies hue while keeping saturation and lightness constant
 */
export function scale_color_hue(options: HueOptions = {}): Scale {
  const hRange = options.h ?? [15, 375]
  const chroma = options.c ?? 100
  const luminance = options.l ?? 65

  return {
    type: 'continuous',
    aesthetic: 'color',
    domain: options.limits,
    map(value: unknown): RGBA {
      const num = Number(value)
      if (isNaN(num)) return hexToRgba(options.na_value ?? '#808080')
      const t = Math.max(0, Math.min(1, num))
      const hue = hRange[0] + t * (hRange[1] - hRange[0])
      return hslToRgba(hue % 360, chroma, luminance)
    },
  }
}

export function scale_fill_hue(options: HueOptions = {}): Scale {
  const scale = scale_color_hue(options)
  return { ...scale, aesthetic: 'fill' }
}

/**
 * Convert HSL to RGBA
 */
function hslToRgba(h: number, s: number, l: number): RGBA {
  s = s / 100
  l = l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: 1,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get list of available palette names
 */
export function getAvailablePalettes(): string[] {
  return Object.keys(PALETTES)
}

/**
 * Get colors for a specific palette
 */
export function getPaletteColors(name: string): string[] | undefined {
  return PALETTES[name as keyof typeof PALETTES]
}

/**
 * Export palette type for external use
 */
export type PaletteName = keyof typeof PALETTES
