---
name: ggterm-plot
description: Create terminal data visualizations using Grammar of Graphics. Use when plotting data, creating charts, graphing, visualizing distributions, or when the user mentions plot, chart, graph, histogram, scatter, boxplot, or visualize.
allowed-tools: Bash(npx:ggterm-plot*), Read
---

# Terminal Plotting with ggterm

Create plots using the CLI tool. Supports both built-in datasets and external files.

## Built-in Datasets

ggterm includes datasets that work by name — no CSV files needed:

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |
| `airway` | 500 | gene, baseMean, log2FoldChange, lfcSE, pvalue, padj |
| `lung` | 227 | time, status, age, sex, ph_ecog |

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point
npx ggterm-plot airway log2FoldChange padj gene "DESeq2 Results" volcano
npx ggterm-plot lung time status sex "Lung Survival" kaplan_meier
```

**IMPORTANT**: When the user mentions iris, mtcars, airway, lung, or asks for demo/sample data, use these built-in names directly. Do NOT look for CSV files or generate data.

## Live Plot Viewer

Start the companion viewer for high-resolution interactive plots:

```bash
npx ggterm-plot serve        # default port 4242
npx ggterm-plot serve 8080   # custom port
```

When serve is running, plots auto-display in the browser/Wave panel instead of ASCII art.

## CLI Command

```bash
npx ggterm-plot <data> <x> <y> [color] [title] [geom]
```

Arguments:
- `data` - Built-in dataset name (`iris`, `mtcars`) OR path to CSV/JSON/JSONL file
- `x` - Column name for x-axis
- `y` - Column name for y-axis (use `-` for histogram)
- `color` - Column name for color (optional, use `-` to skip)
- `title` - Plot title (optional, use `-` to skip)
- `geom` - Geometry type: `point` (default), `line`, `histogram`, `boxplot`, `bar`, `violin`, `density`, `area`, etc.

## Inspect & Suggest (for external files)

```bash
npx ggterm-plot inspect <data.csv>
npx ggterm-plot suggest <data.csv>
```

## Examples

Built-in data:
```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot iris petal_length - species "Petal Length" histogram
npx ggterm-plot mtcars mpg hp cyl "MPG vs HP" point
```

External files:
```bash
npx ggterm-plot data.csv x y color "Title" point
npx ggterm-plot data.json date value - "Time Series" line
```

## Workflow

1. If user asks for iris/mtcars/demo data, use built-in dataset names directly
2. For external files: run `inspect` to see columns, then `suggest` for recommendations
3. Run the plot command
4. Briefly describe what the plot shows

$ARGUMENTS

## Geom Selection Guide

| Data Question | Geom | Example |
|---------------|------|---------|
| Relationship between 2 variables | `point` | Scatter plot |
| Trend over time | `line` | Time series |
| Distribution of 1 variable | `histogram` | Frequency distribution |
| Distribution by group | `boxplot` | Compare medians |
| Category comparison | `bar` | Counts per category |
| Smoothed distribution | `density` | Kernel density estimate |
| Density shape | `violin` | Distribution shape |
| Stacked distributions | `ridgeline` | Joy plot |
| Filled region | `area` | Cumulative or stacked |
| Cumulative distribution | `ecdf` | Empirical CDF |
