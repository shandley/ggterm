---
name: ggterm-publish
description: Export terminal plots to publication-quality formats (PNG, SVG, PDF, HTML). Use when the user wants to save, export, publish, or create a high-quality version of a plot.
allowed-tools: Bash(npx:*), Read, Write
---

# Publication Export with ggterm

Export terminal plots to publication-quality formats using Vega-Lite.

## Prerequisites

The Vega-Lite CLI tools must be installed:

```bash
npm install -g vega-lite vega-cli canvas
```

## How It Works

When a plot is created with the CLI, ggterm saves:
- `.ggterm/last-plot.json` - The PlotSpec (ggterm format)
- `.ggterm/last-plot-vegalite.json` - The Vega-Lite spec

## Export Commands

### To PNG (Raster)

```bash
npx vl2png .ggterm/last-plot-vegalite.json > plot.png
```

### To SVG (Vector)

```bash
npx vl2svg .ggterm/last-plot-vegalite.json > plot.svg
```

### To PDF

```bash
npx vl2pdf .ggterm/last-plot-vegalite.json > plot.pdf
```

## Workflow

1. User creates a terminal plot using `/ggterm-plot`
2. User asks to export it for publication
3. This skill exports to the requested format

$ARGUMENTS
