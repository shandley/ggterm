# Migrating from Vega-Lite to ggterm

This guide helps users familiar with Vega-Lite transition to ggterm. While Vega-Lite uses a JSON specification, ggterm uses a fluent TypeScript API inspired by ggplot2.

## Quick Comparison

| Vega-Lite | ggterm |
|-----------|--------|
| JSON specification | TypeScript fluent API |
| `"mark": "point"` | `.geom(geom_point())` |
| `"encoding": { "x": {...} }` | `.aes({ x: 'field' })` |
| Renders to SVG/Canvas | Renders to terminal (ANSI) |
| Declarative JSON | Declarative method chaining |

## Basic Translation

### Vega-Lite
```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": { "values": [...] },
  "mark": "point",
  "encoding": {
    "x": { "field": "x", "type": "quantitative" },
    "y": { "field": "y", "type": "quantitative" },
    "color": { "field": "category", "type": "nominal" }
  }
}
```

### ggterm
```typescript
import { gg, geom_point } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y', color: 'category' })
  .geom(geom_point())

console.log(plot.render({ width: 80, height: 24 }))
```

## Key Differences

### 1. JSON vs Fluent API

Vega-Lite uses a declarative JSON schema:
```json
{
  "mark": "bar",
  "encoding": {
    "x": { "field": "category" },
    "y": { "aggregate": "count" }
  }
}
```

ggterm uses method chaining:
```typescript
gg(data)
  .aes({ x: 'category' })
  .geom(geom_bar())
```

### 2. Type Inference

Vega-Lite requires explicit type declarations:
```json
{ "field": "value", "type": "quantitative" }
{ "field": "name", "type": "nominal" }
{ "field": "date", "type": "temporal" }
```

ggterm infers types automatically:
```typescript
.aes({ x: 'value' })  // Numeric → continuous scale
.aes({ x: 'name' })   // String → discrete scale
```

### 3. Rendering Target

- **Vega-Lite**: Web (SVG, Canvas)
- **ggterm**: Terminal (ANSI escape codes, Braille, Sixel)

### 4. Aggregations

Vega-Lite has built-in aggregation:
```json
{ "y": { "aggregate": "mean", "field": "value" } }
```

ggterm uses statistical transformations:
```typescript
.stat(stat_summary({ fun: 'mean' }))
```

## Mark → Geom Mapping

| Vega-Lite Mark | ggterm Geometry |
|----------------|-----------------|
| `"point"` | `geom_point()` |
| `"line"` | `geom_line()` |
| `"bar"` | `geom_bar()` |
| `"area"` | `geom_area()` |
| `"rect"` | `geom_tile()` or `geom_rect()` |
| `"text"` | `geom_text()` |
| `"rule"` | `geom_hline()` / `geom_vline()` |
| `"boxplot"` | `geom_boxplot()` |
| `"errorbar"` | `geom_errorbar()` |
| `"tick"` | `geom_point()` with shape |

## Encoding → Aesthetics Mapping

| Vega-Lite Encoding | ggterm Aesthetic |
|-------------------|------------------|
| `"x"` | `x` |
| `"y"` | `y` |
| `"color"` | `color` |
| `"fill"` | `fill` |
| `"size"` | `size` |
| `"shape"` | `shape` |
| `"opacity"` | `alpha` |
| `"text"` | `label` |
| `"detail"` | `group` |
| `"row"` | `facet_grid({ rows: ... })` |
| `"column"` | `facet_grid({ cols: ... })` |

## Scale Translation

### Quantitative Scale

**Vega-Lite:**
```json
{
  "x": {
    "field": "value",
    "type": "quantitative",
    "scale": { "domain": [0, 100] }
  }
}
```

**ggterm:**
```typescript
.aes({ x: 'value' })
.scale(scale_x_continuous({ limits: [0, 100] }))
```

### Log Scale

**Vega-Lite:**
```json
{
  "x": {
    "field": "value",
    "type": "quantitative",
    "scale": { "type": "log" }
  }
}
```

**ggterm:**
```typescript
.aes({ x: 'value' })
.scale(scale_x_log10())
```

### Color Scale

**Vega-Lite:**
```json
{
  "color": {
    "field": "category",
    "type": "nominal",
    "scale": { "scheme": "category10" }
  }
}
```

**ggterm:**
```typescript
.aes({ color: 'category' })
.scale(scale_color_discrete())
```

### Viridis Color Scale

**Vega-Lite:**
```json
{
  "color": {
    "field": "value",
    "type": "quantitative",
    "scale": { "scheme": "viridis" }
  }
}
```

**ggterm:**
```typescript
.aes({ color: 'value' })
.scale(scale_color_viridis())
```

## Transform → Stat Mapping

| Vega-Lite Transform | ggterm |
|--------------------|--------|
| `"aggregate"` | `stat_summary()` |
| `"bin"` | `stat_bin()` or `geom_histogram()` |
| `"density"` | `stat_density()` |
| `"regression"` | `stat_smooth({ method: 'lm' })` |
| `"loess"` | `stat_smooth({ method: 'loess' })` |
| `"boxplot"` | `stat_boxplot()` |

### Binning Example

**Vega-Lite:**
```json
{
  "mark": "bar",
  "encoding": {
    "x": { "bin": true, "field": "value" },
    "y": { "aggregate": "count" }
  }
}
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'value' })
  .geom(geom_histogram({ bins: 30 }))
```

### Aggregation Example

