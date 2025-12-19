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

console.log('=== All tests completed ===')
