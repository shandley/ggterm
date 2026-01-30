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

### With an AI Assistant (Recommended)

If you're using Claude Code, Cursor, or another AI coding assistant:

1. Make sure ggterm is available in your project:
   ```bash
   npm install @ggterm/core
   ```

2. Ask your AI to visualize data:
   ```
   "Load the iris dataset and show me how petal dimensions relate to species"
   ```

That's it. The AI handles the rest.

### CLI Plotting

Plot CSV, JSON, or JSONL files directly from the command line:

```bash
# Install globally for npx usage
npm install -g @ggterm/core

# Or use npx directly
npx ggterm-plot data.csv x_column y_column [color] [title] [geom]
```

Examples:

```bash
# Scatter plot
npx ggterm-plot iris.csv sepal_length petal_length species "Iris" point

# Histogram (use - for y)
npx ggterm-plot iris.csv sepal_width - - "Sepal Width Distribution" histogram

# Inspect data columns
npx ggterm-plot inspect mydata.csv

# Get plot suggestions
npx ggterm-plot suggest mydata.csv
```

### Interactive REPL

For hands-on exploration:

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
- **Histograms** - Distributions of single variables
- **Box plots** - Compare distributions across groups
- **Bar charts** - Categorical comparisons
- **Faceted plots** - Small multiples for comparison
- **And more** - 30+ geometry types available

## Export Options

Export any plot to HTML for sharing or publication:

- Interactive pan/zoom in browser
- Download as PNG or SVG
- Full Vega-Lite spec for further editing

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
- [Visual Gallery](./docs/GALLERY.md)
- [Migration from ggplot2](./docs/MIGRATION-GGPLOT2.md)

## License

MIT
