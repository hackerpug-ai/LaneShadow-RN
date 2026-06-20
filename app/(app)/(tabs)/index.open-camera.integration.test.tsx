/**
 * Integration tests for the computeInitialCamera function (AC-2, AC-3)
 *
 * Tests verify that:
 * - AC-2: initialCamera derives current location at a 3-5 mi zoom (zoom 11)
 * - AC-3: current location beats a stale default slot on cold open
 *
 * These tests import and call the REAL computeInitialCamera function,
 * not a re-implemented local copy. They exercise actual production code.
 *
 * @see RUX-006: Open map at current location 3-5 mile radius
 */

import { describe, it, expect } from 'vitest'
import { computeInitialCamera } from './compute-initial-camera'

describe('computeInitialCamera - RUX-006', () => {
  describe('AC-2: opensAtCurrentLocationThreeToFiveMiRadius', () => {
    it('should compute initialCamera with zoom===11 (CURRENT_LOCATION_OPEN_ZOOM) when currentLocation is available', () => {
      /**
       * GIVEN: currentLocation resolved to {lat: 37.7749, lng: -122.4194}, no session slot
       * WHEN: computeInitialCamera is called
       * THEN: zoom should be 11 (3-5 mi radius), not 14
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        defaultCameraSlot: null,
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      expect(result).toBeDefined()
      expect(result?.center).toEqual([-122.4194, 37.7749])
      expect(result?.zoom).toBe(11) // MUST be 11, not 14
    })

    it('should fail with zoom 14 (old broken behavior)', () => {
      /**
       * This test documents the RED failure — if zoom were 14,
       * the test above would fail. This test shows the broken state.
       *
       * Once the fix is applied (zoom=11), this test is reference only.
       */
      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        defaultCameraSlot: null,
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      // Zoom should NOT be 14 (old broken behavior)
      expect(result?.zoom).not.toBe(14)
    })
  })

  describe('AC-3: currentLocationBeatsStaleDefaultSlotOnColdOpen', () => {
    it('should prefer current location over default camera slot on cold open', () => {
      /**
       * GIVEN: defaultCameraSlot exists {lat: 51.5074, lng: -0.1278, zoom: 12} (stale London)
       *        currentLocation resolved {lat: 40.7128, lng: -74.006} (NYC)
       *        no active session
       * WHEN: computeInitialCamera is called
       * THEN: initialCamera should use currentLocation, not the saved default slot
       *
       * Precedence rule: current location (priority 2) beats default slot (priority 3)
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: { lat: 40.7128, lng: -74.006 }, // NYC
        defaultCameraSlot: {
          center: { latitude: 51.5074, longitude: -0.1278 }, // Stale London
          zoom: 12,
        },
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      expect(result).toBeDefined()
      // Should use current location, not stale default
      expect(result?.center).toEqual([-74.006, 40.7128]) // NYC
      expect(result?.center).not.toEqual([-0.1278, 51.5074]) // Not London
      expect(result?.zoom).toBe(11) // Uses CURRENT_LOCATION_OPEN_ZOOM
    })

    it('should use default slot when currentLocation is null but defaultCameraSlot exists', () => {
      /**
       * GIVEN: currentLocation is null (location unavailable or denied)
       *        defaultCameraSlot exists
       * WHEN: computeInitialCamera is called
       * THEN: initialCamera should fall back to defaultCameraSlot
       *
       * Precedence rule: default slot (priority 3) when no current location
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: null,
        defaultCameraSlot: {
          center: { latitude: 51.5074, longitude: -0.1278 },
          zoom: 12,
        },
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      expect(result).toBeDefined()
      expect(result?.center).toEqual([-0.1278, 51.5074])
      expect(result?.zoom).toBe(12)
    })
  })

  describe('AC-4: sessionSlotWinsPrecedence', () => {
    it('should prefer active session slot over current location and default slot', () => {
      /**
       * GIVEN: sessionSlot exists (explicit resume of a saved session)
       *        currentLocation and defaultCameraSlot also exist
       * WHEN: computeInitialCamera is called
       * THEN: sessionSlot should be used (priority 1 beats all others)
       */

      const result = computeInitialCamera({
        sessionSlot: {
          center: { latitude: 34.0522, longitude: -118.2437 }, // LA
          zoom: 13,
        },
        currentLocation: { lat: 37.7749, lng: -122.4194 }, // SF
        defaultCameraSlot: {
          center: { latitude: 51.5074, longitude: -0.1278 }, // London
          zoom: 12,
        },
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      expect(result).toBeDefined()
      expect(result?.center).toEqual([-118.2437, 34.0522]) // LA (session slot)
      expect(result?.zoom).toBe(13)
    })
  })

  describe('edge cases', () => {
    it('should return undefined when cameraStoreHydrated is false', () => {
      /**
       * GIVEN: cameraStoreHydrated is false (store not yet loaded)
       * WHEN: computeInitialCamera is called
       * THEN: should return undefined (hold the mount)
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        defaultCameraSlot: null,
        locationLoading: false,
        cameraStoreHydrated: false,
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined when locationLoading is true and no camera available', () => {
      /**
       * GIVEN: locationLoading is true
       *        no sessionSlot, no currentLocation, no defaultCameraSlot
       * WHEN: computeInitialCamera is called
       * THEN: should return undefined (wait for location to resolve)
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: null,
        defaultCameraSlot: null,
        locationLoading: true,
        cameraStoreHydrated: true,
      })

      expect(result).toBeUndefined()
    })

    it('should return DEFAULT_MAPBOX_CAMERA when location denied/unavailable and no saved camera', () => {
      /**
       * GIVEN: locationLoading is false (location permission denied/unavailable)
       *        no sessionSlot, no currentLocation, no defaultCameraSlot
       * WHEN: computeInitialCamera is called
       * THEN: should return DEFAULT_MAPBOX_CAMERA (continental fallback)
       */

      const result = computeInitialCamera({
        sessionSlot: null,
        currentLocation: null,
        defaultCameraSlot: null,
        locationLoading: false,
        cameraStoreHydrated: true,
      })

      expect(result).toBeDefined()
      expect(result?.center).toEqual([-98.5, 39.8]) // Continental default
      expect(result?.zoom).toBe(3.5)
    })
  })
})
