/**
 * geom_density - 1D Kernel Density Estimation
 *
 * Computes and displays a smooth density estimate of the data.
 * This is a smoothed version of the histogram, useful for showing
 * the probability distribution of a continuous variable.
 *
 * @example
 * ```ts
 * // Basic density plot
 * gg(data)
 *   .aes({ x: 'value' })
 *   .geom(geom_density())
 *
 * // Compare multiple distributions
 * gg(data)
 *   .aes({ x: 'value', color: 'group', fill: 'group' })
 *   .geom(geom_density({ alpha: 0.3 }))
 *
 * // Adjust bandwidth for smoother/rougher curves
 * gg(data)
 *   .aes({ x: 'value' })
 *   .geom(geom_density({ adjust: 0.5 }))  // More detailed
 *   .geom(geom_density({ adjust: 2 }))    // Smoother
 * ```
 */

import type { Geom } from '../types'

export interface DensityOptions {
  /** Number of points to evaluate density at (default: 512) */
  n?: number
  /** Bandwidth for kernel density estimation (default: auto via Silverman's rule) */
  bw?: number
  /** Kernel function (default: 'gaussian') */
  kernel?: 'gaussian' | 'epanechnikov' | 'rectangular'
  /** Adjustment factor for bandwidth (default: 1) */
  adjust?: number
  /** Alpha transparency (default: 0.3) */
  alpha?: number
  /** Line color (outline) */
  color?: string
  /** Fill color */
  fill?: string
  /** Line width for outline */
  linewidth?: number
  /** Line type for outline */
  linetype?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Create a density plot (kernel density estimation)
 *
 * The density geom computes and displays a kernel density estimate,
 * which is a smoothed version of the histogram. It's useful for
 * displaying the probability distribution of a continuous variable.
 *
 * The y-axis shows density values which integrate to 1 over the
 * full range, making it easy to compare distributions with different
 * sample sizes.
 */
export function geom_density(options: DensityOptions = {}): Geom {
  return {
    type: 'density',
    stat: 'density',
    position: 'identity',
    params: {
      n: options.n ?? 512,
      bw: options.bw,
      kernel: options.kernel ?? 'gaussian',
      adjust: options.adjust ?? 1,
      alpha: options.alpha ?? 0.3,
      color: options.color,
      fill: options.fill,
      linewidth: options.linewidth ?? 1,
      linetype: options.linetype ?? 'solid',
    },
  }
}
