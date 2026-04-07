'use node'

import { traceableToolAsync } from '../lib/tracing'
import { createWebSearchProvider } from '../providers/webSearchProvider'
import type { WebSearchHit } from '../providers/webSearchProvider'

// ---------------------------------------------------------------------------
// Re-export WebSearchHit for external consumers
// ---------------------------------------------------------------------------

export type { WebSearchHit }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebSearchError = {
  status: 'error'
  reason: string
}

export type WebSearchResult = WebSearchHit[] | WebSearchError

type WebSearchParams = {
  query: string
  maxResults?: number | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RESULTS = 3

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const webSearchImpl = async (params: WebSearchParams): Promise<WebSearchHit[]> => {
  const maxResults = params.maxResults ?? DEFAULT_MAX_RESULTS

  try {
    const provider = createWebSearchProvider()
    const results = await provider.search({ query: params.query, maxResults })
    return results
  } catch (error) {
    console.warn('webSearch: provider call failed', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const webSearch = traceableToolAsync(webSearchImpl, {
  name: 'webSearch',
  runType: 'tool',
  tags: ['search', 'web', 'webSearch'],
})
