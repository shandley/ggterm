/**
 * Data Edge Case Tests
 *
 * Comprehensive testing with unusual, extreme, and edge case data to find
 * bugs that don't appear with "normal" data. Tests cover:
 *
 * 1. Numeric extremes (very large, very small, special values)
 * 2. Empty/null/undefined handling
 * 3. Type coercion edge cases
 * 4. String edge cases (unicode, very long, special characters)
 * 5. Date edge cases
 * 6. Scale edge cases (single value, no variance, all same)
 * 7. Large data performance
 * 8. Mixed type columns
 */

import { describe, it, expect } from 'bun:test'
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
  geom_tile,
  geom_smooth,
} from '../../geoms'
import { renderToCanvas } from '../../pipeline'
import { plotSpecToVegaLite } from '../../export/vega-lite'

/**
 * Helper to test that a plot renders without throwing
 */
function assertRenders(plot: ReturnType<typeof gg>, width = 60, height = 20): void {
  expect(() => {
    const spec = plot.spec()
    renderToCanvas(spec, { width, height })
  }).not.toThrow()
}

/**
 * Helper to test that Vega-Lite export works
 */
function assertExports(plot: ReturnType<typeof gg>): void {
  expect(() => {
    const spec = plot.spec()
    const vlSpec = plotSpecToVegaLite(spec)
    // Basic validation
    expect(vlSpec.$schema).toBeDefined()
    expect(vlSpec.data).toBeDefined()
  }).not.toThrow()
}

