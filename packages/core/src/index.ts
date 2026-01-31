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
  geom_path,
  geom_hline,
  geom_vline,
  geom_bar,
  geom_col,
  geom_text,
  geom_label,
  geom_area,
  geom_ribbon,
  geom_histogram,
  geom_density,
  geom_boxplot,
  geom_segment,
  geom_curve,
  geom_smooth,
  geom_step,
  geom_rug,
  // Phase 7: Extended Grammar
  geom_violin,
  geom_tile,
  geom_raster,
  geom_bin2d,
  geom_contour,
  geom_contour_filled,
  geom_density_2d,
  geom_errorbar,
  geom_errorbarh,
  geom_crossbar,
  geom_linerange,
  geom_pointrange,
  geom_rect,
  geom_abline,
  // Q-Q plots
  geom_qq,
  geom_qq_line,
  // Frequency polygon
  geom_freqpoly,
  // Ridgeline (joy plots)
  geom_ridgeline,
  geom_joy,
  // Beeswarm plots
  geom_beeswarm,
  geom_quasirandom,
  // Dumbbell and lollipop
  geom_dumbbell,
  geom_lollipop,
  // Terminal-native geoms
  geom_waffle,
  geom_sparkline,
  geom_bullet,
  geom_braille,
  SPARK_BARS,
  SPARK_DOTS,
  BRAILLE_BASE,
  BRAILLE_DOTS,
  // Specialized visualizations
  geom_calendar,
  geom_flame,
  geom_icicle,
  geom_corrmat,
  geom_sankey,
  geom_treemap,
  geom_volcano,
  geom_ma,
  geom_manhattan,
  geom_heatmap,
  geom_biplot,
  // Clinical/Statistical visualizations
  geom_kaplan_meier,
  geom_forest,
  geom_roc,
  geom_bland_altman,
} from './geoms'
export type {
  PathOptions,
  RugOptions,
  SmoothOptions,
  StepOptions,
  ViolinOptions,
  TileOptions,
  Bin2dOptions,
  ContourOptions,
  ErrorbarOptions,
  RectOptions,
  AblineOptions,
  QQOptions,
  QQLineOptions,
  FreqpolyOptions,
  DensityOptions,
  RidgelineOptions,
  BeeswarmOptions,
  DumbbellOptions,
  LollipopOptions,
  WaffleOptions,
  SparklineOptions,
  BulletOptions,
  BrailleOptions,
  CalendarOptions,
  FlameOptions,
  CorrmatOptions,
  SankeyOptions,
  TreemapOptions,
  VolcanoOptions,
  MAOptions,
  ManhattanOptions,
  HeatmapOptions,
  BiplotOptions,
  KaplanMeierOptions,
  ForestOptions,
  RocOptions,
  BlandAltmanOptions,
} from './geoms'

// Position adjustments
export {
  position_identity,
  position_dodge,
  position_stack,
  position_fill,
  position_jitter,
  applyPositionAdjustment,
  isStackPosition,
  isDodgePosition,
  getPositionType,
} from './positions'
export type {
  Position,
  AdjustedPoint,
  DodgeOptions,
  JitterOptions,
  StackOptions,
  FillOptions,
} from './positions'

// Statistical transformations
export {
  stat_bin,
  stat_bin2d,
  stat_boxplot,
  stat_density,
  stat_smooth,
  stat_summary,
  stat_qq,
  stat_qq_line,
  computeBins,
  computeBins2d,
  computeBoxplotStats,
  computeDensity,
  computeSmooth,
  computeSummary,
  computeQQ,
  computeQQLine,
  stat_beeswarm,
  computeBeeswarm,
} from './stats'
export type {
  StatBinParams,
  StatBin2dParams,
  Bin2dResult,
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
  StatQQParams,
  QQResult,
  StatBeeswarmParams,
  BeeswarmResult,
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
  // Secondary y-axis scales
  scale_y2_continuous,
  scale_y2_log10,
  scale_y2_sqrt,
  scale_y2_reverse,
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
  // ColorBrewer scales
  scale_color_brewer,
  scale_fill_brewer,
  scale_color_distiller,
  scale_fill_distiller,
  // Gradient scales
  scale_color_gradient,
  scale_fill_gradient,
  scale_color_gradient2,
  scale_fill_gradient2,
  scale_color_gradientn,
  scale_fill_gradientn,
  // Palette utilities
  getAvailablePalettes,
  getPaletteColors,
  // Phase 7: Advanced Scales
  scale_size_continuous,
  scale_size_area,
  scale_size_radius,
  scale_size_identity,
  scale_size_binned,
  scale_shape_discrete,
  scale_shape_manual,
  scale_shape_identity,
  scale_shape_ordinal,
  DEFAULT_SHAPES,
  SHAPE_CHARS,
  scale_alpha_continuous,
  scale_alpha,
  scale_alpha_identity,
  scale_alpha_discrete,
  scale_alpha_manual,
  scale_alpha_binned,
  scale_x_datetime,
  scale_y_datetime,
  scale_x_date,
  scale_y_date,
  scale_x_time,
  scale_y_time,
  scale_x_duration,
  scale_y_duration,
  formatDateTime,
  calculateDateTimeTicks,
} from './scales'

