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
