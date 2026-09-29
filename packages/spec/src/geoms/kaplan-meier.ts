/**
 * Kaplan-Meier Survival Curve Geom
 *
 * Creates survival curves for time-to-event analysis.
 * Commonly used in clinical trials and epidemiological studies.
 *
 * Expected data format:
 * - time: Time to event or censoring
 * - status: Event indicator (1 = event, 0 = censored)
 * - group (optional): Stratification variable for multiple curves
 *
 * @example
 * ```typescript
 * gg(survivalData)
 *   .aes({ x: 'time', y: 'status', color: 'treatment' })
 *   .geom(geom_kaplan_meier({ show_ci: true, show_censored: true }))
 * ```
 */

import type { Geom } from '../types'

export interface KaplanMeierOptions {
  /** Show confidence intervals (default: false) */
  show_ci?: boolean
  /** Confidence level for CI (default: 0.95) */
  conf_level?: number
  /** Show censored observations as tick marks (default: true) */
  show_censored?: boolean
  /** Character for censored marks (default: '+') */
  censor_char?: string
  /** Show number at risk table (default: false) */
  show_risk_table?: boolean
  /** Line style for survival curve (default: 'solid') */
  linetype?: 'solid' | 'dashed' | 'dotted'
  /** Show median survival line (default: false) */
  show_median?: boolean
  /** Step style: 'post' keeps value until next event (default: 'post') */
  step_type?: 'post' | 'pre'
}

export function geom_kaplan_meier(options: KaplanMeierOptions = {}): Geom {
  return {
    type: 'kaplan_meier',
    stat: 'identity',
    position: 'identity',
    params: {
      show_ci: options.show_ci ?? false,
      conf_level: options.conf_level ?? 0.95,
      show_censored: options.show_censored ?? true,
      censor_char: options.censor_char ?? '+',
      show_risk_table: options.show_risk_table ?? false,
      linetype: options.linetype ?? 'solid',
      show_median: options.show_median ?? false,
      step_type: options.step_type ?? 'post',
    },
  }
}
