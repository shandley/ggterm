---
name: data-load
description: Load data from files (CSV, JSON, JSONL) or use built-in datasets for visualization with ggterm. Use when reading datasets, importing data, opening files, or when the user mentions loading, reading, or opening data.
allowed-tools: Bash(npx:*), Read, Write
---

# Data Loading for ggterm

Load and inspect data for use with ggterm plotting.

## Built-in Datasets (No files needed!)

ggterm includes built-in datasets that can be used directly by name:

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot mtcars mpg hp cyl "Motor Trend Cars" point
```

**IMPORTANT**: When the user asks about iris, mtcars, or bundled/built-in datasets, use these names directly. Do NOT generate CSV files or install Python packages.

## Loading External Files

The CLI handles CSV, JSON, and JSONL files directly — no programmatic loading needed:

```bash
# Inspect file structure and column types
npx ggterm-plot inspect data.csv

# Get plot suggestions based on column types
npx ggterm-plot suggest data.csv

# Plot directly from file
npx ggterm-plot data.csv x_column y_column color_column "Title" point
npx ggterm-plot data.json date value - "Time Series" line
npx ggterm-plot data.jsonl score group - "Scores" boxplot
```

### Supported Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | `.csv` | Auto-detects headers, converts numeric columns |
| JSON | `.json` | Expects array of objects |
| JSONL | `.jsonl` | One JSON object per line |

## Workflow

1. **Built-in data**: Use dataset name directly → `npx ggterm-plot iris ...`
2. **External file**: Run `inspect` to see columns → run `suggest` for recommendations → plot
3. **Unknown structure**: Use `inspect` first to understand the data before plotting

## Common Type Issues

| Problem | What to do |
|---------|------------|
| Dates as strings | The CLI auto-detects ISO date formats |
| Numbers as strings | The CLI auto-converts numeric-looking columns |
| Missing values | NA/null values are handled automatically |
| TSV files | Rename to `.csv` or convert — CLI expects comma-separated |

## Programmatic API (Advanced)

For TypeScript scripts that need to load data programmatically:

### CSV

```typescript
import { csvParse, autoType } from 'd3-dsv'
import { readFileSync } from 'fs'

const data = csvParse(readFileSync('data.csv', 'utf-8'), autoType)
```

### JSON / JSONL

```typescript
import { readFileSync } from 'fs'

// JSON array
const data = JSON.parse(readFileSync('data.json', 'utf-8'))

// JSONL
const data = readFileSync('data.jsonl', 'utf-8')
  .trim()
  .split('\n')
  .map(line => JSON.parse(line))
```

### Integration with ggterm API

```typescript
import { gg, geom_point } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_point())

console.log(plot.render({ width: 80, height: 24 }))
```

$ARGUMENTS
