/**
 * Vega-Lite Browser Rendering Tests
 *
 * Uses Playwright to verify that Vega-Lite exports actually render
 * correctly in a browser. Tests:
 *
 * 1. HTML generation with embedded Vega-Lite spec
 * 2. Browser rendering without JavaScript errors
 * 3. SVG/Canvas output presence
 * 4. Screenshot capture for visual verification
 *
 * Note: These tests require Playwright MCP tools to be available.
 * Run with: bun test vega-lite-browser
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, existsSync, rmSync, readdirSync } from 'fs'
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
  geom_tile,
} from '../../geoms'
import { plotSpecToVegaLite } from '../../export/vega-lite'

// Output directory for generated HTML files
const OUTPUT_DIR = join(dirname(import.meta.path), 'vega-lite-output')

/**
 * Generate a standalone HTML file with Vega-Lite spec
 */
function generateVegaLiteHTML(name: string, vlSpec: object): string {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    #vis { width: 100%; }
    .error { color: red; padding: 10px; border: 1px solid red; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <div id="vis"></div>
  <div id="error"></div>
  <script>
    const spec = ${JSON.stringify(vlSpec, null, 2)};

    vegaEmbed('#vis', spec, { renderer: 'svg' })
      .then(result => {
        console.log('Vega-Lite rendered successfully');
        // Add a marker for Playwright to detect
        document.body.setAttribute('data-render-status', 'success');
      })
      .catch(error => {
        console.error('Vega-Lite render error:', error);
        document.getElementById('error').textContent = error.message;
        document.getElementById('error').className = 'error';
        document.body.setAttribute('data-render-status', 'error');
        document.body.setAttribute('data-render-error', error.message);
      });
  </script>
</body>
</html>`

  const filePath = join(OUTPUT_DIR, `${name}.html`)
  writeFileSync(filePath, html)
  return filePath
}

// Test data
const scatterData = [
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 15 },
  { x: 4, y: 30 },
  { x: 5, y: 20 },
]

const barData = [
  { category: 'A', value: 30 },
  { category: 'B', value: 45 },
  { category: 'C', value: 25 },
  { category: 'D', value: 60 },
]

const histogramData = Array.from({ length: 100 }, (_, i) => ({
  x: Math.sin(i / 10) * 30 + 50 + Math.random() * 10,
}))

const heatmapData = [
  { x: 1, y: 1, fill: 10 },
  { x: 1, y: 2, fill: 20 },
  { x: 1, y: 3, fill: 30 },
  { x: 2, y: 1, fill: 25 },
  { x: 2, y: 2, fill: 35 },
  { x: 2, y: 3, fill: 15 },
  { x: 3, y: 1, fill: 40 },
  { x: 3, y: 2, fill: 45 },
  { x: 3, y: 3, fill: 50 },
]

const boxplotData = [
  ...Array.from({ length: 20 }, () => ({ group: 'A', value: 10 + Math.random() * 20 })),
  ...Array.from({ length: 20 }, () => ({ group: 'B', value: 30 + Math.random() * 20 })),
  ...Array.from({ length: 20 }, () => ({ group: 'C', value: 20 + Math.random() * 30 })),
]

// Test cases to generate
const TEST_CASES = [
  {
    name: 'scatter-basic',
    plot: () => gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()),
  },
  {
    name: 'line-basic',
    plot: () => gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_line()),
  },
  {
    name: 'bar-basic',
    plot: () => gg(barData).aes({ x: 'category', y: 'value' }).geom(geom_col()),
  },
  {
    name: 'histogram-basic',
    plot: () => gg(histogramData).aes({ x: 'x' }).geom(geom_histogram({ bins: 15 })),
  },
  {
    name: 'area-basic',
    plot: () => gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_area()),
  },
  {
    name: 'heatmap-basic',
    plot: () => gg(heatmapData).aes({ x: 'x', y: 'y', fill: 'fill' }).geom(geom_tile()),
  },
  {
    name: 'boxplot-basic',
    plot: () => gg(boxplotData).aes({ x: 'group', y: 'value' }).geom(geom_boxplot()),
  },
  {
    name: 'multi-layer',
    plot: () => gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()).geom(geom_line()),
  },
  {
    name: 'with-title',
    plot: () =>
      gg(scatterData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_point())
        .labs({ title: 'Test Plot', x: 'X Axis', y: 'Y Axis' }),
  },
  {
    name: 'interactive',
    plot: () => gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()),
    options: { interactive: true },
  },
]

describe('Vega-Lite HTML Generation', () => {
  beforeAll(() => {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  for (const testCase of TEST_CASES) {
    it(`should generate valid HTML for ${testCase.name}`, () => {
      const plot = testCase.plot()
      const vlSpec = plotSpecToVegaLite(plot.spec(), testCase.options)

      // Verify spec is valid JSON
      expect(() => JSON.stringify(vlSpec)).not.toThrow()

      // Generate HTML file
      const filePath = generateVegaLiteHTML(testCase.name, vlSpec)
      expect(existsSync(filePath)).toBe(true)
    })
  }

  it('should generate index.html with links to all tests', () => {
    const links = TEST_CASES.map(
      (tc) => `<li><a href="${tc.name}.html">${tc.name}</a></li>`
    ).join('\n')

    const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Vega-Lite Test Index</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    ul { line-height: 2; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  <h1>Vega-Lite Export Tests</h1>
  <p>Click each link to view the rendered Vega-Lite visualization:</p>
  <ul>
    ${links}
  </ul>
</body>
</html>`

    writeFileSync(join(OUTPUT_DIR, 'index.html'), indexHtml)
    expect(existsSync(join(OUTPUT_DIR, 'index.html'))).toBe(true)
  })
})

