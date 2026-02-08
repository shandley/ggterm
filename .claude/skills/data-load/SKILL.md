---
name: data-load
description: Load data from files (CSV, JSON, JSONL, Parquet) or stdin for analysis and visualization with ggterm. Use when reading datasets, importing data, opening files, or when the user mentions loading, reading, or opening data.
allowed-tools: Bash(bun:*), Bash(npx:*), Read, Write
---

# Data Loading for ggterm

Load data into arrays of records for use with ggterm plotting and analysis.

## Built-in Datasets (No files needed!)

ggterm includes built-in datasets that can be used directly by name — no CSV files required:

| Dataset | Rows | Columns |
|---------|------|---------|
| `iris` | 150 | sepal_length, sepal_width, petal_length, petal_width, species |
| `mtcars` | 16 | mpg, cyl, hp, wt, name |

Use them directly in plot commands:

```bash
npx ggterm-plot iris sepal_length sepal_width species "Iris Dataset" point
npx ggterm-plot mtcars mpg hp cyl "Motor Trend Cars" point
```

**IMPORTANT**: When the user asks about iris, mtcars, or bundled/built-in datasets, use these names directly with `npx ggterm-plot`. Do NOT try to generate CSV files or install Python packages.

## Quick Patterns by Format

### CSV

```typescript
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const text = readFileSync('data.csv', 'utf-8')
const data = parse(text, {
  columns: true,        // First row as headers
  cast: true,           // Auto-convert numbers
  skip_empty_lines: true
})
```

**Alternative with d3-dsv** (lighter weight):

```typescript
import { csvParse, autoType } from 'd3-dsv'

const data = csvParse(readFileSync('data.csv', 'utf-8'), autoType)
```

### JSON

```typescript
import { readFileSync } from 'fs'

// JSON array
const data = JSON.parse(readFileSync('data.json', 'utf-8'))
```

### JSONL (Newline-delimited JSON)

```typescript
const data = readFileSync('data.jsonl', 'utf-8')
  .trim()
  .split('\n')
  .map(line => JSON.parse(line))
```

### From stdin (Piped Data)

```typescript
// Bun
const input = await Bun.stdin.text()
const data = JSON.parse(input)

// Node.js
import { stdin } from 'process'
let input = ''
for await (const chunk of stdin) input += chunk
const data = JSON.parse(input)
```

### From URL

```typescript
const response = await fetch('https://example.com/data.json')
const data = await response.json()
```

### TSV (Tab-separated)

```typescript
import { tsvParse, autoType } from 'd3-dsv'

const data = tsvParse(readFileSync('data.tsv', 'utf-8'), autoType)
```

## Type Coercion

ggterm expects numeric values for position aesthetics. Ensure proper typing:

```typescript
const typed = data.map(row => ({
  ...row,
  // Convert date strings to timestamps
  date: new Date(row.date).getTime(),
  // Ensure numeric values
  value: Number(row.value),
  // Handle missing values
  score: row.score != null ? Number(row.score) : null
}))
```

### Common Type Issues

| Problem | Solution |
|---------|----------|
| Dates as strings | `new Date(str).getTime()` |
| Numbers as strings | `Number(str)` or `parseFloat(str)` |
| Empty strings | Check `str !== ''` before converting |
| `"NA"` or `"null"` | Map to `null` explicitly |

## Verification

After loading, always verify the data structure:

```typescript
console.log(`Loaded ${data.length} rows`)
console.log('Columns:', Object.keys(data[0]))
console.log('Sample row:', data[0])

// Check for type issues
const numericCols = ['value', 'count', 'score']
for (const col of numericCols) {
  const nonNumeric = data.filter(r => typeof r[col] !== 'number')
  if (nonNumeric.length > 0) {
    console.warn(`${col}: ${nonNumeric.length} non-numeric values`)
  }
}
```

## Installing Dependencies

If needed, install data loading libraries:

```bash
# For CSV parsing
bun add csv-parse
# or
bun add d3-dsv

# For Parquet (if needed)
bun add parquet-wasm
```

## Integration with ggterm

Once data is loaded, pass directly to ggterm:

```typescript
import { gg, geom_point } from '@ggterm/core'

const data = loadData('measurements.csv')

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_point())

console.log(plot.render({ width: 80, height: 24 }))
```

## Large Files

For large files, consider streaming or sampling:

```typescript
// Sample every Nth row
const sampled = data.filter((_, i) => i % 10 === 0)

// Or take first N rows for exploration
const preview = data.slice(0, 1000)
```
