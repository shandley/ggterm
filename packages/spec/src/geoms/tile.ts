/**
 * geom_tile - Tile geometry for heatmaps
 *
 * Renders rectangles at x, y positions with fill based on a value.
 */

import type { Geom } from '../types'

export interface TileOptions {
  /** Width of each tile (default: auto from data spacing) */
  width?: number
  /** Height of each tile (default: auto from data spacing) */
  height?: number
  /** Alpha transparency */
  alpha?: number
  /** Border color (default: none) */
  color?: string
  /** Fill aesthetic (maps to color scale) */
  fill?: string
}

/**
 * Render tiles/heatmap
 */
export function geom_tile(options: TileOptions = {}): Geom {
  return {
    type: 'tile',
    stat: 'identity',
    position: 'identity',
    params: {
      width: options.width,
      height: options.height,
      alpha: options.alpha ?? 1,
      color: options.color,
      fill: options.fill,
    },
  }
}

/**
 * Alias for geom_tile with default binning
 */
export function geom_raster(options: TileOptions = {}): Geom {
  return geom_tile(options)
}
