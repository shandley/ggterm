/**
 * @ggterm/spec - Declarative Grammar of Graphics specification
 *
 * The backend-agnostic core of ggterm: the PlotSpec type family,
 * geometry and position builders, annotation helpers, and the
 * Vega-Lite converter. Contains no terminal rendering and no
 * runtime dependencies.
 */

export * from './types.js'
export * from './geoms/index.js'
export * from './positions/index.js'
export * from './annotations.js'
export * from './export/index.js'
