/**
 * @ggterm/solid - Solid.js integration for ggterm
 *
 * Provides Solid.js components and primitives for building
 * grammar of graphics visualizations in terminal UIs.
 *
 * @example
 * ```tsx
 * import { GGTerm, createGGTerm, createPlotData } from '@ggterm/solid'
 * import { geom_point, geom_line } from '@ggterm/core'
 *
 * // Using the component
 * function MyChart() {
 *   return (
 *     <GGTerm
 *       data={data}
 *       aes={{ x: 'time', y: 'value' }}
 *       geoms={[geom_line(), geom_point()]}
 *     />
 *   )
 * }
 *
 * // Using primitives for more control
 * function AdvancedChart() {
 *   const plotData = createPlotData({ maxPoints: 100 })
 *   const plot = createGGTerm({
 *     data: plotData.windowedData(),
 *     aes: { x: 'time', y: 'value' },
 *     geoms: [geom_line()]
 *   })
 *
 *   // Stream data
 *   setInterval(() => {
 *     plotData.push({ time: Date.now(), value: Math.random() * 100 })
 *   }, 100)
 *
 *   return <pre>{plot.rendered()}</pre>
 * }
 * ```
 */

// Components
export { GGTerm } from './components'
export type { GGTermProps, GGTermHandle } from './components'

// Primitives
export {
  createGGTerm,
  createPlotData,
  createPlotInteraction,
} from './primitives'

export type {
  // createGGTerm types
  GGTermOptions,
  GGTermState,
  GGTermActions,
  CreateGGTermReturn,
  CreateGGTermProps,
  // createPlotData types
  PlotDataOptions,
  PlotDataState,
  PlotDataActions,
  CreatePlotDataReturn,
  // createPlotInteraction types
  SelectionMode,
  Viewport,
  BrushRect,
  PlotInteractionOptions,
  PlotInteractionState,
  PlotInteractionActions,
  CreatePlotInteractionReturn,
} from './primitives'

// Re-export commonly used types from core for convenience
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
