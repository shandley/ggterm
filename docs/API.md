# ggterm API Reference

## Core Package (`@ggterm/core`)

### gg() - Plot Builder

The main entry point for creating plots.

```typescript
import { gg } from '@ggterm/core'

// Create a plot from data
const plot = gg(data)
  .aes({ x: 'var1', y: 'var2' })
  .geom(geom_point())
```

#### Methods

| Method | Description |
|--------|-------------|
| `gg(data)` | Create a new plot with the given data |
| `.aes(mapping)` | Set aesthetic mappings |
| `.geom(geom)` | Add a geometry layer |
| `.stat(stat)` | Add a statistical transformation |
| `.scale(scale)` | Add or modify a scale |
| `.coord(coord)` | Set the coordinate system |
| `.facet(facet)` | Add faceting |
| `.theme(theme)` | Apply a theme |
| `.labs(labels)` | Set labels (title, x, y, etc.) |
| `.render(options)` | Render to string |
| `.push(data)` | Add streaming data points |

### Aesthetic Mappings

```typescript
interface AestheticMapping {
  x: string           // Required: x-axis variable
  y: string           // Required: y-axis variable
  color?: string      // Point/line color
  fill?: string       // Fill color (bars, areas)
  size?: string       // Point size
  shape?: string      // Point shape
  alpha?: string      // Transparency
  group?: string      // Grouping variable
  label?: string      // Text labels
}
```

---

## Geometries

### geom_point()

Renders data points as scatter plot markers.

```typescript
import { geom_point } from '@ggterm/core'

// Basic scatter plot
gg(data).aes({ x: 'pc1', y: 'pc2' }).geom(geom_point())

// With options
gg(data).aes({ x: 'pc1', y: 'pc2' }).geom(geom_point({
  size: 2,
  shape: 'circle',   // 'circle' | 'square' | 'triangle' | 'cross'
  alpha: 0.8
}))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | number | 1 | Point size multiplier |
| `shape` | string | 'circle' | Point shape |
| `alpha` | number | 1 | Opacity (0-1) |
| `color` | string | null | Fixed color (overrides aes) |

### geom_line()

Connects data points with lines.

```typescript
import { geom_line } from '@ggterm/core'

gg(data).aes({ x: 'time', y: 'value', group: 'series' }).geom(geom_line())

// With options
gg(data).aes({ x: 'time', y: 'value' }).geom(geom_line({
  linewidth: 1,
  linetype: 'solid'   // 'solid' | 'dashed' | 'dotted'
}))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `linewidth` | number | 1 | Line thickness |
| `linetype` | string | 'solid' | Line style |
| `alpha` | number | 1 | Opacity |

### geom_path()

Connects data points in the order they appear in the data (unlike geom_line which sorts by x).

```typescript
import { geom_path } from '@ggterm/core'

gg(data).aes({ x: 'longitude', y: 'latitude' }).geom(geom_path())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `linewidth` | number | 1 | Line thickness |
| `linetype` | string | 'solid' | Line style |
| `alpha` | number | 1 | Opacity |

### geom_step()

Connects data points with step functions (horizontal then vertical).

```typescript
import { geom_step } from '@ggterm/core'

gg(data).aes({ x: 'time', y: 'value' }).geom(geom_step())

