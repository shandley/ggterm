/**
 * Scale exports
 */

export {
  scale_x_continuous,
  scale_y_continuous,
  scale_x_log10,
  scale_y_log10,
  scale_x_sqrt,
  scale_y_sqrt,
  scale_x_reverse,
  scale_y_reverse,
  type ContinuousScaleOptions,
} from './continuous'

export {
  scale_x_discrete,
  scale_y_discrete,
  type DiscreteScaleOptions,
  type DiscreteOrder,
} from './discrete'

export {
  // Core color scales
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
  // Viridis family
  scale_color_viridis_c,
  scale_fill_viridis_c,
  scale_color_plasma,
  scale_fill_plasma,
  scale_color_inferno,
  scale_fill_inferno,
  scale_color_magma,
  scale_fill_magma,
  scale_color_cividis,
  scale_fill_cividis,
  scale_color_turbo,
  scale_fill_turbo,
  // Grey scale
  scale_color_grey,
  scale_color_gray,
  scale_fill_grey,
  scale_fill_gray,
  // Identity and hue scales
  scale_color_identity,
  scale_fill_identity,
  scale_color_hue,
  scale_fill_hue,
  // Utility functions
  getAvailablePalettes,
  getPaletteColors,
  // Types
  type ColorContinuousOptions,
  type ColorDiscreteOptions,
  type ColorManualOptions,
  type BrewerPalette,
  type BrewerOptions,
  type DistillerOptions,
  type GradientOptions,
  type Gradient2Options,
  type GradientNOptions,
  type ViridisOption,
  type ViridisOptions,
  type GreyOptions,
  type HueOptions,
  type PaletteName,
} from './color'

// Phase 7: Advanced Scales
export {
  scale_size_continuous,
  scale_size_area,
  scale_size_radius,
  scale_size_identity,
  scale_size_binned,
  type SizeScaleOptions,
  type BinnedSizeOptions,
} from './size'

export {
  scale_shape_discrete,
  scale_shape_manual,
  scale_shape_identity,
  scale_shape_ordinal,
  DEFAULT_SHAPES,
  SHAPE_CHARS,
  type ShapeScaleOptions,
  type ManualShapeOptions,
} from './shape'

export {
  scale_alpha_continuous,
  scale_alpha,
  scale_alpha_identity,
  scale_alpha_discrete,
  scale_alpha_manual,
  scale_alpha_binned,
  type AlphaScaleOptions,
  type DiscreteAlphaOptions,
  type ManualAlphaOptions,
  type BinnedAlphaOptions,
} from './alpha'

export {
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
  type DateTimeScaleOptions,
  type TimeScaleOptions,
  type DurationScaleOptions,
} from './datetime'
