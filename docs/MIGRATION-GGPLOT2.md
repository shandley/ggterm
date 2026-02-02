# Migrating from ggplot2 to ggterm

This guide helps R users familiar with ggplot2 transition to ggterm. The APIs are intentionally similar, making the learning curve minimal.

## Quick Comparison

| ggplot2 (R) | ggterm (TypeScript) |
|-------------|---------------------|
| `ggplot(data, aes(x, y))` | `gg(data).aes({ x: 'x', y: 'y' })` |
| `+ geom_point()` | `.geom(geom_point())` |
| `+ scale_color_viridis_c()` | `.scale(scale_color_viridis())` |
| `+ facet_wrap(~var)` | `.facet(facet_wrap('var'))` |
| `+ theme_minimal()` | `.theme(themeMinimal())` |
| `ggsave()` | `plot.render({ width, height })` |

## Basic Translation

### ggplot2
```r
library(ggplot2)

ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Weight vs MPG", x = "Weight", y = "MPG") +
  theme_minimal()
```

### ggterm
```typescript
import { gg, geom_point, themeMinimal } from '@ggterm/core'

const plot = gg(mtcars)
  .aes({ x: 'wt', y: 'mpg', color: 'cyl' })
  .geom(geom_point({ size: 3 }))
  .labs({ title: 'Weight vs MPG', x: 'Weight', y: 'MPG' })
  .theme(themeMinimal())

console.log(plot.render({ width: 80, height: 24 }))
```

## Key Differences

### 1. Method Chaining vs `+` Operator

ggplot2 uses the `+` operator to add layers:
```r
ggplot(data) + geom_point() + geom_line()
```

ggterm uses method chaining:
```typescript
gg(data).geom(geom_point()).geom(geom_line())
```

### 2. String Column Names

In ggplot2, you can use bare column names:
```r
aes(x = weight, y = height)
```

In ggterm, column names are always strings:
```typescript
.aes({ x: 'weight', y: 'height' })
```

### 3. Rendering is Explicit

ggplot2 automatically displays plots in RStudio:
```r
ggplot(data) + geom_point()  # Shows plot
```

ggterm requires explicit rendering:
```typescript
const plot = gg(data).geom(geom_point())
console.log(plot.render({ width: 80, height: 24 }))
```

### 4. Terminal Output

ggterm outputs ANSI text for terminals, not raster graphics. This means:
- Resolution is limited by terminal character grid
- Colors depend on terminal capabilities
- Use Braille characters for higher "resolution"

## Geometry Mapping

| ggplot2 | ggterm | Notes |
|---------|--------|-------|
| `geom_point()` | `geom_point()` | Same API |
| `geom_line()` | `geom_line()` | Same API |
| `geom_bar()` | `geom_bar()` | Same API |
| `geom_col()` | `geom_col()` | Same API |
| `geom_histogram()` | `geom_histogram()` | Same API |
| `geom_boxplot()` | `geom_boxplot()` | Same API |
| `geom_violin()` | `geom_violin()` | Same API |
| `geom_area()` | `geom_area()` | Same API |
| `geom_ribbon()` | `geom_ribbon()` | Same API |
| `geom_tile()` | `geom_tile()` | For heatmaps |
| `geom_text()` | `geom_text()` | Same API |
| `geom_label()` | `geom_label()` | Same API |
| `geom_hline()` | `geom_hline()` | Same API |
| `geom_vline()` | `geom_vline()` | Same API |
| `geom_abline()` | `geom_abline()` | Same API |
| `geom_segment()` | `geom_segment()` | Same API |
| `geom_errorbar()` | `geom_errorbar()` | Same API |
| `geom_smooth()` | `stat_smooth()` | Use as stat |
| `geom_density()` | `stat_density()` | Use as stat |
| `geom_contour()` | `geom_contour()` | Same API |

### Not Yet Supported

- `geom_sf()` - Maps/spatial data
- `geom_polygon()` - Arbitrary polygons
- `geom_path()` - Use `geom_line()` with explicit ordering
- `geom_raster()` - Use `geom_tile()` instead

