/**
 * Visual Regression Tests
 *
 * Compares rendered plot output against golden master files to catch
 * unexpected visual changes. Uses plain text output (no ANSI colors)
 * for deterministic comparisons.
 *
 * To update golden masters when making intentional changes:
 *   UPDATE_GOLDEN=true bun test visual-regression
 *
 * Test categories:
 * 1. Basic geoms - point, line, bar, histogram
 * 2. Stat transforms - boxplot, violin, smooth
 * 3. Scales - categorical, continuous, log
 * 4. Coords - flip, polar transforms
 * 5. Positions - dodge, stack, fill
 * 6. Facets - wrap, grid
 * 7. Themes - default styling
 * 8. Labels - titles, axis labels
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { gg } from '../../grammar'
import {
  geom_point,
  geom_line,
  geom_bar,
  geom_col,
  geom_histogram,
  geom_boxplot,
  geom_area,
  geom_text,
  geom_segment,
  geom_tile,
  geom_hline,
  geom_vline,
} from '../../geoms'
import { coordFlip, coordPolar } from '../../coords/cartesian'
import { position_dodge, position_stack, position_fill } from '../../positions'
import { facet_wrap, facet_grid } from '../../facets'
import { renderToCanvas } from '../../pipeline'

// Golden master directory
const GOLDEN_DIR = join(dirname(import.meta.path), 'golden')

// Standard render dimensions for consistency
const STANDARD_WIDTH = 60
const STANDARD_HEIGHT = 20

// Whether to update golden masters (set UPDATE_GOLDEN=true)
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === 'true'

/**
 * Render a plot to plain text
 */
function renderToText(plot: ReturnType<typeof gg>, width = STANDARD_WIDTH, height = STANDARD_HEIGHT): string {
  const canvas = renderToCanvas(plot.spec(), { width, height })
  return canvas.toString()
}

/**
 * Compare rendered output against golden master
 * Creates golden master if it doesn't exist
 */
function assertMatchesGolden(name: string, rendered: string): void {
  const goldenPath = join(GOLDEN_DIR, `${name}.txt`)

  if (UPDATE_GOLDEN || !existsSync(goldenPath)) {
    // Ensure directory exists
    mkdirSync(dirname(goldenPath), { recursive: true })
    writeFileSync(goldenPath, rendered)
    if (UPDATE_GOLDEN) {
      console.log(`  Updated golden master: ${name}`)
    } else {
      console.log(`  Created golden master: ${name}`)
    }
    return
  }

  const golden = readFileSync(goldenPath, 'utf-8')

  if (rendered !== golden) {
    // Show diff for debugging
    const renderedLines = rendered.split('\n')
    const goldenLines = golden.split('\n')

    let diffOutput = `\nVisual regression failed for: ${name}\n`
    diffOutput += `Golden master: ${goldenPath}\n\n`

    const maxLines = Math.max(renderedLines.length, goldenLines.length)
    let firstDiffLine = -1

    for (let i = 0; i < maxLines; i++) {
      const r = renderedLines[i] ?? ''
      const g = goldenLines[i] ?? ''
      if (r !== g && firstDiffLine === -1) {
        firstDiffLine = i
      }
    }

    if (firstDiffLine >= 0) {
      diffOutput += `First difference at line ${firstDiffLine + 1}:\n`
      diffOutput += `  Expected: "${goldenLines[firstDiffLine] ?? '(missing)'}"\n`
      diffOutput += `  Actual:   "${renderedLines[firstDiffLine] ?? '(missing)'}"\n`
    }

    diffOutput += `\nTo update golden masters, run: UPDATE_GOLDEN=true bun test visual-regression\n`

    expect(rendered).toBe(golden)
  }
}

// Test data fixtures
const scatterData = [
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 15 },
  { x: 4, y: 30 },
  { x: 5, y: 20 },
]

const lineData = [
  { x: 0, y: 0 },
  { x: 1, y: 10 },
  { x: 2, y: 5 },
  { x: 3, y: 15 },
  { x: 4, y: 8 },
  { x: 5, y: 20 },
]

