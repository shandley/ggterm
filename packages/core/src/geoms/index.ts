/**
 * Geometry exports
 */

export { geom_point, type PointOptions } from './point'
export { geom_line, geom_hline, geom_vline, type LineOptions } from './line'
export { geom_bar, geom_col, type BarOptions } from './bar'
export { geom_text, geom_label, type TextOptions } from './text'
export { geom_area, geom_ribbon, type AreaOptions } from './area'
export { geom_histogram, type HistogramOptions } from './histogram'
export { geom_boxplot, type BoxplotOptions } from './boxplot'
export { geom_segment, geom_curve, type SegmentOptions } from './segment'
export { geom_smooth, type SmoothOptions } from './smooth'

// Phase 7: Extended Grammar
export { geom_violin, type ViolinOptions } from './violin'
export { geom_tile, geom_raster, type TileOptions } from './tile'
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
