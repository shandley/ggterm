# ggterm Geometry Reference

Quick reference for all 66 geometry types in ggterm.

## Core Statistical

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_point` | Scatter plot points | `size`, `alpha`, `shape` | `point` |
| `geom_line` | Connected line | `linetype`, `linewidth` | `line` |
| `geom_bar` | Bar chart (stat=count) | `position`, `width` | `bar` |
| `geom_col` | Bar chart (stat=identity) | `position`, `width` | `bar` |
| `geom_histogram` | Distribution histogram | `bins`, `binwidth` | `histogram` |
| `geom_density` | Kernel density estimate | `adjust`, `kernel` | `density` |
| `geom_boxplot` | Box-and-whisker | `outlier_shape`, `notch` | `boxplot` |
| `geom_violin` | Violin plot | `draw_quantiles`, `scale` | `violin` |
| `geom_area` | Filled area under line | `alpha`, `position` | `area` |
| `geom_ribbon` | Filled range (ymin/ymax) | `alpha` | `ribbon` |

## Lines & Paths

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_path` | Connect points in data order | `linewidth`, `linetype` | `path` |
| `geom_step` | Step function | `direction` ('hv', 'vh', 'mid') | `step` |
| `geom_smooth` | Fitted curve + CI | `method` ('lm', 'loess'), `se` | `smooth` |
| `geom_segment` | Line segment (x,y → xend,yend) | `arrow`, `linewidth` | `segment` |
| `geom_curve` | Curved segment | `curvature`, `arrow` | - |
| `geom_hline` | Horizontal reference line | `yintercept`, `linetype` | `hline` |
| `geom_vline` | Vertical reference line | `xintercept`, `linetype` | `vline` |
| `geom_abline` | Diagonal line (y=mx+b) | `slope`, `intercept` | `abline` |

## Distribution & Comparison

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_freqpoly` | Frequency polygon | `bins`, `binwidth` | `freqpoly` |
| `geom_qq` | Q-Q plot | `distribution` | `qq` |
| `geom_ecdf` | Empirical CDF | `show_ci`, `complement` | `ecdf` |
| `geom_ridgeline` | Stacked density ridges | `scale`, `overlap` | `ridgeline` |
| `geom_joy` | Alias for ridgeline | - | `joy` |
| `geom_beeswarm` | Jittered points avoiding overlap | `method`, `cex` | `beeswarm` |
| `geom_quasirandom` | Quasi-random jitter | - | `quasirandom` |
| `geom_rug` | Marginal tick marks | `sides` ('b', 'l', 't', 'r') | `rug` |

## Error & Uncertainty

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_errorbar` | Vertical error bars | `width` | `errorbar` |
| `geom_errorbarh` | Horizontal error bars | `height` | `errorbarh` |
| `geom_linerange` | Vertical line (no caps) | - | `linerange` |
| `geom_pointrange` | Point + vertical line | - | `pointrange` |
| `geom_crossbar` | Box with middle line | `width`, `fatten` | `crossbar` |

## 2D & Spatial

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_tile` | Rectangular tiles | `width`, `height` | `tile` |
| `geom_raster` | Fast tiles (regular grid) | - | `raster` |
| `geom_bin2d` | 2D histogram bins | `bins`, `binwidth` | `bin2d` |
| `geom_density_2d` | 2D density contours | `bandwidth` | `density_2d` |
| `geom_contour` | Contour lines | `bins`, `binwidth` | `contour` |
| `geom_contour_filled` | Filled contour regions | `bins` | `contour_filled` |
| `geom_rect` | Rectangle (xmin/xmax/ymin/ymax) | `alpha` | `rect` |

## Text & Annotation

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_text` | Text labels | `nudge_x`, `nudge_y`, `hjust` | `text` |
| `geom_label` | Text with background box | `label_padding` | `label` |

## Terminal-Optimized

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_braille` | High-res braille dots (8x) | `type` ('point', 'line') | `braille` |
| `geom_sparkline` | Inline mini chart | `show_minmax` | `sparkline` |
| `geom_bullet` | Bullet chart (KPI) | `target`, `ranges` | `bullet` |
| `geom_waffle` | Waffle/unit chart | `rows`, `cols` | `waffle` |
| `geom_lollipop` | Lollipop chart | `baseline`, `direction` | `lollipop` |
| `geom_dumbbell` | Dumbbell (before/after) | `color`, `colorEnd` | `dumbbell` |

## Genomics & Bioinformatics

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_volcano` | Differential expression | `fc_threshold`, `p_threshold`, `n_labels` | `volcano` |
| `geom_ma` | MA plot (log ratio vs mean) | `fc_threshold`, `p_col` | `ma` |
| `geom_manhattan` | GWAS Manhattan plot | `genome_wide_threshold`, `chr_col` | `manhattan` |
| `geom_heatmap` | Expression heatmap | `cluster_rows`, `cluster_cols`, `scale` | `heatmap` |
| `geom_biplot` | PCA biplot | `loadings`, `scale_arrows` | `biplot` |

