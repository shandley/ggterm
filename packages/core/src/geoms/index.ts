/**
 * Geometry exports
 */

export { geom_point, type PointOptions } from './point'
export { geom_line, geom_hline, geom_vline, type LineOptions } from './line'
export { geom_path, type PathOptions } from './path'
export { geom_bar, geom_col, type BarOptions } from './bar'
export { geom_text, geom_label, type TextOptions } from './text'
export { geom_area, geom_ribbon, type AreaOptions } from './area'
export { geom_histogram, geom_freqpoly, type HistogramOptions, type FreqpolyOptions } from './histogram'
export { geom_density, type DensityOptions } from './density'
export { geom_boxplot, type BoxplotOptions } from './boxplot'
export { geom_segment, geom_curve, type SegmentOptions } from './segment'
export { geom_smooth, type SmoothOptions } from './smooth'
export { geom_step, type StepOptions } from './step'
export { geom_rug, type RugOptions } from './rug'

// Phase 7: Extended Grammar
export { geom_violin, type ViolinOptions } from './violin'
export { geom_tile, geom_raster, type TileOptions } from './tile'
export { geom_bin2d, type Bin2dOptions } from './bin2d'
export { geom_contour, geom_contour_filled, geom_density_2d, type ContourOptions } from './contour'
export {
  geom_errorbar,
  geom_errorbarh,
  geom_crossbar,
  geom_linerange,
  geom_pointrange,
  type ErrorbarOptions,
} from './errorbar'
export { geom_rect, geom_abline, type RectOptions, type AblineOptions } from './rect'
export { geom_qq, geom_qq_line, type QQOptions, type QQLineOptions } from './qq'
export { geom_ridgeline, geom_joy, type RidgelineOptions } from './ridgeline'
export { geom_beeswarm, geom_quasirandom, type BeeswarmOptions } from './beeswarm'
export { geom_dumbbell, type DumbbellOptions } from './dumbbell'
export { geom_lollipop, type LollipopOptions } from './lollipop'
export { geom_waffle, type WaffleOptions } from './waffle'
export { geom_sparkline, type SparklineOptions, SPARK_BARS, SPARK_DOTS } from './sparkline'
export { geom_bullet, type BulletOptions } from './bullet'
export { geom_braille, type BrailleOptions, BRAILLE_BASE, BRAILLE_DOTS } from './braille'

// Specialized visualizations
export { geom_calendar, type CalendarOptions } from './calendar'
export { geom_flame, geom_icicle, type FlameOptions } from './flame'
export { geom_corrmat, type CorrmatOptions } from './corrmat'
export { geom_sankey, type SankeyOptions } from './sankey'
export { geom_treemap, type TreemapOptions } from './treemap'
export { geom_volcano, type VolcanoOptions } from './volcano'
export { geom_ma, type MAOptions } from './ma'
export { geom_manhattan, type ManhattanOptions } from './manhattan'
export { geom_heatmap, type HeatmapOptions } from './heatmap'
export { geom_biplot, type BiplotOptions } from './biplot'

// Clinical/Statistical visualizations
export { geom_kaplan_meier, type KaplanMeierOptions } from './kaplan-meier'
export { geom_forest, type ForestOptions } from './forest'
export { geom_roc, type RocOptions } from './roc'
export { geom_bland_altman, type BlandAltmanOptions } from './bland-altman'
