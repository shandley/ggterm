/**
 * @ggterm/core - Grammar of Graphics for Terminal UIs
 *
 * A TypeScript implementation of Leland Wilkinson's Grammar of Graphics
 * for terminal-based rendering.
 */

// Main builder
export { gg, GGPlot } from './grammar'

// Types
export type {
  AestheticMapping,
  Canvas,
  CanvasCell,
  ComputedPoint,
  Coord,
  DataRecord,
  DataSource,
  Domain,
  Facet,
  Geom,
  Labels,
  PlotSpec,
  Range,
  Renderer,
  RenderOptions,
  RGBA,
  Scale,
  Stat,
  Theme,
} from './types'

// Canvas
export { TerminalCanvas, createCanvas, DEFAULT_FG, DEFAULT_BG } from './canvas'

// Pipeline
export {
  renderToCanvas,
  renderToString,
  calculateLayout,
  buildScaleContext,
  inferContinuousDomain,
  inferDiscreteDomain,
} from './pipeline'
export type { PlotLayout, ResolvedScale, ScaleContext } from './pipeline'

// Geometries
export {
  geom_point,
  geom_line,
  geom_hline,
  geom_vline,
  geom_bar,
  geom_col,
  geom_text,
  geom_label,
  geom_area,
  geom_ribbon,
  geom_histogram,
  geom_boxplot,
  geom_segment,
  geom_curve,
} from './geoms'

// Statistical transformations
export {
  stat_bin,
  stat_boxplot,
  stat_density,
  stat_smooth,
  stat_summary,
  computeBins,
  computeBoxplotStats,
  computeDensity,
  computeSmooth,
  computeSummary,
} from './stats'
export type {
  StatBinParams,
  BinResult,
  StatBoxplotParams,
  BoxplotResult,
  StatDensityParams,
  DensityResult,
  StatSmoothParams,
  SmoothResult,
  StatSummaryParams,
  SummaryResult,
  SummaryFun,
} from './stats'

// Scales
export {
  scale_x_continuous,
  scale_y_continuous,
  scale_x_log10,
  scale_y_log10,
  scale_x_sqrt,
  scale_y_sqrt,
  scale_x_reverse,
  scale_y_reverse,
  scale_x_discrete,
  scale_y_discrete,
  scale_color_continuous,
  scale_color_viridis,
  scale_color_discrete,
  scale_color_manual,
  scale_fill_continuous,
  scale_fill_viridis,
  scale_fill_discrete,
  scale_fill_manual,
} from './scales'

// Coordinates
export { coordCartesian, coordFlip, coordPolar } from './coords/cartesian'

// Facets
export {
  facet_wrap,
  facet_grid,
  computeFacetPanels,
  calculatePanelLayouts,
} from './facets'
export type {
  FacetWrapOptions,
  FacetGridOptions,
  FacetPanel,
  PanelLayout,
} from './facets'

// Themes
export {
  defaultTheme,
  themeMinimal,
  themeDark,
  themeClassic,
  themeVoid,
} from './themes/default'
