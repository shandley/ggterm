/**
 * gg() - Plot builder with fluent API
 */

import type {
  AestheticMapping,
  Coord,
  DataSource,
  Facet,
  Geom,
  Labels,
  PlotSpec,
  RenderOptions,
  Scale,
  Stat,
  Theme,
} from './types'
import { defaultTheme } from './themes/default'
import { coordCartesian } from './coords/cartesian'
import { renderToString } from './pipeline'

/**
 * Plot builder class with fluent API
 */
export class GGPlot {
  private _data: DataSource
  private _aes: AestheticMapping = { x: '', y: '' }
  private _geoms: Geom[] = []
  private _stats: Stat[] = []
  private _scales: Scale[] = []
  private _coord: Coord = coordCartesian()
  private _facet?: Facet
  private _theme: Theme = defaultTheme()
  private _labels: Labels = {}

  constructor(data: DataSource) {
    this._data = data
  }

  /**
   * Set aesthetic mappings
   */
  aes(mapping: AestheticMapping): this {
    this._aes = { ...this._aes, ...mapping }
    return this
  }

  /**
   * Add a geometry layer
   */
  geom(geom: Geom): this {
    this._geoms.push(geom)
    return this
  }

  /**
   * Add an annotation layer
   * Annotations are geometry layers with fixed positions (not mapped from data)
   */
  annotate(annotation: Geom): this {
    this._geoms.push(annotation)
    return this
  }

  /**
   * Add a statistical transformation
   */
  stat(stat: Stat): this {
    this._stats.push(stat)
    return this
  }

  /**
   * Add or configure a scale
   */
  scale(scale: Scale): this {
    // Replace existing scale for same aesthetic, or add new
    const idx = this._scales.findIndex((s) => s.aesthetic === scale.aesthetic)
    if (idx >= 0) {
      this._scales[idx] = scale
    } else {
      this._scales.push(scale)
    }
    return this
  }

  /**
   * Set coordinate system
   */
  coord(coord: Coord): this {
    this._coord = coord
    return this
  }

  /**
   * Set faceting
   */
  facet(facet: Facet): this {
    this._facet = facet
    return this
  }

  /**
   * Apply a theme
   */
  theme(theme: Theme | Partial<Theme>): this {
    this._theme = { ...this._theme, ...theme } as Theme
    return this
  }

  /**
   * Set labels (title, axes, legends)
   */
  labs(labels: Labels): this {
    this._labels = { ...this._labels, ...labels }
    return this
  }

  /**
   * Push new data points (for streaming)
   */
  push(data: DataSource | Record<string, unknown>): this {
    if (Array.isArray(data)) {
      this._data = [...this._data, ...data]
    } else {
      this._data = [...this._data, data]
    }
    return this
  }

  /**
   * Get the current plot specification
   */
  spec(): PlotSpec {
    return {
      data: this._data,
      aes: this._aes,
      geoms: this._geoms,
      stats: this._stats,
      scales: this._scales,
      coord: this._coord,
      facet: this._facet,
      theme: this._theme,
      labels: this._labels,
    }
  }

  /**
   * Get data
   */
  get data(): DataSource {
    return this._data
  }

  /**
   * Get geoms
   */
  get geoms(): Geom[] {
    return this._geoms
  }

  /**
   * Render plot to string
   */
  render(options: RenderOptions): string {
    return renderToString(this.spec(), options)
  }
}

/**
 * Create a new plot
 */
export function gg(data: DataSource = []): GGPlot {
  return new GGPlot(data)
}
