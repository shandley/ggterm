# ggterm

[![npm version](https://img.shields.io/npm/v/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![npm downloads](https://img.shields.io/npm/dm/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Grammar of Graphics for Terminal User Interfaces.

**ggterm** is a TypeScript library implementing Leland Wilkinson's Grammar of Graphics for terminal-based rendering. Create publication-quality data visualizations directly in your terminal.

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

## AI-Forward Examples

ggterm is designed for natural language interaction with AI assistants. See our [example vignettes](./examples/) for prompt-driven workflows:

| Example | Description |
|---------|-------------|
| [Exploratory Analysis](./examples/01-exploratory-analysis.md) | Explore unfamiliar datasets through conversation |
| [Publication Figures](./examples/02-publication-figures.md) | Iteratively refine figures for publication |
| [Streaming Dashboard](./examples/03-streaming-dashboard.md) | Build real-time monitoring dashboards |
| [Comparative Analysis](./examples/04-comparative-analysis.md) | Compare distributions and A/B test results |

## Features

- **Interactive REPL**: Build plots interactively with `npx ggterm`
- **CLI Tool**: Quick plotting from CSV/JSON/JSONL files
- **30+ Geometries**: Points, lines, bars, histograms, boxplots, Q-Q plots, density, contours, and more
- **Grammar Layers**: Data, Aesthetics, Geometries, Statistics, Scales, Coordinates, Facets, Themes
- **Faceting**: Small multiples with `facet_wrap()` and `facet_grid()`
- **Reference Lines**: Add hline, vline, abline with `+hline@50` syntax
- **Export to HTML**: Interactive Vega-Lite exports with PNG/SVG download
- **Plot History**: Automatic provenance tracking with search and retrieval
- **Terminal Detection**: Automatic color capability detection and graceful degradation

## Installation

```bash
npm install @ggterm/core
```

## CLI Quick Start

Plot directly from CSV, JSON, or JSONL files:

```bash
# Basic scatter plot
bun packages/core/src/cli-plot.ts data.csv x y

# JSON and JSONL support
bun packages/core/src/cli-plot.ts data.json x y
bun packages/core/src/cli-plot.ts data.jsonl x y color

# With color mapping and title
bun packages/core/src/cli-plot.ts data.csv x y category "My Plot"

# Different geometry types
bun packages/core/src/cli-plot.ts data.csv x y - "Title" histogram
bun packages/core/src/cli-plot.ts data.csv x y - "Title" boxplot

# Reference lines
bun packages/core/src/cli-plot.ts data.csv x y - - point+hline@50
bun packages/core/src/cli-plot.ts data.csv x y - - line+vline@2.5+hline@100

# Faceted plot (small multiples)
bun packages/core/src/cli-plot.ts data.csv x y color "Title" point facet_var
```

**29 CLI-exposed geoms**: point, line, path, step, bar, col, histogram, freqpoly, boxplot, violin, area, ribbon, rug, errorbar, errorbarh, crossbar, linerange, pointrange, smooth, segment, rect, raster, tile, text, label, contour, contour_filled, density_2d, qq

**Reference lines**: `+hline@<y>`, `+vline@<x>`, `+abline@<slope>,<intercept>`

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
- [plotext](https://github.com/piccolomo/plotext) (Python) - Terminal plotting

## License

MIT
