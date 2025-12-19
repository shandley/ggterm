/**
 * createGGTerm - Solid.js primitive for managing a ggterm plot instance
 *
 * Provides reactive plot management with automatic re-rendering.
 */

import { createSignal, createMemo, createEffect, batch, onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
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

export interface GGTermOptions {
  /** Plot width in characters */
  width?: number
  /** Plot height in characters */
  height?: number
  /** Renderer type */
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  /** Color mode */
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'
  /** Debounce render in ms (0 to disable) */
  debounceMs?: number
  /** Auto-render on data/options change */
  autoRender?: boolean
}

export interface GGTermState {
  /** Current rendered output */
  rendered: Accessor<string>
  /** Current data */
  data: Accessor<DataSource>
  /** Is currently rendering */
  isRendering: Accessor<boolean>
  /** Last render timestamp */
  lastRenderTime: Accessor<number>
  /** Total render count */
  renderCount: Accessor<number>
  /** Current plot instance */
  plot: Accessor<GGPlot | null>
}

export interface GGTermActions {
  /** Set the data source */
  setData: (data: DataSource) => void
  /** Push new data (streaming) */
  pushData: (record: DataSource[number] | DataSource) => void
  /** Clear all data */
  clearData: () => void
  /** Set render options */
  setOptions: (options: Partial<GGTermOptions>) => void
  /** Force a re-render */
  refresh: () => void
  /** Get current options */
  getOptions: () => GGTermOptions
  /** Get the plot specification */
  getSpec: () => ReturnType<GGPlot['spec']> | null
}

export interface CreateGGTermReturn extends GGTermState, GGTermActions {}

export interface CreateGGTermProps {
  /** Initial data source */
  data?: DataSource
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
  /** Render options */
  options?: GGTermOptions
}

/**
 * Creates a reactive ggterm plot manager
 *
 * @example
 * ```tsx
 * const plot = createGGTerm({
 *   data: myData,
 *   aes: { x: 'time', y: 'value', color: 'series' },
 *   geoms: [geom_line(), geom_point()],
 *   options: { width: 80, height: 24 }
 * })
 *
 * // Access rendered output
 * console.log(plot.rendered())
 *
 * // Update data reactively
 * plot.pushData({ time: Date.now(), value: 42, series: 'A' })
 * ```
 */
export function createGGTerm(props: CreateGGTermProps): CreateGGTermReturn {
  // State signals
  const [data, setDataSignal] = createSignal<DataSource>(props.data ?? [])
  const [options, setOptionsSignal] = createSignal<GGTermOptions>({
    width: 70,
    height: 20,
    renderer: 'auto',
    colorMode: 'auto',
    debounceMs: 16,
    autoRender: true,
    ...props.options,
  })
  const [isRendering, setIsRendering] = createSignal(false)
  const [lastRenderTime, setLastRenderTime] = createSignal(0)
  const [renderCount, setRenderCount] = createSignal(0)
  const [rendered, setRendered] = createSignal('')

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Build plot instance reactively
  const plot = createMemo(() => {
    const currentData = data()
    if (currentData.length === 0 && !props.aes) {
      return null
    }

    let p = gg(currentData).aes(props.aes)

    // Add geoms
    if (props.geoms) {
      for (const geom of props.geoms) {
        p = p.geom(geom)
      }
    }

    // Add scales
    if (props.scales) {
      for (const scale of props.scales) {
        p = p.scale(scale)
      }
    }

    // Set coord
    if (props.coord) {
      p = p.coord(props.coord)
    }

    // Set facet
    if (props.facet) {
      p = p.facet(props.facet)
    }

    // Apply theme
    if (props.theme) {
      p = p.theme(props.theme)
    }

    // Set labels
    if (props.labs) {
      p = p.labs(props.labs)
    }

    return p
  })

  // Render function
  const doRender = () => {
    const p = plot()
    if (!p) {
      setRendered('')
      return
    }

    const opts = options()

    setIsRendering(true)
    try {
      const renderOpts: RenderOptions = {
        width: opts.width ?? 70,
        height: opts.height ?? 20,
        renderer: opts.renderer,
        colorMode: opts.colorMode,
      }

      const result = p.render(renderOpts)
      setRendered(result)
      setLastRenderTime(Date.now())
      setRenderCount((c) => c + 1)
    } finally {
      setIsRendering(false)
    }
  }

  // Debounced render
  const scheduleRender = () => {
    const opts = options()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (opts.debounceMs && opts.debounceMs > 0) {
      debounceTimer = setTimeout(doRender, opts.debounceMs)
    } else {
      doRender()
    }
  }

  // Auto-render effect
  createEffect(() => {
    // Track dependencies
    const _ = data()
    const __ = plot()
    const opts = options()

    if (opts.autoRender) {
      scheduleRender()
    }
  })

  // Cleanup
  onCleanup(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  // Actions
  const setData = (newData: DataSource) => {
    setDataSignal(newData)
  }

  const pushData = (record: DataSource[number] | DataSource) => {
    setDataSignal((prev) => {
      if (Array.isArray(record)) {
        return [...prev, ...record]
      }
      return [...prev, record]
    })
  }

  const clearData = () => {
    setDataSignal([])
  }

  const setOptions = (newOptions: Partial<GGTermOptions>) => {
    setOptionsSignal((prev) => ({ ...prev, ...newOptions }))
  }

  const refresh = () => {
    doRender()
  }

  const getOptions = () => options()

  const getSpec = () => {
    const p = plot()
    return p ? p.spec() : null
  }

  return {
    // State
    rendered,
    data,
    isRendering,
    lastRenderTime,
    renderCount,
    plot,

    // Actions
    setData,
    pushData,
    clearData,
    setOptions,
    refresh,
    getOptions,
    getSpec,
  }
}
