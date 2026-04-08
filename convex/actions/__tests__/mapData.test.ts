import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock console methods before importing
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

import { checkFreshnessWithAlertLogic } from '../mapData';

describe('Map Data Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkFreshnessWithAlert', () => {
    it('AC-1: stale data triggers protomaps.error log', async () => {
      // Mock checkFreshness to return stale status
      const mockCheckFreshness = vi.fn().mockResolvedValue({
        status: 'stale',
        ageInDays: 45,
        message: 'PMTiles file is 45 days old. Run: npx tsx scripts/sync-protomaps-r2.ts',
      });

      // Call the logic function with mocked checkFreshness
      await checkFreshnessWithAlertLogic(mockCheckFreshness);

      // Verify error log was called
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleErrorSpy.mock.calls[0][0] as string;
      expect(logCall).toBe('[LOG]');

      const jsonLog = consoleErrorSpy.mock.calls[0][1] as string;
      const parsedLog = JSON.parse(jsonLog);
      expect(parsedLog).toMatchObject({
        level: 'error',
        category: 'protomaps.error',
        message: 'Map data is stale or missing',
        data: {
          status: 'stale',
          ageInDays: 45,
          message: expect.stringContaining('45 days old'),
        },
      });
      expect(parsedLog.timestamp).toBeDefined();
      expect(new Date(parsedLog.timestamp)).toBeInstanceOf(Date);
    });

    it('AC-2: missing data triggers protomaps.error log', async () => {
      // Mock checkFreshness to return missing status
      const mockCheckFreshness = vi.fn().mockResolvedValue({
        status: 'missing',
        message: 'No PMTiles file found on R2. Run: npx tsx scripts/sync-protomaps-r2.ts',
      });

      // Call the logic function with mocked checkFreshness
      await checkFreshnessWithAlertLogic(mockCheckFreshness);

      // Verify error log was called
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleErrorSpy.mock.calls[0][0] as string;
      expect(logCall).toBe('[LOG]');

      const jsonLog = consoleErrorSpy.mock.calls[0][1] as string;
      const parsedLog = JSON.parse(jsonLog);
      expect(parsedLog).toMatchObject({
        level: 'error',
        category: 'protomaps.error',
        message: 'Map data is stale or missing',
        data: {
          status: 'missing',
          message: expect.stringContaining('No PMTiles file found'),
        },
      });
      expect(parsedLog.timestamp).toBeDefined();
    });

    it('AC-3: fresh data logs nothing (normal operation)', async () => {
      // Mock checkFreshness to return fresh status
      const mockCheckFreshness = vi.fn().mockResolvedValue({
        status: 'fresh',
        ageInDays: 5,
        message: 'PMTiles file is 5 days old',
      });

      // Call the logic function with mocked checkFreshness
      const result = await checkFreshnessWithAlertLogic(mockCheckFreshness);

      // Verify NO error log was called
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Verify result is returned correctly
      expect(result).toMatchObject({
        status: 'fresh',
        ageInDays: 5,
      });
    });
  });
});
