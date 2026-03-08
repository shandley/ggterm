# Quick Start Guide

Get up and running with ggterm in one command.

## Setup

```bash
mkdir my-analysis && cd my-analysis
npx ggterm-plot setup
```

This installs ggterm, generates a welcome plot, opens the live viewer in your browser, and starts the server. You're ready to go.

## Your First Plot

With the live viewer open and Claude Code running, just describe what you want:

**You:** Load the iris dataset and show me sepal length vs petal length

**Claude:** Loads 150 rows and creates a scatter plot.

> **In the viewer:** An interactive scatter plot appears — 150 points showing the relationship between sepal and petal length. Hover any point to see exact measurements. Pan and zoom with your mouse.

**You:** Color by species

**Claude:** Adds species color encoding.

> **In the viewer:** Points are now colored by species (setosa, versicolor, virginica) with a legend. Three distinct clusters emerge — setosa with short petals, virginica with long petals.

## Iterative Refinement

Every change updates the viewer in place. No re-running, no page refresh.

**You:** Add a trend line

> **In the viewer:** A regression line appears overlaid on the scatter plot, showing the strong positive correlation between sepal and petal length.

**You:** Make the title "Iris Morphology" and label the axes properly

> **In the viewer:** Title and axis labels update immediately.

## Common Plot Types

ggterm supports 66 geometry types. Here are the most common, all available through natural language:

| You say... | What appears in the viewer |
|------------|---------------------------|
| "Show me X vs Y" | Scatter plot with automatic scales |
| "Plot X over time" | Line chart with temporal axis |
| "Show the distribution of X" | Histogram with automatic binning |
| "Compare groups with box plots" | Grouped boxplots with quartiles |
| "Show a bar chart of X by Y" | Bar chart with labels |
| "Create a heatmap of X vs Y" | Color-encoded tile grid |
| "Show density of X by group" | Overlaid density curves |
| "Make a violin plot of X by group" | Distribution shape comparison |

See the [Geometry Reference](./GEOM-REFERENCE.md) for all 65 plot types including scientific visualizations (volcano plots, Kaplan-Meier curves, forest plots), specialized charts (treemaps, sankey diagrams, calendar heatmaps), and diagnostics (Q-Q plots, ROC curves, control charts).

## Style Presets

Apply publication-quality styling with the `/ggterm-style` skill:

**You:** Style this like a Nature journal figure

**Claude:** Applies the Nature preset via `/ggterm-style`.

> **In the viewer:** The plot updates in place — compact dimensions, small fonts, no grid, ready for journal submission.

### Available Presets

| Preset | Best For | Character |
|--------|----------|-----------|
| **wilke** | Academic papers | Subtle Y-grid, clean sans-serif, colorblind-safe |
| **tufte** | Minimalist presentations | No grid, no borders, serif font, maximum data-ink |
| **economist** | Editorial/magazine | Blue-gray background, white gridlines, bold colors |
| **nature** | Nature journal | Compact (180x150px), small fonts, publication-ready |
| **apa** | Psychology papers | Times New Roman, italic titles, grayscale |
| **minimal** | Web/presentations | No decoration, system fonts |

## Customizing Plots

Use the `/ggterm-customize` skill for natural language refinements:

**You:** Make the legend horizontal and move it to the bottom. Increase the font size.

**Claude:** Applies customizations via `/ggterm-customize`.

> **In the viewer:** Legend repositions to the bottom in a horizontal layout. All text scales up.

## Exporting

Use the `/ggterm-publish` skill to generate publication-ready output:

**You:** Export as PNG for my paper

**Claude:** Generates output via `/ggterm-publish`.

```
Created: iris-morphology.png (600x400px)
Also available: iris-morphology.svg, iris-morphology.html
```

Export formats: PNG, SVG, HTML (interactive). The HTML export includes pan/zoom controls and download buttons.

## Plot History

Every plot is automatically saved with provenance metadata.

**In the viewer:** Press `h` to open the history sidebar. Use arrow keys to browse previous plots. Each entry shows the plot title, timestamp, and the command that created it.

**You:** Show me the scatter plot I made earlier

**Claude:** Retrieves it via `/ggterm-history`.

> **In the viewer:** The earlier plot reappears with all its styling intact.

### Viewer Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `h` | Toggle history sidebar |
| `←` `→` | Browse previous/next plots |
| `s` | Download as SVG |
| `p` | Download as PNG |
| `f` | Toggle fullscreen |
| `?` | Show all shortcuts |

## Built-in Datasets

Start exploring immediately — no files needed:

| Dataset | Rows | Columns |
|---------|------|---------|
| **iris** | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| **mtcars** | 16 | mpg, cyl, hp, wt, name |

```
You: Load the iris dataset
You: Load mtcars and show me MPG vs horsepower
```

Or bring your own CSV, JSON, or JSONL files.

## CLI Direct Usage

For scripting or quick plots without Claude Code:

```bash
# Plot from a built-in dataset
npx ggterm-plot iris sepal_length sepal_width species "Iris" point

# Plot from a CSV file
npx ggterm-plot data.csv x y color "Title" point

# Histogram
npx ggterm-plot data.csv value - "Distribution" histogram

# Reference lines
npx ggterm-plot data.csv x y - - point+hline@50+vline@2

# History and export
npx ggterm-plot history
npx ggterm-plot export 2024-01-26-001 output.html

# Start the live viewer
npx ggterm-plot serve
```

## Interactive REPL

For programmatic exploration without AI:

```bash
npx ggterm
```

```
ggterm> .data iris
Loaded Iris dataset: 150 rows, 5 columns

ggterm> gg(data).aes({x: "sepal_length", y: "petal_length", color: "species"}).geom(geom_point())
```

See the [REPL Reference](./REPL.md) for full documentation.

## Skills Reference

ggterm includes 8 Claude Code skills for AI-assisted workflows:

| Skill | Purpose |
|-------|---------|
| `/data-load` | Load CSV, JSON, JSONL data files |
| `/ggterm-plot` | Create visualizations from data |
| `/ggterm-style` | Apply publication style presets |
| `/ggterm-customize` | Natural language plot customization |
| `/ggterm-publish` | Export to PNG, SVG, HTML |
| `/ggterm-history` | Browse and retrieve previous plots |
| `/ggterm-markdown` | Generate reports with embedded plots |
| `/ggterm-help` | Get help with ggterm features |

## Next Steps

- [Exploratory Analysis](../examples/01-exploratory-analysis.md) — Discover patterns through conversation
- [Publication Figures](../examples/02-publication-figures.md) — Iterate to publication quality
- [Streaming Dashboard](../examples/03-streaming-dashboard.md) — Real-time monitoring
- [Comparative Analysis](../examples/04-comparative-analysis.md) — Statistical comparisons
- [Geometry Reference](./GEOM-REFERENCE.md) — All 65 plot types
- [API Reference](./API.md) — Programmatic TypeScript API
