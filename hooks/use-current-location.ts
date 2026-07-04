import { useEffect, useState } from 'react'
import { getCurrentLocation } from '../lib/get-current-location'
import type { RouteStop } from '../shared/types/routes'

type CurrentLocationState = {
  location: RouteStop | null
  loading: boolean
  error: string | null
}

const STARTUP_LOCATION_TIMEOUT_MS = 7000
const LATE_LOCATION_RETRY_TIMEOUT_MS = 15000

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    const publish = (location: RouteStop | null) => {
      if (cancelled) return
      setState({
        location,
        loading: false,
        error: location ? null : 'Location unavailable',
      })
    }

    // Cold-open budget: the default 2s is tuned for the chat-send path
    // (guarantee an origin before the FIRST planning message). On a fresh
    // app launch the location manager can take longer to deliver a fix, so
    // give startup most of the map-hold window, then keep one late retry alive.
    getCurrentLocation(STARTUP_LOCATION_TIMEOUT_MS).then((location) => {
      publish(location)
      if (location || cancelled) return
      getCurrentLocation(LATE_LOCATION_RETRY_TIMEOUT_MS).then((lateLocation) => {
        if (lateLocation) publish(lateLocation)
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