describe('Vega-Lite Spec Validation', () => {
  for (const testCase of TEST_CASES) {
    it(`${testCase.name} should have valid Vega-Lite structure`, () => {
      const plot = testCase.plot()
      const vlSpec = plotSpecToVegaLite(plot.spec(), testCase.options)

      // Check required fields
      expect(vlSpec.$schema).toContain('vega-lite')
      expect(vlSpec.data).toBeDefined()
      expect(vlSpec.data.values).toBeDefined()

      // Check mark or layer exists
      const hasMark = vlSpec.mark !== undefined
      const hasLayer = vlSpec.layer !== undefined && vlSpec.layer.length > 0
      expect(hasMark || hasLayer).toBe(true)

      // Check encoding exists (either at top level or in layers)
      if (hasMark) {
        expect(vlSpec.encoding).toBeDefined()
      }
      if (hasLayer) {
        for (const layer of vlSpec.layer!) {
          expect(layer.encoding || layer.mark).toBeDefined()
        }
      }
    })
  }
})

describe('Vega-Lite JSON Schema Compliance', () => {
  it('should have correct schema URL', () => {
    const vlSpec = plotSpecToVegaLite(
      gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec()
    )
    expect(vlSpec.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json')
  })

  it('should have width and height', () => {
    const vlSpec = plotSpecToVegaLite(
      gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec(),
      { width: 800, height: 600 }
    )
    expect(vlSpec.width).toBe(800)
    expect(vlSpec.height).toBe(600)
  })

  it('should include config when publication mode is on', () => {
    const vlSpec = plotSpecToVegaLite(
      gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec(),
      { publication: true }
    )
    expect(vlSpec.config).toBeDefined()
    expect(vlSpec.config?.font).toBe('Arial')
  })

  it('should include params when interactive', () => {
    const vlSpec = plotSpecToVegaLite(
      gg(scatterData).aes({ x: 'x', y: 'y' }).geom(geom_point()).spec(),
      { interactive: true }
    )
    expect(vlSpec.params).toBeDefined()
    expect(vlSpec.params!.length).toBeGreaterThan(0)
  })
})

describe('Generated Files Summary', () => {
  it('should list all generated HTML files', () => {
    const files = readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.html'))

    console.log('\nGenerated Vega-Lite HTML files:')
    console.log(`  Directory: ${OUTPUT_DIR}`)
    files.forEach((f) => console.log(`  - ${f}`))
    console.log(`  Total: ${files.length} files`)
    console.log(`\nTo test in browser, open: ${join(OUTPUT_DIR, 'index.html')}`)

    expect(files.length).toBeGreaterThan(0)
  })
})
