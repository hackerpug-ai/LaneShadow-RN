import { createContext, useCallback, useContext, useState } from 'react'
import type React from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocationSearchResult = {
  id: string
  name: string
  address: string
  types?: string[]
  location: { lat: number; lng: number }
  detourMinutes?: number
  distanceMeters?: number
}

type SearchResultsContextValue = {
  /** Current search results driving map markers */
  results: LocationSearchResult[]
  setResults: (results: LocationSearchResult[]) => void
  /** Selected result ID — synced between chat card taps and marker taps */
  selectedResultId: string | null
  setSelectedResultId: (id: string | null) => void
  clearResults: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SearchResultsContext = createContext<SearchResultsContextValue>({
  results: [],
  setResults: () => {},
  selectedResultId: null,
  setSelectedResultId: () => {},
  clearResults: () => {},
})

export const useSearchResults = () => useContext(SearchResultsContext)

export const SearchResultsProvider = ({ children }: { children: React.ReactNode }) => {
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  const clearResults = useCallback(() => {
    setResults([])
    setSelectedResultId(null)
  }, [])

  return (
    <SearchResultsContext.Provider
      value={{ results, setResults, selectedResultId, setSelectedResultId, clearResults }}
    >
      {children}
    </SearchResultsContext.Provider>
  )
}
