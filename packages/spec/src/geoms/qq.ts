/**
 * Q-Q Plot Geometry
 *
 * Creates quantile-quantile plots for comparing data distributions
 * against theoretical distributions or other samples.
 *
 * @example
 * // Basic Q-Q plot against normal distribution
 * gg(data)
 *   .aes({ sample: 'values' })
 *   .geom(geom_qq())
 *
 * @example
 * // Q-Q plot with reference line
 * gg(data)
 *   .aes({ sample: 'values' })
 *   .geom(geom_qq({ show_line: true }))
 *
 * @example
 * // Q-Q plot with confidence band
 * gg(data)
 *   .aes({ sample: 'values' })
 *   .geom(geom_qq({ show_ci: true, conf_level: 0.95 }))
 */

import type { Geom } from '../types';

export interface QQOptions {
  /**
   * Distribution to compare against
   * @default 'normal'
   */
  distribution?: 'normal' | 'uniform' | 'exponential';

  /**
   * Show reference line (y = x for perfect fit)
   * @default true
   */
  show_line?: boolean;

  /**
   * Show confidence band around reference line
   * @default false
   */
  show_ci?: boolean;

  /**
   * Confidence level for CI band
   * @default 0.95
   */
  conf_level?: number;

  /**
   * Line color for reference line
   * @default '#ff0000'
   */
  line_color?: string;

  /**
   * Point character
   * @default '●'
   */
  point_char?: string;

  /**
   * Use standardized residuals
   * @default true
   */
  standardize?: boolean;
}

/**
 * Create a Q-Q plot geometry
 */
export function geom_qq(options: QQOptions = {}): Geom {
  return {
    type: 'qq',
    stat: 'identity',
    position: 'identity',
    params: {
      distribution: options.distribution ?? 'normal',
      show_line: options.show_line ?? true,
      show_ci: options.show_ci ?? false,
      conf_level: options.conf_level ?? 0.95,
      line_color: options.line_color ?? '#ff0000',
      point_char: options.point_char ?? '●',
      standardize: options.standardize ?? true,
    },
  };
}
