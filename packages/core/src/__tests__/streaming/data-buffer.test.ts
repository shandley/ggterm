/**
 * Tests for DataBuffer - circular buffer for streaming data
 */

import { describe, expect, it } from 'bun:test'
import { DataBuffer, createDataBuffer } from '../../streaming/data-buffer'

describe('createDataBuffer', () => {
  it('should create a DataBuffer instance', () => {
    const buffer = createDataBuffer({ maxSize: 100 })
    expect(buffer).toBeInstanceOf(DataBuffer)
  })
})

describe('DataBuffer', () => {
  describe('constructor', () => {
    it('should create buffer with specified capacity', () => {
      const buffer = new DataBuffer({ maxSize: 50 })
      expect(buffer.capacity).toBe(50)
    })

    it('should start empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.size).toBe(0)
      expect(buffer.isEmpty).toBe(true)
    })
  })

  describe('push', () => {
    it('should add records to buffer', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      expect(buffer.size).toBe(1)
      expect(buffer.isEmpty).toBe(false)
    })

    it('should maintain order', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      expect(buffer.get(0)).toEqual({ x: 1 })
      expect(buffer.get(1)).toEqual({ x: 2 })
      expect(buffer.get(2)).toEqual({ x: 3 })
    })

    it('should overwrite oldest when full (default)', () => {
      const buffer = new DataBuffer({ maxSize: 3 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })
      buffer.push({ x: 4 })

      expect(buffer.size).toBe(3)
      expect(buffer.get(0)).toEqual({ x: 2 }) // 1 was overwritten
      expect(buffer.get(2)).toEqual({ x: 4 })
    })

    it('should reject new records when full with overwrite=false', () => {
      const buffer = new DataBuffer({ maxSize: 3, overwrite: false })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })
      const result = buffer.push({ x: 4 })

      expect(result).toBe(false)
      expect(buffer.size).toBe(3)
      expect(buffer.get(0)).toEqual({ x: 1 })
    })

    it('should return true on successful push', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      const result = buffer.push({ x: 1 })
      expect(result).toBe(true)
    })
  })

  describe('pushMany', () => {
    it('should add multiple records', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      const added = buffer.pushMany([{ x: 1 }, { x: 2 }, { x: 3 }])

      expect(added).toBe(3)
      expect(buffer.size).toBe(3)
    })

    it('should return count of successfully added records', () => {
      const buffer = new DataBuffer({ maxSize: 2, overwrite: false })
      const added = buffer.pushMany([{ x: 1 }, { x: 2 }, { x: 3 }])

      expect(added).toBe(2)
      expect(buffer.size).toBe(2)
    })
  })

  describe('shift', () => {
    it('should remove and return oldest record', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })

      const oldest = buffer.shift()
      expect(oldest).toEqual({ x: 1 })
      expect(buffer.size).toBe(1)
    })

    it('should return undefined when empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.shift()).toBeUndefined()
    })
  })

  describe('get', () => {
    it('should get record at index', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })

      expect(buffer.get(0)).toEqual({ x: 1 })
      expect(buffer.get(1)).toEqual({ x: 2 })
    })

    it('should return undefined for invalid index', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })

      expect(buffer.get(-1)).toBeUndefined()
      expect(buffer.get(1)).toBeUndefined()
      expect(buffer.get(100)).toBeUndefined()
    })
  })

  describe('latest', () => {
    it('should return most recent record', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      expect(buffer.latest()).toEqual({ x: 3 })
    })

    it('should return undefined when empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.latest()).toBeUndefined()
    })
  })

  describe('oldest', () => {
    it('should return oldest record', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })

      expect(buffer.oldest()).toEqual({ x: 1 })
    })

    it('should return undefined when empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.oldest()).toBeUndefined()
    })
  })

  describe('toArray', () => {
    it('should return all records in order', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      expect(buffer.toArray()).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }])
    })

    it('should return empty array when empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.toArray()).toEqual([])
    })

    it('should handle wrapped buffer correctly', () => {
      const buffer = new DataBuffer({ maxSize: 3 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })
      buffer.push({ x: 4 }) // Overwrites 1
      buffer.push({ x: 5 }) // Overwrites 2

      expect(buffer.toArray()).toEqual([{ x: 3 }, { x: 4 }, { x: 5 }])
    })
  })

  describe('getLast', () => {
    it('should return last N records', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })
      buffer.push({ x: 4 })

      expect(buffer.getLast(2)).toEqual([{ x: 3 }, { x: 4 }])
    })

    it('should return all if N > size', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })

      expect(buffer.getLast(10)).toEqual([{ x: 1 }, { x: 2 }])
    })
  })

  describe('getTimeRange', () => {
    it('should filter records by time range', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ time: 100 })
      buffer.push({ time: 200 })
      buffer.push({ time: 300 })
      buffer.push({ time: 400 })

      const result = buffer.getTimeRange(150, 350)
      expect(result).toEqual([{ time: 200 }, { time: 300 }])
    })

    it('should use custom time field', () => {
      const buffer = new DataBuffer({ maxSize: 10, timeField: 'timestamp' })
      buffer.push({ timestamp: 100 })
      buffer.push({ timestamp: 200 })
      buffer.push({ timestamp: 300 })

      const result = buffer.getTimeRange(150, 250)
      expect(result).toEqual([{ timestamp: 200 }])
    })
  })

  describe('clear', () => {
    it('should remove all records', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.clear()

      expect(buffer.size).toBe(0)
      expect(buffer.isEmpty).toBe(true)
    })
  })

  describe('isFull', () => {
    it('should return true when at capacity', () => {
      const buffer = new DataBuffer({ maxSize: 2 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })

      expect(buffer.isFull).toBe(true)
    })

    it('should return false when not at capacity', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })

      expect(buffer.isFull).toBe(false)
    })
  })

  describe('getTimeExtent', () => {
    it('should return min and max time', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ time: 100 })
      buffer.push({ time: 500 })
      buffer.push({ time: 200 })

      const extent = buffer.getTimeExtent()
      expect(extent).toEqual({ min: 100, max: 500 })
    })

    it('should return null when empty', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      expect(buffer.getTimeExtent()).toBeNull()
    })
  })

  describe('iterator', () => {
    it('should iterate over all records', () => {
      const buffer = new DataBuffer({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      const items: { x: number }[] = []
      for (const item of buffer) {
        items.push(item as { x: number })
      }

      expect(items).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }])
    })
  })

  describe('map', () => {
    it('should map over all records', () => {
      const buffer = new DataBuffer<{ x: number }>({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      const result = buffer.map((r) => r.x * 2)
      expect(result).toEqual([2, 4, 6])
    })
  })

  describe('filter', () => {
    it('should filter records', () => {
      const buffer = new DataBuffer<{ x: number }>({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })
      buffer.push({ x: 4 })

      const result = buffer.filter((r) => r.x % 2 === 0)
      expect(result).toEqual([{ x: 2 }, { x: 4 }])
    })
  })

  describe('reduce', () => {
    it('should reduce records', () => {
      const buffer = new DataBuffer<{ x: number }>({ maxSize: 10 })
      buffer.push({ x: 1 })
      buffer.push({ x: 2 })
      buffer.push({ x: 3 })

      const sum = buffer.reduce((acc, r) => acc + r.x, 0)
      expect(sum).toBe(6)
    })
  })
})
