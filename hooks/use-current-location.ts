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

    // Cold-open budget: the default 2s is tuned for the chat-send path
    // (guarantee an origin before the FIRST planning message). On a fresh
    // app launch the location manager takes longer than 2s to deliver a fix
    // — especially on the simulator, but also on real devices with a cold
    // GPS — so the race would time out and computeInitialCamera would fall
    // through to the continental default. Give the mount-time fetch the full
    // window the map-hold already budgets (see maxHoldElapsed, 8s cap in the
    // home screen): 7s, comfortably under that cap so a denied/unavailable
    // permission still falls back promptly (permission denial resolves null
    // immediately — only slow position acquisition uses the headroom).
    getCurrentLocation(7000).then((location) => {
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
