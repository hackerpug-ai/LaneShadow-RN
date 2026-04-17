'use node'

import { beforeEach, describe, expect, it } from 'vitest'
import { LoopDetector } from '../loopDetector'

describe('LoopDetector', () => {
  let detector: LoopDetector

  beforeEach(() => {
    detector = new LoopDetector(3)
  })

  describe('direct repetition', () => {
    it('returns true when the same call reaches the threshold', () => {
      const call = { name: 'search', arguments: { query: 'foo' } }
      expect(detector.record(call)).toBe(false) // 1
      expect(detector.record(call)).toBe(false) // 2
      expect(detector.record(call)).toBe(true) // 3 — threshold reached
    })

    it('returns true on every subsequent call past threshold', () => {
      const call = { name: 'search', arguments: { query: 'foo' } }
      detector.record(call)
      detector.record(call)
      detector.record(call)
      expect(detector.record(call)).toBe(true) // 4th call
    })
  })

  describe('different arguments', () => {
    it('does not trigger with same tool name but different args', () => {
      expect(detector.record({ name: 'search', arguments: { query: 'foo' } })).toBe(false)
      expect(detector.record({ name: 'search', arguments: { query: 'bar' } })).toBe(false)
      expect(detector.record({ name: 'search', arguments: { query: 'baz' } })).toBe(false)
    })
  })

  describe('different tool names', () => {
    it('tracks counts independently per tool name', () => {
      const args = { id: 42 }
      detector.record({ name: 'toolA', arguments: args })
      detector.record({ name: 'toolA', arguments: args })
      detector.record({ name: 'toolB', arguments: args })
      // toolA at 2, toolB at 1 — neither at threshold
      expect(detector.getCount({ name: 'toolA', arguments: args })).toBe(2)
      expect(detector.getCount({ name: 'toolB', arguments: args })).toBe(1)
      // toolA hits threshold
      expect(detector.record({ name: 'toolA', arguments: args })).toBe(true)
      // toolB still below
      expect(detector.record({ name: 'toolB', arguments: args })).toBe(false)
    })
  })

  describe('key-order independence', () => {
    it('treats objects with same keys in different order as identical', () => {
      const call1 = { name: 'fetch', arguments: { a: 1, b: 2 } }
      const call2 = { name: 'fetch', arguments: { b: 2, a: 1 } }
      expect(detector.record(call1)).toBe(false) // 1
      expect(detector.record(call2)).toBe(false) // 2
      expect(detector.record(call1)).toBe(true) // 3 — same hash
    })

    it('handles deeply nested key reordering', () => {
      const call1 = { name: 'plan', arguments: { opts: { z: 9, y: 8 } } }
      const call2 = { name: 'plan', arguments: { opts: { y: 8, z: 9 } } }
      detector.record(call1)
      detector.record(call2)
      expect(detector.record(call1)).toBe(true)
    })
  })

  describe('getCount', () => {
    it('returns 0 for unseen calls', () => {
      expect(detector.getCount({ name: 'nope', arguments: {} })).toBe(0)
    })

    it('returns accurate count after recordings', () => {
      const call = { name: 'act', arguments: { x: 1 } }
      detector.record(call)
      detector.record(call)
      expect(detector.getCount(call)).toBe(2)
    })
  })

  describe('clear', () => {
    it('resets all counters', () => {
      const call = { name: 'loop', arguments: { n: 1 } }
      detector.record(call)
      detector.record(call)
      detector.clear()
      expect(detector.getCount(call)).toBe(0)
      // After clear, threshold is fresh
      expect(detector.record(call)).toBe(false)
    })
  })

  describe('custom threshold', () => {
    it('respects a threshold of 1', () => {
      const d = new LoopDetector(1)
      expect(d.record({ name: 'x', arguments: {} })).toBe(true)
    })

    it('respects a threshold of 5', () => {
      const d = new LoopDetector(5)
      const call = { name: 'y', arguments: {} }
      for (let i = 0; i < 4; i++) {
        expect(d.record(call)).toBe(false)
      }
      expect(d.record(call)).toBe(true)
    })
  })
})
