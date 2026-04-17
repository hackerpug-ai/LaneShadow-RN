import { useEffect, useMemo, useRef, useState } from 'react'
import { getUserFacingError } from '../lib/convex-error'
import { env } from '../lib/env'
import { showErrorNotification } from '../lib/notifier-helpers'
import {
  type PlaceDetails,
  type PlacePrediction,
  parseAutocompletePredictions,
  parsePlaceDetails,
} from './use-place-autocomplete.helpers'

export { type PlaceDetails, type PlacePrediction, parseAutocompletePredictions, parsePlaceDetails }

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

const buildAutocompleteUrl = (query: string, apiKey: string) =>
  `${AUTOCOMPLETE_URL}?input=${encodeURIComponent(query)}&key=${apiKey}`

const buildDetailsUrl = (placeId: string, apiKey: string) =>
  `${DETAILS_URL}?placeid=${encodeURIComponent(
    placeId,
  )}&fields=geometry/location,name,formatted_address,place_id&key=${apiKey}`

export const usePlaceAutocomplete = (options?: { debounceMs?: number }) => {
  const apiKey =
    env.GOOGLE_PLACES_API_KEY ?? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined)

  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortController = useRef<AbortController | null>(null)
  const debounceMs = options?.debounceMs ?? 300

  useEffect(() => {
    if (!query.trim()) {
      setPredictions([])
      setError(null)
      return
    }

    if (!apiKey) {
      const message = 'Places API key not configured.'
      setError(message)
      showErrorNotification(message)
      return
    }

    const timer = setTimeout(async () => {
      abortController.current?.abort()
      const controller = new AbortController()
      abortController.current = controller
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(buildAutocompleteUrl(query.trim(), apiKey), {
          signal: controller.signal,
        })
        const json = await response.json()
        const items = parseAutocompletePredictions(json)
        setPredictions(items)
      } catch (err) {
        if (controller.signal.aborted) return
        const parsed = getUserFacingError(err)
        setError(parsed.message)
        showErrorNotification(parsed.message)
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      abortController.current?.abort()
    }
  }, [apiKey, debounceMs, query])

  const selectPlace = useMemo(
    () =>
      async (placeId: string): Promise<PlaceDetails | null> => {
        if (!apiKey) {
          const message = 'Places API key not configured.'
          setError(message)
          showErrorNotification(message)
          return null
        }

        const controller = new AbortController()
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch(buildDetailsUrl(placeId, apiKey), {
            signal: controller.signal,
          })
          const json = await response.json()
          const details = parsePlaceDetails(json)
          if (!details) {
            throw new Error('PLACE_DETAILS_UNAVAILABLE')
          }
          return details
        } catch (err) {
          if (controller.signal.aborted) return null
          const parsed = getUserFacingError(err)
          setError(parsed.message)
          showErrorNotification(parsed.message)
          return null
        } finally {
          setIsLoading(false)
        }
      },
    [apiKey],
  )

  const clear = useMemo(
    () => () => {
      setPredictions([])
      setError(null)
      setQuery('')
      abortController.current?.abort()
    },
    [],
  )

  return {
    predictions,
    isLoading,
    error,
    search: setQuery,
    selectPlace,
    clear,
  }
}
