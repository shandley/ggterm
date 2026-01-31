/**
 * Empirical Cumulative Distribution Function Geometry
 *
 * Creates ECDF plots showing the proportion of data at or below each value.
 *
 * @example
 * // Basic ECDF
 * gg(data)
 *   .aes({ x: 'values' })
 *   .geom(geom_ecdf())
 *
 * @example
 * // ECDF with confidence band
 * gg(data)
 *   .aes({ x: 'values' })
 *   .geom(geom_ecdf({ show_ci: true }))
 *
 * @example
 * // Multiple ECDFs by group
 * gg(data)
 *   .aes({ x: 'values', color: 'group' })
 *   .geom(geom_ecdf())
 */

import type { Geom } from '../types';

export interface ECDFOptions {
  /**
   * Pad the ECDF to [0, 1] range on y-axis
   * @default true
   */
  pad?: boolean;

  /**
   * Show confidence band (Dvoretzky-Kiefer-Wolfowitz inequality)
   * @default false
   */
  show_ci?: boolean;

  /**
   * Confidence level for CI band
   * @default 0.95
   */
  conf_level?: number;

  /**
   * Step type for the ECDF
   * @default 'post'
   */
  step_type?: 'pre' | 'post' | 'mid';

  /**
   * Show points at each step
   * @default false
   */
  show_points?: boolean;

  /**
   * Line character for steps
   * @default '─'
   */
  line_char?: string;

  /**
   * Complement (1 - ECDF) for survival-style plot
   * @default false
   */
  complement?: boolean;
}

/**
 * Create an ECDF geometry
 */
export function geom_ecdf(options: ECDFOptions = {}): Geom {
  return {
    type: 'ecdf',
    stat: 'identity',
    position: 'identity',
    params: {
      pad: options.pad ?? true,
      show_ci: options.show_ci ?? false,
      conf_level: options.conf_level ?? 0.95,
      step_type: options.step_type ?? 'post',
      show_points: options.show_points ?? false,
      line_char: options.line_char ?? '─',
      complement: options.complement ?? false,
    },
  };
}
