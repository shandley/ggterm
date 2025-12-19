/**
 * useGGTerm - Vue composable for managing a ggterm plot instance
 *
 * Provides reactive plot management with automatic re-rendering.
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
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

export interface UseGGTermOptions {
  /** Initial data */
  data?: DataSource | Ref<DataSource>
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
  /** Labels */
  labs?: Labels
  /** Plot width */
  width?: number
  /** Plot height */
  height?: number
  /** Renderer type */
  renderer?: 'braille' | 'block' | 'sixel' | 'auto'
  /** Color mode */
  colorMode?: 'none' | '16' | '256' | 'truecolor' | 'auto'
  /** Debounce ms */
  debounceMs?: number
  /** Auto-render on changes */
  autoRender?: boolean
}

export interface UseGGTermReturn {
  /** Rendered output */
  rendered: Ref<string>
  /** Current data */
  data: Ref<DataSource>
  /** Is rendering */
  isRendering: Ref<boolean>
  /** Render count */
  renderCount: Ref<number>
  /** Plot instance */
  plot: ComputedRef<GGPlot | null>

  /** Set data */
  setData: (data: DataSource) => void
  /** Push data */
  pushData: (record: DataSource[number] | DataSource) => void
  /** Clear data */
  clearData: () => void
  /** Force render */
  refresh: () => void
  /** Update options */
  setOptions: (options: Partial<UseGGTermOptions>) => void
}

/**
 * Vue composable for reactive ggterm plot management
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGGTerm } from '@ggterm/vue'
 * import { geom_point } from '@ggterm/core'
 *
 * const { rendered, setData, pushData } = useGGTerm({
 *   data: myData,
 *   aes: { x: 'x', y: 'y' },
 *   geoms: [geom_point()]
 * })
 * </script>
 *
 * <template>
 *   <pre>{{ rendered }}</pre>
 * </template>
 * ```
 */
export function useGGTerm(options: UseGGTermOptions): UseGGTermReturn {
  // Resolve initial data
  const initialData = options.data
    ? (typeof options.data === 'object' && 'value' in options.data
        ? options.data.value
        : options.data)
    : []

  // State
  const data = ref<DataSource>(initialData)
  const rendered = ref('')
  const isRendering = ref(false)
  const renderCount = ref(0)

  // Configuration
  const config = ref({
    aes: options.aes,
    geoms: options.geoms ?? [],
    scales: options.scales ?? [],
    coord: options.coord,
    facet: options.facet,
    theme: options.theme,
    labs: options.labs,
    width: options.width ?? 70,
    height: options.height ?? 20,
    renderer: options.renderer ?? 'auto',
    colorMode: options.colorMode ?? 'auto',
    debounceMs: options.debounceMs ?? 16,
    autoRender: options.autoRender ?? true,
  })

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Build plot
  const plot = computed(() => {
    const currentData = data.value
    if (currentData.length === 0) {
      return null
    }

    let p = gg(currentData).aes(config.value.aes)

    for (const geom of config.value.geoms) {
      p = p.geom(geom)
    }

    for (const scale of config.value.scales) {
      p = p.scale(scale)
    }

    if (config.value.coord) {
      p = p.coord(config.value.coord)
    }

    if (config.value.facet) {
      p = p.facet(config.value.facet)
    }

    if (config.value.theme) {
      p = p.theme(config.value.theme)
    }

    if (config.value.labs) {
      p = p.labs(config.value.labs)
    }

    return p
  })

  // Render function
  const doRender = () => {
    const currentPlot = plot.value
    if (!currentPlot) {
      rendered.value = ''
      return
    }

    isRendering.value = true

    try {
      const renderOpts: RenderOptions = {
        width: config.value.width,
        height: config.value.height,
        renderer: config.value.renderer,
        colorMode: config.value.colorMode,
      }

      rendered.value = currentPlot.render(renderOpts)
      renderCount.value++
    } finally {
      isRendering.value = false
    }
  }

  // Debounced render
  const scheduleRender = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (config.value.debounceMs > 0) {
      debounceTimer = setTimeout(doRender, config.value.debounceMs)
    } else {
      doRender()
    }
  }

  // Watch for changes
  watch(
    [data, plot],
    () => {
      if (config.value.autoRender) {
        scheduleRender()
      }
    },
    { immediate: true }
  )

  // Cleanup
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  // Actions
  const setData = (newData: DataSource) => {
    data.value = newData
  }

  const pushData = (record: DataSource[number] | DataSource) => {
    if (Array.isArray(record)) {
      data.value = [...data.value, ...record]
    } else {
      data.value = [...data.value, record]
    }
  }

  const clearData = () => {
    data.value = []
  }

  const refresh = () => {
    doRender()
  }

  const setOptions = (newOptions: Partial<UseGGTermOptions>) => {
    config.value = { ...config.value, ...newOptions }
  }

  return {
    rendered,
    data,
    isRendering,
    renderCount,
    plot,

    setData,
    pushData,
    clearData,
    refresh,
    setOptions,
  }
}
