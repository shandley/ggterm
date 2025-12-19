/**
 * Comprehensive Demo - Showcases all geometries and aesthetics
 * Run with: npx bun packages/core/src/demo.ts
 */

import {
  gg,
  geom_point,
  geom_line,
  geom_path,
  geom_step,
  geom_bar,
  geom_col,
  geom_histogram,
  geom_boxplot,
  geom_area,
  geom_ribbon,
  geom_segment,
  geom_smooth,
  geom_rug,
  geom_text,
  geom_hline,
  geom_vline,
  geom_violin,
  geom_tile,
  geom_errorbar,
  geom_pointrange,
  geom_rect,
  geom_abline,
  scale_color_viridis,
  scale_fill_viridis,
  scale_color_discrete,
  scale_x_log10,
  scale_y_log10,
  scale_x_date,
  scale_y2_continuous,
  coordFlip,
  coordFixed,
  position_jitter,
  facet_wrap,
  facet_grid,
  label_both,
  label_parsed,
  as_labeller,
  themeMinimal,
  themeDark,
  renderToString,
} from './index'

const WIDTH = 70
const HEIGHT = 18
const SMALL_HEIGHT = 14

function header(title: string): void {
  console.log('\n' + '═'.repeat(WIDTH))
  console.log(`  ${title}`)
  console.log('═'.repeat(WIDTH))
}

function subheader(title: string): void {
  console.log('\n' + '─'.repeat(40))
  console.log(`  ${title}`)
  console.log('─'.repeat(40))
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

// Scatter data
const scatterData = Array.from({ length: 30 }, (_, i) => ({
  x: i + Math.random() * 5,
  y: i * 2 + Math.random() * 10 - 5,
  size: Math.random() * 10 + 1,
  group: ['A', 'B', 'C'][i % 3],
}))

// Time series data
const timeSeriesData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  value: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 5,
  trend: 50 + i * 0.5,
}))

// Categorical data
const categoryData = [
  { category: 'Alpha', value: 25, group: 'X' },
  { category: 'Beta', value: 40, group: 'X' },
  { category: 'Gamma', value: 35, group: 'X' },
  { category: 'Delta', value: 55, group: 'Y' },
  { category: 'Alpha', value: 30, group: 'Y' },
  { category: 'Beta', value: 45, group: 'Y' },
  { category: 'Gamma', value: 25, group: 'Y' },
  { category: 'Delta', value: 60, group: 'Z' },
]

// Distribution data
const distributionData = Array.from({ length: 100 }, () => ({
  value: Math.random() * 50 + Math.random() * 30 + Math.random() * 20,
}))

// Grouped distribution
const groupedDistribution = [
  ...Array.from({ length: 40 }, () => ({ value: 20 + Math.random() * 15, group: 'Control' })),
  ...Array.from({ length: 40 }, () => ({ value: 30 + Math.random() * 20, group: 'Treatment' })),
]

// Spiral data (for geom_path)
const spiralData = Array.from({ length: 80 }, (_, i) => {
  const t = i * 0.15
  return { x: t * Math.cos(t), y: t * Math.sin(t) }
})

// Step data (stock prices)
const stockData = Array.from({ length: 15 }, (_, i) => ({
  day: i + 1,
  price: 100 + (Math.random() - 0.3) * 10 * (i + 1) / 5,
}))

// Heatmap data
const heatmapData: { x: number; y: number; value: number }[] = []
for (let x = 0; x < 8; x++) {
  for (let y = 0; y < 6; y++) {
    heatmapData.push({
      x,
      y,
      value: Math.sin(x * 0.5) * Math.cos(y * 0.5) * 50 + 50,
    })
  }
}

// Error bar data
const errorData = [
  { x: 1, y: 10, ymin: 8, ymax: 12 },
  { x: 2, y: 15, ymin: 12, ymax: 18 },
  { x: 3, y: 12, ymin: 9, ymax: 15 },
  { x: 4, y: 18, ymin: 15, ymax: 21 },
  { x: 5, y: 14, ymin: 11, ymax: 17 },
]

