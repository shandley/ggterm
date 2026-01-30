/**
 * geom_sankey - Sankey flow diagram
 *
 * Visualizes flows between nodes with proportional-width connections.
 * Shows how quantities flow from sources to targets.
 *
 * @example
 * ```ts
 * // Basic Sankey diagram
 * const flows = [
 *   { source: 'A', target: 'X', value: 10 },
 *   { source: 'A', target: 'Y', value: 5 },
 *   { source: 'B', target: 'X', value: 8 },
 *   { source: 'B', target: 'Y', value: 12 },
 * ]
 *
 * gg(flows)
 *   .aes({ source: 'source', target: 'target', value: 'value' })
 *   .geom(geom_sankey())
 *   .labs({ title: 'Flow Diagram' })
 * ```
 */

import type { Geom } from '../types'

export interface SankeyOptions {
  /** Node width in characters (default: 3) */
  node_width?: number
  /** Padding between nodes (default: 2) */
  node_padding?: number
  /** Character for node blocks (default: '█') */
  node_char?: string
  /** Character for flow lines (default: '─') */
  flow_char?: string
  /** Show node labels (default: true) */
  show_labels?: boolean
  /** Show flow values (default: false) */
  show_values?: boolean
  /** Node alignment: 'left', 'right', 'center', 'justify' (default: 'justify') */
  align?: 'left' | 'right' | 'center' | 'justify'
  /** Color scheme for nodes: 'auto', 'source', 'target' (default: 'auto') */
  color_by?: 'auto' | 'source' | 'target'
  /** Minimum flow width in characters (default: 1) */
  min_flow_width?: number
  /** Gap between flow lines (default: 0) */
  flow_gap?: number
}

/**
 * Create a Sankey flow diagram
 *
 * Data should have:
 * - source: Source node name
 * - target: Target node name
 * - value: Flow amount (determines connection width)
 *
 * Nodes are automatically positioned in columns based on flow direction.
 */
export function geom_sankey(options: SankeyOptions = {}): Geom {
  return {
    type: 'sankey',
    stat: 'identity',
    position: 'identity',
    params: {
      node_width: options.node_width ?? 3,
      node_padding: options.node_padding ?? 2,
      node_char: options.node_char ?? '█',
      flow_char: options.flow_char ?? '─',
      show_labels: options.show_labels ?? true,
      show_values: options.show_values ?? false,
      align: options.align ?? 'justify',
      color_by: options.color_by ?? 'auto',
      min_flow_width: options.min_flow_width ?? 1,
      flow_gap: options.flow_gap ?? 0,
    },
  }
}
