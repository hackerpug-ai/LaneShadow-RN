import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console methods before importing
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

import {
  recordProtomapsFailureHandler,
  recordProtomapsFallbackHandler,
  recordProtomapsQueryHandler,
} from '../monitoring'

describe('Monitoring Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordProtomapsFailure', () => {
    it('AC-1: logs R2/presigned URL failures with structured JSON format', async () => {
      const mockCtx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      }

      const args = {
        operation: 'generatePresignedUrl',
        error: 'R2 endpoint not configured',
        context: {
          hasR2Endpoint: false,
          hasR2KeyId: true,
          hasR2Secret: true,
          hasR2Bucket: true,
        },
      }

      // Call the handler directly
      await recordProtomapsFailureHandler(mockCtx as any, args)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logCall = consoleErrorSpy.mock.calls[0][0] as string
      expect(logCall).toBe('[LOG]')

      const jsonLog = consoleErrorSpy.mock.calls[0][1] as string
      const parsedLog = JSON.parse(jsonLog)
      expect(parsedLog).toMatchObject({
        level: 'error',
        category: 'protomaps.error',
        message: expect.stringContaining('Protomaps failure'),
        data: {
          operation: 'generatePresignedUrl',
          error: 'R2 endpoint not configured',
          context: {
            hasR2Endpoint: false,
            hasR2KeyId: true,
            hasR2Secret: true,
            hasR2Bucket: true,
          },
        },
      })
      expect(parsedLog.timestamp).toBeDefined()
      expect(new Date(parsedLog.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('recordProtomapsFallback', () => {
    it('AC-2: logs when tools fall back to Overpass with structured JSON format', async () => {
      const mockCtx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      }

      const args = {
        tool: 'findScenicWaypoints',
        reason: 'Protomaps tiles not available for region',
        bbox: '-122.5,37.7,-122.3,37.8',
      }

      // Call the handler directly
      await recordProtomapsFallbackHandler(mockCtx as any, args)

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const logCall = consoleWarnSpy.mock.calls[0][0] as string
      expect(logCall).toBe('[LOG]')

      const jsonLog = consoleWarnSpy.mock.calls[0][1] as string
      const parsedLog = JSON.parse(jsonLog)
      expect(parsedLog).toMatchObject({
        level: 'warn',
        category: 'protomaps.fallback',
        message: expect.stringContaining('Protomaps fallback'),
        data: {
          tool: 'findScenicWaypoints',
          reason: 'Protomaps tiles not available for region',
          bbox: '-122.5,37.7,-122.3,37.8',
        },
      })
      expect(parsedLog.timestamp).toBeDefined()
    })
  })

  describe('recordProtomapsQuery', () => {
    it('AC-3: logs query performance metrics with structured JSON format', async () => {
      const mockCtx = {
        runQuery: vi.fn(),
        runMutation: vi.fn(),
      }

      const args = {
        operation: 'queryTilesInBbox',
        durationMs: 125,
        tilesFetched: 15,
        resultCount: 42,
        bbox: '-122.5,37.7,-122.3,37.8',
      }

      // Call the handler directly
      await recordProtomapsQueryHandler(mockCtx as any, args)

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      const logCall = consoleInfoSpy.mock.calls[0][0] as string
      expect(logCall).toBe('[LOG]')

      const jsonLog = consoleInfoSpy.mock.calls[0][1] as string
      const parsedLog = JSON.parse(jsonLog)
      expect(parsedLog).toMatchObject({
        level: 'info',
        category: 'protomaps.query',
        message: expect.stringContaining('Protomaps query'),
        data: {
          operation: 'queryTilesInBbox',
          durationMs: 125,
          tilesFetched: 15,
          resultCount: 42,
          bbox: '-122.5,37.7,-122.3,37.8',
        },
      })
      expect(parsedLog.timestamp).toBeDefined()
    })
  })
})
