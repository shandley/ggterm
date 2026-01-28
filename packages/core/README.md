# @ggterm/core

[![npm version](https://img.shields.io/npm/v/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![npm downloads](https://img.shields.io/npm/dm/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Grammar of Graphics for Terminal User Interfaces.

**ggterm** is a TypeScript library implementing Leland Wilkinson's Grammar of Graphics for terminal-based rendering. Create publication-quality data visualizations directly in your terminal.

## Installation

```bash
npm install @ggterm/core
```

## Quick Example

```typescript
import { gg, geom_point, geom_line } from '@ggterm/core'

const data = [
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 18 },
  { x: 4, y: 30 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_line())
  .labs({ title: 'My Plot', x: 'Time', y: 'Value' })

console.log(plot.render({ width: 60, height: 20 }))
```

## Features

- **20+ Geometry Types**: point, line, bar, histogram, boxplot, violin, area, heatmap, contour, and more
- **50+ Scales**: Continuous, discrete, color (viridis, brewer), date/time
- **Faceting**: `facet_wrap()` and `facet_grid()` for multi-panel plots
- **Themes**: Customizable themes for different visual styles
- **Export**: Convert to Vega-Lite for publication-quality PNG/SVG output

## Available Geoms

```typescript
// Points and Lines
geom_point(), geom_line(), geom_path(), geom_step(), geom_smooth()

// Bars and Areas
geom_bar(), geom_col(), geom_histogram(), geom_area(), geom_ribbon()

// Distributions
geom_boxplot(), geom_violin(), geom_density_2d(), geom_qq()

// 2D Plots
geom_tile(), geom_raster(), geom_contour(), geom_contour_filled()

// Annotations
geom_text(), geom_label(), geom_hline(), geom_vline(), geom_abline()

// Uncertainty
geom_errorbar(), geom_errorbarh(), geom_crossbar(), geom_linerange(), geom_pointrange()
```

## Color Support

Works in terminals with truecolor, 256-color, and 16-color support:

```typescript
plot.render({
  width: 80,
  height: 24,
  colorMode: 'truecolor' // or '256', '16', 'none'
})
```

## Export to Vega-Lite

```typescript
import { plotSpecToVegaLite } from '@ggterm/core'

const vegaSpec = plotSpecToVegaLite(plot.spec())
// Use with Vega-Embed to render PNG/SVG in browsers
```

## Framework Integrations

- **React**: `@ggterm/opentui`
- **Vue**: `@ggterm/vue`
- **Svelte**: `@ggterm/svelte`
- **Solid**: `@ggterm/solid`

## Documentation

Full documentation and examples: [github.com/shandley/ggterm](https://github.com/shandley/ggterm)

## License

MIT