## Scale Mapping

### Position Scales

| ggplot2 | ggterm |
|---------|--------|
| `scale_x_continuous()` | `scale_x_continuous()` |
| `scale_y_continuous()` | `scale_y_continuous()` |
| `scale_x_log10()` | `scale_x_log10()` |
| `scale_y_log10()` | `scale_y_log10()` |
| `scale_x_sqrt()` | `scale_x_sqrt()` |
| `scale_y_sqrt()` | `scale_y_sqrt()` |
| `scale_x_reverse()` | `scale_x_reverse()` |
| `scale_y_reverse()` | `scale_y_reverse()` |
| `scale_x_discrete()` | `scale_x_discrete()` |
| `scale_y_discrete()` | `scale_y_discrete()` |
| `scale_x_date()` | `scale_x_datetime()` |
| `scale_x_datetime()` | `scale_x_datetime()` |

### Color Scales

| ggplot2 | ggterm |
|---------|--------|
| `scale_color_continuous()` | `scale_color_continuous()` |
| `scale_color_discrete()` | `scale_color_discrete()` |
| `scale_color_viridis_c()` | `scale_color_viridis()` |
| `scale_color_viridis_d()` | `scale_color_viridis()` |
| `scale_color_manual()` | `scale_color_manual()` |
| `scale_fill_*()` | `scale_fill_*()` |

### Other Scales

| ggplot2 | ggterm |
|---------|--------|
| `scale_size_continuous()` | `scale_size_continuous()` |
| `scale_size_area()` | `scale_size_area()` |
| `scale_alpha_continuous()` | `scale_alpha_continuous()` |
| `scale_shape_manual()` | `scale_shape_manual()` |

## Statistical Transformations

| ggplot2 | ggterm |
|---------|--------|
| `stat_bin()` | `stat_bin()` |
| `stat_density()` | `stat_density()` |
| `stat_smooth()` | `stat_smooth()` |
| `stat_summary()` | `stat_summary()` |
| `stat_boxplot()` | `stat_boxplot()` |

## Faceting

### facet_wrap

**ggplot2:**
```r
ggplot(data, aes(x, y)) +
  geom_point() +
  facet_wrap(~category, ncol = 3)
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category', { ncol: 3 }))
```

### facet_grid

**ggplot2:**
```r
ggplot(data, aes(x, y)) +
  geom_point() +
  facet_grid(rows = vars(row_var), cols = vars(col_var))
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_grid({ rows: 'row_var', cols: 'col_var' }))
```

## Coordinates

| ggplot2 | ggterm |
|---------|--------|
| `coord_cartesian()` | `coordCartesian()` |
| `coord_flip()` | `coordFlip()` |
| `coord_polar()` | `coordPolar()` |
| `coord_fixed()` | Not supported |
| `coord_map()` | Not supported |

## Themes

### Built-in Themes

| ggplot2 | ggterm |
|---------|--------|
| `theme_minimal()` | `themeMinimal()` |
| `theme_classic()` | `themeClassic()` |
| `theme_dark()` | `themeDark()` |
| `theme_void()` | `themeVoid()` |
| `theme_bw()` | `defaultTheme()` |

### Custom Themes

**ggplot2:**
```r
ggplot(data) +
  theme(
    panel.background = element_rect(fill = "white"),
    axis.text = element_text(color = "gray"),
    plot.title = element_text(face = "bold")
  )
```

**ggterm:**
```typescript
gg(data).theme({
  panel: { background: '#ffffff' },
  axis: { text: { color: '#808080' } },
  title: { bold: true }
})
```

## Labels

**ggplot2:**
```r
ggplot(data, aes(x, y)) +
  labs(
    title = "Main Title",
    subtitle = "Subtitle",
    x = "X Axis",
    y = "Y Axis",
    caption = "Source: Data"
  )
```

**ggterm:**
```typescript
gg(data)
  .aes({ x: 'x', y: 'y' })
  .labs({
    title: 'Main Title',
    subtitle: 'Subtitle',
    x: 'X Axis',
    y: 'Y Axis',
    caption: 'Source: Data'
  })
```

