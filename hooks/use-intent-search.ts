import NetInfo from '@react-native-community/netinfo'
import { useCallback, useState } from 'react'
import { openDiscoveryDB } from '../shared/lib/discovery/db'
import {
  bumpHitCount,
  lookupIntentCache,
  topHitIntents,
  writeIntentCache,
} from '../shared/lib/discovery/intent/cache'
import { CURRENT_SCHEMA_VERSION, normalizeIntent } from '../shared/lib/discovery/intent/normalize'
import { runParamsQuery } from '../shared/lib/discovery/intent/params-to-sql'
import type { IntentParams, IntentSearchState } from '../shared/lib/discovery/intent/types'
import { validateEnums } from '../shared/lib/discovery/intent/validate'

export interface IntentSearchParams {
  center: { lat: number; lng: number }
}

/**
 * Hook for intent-based route search.
 * Implements: normalize → cache lookup → Haiku (if online + miss) → cache write → SQL
 * Returns OFFLINE_UNSUPPORTED for cache-miss + offline.
 */
export function useIntentSearch({ center }: IntentSearchParams) {
  const [state, setState] = useState<IntentSearchState>({ status: 'idle' })

  /**
   * Search for routes matching the user's intent.
   */
  const search = useCallback(
    async (rawIntent: string) => {
      setState((prev) => ({ ...prev, status: 'searching' }))

      try {
        const db = await openDiscoveryDB()
        const normalized = normalizeIntent(rawIntent)

        // Step 1: Check cache
        const cached = await lookupIntentCache(db, normalized, CURRENT_SCHEMA_VERSION)

        if (cached) {
          // Cache hit - return immediately
          await bumpHitCount(db, normalized)
          const routes = await runParamsQuery(db, cached, center)
          setState({
            status: 'ok',
            routes,
            params: cached,
            source: 'cache',
          })
          return
        }

        // Step 2: Check online status
        const netState = await NetInfo.fetch()
        const isOnline = netState.isConnected && netState.isInternetReachable

        if (!isOnline) {
          // Offline + cache miss = unsupported
          const recentIntents = await topHitIntents(db, 6)
          setState({ status: 'offline_unsupported', recentIntents })
          return
        }

        // Step 3: Call Haiku (server-side)
        const params = await fetchHaikuParams(rawIntent, center)

        // Step 4: Validate enums (drop hallucinated values)
        const validated = validateEnums(params)

        // Step 5: Write to cache
        await writeIntentCache(db, normalized, validated, CURRENT_SCHEMA_VERSION)

        // Step 6: Run SQL query
        const routes = await runParamsQuery(db, validated, center)

        setState({
          status: 'ok',
          routes,
          params: validated,
          source: 'haiku',
        })
      } catch (_error) {
        setState({ status: 'idle' })
      }
    },
    [center],
  )

  /**
   * Clear the current search state.
   */
  const clear = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return { ...state, search, clear }
}

/**
 * Call the server-side Haiku endpoint to extract intent params.
 * This is a placeholder - will be implemented with Convex HTTP action.
 */
async function fetchHaikuParams(
  rawIntent: string,
  center: { lat: number; lng: number },
): Promise<IntentParams> {
  // TODO: Implement with Convex HTTP action
  // For now, return a basic extraction based on keywords
  const params: IntentParams = {
    keywords: [],
  }

  const lower = rawIntent.toLowerCase()

  // Detect archetypes
  const archetypes: string[] = []
  if (lower.includes('twist') || lower.includes('curvy')) {
    archetypes.push('twisties')
  }
  if (lower.includes('mountain')) {
    archetypes.push('mountain')
  }
  if (lower.includes('coast') || lower.includes('ocean') || lower.includes('beach')) {
    archetypes.push('coastal')
  }
  if (lower.includes('adventure') || lower.includes('dual sport')) {
    archetypes.push('adventure')
  }
  if (lower.includes('scenic') || lower.includes('byway')) {
    archetypes.push('scenic_byway')
  }
  if (lower.includes('desert')) {
    archetypes.push('desert')
  }

  if (archetypes.length > 0) {
    params.archetypes = archetypes
  }

  return params
}
