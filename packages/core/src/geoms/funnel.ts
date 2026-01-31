/**
 * Funnel Plot Geometry
 *
 * Creates funnel plots for detecting publication bias in meta-analyses.
 * Plots effect size against precision (1/SE or sample size).
 *
 * @example
 * // Basic funnel plot
 * gg(data)
 *   .aes({ x: 'effect_size', y: 'se' })
 *   .geom(geom_funnel())
 *
 * @example
 * // Funnel plot with contour lines
 * gg(data)
 *   .aes({ x: 'effect_size', y: 'se' })
 *   .geom(geom_funnel({ show_contours: true }))
 *
 * @example
 * // Funnel plot with significance regions
 * gg(data)
 *   .aes({ x: 'effect_size', y: 'se' })
 *   .geom(geom_funnel({ show_significance: true }))
 */

import type { Geom } from '../types';

export interface FunnelOptions {
  /**
   * Show pseudo-confidence interval contours
   * @default true
   */
  show_contours?: boolean;

  /**
   * Contour levels (e.g., [0.90, 0.95, 0.99])
   * @default [0.95]
   */
  contour_levels?: number[];

  /**
   * Show significance regions
   * @default false
   */
  show_significance?: boolean;

  /**
   * Summary effect estimate (vertical line)
   * If not provided, uses mean of effect sizes
   * @default undefined
   */
  summary_effect?: number;

  /**
   * Show vertical line at summary effect
   * @default true
   */
  show_summary_line?: boolean;

  /**
   * Y-axis is SE (true) or precision 1/SE (false)
   * @default true
   */
  y_is_se?: boolean;

  /**
   * Invert y-axis (SE plots typically have 0 at top)
   * @default true
   */
  invert_y?: boolean;

  /**
   * Point character
   * @default '●'
   */
  point_char?: string;

  /**
   * Contour color
   * @default '#888888'
   */
  contour_color?: string;
}

/**
 * Create a funnel plot geometry
 */
export function geom_funnel(options: FunnelOptions = {}): Geom {
  return {
    type: 'funnel',
    stat: 'identity',
    position: 'identity',
    params: {
      show_contours: options.show_contours ?? true,
      contour_levels: options.contour_levels ?? [0.95],
      show_significance: options.show_significance ?? false,
      summary_effect: options.summary_effect,
      show_summary_line: options.show_summary_line ?? true,
      y_is_se: options.y_is_se ?? true,
      invert_y: options.invert_y ?? true,
      point_char: options.point_char ?? '●',
      contour_color: options.contour_color ?? '#888888',
    },
  };
}