// Dual axis data
const dualAxisData = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  temperature: 15 + Math.sin((i - 3) * Math.PI / 6) * 15,
  rainfall: 50 + Math.cos((i - 1) * Math.PI / 6) * 40,
}))

// Facet data
const facetData = [
  ...Array.from({ length: 15 }, (_, i) => ({ x: i, y: i + Math.random() * 5, panel: 'Linear' })),
  ...Array.from({ length: 15 }, (_, i) => ({ x: i, y: i * i / 10 + Math.random() * 3, panel: 'Quadratic' })),
  ...Array.from({ length: 15 }, (_, i) => ({ x: i, y: Math.sin(i * 0.5) * 5 + 7, panel: 'Sinusoidal' })),
]

// ============================================================================
// BASIC GEOMETRIES
// ============================================================================

header('BASIC GEOMETRIES')

subheader('geom_point - Scatter Plot')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .labs({ title: 'Basic Scatter Plot', x: 'X Value', y: 'Y Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_point with Color Aesthetic')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y', color: 'group' })
    .geom(geom_point())
    .labs({ title: 'Scatter with Color Groups', x: 'X', y: 'Y', color: 'Group' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_point with Size Aesthetic')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y', size: 'size' })
    .geom(geom_point())
    .labs({ title: 'Scatter with Size Mapping', x: 'X', y: 'Y', size: 'Size' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_point with position_jitter')
// Create overplotted data (many points at same locations)
const overplottedData = Array.from({ length: 50 }, (_, i) => ({
  category: ['A', 'B', 'C'][i % 3],
  value: Math.floor(i / 3) % 5 + 1,
  group: ['X', 'Y'][i % 2],
}))
console.log(renderToString(
  gg(overplottedData)
    .aes({ x: 'category', y: 'value', color: 'group' })
    .geom(geom_point({ position: position_jitter({ width: 0.3, height: 0.3 }) }))
    .labs({ title: 'Jittered Points (avoiding overplot)', x: 'Category', y: 'Value', color: 'Group' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_line - Line Plot')
console.log(renderToString(
  gg(timeSeriesData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .labs({ title: 'Time Series Line Plot', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_step - Step Plot')
console.log(renderToString(
  gg(stockData)
    .aes({ x: 'day', y: 'price' })
    .geom(geom_step())
    .labs({ title: 'Stock Price (Step Plot)', x: 'Day', y: 'Price' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_step with direction="vh"')
console.log(renderToString(
  gg(stockData)
    .aes({ x: 'day', y: 'price' })
    .geom(geom_step({ direction: 'vh' }))
    .labs({ title: 'Step Plot (Vertical First)', x: 'Day', y: 'Price' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_path - Ordered Path (Spiral)')
console.log(renderToString(
  gg(spiralData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_path())
    .labs({ title: 'Spiral Path (Data Order Preserved)', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_area - Filled Area')
console.log(renderToString(
  gg(timeSeriesData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_area())
    .labs({ title: 'Filled Area Chart', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// BAR CHARTS
// ============================================================================

header('BAR CHARTS')

subheader('geom_bar - Bar Chart')
console.log(renderToString(
  gg(categoryData.filter(d => d.group === 'X'))
    .aes({ x: 'category', y: 'value' })
    .geom(geom_bar())
    .labs({ title: 'Simple Bar Chart', x: 'Category', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_bar with Color')
console.log(renderToString(
  gg(categoryData.filter(d => d.group === 'X'))
    .aes({ x: 'category', y: 'value', color: 'category' })
    .geom(geom_bar())
    .labs({ title: 'Colored Bar Chart', x: 'Category', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_histogram - Histogram')
console.log(renderToString(
  gg(distributionData)
    .aes({ x: 'value' })
    .geom(geom_histogram({ bins: 15 }))
    .labs({ title: 'Histogram (15 bins)', x: 'Value', y: 'Count' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('coord_flip - Horizontal Bars')
console.log(renderToString(
  gg(categoryData.filter(d => d.group === 'X'))
    .aes({ x: 'category', y: 'value' })
    .geom(geom_bar())
    .coord(coordFlip())
    .labs({ title: 'Horizontal Bar Chart', x: 'Category', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// STATISTICAL PLOTS
// ============================================================================

header('STATISTICAL PLOTS')

subheader('geom_boxplot - Box Plot')
console.log(renderToString(
  gg(groupedDistribution)
    .aes({ x: 'group', y: 'value' })
    .geom(geom_boxplot())
    .labs({ title: 'Box Plot Comparison', x: 'Group', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_violin - Violin Plot')
console.log(renderToString(
  gg(groupedDistribution)
    .aes({ x: 'group', y: 'value' })
    .geom(geom_violin())
    .labs({ title: 'Violin Plot Comparison', x: 'Group', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_smooth - Smoothed Line (Linear Regression)')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_smooth({ method: 'lm' }))
    .labs({ title: 'Scatter with Linear Fit', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_smooth - LOESS Smoothing')
console.log(renderToString(
  gg(timeSeriesData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_point())
    .geom(geom_smooth({ method: 'loess', span: 0.5 }))
    .labs({ title: 'LOESS Smoothing', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// ERROR BARS AND RANGES
// ============================================================================

header('ERROR BARS AND RANGES')

subheader('geom_errorbar - Error Bars')
console.log(renderToString(
  gg(errorData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_errorbar())
    .labs({ title: 'Points with Error Bars', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_pointrange - Point Range')
console.log(renderToString(
  gg(errorData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_pointrange())
    .labs({ title: 'Point Range Plot', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_ribbon - Confidence Band')
const ribbonData = timeSeriesData.map(d => ({
  ...d,
  ymin: d.value - 8,
  ymax: d.value + 8,
}))
console.log(renderToString(
  gg(ribbonData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_ribbon())
    .geom(geom_line())
    .labs({ title: 'Line with Confidence Ribbon', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// ANNOTATIONS AND REFERENCE LINES
// ============================================================================

header('ANNOTATIONS AND REFERENCE LINES')

subheader('geom_hline / geom_vline - Reference Lines')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_hline({ yintercept: 30 }))
    .geom(geom_vline({ xintercept: 15 }))
    .labs({ title: 'Scatter with Reference Lines', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_abline - Diagonal Reference Line')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_abline({ slope: 2, intercept: 0 }))
    .labs({ title: 'Scatter with y=2x Line', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_segment - Line Segments')
const segmentData = [
  { x: 5, y: 10, xend: 25, yend: 40 },
  { x: 10, y: 30, xend: 30, yend: 15 },
]
console.log(renderToString(
  gg(segmentData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_segment())
    .labs({ title: 'Line Segments', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_text - Text Labels')
const labelData = [
  { x: 5, y: 10, label: 'Point A' },
  { x: 15, y: 25, label: 'Point B' },
  { x: 25, y: 15, label: 'Point C' },
]
console.log(renderToString(
  gg(labelData)
    .aes({ x: 'x', y: 'y', label: 'label' })
    .geom(geom_point())
    .geom(geom_text())
    .labs({ title: 'Points with Labels', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// MARGINAL PLOTS
// ============================================================================

header('MARGINAL PLOTS')

subheader('geom_rug - Marginal Rugs (Bottom & Left)')
console.log(renderToString(
  gg(scatterData.slice(0, 20))
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_rug())
    .labs({ title: 'Scatter with Marginal Rugs', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_rug - All Four Sides')
console.log(renderToString(
  gg(scatterData.slice(0, 20))
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_rug({ sides: 'bltr' }))
    .labs({ title: 'Rugs on All Sides', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// HEATMAPS AND TILES
// ============================================================================

header('HEATMAPS AND TILES')

subheader('geom_tile - Heatmap')
console.log(renderToString(
  gg(heatmapData)
    .aes({ x: 'x', y: 'y', fill: 'value' })
    .geom(geom_tile())
    .scale(scale_fill_viridis())
    .labs({ title: 'Heatmap with Viridis Colors', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('geom_rect - Rectangles')
const rectData = [
  { xmin: 2, xmax: 8, ymin: 5, ymax: 15 },
  { xmin: 12, xmax: 18, ymin: 20, ymax: 35 },
]
console.log(renderToString(
  gg(rectData)
    .aes({ x: 'xmin', y: 'ymin' })
    .geom(geom_rect())
    .labs({ title: 'Rectangle Regions', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// SECONDARY Y-AXIS
// ============================================================================

header('SECONDARY Y-AXIS')

subheader('Dual Y-Axis Plot')
console.log(renderToString(
  gg(dualAxisData)
    .aes({ x: 'month', y: 'temperature', y2: 'rainfall' })
    .geom(geom_line())
    .scale(scale_y2_continuous({ limits: [0, 100] }))
    .labs({
      title: 'Temperature vs Rainfall',
      x: 'Month',
      y: 'Temp (°C)',
      y2: 'Rain (mm)',
    })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// SCALES AND TRANSFORMATIONS
// ============================================================================

header('SCALES AND TRANSFORMATIONS')

subheader('scale_x_log10 / scale_y_log10 - Log Scale')
const logData = Array.from({ length: 20 }, (_, i) => ({
  x: Math.pow(10, i * 0.2),
  y: Math.pow(10, i * 0.15 + Math.random() * 0.3),
}))
console.log(renderToString(
  gg(logData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_line())
    .scale(scale_x_log10())
    .scale(scale_y_log10())
    .labs({ title: 'Log-Log Scale Plot', x: 'X (log)', y: 'Y (log)' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('scale_x_date - Date Axis')
const dateData = [
  { date: '2024-01-01', value: 42 },
  { date: '2024-02-15', value: 58 },
  { date: '2024-04-01', value: 35 },
  { date: '2024-05-15', value: 72 },
  { date: '2024-07-01', value: 61 },
  { date: '2024-08-15', value: 89 },
  { date: '2024-10-01', value: 76 },
  { date: '2024-11-15', value: 54 },
]
console.log(renderToString(
  gg(dateData)
    .aes({ x: 'date', y: 'value' })
    .geom(geom_line())
    .geom(geom_point())
    .scale(scale_x_date())
    .labs({ title: 'Time Series with Date Scale', x: 'Date', y: 'Value' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('scale_color_viridis - Continuous Color')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y', color: 'size' })
    .geom(geom_point())
    .scale(scale_color_viridis())
    .labs({ title: 'Viridis Color Scale', x: 'X', y: 'Y', color: 'Size' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('coord_fixed - Fixed Aspect Ratio')
const circleData = Array.from({ length: 50 }, (_, i) => {
  const angle = (i / 50) * 2 * Math.PI
  return { x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 }
})
console.log(renderToString(
  gg(circleData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_path())
    .coord(coordFixed({ ratio: 0.5 }))
    .labs({ title: 'Circle with Fixed Aspect Ratio', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// FACETING
// ============================================================================

header('FACETING')

subheader('facet_wrap - Wrapped Panels')
console.log(renderToString(
  gg(facetData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_line())
    .facet(facet_wrap('panel', { ncol: 3 }))
    .labs({ title: 'Faceted by Pattern Type', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: 20 }
))

subheader('facet_wrap with custom labeller')
// Use as_labeller for custom label mappings
const customLabeller = as_labeller({
  'Linear': '📈 Linear',
  'Quadratic': '📊 Quadratic',
  'Sinusoidal': '〰️ Sine Wave',
})
console.log(renderToString(
  gg(facetData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .geom(geom_line())
    .facet(facet_wrap('panel', { ncol: 3, labeller: customLabeller }))
    .labs({ title: 'Custom Labeller Example', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: 20 }
))

subheader('facet_grid - Grid Layout')
const gridFacetData = [
  ...scatterData.slice(0, 10).map(d => ({ ...d, row: 'high_value', col: d.group })),
  ...scatterData.slice(10, 20).map(d => ({ ...d, row: 'low_value', col: d.group })),
]
console.log(renderToString(
  gg(gridFacetData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .facet(facet_grid({ rows: 'row', cols: 'col' }, { labeller: label_parsed }))
    .labs({ title: 'Facet Grid (label_parsed: _ → space)', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: 22 }
))

subheader('facet_grid with label_both')
console.log(renderToString(
  gg(gridFacetData)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_point())
    .facet(facet_grid({ rows: 'row', cols: 'col' }, { labeller: label_both }))
    .labs({ title: 'Facet Grid (label_both: var: value)', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH + 10, height: 22 }
))

// ============================================================================
// THEMES
// ============================================================================

header('THEMES')

subheader('theme_minimal')
console.log(renderToString(
  gg(timeSeriesData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .geom(geom_point())
    .theme(themeMinimal())
    .labs({ title: 'Minimal Theme', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: SMALL_HEIGHT }
))

subheader('theme_dark')
console.log(renderToString(
  gg(timeSeriesData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_line())
    .geom(geom_point())
    .theme(themeDark())
    .labs({ title: 'Dark Theme', x: 'Time', y: 'Value' })
    .spec(),
  { width: WIDTH, height: SMALL_HEIGHT }
))

// ============================================================================
// COMBINED EXAMPLES
// ============================================================================

header('COMBINED EXAMPLES')

subheader('Multi-Layer Scatter Plot')
console.log(renderToString(
  gg(scatterData)
    .aes({ x: 'x', y: 'y', color: 'group' })
    .geom(geom_point())
    .geom(geom_smooth({ method: 'lm', se: false }))
    .geom(geom_rug({ sides: 'bl' }))
    .labs({
      title: 'Scatter + Regression + Rugs',
      x: 'X Value',
      y: 'Y Value',
      color: 'Group',
    })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('Time Series with Trend and Confidence')
const trendData = timeSeriesData.map(d => ({
  ...d,
  trendMin: d.trend - 5,
  trendMax: d.trend + 5,
}))
console.log(renderToString(
  gg(trendData)
    .aes({ x: 'time', y: 'value' })
    .geom(geom_ribbon())
    .geom(geom_line())
    .geom(geom_point())
    .geom(geom_hline({ yintercept: 50 }))
    .labs({
      title: 'Time Series with Trend Band',
      x: 'Time',
      y: 'Value',
    })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

subheader('Lissajous Curve')
const lissajous = Array.from({ length: 200 }, (_, i) => {
  const t = (i / 200) * 4 * Math.PI
  return { x: Math.sin(3 * t), y: Math.sin(4 * t) }
})
console.log(renderToString(
  gg(lissajous)
    .aes({ x: 'x', y: 'y' })
    .geom(geom_path())
    .coord(coordFixed({ ratio: 0.5 }))
    .labs({ title: 'Lissajous Curve (3:4)', x: 'X', y: 'Y' })
    .spec(),
  { width: WIDTH, height: HEIGHT }
))

// ============================================================================
// SUMMARY
// ============================================================================

header('DEMO COMPLETE')
console.log(`
Geometries demonstrated:
  • geom_point      - Scatter plots with color/size aesthetics
  • geom_line       - Connected line plots
  • geom_path       - Ordered path (preserves data order)
  • geom_step       - Stairstep plots (hv, vh directions)
  • geom_bar        - Bar charts
  • geom_histogram  - Histograms
  • geom_boxplot    - Box plots
  • geom_violin     - Violin plots
  • geom_area       - Filled areas
  • geom_ribbon     - Confidence bands
  • geom_smooth     - Smoothed lines (lm, loess)
  • geom_rug        - Marginal rugs
  • geom_tile       - Heatmaps
  • geom_rect       - Rectangles
  • geom_segment    - Line segments
  • geom_errorbar   - Error bars
  • geom_pointrange - Point with range
  • geom_text       - Text labels
  • geom_hline      - Horizontal reference line
  • geom_vline      - Vertical reference line
  • geom_abline     - Diagonal reference line

Features demonstrated:
  • Color aesthetics (discrete and continuous)
  • Size aesthetics
  • Secondary y-axis (y2)
  • Log scales (scale_x_log10, scale_y_log10)
  • Date scales (scale_x_date)
  • Position adjustments (position_jitter)
  • Coordinate transformations (flip, fixed)
  • Faceting (wrap and grid with custom labellers)
  • Themes (minimal, dark)
  • Multi-layer plots
`)
