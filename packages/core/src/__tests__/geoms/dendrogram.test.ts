/**
 * Tests for geom_dendrogram
 */

import { describe, expect, it } from 'bun:test'
import { gg } from '../../grammar'
import { geom_dendrogram } from '../../geoms/dendrogram'
import { renderToCanvas } from '../../pipeline'

describe('geom_dendrogram', () => {
  it('should create dendrogram geom', () => {
    const geom = geom_dendrogram()
    expect(geom.type).toBe('dendrogram')
    expect(geom.stat).toBe('identity')
  })

  it('should accept orientation option', () => {
    const geom = geom_dendrogram({ orientation: 'horizontal' })
    expect(geom.params?.orientation).toBe('horizontal')
  })

  it('should accept labels option', () => {
    const geom = geom_dendrogram({ labels: ['A', 'B', 'C'] })
    expect(geom.params?.labels).toEqual(['A', 'B', 'C'])
  })

  it('should accept show_labels option', () => {
    const geom = geom_dendrogram({ show_labels: false })
    expect(geom.params?.show_labels).toBe(false)
  })

  it('should accept hang option', () => {
    const geom = geom_dendrogram({ hang: true })
    expect(geom.params?.hang).toBe(true)
  })

  it('should accept k option for clusters', () => {
    const geom = geom_dendrogram({ k: 3 })
    expect(geom.params?.k).toBe(3)
  })

  it('should render dendrogram with linkage matrix data', () => {
    // Simulating scipy-like linkage matrix output
    // 4 original observations (0,1,2,3), 3 merges
    const linkage = [
      { merge1: 0, merge2: 1, height: 0.5, size: 2 },  // Merge 0 and 1 into cluster 4
      { merge1: 2, merge2: 3, height: 0.8, size: 2 },  // Merge 2 and 3 into cluster 5
      { merge1: 4, merge2: 5, height: 1.5, size: 4 },  // Merge clusters 4 and 5 into 6
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ labels: ['A', 'B', 'C', 'D'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should render dendrogram with parent-child data', () => {
    const tree = [
      { id: 'root', parent: null, height: 3 },
      { id: 'node1', parent: 'root', height: 2 },
      { id: 'node2', parent: 'root', height: 1.5 },
      { id: 'A', parent: 'node1', height: 0 },
      { id: 'B', parent: 'node1', height: 0 },
      { id: 'C', parent: 'node2', height: 0 },
      { id: 'D', parent: 'node2', height: 0 },
    ]

    const spec = gg(tree)
      .aes({ x: 'id', y: 'height' })
      .geom(geom_dendrogram())
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should render horizontal dendrogram', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 1.0 },
      { merge1: 2, merge2: 3, height: 1.2 },
      { merge1: 4, merge2: 5, height: 2.0 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ orientation: 'horizontal', labels: ['A', 'B', 'C', 'D'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should render dendrogram with hanging leaves', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 0.5 },
      { merge1: 2, merge2: 3, height: 1.5 },
      { merge1: 4, merge2: 5, height: 2.5 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ hang: true, labels: ['A', 'B', 'C', 'D'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })

  it('should render dendrogram without labels', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 1.0 },
      { merge1: 2, merge2: 4, height: 2.0 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ show_labels: false }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })
})

describe('dendrogram with larger trees', () => {
  it('should handle 8 leaves', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 0.3 },
      { merge1: 2, merge2: 3, height: 0.4 },
      { merge1: 4, merge2: 5, height: 0.5 },
      { merge1: 6, merge2: 7, height: 0.6 },
      { merge1: 8, merge2: 9, height: 1.0 },
      { merge1: 10, merge2: 11, height: 1.2 },
      { merge1: 12, merge2: 13, height: 2.0 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 60, height: 30 })
    expect(canvas).toBeDefined()
  })

  it('should handle unbalanced tree', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 0.5 },
      { merge1: 2, merge2: 4, height: 1.0 },
      { merge1: 3, merge2: 5, height: 2.0 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ labels: ['A', 'B', 'C', 'D'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 50, height: 25 })
    expect(canvas).toBeDefined()
  })
})

describe('dendrogram edge cases', () => {
  it('should handle empty data', () => {
    const spec = gg([])
      .geom(geom_dendrogram())
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle single leaf', () => {
    const tree = [
      { id: 'root', parent: null, height: 0 },
    ]

    const spec = gg(tree)
      .geom(geom_dendrogram())
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle two leaves', () => {
    const linkage = [
      { merge1: 0, merge2: 1, height: 1.0 },
    ]

    const spec = gg(linkage)
      .geom(geom_dendrogram({ labels: ['A', 'B'] }))
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })

  it('should handle parent-child with missing parent', () => {
    // Incomplete tree - should still render what it can
    const tree = [
      { id: 'A', parent: 'root', height: 0 },
      { id: 'B', parent: 'root', height: 0 },
    ]

    const spec = gg(tree)
      .geom(geom_dendrogram())
      .spec()

    const canvas = renderToCanvas(spec, { width: 40, height: 20 })
    expect(canvas).toBeDefined()
  })
})
