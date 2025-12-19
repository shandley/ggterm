/**
 * GGTerm - Solid.js component for ggterm plots
 *
 * A declarative component for rendering grammar of graphics plots
 * in terminal-based Solid.js applications.
 */

import { createMemo, createEffect, onMount, onCleanup, splitProps } from 'solid-js'
import type { JSX, Accessor } from 'solid-js'
import {
  gg,
  GGPlot,
  type DataSource,
  type AestheticMapping,
  type Geom,
  type Scale,
  type Coord,
  type Facet,
  type Theme,
  type Labels,
  type RenderOptions,
} from '@ggterm/core'

export interface GGTermProps {
  /** Data source for the plot */
  data: DataSource | Accessor<DataSource>
  /** Aesthetic mapping */
  aes: AestheticMapping
  /** Geometry layers */
  geoms?: Geom[]
  /** Scale definitions */
  scales?: Scale[]
  /** Coordinate system */
  coord?: Coord
  /** Faceting specification */
  facet?: Facet
  /** Theme configuration */
  theme?: Theme | Partial<Theme>
  /** Labels (title, x, y, etc.) */
  labs?: Labels

  // Render options
  /** Plot width in characters */
  width?: number
  /** Plot height in characters */
  height?: number
  /** Renderer type */
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  /** Color mode */
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'

  // Event handlers
  /** Called when a point is hovered */
  onHover?: (index: number, record: DataSource[number] | null) => void
  /** Called when a point is clicked */
  onClick?: (index: number, record: DataSource[number]) => void
  /** Called when a key is pressed while focused */
  onKeyDown?: (event: KeyboardEvent) => void
  /** Called after each render */
  onRender?: (rendered: string) => void

  // Ref
  /** Ref callback to get component handle */
  ref?: (handle: GGTermHandle) => void

  /** Additional class name */
  class?: string
  /** Additional style */
  style?: JSX.CSSProperties
}

export interface GGTermHandle {
  /** Force a re-render */
  refresh: () => void
  /** Get the current rendered output */
  getRendered: () => string
  /** Get the plot instance */
  getPlot: () => GGPlot | null
  /** Get the plot specification */
  getSpec: () => ReturnType<GGPlot['spec']> | null
  /** Get point index at character position (approximate) */
  getPointAt: (charX: number, charY: number) => number
  /** Get all visible point indices */
  getVisiblePoints: () => number[]
}

/**
 * GGTerm component for Solid.js
 *
 * @example
 * ```tsx
 * import { GGTerm } from '@ggterm/solid'
 * import { geom_point, geom_line } from '@ggterm/core'
 *
 * function MyChart() {
 *   const [data, setData] = createSignal([
 *     { x: 1, y: 10 },
 *     { x: 2, y: 20 },
 *     { x: 3, y: 15 }
 *   ])
 *
 *   return (
 *     <GGTerm
 *       data={data()}
 *       aes={{ x: 'x', y: 'y' }}
 *       geoms={[geom_line(), geom_point()]}
 *       width={60}
 *       height={20}
 *     />
 *   )
 * }
 * ```
 */
export function GGTerm(props: GGTermProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'data',
    'aes',
    'geoms',
    'scales',
    'coord',
    'facet',
    'theme',
    'labs',
    'width',
    'height',
    'renderer',
    'colorMode',
    'onHover',
    'onClick',
    'onKeyDown',
    'onRender',
    'ref',
    'class',
    'style',
  ])

  // Resolve data (can be accessor or value)
  const resolvedData = createMemo(() => {
    const d = local.data
    return typeof d === 'function' ? d() : d
  })

  // Build plot instance
  const plot = createMemo(() => {
    const data = resolvedData()
    if (!data || data.length === 0) {
      return null
    }

    let p = gg(data).aes(local.aes)

    if (local.geoms) {
      for (const geom of local.geoms) {
        p = p.geom(geom)
      }
    }

    if (local.scales) {
      for (const scale of local.scales) {
        p = p.scale(scale)
      }
    }

    if (local.coord) {
      p = p.coord(local.coord)
    }

    if (local.facet) {
      p = p.facet(local.facet)
    }

    if (local.theme) {
      p = p.theme(local.theme)
    }

    if (local.labs) {
      p = p.labs(local.labs)
    }

    return p
  })

  // Render output
  const rendered = createMemo(() => {
    const p = plot()
    if (!p) return ''

    const opts: RenderOptions = {
      width: local.width ?? 70,
      height: local.height ?? 20,
      renderer: local.renderer,
      colorMode: local.colorMode,
    }

    return p.render(opts)
  })

  // Call onRender callback
  createEffect(() => {
    const output = rendered()
    if (output && local.onRender) {
      local.onRender(output)
    }
  })

  // Simple point location (approximate based on character grid)
  const getPointAt = (charX: number, charY: number): number => {
    const data = resolvedData()
    const p = plot()
    if (!data || !p) return -1

    // This is a simplified approximation
    // Real implementation would need to map character positions to data coordinates
    const width = local.width ?? 70
    const height = local.height ?? 20

    // Rough estimate: map char position to data range
    const spec = p.spec()
    const xField = spec.aes.x
    const yField = spec.aes.y

    // Find closest point (simplified)
    let closestIndex = -1
    let closestDist = Infinity

    data.forEach((record, index) => {
      const x = Number(record[xField])
      const y = Number(record[yField])
      if (isNaN(x) || isNaN(y)) return

      // Very rough approximation
      const dist = Math.abs(charX - (x / 100) * width) + Math.abs(charY - (y / 100) * height)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = index
      }
    })

    return closestIndex
  }

  const getVisiblePoints = (): number[] => {
    const data = resolvedData()
    if (!data) return []
    return data.map((_, i) => i)
  }

  // Create handle for ref
  const handle: GGTermHandle = {
    refresh: () => {
      // Force re-evaluation by accessing the memo
      rendered()
    },
    getRendered: () => rendered(),
    getPlot: () => plot(),
    getSpec: () => {
      const p = plot()
      return p ? p.spec() : null
    },
    getPointAt,
    getVisiblePoints,
  }

  // Pass handle to ref
  onMount(() => {
    if (local.ref) {
      local.ref(handle)
    }
  })

  // Render as pre element with ANSI output
  return (
    <pre
      class={local.class}
      style={{
        'font-family': 'monospace',
        'white-space': 'pre',
        margin: 0,
        padding: 0,
        ...local.style,
      }}
      tabIndex={0}
      onKeyDown={(e) => local.onKeyDown?.(e)}
      // Note: In a real TUI framework, hover/click would work differently
      // This is for web-based rendering
    >
      {rendered()}
    </pre>
  )
}

export default GGTerm