// Control step direction
gg(data).aes({ x: 'time', y: 'value' }).geom(geom_step({ direction: 'vh' }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `direction` | string | 'hv' | Step direction: 'hv' (horizontal-vertical) or 'vh' |
| `linewidth` | number | 1 | Line thickness |
| `alpha` | number | 1 | Opacity |

### geom_bar()

Renders vertical bars.

```typescript
import { geom_bar } from '@ggterm/core'

// Count occurrences (stat = 'count')
gg(data).aes({ x: 'category' }).geom(geom_bar())

// Pre-computed heights (stat = 'identity')
gg(data).aes({ x: 'category', y: 'value' }).geom(geom_bar({ stat: 'identity' }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `stat` | string | 'count' | Statistical transformation |
| `width` | number | 0.9 | Bar width (0-1) |
| `position` | string | 'stack' | Position adjustment |

### geom_col()

Renders bars with heights from data (shorthand for `geom_bar({ stat: 'identity' })`).

```typescript
import { geom_col } from '@ggterm/core'

gg(data).aes({ x: 'category', y: 'value' }).geom(geom_col())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 0.9 | Bar width (0-1) |
| `position` | string | 'stack' | Position adjustment |

### geom_histogram()

Renders histogram bars showing distribution of a single variable.

```typescript
import { geom_histogram } from '@ggterm/core'

gg(data).aes({ x: 'value' }).geom(geom_histogram())

// Control bin count
gg(data).aes({ x: 'value' }).geom(geom_histogram({ bins: 30 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bins` | number | 30 | Number of bins |
| `binwidth` | number | null | Width of each bin (overrides bins) |
| `position` | string | 'stack' | Position adjustment |

### geom_freqpoly()

Renders frequency polygons (line-based histograms).

```typescript
import { geom_freqpoly } from '@ggterm/core'

gg(data).aes({ x: 'value', color: 'group' }).geom(geom_freqpoly())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bins` | number | 30 | Number of bins |
| `binwidth` | number | null | Width of each bin |

### geom_area()

Renders filled areas under lines.

```typescript
import { geom_area } from '@ggterm/core'

gg(data).aes({ x: 'time', y: 'value' }).geom(geom_area({
  alpha: 0.5
}))
```

### geom_ribbon()

Renders a filled area between ymin and ymax values.

```typescript
import { geom_ribbon } from '@ggterm/core'

gg(data).aes({ x: 'time', ymin: 'lower', ymax: 'upper' }).geom(geom_ribbon({
  alpha: 0.3
}))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `alpha` | number | 0.5 | Fill opacity |
| `fill` | string | null | Fixed fill color |

### geom_text()

Adds text labels to the plot.

```typescript
import { geom_text } from '@ggterm/core'

gg(data).aes({ x: 'pc1', y: 'pc2', label: 'name' }).geom(geom_text({
  nudge_x: 0.5,
  nudge_y: 0.5
}))
```

### geom_label()

Adds text labels with background rectangles.

```typescript
import { geom_label } from '@ggterm/core'

gg(data).aes({ x: 'x', y: 'y', label: 'name' }).geom(geom_label({
  padding: 0.2
}))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `padding` | number | 0.1 | Padding around text |
| `nudge_x` | number | 0 | Horizontal offset |
| `nudge_y` | number | 0 | Vertical offset |

### geom_hline() / geom_vline()

Adds reference lines.

```typescript
import { geom_hline, geom_vline } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_hline({ yintercept: 0, linetype: 'dashed' }))
  .geom(geom_vline({ xintercept: 0, linetype: 'dashed' }))
```

---

## Statistics

### stat_bin()

Bins continuous data for histograms.

```typescript
import { stat_bin } from '@ggterm/core'

gg(data)
  .aes({ x: 'value' })
  .stat(stat_bin({ bins: 30 }))
  .geom(geom_bar({ stat: 'identity' }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bins` | number | 30 | Number of bins |
| `binwidth` | number | null | Bin width (overrides bins) |
| `center` | number | null | Center of a bin |

### stat_smooth()

Adds smoothed conditional means.

```typescript
import { stat_smooth } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .stat(stat_smooth({ method: 'loess', span: 0.75 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | string | 'loess' | Smoothing method ('loess', 'lm') |
| `span` | number | 0.75 | LOESS span |
| `se` | boolean | true | Show standard error band |

### stat_density()

Computes kernel density estimates.

```typescript
import { stat_density } from '@ggterm/core'

gg(data)
  .aes({ x: 'value' })
  .stat(stat_density({ kernel: 'gaussian' }))
  .geom(geom_area())
```

### stat_density_2d()

Computes 2D kernel density estimates for contour plots.

```typescript
import { stat_density_2d } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .stat(stat_density_2d({ n: 25, h: 1.5 }))
  .geom(geom_contour())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `n` | number | 25 | Grid resolution (n × n points) |
| `nx` | number | n | Grid resolution for x-axis |
| `ny` | number | n | Grid resolution for y-axis |
| `h` | number \| [number, number] | auto | Bandwidth (uses Scott's rule if not specified) |
| `adjust` | number | 1 | Bandwidth adjustment multiplier |

The stat computes a density grid using Gaussian kernel density estimation and Scott's rule for automatic bandwidth selection: `h = n^(-1/6) × σ`.

### stat_summary()

Summarizes data by groups.

```typescript
import { stat_summary } from '@ggterm/core'

gg(data)
  .aes({ x: 'group', y: 'value' })
  .stat(stat_summary({ fun: 'mean', fun.min: 'min', fun.max: 'max' }))
```

---

## Scales

### Position Scales

```typescript
import {
  scale_x_continuous,
  scale_y_continuous,
  scale_x_log10,
  scale_y_log10,
  scale_x_discrete,
  scale_y_discrete
} from '@ggterm/core'

// Set limits and breaks
gg(data).scale(scale_x_continuous({
  limits: [0, 100],
  breaks: [0, 25, 50, 75, 100],
  labels: ['0%', '25%', '50%', '75%', '100%']
}))

// Log scale
gg(data).scale(scale_x_log10())
```

#### Options (Continuous)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limits` | [number, number] | auto | Scale limits |
| `breaks` | number[] | auto | Tick positions |
| `labels` | string[] | auto | Tick labels |
| `trans` | string | 'identity' | Transformation |
| `expand` | [number, number] | [0.05, 0] | Expansion factor |

### Color Scales

```typescript
import {
  scale_color_continuous,
  scale_color_discrete,
  scale_color_viridis,
  scale_color_manual
} from '@ggterm/core'

// Viridis palette (great for colorblind accessibility)
gg(data).scale(scale_color_viridis())

// Manual colors
gg(data).scale(scale_color_manual({
  values: { 'group_a': '#e41a1c', 'group_b': '#377eb8' }
}))

// Built-in palettes
gg(data).scale(scale_color_discrete({ palette: 'Set1' }))
```

#### Available Palettes

**Sequential**: viridis, plasma, inferno, magma, cividis
**Diverging**: RdBu, BrBG, PiYG, PRGn
**Categorical**: category10, Set1, Set2, Set3, Dark2, Paired

---

## Coordinates

```typescript
import { coord_cartesian, coord_flip, coord_polar } from '@ggterm/core'

// Default Cartesian
gg(data).coord(coord_cartesian())

// Flip x and y
gg(data).coord(coord_flip())

// Polar (limited terminal support)
gg(data).coord(coord_polar({ theta: 'x' }))
```

### coord_cartesian()

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `xlim` | [number, number] | null | X-axis limits (zoom only) |
| `ylim` | [number, number] | null | Y-axis limits (zoom only) |
| `clip` | boolean | true | Clip to plot area |

---

## Facets

### facet_wrap()

Creates small multiples wrapped into rows.

```typescript
import { facet_wrap } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category', { ncol: 3 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ncol` | number | auto | Number of columns |
| `nrow` | number | auto | Number of rows |
| `scales` | string | 'fixed' | Scale sharing: 'fixed', 'free', 'free_x', 'free_y' |

### facet_grid()

Creates a grid of facets.

```typescript
import { facet_grid } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_grid({ rows: 'var1', cols: 'var2' }))
```

---

## Themes

### Built-in Themes

```typescript
import { theme_minimal, theme_dark, theme_classic, theme_void } from '@ggterm/core'

gg(data).theme(theme_minimal())
gg(data).theme(theme_dark())
```

### Custom Theme

```typescript
import { theme } from '@ggterm/core'

gg(data).theme(theme({
  panel: {
    background: '#1e1e1e',
    border: 'rounded',
    grid: { major: '#333', minor: null }
  },
  axis: {
    text: { color: '#ccc' },
    ticks: { char: '┼' },
    title: { bold: true }
  },
  legend: {
    position: 'right'
  }
}))
```

### Theme Structure

```typescript
interface Theme {
  panel: {
    background: string
    border: 'none' | 'single' | 'double' | 'rounded'
    grid: { major: string | null, minor: string | null }
  }
  axis: {
    text: { color: string, size: number }
    ticks: { char: string, length: number }
    title: { color: string, bold: boolean }
  }
  legend: {
    position: 'right' | 'bottom' | 'none'
    title: { bold: boolean }
  }
  title: {
    align: 'left' | 'center' | 'right'
    bold: boolean
  }
}
```

---

## Labels

```typescript
gg(data).labs({
  title: 'Main Title',
  subtitle: 'Subtitle',
  caption: 'Data source',
  x: 'X Axis Label',
  y: 'Y Axis Label',
  color: 'Color Legend',
  fill: 'Fill Legend'
})
```

---

## Rendering

### render()

Renders the plot to a string.

```typescript
const output = plot.render({
  width: 80,        // Characters wide
  height: 24,       // Characters tall
  renderer: 'braille'  // 'braille' | 'block' | 'sixel' | 'auto'
})

console.log(output)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 80 | Output width in characters |
| `height` | number | 24 | Output height in characters |
| `renderer` | string | 'auto' | Renderer type |
| `colorMode` | string | 'auto' | Color mode ('none', '16', '256', 'truecolor') |

---

## OpenTUI Integration (`@ggterm/opentui`)

### GGTerm Component

React component for embedding plots in OpenTUI applications.

```tsx
import { GGTerm } from '@ggterm/opentui'

function MyApp() {
  return (
    <GGTerm
      data={data}
      aes={{ x: 'pc1', y: 'pc2', color: 'group' }}
      geoms={[geom_point()]}
      scales={[scale_color_viridis()]}
      theme={theme_dark()}
      width={80}
      height={24}
      onHover={(point) => console.log(point)}
      onClick={(point) => console.log(point)}
    />
  )
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | Record[] | Data array |
| `aes` | AestheticMapping | Aesthetic mappings |
| `geoms` | Geom[] | Geometry layers |
| `stats` | Stat[] | Statistical transforms |
| `scales` | Scale[] | Scale definitions |
| `coord` | Coord | Coordinate system |
| `facet` | Facet | Faceting specification |
| `theme` | Theme | Theme object |
| `width` | number \| string | Width (chars or percentage) |
| `height` | number | Height in characters |
| `onHover` | function | Hover callback |
| `onClick` | function | Click callback |

### useGGTerm Hook

For more control over the plot lifecycle.

```tsx
import { useGGTerm } from '@ggterm/opentui'

function MyPlot({ data }) {
  const { plot, rendered, setData } = useGGTerm({
    aes: { x: 'x', y: 'y' },
    geoms: [geom_point()]
  })

  useEffect(() => {
    setData(data)
  }, [data])

  return <text>{rendered}</text>
}
```

---

## Streaming Data

```typescript
const plot = gg([]).aes({ x: 'time', y: 'value' }).geom(geom_line())

// Push new data points
stream.on('data', (point) => {
  plot.push(point)
  console.clear()
  console.log(plot.render())
})
```

---

## Extended Geometries (Phase 7)

### geom_boxplot()

Box and whisker plots for distribution summaries.

```typescript
import { geom_boxplot } from '@ggterm/core'

gg(data)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_boxplot())
```

### geom_violin()

Violin plots showing distribution shape.

```typescript
import { geom_violin } from '@ggterm/core'

gg(data)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_violin({ width: 0.8 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 0.8 | Violin width |
| `draw_quantiles` | number[] | [0.25, 0.5, 0.75] | Quantile lines to draw |
| `scale` | string | 'area' | 'area', 'count', or 'width' |
| `trim` | boolean | true | Trim to data range |

### geom_density()

1D kernel density estimation - a smoothed version of the histogram.

```typescript
import { geom_density } from '@ggterm/core'

// Basic density plot
gg(data)
  .aes({ x: 'value' })
  .geom(geom_density())

// Compare distributions with color
gg(data)
  .aes({ x: 'value', color: 'group', fill: 'group' })
  .geom(geom_density({ alpha: 0.3 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `n` | number | 512 | Number of evaluation points |
| `bw` | number | auto | Bandwidth (Silverman's rule if not specified) |
| `kernel` | string | 'gaussian' | Kernel: 'gaussian', 'epanechnikov', 'rectangular' |
| `adjust` | number | 1 | Bandwidth adjustment factor |
| `alpha` | number | 0.3 | Fill transparency |
| `color` | string | - | Outline color |
| `fill` | string | - | Fill color |
| `linetype` | string | 'solid' | Line type for outline |

### geom_tile()

Rectangular tiles for heatmaps.

```typescript
import { geom_tile, scale_fill_viridis } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', fill: 'value' })
  .geom(geom_tile({ width: 1, height: 1 }))
  .scale(scale_fill_viridis())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | auto | Tile width |
| `height` | number | auto | Tile height |
| `alpha` | number | 1 | Opacity |

### geom_contour()

Contour lines for 2D density.

```typescript
import { geom_contour } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', z: 'z' })
  .geom(geom_contour({ bins: 10 }))
```

### geom_contour_filled()

Filled contour regions for 2D density.

```typescript
import { geom_contour_filled } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', z: 'z' })
  .geom(geom_contour_filled({ bins: 10 }))
```

### geom_density_2d()

2D kernel density estimation shown as contours.

```typescript
import { geom_density_2d } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_density_2d())
```

### geom_bin2d()

2D binned heatmap.

```typescript
import { geom_bin2d } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_bin2d({ bins: [20, 20] }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bins` | number[] | [30, 30] | Number of bins [x, y] |

### geom_raster()

Fast rendering of regular grids (similar to tile but optimized).

```typescript
import { geom_raster } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', fill: 'value' })
  .geom(geom_raster())
```

### geom_smooth()

Adds a smoothed conditional mean line.

```typescript
import { geom_smooth } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_smooth({ method: 'loess' }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | string | 'loess' | Smoothing method: 'loess', 'lm', 'gam' |
| `span` | number | 0.75 | Smoothing span (for loess) |
| `se` | boolean | true | Show confidence interval |

### geom_rug()

Adds marginal rug marks showing data positions.

```typescript
import { geom_rug } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_rug({ sides: 'bl' }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sides` | string | 'bl' | Sides for rugs: 'b', 't', 'l', 'r' combinations |
| `length` | number | 0.03 | Rug mark length |

### geom_segment()

Line segments defined by start and end points.

```typescript
import { geom_segment } from '@ggterm/core'

gg(data)
  .aes({ x: 'x1', y: 'y1', xend: 'x2', yend: 'y2' })
  .geom(geom_segment())
```

### geom_curve()

Curved line segments.

```typescript
import { geom_curve } from '@ggterm/core'

gg(data)
  .aes({ x: 'x1', y: 'y1', xend: 'x2', yend: 'y2' })
  .geom(geom_curve({ curvature: 0.3 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `curvature` | number | 0.5 | Curvature amount |
| `angle` | number | 90 | Curve angle |

### geom_errorbar() / geom_errorbarh()

Error bars for uncertainty visualization.

```typescript
import { geom_errorbar, geom_point } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', ymin: 'lower', ymax: 'upper' })
  .geom(geom_errorbar({ width: 0.2 }))
  .geom(geom_point())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 0.5 | Cap width |
| `alpha` | number | 1 | Opacity |

### geom_crossbar()

Crossbar showing median with box range.

```typescript
import { geom_crossbar } from '@ggterm/core'

gg(data)
  .aes({ x: 'group', y: 'median', ymin: 'lower', ymax: 'upper' })
  .geom(geom_crossbar({ width: 0.5 }))
```

### geom_linerange()

Vertical line ranges (no horizontal caps).

```typescript
import { geom_linerange } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', ymin: 'lower', ymax: 'upper' })
  .geom(geom_linerange())
```

### geom_pointrange()

Point with vertical range line.

```typescript
import { geom_pointrange } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y', ymin: 'lower', ymax: 'upper' })
  .geom(geom_pointrange())
```

### geom_rect()

Rectangular regions.

```typescript
import { geom_rect } from '@ggterm/core'

gg(data)
  .aes({ xmin: 'x1', xmax: 'x2', ymin: 'y1', ymax: 'y2' })
  .geom(geom_rect({ alpha: 0.3 }))
```

### geom_abline()

Arbitrary lines (y = slope * x + intercept).

```typescript
import { geom_abline } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_abline({ slope: 1, intercept: 0, linetype: 'dashed' }))
```

### geom_ridgeline() / geom_joy()

Ridgeline plots (also called joy plots) for comparing distributions across groups. Shows stacked density curves, ideal for visualizing how distributions change across categories.

```typescript
import { geom_ridgeline, geom_joy } from '@ggterm/core'

// Temperature distributions by month
gg(data)
  .aes({ x: 'temp', y: 'month' })
  .geom(geom_ridgeline())
  .labs({ title: 'Temperature by Month' })

// Using the joy alias (same as ridgeline)
gg(data)
  .aes({ x: 'value', y: 'category' })
  .geom(geom_joy({ scale: 1.2, alpha: 0.7 }))
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scale` | number | 0.9 | Height scale for density curves (higher = more overlap) |
| `alpha` | number | 0.8 | Opacity (0-1) |
| `fill` | string | null | Fill color (cycles through palette if not set) |
| `color` | string | null | Outline color |
| `adjust` | number | 1 | Bandwidth adjustment for density estimation |
| `n` | number | 128 | Number of points for density curve |
| `outline` | boolean | true | Whether to draw outlines |

#### CLI Usage

```bash
# Basic ridgeline plot
bun packages/core/src/cli-plot.ts data.csv temp month - "Temperatures" ridgeline

# Using joy alias
bun packages/core/src/cli-plot.ts data.csv value category - "Distribution" joy
```

### geom_qq() / geom_qq_line()

Q-Q (quantile-quantile) plots for comparing distributions, typically to check for normality.

```typescript
import { geom_qq, geom_qq_line } from '@ggterm/core'

// Check if data is normally distributed
gg(data)
  .aes({ sample: 'value' })
  .geom(geom_qq())
  .geom(geom_qq_line())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `distribution` | string | 'norm' | Reference distribution |
| `dparams` | object | {} | Distribution parameters |

#### CLI Usage

```bash
# Q-Q plot for normality check
bun packages/core/src/cli-plot.ts data.csv value - - "Normality Check" qq
```

### geom_beeswarm() / geom_quasirandom()

Beeswarm plots arrange points to avoid overlap while showing individual data points. Combines the benefits of jitter plots and violin plots.

```typescript
import { geom_beeswarm, geom_quasirandom } from '@ggterm/core'

// Basic beeswarm plot
gg(data)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_beeswarm())
  .labs({ title: 'Treatment Response' })

// Using quasirandom alias (uses center method)
gg(data)
  .aes({ x: 'treatment', y: 'response', color: 'treatment' })
  .geom(geom_quasirandom())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | string | 'swarm' | Arrangement method: 'swarm' (compact), 'center' (alternating), 'square' (grid) |
| `size` | number | 1 | Point size multiplier |
| `cex` | number | 1 | Point size for collision detection |
| `alpha` | number | 1 | Opacity (0-1) |
| `color` | string | null | Fixed point color |
| `shape` | string | 'circle' | Point shape |
| `side` | number | 0 | Side to place points: 0 (both), -1 (left), 1 (right) |
| `priority` | string | 'ascending' | Order to place points: 'ascending', 'descending', 'density', 'random' |
| `dodge` | number | 0.8 | Width for categorical spacing |

#### CLI Usage

```bash
# Basic beeswarm plot
bun packages/core/src/cli-plot.ts data.csv group value - "Comparison" beeswarm

# Using quasirandom alias
bun packages/core/src/cli-plot.ts data.csv treatment response - "Response" quasirandom
```

### geom_dumbbell()

Dumbbell charts show two points connected by a line. Perfect for before/after comparisons, paired data, or showing ranges.

```typescript
import { geom_dumbbell } from '@ggterm/core'

// Before/after comparison
const data = [
  { category: 'A', before: 10, xend: 25 },
  { category: 'B', before: 15, xend: 20 },
  { category: 'C', before: 8, xend: 30 },
]

gg(data)
  .aes({ x: 'before', y: 'category' })
  .geom(geom_dumbbell())
  .labs({ title: 'Before vs After' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | number | 2 | Size of start points |
| `sizeEnd` | number | size | Size of end points |
| `color` | string | null | Color of start points |
| `colorEnd` | string | color | Color of end points |
| `lineColor` | string | '#666666' | Color of connecting line |
| `lineWidth` | number | 1 | Width of connecting line |
| `alpha` | number | 1 | Opacity (0-1) |
| `shape` | string | 'circle' | Point shape |

#### CLI Usage

```bash
# Dumbbell plot with xend in data
bun packages/core/src/cli-plot.ts data.csv start category - "Comparison" dumbbell
```

### geom_lollipop()

Lollipop charts show a line from baseline to a point with a dot at the end. A cleaner alternative to bar charts, especially for sparse data.

```typescript
import { geom_lollipop } from '@ggterm/core'

// Product sales comparison
const data = [
  { product: 'Apple', sales: 150 },
  { product: 'Banana', sales: 200 },
  { product: 'Cherry', sales: 80 },
]

gg(data)
  .aes({ x: 'product', y: 'sales' })
  .geom(geom_lollipop())
  .labs({ title: 'Product Sales' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | number | 2 | Size of the point |
| `color` | string | null | Color of the point |
| `lineColor` | string | null | Color of the line (defaults to dimmer point color) |
| `lineWidth` | number | 1 | Width of the line |
| `alpha` | number | 1 | Opacity (0-1) |
| `shape` | string | 'circle' | Point shape |
| `direction` | string | 'vertical' | 'vertical' or 'horizontal' |
| `baseline` | number | 0 | Baseline value for the lines |

#### CLI Usage

```bash
# Vertical lollipop
bun packages/core/src/cli-plot.ts data.csv category value - "Sales" lollipop

# With custom baseline
bun packages/core/src/cli-plot.ts data.csv product profit - "Profit vs Target" lollipop
```

---

## Terminal-Native Geoms

These geoms are specifically designed for terminal display using Unicode characters.

### geom_waffle()

Grid-based part-of-whole visualization. A more readable alternative to pie charts.

```typescript
import { geom_waffle } from '@ggterm/core'

const data = [
  { company: 'Apple', share: 45 },
  { company: 'Samsung', share: 30 },
  { company: 'Other', share: 25 },
]

gg(data)
  .aes({ fill: 'company', y: 'share' })
  .geom(geom_waffle())
  .labs({ title: 'Market Share' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rows` | number | 10 | Number of rows in the grid |
| `cols` | number | 10 | Number of columns in the grid |
| `n_total` | number | 100 | Total units to represent |
| `fill_char` | string | '█' | Character for filled cells |
| `empty_char` | string | '░' | Character for empty cells |
| `show_legend` | boolean | true | Show category legend |
| `flip` | boolean | false | Fill by row instead of column |
| `gap` | number | 0 | Gap between cells |

### geom_sparkline()

Inline mini-charts showing trends. Uses Unicode block characters for compact visualization.

```typescript
import { geom_sparkline, SPARK_BARS } from '@ggterm/core'

const data = [
  { month: 1, value: 10 },
  { month: 2, value: 15 },
  { month: 3, value: 12 },
  // ...
]

gg(data)
  .aes({ x: 'month', y: 'value' })
  .geom(geom_sparkline())
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | 'bar' | Sparkline type: 'bar', 'line', 'dot' |
| `width` | number | 20 | Width in characters |
| `height` | number | 1 | Height (for line type) |
| `show_minmax` | boolean | false | Highlight min/max points |
| `color` | string | null | Sparkline color |
| `min_color` | string | '#e74c3c' | Minimum point color |
| `max_color` | string | '#2ecc71' | Maximum point color |
| `normalize` | boolean | true | Normalize to 0-1 range |

#### Available Characters

```typescript
import { SPARK_BARS, SPARK_DOTS } from '@ggterm/core'

// Bar characters: ▁▂▃▄▅▆▇█
SPARK_BARS // ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

// Dot characters for smoother lines
SPARK_DOTS // ['⠀', '⢀', '⢠', '⢰', '⢸', '⣸', '⣾', '⣿']
```

### geom_bullet()

Bullet charts - compact progress bars with target markers. Stephen Few's alternative to gauges.

```typescript
import { geom_bullet } from '@ggterm/core'

const data = [
  { metric: 'Revenue', value: 85, target: 90 },
  { metric: 'Profit', value: 70, target: 80 },
  { metric: 'Growth', value: 95, target: 75 },
]

gg(data)
  .aes({ x: 'metric', y: 'value' })
  .geom(geom_bullet())
  .labs({ title: 'KPI Dashboard' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 40 | Width of chart in characters |
| `height` | number | 1 | Height per bullet |
| `target_char` | string | '│' | Target marker character |
| `bar_char` | string | '█' | Bar character |
| `range_chars` | array | ['░','▒','▓'] | Background range characters |
| `show_values` | boolean | true | Show numeric values |
| `target_color` | string | '#e74c3c' | Target marker color |
| `orientation` | string | 'horizontal' | 'horizontal' or 'vertical' |

### geom_braille()

High-resolution plots using Unicode Braille patterns. Each character contains a 2x4 grid of dots for 8x the resolution.

```typescript
import { geom_braille, BRAILLE_BASE, BRAILLE_DOTS } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_braille({ type: 'line' }))
  .labs({ title: 'High-Resolution Plot' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | 'point' | Plot type: 'point' or 'line' |
| `color` | string | null | Dot/line color |
| `fill` | boolean | false | Fill area under line |
| `alpha` | number | 1 | Opacity (0-1) |
| `dot_size` | number | 1 | Dots per data point (1-4) |

#### Braille Constants

```typescript
import { BRAILLE_BASE, BRAILLE_DOTS } from '@ggterm/core'

// Base Unicode point for braille
BRAILLE_BASE // 0x2800

// Dot bit positions: [col][row]
BRAILLE_DOTS // [[0x01,0x02,0x04,0x40], [0x08,0x10,0x20,0x80]]
```

### geom_calendar()

GitHub-style contribution heatmap showing activity over time. Data should have date and value fields.

```typescript
import { geom_calendar } from '@ggterm/core'

const data = [
  { date: '2025-01-01', commits: 5 },
  { date: '2025-01-02', commits: 3 },
  // ...
]

gg(data)
  .aes({ x: 'date', fill: 'commits' })
  .geom(geom_calendar())
  .labs({ title: 'Contribution Activity' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cell_char` | string | '█' | Character for cells |
| `empty_char` | string | '░' | Character for empty cells |
| `empty_color` | string | '#161b22' | Color for empty/zero cells |
| `fill_color` | string | '#39d353' | Color for max value |
| `show_months` | boolean | true | Show month labels |
| `show_days` | boolean | true | Show day-of-week labels |
| `week_start` | number | 0 | Week start day (0=Sun, 1=Mon) |
| `levels` | number | 5 | Number of color intensity levels |

### geom_flame()

Flame graph for performance profiling. Displays hierarchical stack data as horizontal bars where width represents time/samples.

```typescript
import { geom_flame } from '@ggterm/core'

const data = [
  { name: 'main', depth: 0, value: 100, start: 0 },
  { name: 'foo', depth: 1, value: 40, start: 0 },
  { name: 'bar', depth: 1, value: 30, start: 40 },
  // ...
]

gg(data)
  .aes({ x: 'name', y: 'depth', fill: 'value' })
  .geom(geom_flame())
  .labs({ title: 'CPU Profile' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | string | 'flame' | 'flame' (bottom-up) or 'icicle' (top-down) |
| `palette` | string | 'warm' | Color palette: 'warm', 'cool', 'hot' |
| `show_labels` | boolean | true | Show function names in bars |
| `min_label_width` | number | 10 | Minimum bar width to show label |
| `sort` | string | 'alpha' | Sort frames: 'alpha', 'value', 'none' |
| `bar_char` | string | '█' | Character for bars |

#### Aliases

- `geom_icicle()` - Same as `geom_flame({ style: 'icicle' })`

### geom_corrmat()

Correlation matrix heatmap with diverging colors. Displays pairwise correlations between variables.

```typescript
import { geom_corrmat } from '@ggterm/core'

const data = [
  { var1: 'A', var2: 'A', correlation: 1.0 },
  { var1: 'A', var2: 'B', correlation: 0.8 },
  { var1: 'A', var2: 'C', correlation: -0.3 },
  // ... full matrix
]

gg(data)
  .aes({ x: 'var1', y: 'var2', fill: 'correlation' })
  .geom(geom_corrmat())
  .labs({ title: 'Correlation Matrix' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_values` | boolean | true | Show correlation values in cells |
| `decimals` | number | 2 | Decimal places for values |
| `show_significance` | boolean | false | Show significance markers |
| `sig_threshold` | number | 0.05 | Significance threshold |
| `sig_marker` | string | '*' | Marker for significant values |
| `positive_color` | string | '#2166ac' | Color for r=+1 (blue) |
| `negative_color` | string | '#b2182b' | Color for r=-1 (red) |
| `neutral_color` | string | '#f7f7f7' | Color for r=0 (white) |
| `lower_triangle` | boolean | false | Show only lower triangle |
| `upper_triangle` | boolean | false | Show only upper triangle |
| `show_diagonal` | boolean | true | Show diagonal elements |
| `method` | string | 'pearson' | Correlation method: 'pearson' or 'spearman' |

### geom_sankey()

Sankey flow diagram showing flows between nodes with proportional-width connections.

```typescript
import { geom_sankey } from '@ggterm/core'

const flows = [
  { source: 'Coal', target: 'Electricity', value: 25 },
  { source: 'Gas', target: 'Electricity', value: 20 },
  { source: 'Coal', target: 'Heat', value: 10 },
]

gg(flows)
  .aes({ x: 'source', y: 'target', fill: 'value' })
  .geom(geom_sankey())
  .labs({ title: 'Energy Flow' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `node_width` | number | 3 | Node bar width in characters |
| `node_padding` | number | 2 | Padding between nodes |
| `node_char` | string | '█' | Character for node bars |
| `flow_char` | string | '─' | Character for flow lines |
| `show_labels` | boolean | true | Show node labels |
| `show_values` | boolean | false | Show flow values |
| `align` | string | 'justify' | Node alignment: 'left', 'right', 'center', 'justify' |
| `color_by` | string | 'auto' | Color scheme: 'auto', 'source', 'target' |
| `min_flow_width` | number | 1 | Minimum flow line width |

### geom_treemap()

Treemap visualization displaying hierarchical data as nested rectangles where area represents value.

```typescript
import { geom_treemap } from '@ggterm/core'

const data = [
  { name: 'JavaScript', value: 300 },
  { name: 'Python', value: 250 },
  { name: 'TypeScript', value: 200 },
]

gg(data)
  .aes({ x: 'name', fill: 'value' })
  .geom(geom_treemap())
  .labs({ title: 'Language Usage' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `algorithm` | string | 'squarify' | Tiling: 'squarify', 'binary', 'slice', 'dice' |
| `show_labels` | boolean | true | Show labels in rectangles |
| `show_values` | boolean | false | Show values in rectangles |
| `border` | boolean | true | Draw borders around rectangles |
| `padding` | number | 0 | Padding between nested rectangles |
| `min_label_size` | number | 4 | Minimum size to show label |
| `color_by` | string | 'value' | Color by: 'value', 'depth', 'parent' |
| `fill_char` | string | '█' | Fill character |
| `max_depth` | number | unlimited | Maximum hierarchy depth to show |
| `aspect_ratio` | number | 1.618 | Target aspect ratio (golden ratio) |

### geom_volcano()

Volcano plot for differential expression analysis. Visualizes statistical significance vs magnitude of change, commonly used in genomics.

```typescript
import { geom_volcano } from '@ggterm/core'

const data = [
  { gene: 'TP53', log2FC: 3.5, pvalue: 1e-50 },
  { gene: 'BRCA1', log2FC: -2.8, pvalue: 1e-40 },
  { gene: 'MYC', log2FC: 2.1, pvalue: 1e-30 },
  { gene: 'GAPDH', log2FC: 0.1, pvalue: 0.5 },
]

gg(data)
  .aes({ x: 'log2FC', y: 'pvalue', label: 'gene' })
  .geom(geom_volcano({
    fc_threshold: 1,
    p_threshold: 0.05,
    n_labels: 5,
  }))
  .labs({ title: 'Differential Expression' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fc_threshold` | number | 1 | Log2 fold change threshold (1 = 2-fold) |
| `p_threshold` | number | 0.05 | P-value threshold for significance |
| `y_is_neglog10` | boolean | false | If true, y values are already -log10 transformed |
| `up_color` | string | '#e41a1c' | Color for up-regulated points (red) |
| `down_color` | string | '#377eb8' | Color for down-regulated points (blue) |
| `ns_color` | string | '#999999' | Color for non-significant points (gray) |
| `show_thresholds` | boolean | true | Show threshold reference lines |
| `threshold_linetype` | string | 'dashed' | Line type for thresholds |
| `n_labels` | number | 0 | Number of top significant points to label |
| `size` | number | 1 | Point size |
| `alpha` | number | 0.6 | Point opacity |
| `point_char` | string | '●' | Character for points |

#### Classification

Points are automatically classified as:
- **Up-regulated**: log2FC > fc_threshold AND p < p_threshold
- **Down-regulated**: log2FC < -fc_threshold AND p < p_threshold
- **Not significant**: everything else

### geom_ma()

MA plot for differential expression analysis. Plots log2 fold change (M) against average expression (A), commonly used alongside volcano plots in genomics.

```typescript
import { geom_ma } from '@ggterm/core'

const data = [
  { gene: 'TP53', baseMean: 5000, log2FC: 3.5, padj: 1e-50 },
  { gene: 'BRCA1', baseMean: 3000, log2FC: -2.8, padj: 1e-40 },
  { gene: 'MYC', baseMean: 8000, log2FC: 2.1, padj: 1e-30 },
  { gene: 'GAPDH', baseMean: 50000, log2FC: 0.1, padj: 0.9 },
]

gg(data)
  .aes({ x: 'baseMean', y: 'log2FC', label: 'gene' })
  .geom(geom_ma({
    fc_threshold: 1,
    p_col: 'padj',
    p_threshold: 0.05,
    n_labels: 5,
  }))
  .labs({ title: 'MA Plot - Differential Expression' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fc_threshold` | number | 1 | Log2 fold change threshold (1 = 2-fold) |
| `p_threshold` | number | 0.05 | P-value threshold for significance |
| `p_col` | string | undefined | Column name containing p-values (optional) |
| `x_is_log2` | boolean | false | If true, x values are already log2 transformed |
| `up_color` | string | '#e41a1c' | Color for up-regulated points (red) |
| `down_color` | string | '#377eb8' | Color for down-regulated points (blue) |
| `ns_color` | string | '#999999' | Color for non-significant points (gray) |
| `show_baseline` | boolean | true | Show M=0 baseline reference line |
| `show_thresholds` | boolean | true | Show ±fc_threshold reference lines |
| `linetype` | string | 'dashed' | Line type for reference lines |
| `n_labels` | number | 0 | Number of top significant points to label |
| `size` | number | 1 | Point size |
| `alpha` | number | 0.6 | Point opacity |
| `point_char` | string | '●' | Character for points |

#### Classification

Points are classified as:
- **Up-regulated**: log2FC > fc_threshold (AND p < p_threshold if p_col specified)
- **Down-regulated**: log2FC < -fc_threshold (AND p < p_threshold if p_col specified)
- **Not significant**: everything else

### geom_manhattan()

Manhattan plot for GWAS (Genome-Wide Association Study) visualization. Shows genomic position vs -log10(p-value) with significance thresholds.

```typescript
import { geom_manhattan } from '@ggterm/core'

const data = [
  { snp: 'rs123', chr: '1', pos: 1000000, pvalue: 1e-9 },
  { snp: 'rs456', chr: '2', pos: 2000000, pvalue: 1e-6 },
  { snp: 'rs789', chr: '6', pos: 3000000, pvalue: 5e-8 },
]

gg(data)
  .aes({ x: 'pos', y: 'pvalue', color: 'chr', label: 'snp' })
  .geom(geom_manhattan({
    genome_wide_threshold: 5e-8,
    suggestive_threshold: 1e-5,
    n_labels: 5,
  }))
  .labs({ title: 'GWAS Results' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `suggestive_threshold` | number | 1e-5 | Suggestive significance threshold |
| `genome_wide_threshold` | number | 5e-8 | Genome-wide significance threshold |
| `y_is_neglog10` | boolean | false | If true, y values are already -log10 transformed |
| `chr_colors` | string[] | ['#1f78b4', '#a6cee3'] | Alternating chromosome colors |
| `highlight_color` | string | '#e41a1c' | Color for genome-wide significant points |
| `suggestive_color` | string | '#ff7f00' | Color for suggestive points |
| `show_thresholds` | boolean | true | Show significance threshold lines |
| `n_labels` | number | 0 | Number of top SNPs to label |
| `chr_gap` | number | 0.02 | Gap between chromosomes as fraction |

### geom_heatmap()

Heatmap for matrix visualization with optional hierarchical clustering. Commonly used for gene expression matrices.

```typescript
import { geom_heatmap } from '@ggterm/core'

const data = [
  { gene: 'IL6', sample: 'Control', expression: 0.5 },
  { gene: 'IL6', sample: 'Treatment', expression: 3.2 },
  { gene: 'TNF', sample: 'Control', expression: 1.0 },
  { gene: 'TNF', sample: 'Treatment', expression: 2.5 },
]

gg(data)
  .aes({ x: 'sample', y: 'gene', fill: 'expression' })
  .geom(geom_heatmap({
    cluster_rows: true,
    cluster_cols: true,
    scale: 'row',
  }))
  .labs({ title: 'Gene Expression' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `low_color` | string | '#313695' | Color for low values (blue) |
| `mid_color` | string | '#ffffbf' | Color for mid values (yellow) |
| `high_color` | string | '#a50026' | Color for high values (red) |
| `na_color` | string | '#808080' | Color for missing values |
| `cluster_rows` | boolean | false | Cluster rows hierarchically |
| `cluster_cols` | boolean | false | Cluster columns hierarchically |
| `clustering_method` | string | 'complete' | 'complete', 'single', or 'average' |
| `scale` | string | 'none' | 'none', 'row', or 'column' |
| `show_row_labels` | boolean | true | Show row labels |
| `show_col_labels` | boolean | true | Show column labels |

### geom_biplot()

PCA biplot showing both samples (scores) and variables (loadings) together.

```typescript
import { geom_biplot } from '@ggterm/core'

const scores = [
  { sample: 'A', species: 'setosa', PC1: -2.5, PC2: 0.5 },
  { sample: 'B', species: 'versicolor', PC1: 0.5, PC2: -0.5 },
  { sample: 'C', species: 'virginica', PC1: 2.5, PC2: 0.2 },
]

const loadings = [
  { variable: 'Sepal.L', pc1: 0.52, pc2: -0.38 },
  { variable: 'Petal.L', pc1: 0.58, pc2: 0.02 },
]

gg(scores)
  .aes({ x: 'PC1', y: 'PC2', color: 'species' })
  .geom(geom_biplot({
    loadings,
    var_explained: [0.73, 0.23],
  }))
  .labs({ title: 'PCA Biplot', x: 'PC1 (73%)', y: 'PC2 (23%)' })
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pc1_col` | string | 'PC1' | Column name for PC1 scores |
| `pc2_col` | string | 'PC2' | Column name for PC2 scores |
| `loadings` | array | undefined | Array of {variable, pc1, pc2} for arrows |
| `var_explained` | [number, number] | undefined | Variance explained by PC1, PC2 |
| `show_scores` | boolean | true | Show sample points |
| `show_loadings` | boolean | true | Show loading arrows |
| `loading_color` | string | '#e41a1c' | Color for loading arrows |
| `loading_scale` | number | auto | Scale factor for arrows |
| `show_origin` | boolean | true | Show origin crosshairs |
| `show_loading_labels` | boolean | true | Show variable names |

---

## Annotations

Add arbitrary text, shapes, and lines to plots.

### annotate()

```typescript
import { annotate } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(annotate('text', { x: 5, y: 10, label: 'Important point' }))
  .geom(annotate('rect', { xmin: 2, xmax: 4, ymin: 5, ymax: 15, alpha: 0.2 }))
  .geom(annotate('hline', { y: 50, linetype: 'dashed', color: 'red' }))
```

#### Annotation Types

| Type | Required Options | Description |
|------|-----------------|-------------|
| `text` | x, y, label | Text label |
| `label` | x, y, label | Text with background |
| `rect` | xmin, xmax, ymin, ymax | Rectangle |
| `segment` | x, y, xend, yend | Line segment |
| `hline` | y | Horizontal line |
| `vline` | x | Vertical line |
| `abline` | slope, intercept | Arbitrary line |
| `point` | x, y | Single point |

### Helper Functions

```typescript
import {
  annotate_text,
  annotate_label,
  annotate_rect,
  annotate_segment,
  annotate_hline,
  annotate_vline
} from '@ggterm/core'

// Shorthand versions
annotate_text(5, 10, 'Label')
annotate_rect(0, 5, 0, 10, { alpha: 0.2 })
annotate_hline(50, { linetype: 'dashed' })
```

---

## Advanced Scales (Phase 7)

### Size Scales

```typescript
import {
  scale_size_continuous,
  scale_size_area,
  scale_size_radius,
  scale_size_binned
} from '@ggterm/core'

// Continuous size mapping
gg(data)
  .aes({ x: 'x', y: 'y', size: 'value' })
  .scale(scale_size_continuous({ range: [1, 10] }))

// Area-proportional sizing (for bubble charts)
.scale(scale_size_area({ max_size: 10 }))

// Binned sizes
.scale(scale_size_binned({ n_breaks: 5 }))
```

### Shape Scales

```typescript
import {
  scale_shape_discrete,
  scale_shape_manual,
  DEFAULT_SHAPES,
  SHAPE_CHARS
} from '@ggterm/core'

// Automatic shape assignment
gg(data)
  .aes({ x: 'x', y: 'y', shape: 'category' })
  .scale(scale_shape_discrete())

// Manual shape mapping
.scale(scale_shape_manual({
  values: {
    'A': 'circle',
    'B': 'square',
    'C': 'triangle'
  }
}))
```

#### Available Shapes

`circle`, `square`, `triangle`, `diamond`, `cross`, `plus`, `star`,
`open_circle`, `open_square`, `open_triangle`, `open_diamond`, `dot`

### Alpha Scales

```typescript
import {
  scale_alpha_continuous,
  scale_alpha_discrete,
  scale_alpha_manual
} from '@ggterm/core'

// Continuous alpha
gg(data)
  .aes({ x: 'x', y: 'y', alpha: 'importance' })
  .scale(scale_alpha_continuous({ range: [0.2, 1.0] }))

// Discrete alpha
.scale(scale_alpha_discrete({ values: [0.3, 0.6, 1.0] }))
```

### Date/Time Scales

```typescript
import {
  scale_x_datetime,
  scale_y_datetime,
  scale_x_date,
  scale_x_time,
  scale_x_duration
} from '@ggterm/core'

// Full datetime
gg(data)
  .aes({ x: 'timestamp', y: 'value' })
  .scale(scale_x_datetime())

// Date only
.scale(scale_x_date())

// Time of day (0-24 hours)
.scale(scale_x_time({ domain: [9, 17] }))  // 9 AM to 5 PM

// Duration
.scale(scale_x_duration({ unit: 'minutes' }))
```

---

## Streaming & Performance (Phase 6)

### StreamingPlot

High-performance real-time plotting.

```typescript
import { createStreamingPlot, createTimeSeriesPlot } from '@ggterm/core'

// Simple streaming plot
const plot = createStreamingPlot({
  maxPoints: 100,
  windowMs: 60000  // 1 minute window
})

// Add data
plot.push({ time: Date.now(), value: 42 })

// Render
console.log(plot.render({ width: 80, height: 20 }))
```

### Data Window

Sliding window for time-series data.

```typescript
import { createDataWindow } from '@ggterm/core'

const window = createDataWindow({
  maxSize: 1000,
  timeField: 'timestamp',
  windowMs: 60000
})

window.push({ timestamp: Date.now(), value: 42 })

// Get windowed data
const data = window.getData()
const stats = window.getStats()  // { min, max, mean, count }
```

### Rolling Aggregator

Compute rolling statistics.

```typescript
import { createRollingAggregator } from '@ggterm/core'

const agg = createRollingAggregator({
  windowSize: 10,
  aggregation: 'mean'  // 'mean', 'sum', 'min', 'max', 'count'
})

agg.push(42)
const rollingMean = agg.getValue()
```

### Data Sampling

Handle large datasets efficiently.

```typescript
import {
  autoSample,
  systematicSample,
  randomSample,
  lttbSample  // Largest Triangle Three Buckets
} from '@ggterm/core'

// Auto-select best method
const sampled = autoSample(largeData, { targetSize: 1000 })

// LTTB for time series (preserves visual shape)
const sampled = lttbSample(data, 500, 'time', 'value')
```

### Level of Detail

Automatic detail reduction for large datasets.

```typescript
import { createLOD } from '@ggterm/core'

const lod = createLOD(data, {
  levels: [
    { threshold: 1000, method: 'systematic', targetSize: 500 },
    { threshold: 10000, method: 'lttb', targetSize: 1000 }
  ]
})

// Get appropriate detail level
const displayData = lod.getData(currentZoomLevel)
```

### Canvas Diffing

Efficient re-rendering.

```typescript
import { createCanvasDiff } from '@ggterm/core'

const diff = createCanvasDiff()

// Only render changed cells
const changes = diff.compare(previousCanvas, currentCanvas)
const output = diff.renderChanges(changes)
```

---

## Terminal Capabilities

### Detection

```typescript
import {
  detectCapabilities,
  getCapabilities,
  getRecommendedRenderer
} from '@ggterm/core'

const caps = detectCapabilities()
// {
//   colorCapability: 'truecolor',
//   graphicsProtocol: 'sixel',
//   unicodeSupport: true,
//   terminalSize: { width: 120, height: 40 }
// }

const renderer = getRecommendedRenderer()
// 'sixel', 'braille', or 'block'
```

### Color Utilities

```typescript
import {
  rgbToAnsi256,
  rgbToAnsi16,
  findClosestPaletteColor,
  quantizeColor
} from '@ggterm/core'

// Convert RGB to nearest 256-color
const ansi = rgbToAnsi256(255, 128, 0)

// Quantize for limited palettes
const quantized = quantizeColor({ r: 255, g: 128, b: 0, a: 1 }, '256')
```

---

## Claude Code Skills

ggterm includes AI-assisted skills for Claude Code that enable natural language interaction with plots.

### Available Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `data-load` | "load data", "read csv" | Load CSV, JSON, JSONL files |
| `ggterm-plot` | "plot", "chart", "visualize" | Create terminal visualizations |
| `ggterm-history` | "show history", "find plot" | Search and retrieve historical plots |
| `ggterm-markdown` | "create report", "export markdown" | Generate reports with embedded plots |
| `ggterm-publish` | "export", "save as png" | Export to PNG/SVG/PDF/HTML |
| `ggterm-customize` | "change colors", "make title bigger" | Natural language plot customization |
| `ggterm-style` | "style like Wilke", "Tufte style" | Apply publication-quality style presets |

### ggterm-style

Apply expert-curated style presets for publication-ready output.

#### Usage

```bash
# In Claude Code, after creating and exporting a plot:
/ggterm-style wilke
/ggterm-style tufte
/ggterm-style economist
```

#### Available Presets

##### wilke (Claus Wilke)
Based on *Fundamentals of Data Visualization*:
- Font: Helvetica Neue (clean sans-serif)
- Gridlines: Y-axis only, subtle gray (#ebebeb)
- Axis titles: Normal weight, dark gray
- Colors: Colorblind-safe categorical palette
- Best for: Academic papers, general publication

##### tufte (Edward Tufte)
Maximum data-ink ratio principles:
- Font: Georgia (elegant serif)
- No gridlines, no axis lines, no tick marks
- Grayscale color palette
- Shape encoding for redundancy
- Best for: Minimalist presentations, data-focused reports

##### economist (The Economist)
Distinctive editorial magazine style:
- Background: Light blue-gray (#d5e4eb)
- Gridlines: White horizontal lines
- X-axis: Bold black baseline
- Colors: Bold Economist palette (blue, cyan, orange)
- Best for: Editorial content, magazine publication

##### nature (Nature Journal)
Nature publication specifications:
- Dimensions: 180x150px (compact)
- Fonts: 8-10pt Arial
- No grid
- Best for: Nature/Science journal submission

##### apa (APA Guidelines)
American Psychological Association style:
- Font: Times New Roman (serif)
- Axis titles: Italic
- Colors: Grayscale
- Best for: Psychology papers, academic publication

##### minimal
Generic distraction-free style:
- Font: System UI
- No grid, no borders, no ticks
- Best for: Web, presentations

#### Workflow Example

```bash
# 1. Create a plot
bun packages/core/src/cli-plot.ts data.csv x y color "Title" point

# 2. Export to save Vega-Lite spec
bun packages/core/src/cli-plot.ts export output.html

# 3. Apply style (in Claude Code)
/ggterm-style wilke

# 4. View styled result
open /tmp/styled-plot.html
```

#### Style Configuration Structure

Styles modify the Vega-Lite `config` object:

```javascript
{
  config: {
    font: "Helvetica Neue, Arial, sans-serif",
    background: "white",
    view: { stroke: null },
    title: {
      fontSize: 14,
      fontWeight: "normal",
      anchor: "start"
    },
    axis: {
      domain: true,
      domainColor: "#333333",
      grid: false,
      labelFontSize: 11,
      titleFontWeight: "normal"
    },
    axisY: {
      grid: true,
      gridColor: "#ebebeb"
    },
    legend: {
      labelFontSize: 11,
      orient: "right"
    },
    range: {
      category: ["#4C78A8", "#F58518", "#E45756", ...]
    }
  }
}
```

---

## TypeScript Types

```typescript
import type {
  // Core types
  Plot,
  PlotSpec,
  Geom,
  Stat,
  Scale,
  Coord,
  Facet,
  Theme,
  AestheticMapping,
  DataSource,
  DataRecord,
  RenderOptions,

  // Canvas types
  Canvas,
  CanvasCell,
  RGBA,

  // Scale types
  Domain,
  Range,
  SizeScaleOptions,
  ShapeScaleOptions,
  AlphaScaleOptions,
  DateTimeScaleOptions,

  // Geom types
  ViolinOptions,
  TileOptions,
  ContourOptions,
  ErrorbarOptions,
  RectOptions,

  // Streaming types
  StreamingPlotOptions,
  WindowOptions,
  BufferOptions,
  SamplingOptions,
  LODLevel,

  // Terminal types
  ColorCapability,
  GraphicsProtocol,
  TerminalCapabilities,
  RendererType
} from '@ggterm/core'
```