## Clinical & Biostatistical

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_kaplan_meier` | Survival curves | `show_ci`, `show_censored`, `show_risk_table` | `kaplan_meier` |
| `geom_forest` | Forest plot (meta-analysis) | `null_line`, `log_scale`, `show_summary` | `forest` |
| `geom_roc` | ROC curve | `show_auc`, `show_diagonal`, `show_optimal` | `roc` |
| `geom_bland_altman` | Method agreement | `show_limits`, `show_bias`, `limit_multiplier` | `bland_altman` |

## Statistical Diagnostics

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_funnel` | Publication bias funnel | `show_contours`, `contour_levels` | `funnel` |
| `geom_control` | SPC control chart | `chart_type`, `sigma`, `show_warning` | `control` |
| `geom_scree` | PCA variance (scree) | `show_cumulative`, `show_kaiser`, `threshold` | `scree` |

## Set & Hierarchical

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_upset` | UpSet intersection plot | `sets`, `sort_by`, `min_size` | `upset` |
| `geom_dendrogram` | Hierarchical tree | `orientation`, `labels`, `k`, `cut_height` | `dendrogram` |
| `geom_treemap` | Nested rectangles by size | `layout` | `treemap` |
| `geom_sankey` | Flow diagram | `node_width`, `node_padding` | `sankey` |

## Profiling & Time

| Geom | Description | Key Options | CLI |
|------|-------------|-------------|-----|
| `geom_calendar` | GitHub-style heatmap | `weekstart` | `calendar` |
| `geom_flame` | Flame graph (bottom-up) | `palette` | `flame` |
| `geom_icicle` | Icicle chart (top-down) | `palette` | `icicle` |
| `geom_corrmat` | Correlation matrix | `method`, `show_values` | `corrmat` |

---

## CLI Quick Reference

```bash
# Basic pattern
npx ggterm-plot <file> <x> <y> [color] [title] [geom]

# Examples
npx ggterm-plot data.csv x y                           # Auto-detect geom
npx ggterm-plot data.csv x y group "Title" point       # Scatter by group
npx ggterm-plot data.csv value - - "Distribution" histogram
npx ggterm-plot results.csv log2FC pvalue gene "DE" volcano
npx ggterm-plot survival.csv time status treatment "KM" kaplan_meier

# Built-in datasets
npx ggterm-plot iris sepal_length sepal_width species "Iris" point
npx ggterm-plot mtcars mpg hp cyl "Cars" point

# Special
npx ggterm-plot data.csv x y - - point+hline@50        # Add reference line
npx ggterm-plot history                                 # View plot history
npx ggterm-plot export <id> output.html                 # Export to HTML
```

## Aesthetic Mappings

| Aesthetic | Description | Example |
|-----------|-------------|---------|
| `x` | X-axis position | `x: 'time'` |
| `y` | Y-axis position | `y: 'value'` |
| `color` | Point/line color | `color: 'group'` |
| `fill` | Fill color | `fill: 'category'` |
| `size` | Point/line size | `size: 'weight'` |
| `alpha` | Transparency | `alpha: 0.5` |
| `shape` | Point shape | `shape: 'type'` |
| `linetype` | Line style | `linetype: 'dashed'` |
| `label` | Text labels | `label: 'name'` |
| `group` | Grouping variable | `group: 'series'` |

## TypeScript Example

```typescript
import { gg, geom_point, geom_smooth, scale_color_viridis } from '@ggterm/core'

const plot = gg(data)
  .aes({ x: 'x', y: 'y', color: 'group' })
  .geom(geom_point({ size: 2, alpha: 0.7 }))
  .geom(geom_smooth({ method: 'lm', se: true }))
  .scale(scale_color_viridis())
  .labs({ title: 'My Plot', x: 'X Axis', y: 'Y Axis' })

console.log(plot.render({ width: 80, height: 25 }))
```

---

See [examples/](../examples/) for runnable code samples.
