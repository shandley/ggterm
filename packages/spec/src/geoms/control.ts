/**
 * Control Chart (Shewhart Chart) Geometry
 *
 * Creates statistical process control charts showing data points
 * with control limits (UCL, LCL) and center line.
 *
 * @example
 * // Basic control chart
 * gg(data)
 *   .aes({ x: 'sample', y: 'measurement' })
 *   .geom(geom_control())
 *
 * @example
 * // Control chart with custom limits
 * gg(data)
 *   .aes({ x: 'sample', y: 'measurement' })
 *   .geom(geom_control({ sigma: 2 }))
 *
 * @example
 * // X-bar chart for subgroup means
 * gg(data)
 *   .aes({ x: 'sample', y: 'measurement' })
 *   .geom(geom_control({ chart_type: 'xbar' }))
 */

import type { Geom } from '../types';

export interface ControlOptions {
  /**
   * Type of control chart
   * - 'i': Individual measurements (I-chart)
   * - 'xbar': Subgroup means (X-bar chart)
   * - 'r': Range chart
   * - 's': Standard deviation chart
   * - 'p': Proportion chart
   * - 'c': Count chart
   * @default 'i'
   */
  chart_type?: 'i' | 'xbar' | 'r' | 's' | 'p' | 'c';

  /**
   * Number of standard deviations for control limits
   * @default 3
   */
  sigma?: number;

  /**
   * Show center line (mean/target)
   * @default true
   */
  show_center?: boolean;

  /**
   * Show upper control limit
   * @default true
   */
  show_ucl?: boolean;

  /**
   * Show lower control limit
   * @default true
   */
  show_lcl?: boolean;

  /**
   * Show warning limits (typically at 2 sigma)
   * @default false
   */
  show_warning?: boolean;

  /**
   * Custom center line value (if not computed from data)
   * @default undefined
   */
  center?: number;

  /**
   * Custom UCL value
   * @default undefined
   */
  ucl?: number;

  /**
   * Custom LCL value
   * @default undefined
   */
  lcl?: number;

  /**
   * Color for center line
   * @default '#0000ff'
   */
  center_color?: string;

  /**
   * Color for control limits
   * @default '#ff0000'
   */
  limit_color?: string;

  /**
   * Color for warning limits
   * @default '#ffa500'
   */
  warning_color?: string;

  /**
   * Connect points with lines
   * @default true
   */
  connect_points?: boolean;

  /**
   * Highlight out-of-control points
   * @default true
   */
  highlight_ooc?: boolean;

  /**
   * Character for out-of-control points
   * @default '◆'
   */
  ooc_char?: string;

  /**
   * Point character
   * @default '●'
   */
  point_char?: string;
}

/**
 * Create a control chart geometry
 */
export function geom_control(options: ControlOptions = {}): Geom {
  return {
    type: 'control',
    stat: 'identity',
    position: 'identity',
    params: {
      chart_type: options.chart_type ?? 'i',
      sigma: options.sigma ?? 3,
      show_center: options.show_center ?? true,
      show_ucl: options.show_ucl ?? true,
      show_lcl: options.show_lcl ?? true,
      show_warning: options.show_warning ?? false,
      center: options.center,
      ucl: options.ucl,
      lcl: options.lcl,
      center_color: options.center_color ?? '#0000ff',
      limit_color: options.limit_color ?? '#ff0000',
      warning_color: options.warning_color ?? '#ffa500',
      connect_points: options.connect_points ?? true,
      highlight_ooc: options.highlight_ooc ?? true,
      ooc_char: options.ooc_char ?? '◆',
      point_char: options.point_char ?? '●',
    },
  };
}