describe('Numeric Extreme Values', () => {
  describe('Very large numbers', () => {
    const largeData = [
      { x: 1e10, y: 1e15 },
      { x: 2e10, y: 2e15 },
      { x: 3e10, y: 1.5e15 },
    ]

    it('should render scatter plot with very large numbers', () => {
      assertRenders(gg(largeData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should render line plot with very large numbers', () => {
      assertRenders(gg(largeData).aes({ x: 'x', y: 'y' }).geom(geom_line()))
    })

    it('should export to Vega-Lite with very large numbers', () => {
      assertExports(gg(largeData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Very small numbers', () => {
    const smallData = [
      { x: 1e-10, y: 1e-15 },
      { x: 2e-10, y: 2e-15 },
      { x: 3e-10, y: 1.5e-15 },
    ]

    it('should render scatter plot with very small numbers', () => {
      assertRenders(gg(smallData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should render line plot with very small numbers', () => {
      assertRenders(gg(smallData).aes({ x: 'x', y: 'y' }).geom(geom_line()))
    })
  })

  describe('Mixed magnitude numbers', () => {
    const mixedData = [
      { x: 0.001, y: 1000000 },
      { x: 0.01, y: 10000 },
      { x: 0.1, y: 100 },
      { x: 1, y: 1 },
    ]

    it('should handle orders of magnitude difference', () => {
      assertRenders(gg(mixedData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Special numeric values', () => {
    it('should handle Infinity in data', () => {
      const infData = [
        { x: 1, y: 10 },
        { x: 2, y: Infinity },
        { x: 3, y: 15 },
      ]
      // Should not crash - may filter or clamp
      assertRenders(gg(infData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle -Infinity in data', () => {
      const negInfData = [
        { x: 1, y: 10 },
        { x: 2, y: -Infinity },
        { x: 3, y: 15 },
      ]
      assertRenders(gg(negInfData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle NaN in data', () => {
      const nanData = [
        { x: 1, y: 10 },
        { x: 2, y: NaN },
        { x: 3, y: 15 },
      ]
      assertRenders(gg(nanData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle negative zero', () => {
      const negZeroData = [
        { x: -0, y: -0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]
      assertRenders(gg(negZeroData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Zero and near-zero ranges', () => {
    it('should handle all zeros', () => {
      const zeroData = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]
      assertRenders(gg(zeroData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle very small range', () => {
      const tinyRangeData = [
        { x: 1.0000001, y: 2.0000001 },
        { x: 1.0000002, y: 2.0000002 },
        { x: 1.0000003, y: 2.0000003 },
      ]
      assertRenders(gg(tinyRangeData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Negative values', () => {
    it('should handle all negative values', () => {
      const negData = [
        { x: -100, y: -50 },
        { x: -200, y: -100 },
        { x: -150, y: -75 },
      ]
      assertRenders(gg(negData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle crossing zero', () => {
      const crossZeroData = [
        { x: -10, y: -50 },
        { x: 0, y: 0 },
        { x: 10, y: 50 },
      ]
      assertRenders(gg(crossZeroData).aes({ x: 'x', y: 'y' }).geom(geom_line()))
    })

    it('should handle negative bar values', () => {
      const negBarData = [
        { x: 'A', y: -10 },
        { x: 'B', y: 20 },
        { x: 'C', y: -30 },
      ]
      assertRenders(gg(negBarData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })
  })
})

describe('Empty and Null Data', () => {
  describe('Empty arrays', () => {
    it('should handle empty data array', () => {
      assertRenders(gg([]).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should export empty data to Vega-Lite', () => {
      assertExports(gg([]).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Null and undefined values', () => {
    it('should handle null x values', () => {
      const nullXData = [
        { x: null, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
      ]
      assertRenders(gg(nullXData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle null y values', () => {
      const nullYData = [
        { x: 1, y: null },
        { x: 2, y: 20 },
        { x: 3, y: null },
      ]
      assertRenders(gg(nullYData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle undefined values', () => {
      const undefData = [
        { x: 1, y: undefined },
        { x: 2, y: 20 },
        { x: undefined, y: 15 },
      ]
      assertRenders(gg(undefData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle all null data', () => {
      const allNullData = [
        { x: null, y: null },
        { x: null, y: null },
      ]
      assertRenders(gg(allNullData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle missing fields', () => {
      const missingFieldData = [
        { x: 1 },
        { y: 20 },
        { x: 3, y: 15 },
      ]
      assertRenders(gg(missingFieldData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Empty strings', () => {
    it('should handle empty string categories', () => {
      const emptyStringData = [
        { x: '', y: 10 },
        { x: 'A', y: 20 },
        { x: '', y: 15 },
      ]
      assertRenders(gg(emptyStringData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle empty string labels', () => {
      const emptyLabelData = [
        { x: 1, y: 10, label: '' },
        { x: 2, y: 20, label: 'test' },
        { x: 3, y: 15, label: '' },
      ]
      assertRenders(gg(emptyLabelData).aes({ x: 'x', y: 'y', label: 'label' }).geom(geom_text()))
    })
  })
})

describe('String Edge Cases', () => {
  describe('Unicode and special characters', () => {
    it('should handle unicode in categories', () => {
      const unicodeData = [
        { x: '日本語', y: 10 },
        { x: 'Ελληνικά', y: 20 },
        { x: '中文', y: 15 },
        { x: '🎉🎊', y: 25 },
      ]
      assertRenders(gg(unicodeData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle unicode in labels', () => {
      const unicodeLabelData = [
        { x: 1, y: 10, label: '温度: 10°C' },
        { x: 2, y: 20, label: 'α = 0.05' },
        { x: 3, y: 15, label: '€100' },
      ]
      assertRenders(gg(unicodeLabelData).aes({ x: 'x', y: 'y', label: 'label' }).geom(geom_text()))
    })

    it('should handle special characters', () => {
      const specialData = [
        { x: '<script>', y: 10 },
        { x: '&amp;', y: 20 },
        { x: '"quotes"', y: 15 },
        { x: "it's", y: 25 },
      ]
      assertRenders(gg(specialData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle newlines and tabs', () => {
      const whitespaceData = [
        { x: 'line1\nline2', y: 10 },
        { x: 'tab\there', y: 20 },
        { x: 'normal', y: 15 },
      ]
      assertRenders(gg(whitespaceData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })
  })

  describe('Very long strings', () => {
    it('should handle very long category names', () => {
      const longStringData = [
        { x: 'A'.repeat(100), y: 10 },
        { x: 'B'.repeat(100), y: 20 },
        { x: 'C'.repeat(100), y: 15 },
      ]
      assertRenders(gg(longStringData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle very long labels', () => {
      const longLabelData = [
        { x: 1, y: 10, label: 'Very long label text '.repeat(10) },
        { x: 2, y: 20, label: 'Short' },
      ]
      assertRenders(gg(longLabelData).aes({ x: 'x', y: 'y', label: 'label' }).geom(geom_text()))
    })
  })

  describe('Numeric strings', () => {
    it('should handle numeric strings as categories', () => {
      const numStringData = [
        { x: '1', y: 10 },
        { x: '2', y: 20 },
        { x: '10', y: 15 }, // Would sort wrong if treated as string
      ]
      assertRenders(gg(numStringData).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle mixed numeric and string categories', () => {
      const mixedData = [
        { x: 1, y: 10 },
        { x: '2', y: 20 },
        { x: 3, y: 15 },
      ]
      assertRenders(gg(mixedData as any).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })
  })
})

describe('Single Value and No Variance', () => {
  describe('Single data point', () => {
    it('should render single point', () => {
      assertRenders(gg([{ x: 5, y: 10 }]).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should render single bar', () => {
      assertRenders(gg([{ x: 'A', y: 10 }]).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle histogram with single value', () => {
      assertRenders(gg([{ x: 5 }]).aes({ x: 'x' }).geom(geom_histogram()))
    })

    it('should handle boxplot with single value', () => {
      assertRenders(gg([{ x: 'A', y: 10 }]).aes({ x: 'x', y: 'y' }).geom(geom_boxplot()))
    })
  })

  describe('Two data points', () => {
    it('should render line with two points', () => {
      assertRenders(
        gg([{ x: 1, y: 10 }, { x: 2, y: 20 }])
          .aes({ x: 'x', y: 'y' })
          .geom(geom_line())
      )
    })

    it('should render area with two points', () => {
      assertRenders(
        gg([{ x: 1, y: 10 }, { x: 2, y: 20 }])
          .aes({ x: 'x', y: 'y' })
          .geom(geom_area())
      )
    })
  })

  describe('No variance (all same value)', () => {
    it('should handle constant x', () => {
      const constXData = [
        { x: 5, y: 10 },
        { x: 5, y: 20 },
        { x: 5, y: 15 },
      ]
      assertRenders(gg(constXData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle constant y', () => {
      const constYData = [
        { x: 1, y: 10 },
        { x: 2, y: 10 },
        { x: 3, y: 10 },
      ]
      assertRenders(gg(constYData).aes({ x: 'x', y: 'y' }).geom(geom_line()))
    })

    it('should handle histogram with no variance', () => {
      const noVarData = Array(20).fill({ x: 5 })
      assertRenders(gg(noVarData).aes({ x: 'x' }).geom(geom_histogram()))
    })

    it('should handle boxplot with no variance', () => {
      const noVarData = Array(10).fill({ x: 'A', y: 5 })
      assertRenders(gg(noVarData).aes({ x: 'x', y: 'y' }).geom(geom_boxplot()))
    })
  })
})

describe('Large Data Performance', () => {
  describe('Many data points', () => {
    it('should handle 1,000 points', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        x: i,
        y: Math.sin(i / 100) * 50 + 50,
      }))

      const start = performance.now()
      assertRenders(gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()))
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(500) // Should complete in under 500ms
    })

    it('should handle 10,000 points', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        x: i,
        y: Math.random() * 100,
      }))

      const start = performance.now()
      assertRenders(gg(data).aes({ x: 'x', y: 'y' }).geom(geom_point()))
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(2000) // Should complete in under 2s
    })

    it('should handle histogram with 10,000 values', () => {
      const data = Array.from({ length: 10000 }, () => ({
        x: Math.random() * 100,
      }))

      const start = performance.now()
      assertRenders(gg(data).aes({ x: 'x' }).geom(geom_histogram()))
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(2000)
    })
  })

  describe('Many categories', () => {
    it('should handle 100 categories', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        x: `Category ${i}`,
        y: Math.random() * 100,
      }))

      assertRenders(gg(data).aes({ x: 'x', y: 'y' }).geom(geom_col()), 200, 30)
    })

    it('should handle 50 groups in boxplot', () => {
      const data = Array.from({ length: 500 }, (_, i) => ({
        x: `Group ${i % 50}`,
        y: Math.random() * 100,
      }))

      assertRenders(gg(data).aes({ x: 'x', y: 'y' }).geom(geom_boxplot()), 200, 30)
    })
  })
})

describe('Type Coercion', () => {
  describe('Numbers as strings', () => {
    it('should handle string numbers in numeric field', () => {
      const stringNumData = [
        { x: '1', y: '10' },
        { x: '2', y: '20' },
        { x: '3', y: '15' },
      ]
      assertRenders(gg(stringNumData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })

    it('should handle scientific notation strings', () => {
      const sciData = [
        { x: '1e5', y: '2.5e-3' },
        { x: '2e5', y: '5e-3' },
      ]
      assertRenders(gg(sciData as any).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })

  describe('Boolean values', () => {
    it('should handle boolean as category', () => {
      const boolData = [
        { x: true, y: 10 },
        { x: false, y: 20 },
        { x: true, y: 15 },
      ]
      assertRenders(gg(boolData as any).aes({ x: 'x', y: 'y' }).geom(geom_col()))
    })

    it('should handle boolean in color aesthetic', () => {
      const boolColorData = [
        { x: 1, y: 10, success: true },
        { x: 2, y: 20, success: false },
        { x: 3, y: 15, success: true },
      ]
      assertRenders(gg(boolColorData as any).aes({ x: 'x', y: 'y', color: 'success' }).geom(geom_point()))
    })
  })

  describe('Objects and arrays', () => {
    it('should handle objects in data (should use string representation)', () => {
      const objData = [
        { x: 1, y: 10, meta: { id: 1 } },
        { x: 2, y: 20, meta: { id: 2 } },
      ]
      // Should render x, y without crashing
      assertRenders(gg(objData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
    })
  })
})

describe('Heatmap/Tile Edge Cases', () => {
  it('should handle single tile', () => {
    assertRenders(
      gg([{ x: 1, y: 1, fill: 10 }])
        .aes({ x: 'x', y: 'y', fill: 'fill' })
        .geom(geom_tile())
    )
  })

  it('should handle sparse grid', () => {
    const sparseData = [
      { x: 1, y: 1, fill: 10 },
      { x: 5, y: 5, fill: 20 },
      { x: 10, y: 10, fill: 30 },
    ]
    assertRenders(gg(sparseData).aes({ x: 'x', y: 'y', fill: 'fill' }).geom(geom_tile()))
  })

  it('should handle negative fill values', () => {
    const negFillData = [
      { x: 1, y: 1, fill: -10 },
      { x: 1, y: 2, fill: 0 },
      { x: 2, y: 1, fill: 10 },
      { x: 2, y: 2, fill: -5 },
    ]
    assertRenders(gg(negFillData).aes({ x: 'x', y: 'y', fill: 'fill' }).geom(geom_tile()))
  })
})

describe('Stat Transform Edge Cases', () => {
  describe('Histogram edge cases', () => {
    it('should handle single bin', () => {
      assertRenders(
        gg([{ x: 5 }, { x: 5 }, { x: 5 }])
          .aes({ x: 'x' })
          .geom(geom_histogram({ bins: 1 }))
      )
    })

    it('should handle many bins (more than data points)', () => {
      assertRenders(
        gg([{ x: 1 }, { x: 2 }, { x: 3 }])
          .aes({ x: 'x' })
          .geom(geom_histogram({ bins: 100 }))
      )
    })
  })

  describe('Smooth edge cases', () => {
    it('should handle minimum points for smooth', () => {
      assertRenders(
        gg([{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 15 }])
          .aes({ x: 'x', y: 'y' })
          .geom(geom_smooth())
      )
    })

    it('should handle perfectly linear data', () => {
      const linearData = Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i * 2 + 5,
      }))
      assertRenders(gg(linearData).aes({ x: 'x', y: 'y' }).geom(geom_smooth()))
    })
  })
})

describe('Vega-Lite Export Edge Cases', () => {
  it('should export plot with special characters in labels', () => {
    const plot = gg([{ x: 1, y: 10 }])
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .labs({ title: 'Test "title" with <special> & chars' })

    assertExports(plot)
  })

  it('should export plot with unicode title', () => {
    const plot = gg([{ x: 1, y: 10 }])
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .labs({ title: '日本語タイトル 📊' })

    assertExports(plot)
  })

  it('should export plot with very long title', () => {
    const plot = gg([{ x: 1, y: 10 }])
      .aes({ x: 'x', y: 'y' })
      .geom(geom_point())
      .labs({ title: 'A'.repeat(500) })

    assertExports(plot)
  })

  it('should handle export of empty data', () => {
    assertExports(gg([]).aes({ x: 'x', y: 'y' }).geom(geom_point()))
  })

  it('should handle export with Infinity in data', () => {
    const infData = [
      { x: 1, y: 10 },
      { x: 2, y: Infinity },
    ]
    assertExports(gg(infData).aes({ x: 'x', y: 'y' }).geom(geom_point()))
  })
})

describe('Edge Case Coverage Summary', () => {
  it('documents all edge case categories tested', () => {
    const categories = [
      'Very large numbers',
      'Very small numbers',
      'Special values (NaN, Infinity)',
      'Zero and near-zero ranges',
      'Negative values',
      'Empty/null/undefined',
      'Unicode and special characters',
      'Very long strings',
      'Single data point',
      'No variance',
      'Large data (10k+ points)',
      'Type coercion',
      'Heatmap edge cases',
      'Stat transform edge cases',
      'Vega-Lite export edge cases',
    ]

    console.log('\nEdge Case Categories Tested:')
    categories.forEach((cat, i) => console.log(`  ${i + 1}. ${cat}`))
    console.log(`  Total categories: ${categories.length}`)

    expect(categories.length).toBeGreaterThan(10)
  })
})
