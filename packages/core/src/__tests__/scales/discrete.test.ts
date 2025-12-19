/**
 * Tests for discrete scales and ordering
 */

import { describe, expect, it } from 'bun:test'
import {
  scale_x_discrete,
  scale_y_discrete,
} from '../../scales/discrete'
import {
  inferDiscreteDomain,
} from '../../pipeline/scales'

describe('scale_x_discrete', () => {
  it('should create a discrete x scale', () => {
    const scale = scale_x_discrete()
    expect(scale.type).toBe('discrete')
    expect(scale.aesthetic).toBe('x')
  })

  it('should map values to positions in order of appearance', () => {
    const scale = scale_x_discrete()
    expect(scale.map('apple')).toBe(0)
    expect(scale.map('banana')).toBe(1)
    expect(scale.map('cherry')).toBe(2)
    // Repeated value should return same position
    expect(scale.map('apple')).toBe(0)
  })

  it('should respect explicit limits order', () => {
    const scale = scale_x_discrete({ limits: ['cherry', 'apple', 'banana'] })
    expect(scale.map('cherry')).toBe(0)
    expect(scale.map('apple')).toBe(1)
    expect(scale.map('banana')).toBe(2)
    // Value not in limits returns -1
    expect(scale.map('date')).toBe(-1)
  })

  it('should reverse limits when reverse is true', () => {
    const scale = scale_x_discrete({ limits: ['a', 'b', 'c'], reverse: true })
    expect(scale.map('c')).toBe(0)
    expect(scale.map('b')).toBe(1)
    expect(scale.map('a')).toBe(2)
  })

  it('should exclude specified categories', () => {
    const scale = scale_x_discrete({ limits: ['a', 'b', 'c', 'd'], exclude: ['b', 'd'] })
    expect(scale.map('a')).toBe(0)
    expect(scale.map('b')).toBe(-1)
    expect(scale.map('c')).toBe(1)
    expect(scale.map('d')).toBe(-1)
  })

  it('should invert position to value with limits', () => {
    const scale = scale_x_discrete({ limits: ['x', 'y', 'z'] })
    expect(scale.invert!(0)).toBe('x')
    expect(scale.invert!(1)).toBe('y')
    expect(scale.invert!(2)).toBe('z')
  })

  it('should invert position to value without limits', () => {
    const scale = scale_x_discrete()
    scale.map('first')
    scale.map('second')
    scale.map('third')
    expect(scale.invert!(0)).toBe('first')
    expect(scale.invert!(1)).toBe('second')
    expect(scale.invert!(2)).toBe('third')
  })

  it('should store labels', () => {
    const scale = scale_x_discrete({
      limits: ['a', 'b', 'c'],
      labels: ['Alpha', 'Beta', 'Gamma']
    })
    expect((scale as any).labels).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('should store order options for pipeline', () => {
    const scale = scale_x_discrete({
      order: 'frequency',
      reverse: true,
      exclude: ['test']
    })
    expect((scale as any).orderOptions).toEqual({
      order: 'frequency',
      reverse: true,
      exclude: ['test']
    })
  })
})

describe('scale_y_discrete', () => {
  it('should create a discrete y scale', () => {
    const scale = scale_y_discrete()
    expect(scale.type).toBe('discrete')
    expect(scale.aesthetic).toBe('y')
  })

  it('should map values same as x scale', () => {
    const scale = scale_y_discrete({ limits: ['top', 'middle', 'bottom'] })
    expect(scale.map('top')).toBe(0)
    expect(scale.map('middle')).toBe(1)
    expect(scale.map('bottom')).toBe(2)
  })
})

describe('inferDiscreteDomain', () => {
  const testData = [
    { category: 'banana', value: 10 },
    { category: 'apple', value: 20 },
    { category: 'cherry', value: 15 },
    { category: 'apple', value: 25 },
    { category: 'banana', value: 30 },
    { category: 'apple', value: 5 },
    { category: 'date', value: 40 },
  ]

  it('should extract unique values alphabetically by default', () => {
    const domain = inferDiscreteDomain(testData, 'category')
    expect(domain).toEqual(['apple', 'banana', 'cherry', 'date'])
  })

  it('should order by first appearance with order="data"', () => {
    const domain = inferDiscreteDomain(testData, 'category', { order: 'data' })
    expect(domain).toEqual(['banana', 'apple', 'cherry', 'date'])
  })

  it('should order by frequency with order="frequency"', () => {
    const domain = inferDiscreteDomain(testData, 'category', { order: 'frequency' })
    // apple appears 3 times, banana 2 times, cherry 1 time, date 1 time
    expect(domain).toEqual(['apple', 'banana', 'cherry', 'date'])
  })

  it('should order reverse alphabetically with order="reverse"', () => {
    const domain = inferDiscreteDomain(testData, 'category', { order: 'reverse' })
    expect(domain).toEqual(['date', 'cherry', 'banana', 'apple'])
  })

  it('should respect explicit limits', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      limits: ['cherry', 'apple', 'banana', 'date']
    })
    expect(domain).toEqual(['cherry', 'apple', 'banana', 'date'])
  })

  it('should drop unused limits by default', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      limits: ['apple', 'fig', 'cherry', 'grape']
    })
    // 'fig' and 'grape' are not in data, so they are dropped
    expect(domain).toEqual(['apple', 'cherry'])
  })

  it('should keep unused limits when drop=false', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      limits: ['apple', 'fig', 'cherry', 'grape'],
      drop: false
    })
    expect(domain).toEqual(['apple', 'fig', 'cherry', 'grape'])
  })

  it('should reverse the final order when reverse=true', () => {
    const domain = inferDiscreteDomain(testData, 'category', { reverse: true })
    expect(domain).toEqual(['date', 'cherry', 'banana', 'apple'])
  })

  it('should reverse limits when reverse=true', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      limits: ['a', 'b', 'c', 'd'],
      drop: false,
      reverse: true
    })
    expect(domain).toEqual(['d', 'c', 'b', 'a'])
  })

  it('should exclude specified categories', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      exclude: ['apple', 'date']
    })
    expect(domain).toEqual(['banana', 'cherry'])
  })

  it('should apply exclude after limits', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      limits: ['apple', 'banana', 'cherry', 'date'],
      exclude: ['banana']
    })
    expect(domain).toEqual(['apple', 'cherry', 'date'])
  })

  it('should apply reverse after exclude', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      exclude: ['banana', 'date'],
      reverse: true
    })
    expect(domain).toEqual(['cherry', 'apple'])
  })

  it('should handle combination of order, exclude, and reverse', () => {
    const domain = inferDiscreteDomain(testData, 'category', {
      order: 'frequency',
      exclude: ['cherry'],
      reverse: true
    })
    // frequency order: apple(3), banana(2), date(1)
    // exclude cherry
    // reverse: date, banana, apple
    expect(domain).toEqual(['date', 'banana', 'apple'])
  })

  it('should handle empty data', () => {
    const domain = inferDiscreteDomain([], 'category')
    expect(domain).toEqual([])
  })

  it('should handle null and undefined values', () => {
    const dataWithNulls = [
      { category: 'a' },
      { category: null },
      { category: 'b' },
      { category: undefined },
      { category: 'c' },
    ]
    const domain = inferDiscreteDomain(dataWithNulls, 'category')
    expect(domain).toEqual(['a', 'b', 'c'])
  })

  it('should convert non-string values to strings', () => {
    const dataWithNumbers = [
      { category: 1 },
      { category: 2 },
      { category: 3 },
    ]
    const domain = inferDiscreteDomain(dataWithNumbers, 'category')
    expect(domain).toEqual(['1', '2', '3'])
  })
})

describe('discrete scale with ordering integration', () => {
  it('should support all options together', () => {
    const scale = scale_x_discrete({
      limits: ['z', 'y', 'x', 'w'],
      labels: ['Zulu', 'Yankee', 'X-ray', 'Whiskey'],
      exclude: ['y'],
      reverse: true,
    })

    // After reverse: w, x, z (y is excluded)
    expect(scale.map('w')).toBe(0)
    expect(scale.map('x')).toBe(1)
    expect(scale.map('z')).toBe(2)
    expect(scale.map('y')).toBe(-1)  // excluded
  })
})