## Annotations

**ggplot2:**
```r
ggplot(data, aes(x, y)) +
  geom_point() +
  annotate("text", x = 5, y = 10, label = "Note") +
  annotate("rect", xmin = 1, xmax = 3, ymin = 5, ymax = 15, alpha = 0.2)
```

**ggterm:**
```typescript
import { annotate } from '@ggterm/core'

gg(data)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(annotate('text', { x: 5, y: 10, label: 'Note' }))
  .geom(annotate('rect', { xmin: 1, xmax: 3, ymin: 5, ymax: 15, alpha: 0.2 }))
```

## Complete Example: Volcano Plot

### ggplot2 (R)
```r
library(ggplot2)

volcano_data <- data.frame(
  log2FC = rnorm(1000),
  pvalue = runif(1000)
)
volcano_data$neglog10p <- -log10(volcano_data$pvalue)
volcano_data$significant <- abs(volcano_data$log2FC) > 1 & volcano_data$neglog10p > 2

ggplot(volcano_data, aes(x = log2FC, y = neglog10p, color = significant)) +
  geom_point(alpha = 0.6) +
  geom_hline(yintercept = 2, linetype = "dashed", color = "red") +
  geom_vline(xintercept = c(-1, 1), linetype = "dashed", color = "blue") +
  scale_color_manual(values = c("gray", "red")) +
  labs(
    title = "Volcano Plot",
    x = "log2 Fold Change",
    y = "-log10(p-value)"
  ) +
  theme_minimal()
```

### ggterm (TypeScript)
```typescript
import {
  gg,
  geom_point,
  geom_hline,
  geom_vline,
  scale_color_manual,
  themeMinimal
} from '@ggterm/core'

// Generate data
const volcanoData = Array.from({ length: 1000 }, () => {
  const log2FC = (Math.random() - 0.5) * 6
  const pvalue = Math.random()
  const neglog10p = -Math.log10(pvalue)
  const significant = Math.abs(log2FC) > 1 && neglog10p > 2
  return { log2FC, neglog10p, significant: significant ? 'yes' : 'no' }
})

const plot = gg(volcanoData)
  .aes({ x: 'log2FC', y: 'neglog10p', color: 'significant' })
  .geom(geom_point({ alpha: 0.6 }))
  .geom(geom_hline({ yintercept: 2, linetype: 'dashed', color: 'red' }))
  .geom(geom_vline({ xintercept: -1, linetype: 'dashed', color: 'blue' }))
  .geom(geom_vline({ xintercept: 1, linetype: 'dashed', color: 'blue' }))
  .scale(scale_color_manual({ values: { no: '#808080', yes: '#ff0000' } }))
  .labs({
    title: 'Volcano Plot',
    x: 'log2 Fold Change',
    y: '-log10(p-value)'
  })
  .theme(themeMinimal())

console.log(plot.render({ width: 80, height: 24 }))
```

## Tips for R Users

1. **Use TypeScript for type safety**: ggterm has full TypeScript support, catching errors at compile time.

2. **Data preparation**: Unlike R's data frames, JavaScript/TypeScript uses arrays of objects. Convert your data accordingly:
   ```typescript
   // R-style data frame thinking
   const data = [
     { x: 1, y: 2, group: 'A' },
     { x: 2, y: 4, group: 'B' },
     // ...
   ]
   ```

3. **Terminal limitations**: Terminal plots have lower resolution than GUI plots. Use appropriate bin sizes and point counts.

4. **Streaming data**: ggterm excels at real-time data - something ggplot2 doesn't support natively.

5. **Color palettes**: Terminal color support varies. Use `scale_color_viridis()` for best results across different terminals.

## See Also

- [Geometry Reference](./GEOM-REFERENCE.md) - All 68 plot types
- [API Reference](./API.md) - Complete API documentation
- [Migration from Vega-Lite](./MIGRATION-VEGALITE.md) - For Vega-Lite users
