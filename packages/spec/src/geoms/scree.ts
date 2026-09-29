/**
 * Scree Plot Geometry
 *
 * Creates scree plots for PCA/factor analysis showing variance
 * explained by each component.
 *
 * @example
 * // Basic scree plot
 * gg(data)
 *   .aes({ x: 'component', y: 'variance' })
 *   .geom(geom_scree())
 *
 * @example
 * // Scree plot with cumulative variance
 * gg(data)
 *   .aes({ x: 'component', y: 'variance' })
 *   .geom(geom_scree({ show_cumulative: true }))
 *
 * @example
 * // Scree plot with Kaiser criterion line
 * gg(data)
 *   .aes({ x: 'component', y: 'eigenvalue' })
 *   .geom(geom_scree({ show_kaiser: true }))
 */

import type { Geom } from '../types';

export interface ScreeOptions {
  /**
   * Show cumulative variance line
   * @default false
   */
  show_cumulative?: boolean;

  /**
   * Show Kaiser criterion line (eigenvalue = 1)
   * @default false
   */
  show_kaiser?: boolean;

  /**
   * Show elbow point
   * @default false
   */
  show_elbow?: boolean;

  /**
   * Show broken stick model line
   * @default false
   */
  show_broken_stick?: boolean;

  /**
   * Connect points with lines
   * @default true
   */
  connect_points?: boolean;

  /**
   * Show bars instead of/in addition to points
   * @default false
   */
  show_bars?: boolean;

  /**
   * Point character
   * @default '●'
   */
  point_char?: string;

  /**
   * Color for main line/points
   * @default undefined (uses default palette)
   */
  color?: string;

  /**
   * Color for cumulative line
   * @default '#ff0000'
   */
  cumulative_color?: string;

  /**
   * Color for Kaiser line
   * @default '#888888'
   */
  kaiser_color?: string;

  /**
   * Y-axis as percentage (0-100) or proportion (0-1)
   * @default 'percentage'
   */
  y_format?: 'percentage' | 'proportion' | 'eigenvalue';

  /**
   * Threshold line for variance explained (e.g., 0.8 for 80%)
   * @default undefined
   */
  threshold?: number;

  /**
   * Color for threshold line
   * @default '#00aa00'
   */
  threshold_color?: string;
}

/**
 * Create a scree plot geometry
 */
export function geom_scree(options: ScreeOptions = {}): Geom {
  return {
    type: 'scree',
    stat: 'identity',
    position: 'identity',
    params: {
      show_cumulative: options.show_cumulative ?? false,
      show_kaiser: options.show_kaiser ?? false,
      show_elbow: options.show_elbow ?? false,
      show_broken_stick: options.show_broken_stick ?? false,
      connect_points: options.connect_points ?? true,
      show_bars: options.show_bars ?? false,
      point_char: options.point_char ?? '●',
      color: options.color,
      cumulative_color: options.cumulative_color ?? '#ff0000',
      kaiser_color: options.kaiser_color ?? '#888888',
      y_format: options.y_format ?? 'percentage',
      threshold: options.threshold,
      threshold_color: options.threshold_color ?? '#00aa00',
    },
  };
}
