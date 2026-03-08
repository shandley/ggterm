# ggterm Examples

Walkthrough examples demonstrating AI-driven data visualization with Claude Code and the live browser viewer.

## Prerequisites

```bash
npx ggterm-plot setup
```

This starts the live viewer in your browser. All plots created during these examples appear there automatically as interactive Vega-Lite visualizations with tooltips, pan, and zoom.

## Vignettes

Each vignette is a conversation with Claude Code. You describe what you want, Claude creates the plot, and it appears instantly in the viewer.

| Example | Dataset | What You'll Learn |
|---------|---------|-------------------|
| [01 — Exploratory Analysis](./01-exploratory-analysis.md) | mtcars | Discover patterns through conversation, iterative refinement |
| [02 — Publication Figures](./02-publication-figures.md) | iris | Style presets, customization, and export for journal submission |
| [03 — Streaming Dashboard](./03-streaming-dashboard.md) | sample | Real-time monitoring with live-updating viewer |
| [04 — Comparative Analysis](./04-comparative-analysis.md) | iris | Distribution comparison, statistical annotations, faceting |

## Skills Demonstrated

| Skill | Used In |
|-------|---------|
| `/data-load` | 01, 02, 03, 04 |
| `/ggterm-plot` | 01, 02, 03, 04 |
| `/ggterm-style` | 02 |
| `/ggterm-customize` | 01, 02, 04 |
| `/ggterm-publish` | 02, 04 |
| `/ggterm-history` | 01, 03 |
| `/ggterm-markdown` | 04 |
| `/ggterm-help` | — |

## Built-in Datasets

These examples use datasets bundled with ggterm — no files needed:

| Dataset | Rows | Columns | Load Command |
|---------|------|---------|--------------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species | "Load the iris dataset" |
| **mtcars** | 16 | mpg, cyl, hp, wt, name | "Load the mtcars dataset" |
| **sample** | n | x, y, group, size | "Generate 50 sample points" |

## Specialized Visualizations

Beyond standard charts, ggterm includes 66 geometry types across domains:

| Category | Types |
|----------|-------|
| **Essentials** | scatter, line, bar, area, histogram, density, boxplot, violin |
| **Advanced** | ridgeline, beeswarm, heatmap, treemap, sankey, calendar heatmap, lollipop, waffle |
| **Scientific** | volcano plot, Manhattan plot, Kaplan-Meier, forest plot, ROC curve, Q-Q plot |
| **Diagnostics** | ECDF, funnel plot, control chart, scree plot, correlation matrix, UpSet plot |

See the [Geometry Reference](../docs/GEOM-REFERENCE.md) for the full catalog.

## Programmatic API

The TypeScript examples demonstrate the programmatic API for developers:

| File | Description |
|------|-------------|
| [basic.ts](./basic.ts) | Minimal scatter plot |
| [demo.ts](./demo.ts) | 7 plot types from CSV data |
| [streaming-demo.ts](./streaming-demo.ts) | Real-time data with live statistics |
| [extended-grammar-demo.ts](./extended-grammar-demo.ts) | Heatmaps, error bars, annotations, bubble charts |

```bash
npx tsx examples/basic.ts
npx tsx examples/streaming-demo.ts
```
