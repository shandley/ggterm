# ggterm Quick Start Guide

Get up and running with ggterm in 5 minutes.

## Installation

```bash
# Using bun (recommended)
bun add @ggterm/core

# Using npm
npm install @ggterm/core

# Using yarn
yarn add @ggterm/core
```

## Your First Plot

Create a simple scatter plot:

```typescript
import { gg, geom_point } from '@ggterm/core'

// Sample data
const data = [
  { x: 1, y: 4 },
  { x: 2, y: 7 },
  { x: 3, y: 5 },
  { x: 4, y: 9 },
  { x: 5, y: 6 }
]

// Create and render the plot
const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .labs({ title: 'My First Plot' })

console.log(plot.render({ width: 60, height: 15 }))
```

Run it:
```bash
npx tsx my-plot.ts
```

## Adding Layers

Combine multiple geometries:

```typescript
import { gg, geom_point, geom_line } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_line())         // Draw lines first
  .geom(geom_point())        // Points on top
  .labs({
    title: 'Line with Points',
    x: 'Time',
    y: 'Value'
  })

console.log(plot.render({ width: 60, height: 15 }))
```

## Color by Category

Map a variable to color:

```typescript
import { gg, geom_point } from '@ggterm/core'

const data = [
  { x: 1, y: 4, group: 'A' },
  { x: 2, y: 7, group: 'B' },
  { x: 3, y: 5, group: 'A' },
  { x: 4, y: 9, group: 'B' },
  { x: 5, y: 6, group: 'A' }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', color: 'group' })
  .geom(geom_point({ size: 2 }))
  .labs({ title: 'Colored by Group' })

console.log(plot.render({ width: 60, height: 15 }))
```

## Common Plot Types

### Bar Chart

```typescript
import { gg, geom_bar } from '@ggterm/core'

const data = [
  { category: 'A', value: 30 },
  { category: 'B', value: 45 },
  { category: 'C', value: 25 }
]

const plot = gg(data)
  .aes({ x: 'category', y: 'value' })
  .geom(geom_bar({ stat: 'identity' }))
  .labs({ title: 'Sales by Category' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Histogram

```typescript
import { gg, geom_histogram } from '@ggterm/core'

// Generate random data
const data = Array.from({ length: 100 }, () => ({
  value: Math.random() * 100
}))

