import { useState, useEffect } from 'react';
import type { Spot } from '../lib/discovery/intent/types';
import { openDiscoveryDB } from '../lib/discovery/db';
import { queryByBoundingBox } from '../lib/discovery/query';

export interface RouteDiscoveryParams {
  lat: number;
  lng: number;
  radiusDeg?: number;
  archetype?: string;
  sortBy?: 'best' | 'nearest';
}

/**
 * Hook for discovering nearby routes.
 * Returns routes sorted by composite_score (best) or distance (nearest).
 */
export function useRouteDiscovery({
  lat,
  lng,
  radiusDeg = 0.5,
  archetype,
  sortBy = 'best',
}: RouteDiscoveryParams) {
  const [routes, setRoutes] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      try {
        const db = await openDiscoveryDB();

        // Calculate bounding box from center + radius
        const minLat = lat - radiusDeg;
        const maxLat = lat + radiusDeg;
        const minLon = lng - radiusDeg;
        const maxLon = lng + radiusDeg;

        let results = await queryByBoundingBox(db, minLat, maxLat, minLon, maxLon);

        // Filter by archetype if specified
        if (archetype) {
          results = results.filter(r => r.archetype === archetype);
        }

        // Sort by nearest if requested
        if (sortBy === 'nearest') {
          results.sort((a, b) => {
            const distA = haversine(lat, lng, a.latitude, a.longitude);
            const distB = haversine(lat, lng, b.latitude, b.longitude);
            return distA - distB;
          });
        }

        setRoutes(results);
      } catch (error) {
        console.error('Error loading routes:', error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, [lat, lng, radiusDeg, archetype, sortBy]);

  return { routes, loading };
}

/**
 * Calculate Haversine distance between two points in miles.
 */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
