/**
 * S4-T3 AC-2: Lever 2 geocodes anchors with region bias, filtering off-region (>150mi)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Google Geocoding API with region bias)
 * FLOW_REF: UC-REC-02
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  geocodeAnchorsInRegion,
  isGeocodedAnchorInRegion,
} from '../actions/agent/providers/geocodingProvider'
import { destinationPointMi, isAnchorInRegion } from '../curatedGeometryGate'
import { GOOGLE_MAPS_API_KEY } from '../lib/env'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T3/evidence')

const CENTROID = { lat: 34.95, lng: -120.42 }
const MAX_REGION_MI = 150

const hasGoogleKey = Boolean(GOOGLE_MAPS_API_KEY)

describe('S4-T3 AC-2: Lever 2 geocode with region bias', () => {
  describe('CASE 1 — lever2-geocode-with-bias', () => {
    if (!hasGoogleKey) {
      it.skip('SKIP: GOOGLE_MAPS_API_KEY absent', () => {})
      return
    }

    it('TC-2: geocodes Santa Maria, CA within 150mi of centroid (34.95, -120.42)', async () => {
      const geocodedAnchors = await geocodeAnchorsInRegion(
        ['Santa Maria, CA', 'Los Olivos, CA'],
        CENTROID,
        MAX_REGION_MI,
      )

      expect(geocodedAnchors.length).toBeGreaterThanOrEqual(1)
      expect(geocodedAnchors[0].lat).not.toBeNull()
      expect(geocodedAnchors[0].lng).not.toBeNull()
      expect(geocodedAnchors[0].distanceFromCentroid).toBeLessThanOrEqual(MAX_REGION_MI)
      expect(isGeocodedAnchorInRegion(geocodedAnchors[0], CENTROID, MAX_REGION_MI)).toBe(true)

      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-2-geocode-with-bias.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            centroid: CENTROID,
            geocodedAnchors,
          },
          null,
          2,
        ),
      )
    }, 60_000)
  })

  describe('CASE 2 — lever2-geocode-off-region-filtered', () => {
    it('TC-3: off-region anchor (~300mi) is rejected by isAnchorInRegion and filtered from routing set', async () => {
      const offRegion = destinationPointMi(CENTROID, 300, 0)
      const isInRegion = isAnchorInRegion(offRegion, CENTROID)
      expect(isInRegion).toBe(false)
      expect(isGeocodedAnchorInRegion(offRegion, CENTROID, MAX_REGION_MI)).toBe(false)

      // When geocoding a far-away place name with region filter, it must not
      // appear in the surviving routing intermediates.
      if (!hasGoogleKey) {
        // Pure region filter assertion still holds without network.
        const filtered = [
          { lat: CENTROID.lat, lng: CENTROID.lng, formatted: 'in-region', distanceFromCentroid: 0 },
          {
            lat: offRegion.lat,
            lng: offRegion.lng,
            formatted: 'off-region',
            distanceFromCentroid: 300,
          },
        ].filter((a) => isGeocodedAnchorInRegion(a, CENTROID, MAX_REGION_MI))
        expect(filtered.some((a) => a.formatted === 'off-region')).toBe(false)
        return
      }

      // Geocode an East-coast city with CA-centroid bias — must be filtered out
      // of the in-region result set used for routing intermediates.
      const result = await geocodeAnchorsInRegion(
        ['Santa Maria, CA', 'Boston, MA'],
        CENTROID,
        MAX_REGION_MI,
      )

      const offRegionInResult = result.some(
        (a) =>
          a.formatted.toLowerCase().includes('boston') || a.distanceFromCentroid > MAX_REGION_MI,
      )
      expect(offRegionInResult).toBe(false)
      // In-region Santa Maria should survive
      expect(result.some((a) => a.distanceFromCentroid <= MAX_REGION_MI)).toBe(true)

      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-2-off-region-filtered.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            isAnchorInRegion: isInRegion,
            offRegionPoint: offRegion,
            routingIntermediates: result,
            offRegionPresentInRoutingIntermediates: false,
          },
          null,
          2,
        ),
      )
    }, 60_000)
  })
})
