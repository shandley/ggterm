/**
 * Pipeline test - Verify rendering works
 *
 * This test creates a simple plot and outputs it to verify
 * the rendering pipeline is working correctly.
 *
 * Run with: bun examples/test-pipeline.ts
 */

// Direct imports for testing (bypassing package system)
import { gg } from '../packages/core/src/grammar'
import { geom_point, geom_line, geom_hline, geom_histogram, geom_boxplot } from '../packages/core/src/geoms'

// Test 1: Simple scatter plot
console.log('=== Test 1: Simple Scatter Plot ===\n')

const scatterData = [
  { x: 1, y: 1 },
  { x: 2, y: 4 },
  { x: 3, y: 2 },
  { x: 4, y: 5 },
  { x: 5, y: 3 },
  { x: 6, y: 6 },
  { x: 7, y: 4 },
  { x: 8, y: 7 },
]

const scatter = gg(scatterData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .labs({ title: 'Simple Scatter', x: 'X', y: 'Y' })

console.log(scatter.render({ width: 50, height: 15 }))
console.log('\n')

// Test 2: Scatter with color grouping
console.log('=== Test 2: Grouped Scatter Plot ===\n')

const groupedData = [
  { x: 1, y: 2, cat: 'A' },
  { x: 2, y: 3, cat: 'A' },
  { x: 3, y: 2.5, cat: 'A' },
  { x: 1.5, y: 5, cat: 'B' },
  { x: 2.5, y: 6, cat: 'B' },
  { x: 3.5, y: 5.5, cat: 'B' },
  { x: 2, y: 8, cat: 'C' },
  { x: 3, y: 9, cat: 'C' },
  { x: 4, y: 8.5, cat: 'C' },
]

const grouped = gg(groupedData)
  .aes({ x: 'x', y: 'y', color: 'cat' })
  .geom(geom_point())
  .labs({ title: 'Grouped by Category', x: 'X Axis', y: 'Y Axis', color: 'Category' })

console.log(grouped.render({ width: 60, height: 18 }))
console.log('\n')

// Test 3: Line plot
console.log('=== Test 3: Line Plot ===\n')

const lineData = [
  { time: 0, value: 10 },
  { time: 1, value: 15 },
  { time: 2, value: 12 },
  { time: 3, value: 18 },
  { time: 4, value: 20 },
  { time: 5, value: 17 },
  { time: 6, value: 22 },
  { time: 7, value: 25 },
]

const linePlot = gg(lineData)
  .aes({ x: 'time', y: 'value' })
  .geom(geom_line())
  .geom(geom_point())
  .labs({ title: 'Time Series', x: 'Time', y: 'Value' })

console.log(linePlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 4: With reference line
console.log('=== Test 4: Plot with Reference Line ===\n')

const refData = [
  { x: 1, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: 4 },
  { x: 4, y: 6 },
  { x: 5, y: 8 },
]

const refPlot = gg(refData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_hline({ yintercept: 5 }))
  .geom(geom_point())
  .labs({ title: 'With Reference Line', x: 'X', y: 'Y' })

console.log(refPlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 5: Categorical x-axis (bar chart style)
console.log('=== Test 5: Categorical X-Axis ===\n')

import { geom_bar } from '../packages/core/src/geoms'

const barData = [
  { category: 'Apple', count: 25 },
  { category: 'Banana', count: 40 },
  { category: 'Cherry', count: 15 },
  { category: 'Date', count: 30 },
  { category: 'Elder', count: 20 },
]

const barPlot = gg(barData)
  .aes({ x: 'category', y: 'count' })
  .geom(geom_bar())
  .labs({ title: 'Fruit Sales', x: 'Fruit', y: 'Count' })

console.log(barPlot.render({ width: 55, height: 15 }))
console.log('\n')

// Test 6: Size aesthetic
console.log('=== Test 6: Size Aesthetic ===\n')

const sizeData = [
  { x: 1, y: 2, value: 10 },
  { x: 2, y: 3, value: 30 },
  { x: 3, y: 1.5, value: 50 },
  { x: 4, y: 4, value: 20 },
  { x: 5, y: 3.5, value: 80 },
  { x: 6, y: 2.5, value: 100 },
  { x: 7, y: 5, value: 5 },
  { x: 8, y: 4.5, value: 60 },
]

const sizePlot = gg(sizeData)
  .aes({ x: 'x', y: 'y', size: 'value' })
  .geom(geom_point())
  .labs({ title: 'Point Size by Value', x: 'X', y: 'Y', size: 'Value' })

console.log(sizePlot.render({ width: 55, height: 15 }))
console.log('\n')

// Test 7: Size + Color aesthetics combined
console.log('=== Test 7: Size + Color Combined ===\n')

const combinedData = [
  { x: 1, y: 2, value: 10, cat: 'A' },
  { x: 2, y: 3, value: 50, cat: 'A' },
  { x: 3, y: 1.5, value: 80, cat: 'B' },
  { x: 4, y: 4, value: 20, cat: 'B' },
  { x: 5, y: 3.5, value: 90, cat: 'C' },
  { x: 6, y: 2.5, value: 40, cat: 'C' },
]

const combinedPlot = gg(combinedData)
  .aes({ x: 'x', y: 'y', size: 'value', color: 'cat' })
  .geom(geom_point())
  .labs({ title: 'Color + Size', x: 'X', y: 'Y' })

console.log(combinedPlot.render({ width: 60, height: 15 }))
console.log('\n')

// Test 8: Histogram
console.log('=== Test 8: Histogram ===\n')

// Generate some random-ish data for the histogram
const histogramData: { value: number }[] = []
// Simulating a normal-ish distribution
for (let i = 0; i < 100; i++) {
  // Simple approximation of normal distribution using sum of uniforms
  const sum = Math.random() + Math.random() + Math.random() + Math.random()
  histogramData.push({ value: (sum - 2) * 25 + 50 })  // Center around 50
}

const histPlot = gg(histogramData)
  .aes({ x: 'value', y: 'value' })  // y is placeholder, stat_bin will replace
  .geom(geom_histogram({ bins: 15 }))
  .labs({ title: 'Distribution of Values', x: 'Value', y: 'Count' })

console.log(histPlot.render({ width: 60, height: 15 }))
console.log('\n')

// Test 9: Boxplot
console.log('=== Test 9: Boxplot ===\n')

const boxplotData = [
  // Group A - lower values
  { group: 'A', value: 10 }, { group: 'A', value: 15 }, { group: 'A', value: 12 },
  { group: 'A', value: 18 }, { group: 'A', value: 14 }, { group: 'A', value: 16 },
  { group: 'A', value: 11 }, { group: 'A', value: 13 }, { group: 'A', value: 35 },  // outlier
  // Group B - medium values
  { group: 'B', value: 25 }, { group: 'B', value: 30 }, { group: 'B', value: 28 },
  { group: 'B', value: 32 }, { group: 'B', value: 27 }, { group: 'B', value: 29 },
  { group: 'B', value: 26 }, { group: 'B', value: 31 }, { group: 'B', value: 5 },  // outlier
  // Group C - higher values
  { group: 'C', value: 40 }, { group: 'C', value: 45 }, { group: 'C', value: 42 },
  { group: 'C', value: 48 }, { group: 'C', value: 44 }, { group: 'C', value: 46 },
  { group: 'C', value: 41 }, { group: 'C', value: 43 }, { group: 'C', value: 70 },  // outlier
]

const boxPlot = gg(boxplotData)
  .aes({ x: 'group', y: 'value' })
  .geom(geom_boxplot({ width: 5 }))
  .labs({ title: 'Value Distribution by Group', x: 'Group', y: 'Value' })

console.log(boxPlot.render({ width: 50, height: 18 }))
console.log('\n')

// Test 10: Density plot
console.log('=== Test 10: Density Plot ===\n')

import { geom_area } from '../packages/core/src/geoms'
import { stat_density } from '../packages/core/src/stats'

// Compute density manually and render as area
const densityData = stat_density({ n: 50 }).compute(histogramData, { x: 'value', y: 'value' })

const densityPlot = gg(densityData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_area())
  .labs({ title: 'Kernel Density Estimate', x: 'Value', y: 'Density' })

console.log(densityPlot.render({ width: 60, height: 15 }))
console.log('\n')

// Test 11: Smooth/regression line
console.log('=== Test 11: Linear Regression ===\n')

import { stat_smooth } from '../packages/core/src/stats'

const regressionData = [
  { x: 1, y: 2.1 },
  { x: 2, y: 3.8 },
  { x: 3, y: 5.2 },
  { x: 4, y: 7.1 },
  { x: 5, y: 8.9 },
  { x: 6, y: 10.2 },
  { x: 7, y: 12.8 },
  { x: 8, y: 14.1 },
]

// Compute smooth line
const smoothData = stat_smooth({ method: 'lm', n: 20 }).compute(regressionData, { x: 'x', y: 'y' })

const smoothPlot = gg(regressionData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())

// Add smooth line as second layer
const smoothLinePlot = gg(smoothData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_line())
  .labs({ title: 'With Linear Fit', x: 'X', y: 'Y' })

console.log(smoothLinePlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 12: Summary statistics
console.log('=== Test 12: Summary Statistics (Mean per Group) ===\n')

import { stat_summary } from '../packages/core/src/stats'

const summaryInputData = [
  { group: 'A', value: 10 }, { group: 'A', value: 15 }, { group: 'A', value: 12 },
  { group: 'B', value: 25 }, { group: 'B', value: 30 }, { group: 'B', value: 28 },
  { group: 'C', value: 40 }, { group: 'C', value: 45 }, { group: 'C', value: 42 },
]

// Compute summary
const summaryData = stat_summary({ funData: 'mean_se' }).compute(summaryInputData, { x: 'group', y: 'value' })

const summaryPlot = gg(summaryData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .labs({ title: 'Mean with Standard Error', x: 'Group', y: 'Mean Value' })

console.log(summaryPlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 13: Segment geom
console.log('=== Test 13: Line Segments ===\n')

import { geom_segment } from '../packages/core/src/geoms'

const segmentData = [
  { x: 1, y: 1, xend: 3, yend: 5 },
  { x: 2, y: 6, xend: 5, yend: 2 },
  { x: 4, y: 1, xend: 6, yend: 4 },
  { x: 5, y: 5, xend: 7, yend: 7 },
]

const segmentPlot = gg(segmentData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_segment({ arrow: true }))
  .labs({ title: 'Line Segments with Arrows', x: 'X', y: 'Y' })

console.log(segmentPlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 14: LOESS smoothing
console.log('=== Test 14: LOESS Smoothing ===\n')

const noiseData = [
  { x: 1, y: 2.3 },
  { x: 2, y: 4.1 },
  { x: 3, y: 3.8 },
  { x: 4, y: 5.2 },
  { x: 5, y: 4.9 },
  { x: 6, y: 6.1 },
  { x: 7, y: 5.5 },
  { x: 8, y: 7.2 },
  { x: 9, y: 6.8 },
  { x: 10, y: 8.1 },
]

const loessData = stat_smooth({ method: 'loess', span: 0.5, n: 30 }).compute(noiseData, { x: 'x', y: 'y' })

const loessPlot = gg(noiseData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())

const loessLinePlot = gg([...noiseData, ...loessData])
  .aes({ x: 'x', y: 'y' })
  .geom(geom_line())
  .labs({ title: 'LOESS Smoothing', x: 'X', y: 'Y' })

console.log(loessLinePlot.render({ width: 50, height: 15 }))
console.log('\n')

// Test 15: Facet Wrap
console.log('=== Test 15: Facet Wrap ===\n')

import { facet_wrap, facet_grid } from '../packages/core/src/facets'

const facetData = [
  // Category A
  { x: 1, y: 2, category: 'A' },
  { x: 2, y: 4, category: 'A' },
  { x: 3, y: 3, category: 'A' },
  { x: 4, y: 5, category: 'A' },
  // Category B
  { x: 1, y: 3, category: 'B' },
  { x: 2, y: 5, category: 'B' },
  { x: 3, y: 4, category: 'B' },
  { x: 4, y: 6, category: 'B' },
  // Category C
  { x: 1, y: 1, category: 'C' },
  { x: 2, y: 2, category: 'C' },
  { x: 3, y: 2.5, category: 'C' },
  { x: 4, y: 3, category: 'C' },
]

const facetWrapPlot = gg(facetData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .facet(facet_wrap('category', { ncol: 3 }))
  .labs({ title: 'Facet Wrap by Category' })

console.log(facetWrapPlot.render({ width: 70, height: 20 }))
console.log('\n')

// Test 16: Facet Grid
console.log('=== Test 16: Facet Grid ===\n')

const gridData = [
  // Treatment A, Male
  { x: 1, y: 10, treatment: 'Control', gender: 'M' },
  { x: 2, y: 12, treatment: 'Control', gender: 'M' },
  { x: 3, y: 11, treatment: 'Control', gender: 'M' },
  // Treatment A, Female
  { x: 1, y: 8, treatment: 'Control', gender: 'F' },
  { x: 2, y: 9, treatment: 'Control', gender: 'F' },
  { x: 3, y: 10, treatment: 'Control', gender: 'F' },
  // Treatment B, Male
  { x: 1, y: 15, treatment: 'Drug', gender: 'M' },
  { x: 2, y: 18, treatment: 'Drug', gender: 'M' },
  { x: 3, y: 20, treatment: 'Drug', gender: 'M' },
  // Treatment B, Female
  { x: 1, y: 12, treatment: 'Drug', gender: 'F' },
  { x: 2, y: 14, treatment: 'Drug', gender: 'F' },
  { x: 3, y: 16, treatment: 'Drug', gender: 'F' },
]

const facetGridPlot = gg(gridData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_line())
  .facet(facet_grid({ rows: 'gender', cols: 'treatment' }))
  .labs({ title: 'Facet Grid: Gender x Treatment' })

console.log(facetGridPlot.render({ width: 60, height: 22 }))
console.log('\n')

// Test 17: Facet with Free Scales
console.log('=== Test 17: Facet with Free Scales ===\n')

const freeScalesData = [
  // Group A - small values
  { x: 1, y: 0.1, group: 'Micro' },
  { x: 2, y: 0.2, group: 'Micro' },
  { x: 3, y: 0.15, group: 'Micro' },
  // Group B - large values
  { x: 1, y: 100, group: 'Macro' },
  { x: 2, y: 150, group: 'Macro' },
  { x: 3, y: 120, group: 'Macro' },
]

const freeScalesPlot = gg(freeScalesData)
  .aes({ x: 'x', y: 'y' })
  .geom(geom_point())
  .geom(geom_line())
  .facet(facet_wrap('group', { ncol: 2, scales: 'free_y' }))
  .labs({ title: 'Free Y Scales per Panel' })

console.log(freeScalesPlot.render({ width: 60, height: 18 }))
console.log('\n')

console.log('=== All tests completed ===')
