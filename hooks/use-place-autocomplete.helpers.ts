/**
 * Pure parsing helpers for the Google Places autocomplete API.
 *
 * Extracted from use-place-autocomplete.ts so that unit tests can import
 * them without pulling in the React-Native-only notifier / icon chain
 * (react-native-notifier -> react-native-gesture-handler, etc.) that
 * vite/rollup cannot parse in the node test environment.
 */

import type { RouteStop } from '../server/types/routes'

export type PlacePrediction = {
  placeId: string
  primaryText: string
  secondaryText: string
  description: string
}

export type PlaceDetails = RouteStop

export const parseAutocompletePredictions = (response: any): PlacePrediction[] => {
  if (!response || !Array.isArray(response.predictions)) return []

  return response.predictions
    .map((prediction: any) => {
      const structured = prediction.structured_formatting ?? {}
      return {
        placeId: prediction.place_id as string,
        primaryText: structured.main_text ?? prediction.description ?? '',
        secondaryText: structured.secondary_text ?? '',
        description: prediction.description ?? '',
      }
    })
    .filter((item: PlacePrediction) => Boolean(item.placeId))
}

export const parsePlaceDetails = (response: any): PlaceDetails | null => {
  const location = response?.result?.geometry?.location
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null
  }

  const label = response?.result?.name ?? response?.result?.formatted_address ?? ''

  return {
    lat: location.lat,
    lng: location.lng,
    label,
    placeId: response?.result?.place_id ?? undefined,
  }
}