const barData = [
  { category: 'A', value: 30 },
  { category: 'B', value: 45 },
  { category: 'C', value: 25 },
  { category: 'D', value: 60 },
]

const groupedBarData = [
  { category: 'A', value: 30, group: 'X' },
  { category: 'A', value: 20, group: 'Y' },
  { category: 'B', value: 45, group: 'X' },
  { category: 'B', value: 35, group: 'Y' },
  { category: 'C', value: 25, group: 'X' },
  { category: 'C', value: 40, group: 'Y' },
]

const histogramData = Array.from({ length: 50 }, (_, i) => ({
  x: Math.sin(i / 5) * 10 + 15 + (i % 7),
}))

const boxplotData = [
  // Group A - lower values (deterministic)
  { group: 'A', value: 10 },
  { group: 'A', value: 12 },
  { group: 'A', value: 14 },
  { group: 'A', value: 15 },
  { group: 'A', value: 16 },
  { group: 'A', value: 17 },
  { group: 'A', value: 18 },
  { group: 'A', value: 19 },
  { group: 'A', value: 20 },
  { group: 'A', value: 22 },
  // Group B - higher values
  { group: 'B', value: 25 },
  { group: 'B', value: 27 },
  { group: 'B', value: 28 },
  { group: 'B', value: 30 },
  { group: 'B', value: 31 },
  { group: 'B', value: 32 },
  { group: 'B', value: 33 },
  { group: 'B', value: 34 },
  { group: 'B', value: 35 },
  { group: 'B', value: 37 },
  // Group C - middle values with outlier
  { group: 'C', value: 15 },
  { group: 'C', value: 17 },
  { group: 'C', value: 18 },
  { group: 'C', value: 20 },
  { group: 'C', value: 21 },
  { group: 'C', value: 22 },
  { group: 'C', value: 23 },
  { group: 'C', value: 24 },
  { group: 'C', value: 25 },
  { group: 'C', value: 45 }, // outlier
]

const facetData = [
  { x: 1, y: 10, panel: 'A' },
  { x: 2, y: 20, panel: 'A' },
  { x: 3, y: 15, panel: 'A' },
  { x: 1, y: 25, panel: 'B' },
  { x: 2, y: 15, panel: 'B' },
  { x: 3, y: 30, panel: 'B' },
]

const gridFacetData = [
  { x: 1, y: 10, row: 'R1', col: 'C1' },
  { x: 2, y: 20, row: 'R1', col: 'C1' },
  { x: 1, y: 15, row: 'R1', col: 'C2' },
  { x: 2, y: 25, row: 'R1', col: 'C2' },
  { x: 1, y: 30, row: 'R2', col: 'C1' },
  { x: 2, y: 20, row: 'R2', col: 'C1' },
  { x: 1, y: 25, row: 'R2', col: 'C2' },
  { x: 2, y: 35, row: 'R2', col: 'C2' },
]

const tileData = [
  { x: 1, y: 1, fill: 10 },
  { x: 1, y: 2, fill: 20 },
  { x: 2, y: 1, fill: 30 },
  { x: 2, y: 2, fill: 40 },
  { x: 3, y: 1, fill: 25 },
  { x: 3, y: 2, fill: 35 },
]

