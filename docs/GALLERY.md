# ggterm Plot Gallery

A visual guide to all plot types available in ggterm.

## Table of Contents

- [Scatter Plots](#scatter-plots)
- [Line Charts](#line-charts)
- [Bar Charts](#bar-charts)
- [Histograms](#histograms)
- [Frequency Polygons](#frequency-polygons)
- [Q-Q Plots](#q-q-plots)
- [Area Charts](#area-charts)
- [Box Plots](#box-plots)
- [Ridgeline Plots](#ridgeline-plots)
- [Beeswarm Plots](#beeswarm-plots)
- [Dumbbell Charts](#dumbbell-charts)
- [Lollipop Charts](#lollipop-charts)
- [Waffle Charts](#waffle-charts)
- [Sparklines](#sparklines)
- [Bullet Charts](#bullet-charts)
- [Braille Plots](#braille-plots)
- [2D Density Plots](#2d-density-plots)
- [Heatmaps](#heatmaps)
- [Error Bars](#error-bars)
- [Faceted Plots](#faceted-plots)
- [Annotated Plots](#annotated-plots)
- [Streaming Plots](#streaming-plots)

---

## Scatter Plots

Basic scatter plots for visualizing relationships between two continuous variables.

### Basic Scatter Plot

```typescript
import { gg, geom_point } from '@ggterm/core'

const data = [
  { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 3 },
  { x: 4, y: 7 }, { x: 5, y: 5 }, { x: 6, y: 8 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .labs({ title: 'Basic Scatter Plot' })

console.log(plot.render({ width: 60, height: 15 }))
```

**Output:**
```
                    Basic Scatter Plot

    8 ┤····································●··············
      │··················································
    6 ┤···················●······························
      │····························●······················
    4 ┤·········●·········································
      │··················································
    2 ┤·●·····················································
      └┬─────────┬─────────┬─────────┬─────────┬─────────┬
       1         2         3         4         5         6
```

### Colored Scatter Plot

```typescript
import { gg, geom_point, scale_color_discrete } from '@ggterm/core'

const data = [
  { x: 1, y: 2, group: 'A' }, { x: 2, y: 4, group: 'B' },
  { x: 3, y: 3, group: 'A' }, { x: 4, y: 7, group: 'B' },
  { x: 5, y: 5, group: 'A' }, { x: 6, y: 8, group: 'B' }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', color: 'group' })
  .geom(geom_point({ size: 2 }))
  .labs({ title: 'Scatter by Group' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Bubble Chart (Size Mapping)

```typescript
import { gg, geom_point, scale_size_continuous } from '@ggterm/core'

const data = [
  { x: 10, y: 20, value: 100 },
  { x: 30, y: 40, value: 250 },
  { x: 50, y: 30, value: 50 },
  { x: 70, y: 60, value: 400 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', size: 'value' })
  .geom(geom_point())
  .scale(scale_size_continuous({ range: [1, 4] }))
  .labs({ title: 'Bubble Chart' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Line Charts

Connect data points to show trends over time or ordered categories.

### Basic Line Chart

```typescript
import { gg, geom_line } from '@ggterm/core'

const data = [
  { time: 1, value: 10 }, { time: 2, value: 25 },
  { time: 3, value: 18 }, { time: 4, value: 35 },
  { time: 5, value: 28 }, { time: 6, value: 42 }
]

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .labs({ title: 'Time Series', x: 'Time', y: 'Value' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Multi-Series Line Chart

```typescript
import { gg, geom_line, scale_color_discrete } from '@ggterm/core'

const data = [
  { time: 1, value: 10, series: 'A' }, { time: 1, value: 15, series: 'B' },
  { time: 2, value: 25, series: 'A' }, { time: 2, value: 20, series: 'B' },
  { time: 3, value: 18, series: 'A' }, { time: 3, value: 30, series: 'B' },
  { time: 4, value: 35, series: 'A' }, { time: 4, value: 28, series: 'B' }
]

const plot = gg(data)
  .aes({ x: 'time', y: 'value', color: 'series', group: 'series' })
  .geom(geom_line())
  .labs({ title: 'Multi-Series' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Line with Points

```typescript
import { gg, geom_line, geom_point } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .geom(geom_point({ size: 2 }))
  .labs({ title: 'Line with Points' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Bar Charts

Display categorical data with rectangular bars.

### Vertical Bar Chart

```typescript
import { gg, geom_bar } from '@ggterm/core'

const data = [
  { category: 'A', value: 25 },
  { category: 'B', value: 40 },
  { category: 'C', value: 30 },
  { category: 'D', value: 55 }
]

const plot = gg(data)
  .aes({ x: 'category', y: 'value' })
  .geom(geom_bar({ stat: 'identity' }))
  .labs({ title: 'Bar Chart' })

console.log(plot.render({ width: 60, height: 15 }))
```

**Output:**
```
                        Bar Chart

    55 ┤·······························████████████████···
       │·······························█              █···
    45 ┤·······························█              █···
       │···············████████████████               █···
    35 ┤···············█              █               █···
       │···············█              █   ████████████████
    25 ┤████████████████              █   █
       └┬──────────────┬──────────────┬───────────────┬───
        A              B              C               D
```

### Horizontal Bar Chart

```typescript
import { gg, geom_bar, coordFlip } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'category', y: 'value' })
  .geom(geom_bar({ stat: 'identity' }))
  .coord(coordFlip())
  .labs({ title: 'Horizontal Bars' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Grouped Bar Chart

```typescript
import { gg, geom_bar, scale_fill_discrete } from '@ggterm/core'

const data = [
  { category: 'Q1', value: 100, year: '2023' },
  { category: 'Q1', value: 120, year: '2024' },
  { category: 'Q2', value: 150, year: '2023' },
  { category: 'Q2', value: 180, year: '2024' }
]

const plot = gg(data)
  .aes({ x: 'category', y: 'value', fill: 'year' })
  .geom(geom_bar({ stat: 'identity', position: 'dodge' }))
  .labs({ title: 'Grouped Bars' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Histograms

Show the distribution of a continuous variable.

### Basic Histogram

```typescript
import { gg, geom_histogram } from '@ggterm/core'

// Generate sample data
const data = Array.from({ length: 100 }, () => ({
  value: Math.random() * 100
}))

const plot = gg(data)
  .aes({ x: 'value' })
  .geom(geom_histogram({ bins: 20 }))
  .labs({ title: 'Distribution', x: 'Value', y: 'Count' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Overlapping Histograms

```typescript
import { gg, geom_histogram, scale_fill_discrete } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'value', fill: 'group' })
  .geom(geom_histogram({ bins: 15, alpha: 0.5, position: 'identity' }))
  .labs({ title: 'Overlapping Distributions' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Frequency Polygons

Line-based alternative to histograms, ideal for comparing multiple distributions.

### Basic Frequency Polygon

```typescript
import { gg, geom_freqpoly } from '@ggterm/core'

const data = Array.from({ length: 100 }, () => ({
  value: Math.random() * 100
}))

const plot = gg(data)
  .aes({ x: 'value' })
  .geom(geom_freqpoly({ bins: 20 }))
  .labs({ title: 'Frequency Polygon', x: 'Value', y: 'Count' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Comparing Distributions

```typescript
import { gg, geom_freqpoly } from '@ggterm/core'

const data = [
  ...Array.from({ length: 50 }, () => ({ value: Math.random() * 50, group: 'A' })),
  ...Array.from({ length: 50 }, () => ({ value: Math.random() * 50 + 25, group: 'B' })),
]

const plot = gg(data)
  .aes({ x: 'value', color: 'group' })
  .geom(geom_freqpoly({ bins: 15 }))
  .labs({ title: 'Distribution Comparison' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Q-Q Plots

Quantile-quantile plots for assessing whether data follows a theoretical distribution.

### Basic Q-Q Plot

```typescript
import { gg, geom_qq, geom_qq_line } from '@ggterm/core'

// Generate sample data
const data = Array.from({ length: 50 }, () => ({
  value: (Math.random() + Math.random() + Math.random() - 1.5) * 2
}))

const plot = gg(data)
  .aes({ x: 'value', y: 'value' })
  .geom(geom_qq())
  .geom(geom_qq_line())
  .labs({
    title: 'Q-Q Plot',
    x: 'Theoretical Quantiles',
    y: 'Sample Quantiles'
  })

console.log(plot.render({ width: 60, height: 15 }))
```

**Interpretation**: Points falling along the diagonal line indicate normality. Deviations suggest non-normal distributions:
- S-shaped curve: heavy or light tails
- Curved away at ends: skewness
- Steps: discrete or rounded data

### Q-Q Plot via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv value - - "Normality Check" qq
```

---

## Area Charts

Filled areas under lines, useful for showing volume or cumulative data.

### Basic Area Chart

```typescript
import { gg, geom_area } from '@ggterm/core'

const data = [
  { time: 1, value: 10 }, { time: 2, value: 25 },
  { time: 3, value: 18 }, { time: 4, value: 35 },
  { time: 5, value: 28 }, { time: 6, value: 42 }
]

const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_area({ alpha: 0.7 }))
  .labs({ title: 'Area Chart' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Stacked Area Chart

```typescript
import { gg, geom_area, scale_fill_discrete } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'time', y: 'value', fill: 'series' })
  .geom(geom_area({ position: 'stack' }))
  .labs({ title: 'Stacked Areas' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Ribbon (Confidence Band)

```typescript
import { gg, geom_line, geom_ribbon } from '@ggterm/core'

const data = [
  { x: 1, y: 10, ymin: 8, ymax: 12 },
  { x: 2, y: 15, ymin: 12, ymax: 18 },
  { x: 3, y: 13, ymin: 10, ymax: 16 },
  { x: 4, y: 20, ymin: 16, ymax: 24 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', ymin: 'ymin', ymax: 'ymax' })
  .geom(geom_ribbon({ alpha: 0.3 }))
  .geom(geom_line())
  .labs({ title: 'Line with Confidence Band' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Box Plots

Show distribution summary statistics.

### Basic Box Plot

```typescript
import { gg, geom_boxplot } from '@ggterm/core'

const data = [
  { group: 'A', value: 10 }, { group: 'A', value: 15 },
  { group: 'A', value: 12 }, { group: 'A', value: 18 },
  { group: 'B', value: 20 }, { group: 'B', value: 25 },
  { group: 'B', value: 22 }, { group: 'B', value: 30 }
]

const plot = gg(data)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_boxplot())
  .labs({ title: 'Box Plot Comparison' })

console.log(plot.render({ width: 60, height: 15 }))
```

**Output:**
```
                    Box Plot Comparison

    30 ┤·····················────┬────························
       │·····················│  │  │·························
    25 ┤·····················├──┼──┤·························
       │·····················│  │  │·························
    20 ┤·····················────┴────························
       │·····························────┬────················
    15 ┤·········────┬────···············│  │  │··············
       │·········│  │  │·················├──┼──┤··············
    10 ┤·········────┴────···············────┴────············
       └┬────────────────────────┬────────────────────────┬───
        A                        B
```

---

## Density Plots

Density plots show a smoothed estimate of the distribution of a continuous variable. They're the continuous analog of histograms and are useful for comparing distributions.

### Basic Density Plot

```typescript
import { gg, geom_density } from '@ggterm/core'

const data = [
  { value: 1.2 }, { value: 2.3 }, { value: 2.5 }, { value: 3.1 },
  { value: 3.4 }, { value: 3.5 }, { value: 3.8 }, { value: 4.2 },
  { value: 4.5 }, { value: 5.1 }, { value: 5.8 }, { value: 6.2 },
]

gg(data)
  .aes({ x: 'value' })
  .geom(geom_density())
  .labs({ title: 'Value Distribution', x: 'Value', y: 'Density' })
```

### Comparing Distributions

```typescript
import { gg, geom_density } from '@ggterm/core'

const data = [
  { score: 72, group: 'Control' }, { score: 78, group: 'Control' },
  { score: 85, group: 'Treatment' }, { score: 88, group: 'Treatment' },
  // ... more data
]

gg(data)
  .aes({ x: 'score', color: 'group', fill: 'group' })
  .geom(geom_density({ alpha: 0.3 }))
  .labs({ title: 'Score Distribution by Group' })
```

### Density via CLI

```bash
# Basic density plot
bun packages/core/src/cli-plot.ts data.csv value - - "Distribution" density

# Grouped density
bun packages/core/src/cli-plot.ts data.csv score - group "Scores by Group" density
```

---

## Ridgeline Plots

Ridgeline plots (also called joy plots) display multiple distribution curves stacked vertically. Perfect for comparing distributions across categories like time periods or groups.

### Basic Ridgeline Plot

```typescript
import { gg, geom_ridgeline } from '@ggterm/core'

const data = [
  { month: 'Jan', temp: 32 }, { month: 'Jan', temp: 35 }, { month: 'Jan', temp: 28 },
  { month: 'Feb', temp: 38 }, { month: 'Feb', temp: 42 }, { month: 'Feb', temp: 35 },
  { month: 'Mar', temp: 48 }, { month: 'Mar', temp: 52 }, { month: 'Mar', temp: 45 },
  // ... more data points per month
]

const plot = gg(data)
  .aes({ x: 'temp', y: 'month' })
  .geom(geom_ridgeline())
  .labs({ title: 'Monthly Temperature Distribution' })

console.log(plot.render({ width: 60, height: 20 }))
```

**Output:**
```
              Monthly Temperature Distribution

  Mar │          ▄▄████████▄▄
      │        ▄██████████████▄
  Feb │      ▄████████████▄▄
      │    ▄████████████████▄
  Jan │  ▄▄██████████▄▄
      │  ████████████████▄
      └──────────────────────────────────────────────
         25    30    35    40    45    50    55
                       temp
```

### Customized Ridgeline

```typescript
import { gg, geom_ridgeline, scale_fill_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'temp', y: 'month', fill: 'month' })
  .geom(geom_ridgeline({
    scale: 1.5,     // More overlap between ridges
    alpha: 0.7,     // Semi-transparent
    outline: true   // Show outlines
  }))
  .scale(scale_fill_viridis())
  .labs({ title: 'Temperature Distributions' })

console.log(plot.render({ width: 60, height: 20 }))
```

### Joy Plot Alias

```typescript
import { gg, geom_joy } from '@ggterm/core'

// geom_joy is an alias for geom_ridgeline
const plot = gg(data)
  .aes({ x: 'value', y: 'category' })
  .geom(geom_joy())
  .labs({ title: 'Joy Plot' })

console.log(plot.render({ width: 60, height: 20 }))
```

### Ridgeline via CLI

```bash
# Basic ridgeline plot
bun packages/core/src/cli-plot.ts temps.csv temp month - "Monthly Temps" ridgeline

# Using joy alias
bun packages/core/src/cli-plot.ts data.csv value group - "Distributions" joy
```

### When to Use Ridgeline Plots

- **Time series distributions**: How distributions change over time (months, years)
- **Group comparisons**: Comparing density shapes across categories
- **Before/after analysis**: Showing distribution shifts
- **Seasonal patterns**: Visualizing cyclic distribution changes

---

## Beeswarm Plots

Beeswarm plots show individual data points arranged to avoid overlap. Perfect for small-to-medium datasets where you want to see every point while also understanding the distribution.

### Basic Beeswarm Plot

```typescript
import { gg, geom_beeswarm } from '@ggterm/core'

const data = [
  { group: 'Control', value: 23 }, { group: 'Control', value: 25 },
  { group: 'Control', value: 22 }, { group: 'Control', value: 27 },
  { group: 'Treatment', value: 32 }, { group: 'Treatment', value: 35 },
  { group: 'Treatment', value: 30 }, { group: 'Treatment', value: 38 },
  // ... more data points
]

const plot = gg(data)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_beeswarm())
  .labs({ title: 'Treatment Response' })

console.log(plot.render({ width: 60, height: 20 }))
```

**Output:**
```
                    Treatment Response

    40 ┤
       │              ●
       │              ●
       │              ●
    30 ┤              ●
       │     ●
       │     ●        ●
       │     ●        ●
    20 ┤     ●
       └─────────────────────────────────
           Control    Treatment
```

### Customized Beeswarm

```typescript
import { gg, geom_beeswarm } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'group', y: 'value', color: 'group' })
  .geom(geom_beeswarm({
    method: 'swarm',   // Compact arrangement
    size: 2,           // Larger points
    alpha: 0.8         // Slight transparency
  }))
  .labs({ title: 'Grouped Comparison' })

console.log(plot.render({ width: 60, height: 20 }))
```

### Quasirandom Alias

```typescript
import { gg, geom_quasirandom } from '@ggterm/core'

// geom_quasirandom uses the 'center' method
const plot = gg(data)
  .aes({ x: 'category', y: 'measurement' })
  .geom(geom_quasirandom())
  .labs({ title: 'Quasirandom Plot' })

console.log(plot.render({ width: 60, height: 20 }))
```

### Beeswarm via CLI

```bash
# Basic beeswarm plot
bun packages/core/src/cli-plot.ts data.csv group value - "Group Comparison" beeswarm

# Using quasirandom alias
bun packages/core/src/cli-plot.ts data.csv treatment response - "Responses" quasirandom
```

### When to Use Beeswarm Plots

- **Small datasets**: When you have <100 points per group
- **Individual points matter**: When outliers or specific values are important
- **Distribution + detail**: Show both overall pattern and individual observations
- **Comparing groups**: Side-by-side categorical comparisons

### Beeswarm vs Other Distribution Plots

| Plot Type | Best For |
|-----------|----------|
| Beeswarm | Small datasets, individual points visible |
| Violin | Large datasets, smooth distribution shape |
| Boxplot | Summary statistics, outlier detection |
| Ridgeline | Comparing many distributions over time |

---

## Dumbbell Charts

Dumbbell charts display two points connected by a line. Ideal for before/after comparisons, paired data, or showing ranges between two values.

### Basic Dumbbell

```typescript
import { gg, geom_dumbbell } from '@ggterm/core'

const data = [
  { category: 'Product A', before: 45, xend: 72 },
  { category: 'Product B', before: 38, xend: 58 },
  { category: 'Product C', before: 55, xend: 48 },
  { category: 'Product D', before: 29, xend: 67 },
]

const plot = gg(data)
  .aes({ x: 'before', y: 'category' })
  .geom(geom_dumbbell())
  .labs({ title: 'Before vs After', x: 'Value', y: 'Category' })

console.log(plot.render({ width: 60, height: 12 }))
```

**Output:**
```
                    Before vs After

  Product D │    ●───────────────────────────────●
  Product C │                     ●────────●
  Product B │         ●───────────────────●
  Product A │              ●────────────────────●
            └┬──────────┬──────────┬──────────┬──
             25         40         55         75
                           Value
```

### Customized Dumbbell

```typescript
const plot = gg(data)
  .aes({ x: 'before', y: 'category' })
  .geom(geom_dumbbell({
    color: '#3498db',      // Start point color
    colorEnd: '#e74c3c',   // End point color
    lineColor: '#95a5a6',  // Connecting line color
    size: 3,
    shape: 'diamond'
  }))
  .labs({ title: 'Satisfaction Change' })
```

### Dumbbell via CLI

```bash
# Basic dumbbell (data needs xend column)
bun packages/core/src/cli-plot.ts data.csv start category - "Comparison" dumbbell
```

### When to Use Dumbbell Charts

- **Before/after comparisons**: Show changes between two time points
- **Paired data**: Compare two related measurements
- **Range visualization**: Display min/max or start/end values
- **Gap analysis**: Highlight differences between two values

---

## Lollipop Charts

Lollipop charts show a line from baseline to a point with a dot at the end. A cleaner, more modern alternative to bar charts, especially effective for sparse or ranked data.

### Basic Lollipop

```typescript
import { gg, geom_lollipop } from '@ggterm/core'

const data = [
  { product: 'Apple', sales: 150 },
  { product: 'Banana', sales: 200 },
  { product: 'Cherry', sales: 80 },
  { product: 'Date', sales: 120 },
  { product: 'Elderberry', sales: 50 },
]

const plot = gg(data)
  .aes({ x: 'product', y: 'sales' })
  .geom(geom_lollipop())
  .labs({ title: 'Product Sales', x: 'Product', y: 'Sales ($)' })

console.log(plot.render({ width: 60, height: 15 }))
```

**Output:**
```
                      Product Sales

  200 ┤              ●
      │              │
  150 ┤     ●        │
      │     │        │
  120 ┤     │        │        ●
      │     │        │        │
   80 ┤     │        │        │        ●
      │     │        │        │        │
   50 ┤     │        │        │        │        ●
      │     │        │        │        │        │
    0 ├─────┴────────┴────────┴────────┴────────┴
      Apple   Banana   Cherry    Date  Elderberry
                        Product
```

### Customized Lollipop

```typescript
const plot = gg(data)
  .aes({ x: 'product', y: 'sales' })
  .geom(geom_lollipop({
    color: '#9b59b6',     // Point color
    lineColor: '#8e44ad', // Line color
    size: 3,
    baseline: 100         // Custom baseline
  }))
  .labs({ title: 'Sales vs Target (100)' })
```

### Horizontal Lollipop

```typescript
const plot = gg(data)
  .aes({ x: 'product', y: 'sales' })
  .geom(geom_lollipop({ direction: 'horizontal' }))
  .labs({ title: 'Horizontal Lollipop' })
```

### Lollipop via CLI

```bash
# Basic lollipop
bun packages/core/src/cli-plot.ts data.csv product sales - "Sales" lollipop
```

### When to Use Lollipop Charts

- **Sparse data**: Cleaner than bar charts with few data points
- **Rankings**: Show ordered values with clear endpoints
- **Comparisons**: Emphasize the dot values rather than the bar area
- **Modern design**: More contemporary look than traditional bar charts

### Lollipop vs Bar Chart

| Feature | Lollipop | Bar Chart |
|---------|----------|-----------|
| Visual weight | Light | Heavy |
| Data focus | Endpoint values | Area/magnitude |
| Best for | Sparse data, rankings | Dense data, comparisons |
| Space efficiency | Better | More ink |

---

## Waffle Charts

Waffle charts display part-of-whole relationships using a grid of characters. More readable than pie charts, especially for terminal display.

### Basic Waffle

```typescript
import { gg, geom_waffle } from '@ggterm/core'

const data = [
  { company: 'Apple', share: 45 },
  { company: 'Samsung', share: 30 },
  { company: 'Other', share: 25 },
]

const plot = gg(data)
  .aes({ fill: 'company', y: 'share' })
  .geom(geom_waffle())
  .labs({ title: 'Market Share' })

console.log(plot.render({ width: 50, height: 15 }))
```

**Output:**
```
                Market Share

  ██████████  Apple 45%
  ██████████
  ██████████
  ██████████
  ████▒▒▒▒▒▒  Samsung 30%
  ▒▒▒▒▒▒▒▒▒▒
  ▒▒▒▒▒▒░░░░  Other 25%
  ░░░░░░░░░░
```

### Waffle via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv category value category "Market Share" waffle
```

### When to Use Waffle Charts

- **Part-of-whole**: Showing percentages or proportions
- **Comparisons**: Easy to compare segment sizes
- **Terminal display**: Characters render clearly
- **Pie chart alternative**: More precise than pie slices

---

## Sparklines

Sparklines are word-sized inline graphics that show trends at a glance. Perfect for dashboards and data tables.

### Basic Sparkline

```typescript
import { gg, geom_sparkline, SPARK_BARS } from '@ggterm/core'

const data = [
  { month: 1, value: 10 },
  { month: 2, value: 15 },
  { month: 3, value: 12 },
  { month: 4, value: 20 },
  { month: 5, value: 18 },
  { month: 6, value: 25 },
]

const plot = gg(data)
  .aes({ x: 'month', y: 'value' })
  .geom(geom_sparkline())

console.log(plot.render({ width: 30, height: 3 }))
```

**Output:**
```
▂▄▃▆▅█
```

### Grouped Sparklines

```typescript
const salesData = [
  { month: 1, sales: 100, product: 'A' },
  { month: 2, sales: 120, product: 'A' },
  // ...
  { month: 1, sales: 80, product: 'B' },
  { month: 2, sales: 95, product: 'B' },
  // ...
]

const plot = gg(salesData)
  .aes({ x: 'month', y: 'sales', group: 'product' })
  .geom(geom_sparkline({ show_minmax: true }))
```

### Sparkline via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv month value product "Trends" sparkline
```

### Sparkline Characters

```
▁▂▃▄▅▆▇█  - 8 levels of bar height
```

---

## Bullet Charts

Bullet charts are compact progress bars with target markers. Stephen Few's alternative to gauges and meters.

### Basic Bullet

```typescript
import { gg, geom_bullet } from '@ggterm/core'

const kpiData = [
  { metric: 'Revenue', value: 85, target: 90 },
  { metric: 'Profit', value: 70, target: 80 },
  { metric: 'Growth', value: 95, target: 75 },
]

const plot = gg(kpiData)
  .aes({ x: 'metric', y: 'value' })
  .geom(geom_bullet())
  .labs({ title: 'KPI Dashboard' })

console.log(plot.render({ width: 60, height: 10 }))
```

**Output:**
```
                KPI Dashboard

  Revenue  ████████████████████████████████░░│░░░░  85
  Profit   ███████████████████████████░░░░░░░│░░░░  70
  Growth   █████████████████████████████████████│██  95
```

### Bullet Chart Anatomy

- **Bar**: Actual value (solid fill)
- **Target marker**: `│` indicates target
- **Background ranges**: `░▒▓` show poor/satisfactory/good ranges

### Bullet via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv metric value - "KPIs" bullet
```

---

## Braille Plots

Braille plots use Unicode Braille patterns for 8x resolution. Each character cell contains a 2x4 grid of dots.

### Basic Braille Scatter

```typescript
import { gg, geom_braille } from '@ggterm/core'

const data = Array.from({ length: 50 }, (_, i) => ({
  x: Math.sin(i * 0.2) * 10 + 10,
  y: Math.cos(i * 0.2) * 10 + 10,
}))

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_braille())
  .labs({ title: 'High-Resolution Scatter' })

console.log(plot.render({ width: 50, height: 15 }))
```

### Braille Line Plot

```typescript
const lineData = Array.from({ length: 30 }, (_, i) => ({
  x: i,
  y: Math.sin(i * 0.3) * 5 + 5,
}))

const plot = gg(lineData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_braille({ type: 'line' }))
```

### Braille via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv x y - "High-Res" braille
```

### How Braille Works

Each Braille character encodes 8 dots in a 2x4 grid:
```
⠁⠂  (dots 1,2)
⠄⠈  (dots 3,4)
⠐⠠  (dots 5,6)
⡀⢀  (dots 7,8)
```

This allows sub-character positioning for smoother curves and higher detail.

---

## 2D Density Plots

Visualize the density of points in 2D space using contour lines.

### Basic 2D Density

```typescript
import { gg, geom_density_2d } from '@ggterm/core'

const data = Array.from({ length: 100 }, () => ({
  x: Math.random() * 10,
  y: Math.random() * 10
}))

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_density_2d())
  .labs({ title: '2D Density Plot' })

console.log(plot.render({ width: 60, height: 15 }))
```

**Output:**
```
                      2D Density Plot

   10 ┤·······────────────────────────·······
      │····───────────────────────────────···
    8 ┤··───────────────────────────────────·
      │·─────────────────────────────────────
    6 ┤·─────────────────────────────────────
      │·─────────────────────────────────────
    4 ┤·─────────────────────────────────────
      │··───────────────────────────────────·
    2 ┤····───────────────────────────────···
      │·······────────────────────────·······
    0 ┤
      └┬──────────┬──────────┬──────────┬────
       0          3          6          10
```

### 2D Density with Points

```typescript
import { gg, geom_point, geom_density_2d } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_density_2d({ bins: 5 }))
  .geom(geom_point({ alpha: 0.3 }))
  .labs({ title: 'Density Contours with Points' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Custom Bandwidth

```typescript
import { gg, geom_density_2d } from '@ggterm/core'

// Narrow bandwidth = sharper contours
const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_density_2d({ bandwidth: 0.5 }))
  .labs({ title: 'Sharp Density Contours' })

// Wide bandwidth = smoother contours
const smoothPlot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_density_2d({ bandwidth: 2 }))
  .labs({ title: 'Smooth Density Contours' })
```

### 2D Density via CLI

```bash
bun packages/core/src/cli-plot.ts data.csv x y - "2D Density" density_2d
```

---

## Heatmaps

Display matrix data using color intensity.

### Basic Heatmap

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

### Correlation Matrix

```typescript
import { gg, geom_tile, scale_fill_viridis } from '@ggterm/core'

const variables = ['A', 'B', 'C', 'D']
const data = []

for (let i = 0; i < variables.length; i++) {
  for (let j = 0; j < variables.length; j++) {
    const value = i === j ? 1 : Math.random() * 2 - 1
    data.push({ x: i, y: j, value })
  }
}

const plot = gg(data)
  .aes({ x: 'x', y: 'y', fill: 'value' })
  .geom(geom_tile({ width: 1, height: 1 }))
  .scale(scale_fill_viridis())
  .labs({ title: 'Correlation Matrix' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Error Bars

Show uncertainty in measurements.

### Point with Error Bars

```typescript
import { gg, geom_point, geom_errorbar } from '@ggterm/core'

const data = [
  { x: 1, y: 10, ymin: 8, ymax: 12 },
  { x: 2, y: 15, ymin: 12, ymax: 18 },
  { x: 3, y: 25, ymin: 20, ymax: 30 },
  { x: 4, y: 35, ymin: 28, ymax: 42 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', ymin: 'ymin', ymax: 'ymax' })
  .geom(geom_errorbar({ width: 0.2 }))
  .geom(geom_point({ size: 2 }))
  .labs({ title: 'Measurements with Error' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Horizontal Error Bars

```typescript
import { gg, geom_point, geom_errorbarh } from '@ggterm/core'

const data = [
  { x: 10, y: 1, xmin: 8, xmax: 12 },
  { x: 15, y: 2, xmin: 12, xmax: 18 },
  { x: 25, y: 3, xmin: 20, xmax: 30 }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y', xmin: 'xmin', xmax: 'xmax' })
  .geom(geom_errorbarh({ height: 0.2 }))
  .geom(geom_point({ size: 2 }))
  .labs({ title: 'Horizontal Error Bars' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Faceted Plots

Small multiples for comparing subgroups.

### Facet Wrap

```typescript
import { gg, geom_point, facet_wrap } from '@ggterm/core'

const data = [
  { x: 1, y: 2, category: 'A' }, { x: 2, y: 4, category: 'A' },
  { x: 1, y: 3, category: 'B' }, { x: 2, y: 5, category: 'B' },
  { x: 1, y: 1, category: 'C' }, { x: 2, y: 3, category: 'C' }
]

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category', { ncol: 3 }))
  .labs({ title: 'Faceted by Category' })

console.log(plot.render({ width: 80, height: 20 }))
```

### Facet Grid

```typescript
import { gg, geom_point, facet_grid } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_grid({ rows: 'row_var', cols: 'col_var' }))
  .labs({ title: 'Grid Facets' })

console.log(plot.render({ width: 80, height: 24 }))
```

---

## Specialized Visualizations

Domain-specific visualizations for data science, profiling, and time-based analysis.

### Calendar Heatmap

GitHub-style contribution heatmap showing activity over time.

```typescript
import { gg, geom_calendar } from '@ggterm/core'

// Generate daily commit data
const data = []
const startDate = new Date('2025-01-01')
for (let i = 0; i < 90; i++) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + i)
  data.push({
    date: date.toISOString().split('T')[0],
    commits: Math.floor(Math.random() * 10)
  })
}

const plot = gg(data)
  .aes({ x: 'date', fill: 'commits' })
  .geom(geom_calendar())
  .labs({ title: 'Contribution Activity' })

console.log(plot.render({ width: 80, height: 15 }))
```

### Flame Graph

Performance profiling visualization showing call stack hierarchies.

```typescript
import { gg, geom_flame } from '@ggterm/core'

const stackData = [
  { name: 'main', depth: 0, value: 100, start: 0 },
  { name: 'processRequest', depth: 1, value: 60, start: 0 },
  { name: 'handleResponse', depth: 1, value: 40, start: 60 },
  { name: 'parseJSON', depth: 2, value: 30, start: 0 },
  { name: 'validate', depth: 2, value: 30, start: 30 },
  { name: 'render', depth: 2, value: 25, start: 60 },
]

const plot = gg(stackData)
  .aes({ x: 'name', y: 'depth', fill: 'value' })
  .geom(geom_flame())
  .labs({ title: 'CPU Profile' })

console.log(plot.render({ width: 80, height: 12 }))
```

### Icicle Chart

Top-down version of flame graph (inverted hierarchy).

```typescript
import { gg, geom_icicle } from '@ggterm/core'

const plot = gg(stackData)
  .aes({ x: 'name', y: 'depth', fill: 'value' })
  .geom(geom_icicle({ palette: 'cool' }))
  .labs({ title: 'Call Tree' })

console.log(plot.render({ width: 80, height: 12 }))
```

### Correlation Matrix

Heatmap of pairwise correlations with diverging colors.

```typescript
import { gg, geom_corrmat } from '@ggterm/core'

const corrData = [
  { var1: 'mpg', var2: 'mpg', correlation: 1.0 },
  { var1: 'mpg', var2: 'hp', correlation: -0.78 },
  { var1: 'mpg', var2: 'wt', correlation: -0.87 },
  { var1: 'hp', var2: 'mpg', correlation: -0.78 },
  { var1: 'hp', var2: 'hp', correlation: 1.0 },
  { var1: 'hp', var2: 'wt', correlation: 0.66 },
  { var1: 'wt', var2: 'mpg', correlation: -0.87 },
  { var1: 'wt', var2: 'hp', correlation: 0.66 },
  { var1: 'wt', var2: 'wt', correlation: 1.0 },
]

const plot = gg(corrData)
  .aes({ x: 'var1', y: 'var2', fill: 'correlation' })
  .geom(geom_corrmat())
  .labs({ title: 'Variable Correlations' })

console.log(plot.render({ width: 60, height: 18 }))
```

### Sankey Flow Diagram

Visualize flows between nodes with proportional-width connections.

```typescript
import { gg, geom_sankey } from '@ggterm/core'

const flows = [
  { source: 'Coal', target: 'Electricity', value: 25 },
  { source: 'Gas', target: 'Electricity', value: 20 },
  { source: 'Nuclear', target: 'Electricity', value: 15 },
  { source: 'Coal', target: 'Heat', value: 10 },
  { source: 'Gas', target: 'Heat', value: 15 },
]

const plot = gg(flows)
  .aes({ x: 'source', y: 'target', fill: 'value' })
  .geom(geom_sankey())
  .labs({ title: 'Energy Flow' })

console.log(plot.render({ width: 70, height: 18 }))
```

### Treemap

Hierarchical data as nested rectangles where area represents value.

```typescript
import { gg, geom_treemap } from '@ggterm/core'

const data = [
  { name: 'JavaScript', value: 300 },
  { name: 'Python', value: 250 },
  { name: 'TypeScript', value: 200 },
  { name: 'Rust', value: 150 },
  { name: 'Go', value: 120 },
]

const plot = gg(data)
  .aes({ x: 'name', fill: 'value' })
  .geom(geom_treemap())
  .labs({ title: 'Language Usage' })

console.log(plot.render({ width: 60, height: 18 }))
```

### Via CLI

```bash
# Calendar heatmap
bun packages/core/src/cli-plot.ts activity.csv date value - "Activity" calendar

# Flame graph
bun packages/core/src/cli-plot.ts profile.csv name depth value "CPU Profile" flame

# Correlation matrix
bun packages/core/src/cli-plot.ts correlations.csv var1 var2 correlation "Correlations" corrmat

# Sankey diagram
bun packages/core/src/cli-plot.ts flows.csv source target value "Energy Flow" sankey

# Treemap
bun packages/core/src/cli-plot.ts usage.csv name - value "Usage" treemap

# Volcano plot
bun packages/core/src/cli-plot.ts de_results.csv log2FC pvalue gene "Differential Expression" volcano
```

### Volcano Plot

Differential expression visualization for genomics data.

```typescript
import { gg, geom_volcano } from '@ggterm/core'

const deResults = [
  { gene: 'IL6', log2FC: 4.2, pvalue: 1e-100 },
  { gene: 'TNF', log2FC: 3.1, pvalue: 1e-80 },
  { gene: 'CXCL8', log2FC: 5.5, pvalue: 1e-120 },
  { gene: 'STAT3', log2FC: -2.1, pvalue: 1e-40 },
  { gene: 'SOCS3', log2FC: -1.8, pvalue: 1e-30 },
  { gene: 'GAPDH', log2FC: 0.1, pvalue: 0.8 },
]

const plot = gg(deResults)
  .aes({ x: 'log2FC', y: 'pvalue', label: 'gene' })
  .geom(geom_volcano({
    fc_threshold: 1,
    p_threshold: 0.05,
    n_labels: 5,
  }))
  .labs({ title: 'Differential Gene Expression' })

console.log(plot.render({ width: 80, height: 25 }))
```

---

## Annotated Plots

Add context with text, lines, and shapes.

### Reference Lines

```typescript
import { gg, geom_point, geom_hline, geom_vline } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_hline({ yintercept: 50, linetype: 'dashed', color: 'red' }))
  .geom(geom_vline({ xintercept: 0, linetype: 'dashed', color: 'blue' }))
  .labs({ title: 'Plot with Reference Lines' })

console.log(plot.render({ width: 60, height: 15 }))
```

### Text Annotations

```typescript
import { gg, geom_point, annotate } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(annotate('text', { x: 5, y: 50, label: 'Important!' }))
  .geom(annotate('rect', { xmin: 2, xmax: 4, ymin: 20, ymax: 40, alpha: 0.2 }))
  .labs({ title: 'Annotated Plot' })

console.log(plot.render({ width: 60, height: 15 }))
```

---

## Streaming Plots

Real-time data visualization.

### Live Time Series

```typescript
import { gg, geom_line, geom_point } from '@ggterm/core'

const data = []
const plot = gg(data)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .geom(geom_point())
  .labs({ title: 'Live Data' })

// Simulate streaming
setInterval(() => {
  data.push({
    time: Date.now(),
    value: Math.random() * 100
  })

  // Keep last 50 points
  if (data.length > 50) data.shift()

  console.clear()
  console.log(plot.render({ width: 80, height: 20 }))
}, 200)
```

---

## Running Examples

All examples can be run from the `examples/` directory:

```bash
# Basic examples
npx tsx examples/basic.ts

# Interactive demo
npx tsx examples/interactive-demo.ts

# Streaming demo
npx tsx examples/streaming-demo.ts

# Extended grammar demo (Phase 7 features)
npx tsx examples/extended-grammar-demo.ts

# Dashboard demo
npx tsx examples/dashboard-demo.ts
```

---

## See Also

- [API Reference](./API.md) - Full API documentation
- [Architecture](./ARCHITECTURE.md) - Technical design
- [Migration from ggplot2](./MIGRATION-GGPLOT2.md) - R users guide
- [Migration from Vega-Lite](./MIGRATION-VEGALITE.md) - Vega-Lite users guide
