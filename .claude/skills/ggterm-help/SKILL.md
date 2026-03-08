---
name: ggterm-help
description: Quick reference for ggterm capabilities. Use when the user asks what they can do, what commands are available, what plot types exist, how to use ggterm, or asks for help.
allowed-tools: Read
---

# ggterm Quick Reference

Provide a quick reference of ggterm capabilities when users ask for help.

## What You Can Ask Claude Code to Do

### Data Loading
- "Load data.csv" — reads CSV, JSON, or JSONL files
- "Use the iris dataset" — built-in iris (150 rows) or mtcars (16 rows)
- "Inspect my data" — column types and summary statistics

### Plotting
- "Plot x vs y" — scatter plot
- "Show a histogram of column_name" — distribution
- "Create a boxplot by group" — comparison
- Any of 66 geom types (see below)

### Styling
- "Apply Wilke style" — 6 presets: Wilke, Tufte, Nature, Economist, Minimal, APA
- "Change the title to ..." — natural language customization
- "Make the points blue" — color/font/label changes

### Export
- "Export as PNG" — raster export
- "Save as SVG" — vector export
- "Export to PDF" — PDF via vega-lite CLI

### History
- "Show my recent plots" — list history
- "Find the scatter plot I made earlier" — search history

## All 66 Geom Types

| Category | Types |
|----------|-------|
| Point/Line | point, line, path, step, smooth, segment, curve |
| Bar/Area | bar, col, histogram, freqpoly, density, area, ribbon |
| Distribution | boxplot, violin, ridgeline, joy, beeswarm, quasirandom, density_2d, qq |
| Comparison | dumbbell, lollipop, waffle, sparkline, bullet, braille |
| Specialized | calendar, flame, icicle, corrmat, sankey, treemap, volcano, ma, manhattan, heatmap, biplot |
| Clinical | kaplan_meier, forest, roc, bland_altman |
| Diagnostics | ecdf, funnel, control, scree, upset, dendrogram |
| Error/Reference | errorbar, errorbarh, crossbar, linerange, pointrange, rug, hline, vline, abline |
| Text | text, label |
| 2D/Tile | tile, raster, bin2d, rect, contour, contour_filled |

## 75 Scale Functions

| Category | Examples |
|----------|----------|
| Position | scale_x_continuous, scale_x_log10, scale_x_discrete, scale_x_datetime |
| Color | scale_color_viridis, scale_color_brewer, scale_color_manual, scale_fill_* |
| Size | scale_size_continuous, scale_size_area, scale_size_radius |
| Shape | scale_shape_discrete, scale_shape_manual |
| Alpha | scale_alpha_continuous, scale_alpha_discrete |

## Style Presets

| Style | Description |
|-------|-------------|
| Wilke | Clean academic, Helvetica, subtle gridlines |
| Tufte | Maximum data-ink ratio, Georgia serif, grayscale |
| Nature | Compact journal format, Arial, thin lines |
| Economist | Light blue background, bold titles, distinctive |
| Minimal | Ultra-clean, system font, no chrome |
| APA | Times New Roman, italic titles, academic |

## Live Viewer

When `npx ggterm-plot serve` is running:
- Press `Cmd+K` for command palette (search geoms, actions, styles)
- Press `?` for full help panel (tabbed reference)
- Press `h` for history sidebar
- Press `s`/`p` for SVG/PNG export
- Press `f` for fullscreen

## Workflow

1. Start the viewer: `npx ggterm-plot serve`
2. Ask Claude to plot data naturally
3. Iterate with style/customize commands
4. Export when satisfied

$ARGUMENTS
