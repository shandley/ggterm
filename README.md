# ggterm

[![npm version](https://img.shields.io/npm/v/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![npm downloads](https://img.shields.io/npm/dm/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Grammar of Graphics for Terminal User Interfaces.

**ggterm** is a TypeScript library implementing Leland Wilkinson's Grammar of Graphics for terminal-based rendering. Designed to integrate with [OpenTUI](https://github.com/sst/opentui), it enables declarative, publication-aware data visualization directly in the terminal.

## Why ggterm?

Current terminal plotting tools are either:
- **Imperative** (plotext, bashplotlib) — require manual coordinate management
- **Low-level** (direct curses/ncurses) — no abstraction for statistical graphics
- **Output-only** (gnuplot to ASCII) — no interactivity or reactive updates

ggterm provides:
- Declarative specification of visual mappings
- Composable layers that build complex plots incrementally
- Automatic handling of scales, legends, and axes
- Familiar API for R/Python users (ggplot2, plotnine)
- Native OpenTUI integration for reactive terminal UIs

## Quick Example

```typescript
import { gg, geom_point, scale_color_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'pc1', y: 'pc2', color: 'group' })
  .geom(geom_point({ size: 2 }))
  .scale(scale_color_viridis())
  .labs({
    title: 'PCA Analysis',
    x: 'PC1 (45%)',
    y: 'PC2 (23%)'
  })

// Render to string
console.log(plot.render({ width: 80, height: 24 }))
```

## OpenTUI Integration

```tsx
import { GGTerm } from '@ggterm/opentui'

function Dashboard({ data }) {
  return (
    <box flexDirection="row">
      <GGTerm
        data={data}
        aes={{ x: 'time', y: 'value', color: 'series' }}
        geoms={[geom_line()]}
        width="50%"
        height={20}
      />
    </box>
  )
}
```

## Interactive REPL

Explore data and build plots interactively:

```bash
npx ggterm
```

```
ggterm> .data sample 30
Generated 30 sample rows with columns: x, y, group, size

ggterm> gg(data).aes({x: "x", y: "y", color: "group"}).geom(geom_point())

  My First Plot
  40 ┤                                    ●
     │                        ●       ●
  30 ┤    ●   ●       ●   ●       ●
     │        ●   ●           ●       ●
  20 ┤●           ●   ●   ●
     │    ●           ●
  10 ┤
     └────────────────────────────────────
      0    5    10   15   20   25   30
```

## Features

- **Interactive REPL**: Build plots interactively with `npx ggterm`
- **CLI Tool**: Quick plotting from CSV/JSON files with `bun cli-plot.ts`
- **Multiple Renderers**: Braille (high-res), Block (compatible), Sixel/Kitty (pixel-perfect)
- **30+ Geometries**: Points, lines, bars, histograms, boxplots, Q-Q plots, density, contours, and more
- **Grammar Layers**: Data, Aesthetics, Geometries, Statistics, Scales, Coordinates, Facets, Themes
- **Faceting**: Small multiples with `facet_wrap()` and `facet_grid()`
- **Export to HTML**: Interactive Vega-Lite exports with PNG/SVG download
- **Plot History**: Automatic provenance tracking with search and retrieval
- **Streaming Data**: Real-time updates with `plot.push(newData)`
- **Terminal Detection**: Automatic color capability detection and graceful degradation
- **Framework Support**: React, Solid.js, Svelte, Vue 3 components and composables

## Packages

| Package | Description |
|---------|-------------|
| `@ggterm/core` | Grammar engine, scales, statistics |
| `@ggterm/solid` | Solid.js components and primitives |
| `@ggterm/svelte` | Svelte components and stores |
| `@ggterm/vue` | Vue 3 components and composables |
| `@ggterm/render-braille` | Braille dot matrix renderer (2x4 per cell) |
| `@ggterm/render-block` | Block character renderer (universal compatibility) |
| `@ggterm/render-sixel` | Sixel/Kitty graphics protocol renderer |
| `@ggterm/opentui` | OpenTUI/React integration components |

## Installation

```bash
bun add @ggterm/core @ggterm/opentui
```

## CLI Quick Start

Plot directly from CSV files without writing code:

```bash
# Basic scatter plot
bun packages/core/src/cli-plot.ts data.csv x y

# With color mapping and title
bun packages/core/src/cli-plot.ts data.csv x y category "My Plot"

# Different geometry types
bun packages/core/src/cli-plot.ts data.csv x y - "Title" histogram
bun packages/core/src/cli-plot.ts data.csv x y - "Title" boxplot

# Faceted plot (small multiples)
bun packages/core/src/cli-plot.ts data.csv x y color "Title" point facet_var
```

**29 CLI-exposed geoms**: point, line, path, step, bar, col, histogram, freqpoly, boxplot, violin, area, ribbon, rug, errorbar, errorbarh, crossbar, linerange, pointrange, smooth, segment, rect, raster, tile, text, label, contour, contour_filled, density_2d, qq

## Export to HTML

Create interactive, publication-ready visualizations:

```bash
# Export last plot to HTML with Vega-Lite
bun packages/core/src/cli-plot.ts export output.html

# Export includes:
# - Interactive pan/zoom
# - PNG/SVG download buttons
# - Full Vega-Lite spec for further editing
```

## Plot History

All plots are automatically saved with provenance metadata:

```bash
# List all plots
bun packages/core/src/cli-plot.ts history

# Search for specific plots
bun packages/core/src/cli-plot.ts history scatter
bun packages/core/src/cli-plot.ts history sales

# Re-display a plot
bun packages/core/src/cli-plot.ts show 2024-01-26-001

# Export a historical plot
bun packages/core/src/cli-plot.ts export 2024-01-26-001 output.html
```

## Documentation

- [Quick Start](./docs/QUICKSTART.md) - Get started in 5 minutes
- [Interactive REPL](./docs/REPL.md) - Interactive plotting guide
- [Gallery](./docs/GALLERY.md) - Visual examples of all plot types
- [API Reference](./docs/API.md) - Full API documentation
- [Architecture](./docs/ARCHITECTURE.md) - Technical design
- [Roadmap](./docs/ROADMAP.md) - Development phases

### Migration Guides

- [From ggplot2](./docs/MIGRATION-GGPLOT2.md) - For R users
- [From Vega-Lite](./docs/MIGRATION-VEGALITE.md) - For Vega-Lite users

### Contributing

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## Prior Art

- [ggplot2](https://ggplot2.tidyverse.org/) (R) - The original grammar of graphics
- [Vega-Lite](https://vega.github.io/vega-lite/) - JSON grammar for web
- [OpenTUI](https://github.com/sst/opentui) - Terminal UI framework
- [plotext](https://github.com/piccolomo/plotext) (Python) - Terminal plotting

## License

MIT
