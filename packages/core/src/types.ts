/**
 * Core types for ggterm Grammar of Graphics
 */

// Data types
export type DataRecord = Record<string, unknown>
export type DataSource = DataRecord[]

// Aesthetic mapping
export interface AestheticMapping {
  x: string
  y: string
  /** Secondary y-axis data field */
  y2?: string
  /** End x coordinate for segments/annotations */
  xend?: string
  /** End y coordinate for segments/annotations */
  yend?: string
  /** Min x for rect/area annotations */
  xmin?: string
  /** Max x for rect/area annotations */
  xmax?: string
  /** Min y for rect/area annotations */
  ymin?: string
  /** Max y for rect/area annotations */
  ymax?: string
  color?: string
  fill?: string
  size?: string
  shape?: string
  alpha?: string
  group?: string
  label?: string
}

// RGBA color
export interface RGBA {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
  a: number // 0-1
}

// Scale domain and range
export type Domain = [number, number] | string[]
export type Range = [number, number] | string[] | RGBA[]

// Scale transform type
export type ScaleTransform = 'identity' | 'log10' | 'sqrt' | 'reverse'

// Scale interface
export interface Scale {
  type: 'continuous' | 'discrete' | 'identity'
  aesthetic: string
  domain?: Domain
  range?: Range
  /** Custom tick positions */
  breaks?: number[]
  /** Custom tick labels (must match breaks length if both provided) */
  labels?: string[]
  /** Scale transformation */
  trans?: ScaleTransform
  map(value: unknown): number | string | RGBA
  invert?(position: number): unknown
}

// Coordinate system
export interface Coord {
  type: string
  transform(x: number, y: number): { x: number; y: number }
  /** X-axis limits for zooming (data is clipped, not filtered) */
  xlim?: [number, number]
  /** Y-axis limits for zooming (data is clipped, not filtered) */
  ylim?: [number, number]
  /** Whether to clip points outside the limits (default: true) */
  clip?: boolean
}

// Position type for geometry positioning (simplified inline to avoid circular deps)
export interface PositionSpec {
  type: 'identity' | 'dodge' | 'stack' | 'fill' | 'jitter'
  width?: number
  height?: number
  preserve?: 'total' | 'single'
}

// Geometry interface
export interface Geom {
  type: string
  stat?: string
  position?: string | PositionSpec
  params: Record<string, unknown>
}

// Statistic interface
export interface Stat {
  type: string
  compute(data: DataSource, aes: AestheticMapping): DataSource
}

// Labeller function type for facet strips
export type Labeller = (value: string, variable?: string) => string

// Facet interface
export interface Facet {
  type: 'wrap' | 'grid'
  vars: string | { rows?: string; cols?: string }
  ncol?: number
  nrow?: number
  scales?: 'fixed' | 'free' | 'free_x' | 'free_y'
  /** Labeller function for customizing strip labels */
  labeller?: Labeller
  /** Move row/column strips (for grid): 'x' moves col to bottom, 'y' moves row to left */
  switch?: 'x' | 'y' | 'both' | null
}

// Theme structure
export interface Theme {
  panel: {
    background: string
    border: 'none' | 'single' | 'double' | 'rounded'
    grid: { major: string | null; minor: string | null }
  }
  axis: {
    text: { color: string }
    ticks: { char: string; length: number }
    title: { color: string; bold: boolean }
  }
  legend: {
    position: 'right' | 'bottom' | 'none'
    title: { bold: boolean }
  }
  title: {
    align: 'left' | 'center' | 'right'
    bold: boolean
  }
  facet: {
    strip: {
      /** Strip text color */
      text: string
      /** Strip background color (use empty string for no background) */
      background: string
    }
  }
}

// Labels
export interface Labels {
  title?: string
  subtitle?: string
  caption?: string
  x?: string
  y?: string
  /** Label for secondary y-axis */
  y2?: string
  color?: string
  fill?: string
  size?: string
}

// Render options
export interface RenderOptions {
  width: number
  height: number
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'
}

// Canvas cell
export interface CanvasCell {
  char: string
  fg: RGBA
  bg: RGBA
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

// Abstract canvas
export interface Canvas {
  width: number
  height: number
  cells: CanvasCell[][]
  setCell(x: number, y: number, cell: Partial<CanvasCell>): void
  getCell(x: number, y: number): CanvasCell
  clear(): void
}

// Renderer interface
export interface Renderer {
  render(canvas: Canvas, options: RenderOptions): string
}

// Plot specification
export interface PlotSpec {
  data: DataSource
  aes: AestheticMapping
  geoms: Geom[]
  stats: Stat[]
  scales: Scale[]
  coord: Coord
  facet?: Facet
  theme: Theme
  labels: Labels
}

// Data point with computed aesthetics
export interface ComputedPoint {
  x: number
  y: number
  color?: RGBA
  size?: number
  shape?: string
  alpha?: number
  group?: string | number
  label?: string
  data: DataRecord
}
