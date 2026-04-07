'use node'

import { withTimeout } from '../lib/reliability'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JINA_SEARCH_ENDPOINT = 'https://s.jina.ai/'
const DEFAULT_MAX_RESULTS = 5
const SNIPPET_MAX_CHARS = 200
const SEARCH_TIMEOUT_MS = 8_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebSearchHit = {
  title: string
  snippet: string
  url: string
}

type JinaResponseItem = {
  url?: string
  title?: string
  description?: string
}

type JinaResponse = {
  data?: JinaResponseItem[]
}

export type WebSearchProvider = {
  search(params: { query: string; maxResults?: number }): Promise<WebSearchHit[]>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createWebSearchProvider(): WebSearchProvider {
  const apiKey = process.env.JINA_API_KEY

  const search: WebSearchProvider['search'] = async ({ query, maxResults = DEFAULT_MAX_RESULTS }) => {
    const url = `${JINA_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    try {
      const data = await withTimeout(
        async (signal) => {
          const response = await fetch(url, { headers, signal })
          if (!response.ok) {
            console.warn(`webSearchProvider: Jina search returned HTTP ${response.status}`)
            return null
          }
          return (await response.json()) as JinaResponse
        },
        { ms: SEARCH_TIMEOUT_MS, label: 'webSearch' }
      )

      if (!data?.data) return []

      return data.data
        .slice(0, maxResults)
        .map((item) => ({
          title: item.title ?? '',
          snippet: (item.description ?? '').slice(0, SNIPPET_MAX_CHARS),
          url: item.url ?? '',
        }))
    } catch (error) {
      console.warn('webSearchProvider.search: Jina search failed', error)
      return []
    }
  }

  return { search }
}