const plot = gg(data)
  .aes({ x: 'value' })
  .geom(geom_histogram({ bins: 20 }))
  .labs({ title: 'Distribution' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Line Chart

```typescript
import { gg, geom_line } from '@ggterm/core'

const data = [
  { time: 1, value: 10 },
  { time: 2, value: 25 },
  { time: 3, value: 18 },
  { time: 4, value: 35 },
  { time: 5, value: 28 }
]

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .labs({ title: 'Time Series' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Heatmap

```typescript
import { gg, geom_tile, scale_fill_viridis } from '@ggterm/core'

const data = []
for (let x = 0; x < 5; x++) {
  for (let y = 0; y < 5; y++) {
    data.push({ x, y, value: Math.random() })
  }
}

const plot = gg(data)
  .aes({ x: 'x', y: 'y', fill: 'value' })
  .geom(geom_tile())
  .scale(scale_fill_viridis())
  .labs({ title: 'Heatmap' })

console.log(plot.render({ width: 60, height: 15 }))
```

## Customizing Scales

### Axis Limits

```typescript
import { gg, geom_point, scale_x_continuous, scale_y_continuous } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .scale(scale_x_continuous({ limits: [0, 10] }))
  .scale(scale_y_continuous({ limits: [0, 100] }))

console.log(plot.render({ width: 60, height: 15 }))
```

### Log Scale

```typescript
import { gg, geom_point, scale_y_log10 } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .scale(scale_y_log10())

console.log(plot.render({ width: 60, height: 15 }))
```

### Custom Colors

```typescript
import { gg, geom_point, scale_color_manual } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y', color: 'group' })
  .geom(geom_point())
  .scale(scale_color_manual({
    values: {
      'A': '#e41a1c',
      'B': '#377eb8',
      'C': '#4daf4a'
    }
  }))

console.log(plot.render({ width: 60, height: 15 }))
```

## Adding Reference Lines

```typescript
import { gg, geom_point, geom_hline, geom_vline } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_hline({ yintercept: 50, linetype: 'dashed' }))
  .geom(geom_vline({ xintercept: 0, linetype: 'dashed' }))

console.log(plot.render({ width: 60, height: 15 }))
```

## Faceting (Small Multiples)

```typescript
import { gg, geom_point, facet_wrap } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category', { ncol: 2 }))

console.log(plot.render({ width: 80, height: 20 }))
```

## Themes

### Built-in Themes

```typescript
import { gg, geom_point, themeDark, themeMinimal } from '@ggterm/core'

// Dark theme
const plot1 = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .theme(themeDark())

// Minimal theme
const plot2 = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .theme(themeMinimal())
```

## Streaming Data

Real-time updates:

```typescript
import { gg, geom_line, geom_point } from '@ggterm/core'

const data: Array<{ time: number; value: number }> = []
let time = 0

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .geom(geom_point())
  .labs({ title: 'Live Data' })

setInterval(() => {
  // Add new point
  data.push({
    time: time++,
    value: Math.sin(time * 0.1) * 50 + 50 + Math.random() * 10
  })

  // Keep last 50 points
  if (data.length > 50) data.shift()

  // Re-render
  console.clear()
  console.log(plot.render({ width: 80, height: 20 }))
}, 200)
```

## Render Options

```typescript
const output = plot.render({
  width: 80,              // Characters wide
  height: 24,             // Characters tall
  renderer: 'auto',       // 'braille', 'block', 'sixel', 'auto'
  colorMode: 'truecolor'  // 'none', '16', '256', 'truecolor', 'auto'
})
```

## CLI Tool

Plot directly from CSV files without writing code:

```bash
# Basic usage
bun packages/core/src/cli-plot.ts <file> <x> <y> [color] [title] [geom] [facet]

# Scatter plot from CSV
bun packages/core/src/cli-plot.ts data.csv x y

# With color mapping
bun packages/core/src/cli-plot.ts data.csv x y category "Sales by Region"

# Histogram (use '-' to skip color)
bun packages/core/src/cli-plot.ts data.csv value - "Distribution" histogram

# Faceted plot (small multiples)
bun packages/core/src/cli-plot.ts data.csv x y color "Title" point region
```

**Available geoms** (29 types): point, line, path, step, bar, col, histogram, freqpoly, boxplot, violin, area, ribbon, rug, errorbar, errorbarh, crossbar, linerange, pointrange, smooth, segment, rect, raster, tile, text, label, contour, contour_filled, density_2d, qq

## Exporting to HTML

Create interactive, publication-ready visualizations:

```bash
# After creating a plot, export to HTML
bun packages/core/src/cli-plot.ts export output.html

# Export includes:
# - Interactive Vega-Lite chart
# - PNG download button
# - SVG download button
# - Zoom and pan controls
```

The HTML export uses Vega-Lite, so you can further customize it in the Vega Editor.

## Plot History

All plots are automatically saved with provenance metadata:

```bash
# List all historical plots
bun packages/core/src/cli-plot.ts history

# Search history
bun packages/core/src/cli-plot.ts history scatter
bun packages/core/src/cli-plot.ts history sales

# Show a specific plot again
bun packages/core/src/cli-plot.ts show 2024-01-26-001

# Export a historical plot
bun packages/core/src/cli-plot.ts export 2024-01-26-001 output.html
```

## Next Steps

- [Gallery](./GALLERY.md) - See all plot types
- [API Reference](./API.md) - Full documentation
- [Migration from ggplot2](./MIGRATION-GGPLOT2.md) - For R users
- [Migration from Vega-Lite](./MIGRATION-VEGALITE.md) - For Vega-Lite users

## Running Examples

```bash
# Clone the repo
git clone https://github.com/handleylab/ggterm.git
cd ggterm

# Install dependencies
bun install

# Run examples
npx tsx examples/basic.ts
npx tsx examples/streaming-demo.ts
npx tsx examples/extended-grammar-demo.ts
```
