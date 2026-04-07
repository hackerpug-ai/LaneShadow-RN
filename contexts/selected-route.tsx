import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type React from 'react'

type SelectedRouteContextValue = {
  selectedRouteId: string | null
  setSelectedRouteId: (id: string | null) => void
  /** The route plan ID currently displayed on the map. When null, shows the newest plan. */
  displayedRoutePlanId: string | null
  setDisplayedRoutePlanId: (id: string | null) => void
  /** Request the map to fit the active route. The home screen registers
   *  its fit implementation via `registerFitHandler`. */
  requestFitToRoute: () => void
  /** Register a handler that performs the actual map fit. Called by the
   *  home screen so the context can invoke it from any tab. */
  registerFitHandler: (handler: (() => void) | null) => void
}

const SelectedRouteContext = createContext<SelectedRouteContextValue>({
  selectedRouteId: null,
  setSelectedRouteId: () => {},
  displayedRoutePlanId: null,
  setDisplayedRoutePlanId: () => {},
  requestFitToRoute: () => {},
  registerFitHandler: () => {},
})

export const useSelectedRoute = () => useContext(SelectedRouteContext)

export const SelectedRouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [displayedRoutePlanId, setDisplayedRoutePlanId] = useState<string | null>(null)
  const fitHandlerRef = useRef<(() => void) | null>(null)

  const registerFitHandler = useCallback((handler: (() => void) | null) => {
    fitHandlerRef.current = handler
  }, [])

  const requestFitToRoute = useCallback(() => {
    fitHandlerRef.current?.()
  }, [])

  return (
    <SelectedRouteContext.Provider value={{ selectedRouteId, setSelectedRouteId, displayedRoutePlanId, setDisplayedRoutePlanId, requestFitToRoute, registerFitHandler }}>
      {children}
    </SelectedRouteContext.Provider>
  )
}
