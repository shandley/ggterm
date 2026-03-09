# ggterm — Grammar of Graphics Visualization

This project uses ggterm (@ggterm/core), a Grammar of Graphics primitive catalog with terminal and Vega-Lite backends.

Every plot is a `PlotSpec` — a declarative specification consumed by two backends: terminal ASCII (instant feedback in the terminal) and Vega-Lite (publication-quality interactive HTML in the browser).

## IMPORTANT: Built-in Datasets

ggterm has built-in datasets that work by name — NO CSV files or Python packages needed:

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point
npx ggterm-plot airway log2FoldChange padj gene "DESeq2 Results" volcano
npx ggterm-plot lung time status sex "Lung Survival" kaplan_meier
```

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |
| `airway` | 500 | gene, baseMean, log2FoldChange, lfcSE, pvalue, padj |
| `lung` | 227 | time, status, age, sex, ph_ecog |

When asked about iris, mtcars, airway, lung, or sample data, use these names directly as the first argument to `npx ggterm-plot`. Do NOT search for CSV files or generate data.

## Plotting Commands

```bash
npx ggterm-plot <data> <x> <y> [color] [title] [geom]
npx ggterm-plot serve              # Start live viewer (port 4242)
npx ggterm-plot inspect <file>     # Show column types
npx ggterm-plot suggest <file>     # Suggest visualizations
npx ggterm-plot history            # List previous plots
npx ggterm-plot export <id> out.html  # Export plot
```

## Geom Types

point, line, histogram, boxplot, bar, violin, density, area, ridgeline, heatmap, scatter, ecdf, smooth, and 50+ more.

## Live Viewer

When `npx ggterm-plot serve` is running, plots auto-display in the browser/Wave panel as high-resolution interactive Vega-Lite visualizations instead of ASCII art.

**Style and customize changes also auto-display.** When you modify `.ggterm/last-plot-vegalite.json` (via /ggterm-style or /ggterm-customize), the viewer updates automatically. Do NOT re-run `npx ggterm-plot` after styling — that would overwrite your changes.

## Data in This Directory

See `.ggterm/data-inventory.md` for a catalog of data files found in this directory, including column types, value ranges, and suggested visualizations. Re-run `npx ggterm-plot init` to update after adding new files.

## Help

- Press `Cmd+K` in the live viewer for the command palette (search geoms, actions, styles)
- Press `?` for the full help panel (tabbed reference)
- Ask Claude: "What can ggterm do?" or use `/ggterm-help`