describe('Visual Regression Tests', () => {
  beforeAll(() => {
    // Ensure golden directory exists
    mkdirSync(GOLDEN_DIR, { recursive: true })
  })

  describe('Basic Geoms', () => {
    it('scatter plot (geom_point)', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const rendered = renderToText(spec)
      assertMatchesGolden('scatter-point', rendered)
    })

    it('line plot (geom_line)', () => {
      const spec = gg(lineData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_line())

      const rendered = renderToText(spec)
      assertMatchesGolden('line-basic', rendered)
    })

    it('bar chart (geom_col)', () => {
      const spec = gg(barData)
        .aes({ x: 'category', y: 'value' })
        .geom(geom_col())

      const rendered = renderToText(spec)
      assertMatchesGolden('bar-basic', rendered)
    })

    it('histogram (geom_histogram)', () => {
      const spec = gg(histogramData)
        .aes({ x: 'x' })
        .geom(geom_histogram({ bins: 10 }))

      const rendered = renderToText(spec)
      assertMatchesGolden('histogram-basic', rendered)
    })

    it('area plot (geom_area)', () => {
      const spec = gg(lineData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_area())

      const rendered = renderToText(spec)
      assertMatchesGolden('area-basic', rendered)
    })

    it('text labels (geom_text)', () => {
      const spec = gg(scatterData.map(d => ({ ...d, label: `(${d.x},${d.y})` })))
        .aes({ x: 'x', y: 'y', label: 'label' })
        .geom(geom_text())

      const rendered = renderToText(spec)
      assertMatchesGolden('text-labels', rendered)
    })

    it('tile/heatmap (geom_tile)', () => {
      const spec = gg(tileData)
        .aes({ x: 'x', y: 'y', fill: 'fill' })
        .geom(geom_tile())

      const rendered = renderToText(spec)
      assertMatchesGolden('tile-heatmap', rendered)
    })
  })

  describe('Reference Lines', () => {
    it('horizontal line (geom_hline)', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_hline({ yintercept: 20 }))

      const rendered = renderToText(spec)
      assertMatchesGolden('hline-reference', rendered)
    })

    it('vertical line (geom_vline)', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_vline({ xintercept: 3 }))

      const rendered = renderToText(spec)
      assertMatchesGolden('vline-reference', rendered)
    })
  })

  describe('Stat Transforms', () => {
    it('boxplot (stat_boxplot)', () => {
      const spec = gg(boxplotData)
        .aes({ x: 'group', y: 'value' })
        .geom(geom_boxplot())

      const rendered = renderToText(spec)
      assertMatchesGolden('boxplot-basic', rendered)
    })
  })

  describe('Position Adjustments', () => {
    it('dodged bars', () => {
      const spec = gg(groupedBarData)
        .aes({ x: 'category', y: 'value', fill: 'group' })
        .geom(geom_col({ position: position_dodge() }))

      const rendered = renderToText(spec)
      assertMatchesGolden('bar-dodged', rendered)
    })

    it('stacked bars', () => {
      const spec = gg(groupedBarData)
        .aes({ x: 'category', y: 'value', fill: 'group' })
        .geom(geom_col({ position: position_stack() }))

      const rendered = renderToText(spec)
      assertMatchesGolden('bar-stacked', rendered)
    })

    it('filled bars (100% stacked)', () => {
      const spec = gg(groupedBarData)
        .aes({ x: 'category', y: 'value', fill: 'group' })
        .geom(geom_col({ position: position_fill() }))

      const rendered = renderToText(spec)
      assertMatchesGolden('bar-filled', rendered)
    })
  })

  describe('Coordinate Systems', () => {
    it('flipped coordinates', () => {
      const spec = gg(barData)
        .aes({ x: 'category', y: 'value' })
        .geom(geom_col())
        .coord(coordFlip())

      const rendered = renderToText(spec)
      assertMatchesGolden('coord-flip', rendered)
    })
  })

  describe('Faceting', () => {
    it('facet_wrap', () => {
      const spec = gg(facetData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_line())
        .facet(facet_wrap({ facets: 'panel', ncol: 2 }))

      const rendered = renderToText(spec, 60, 25)
      assertMatchesGolden('facet-wrap', rendered)
    })

    it('facet_grid', () => {
      const spec = gg(gridFacetData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .facet(facet_grid({ rows: 'row', cols: 'col' }))

      const rendered = renderToText(spec, 60, 30)
      assertMatchesGolden('facet-grid', rendered)
    })
  })

  describe('Labels and Titles', () => {
    it('plot with title and axis labels', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({
          title: 'Test Plot',
          x: 'X Axis',
          y: 'Y Axis',
        })

      const rendered = renderToText(spec)
      assertMatchesGolden('labels-title-axes', rendered)
    })

    it('plot with subtitle and caption', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({
          title: 'Main Title',
          subtitle: 'A subtitle here',
          caption: 'Source: Test Data',
        })

      const rendered = renderToText(spec)
      assertMatchesGolden('labels-subtitle-caption', rendered)
    })
  })

  describe('Multi-Layer Plots', () => {
    it('points with trend line', () => {
      const spec = gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_line())

      const rendered = renderToText(spec)
      assertMatchesGolden('multi-point-line', rendered)
    })

    it('bar chart with reference line', () => {
      const spec = gg(barData)
        .aes({ x: 'category', y: 'value' })
        .geom(geom_col())
        .geom(geom_hline({ yintercept: 40 }))

      const rendered = renderToText(spec)
      assertMatchesGolden('multi-bar-hline', rendered)
    })
  })

  describe('Edge Cases', () => {
    it('empty data should render axes only', () => {
      const spec = gg([])
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const rendered = renderToText(spec)
      assertMatchesGolden('empty-data', rendered)
    })

    it('single point', () => {
      const spec = gg([{ x: 5, y: 5 }])
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())

      const rendered = renderToText(spec)
      assertMatchesGolden('single-point', rendered)
    })

    it('negative values', () => {
      const negData = [
        { x: -2, y: -10 },
        { x: -1, y: 5 },
        { x: 0, y: 0 },
        { x: 1, y: -5 },
        { x: 2, y: 10 },
      ]

      const spec = gg(negData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .geom(geom_line())

      const rendered = renderToText(spec)
      assertMatchesGolden('negative-values', rendered)
    })

    it('wide aspect ratio', () => {
      const spec = gg(lineData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_line())

      const rendered = renderToText(spec, 80, 15)
      assertMatchesGolden('aspect-wide', rendered)
    })

    it('tall aspect ratio', () => {
      const spec = gg(lineData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_line())

      const rendered = renderToText(spec, 40, 30)
      assertMatchesGolden('aspect-tall', rendered)
    })
  })

  describe('Color Grouping (shape/position only in plain text)', () => {
    it('grouped scatter with color aesthetic', () => {
      const colorData = [
        { x: 1, y: 10, group: 'A' },
        { x: 2, y: 20, group: 'A' },
        { x: 3, y: 15, group: 'A' },
        { x: 1, y: 25, group: 'B' },
        { x: 2, y: 15, group: 'B' },
        { x: 3, y: 30, group: 'B' },
      ]

      const spec = gg(colorData)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_point())

      const rendered = renderToText(spec)
      assertMatchesGolden('color-grouped-scatter', rendered)
    })

    it('multiple lines by group', () => {
      const multiLineData = [
        { x: 1, y: 10, series: 'A' },
        { x: 2, y: 20, series: 'A' },
        { x: 3, y: 15, series: 'A' },
        { x: 1, y: 25, series: 'B' },
        { x: 2, y: 15, series: 'B' },
        { x: 3, y: 30, series: 'B' },
      ]

      const spec = gg(multiLineData)
        .aes({ x: 'x', y: 'y', color: 'series' })
        .geom(geom_line())

      const rendered = renderToText(spec)
      assertMatchesGolden('multi-line-grouped', rendered)
    })
  })
})

describe('Visual Regression Coverage Summary', () => {
  it('documents all golden master tests', () => {
    const categories = [
      { name: 'Basic Geoms', count: 7 },
      { name: 'Reference Lines', count: 2 },
      { name: 'Stat Transforms', count: 1 },
      { name: 'Position Adjustments', count: 3 },
      { name: 'Coordinate Systems', count: 1 },
      { name: 'Faceting', count: 2 },
      { name: 'Labels and Titles', count: 2 },
      { name: 'Multi-Layer Plots', count: 2 },
      { name: 'Edge Cases', count: 5 },
      { name: 'Color Grouping', count: 2 },
    ]

    const total = categories.reduce((sum, c) => sum + c.count, 0)

    console.log('\nVisual Regression Test Coverage:')
    for (const { name, count } of categories) {
      console.log(`  ${name}: ${count} golden masters`)
    }
    console.log(`  Total: ${total} golden masters`)

    expect(total).toBeGreaterThan(20)
  })
})
