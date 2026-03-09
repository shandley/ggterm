# ggterm-plot

Terminal plotting with Grammar of Graphics. This is the CLI package for [`@ggterm/core`](https://github.com/shandley/ggterm).

## Quick Start

```bash
npx ggterm-plot setup
```

This installs AI visualization skills, starts the live browser viewer, and creates a welcome plot.

## Usage

```bash
# Plot from a CSV file
npx ggterm-plot data.csv x_col y_col color_col "Title" point

# Built-in datasets
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot airway log2FoldChange padj gene "DESeq2" volcano
npx ggterm-plot lung time status sex "Survival" kaplan_meier

# Other commands
npx ggterm-plot inspect data.csv
npx ggterm-plot suggest data.csv
npx ggterm-plot history
npx ggterm-plot serve
```

See the [full documentation](https://github.com/shandley/ggterm) for 66 geometry types, style presets, and AI integration.