**Vega-Lite:**
```json
{
  "mark": "bar",
  "encoding": {
    "x": { "field": "category", "type": "nominal" },
    "y": { "aggregate": "mean", "field": "value" }
  }
}
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'category', y: 'value' })
  .stat(stat_summary({ fun: 'mean' }))
  .geom(geom_bar({ stat: 'identity' }))
```

## Faceting

### Column Facet

**Vega-Lite:**
```json
{
  "facet": { "column": { "field": "category" } },
  "spec": {
    "mark": "point",
    "encoding": { ... }
  }
}
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category'))
```

### Row and Column Facet

**Vega-Lite:**
```json
{
  "facet": {
    "row": { "field": "var1" },
    "column": { "field": "var2" }
  },
  "spec": { ... }
}
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_grid({ rows: 'var1', cols: 'var2' }))
```

## Layer Composition

### Vega-Lite Layering

**Vega-Lite:**
```json
{
  "layer": [
    {
      "mark": "point",
      "encoding": { "x": {...}, "y": {...} }
    },
    {
      "mark": "line",
      "encoding": { "x": {...}, "y": {...} }
    }
  ]
}
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_line())
```

## Selection → Interactivity

Vega-Lite has built-in selection:
```json
{
  "selection": {
    "brush": { "type": "interval" }
  }
}
```

ggterm interactivity is handled via OpenTUI:
```typescript
<GGTerm
  data={data}
  aes={{ x: 'x', y: 'y' }}
  geoms={[geom_point()]}
  onClick={(point) => handleSelect(point)}
  onHover={(point) => showTooltip(point)}
/>
```

## Complete Examples

### Scatter Plot with Regression Line

**Vega-Lite:**
```json
{
  "layer": [
    {
      "mark": "point",
      "encoding": {
        "x": { "field": "x", "type": "quantitative" },
        "y": { "field": "y", "type": "quantitative" }
      }
    },
    {
      "mark": "line",
      "transform": [{ "regression": "y", "on": "x" }],
      "encoding": {
        "x": { "field": "x", "type": "quantitative" },
        "y": { "field": "y", "type": "quantitative" }
      }
    }
  ]
}
```

**ggterm:**
```typescript
import { gg, geom_point, stat_smooth } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .stat(stat_smooth({ method: 'lm' }))
  .geom(geom_line())
```

### Heatmap

**Vega-Lite:**
```json
{
  "mark": "rect",
  "encoding": {
    "x": { "field": "x", "type": "ordinal" },
    "y": { "field": "y", "type": "ordinal" },
    "color": { "field": "value", "type": "quantitative" }
  }
}
```

**ggterm:**
```typescript
import { gg, geom_tile, scale_fill_viridis } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', fill: 'value' })
  .geom(geom_tile())
  .scale(scale_fill_viridis())
```

### Grouped Bar Chart

**Vega-Lite:**
```json
{
  "mark": "bar",
  "encoding": {
    "x": { "field": "category", "type": "nominal" },
    "y": { "field": "value", "type": "quantitative" },
    "color": { "field": "group", "type": "nominal" },
    "xOffset": { "field": "group" }
  }
}
```

**ggterm:**
```typescript
import { gg, geom_bar, scale_fill_discrete } from '@ggterm/core'

gg(data)
  .aes({ x: 'category', y: 'value', fill: 'group' })
  .geom(geom_bar({ stat: 'identity', position: 'dodge' }))
```

### Time Series with Confidence Band

**Vega-Lite:**
```json
{
  "layer": [
    {
      "mark": "area",
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "lower", "type": "quantitative" },
        "y2": { "field": "upper" },
        "opacity": { "value": 0.3 }
      }
    },
    {
      "mark": "line",
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "value", "type": "quantitative" }
      }
    }
  ]
}
```

**ggterm:**
```typescript
import { gg, geom_ribbon, geom_line, scale_x_datetime } from '@ggterm/core'

gg(data)
  .aes({ x: 'date', y: 'value', ymin: 'lower', ymax: 'upper' })
  .geom(geom_ribbon({ alpha: 0.3 }))
  .geom(geom_line())
  .scale(scale_x_datetime())
```

## Tips for Vega-Lite Users

1. **Method Chaining**: Get comfortable with the fluent API pattern. Each method returns `this`, allowing chaining.

2. **Implicit Type Detection**: ggterm infers scales from data types - you rarely need to specify `"type": "quantitative"`.

3. **Terminal Limitations**:
   - Resolution is limited by character grid
   - Tooltips require OpenTUI integration
   - No SVG export (terminal-only output)

4. **Streaming Data**: ggterm excels at real-time updates:
   ```typescript
   const plot = gg([]).aes({ x: 'time', y: 'value' }).geom(geom_line())

   stream.on('data', (point) => {
     plot.push(point)
     console.log(plot.render({ width: 80, height: 24 }))
   })
   ```

5. **TypeScript Benefits**: Full type checking and IDE autocompletion help catch errors early.

## Vega-Lite Features Not in ggterm

| Feature | Alternative |
|---------|-------------|
| Geographic maps | Not supported |
| Tooltips (HTML) | OpenTUI integration |
| SVG/PNG export | Terminal output only |
| Interactive selections | OpenTUI events |
| Conditional encoding | Use data transformation |
| Repeat/concat | Use faceting |

## See Also

- [Geometry Reference](./GEOM-REFERENCE.md) - All 68 plot types
- [API Reference](./API.md) - Complete API documentation
- [Migration from ggplot2](./MIGRATION-GGPLOT2.md) - For R/ggplot2 users
