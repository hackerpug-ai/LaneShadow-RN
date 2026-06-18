import { useEffect, useState } from 'react'
import { getCurrentLocation } from '../lib/get-current-location'
import type { RouteStop } from '../shared/types/routes'

type CurrentLocationState = {
  location: RouteStop | null
  loading: boolean
  error: string | null
}

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    getCurrentLocation().then((location) => {
      if (cancelled) return
      setState({
        location,
        loading: false,
        error: location ? null : 'Location unavailable',
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
