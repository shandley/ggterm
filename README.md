# ggterm

[![npm version](https://img.shields.io/npm/v/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A Grammar of Graphics primitive catalog for programmatic data visualization.**

ggterm is a comprehensive catalog of data visualization primitives — 65 geometry types, 73 scales, statistical transforms, coordinate systems, facets, and themes — specified as a backend-agnostic `PlotSpec`. Any rendering system can consume this specification. Today ggterm ships two backends: terminal ASCII art for instant feedback, and Vega-Lite for publication-quality interactive output. The declarative API makes it ideal for AI agent composition.

## The Specification

Every plot reduces to a `PlotSpec` — a JSON-serializable, backend-agnostic specification:

```typescript
interface PlotSpec {
  data: DataSource        // Input dataset
  aes: AestheticMapping   // Variable → visual property mapping
  geoms: Geom[]           // Visual marks (65 types)
  stats: Stat[]           // Statistical transforms
  scales: Scale[]         // Data domain → visual range (73 types)
  coord: Coord            // Coordinate system
  facet?: Facet           // Small multiples
  theme: Theme            // Non-data styling
  labels: Labels          // Title, axis labels, legend titles
}
```

This is the clean boundary. Everything in the grammar layer produces a `PlotSpec`. Everything in the rendering layer consumes one.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: AI Integration                                     │
│  8 Claude Code skills, natural language workflows,           │
│  conversational data analysis                                │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Backends & Tooling                                 │
│  Terminal renderer, Vega-Lite exporter, live viewer,         │
│  CLI, plot history with provenance                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Grammar & Primitives (the durable core)            │
│  PlotSpec, 65 geoms, 73 scales, stats, coords, facets,      │
│  themes — backend-agnostic specification                     │
└─────────────────────────────────────────────────────────────┘
```

Layer 1 is the product. Layers 2 and 3 are today's implementations that consume it.

## Primitive Catalog

65 geometry types organized by domain:

| Category | Geoms | Examples |
|----------|-------|---------|
| **Basic** | point, line, bar, area, histogram, density, smooth, step, segment, text, rug | Scatter, trends, distributions |
| **Distribution** | boxplot, violin, ridgeline, beeswarm, ecdf, qq | Compare distributions across groups |
| **Specialized** | heatmap, treemap, sankey, calendar, flame, waffle, upset, dendrogram, corrmat, contour, sparkline, lollipop, dumbbell, bullet | Domain-specific visualizations |
| **Scientific** | volcano, manhattan, kaplan-meier, forest, roc, bland-altman, ma, biplot, scree, funnel, control | Genomics, clinical trials, meta-analysis, diagnostics |

73 scale functions: continuous, discrete, log, sqrt, reverse, datetime, color (viridis, plasma, inferno, magma, categorical), size, shape, alpha, and manual overrides.

## Two Backends, One Spec

### Backend 1: Terminal ASCII

Instant visualization directly in the terminal using Unicode braille dots and block characters with ANSI truecolor:

```
npx ggterm
```

```
ggterm> .data iris
Loaded Iris dataset: 150 rows, 5 columns

ggterm> gg(data).aes({x: "sepal_length", y: "petal_length", color: "species"}).geom(geom_point())

              Sepal vs Petal Length
  7.0 ┤                         ■■■■
      │                      ■■■■■■■■
  6.0 ┤                   ■■■■■■■■
      │               ●●●●●■■■■■
  5.0 ┤            ●●●●●●●●●
      │         ●●●●●●●●
  4.0 ┤       ●●●●●●
      │     ●●●●
  3.0 ┤   ●●●
      │
  2.0 ┤▲▲▲▲▲▲
      │▲▲▲▲▲▲▲
  1.0 ┤▲▲▲▲
      └──────────────────────────────────
       4.5   5.0   5.5   6.0   6.5   7.0

      ▲ setosa  ● versicolor  ■ virginica
```

### Backend 2: Vega-Lite (Browser)

The same `PlotSpec` is converted to a Vega-Lite specification for interactive, publication-quality output. The live viewer displays plots in real time as you create them:

```bash
npx ggterm-plot serve   # Opens live viewer at localhost:4242
```

- Interactive rendering — tooltips, zoom, pan, legend filtering
- Plot history navigation — arrow keys to browse previous plots
- SVG/PNG export — download publication-quality output directly
- Dark theme — designed to sit alongside your terminal

![ggterm live viewer in Wave terminal](paper/figures/Screenshot%202026-02-08%20at%209.32.28%E2%80%AFAM.png)

**Wave terminal users**: auto-detects [Wave](https://www.waveterm.dev/) and opens the viewer as a side panel.

## AI-Native Composition

ggterm's declarative `PlotSpec` is designed for programmatic construction — particularly by AI agents. Describe what you want in natural language, and your AI composes the visualization:

| You say... | AI does... |
|------------|-----------|
| "Load the iris dataset" | Loads 150 rows with sepal/petal measurements by species |
| "Show sepal length vs petal length" | Creates scatter plot with proper axis labels |
| "Color by species" | Adds color encoding with legend |
| "Add a trend line" | Overlays linear regression |
| "Style like The Economist" | Applies publication style preset |
| "Export for my paper" | Generates HTML with PNG/SVG download |

8 Claude Code skills handle the full workflow: data loading, plotting, history, customization, styling, export, markdown reports, and help.

See our [example vignettes](./examples/) for complete AI-driven workflows:

| Example | Dataset | What you'll learn |
|---------|---------|-------------------|
| [Exploratory Analysis](./examples/01-exploratory-analysis.md) | mtcars | Explore car performance data through conversation |
| [Publication Figures](./examples/02-publication-figures.md) | iris | Create publication-ready species comparison |
| [Streaming Dashboard](./examples/03-streaming-dashboard.md) | sample | Build real-time monitoring displays |
| [Comparative Analysis](./examples/04-comparative-analysis.md) | iris | Compare distributions across species |

## Getting Started

### Quick Start (New Projects)

```bash
mkdir my-analysis && cd my-analysis
npx ggterm-plot setup    # Init skills, generate welcome plot, open browser, start live viewer
```

### Step-by-Step

```bash
npm install @ggterm/core
npx ggterm-plot init     # Install Claude Code skills + project CLAUDE.md
npx ggterm-plot serve    # Start live viewer (port 4242)
```

### For Contributors

```bash
git clone https://github.com/shandley/ggterm.git
cd ggterm
bun install
bun test                 # 2158 tests
```

## Bundled Datasets

Built-in datasets for immediate exploration — no CSV files needed:

| Dataset | Rows | Columns | Description |
|---------|------|---------|-------------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species | Fisher's iris flower measurements |
| **mtcars** | 16 | mpg, cyl, hp, wt, name | Motor Trend car road tests |
| **sample** | n | x, y, group, size | Generated random data |

## For Developers

Use ggterm programmatically to build a `PlotSpec` and render it:

```typescript
import { gg, geom_point, scale_color_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'sepal_length', y: 'petal_length', color: 'species' })
  .geom(geom_point())
  .scale(scale_color_viridis())
  .labs({ title: 'Iris Dataset' })

// Terminal backend
console.log(plot.render({ width: 80, height: 24 }))

// Access the raw PlotSpec
const spec = plot.spec()
```

See the [API Reference](./docs/API.md) for full documentation.

## Why ggterm?

ggterm implements [Wilkinson's Grammar of Graphics](https://www.amazon.com/Grammar-Graphics-Statistics-Computing/dp/0387245448) — the same foundation as R's ggplot2 and Python's plotnine — but treats the **specification as the primary artifact** and renderers as pluggable consumers.

- **Specification-first** — `PlotSpec` is a backend-agnostic, JSON-serializable intermediate representation. New rendering targets can consume it without touching the grammar layer.
- **Declarative** — Describe what you want, not how to draw it
- **Composable** — Build complex plots by layering simple elements
- **AI-composable** — The declarative API is ideal for programmatic construction by AI agents
- **Two backends, one spec** — Terminal for speed, Vega-Lite for quality

## Resources

- [Architecture](./docs/ARCHITECTURE.md)
- [Quick Start Guide](./docs/QUICKSTART.md)
- [Geometry Reference](./docs/GEOM-REFERENCE.md)
- [Migration from ggplot2](./docs/MIGRATION-GGPLOT2.md)
- [Roadmap](./docs/ROADMAP.md)

## License

MIT
