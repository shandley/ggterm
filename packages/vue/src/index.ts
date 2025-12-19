/**
 * @ggterm/vue - Vue integration for ggterm
 *
 * Provides Vue components and composables for building
 * grammar of graphics visualizations in terminal UIs.
 *
 * @example
 * ```vue
 * <script setup>
 * import { GGTerm, useGGTerm, usePlotData } from '@ggterm/vue'
 * import { geom_point, geom_line } from '@ggterm/core'
 * import { ref } from 'vue'
 *
 * // Simple usage with component
 * const data = ref([{ x: 1, y: 10 }, { x: 2, y: 20 }])
 * </script>
 *
 * <template>
 *   <GGTerm
 *     :data="data"
 *     :aes="{ x: 'x', y: 'y' }"
 *     :geoms="[geom_line(), geom_point()]"
 *   />
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGGTerm, usePlotData } from '@ggterm/vue'
 * import { geom_line } from '@ggterm/core'
 * import { onUnmounted } from 'vue'
 *
 * // Advanced usage with composables
 * const plotData = usePlotData({ maxPoints: 100 })
 * const { rendered, setData } = useGGTerm({
 *   aes: { x: 'time', y: 'value' },
 *   geoms: [geom_line()]
 * })
 *
 * // Stream data
 * const interval = setInterval(() => {
 *   plotData.push({ time: Date.now(), value: Math.random() })
 *   setData(plotData.windowed.value)
 * }, 100)
 *
 * onUnmounted(() => clearInterval(interval))
 * </script>
 *
 * <template>
 *   <pre>{{ rendered }}</pre>
 * </template>
 * ```
 */

// Components
export { GGTerm } from './components'

// Composables
export {
  useGGTerm,
  usePlotData,
  usePlotInteraction,
} from './composables'

export type {
  // useGGTerm types
  UseGGTermOptions,
  UseGGTermReturn,
  // usePlotData types
  UsePlotDataOptions,
  UsePlotDataReturn,
  // usePlotInteraction types
  SelectionMode,
  Viewport,
  BrushRect,
  UsePlotInteractionOptions,
  UsePlotInteractionReturn,
} from './composables'

// Re-export commonly used types from core
export type {
  DataSource,
  DataRecord,
  AestheticMapping,
  RenderOptions,
  PlotSpec,
  Theme,
  Labels,
  Geom,
  Scale,
  Coord,
  Facet,
} from '@ggterm/core'
