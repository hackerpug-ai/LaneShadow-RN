import { useState, useEffect } from 'react';
import { openDiscoveryDB } from '../lib/discovery/db';
import { fetchEnrichment, type EnrichmentData } from '../lib/discovery/fetch-enrichment';

/**
 * Hook for loading route enrichment data.
 * Cache-first: returns cached data immediately, falls back to server fetch.
 */
export function useRouteEnrichment(routeId: string) {
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadEnrichment = async () => {
      setLoading(true);
      setError(null);

      try {
        const db = await openDiscoveryDB();

        // Try cache first
        const cached = await fetchEnrichment(db, routeId);

        if (cached) {
          setEnrichment(cached);
          setLoading(false);
          return;
        }

        // Cache miss - fetch from server (if online)
        // For now, just return null (this will be implemented with Convex fetch)
        setEnrichment(null);
      } catch (err) {
        setError(err as Error);
        setEnrichment(null);
      } finally {
        setLoading(false);
      }
    };

    loadEnrichment();
  }, [routeId]);

  return { enrichment, loading, error };
}
