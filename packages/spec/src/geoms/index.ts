/**
 * Geometry exports
 */

export { geom_point, type PointOptions } from './point.js'
export { geom_line, geom_hline, geom_vline, type LineOptions } from './line.js'
export { geom_path, type PathOptions } from './path.js'
export { geom_bar, geom_col, type BarOptions } from './bar.js'
export { geom_text, geom_label, type TextOptions } from './text.js'
export { geom_area, geom_ribbon, type AreaOptions } from './area.js'
export { geom_histogram, geom_freqpoly, type HistogramOptions, type FreqpolyOptions } from './histogram.js'
export { geom_density, type DensityOptions } from './density.js'
export { geom_boxplot, type BoxplotOptions } from './boxplot.js'
export { geom_segment, geom_curve, type SegmentOptions } from './segment.js'
export { geom_smooth, type SmoothOptions } from './smooth.js'
export { geom_step, type StepOptions } from './step.js'
export { geom_rug, type RugOptions } from './rug.js'

// Phase 7: Extended Grammar
export { geom_violin, type ViolinOptions } from './violin.js'
export { geom_tile, geom_raster, type TileOptions } from './tile.js'
export { geom_bin2d, type Bin2dOptions } from './bin2d.js'
export { geom_contour, geom_contour_filled, geom_density_2d, type ContourOptions } from './contour.js'
export {
  geom_errorbar,
  geom_errorbarh,
  geom_crossbar,
  geom_linerange,
  geom_pointrange,
  type ErrorbarOptions,
} from './errorbar.js'
export { geom_rect, geom_abline, type RectOptions, type AblineOptions } from './rect.js'
export { geom_qq, type QQOptions } from './qq.js'
export { geom_ridgeline, geom_joy, type RidgelineOptions } from './ridgeline.js'
export { geom_beeswarm, geom_quasirandom, type BeeswarmOptions } from './beeswarm.js'
export { geom_dumbbell, type DumbbellOptions } from './dumbbell.js'
export { geom_lollipop, type LollipopOptions } from './lollipop.js'
export { geom_waffle, type WaffleOptions } from './waffle.js'
export { geom_sparkline, type SparklineOptions, SPARK_BARS, SPARK_DOTS } from './sparkline.js'
export { geom_bullet, type BulletOptions } from './bullet.js'
export { geom_braille, type BrailleOptions, BRAILLE_BASE, BRAILLE_DOTS } from './braille.js'

// Specialized visualizations
export { geom_calendar, type CalendarOptions } from './calendar.js'
export { geom_flame, geom_icicle, type FlameOptions } from './flame.js'
export { geom_corrmat, type CorrmatOptions } from './corrmat.js'
export { geom_sankey, type SankeyOptions } from './sankey.js'
export { geom_treemap, type TreemapOptions } from './treemap.js'
export { geom_volcano, type VolcanoOptions } from './volcano.js'
export { geom_ma, type MAOptions } from './ma.js'
export { geom_manhattan, type ManhattanOptions } from './manhattan.js'
export { geom_heatmap, type HeatmapOptions } from './heatmap.js'
export { geom_biplot, type BiplotOptions } from './biplot.js'

// Clinical/Statistical visualizations
export { geom_kaplan_meier, type KaplanMeierOptions } from './kaplan-meier.js'
export { geom_forest, type ForestOptions } from './forest.js'
export { geom_roc, type RocOptions } from './roc.js'
export { geom_bland_altman, type BlandAltmanOptions } from './bland-altman.js'

// Statistical diagnostic geoms
export { geom_ecdf, type ECDFOptions } from './ecdf.js'
export { geom_funnel, type FunnelOptions } from './funnel.js'
export { geom_control, type ControlOptions } from './control.js'
export { geom_scree, type ScreeOptions } from './scree.js'

// Set/hierarchical visualizations
export { geom_upset, type UpsetOptions } from './upset.js'
export { geom_dendrogram, type DendrogramOptions } from './dendrogram.js'
