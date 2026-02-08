# ggterm

[![npm version](https://img.shields.io/npm/v/@ggterm/core.svg)](https://www.npmjs.com/package/@ggterm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Data visualization through conversation.**

ggterm lets you create terminal visualizations by describing what you want in natural language. No commands to memorize, no syntax to learn.

```
You: Load the iris dataset and show me sepal length vs petal length, colored by species.

AI: [Creates scatter plot with automatic scales, legends, and color mapping]
```

## How It Works

ggterm is designed for AI assistants. You describe what you want to see, and your AI creates the visualization:

| You say... | AI does... |
|------------|-----------|
| "Load the iris dataset" | Loads 150 rows with sepal/petal measurements by species |
| "Show sepal length vs petal length" | Creates scatter plot with proper axis labels |
| "Color by species" | Adds color encoding with legend |
| "Add a trend line" | Overlays linear regression |
| "Export for my paper" | Generates HTML with PNG/SVG download |

## Bundled Datasets

ggterm includes classic datasets for immediate exploration:

| Dataset | Rows | Columns | Description |
|---------|------|---------|-------------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species | Fisher's iris flower measurements |
| **mtcars** | 16 | mpg, cyl, hp, wt, name | Motor Trend car road tests |
| **sample** | n | x, y, group, size | Generated random data |

## Examples

See our [example vignettes](./examples/) for complete workflows using real data:

| Example | Dataset | What you'll learn |
|---------|---------|-------------------|
| [Exploratory Analysis](./examples/01-exploratory-analysis.md) | mtcars | Explore car performance data through conversation |
| [Publication Figures](./examples/02-publication-figures.md) | iris | Create publication-ready species comparison |
| [Streaming Dashboard](./examples/03-streaming-dashboard.md) | sample | Build real-time monitoring displays |
| [Comparative Analysis](./examples/04-comparative-analysis.md) | iris | Compare distributions across species |

## Getting Started

### Use in Your Project (Recommended)

Add ggterm to any project and use Claude Code for natural language visualization:

```bash
# In your project directory (e.g., "Epi Analysis")
cd my-project

# Install ggterm
npm install @ggterm/core

# Set up Claude Code skills
npx ggterm-plot init
```

Now open Claude Code and start talking:

```
You: Load outbreak_data.csv and show me cases over time by region

Claude: [Creates line chart with automatic date parsing and color encoding]

You: Add a reference line at 100 cases

Claude: [Updates plot with horizontal reference line]

You: Style this like The Economist and export as PNG

Claude: [Applies Economist style preset and generates publication-ready output]
```

### For Contributors

Clone the repo to develop or contribute:

```bash
git clone https://github.com/shandley/ggterm.git
cd ggterm
bun install
```

### Interactive REPL

For hands-on exploration without AI:

```bash
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

## What You Can Create

- **Scatter plots** - Relationships between variables
- **Line charts** - Trends over time
- **Histograms & Density** - Distributions of single variables
- **Box plots & Violin** - Compare distributions across groups
- **Bar charts & Lollipops** - Categorical comparisons
- **Faceted plots** - Small multiples for comparison
- **Ridgeline & Beeswarm** - Advanced distribution views
- **Calendar heatmaps** - GitHub-style activity visualization
- **Flame graphs** - Performance profiling visualization
- **Sankey diagrams** - Flow visualization between nodes
- **Treemaps** - Hierarchical data as nested rectangles
- **Correlation matrices** - Pairwise variable relationships
- **Volcano plots** - Differential expression for genomics
- **MA plots** - Companion to volcano for DE analysis
- **Manhattan plots** - GWAS visualization across chromosomes
- **Heatmaps** - Matrix visualization with clustering
- **PCA biplots** - Scores and loadings together
- **Kaplan-Meier curves** - Survival analysis for clinical trials
- **Forest plots** - Meta-analysis effect sizes with CI
- **ROC curves** - Classifier performance evaluation
- **Bland-Altman plots** - Method comparison and agreement
- **Q-Q plots** - Normality assessment
- **ECDF plots** - Empirical cumulative distribution
- **Funnel plots** - Publication bias in meta-analysis
- **Control charts** - Statistical process control
- **Scree plots** - PCA variance explained
- **UpSet plots** - Modern set intersections (superior to Venn)
- **Dendrograms** - Hierarchical clustering trees
- **And more** - 68 geometry types available

## Export Options

Export any plot to HTML for sharing or publication:

- Interactive pan/zoom in browser
- Download as PNG or SVG
- Full Vega-Lite spec for further editing

## Live Plot Viewer

ggterm includes a companion plot viewer that automatically displays new plots in real time. Every plot you create instantly appears as an interactive Vega-Lite visualization — no manual export or refresh needed.

```bash
# Start the live viewer (runs on localhost:4242)
npx ggterm-plot serve
```

Open `http://localhost:4242` in a browser alongside your terminal. As you create plots through conversation, they appear automatically in the viewer with:

- **Interactive Vega-Lite rendering** — tooltips, zoom, pan, legend filtering
- **Plot history navigation** — arrow keys to browse previous plots
- **SVG/PNG export** — download publication-quality output directly
- **Dark theme** — designed to sit alongside your terminal

This creates a minimal data analysis IDE: a terminal for conversation with your AI assistant, and a companion panel for high-fidelity plot output.

**Wave terminal users**: `ggterm serve` auto-detects [Wave](https://www.waveterm.dev/) and opens the viewer as a side panel with zero additional setup.

![ggterm live viewer in Wave terminal](paper/figures/Screenshot%202026-02-08%20at%209.32.28%E2%80%AFAM.png)

## For Developers

If you want to use ggterm programmatically:

```typescript
import { gg, geom_point, scale_color_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'sepal_length', y: 'petal_length', color: 'species' })
  .geom(geom_point())
  .scale(scale_color_viridis())
  .labs({ title: 'Iris Dataset' })

console.log(plot.render({ width: 80, height: 24 }))
```

See the [API Reference](./docs/API.md) for full documentation.

## Why ggterm?

ggterm implements the [Grammar of Graphics](https://www.amazon.com/Grammar-Graphics-Statistics-Computing/dp/0387245448) - the same foundation as R's ggplot2 and Python's plotnine. This means:

- **Declarative** - Describe what you want, not how to draw it
- **Composable** - Build complex plots by layering simple elements
- **Consistent** - Same patterns work across all plot types

## Resources

- [Quick Start Guide](./docs/QUICKSTART.md)
- [Geometry Reference](./docs/GEOM-REFERENCE.md)
- [Migration from ggplot2](./docs/MIGRATION-GGPLOT2.md)

## License

MIT
