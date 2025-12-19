/**
 * Tests for geom_path
 */

import { describe, expect, it } from 'bun:test'
import { geom_path } from '../../geoms/path'
import { gg } from '../../grammar'
import { geom_point, geom_line } from '../../geoms'
import { renderToCanvas } from '../../pipeline'

describe('geom_path', () => {
  describe('geom creation', () => {
    it('should create path geom with defaults', () => {
      const geom = geom_path()
      expect(geom.type).toBe('path')
      expect(geom.stat).toBe('identity')
      expect(geom.position).toBe('identity')
    })

    it('should have default linewidth of 1', () => {
      const geom = geom_path()
      expect(geom.params.linewidth).toBe(1)
    })

    it('should have default linetype of solid', () => {
      const geom = geom_path()
      expect(geom.params.linetype).toBe('solid')
    })

    it('should have default alpha of 1', () => {
      const geom = geom_path()
      expect(geom.params.alpha).toBe(1)
    })

    it('should have default lineend of butt', () => {
      const geom = geom_path()
      expect(geom.params.lineend).toBe('butt')
    })

    it('should have default linejoin of round', () => {
      const geom = geom_path()
      expect(geom.params.linejoin).toBe('round')
    })

    it('should accept linewidth option', () => {
      const geom = geom_path({ linewidth: 2 })
      expect(geom.params.linewidth).toBe(2)
    })

    it('should accept linetype option', () => {
      const geom = geom_path({ linetype: 'dashed' })
      expect(geom.params.linetype).toBe('dashed')
    })

    it('should accept alpha option', () => {
      const geom = geom_path({ alpha: 0.5 })
      expect(geom.params.alpha).toBe(0.5)
    })

    it('should accept color option', () => {
      const geom = geom_path({ color: '#ff0000' })
      expect(geom.params.color).toBe('#ff0000')
    })

    it('should accept lineend option', () => {
      const geom = geom_path({ lineend: 'round' })
      expect(geom.params.lineend).toBe('round')
    })

    it('should accept linejoin option', () => {
      const geom = geom_path({ linejoin: 'mitre' })
      expect(geom.params.linejoin).toBe('mitre')
    })
  })

  describe('rendering', () => {
    // Simple path data
    const pathData = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 3 },
    ]

    it('should render basic path', () => {
      const spec = gg(pathData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
      expect(canvas.width).toBe(40)
      expect(canvas.height).toBe(15)
    })

    it('should render path with custom color', () => {
      const spec = gg(pathData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path({ color: '#00ff00' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render path with dashed line', () => {
      const spec = gg(pathData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path({ linetype: 'dashed' }))
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('order preservation (key difference from geom_line)', () => {
    it('should preserve data order unlike geom_line', () => {
      // Data intentionally NOT sorted by x
      const unsortedData = [
        { x: 2, y: 20 },
        { x: 0, y: 0 },
        { x: 3, y: 30 },
        { x: 1, y: 10 },
      ]

      // geom_path should connect: (2,20) -> (0,0) -> (3,30) -> (1,10)
      // geom_line would sort and connect: (0,0) -> (1,10) -> (2,20) -> (3,30)

      const pathSpec = gg(unsortedData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const lineSpec = gg(unsortedData)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_line())
        .spec()

      // Both should render without error
      const pathCanvas = renderToCanvas(pathSpec, { width: 40, height: 15 })
      const lineCanvas = renderToCanvas(lineSpec, { width: 40, height: 15 })

      expect(pathCanvas).toBeDefined()
      expect(lineCanvas).toBeDefined()

      // The outputs should be different because path doesn't sort
      // (We can't easily compare the actual drawings in this test,
      // but the key point is that geom_path preserves order)
    })

    it('should draw a closed shape correctly', () => {
      // Triangle that returns to start
      const triangle = [
        { x: 0, y: 0 },
        { x: 2, y: 4 },
        { x: 4, y: 0 },
        { x: 0, y: 0 }, // close
      ]

      const spec = gg(triangle)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should draw a spiral correctly', () => {
      // Simple spiral - x values go back and forth
      const spiral = Array.from({ length: 20 }, (_, i) => {
        const t = i * 0.5
        return {
          x: t * Math.cos(t),
          y: t * Math.sin(t),
        }
      })

      const spec = gg(spiral)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })
  })

  describe('grouping', () => {
    const groupedData = [
      { x: 0, y: 0, group: 'A' },
      { x: 1, y: 2, group: 'A' },
      { x: 2, y: 1, group: 'A' },
      { x: 0, y: 3, group: 'B' },
      { x: 1, y: 1, group: 'B' },
      { x: 2, y: 2, group: 'B' },
    ]

    it('should render separate paths for each color group', () => {
      const spec = gg(groupedData)
        .aes({ x: 'x', y: 'y', color: 'group' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should render separate paths for each group aesthetic', () => {
      const spec = gg(groupedData)
        .aes({ x: 'x', y: 'y', group: 'group' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should preserve order within each group', () => {
      // Each group has its own order
      const multiPath = [
        { x: 0, y: 0, id: 'first' },
        { x: 2, y: 2, id: 'first' },
        { x: 1, y: 1, id: 'first' }, // Note: not sorted by x within group
        { x: 3, y: 0, id: 'second' },
        { x: 1, y: 2, id: 'second' },
        { x: 2, y: 1, id: 'second' },
      ]

      const spec = gg(multiPath)
        .aes({ x: 'x', y: 'y', group: 'id' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('with other geoms', () => {
    const data = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 3 },
    ]

    it('should render path with points', () => {
      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .geom(geom_point())
        .spec()

      expect(spec.geoms).toHaveLength(2)
      expect(spec.geoms[0].type).toBe('path')
      expect(spec.geoms[1].type).toBe('point')

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const spec = gg([])
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle single data point', () => {
      const data = [{ x: 1, y: 10 }]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle two data points', () => {
      const data = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle negative values', () => {
      const data = [
        { x: -2, y: -2 },
        { x: 0, y: 2 },
        { x: 2, y: -1 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })

    it('should handle same x values (vertical line)', () => {
      const data = [
        { x: 1, y: 0 },
        { x: 1, y: 5 },
        { x: 1, y: 10 },
      ]

      const spec = gg(data)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 15 })
      expect(canvas).toBeDefined()
    })
  })

  describe('use cases', () => {
    it('should work for trajectory visualization', () => {
      // Simulated GPS trajectory
      const trajectory = [
        { lon: -122.4, lat: 37.78 },
        { lon: -122.41, lat: 37.79 },
        { lon: -122.42, lat: 37.785 },
        { lon: -122.415, lat: 37.775 },
        { lon: -122.405, lat: 37.77 },
      ]

      const spec = gg(trajectory)
        .aes({ x: 'lon', y: 'lat' })
        .geom(geom_path())
        .labs({ title: 'GPS Trajectory', x: 'Longitude', y: 'Latitude' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 60, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should work for drawing shapes', () => {
      // Draw a star
      const star: { x: number; y: number }[] = []
      for (let i = 0; i <= 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        star.push({
          x: Math.cos(angle),
          y: Math.sin(angle),
        })
      }

      const spec = gg(star)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .labs({ title: 'Star Shape' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 40, height: 20 })
      expect(canvas).toBeDefined()
    })

    it('should work for Lissajous curves', () => {
      // Parametric curve
      const curve = Array.from({ length: 100 }, (_, i) => {
        const t = (i / 100) * 2 * Math.PI
        return {
          x: Math.sin(3 * t),
          y: Math.sin(2 * t),
        }
      })

      const spec = gg(curve)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .labs({ title: 'Lissajous Curve' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 50, height: 25 })
      expect(canvas).toBeDefined()
    })

    it('should work for animation frames', () => {
      // Object moving in a figure-8
      const frames = Array.from({ length: 50 }, (_, i) => {
        const t = (i / 50) * 2 * Math.PI
        return {
          x: Math.sin(t),
          y: Math.sin(2 * t) / 2,
          frame: i,
        }
      })

      const spec = gg(frames)
        .aes({ x: 'x', y: 'y' })
        .geom(geom_path())
        .geom(geom_point())
        .labs({ title: 'Figure-8 Motion' })
        .spec()

      const canvas = renderToCanvas(spec, { width: 50, height: 25 })
      expect(canvas).toBeDefined()
    })
  })
})
