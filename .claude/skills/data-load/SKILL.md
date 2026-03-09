---
name: data-load
description: Load data from files (CSV, JSON, JSONL, Parquet) or stdin for analysis and visualization with ggterm. Use when reading datasets, importing data, opening files, or when the user mentions loading, reading, or opening data.
allowed-tools: Bash(npx:*), Read, Write
---

# Data Loading for ggterm

Load data into arrays of records for use with ggterm plotting and analysis.

## Built-in Datasets (No files needed!)

ggterm includes built-in datasets that can be used directly by name:

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |
| `airway` | 500 | gene, baseMean, log2FoldChange, lfcSE, pvalue, padj |
| `lung` | 227 | time, status, age, sex, ph_ecog |

Use them directly in plot commands:

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot mtcars mpg hp cyl "Motor Trend Cars" point
npx ggterm-plot airway log2FoldChange padj gene "DESeq2 Results" volcano
npx ggterm-plot lung time status sex "Lung Survival" kaplan_meier
```

**IMPORTANT**: When the user asks about iris, mtcars, airway, lung, or bundled/built-in datasets, use these names directly with `npx ggterm-plot`. Do NOT try to generate CSV files or install Python packages.

## External Files

```bash
npx ggterm-plot data.csv x_column y_column color_column "Title" point
npx ggterm-plot data.json x_column y_column
npx ggterm-plot data.jsonl x_column y_column
```

## Verification

Inspect any data file to see columns and types:

```bash
npx ggterm-plot inspect data.csv
```

$ARGUMENTS