export type {
  SizeScaleOptions,
  BinnedSizeOptions,
  ShapeScaleOptions,
  ManualShapeOptions,
  AlphaScaleOptions,
  DiscreteAlphaOptions,
  ManualAlphaOptions,
  BinnedAlphaOptions,
  DateTimeScaleOptions,
  TimeScaleOptions,
  DurationScaleOptions,
  // ColorBrewer types
  BrewerPalette,
  BrewerOptions,
  DistillerOptions,
  GradientOptions,
  Gradient2Options,
  GradientNOptions,
  PaletteName,
} from './scales'

// Coordinates
export {
  coordCartesian,
  coordFlip,
  coordPolar,
  coordFixed,
  coordEqual,
  coordTrans,
  coordFlipWithLimits,
} from './coords/cartesian'
export type {
  CartesianOptions,
  FixedOptions,
  TransOptions,
} from './coords/cartesian'

// Facets
export {
  facet_wrap,
  facet_grid,
  computeFacetPanels,
  calculatePanelLayouts,
  calculateGridStripLayout,
  // Labeller functions
  label_value,
  label_both,
  label_parsed,
  label_wrap,
  as_labeller,
} from './facets'
export type {
  FacetWrapOptions,
  FacetGridOptions,
  FacetPanel,
  PanelLayout,
  PanelLayoutOptions,
  GridStripLayout,
  Labeller,
} from './facets'

// Themes
export {
  defaultTheme,
  themeMinimal,
  themeDark,
  themeClassic,
  themeVoid,
} from './themes/default'

// Annotations (Phase 7)
export {
  annotate,
  annotate_text,
  annotate_label,
  annotate_rect,
  annotate_segment,
  annotate_hline,
  annotate_vline,
} from './annotations'
export type { AnnotationOptions } from './annotations'

// Terminal utilities
export {
  // Capability detection
  detectCapabilities,
  getCapabilities,
  clearCapabilityCache,
  detectColorCapability,
  detectGraphicsProtocol,
  detectUnicodeSupport,
  detectTerminalSize,
  isCI,
  getTerminalName,
  getRecommendedRenderer,
  querySixelSupport,
  // Color utilities
  ANSI_16_COLORS,
  generate256Palette,
  getPalette256,
  colorDistance,
  findClosestPaletteColor,
  rgbToAnsi256,
  rgbToAnsi16,
  fgEscape,
  bgEscape,
  quantizeColor,
  ditherPixels,
  createOptimizedPalette,
  getColorEscape,
  RESET,
  RESET_FG,
  RESET_BG,
  // Renderer chain
  isRendererAvailable,
  selectRenderer,
  selectColorMode,
  RendererChain,
  createRendererChain,
  autoRenderer,
  getTerminalInfo,
} from './terminal'

export type {
  ColorCapability,
  GraphicsProtocol,
  TerminalCapabilities,
  ColorMode,
  RendererType,
  RendererConfig,
} from './terminal'

// Streaming
export {
  StreamingPlot,
  createStreamingPlot,
  createTimeSeriesPlot,
  DataWindow,
  createDataWindow,
  DataBuffer,
  createDataBuffer,
  RollingAggregator,
  createRollingAggregator,
  createMultiAggregator,
  ExponentialMovingAverage,
} from './streaming'

export type {
  StreamingPlotOptions,
  StreamingPlotState,
  WindowOptions,
  WindowStats,
  BufferOptions,
  AggregationType,
  RollingOptions,
} from './streaming'

// Performance
export {
  DataSampler,
  createSampler,
  systematicSample,
  randomSample,
  reservoirSample,
  stratifiedSample,
  lttbSample,
  autoSample,
  LevelOfDetail,
  createLOD,
  DEFAULT_LOD_LEVELS,
  Binner,
  createBinner,
  hexbin,
  rectbin,
  CanvasDiff,
  createCanvasDiff,
  quickDiff,
} from './performance'

export type {
  SamplingOptions,
  SamplingMethod,
  LODLevel,
  LODOptions,
  BinOptions,
  Bin,
  HexBin,
  DiffResult,
  DiffOptions,
} from './performance'

// REPL (Phase 8)
export { GGTermREPL, startREPL } from './repl'
export type { REPLOptions, REPLState } from './repl'

// Export (Publication-quality output)
export { plotSpecToVegaLite, exportToVegaLiteJSON } from './export'
export type { VegaLiteSpec, ExportOptions } from './export'
